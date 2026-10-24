# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Prepare, run independent Gemini reviews, and merge ingredient restrictions."""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path

from data.ingredient_db.code.call_gemini_agent import generate, load_api_key

HERE = Path(__file__).resolve().parent
CATALOG = HERE.parent / "ingredient_db"
NUMERIC = {"low-fructose": ("fructose_equivalent_g", 2),
           "low-sodium": ("sodium_mg", 140), "ketogenic": ("available_carbohydrate_g", 5)}
COMBINED = "gluten-casein-free"
RELATIONS = {"ALWAYS", "NEVER", "DEPENDS_ON_PRODUCT", None}


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decision(key, rid, relation, reason, evidence):
    return {"ingredient_key": key, "restriction_id": rid, "relation": relation,
            "review_status": "UNRESOLVED" if relation is None else "DECIDED",
            "reason": reason, "evidence_ids": evidence}


def prepare(out, ingredients, restrictions, policy, source, evidence, chunk_size=40, limit=None, assessment_mode="NAME_BASED"):
    if out.exists():
        raise ValueError("choose a new run folder; previous submissions must not be overwritten")
    if chunk_size < 1 or (limit is not None and limit < 1):
        raise ValueError("chunk size and limit must be positive")
    items = read(ingredients)["ingredients"]
    if limit is not None:
        items = items[:limit]
    ids = [r["id"] for r in read(restrictions)["restrictions"]]
    keys = [r["kor_name"] for r in items]
    if not items or len(keys) != len(set(keys)) or len(ids) != len(set(ids)):
        raise ValueError("empty or duplicate input")
    if not (set(NUMERIC) | {COMBINED, "gluten-free", "casein-free"}) <= set(ids):
        raise ValueError("required derived restrictions missing")
    facts = read(evidence)["facts"] if evidence else []
    source_rows = {r["source_record_id"]: r for r in read(source)["rows"]}
    for item in items:
        for code in item["source_codes"]:
            if code not in source_rows:
                raise ValueError("source code missing")
            facts.append({"id": "rda:" + code, "ingredient_key": item["kor_name"],
                          "source_ref": source_rows[code]["source_locator"],
                          "text": json.dumps(source_rows[code], ensure_ascii=False)})
    seen = set()
    for fact in facts:
        if not all(isinstance(fact.get(k), str) and fact[k].strip()
                   for k in ("id", "ingredient_key", "source_ref", "text")):
            raise ValueError("evidence requires id, ingredient_key, source_ref, text")
        if fact["id"] in seen:
            raise ValueError("duplicate evidence ID")
        seen.add(fact["id"])
    by_key = {key: [f for f in facts if f["ingredient_key"] == key] for key in keys}
    task_ids = []
    for rid in ids:
        if rid == COMBINED:
            continue
        for start in range(0, len(items), chunk_size):
            tid = f"task-{len(task_ids) + 1:04d}"
            batch = items[start:start + chunk_size]
            write(out / "tasks" / (tid + ".json"), {
                "task_id": tid, "restriction_id": rid, "assessment_mode": assessment_mode,
                "portion_rule": None,
                "ingredients": [{"ingredient_key": i["kor_name"], "eng_name": i["eng_name"],
                                 "evidence": by_key[i["kor_name"]]} for i in batch]})
            task_ids.append(tid)
    snapshot = {"ingredients": items, "restriction_ids": ids, "facts": facts}
    write(out / "inputs.json", snapshot)
    (out / "policy.md").write_text(policy.read_text(encoding="utf-8"), encoding="utf-8")
    (out / "prompt.md").write_text((HERE / "prompt.md").read_text(encoding="utf-8"), encoding="utf-8")
    files = ["inputs.json", "policy.md", "prompt.md"] + [f"tasks/{t}.json" for t in task_ids]
    manifest = {"schema_version": 1, "tasks": task_ids,
                "source_hashes": {str(p.resolve()): sha(p) for p in
                                  [ingredients, restrictions, policy, source] + ([evidence] if evidence else [])},
                "file_hashes": {f: sha(out / f) for f in files}}
    write(out / "manifest.json", manifest)
    return {"ingredients": len(items), "tasks_per_pass": len(task_ids),
            "relations": len(items) * len(ids)}


def check_run(folder):
    manifest = read(folder / "manifest.json")
    for name, digest in manifest["file_hashes"].items():
        if sha(folder / name) != digest:
            raise ValueError("run input changed: " + name)
    return manifest


