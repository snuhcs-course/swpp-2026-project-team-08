# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 큰 비교군의 공통 이름 목록과 원본별 분할 응답

"""한 에이전트의 공통 이름 목록으로 나뉜 요청 사이에서도 재료를 합친다."""

import json
from collections import defaultdict

from .runner import digest, write_json

CHUNK_SIZE = 40


def run(agent, task, components, call_agent, work_dir):
    from .families import prompt
    from .selection import clean_name, is_english_name, name_key, validate_groups

    result = {"components": []}
    for component in components:
        cid = component["component_id"]
        sources = component["sources"]
        key = f"{task.split('/')[1]}-c{cid}"
        roster_schema = {
            "type": "object",
            "properties": {"names": {"type": "array", "items": {"type": "string"}}},
            "required": ["names"],
            "additionalProperties": False,
        }

        def validate_roster(payload):
            if not isinstance(payload, dict) or set(payload) != {"names"}:
                raise ValueError("name roster requires names")
            names = payload["names"]
            if (
                not isinstance(names, list)
                or not names
                or any(not is_english_name(n) for n in names)
            ):
                raise ValueError("roster requires English ingredient names")
            if len({name_key(n) for n in names}) != len(names):
                raise ValueError("roster names must be unique")

        context = prompt([component]).split("Return components with component_id,")[0]
        roster_prompt = (
            context
            + """
For this request return ONLY a names array: a complete, concise roster of canonical ingredient
names needed to classify ALL sources below. Each distinct ingredient appears once. Merge
synonyms and allowed product/cooking variants. Do not list source IDs or groups yet.
Subsequent requests will assign every source to this same roster, including across batches.
SOURCES_JSON:
"""
            + json.dumps(sources, ensure_ascii=False)
        )
        roster = call_agent(
            agent, f"grouping_large/{key}-names", roster_prompt, roster_schema, validate_roster
        )
        validate_roster(roster)
        names = [clean_name(n) for n in roster["names"]]
        grouped, held = defaultdict(list), []
        reasons = defaultdict(list)
        assignments = []
        for start in range(0, len(sources), CHUNK_SIZE):
            chunk = sources[start : start + CHUNK_SIZE]
            ids = {str(row["source_id"]) for row in chunk}
            value_schema = {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["name", "reason"],
                "additionalProperties": False,
            }
            schema = {
                "type": "object",
                "properties": {sid: value_schema for sid in sorted(ids)},
                "required": sorted(ids),
                "additionalProperties": False,
            }

            def validate(payload, ids=ids, names=names):
                if not isinstance(payload, dict) or set(payload) != ids:
                    raise ValueError("assignments must cover every requested source ID exactly")
                for row in payload.values():
                    if not isinstance(row, dict) or set(row) != {"name", "reason"}:
                        raise ValueError("assignment requires name and reason")
                    if (
                        row["name"] not in ["", *names]
                        or not isinstance(row["reason"], str)
                        or not row["reason"].strip()
                    ):
                        raise ValueError("assignment must use roster name and give a reason")

            assignment_prompt = (
                context
                + """
Assign each supplied source ID to exactly ONE name from your canonical roster below.
Use the same roster name for the same ingredient across all batches. Return an object keyed
by source ID, each value {name, reason}. Empty name means unresolved/ineligible; give the reason.
Do not invent new names. If no roster name fits, use empty name and explain the missing identity.
Reasons must be short. This is your own independent roster, not another agent's response.
ROSTER_JSON:
"""
                + json.dumps(names)
                + "\nSOURCES_JSON:\n"
                + json.dumps(chunk, ensure_ascii=False)
            )
            assigned = call_agent(
                agent,
                f"grouping_large/{key}-rows-{start // CHUNK_SIZE + 1:03d}",
                assignment_prompt,
                schema,
                validate,
            )
            validate(assigned)
            assignments.append(assigned)
            for sid, row in assigned.items():
                if row["name"]:
                    grouped[row["name"]].append(int(sid))
                    reasons[row["name"]].append(row["reason"])
                else:
                    held.append({"source_id": int(sid), "reason": row["reason"]})
        groups = [
            {
                "source_ids": sorted(ids),
                "english_name": name,
                "reason": "; ".join(dict.fromkeys(reasons[name])),
            }
            for name, ids in sorted(grouped.items())
        ]
        response = {"groups": groups, "unresolved": sorted(held, key=lambda r: r["source_id"])}
        validate_groups(response, {r["source_id"] for r in sources})
        result["components"].append({"component_id": cid, **response})
        write_json(
            work_dir / "large-group-review" / agent / f"{key}.json",
            {
                "method": "shared-roster-v1",
                "input_sha256": digest(component),
                "roster": roster,
                "assignments": assignments,
                "response": response,
            },
        )
    return result


def call(agent, task, prompt, schema, validate, *, components, call_agent, work_dir):
    """유효한 기존 응답은 원래 입력 지문으로 재사용한다."""
    stage, name = task.split("/")
    cached = work_dir / "submissions" / stage / agent / f"{name}.json"
    if cached.exists():
        try:
            validate(json.loads(cached.read_text())["response"])
        except (ValueError, KeyError, TypeError):
            pass
        else:
            return call_agent(agent, task, prompt, schema, validate)
    return run(agent, task, components, call_agent, work_dir)
