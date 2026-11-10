# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 기본·기존 high 실행의 JSONL 재현과 검토용 집계

"""Export a complete review record without the original API responses."""

import hashlib
import json
import tempfile
from pathlib import Path

from .restrictions import AGENTS, DEGREES, RESTRICTION_TYPES, reconcile, validate_ingredients
from .runner import digest
from .selection import name_key, validate_selected

FILENAMES = ("ingredients.jsonl", "ingredients_restrictions.jsonl")


def validate_provenance(review):
    metadata = review["metadata"]
    if not isinstance(metadata, dict) or set(metadata.get("agents", [])) != set(AGENTS):
        raise ValueError("review requires the three agent identities")
    if (
        len(metadata["agents"]) != 3
        or not isinstance(metadata.get("model"), str)
        or not metadata["model"].strip()
    ):
        raise ValueError("review requires model provenance")
    if metadata.get("thinking_level") not in {"default", "high"}:
        raise ValueError("review must record thinking_level=default or legacy high")
    if metadata.get("temperature") != 0.2:
        raise ValueError("review must record temperature=0.2")
    for key in ("policy_sha256", "source_sha256"):
        value = metadata.get(key)
        if (
            not isinstance(value, str)
            or len(value) != 64
            or any(character not in "0123456789abcdef" for character in value)
        ):
            raise ValueError(f"invalid provenance hash: {key}")
    source = metadata["source"]
    if source.get("row_count") != len(review["sources"]):
        raise ValueError("source row count differs from pinned dataset")
    if digest({"metadata": source, "rows": review["sources"]}) != metadata["source_sha256"]:
        raise ValueError("source data differs from pinned dataset")


def reviewed_rows(review):
    """Recompute decisions so an edited summary cannot hide missing votes."""
    if review.get("schema_version") != 1:
        raise ValueError("unsupported review schema")
    validate_provenance(review)
    validate_selected(review)
    ingredients = review["ingredients"]
    validate_ingredients(ingredients)
    sources = review["sources"]
    source_ids = {row["source_id"] for row in sources}
    if len(source_ids) != len(sources):
        raise ValueError("duplicate review source IDs")
    if any(value not in source_ids for item in ingredients for value in item["source_ids"]):
        raise ValueError("missing review source")
    records = review.get("restriction_votes")
    if not isinstance(records, list):
        raise TypeError("restriction votes are required")
    responses = {agent: {"rows": []} for agent in AGENTS}
    for record in records:
        if not isinstance(record, dict) or set(record) != {
            "ingredient_id",
            "restriction_type",
            "degree",
            "votes",
        }:
            raise ValueError("invalid reviewed restriction fields")
        votes = record["votes"]
        if not isinstance(votes, dict) or set(votes) != set(AGENTS):
            raise ValueError("three distinct agent votes are required")
        for agent in AGENTS:
            vote = votes[agent]
            if not isinstance(vote, dict) or set(vote) != {"degree", "reason"}:
                raise ValueError("invalid review vote")
            responses[agent]["rows"].append(
                {
                    "ingredient_id": record["ingredient_id"],
                    "restriction_type": record["restriction_type"],
                    **vote,
                }
            )
    decisions = reconcile(ingredients, responses)
    recorded = {
        (record["ingredient_id"], record["restriction_type"]): record["degree"]
        for record in records
    }
    if any(
        recorded[(row["ingredient_id"], row["restriction_type"])] != row["degree"]
        for row in decisions
    ):
        raise ValueError("reviewed decision does not match its votes")
    ingredient_rows = [
        {"id": item["id"], "english_name": item["english_name"], "korean_name": None}
        for item in sorted(ingredients, key=lambda item: item["id"])
    ]
    restriction_rows = [
        {key: row[key] for key in ("ingredient_id", "restriction_type", "degree")}
        for row in decisions
        if row["degree"] != "UNKNOWN"
    ]
    return ingredient_rows, restriction_rows