def validate(task, answer):
    if not isinstance(answer, dict) or answer.get("task_id") != task["task_id"]:
        raise ValueError("wrong task_id")
    rows = answer.get("rows")
    if not isinstance(rows, list):
        raise ValueError("rows must be a list")
    expected = {i["ingredient_key"]: i for i in task["ingredients"]}
    seen = set()
    for row in rows:
        fields = {"ingredient_key", "restriction_id", "relation", "review_status", "reason", "evidence_ids"}
        if task.get("assessment_mode") != "NAME_BASED" and task["restriction_id"] in NUMERIC:
            fields.add("nutrition_estimate")
        if not isinstance(row, dict) or set(row) != fields:
            actual = set(row) if isinstance(row, dict) else set()
            raise ValueError(f"unexpected result fields: missing={sorted(fields - actual)}, "
                             f"extra={sorted(actual - fields)}")
        key = row["ingredient_key"]
        if key not in expected or key in seen or row["restriction_id"] != task["restriction_id"]:
            raise ValueError("duplicate, missing, or unknown relation key")
        seen.add(key)
        relation = row["relation"]
        expected_status = "ESTIMATED" if task.get("assessment_mode") != "NAME_BASED" and task["restriction_id"] in NUMERIC else "DECIDED"
        if relation not in RELATIONS or row["review_status"] != (
            "UNRESOLVED" if relation is None else expected_status
        ):
            raise ValueError("invalid relation/status")
        evidence = row["evidence_ids"]
        allowed = {f["id"] for f in expected[key]["evidence"]}
        if (not isinstance(evidence, list) or any(not isinstance(x, str) for x in evidence)
                or not set(evidence) <= allowed or len(evidence) != len(set(evidence))):
            raise ValueError("unknown or duplicate evidence IDs")
        if task.get("assessment_mode") != "NAME_BASED" and task["restriction_id"] in NUMERIC:
            calculated = estimate_relation(key, task["restriction_id"], row["nutrition_estimate"])
            if relation != calculated:
                raise ValueError("relation does not match estimated portion calculation")
            field = NUMERIC[task["restriction_id"]][0]
            provided = [f["nutrients_per_100g"][field] for f in expected[key]["evidence"]
                        if field in f.get("nutrients_per_100g", {})]
            if provided and row["nutrition_estimate"]["per_100g"] not in provided:
                raise ValueError("estimate must use supplied nutrient value")
        if relation is not None and not evidence:
            raise ValueError("decided relation requires supplied evidence")
        if not isinstance(row["reason"], str) or not row["reason"].strip():
            raise ValueError("reason required")
    if seen != set(expected):
        raise ValueError("missing relation rows")


def derive_status(task, answer):
    """Status is a deterministic projection of relation; retain the raw reply separately."""
    normalized = copy.deepcopy(answer)
    if not isinstance(normalized, dict) or not isinstance(normalized.get("rows"), list):
        return normalized
    for row in normalized["rows"]:
        if not isinstance(row, dict) or "relation" not in row or "review_status" not in row:
            continue
        relation = row["relation"]
        if isinstance(relation, (str, type(None))) and relation in RELATIONS:
            row["review_status"] = ("UNRESOLVED" if relation is None else
                                    "ESTIMATED" if task.get("assessment_mode") != "NAME_BASED" and task["restriction_id"] in NUMERIC else "DECIDED")
    return normalized


def run(folder, passes, model, batch_size=10, workers=2, dry_run=False):
    from .batch_runner import run_batched
    return run_batched(folder, passes, model, batch_size, workers, dry_run)


