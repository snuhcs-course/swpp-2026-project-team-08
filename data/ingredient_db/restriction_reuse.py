# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 이름과 전체 원본이 같은 재료의 제한 응답 재사용

"""재료 ID가 바뀌어도 정체성이 같은 경우에만 기존 세 응답을 가져온다."""

from copy import deepcopy

from .runner import AGENTS, digest


def signature(item):
    from .selection import name_key

    return name_key(item["english_name"]), tuple(sorted(item["source_ids"]))


def build(previous, selected):
    from .export import reviewed_rows

    reviewed_rows(previous)
    if previous["sources"] != selected["sources"]:
        raise ValueError("restriction reuse requires identical source dataset")
    held = {e["ingredient_id"] for e in previous.get("restriction_decisions", {}).get("edits", [])}
    old = {signature(i): i for i in previous["ingredients"] if i["id"] not in held}
    entries = []
    for item in selected["ingredients"]:
        before = old.get(signature(item))
        if before:
            entries.append(
                {
                    "ingredient": deepcopy(item),
                    "original": deepcopy(before),
                    "votes": [
                        deepcopy(r)
                        for r in previous["restriction_votes"]
                        if r["ingredient_id"] == before["id"]
                    ],
                }
            )
    return {
        "metadata": deepcopy(previous["metadata"]),
        "review_sha256": digest(previous),
        "scope": "Identical English name and complete source membership; reviewed holds excluded",
        "entries": entries,
    }


def responses(record, ingredients, sources, final_votes=None):
    from .restrictions import majority, validate_response

    metadata = record["metadata"]
    if digest({"metadata": metadata["source"], "rows": sources}) != metadata["source_sha256"]:
        raise ValueError("reused restrictions belong to different sources")
    available = {i["id"]: i for i in ingredients}
    result = {agent: {"rows": []} for agent in AGENTS}
    seen = set()
    expected_final = []
    for entry in record["entries"]:
        item, original = entry["ingredient"], entry["original"]
        ident = item["id"]
        if ident in seen or available.get(ident) != item or signature(item) != signature(original):
            raise ValueError("reused ingredient identity changed or duplicated")
        seen.add(ident)
        old_responses = {agent: {"rows": []} for agent in AGENTS}
        for row in entry["votes"]:
            if row["ingredient_id"] != original["id"] or set(row["votes"]) != set(AGENTS):
                raise ValueError("invalid original restriction votes")
            for agent in AGENTS:
                vote = {
                    "ingredient_id": original["id"],
                    "restriction_type": row["restriction_type"],
                    **row["votes"][agent],
                }
                old_responses[agent]["rows"].append(vote)
                result[agent]["rows"].append({**vote, "ingredient_id": ident})
        for response in old_responses.values():
            validate_response([original], response)
        if any(
            row["degree"] != majority([v["degree"] for v in row["votes"].values()])
            for row in entry["votes"]
        ):
            raise ValueError("original restriction majority differs from votes")
        expected_final.extend({**r, "ingredient_id": ident} for r in entry["votes"])
    if final_votes is not None:
        actual = [r for r in final_votes if r["ingredient_id"] in seen]

        def key(r):
            return r["ingredient_id"], r["restriction_type"]

        if sorted(actual, key=key) != sorted(expected_final, key=key):
            raise ValueError("reused restriction votes were changed")
    return result
