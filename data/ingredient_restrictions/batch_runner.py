# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Bundle pending ingredient/restriction pairs; retain legacy submissions and raw receipts."""
import fcntl
import hashlib
import json
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait

from . import run_workflow as workflow


def pair(row):
    return row['ingredient_key'], row['restriction_id']


def validate_bundle(bundle, answer, tasks_by_pair):
    if not isinstance(answer, dict) or answer.get('task_id') != bundle['task_id']:
        raise ValueError('wrong task_id')
    rows = answer.get('rows')
    if not isinstance(rows, list):
        raise ValueError('rows must be a list')
    expected = {(i['ingredient_key'], rid) for i in bundle['ingredients']
                for rid in i['restriction_ids']}
    normalized, seen = [], set()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError('row must be an object')
        key = pair(row)
        if key not in expected or key in seen:
            raise ValueError('unexpected or duplicate ingredient/restriction pair')
        seen.add(key)
        task = tasks_by_pair[key]
        single = dict(task, ingredients=[i for i in task['ingredients'] if i['ingredient_key'] == key[0]])
        answer_one = workflow.derive_status(single, {'task_id': task['task_id'], 'rows': [row]})
        workflow.validate(single, answer_one)
        normalized.extend(answer_one['rows'])
    if seen != expected:
        raise ValueError('missing ingredient/restriction pairs')
    return {'task_id': bundle['task_id'], 'rows': normalized}


def load_progress(folder, agent, model, tasks, fingerprint):
    completed = {}
    mapping = {pair({'ingredient_key': i['ingredient_key'], 'restriction_id': t['restriction_id']}): t
               for t in tasks for i in t['ingredients']}
    for task in tasks:
        output = folder / 'submissions' / agent / (task['task_id'] + '.json')
        if output.exists():
            saved = workflow.read(output)
            if saved['model'] != model:
                raise ValueError('model changed; use a new run')
            workflow.validate(task, saved['answer'])
            completed.update({pair(r): r for r in saved['answer']['rows']})
    for path in sorted((folder / 'bundles' / agent).glob('*.json')):
        saved = workflow.read(path)
        if saved['model'] != model or saved['manifest_sha256'] != fingerprint:
            raise ValueError('model changed or bundle belongs to another run')
        answer = validate_bundle(saved['task'], saved['raw_answer'], mapping)
        for row in answer['rows']:
            key = pair(row)
            if key in completed and completed[key] != row:
                raise ValueError('conflicting saved pair')
            completed[key] = row
    return completed, mapping


