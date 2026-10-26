# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Export provisional ingredient names from a validated agent A run."""

import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path

from .run_agents import DATA_DIR, load_agent_rows


def build_draft(rows):
    groups = defaultdict(list)
    for row in rows:
        if row["decision"] == "INCLUDE":
            groups[row["name_ko"].strip()].append(row)
    return {
        "schema_version": 1,
        "status": "UNREVIEWED_AGENT_A_DRAFT",
        "source_rows": len(rows),
        "included_rows": sum(row["decision"] == "INCLUDE" for row in rows),
        "excluded_rows": sum(row["decision"] == "EXCLUDE" for row in rows),
        "unresolved_rows": sum(row["decision"] == "UNRESOLVED" for row in rows),
        "ingredients": [
            {"kor_name": ko,
             "eng_name": (next(iter({row["name_en"].strip() for row in group}))
                          if len({row["name_en"].strip() for row in group}) == 1 else None),
             "english_options": sorted({row["name_en"].strip() for row in group}),
             "source_codes": sorted(row["code"] for row in group),
             "review_required": len(group) > 1,
             "english_name_conflict": len({row["name_en"].strip() for row in group}) > 1}
            for ko, group in sorted(groups.items())
        ],
    }


def build_reviewed_draft(reconciliation, review):
    """Apply explicit model decisions, preserving the unreviewed agreed-row provenance."""
    if review.get("partial"):
        raise ValueError("partial review cannot be exported")
    originals = reconciliation["rows"]
    expected = {r["code"] for r in originals if r["status"] == "HUMAN_REVIEW"}
    decisions = review["decisions"]
    codes = [r["code"] for r in decisions]
    if len(codes) != len(set(codes)) or set(codes) != expected:
        raise ValueError("review codes must cover each pending source exactly once")
    by_code = {r["code"]: r for r in decisions}
    merged = []
    for row in originals:
        result = by_code.get(row["code"], row["a"])
        if result["decision"] not in {"INCLUDE", "EXCLUDE", "UNRESOLVED"}:
            raise ValueError("invalid review decision")
        if not result.get("reason", "").strip():
            raise ValueError("review reason is required")
        names = [result[k].strip() for k in ("name_ko", "name_en")]
        if (result["decision"] == "INCLUDE" and not all(names)) or (
            result["decision"] != "INCLUDE" and any(names)
        ):
            raise ValueError("names must be present only for included ingredients")
        merged.append(result)
    draft = build_draft(merged)
    overrides = review.get("name_overrides", [])
    override_map = {r["kor_name"]: r for r in overrides}
    available = {r["kor_name"] for r in draft["ingredients"]}
    if len(override_map) != len(overrides) or not set(override_map) <= available:
        raise ValueError("name overrides must be unique and refer to included ingredients")
    for item in draft["ingredients"]:
        if item["kor_name"] in override_map:
            override = override_map[item["kor_name"]]
            if not override["eng_name"].strip() or not override["reason"].strip():
                raise ValueError("English override requires a name and reason")
            item["eng_name"] = override["eng_name"].strip()
            item["english_name_conflict"] = False
        # Repeated source variants alone are not an unresolved decision.
        item["review_required"] = item["english_name_conflict"]
        item["ai_reviewed_source_codes"] = [c for c in item["source_codes"] if c in by_code]
    draft.update(
        status="AI_REVIEWED_TRIAL_DATASET",
        review={"reviewer_model": review["reviewer_model"],
                "review_type": "AI_REVIEW_NOT_HUMAN_APPROVAL",
                "reviewed_source_rows": len(decisions),
                "agreed_source_rows_without_individual_review": len(originals) - len(decisions)},
        unresolved=[{"code": r["code"], "reason": r["reason"]}
                    for r in merged if r["decision"] == "UNRESOLVED"],
    )
    draft["unresolved_name_groups"] = [item for item in draft["ingredients"] if item["english_name_conflict"]]
    draft["ingredients"] = [item for item in draft["ingredients"] if not item["english_name_conflict"]]
    return draft


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path,
                        default=DATA_DIR / "build/gemini-full/manifest.json")
    parser.add_argument("--out", type=Path, default=DATA_DIR / "ingredients-draft.json")
    parser.add_argument("--review", type=Path, help="explicit AI review decisions for pending rows")
    args = parser.parse_args()
    if args.review:
        reconciliation_path = args.manifest.parent / "reconciled/reconciliation.json"
        reconciliation = json.loads(reconciliation_path.read_text(encoding="utf-8"))
        # Validate the source/policy hashes and both original passes before export.
        load_agent_rows(args.manifest, "a")
        load_agent_rows(args.manifest, "b")
        draft = build_reviewed_draft(reconciliation, json.loads(args.review.read_text(encoding="utf-8")))
        draft["review"]["decisions_sha256"] = hashlib.sha256(args.review.read_bytes()).hexdigest()
        draft["review"]["reconciliation_sha256"] = hashlib.sha256(reconciliation_path.read_bytes()).hexdigest()
    else:
        draft = build_draft(load_agent_rows(args.manifest, "a"))
    args.out.write_text(json.dumps(draft, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ingredients": len(draft["ingredients"]),
                      "review_required": sum(x["review_required"] for x in draft["ingredients"]),
                      "english_name_conflicts": sum(x["english_name_conflict"] for x in draft["ingredients"])}))


if __name__ == "__main__":
    main()