def review_summary(review):
    """Keep counts and a small, stable sample of disagreements for reviewers."""
    counts = {kind: dict.fromkeys(DEGREES, 0) for kind in sorted(RESTRICTION_TYPES)}
    names = {item["id"]: item["english_name"] for item in review["ingredients"]}
    examples = []
    two_to_one, three_way = 0, 0
    for row in sorted(
        review["restriction_votes"], key=lambda row: (row["ingredient_id"], row["restriction_type"])
    ):
        counts[row["restriction_type"]][row["degree"]] += 1
        votes = {agent: row["votes"][agent]["degree"] for agent in AGENTS}
        distinct = len(set(votes.values()))
        two_to_one += distinct == 2
        three_way += distinct == 3
        if distinct > 1 and len(examples) < 10:
            examples.append(
                {
                    "ingredient_name": names[row["ingredient_id"]],
                    "restriction_type": row["restriction_type"],
                    "votes": votes,
                    "final": row["degree"],
                }
            )
    sources = {row["source_id"]: row["description"] for row in review["sources"]}
    final_names = {
        source_id: item["english_name"]
        for item in review["ingredients"]
        for source_id in item["source_ids"]
    }
    name_examples, name_disagreements = [], 0
    for row in sorted(review["selection_review"], key=lambda row: row["source_id"]):
        proposed = {agent: row["votes"][agent]["english_name"] or None for agent in AGENTS}
        if len({name_key(name) for name in proposed.values() if name is not None}) <= 1:
            continue
        name_disagreements += 1
        if len(name_examples) < 10:
            name_examples.append(
                {
                    "source_id": row["source_id"],
                    "description": sources[row["source_id"]],
                    "names": proposed,
                    "final": final_names.get(row["source_id"]),
                }
            )
    source = review["metadata"]["source"]
    return {
        "provenance": {
            "model": review["metadata"]["model"],
            "thinking_level": review["metadata"]["thinking_level"],
            "temperature": review["metadata"]["temperature"],
            "source_release": source.get("release"),
            "license": source.get("license"),
        },
        "included_sources": len(final_names),
        "restriction_counts": counts,
        "two_to_one_restrictions": two_to_one,
        "three_way_restrictions": three_way,
        "restriction_disagreement_examples": examples,
        "source_name_disagreements": name_disagreements,
        "source_name_disagreement_examples": name_examples,
    }


def render(review):
    ingredients, restrictions = reviewed_rows(review)

    def encode(rows):
        return "".join(
            json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n" for row in rows
        ).encode("utf-8")

    files = dict(zip(FILENAMES, (encode(ingredients), encode(restrictions)), strict=True))
    summary = {
        "ingredients": len(ingredients),
        "restrictions": len(restrictions),
        "unresolved_restrictions": len(ingredients) * len(RESTRICTION_TYPES) - len(restrictions),
        "restriction_types": len(RESTRICTION_TYPES),
        "agent_votes": len(ingredients) * len(RESTRICTION_TYPES) * len(AGENTS),
        "source_rows": len(review["sources"]),
        "excluded_sources": len(review.get("excluded", [])),
        "unresolved_sources": len(review.get("unresolved", [])),
        **review_summary(review),
        "sha256": {name: hashlib.sha256(content).hexdigest() for name, content in files.items()},
    }
    return files, summary


def export_catalog(review, output_dir):
    files, summary = render(review)
    output_dir = Path(output_dir)
    if output_dir.exists() and any(path.name not in FILENAMES for path in output_dir.iterdir()):
        raise ValueError("result directory must contain only the two JSONL files")
    output_dir.mkdir(parents=True, exist_ok=True)
    previous = {
        name: (output_dir / name).read_bytes() if (output_dir / name).exists() else None
        for name in FILENAMES
    }
    with tempfile.TemporaryDirectory(prefix=".ingredient-export-", dir=output_dir.parent) as folder:
        staging = Path(folder)
        for name, content in files.items():
            (staging / name).write_bytes(content)
        replaced = []
        try:
            for name in FILENAMES:
                (staging / name).replace(output_dir / name)
                replaced.append(name)
        except OSError:
            for name in replaced:
                if previous[name] is None:
                    (output_dir / name).unlink(missing_ok=True)
                else:
                    (output_dir / name).write_bytes(previous[name])
            raise
    return summary


def export_from_review(review_path, output_dir):
    review_path = Path(review_path)
    review = json.loads(review_path.read_text(encoding="utf-8"))
    summary = export_catalog(review, output_dir)
    (review_path.parent / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return summary


def check(review_path, output_dir):
    """Compare both artifacts and their counts with the complete saved votes."""
    review_path, output_dir = Path(review_path), Path(output_dir)
    review = json.loads(review_path.read_text(encoding="utf-8"))
    expected, summary = render(review)
    if not output_dir.is_dir() or {path.name for path in output_dir.iterdir()} != set(FILENAMES):
        raise ValueError("result directory must contain exactly the two JSONL files")
    for name, content in expected.items():
        if (output_dir / name).read_bytes() != content:
            raise ValueError(f"result differs from review: {name}")
    saved_summary = json.loads((review_path.parent / "summary.json").read_text(encoding="utf-8"))
    if saved_summary != summary:
        raise ValueError("summary differs from review")
    return summary
