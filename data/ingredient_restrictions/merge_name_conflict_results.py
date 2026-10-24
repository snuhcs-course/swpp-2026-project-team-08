# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""이름 충돌 해결 재료의 A/B 결과만 기존 판정 파일에 안전하게 반영한다."""
import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_RUN = ROOT / "build/name-conflicts-20261024/run"


def merge(existing: dict, incoming: dict, names: set[str]) -> dict:
    old = {(r["ingredient_key"], r["restriction_id"]): r for r in existing["rows"]}
    new = {(r["ingredient_key"], r["restriction_id"]): r for r in incoming["rows"]}
    expected = {key for key in old if key[0] in names}
    if len(expected) != len(names) * 17 or set(new) != expected:
        raise ValueError("New run does not cover exactly the 20 added ingredients")
    if any(old[key]["relation"] is not None for key in expected):
        raise ValueError("Refusing to overwrite a decided relationship")
    if any(r["review_status"] != ("UNRESOLVED" if r["relation"] is None else "DECIDED")
           for r in new.values()):
        raise ValueError("Invalid review status")
    old.update(new)
    existing["rows"] = [old[key] for key in sorted(old)]
    existing["name_conflict_pairs_pending_review"] = sum(
        r["relation"] is None for key, r in new.items()
    )
    existing["name_conflict_classification"] = {
        "method": "Gemini A/B independent name-based classification",
        "manifest_sha256": incoming["manifest_sha256"],
        "pairs": len(new),
        "counts": dict(Counter(r["relation"] or "UNRESOLVED" for r in new.values())),
    }
    return existing


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", type=Path, default=DEFAULT_RUN)
    args = parser.parse_args()
    names = {r["kor_name"] for r in json.loads(
        (ROOT.parent / "ingredient_db/ingredients-reviewed.json").read_text(encoding="utf-8")
    )["name_conflict_resolution"]["decisions"]}
    path = ROOT / "relations-reviewed.json"
    existing = json.loads(path.read_text(encoding="utf-8"))
    incoming = json.loads((args.run_dir / "results/relations.json").read_text(encoding="utf-8"))
    merged = merge(existing, incoming, names)
    path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(merged["name_conflict_classification"], ensure_ascii=False))


if __name__ == "__main__":
    main()