def plan(tasks, completed, batch_size):
    pending = {}
    for task in tasks:
        for item in task['ingredients']:
            if (item['ingredient_key'], task['restriction_id']) in completed:
                continue
            entry = pending.setdefault(item['ingredient_key'], dict(item, restriction_ids=[]))
            entry['restriction_ids'].append(task['restriction_id'])
    items = list(pending.values())
    bundles = []
    for start in range(0, len(items), batch_size):
        batch = items[start:start + batch_size]
        digest = hashlib.sha256(json.dumps(batch, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:20]
        bundles.append({'task_id': 'bundle-' + digest, 'ingredients': batch,
                        'portion_rules': {rid: {'nutrient': field, 'contribution_threshold': threshold}
                                          for rid, (field, threshold) in workflow.NUMERIC.items()}})
    return bundles


def materialize(folder, agent, model, tasks, completed):
    for task in tasks:
        output = folder / 'submissions' / agent / (task['task_id'] + '.json')
        keys = [(i['ingredient_key'], task['restriction_id']) for i in task['ingredients']]
        if output.exists() or not all(k in completed for k in keys):
            continue
        answer = {'task_id': task['task_id'], 'rows': [completed[k] for k in keys]}
        workflow.validate(task, answer)
        workflow.write(output, {'model': model, 'agent_pass': agent, 'answer': answer,
                                'raw_answer_location': 'bundles/' + agent})


def request_bundle(folder, agent, model, bundle, mapping, fingerprint, key):
    # Original snapshot is preserved. Only request layout changes, never food policy.
    prompt = (folder / 'prompt.md').read_text() + '\nPOLICY:\n' + (folder / 'policy.md').read_text()
    prompt += '''
BATCH FORMAT OVERRIDE (layout only; all policy rules above still apply):
This task covers multiple restrictions. For EACH ingredient return EACH restriction_id
listed in that ingredient's restriction_ids exactly once. Do not return completed pairs
or gluten-casein-free. Use TASK.portion_rules[restriction_id] for numeric rules.
Return {"task_id": TASK.task_id, "rows": [...]}.
Each row has EXACT keys: ingredient_key, restriction_id, relation, review_status,
reason, evidence_ids. ONLY low-fructose, low-sodium, ketogenic rows also require
nutrition_estimate with EXACT keys context, amount_g, per_100g, amount_reason,
composition_reason. Evidence IDs must come from that ingredient. Give concise reasons.
'''
    if all(t.get('assessment_mode') == 'NAME_BASED' for t in mapping.values()):
        prompt += "\nNAME_BASED mode: all restrictions use the six standard row fields only. " \
                  "Never include nutrition_estimate, amounts or nutrient concentrations. " \
                  "Ignore portion_rules. Apply the name-based qualitative policy; " \
                  "use relation null when quantity or composition is needed. Status is DECIDED or UNRESOLVED."
    prompt += '\nTASK:\n' + json.dumps(bundle, ensure_ascii=False)
    for attempt in range(5):
        raw = None
        try:
            raw = workflow.generate(prompt, model, key)
            answer = validate_bundle(bundle, raw, mapping)
        except (ValueError, TypeError, KeyError) as error:
            workflow.write(folder / 'invalid' / agent / f"{bundle['task_id']}-{attempt + 1}.json",
                           {'error': str(error), 'answer': raw})
            if attempt == 4:
                raise ValueError('invalid bundle response after retries') from error
            prompt += '\nRegenerate complete JSON. Validation error: ' + str(error)
            continue
        # Save before returning: even a neighbouring request failure cannot lose this result.
        workflow.write(folder / 'bundles' / agent / (bundle['task_id'] + '.json'),
                       {'model': model, 'agent_pass': agent, 'manifest_sha256': fingerprint,
                        'task': bundle, 'raw_answer': raw})
        return answer


def run_batched(folder, passes, model, batch_size, workers, dry_run):
    if not 1 <= batch_size <= 40 or not 1 <= workers <= 8:
        raise ValueError('batch-size must be 1..40; workers must be 1..8')
    if len(passes) != len(set(passes)):
        raise ValueError('duplicate passes')
    with (folder / '.run.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise ValueError('another runner is using this folder') from None
        manifest = workflow.check_run(folder)
        fingerprint = workflow.sha(folder / 'manifest.json')
        tasks = [workflow.read(folder / 'tasks' / (tid + '.json')) for tid in manifest['tasks']]
        states = {}
        for agent in passes:
            completed, mapping = load_progress(folder, agent, model, tasks, fingerprint)
            states[agent] = (completed, mapping, plan(tasks, completed, batch_size))
        summary = {agent: {'saved_pairs': len(state[0]), 'remaining_requests': len(state[2])}
                   for agent, state in states.items()}
        if dry_run:
            return summary
        for agent, (completed, mapping, bundles) in states.items():
            materialize(folder, agent, model, tasks, completed)
            if not bundles:
                continue
            key = workflow.load_api_key()
            iterator = iter(bundles)
            with ThreadPoolExecutor(max_workers=workers) as executor:
                active = set()
                def submit():
                    bundle = next(iterator, None)
                    if bundle is not None:
                        active.add(executor.submit(request_bundle, folder, agent, model, bundle,
                                                   mapping, fingerprint, key))
                for _ in range(workers):
                    submit()
                while active:
                    done, active = wait(active, return_when=FIRST_COMPLETED)
                    # Resolve all completed futures before scheduling new work on success.
                    answers = [future.result() for future in done]
                    for answer in answers:
                        completed.update({pair(r): r for r in answer['rows']})
                        materialize(folder, agent, model, tasks, completed)
                        print(json.dumps({'pass': agent, 'bundle': answer['task_id'],
                                          'saved_pairs': len(completed)}), flush=True)
                    for _ in answers:
                        submit()
        return summary