def estimate_relation(key, rid, estimate):
    """Compare a disclosed typical portion contribution, never claim a measured intake."""
    fields = {"context", "amount_g", "per_100g", "amount_reason", "composition_reason"}
    if not isinstance(estimate, dict) or set(estimate) != fields:
        raise ValueError("nutrition_estimate requires context, amount and nutrient assumptions")
    for name in ("context", "amount_reason", "composition_reason"):
        if not isinstance(estimate[name], str) or not estimate[name].strip():
            raise ValueError("estimate explanation required")
    for name in ("amount_g", "per_100g"):
        value = estimate[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError("invalid estimate value")
        if value < 0 or (name == "amount_g" and value == 0):
            raise ValueError("estimate quantity must be positive and nutrient nonnegative")
    contribution = estimate["amount_g"] * estimate["per_100g"] / 100
    return "ALWAYS" if contribution > NUMERIC[rid][1] else "NEVER"


def reconcile(folder):
    manifest = check_run(folder)
    resolved = {}
    differences = []
    for tid in manifest["tasks"]:
        task = read(folder / "tasks" / (tid + ".json"))
        answers = []
        for agent in ("a", "b"):
            answer = read(folder / "submissions" / agent / (tid + ".json"))["answer"]
            validate(task, answer)
            answers.append({r["ingredient_key"]: r for r in answer["rows"]})
        for key in answers[0]:
            a, b = answers[0][key], answers[1][key]
            rid = task["restriction_id"]
            if a["relation"] == b["relation"]:
                row = decision(key, rid, a["relation"], "A: " + a["reason"] + " / B: " + b["reason"],
                               sorted(set(a["evidence_ids"] + b["evidence_ids"])))
                if task.get("assessment_mode") != "NAME_BASED" and rid in NUMERIC:
                    row["review_status"] = "ESTIMATED"
                    row["assessment_basis"] = "ESTIMATED_PORTION"
                    row["nutrition_estimates"] = {"a": a["nutrition_estimate"], "b": b["nutrition_estimate"]}
            else:
                row = decision(key, rid, None, "A/B 불일치; 재검토 필요", [])
                differences.append({"ingredient_key": key, "restriction_id": rid, "a": a, "b": b})
            if task.get("assessment_mode") != "NAME_BASED" and rid in NUMERIC and a["relation"] != b["relation"]:
                row["assessment_basis"] = "ESTIMATED_PORTION"
                row["nutrition_estimates"] = {"a": a["nutrition_estimate"], "b": b["nutrition_estimate"]}
            resolved[key, rid] = row
    inputs = read(folder / "inputs.json")
    for item in inputs["ingredients"]:
        key = item["kor_name"]
        parts = [resolved[key, rid] for rid in ("gluten-free", "casein-free")]
        relations = [p["relation"] for p in parts]
        result = ("ALWAYS" if "ALWAYS" in relations else None if None in relations else
                  "DEPENDS_ON_PRODUCT" if "DEPENDS_ON_PRODUCT" in relations else "NEVER")
        resolved[key, COMBINED] = decision(key, COMBINED, result, "글루텐·카제인 판정의 합집합",
                                         sorted({e for p in parts for e in p["evidence_ids"]}))
    rows = [resolved[i["kor_name"], rid] for i in inputs["ingredients"] for rid in inputs["restriction_ids"]]
    write(folder / "results/relations.json", {"status": "AI_CLASSIFIED_DRAFT", "manifest_sha256": sha(folder / "manifest.json"), "rows": rows})
    write(folder / "results/disagreements.json", {"rows": differences})
    write(folder / "results/unresolved.json", {"rows": [r for r in rows if r["relation"] is None]})
    return {"relations": len(rows), "unresolved": sum(r["relation"] is None for r in rows),
            "disagreements": len(differences)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    prep = sub.add_parser("prepare")
    prep.add_argument("--out", type=Path, required=True)
    prep.add_argument("--ingredients", type=Path, default=CATALOG / "ingredients-reviewed.json")
    prep.add_argument("--restrictions", type=Path, default=CATALOG / "restrictions.json")
    prep.add_argument("--policy", type=Path, default=CATALOG / "docs/restriction-policy.md")
    prep.add_argument("--source", type=Path, default=CATALOG / "rda-source.json")
    prep.add_argument("--evidence", type=Path)
    prep.add_argument("--chunk-size", type=int, default=40)
    prep.add_argument("--limit", type=int)
    execute = sub.add_parser("run")
    execute.add_argument("--run-dir", type=Path, required=True)
    execute.add_argument("--passes", nargs="+", choices=("a", "b"), default=["a", "b"])
    execute.add_argument("--model", default="gemini-3.5-flash-lite")
    execute.add_argument("--batch-size", type=int, default=10)
    execute.add_argument("--workers", type=int, default=2)
    execute.add_argument("--dry-run", action="store_true")
    merge = sub.add_parser("reconcile")
    merge.add_argument("--run-dir", type=Path, required=True)
    args = vars(parser.parse_args())
    command = args.pop("command")
    if command == "prepare":
        print(json.dumps(prepare(**args)))
    elif command == "run":
        print(json.dumps(run(args["run_dir"], args["passes"], args["model"],
                             args["batch_size"], args["workers"], args["dry_run"])))
    else:
        print(json.dumps(reconcile(args["run_dir"])))


if __name__ == "__main__":
    main()
