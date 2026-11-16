# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 근거가 부족한 제한 판정을 별도 검토 기록으로 보류

"""Preserve model votes and omit judgments that lack sufficient evidence."""

from copy import deepcopy

from .runner import digest


def apply_decisions(decisions, audit, policy_hash):
    if not audit:
        return decisions
    if audit.get("votes_sha256") != digest(decisions):
        raise ValueError("restriction review belongs to different votes")
    if audit.get("policy_sha256") != policy_hash:
        raise ValueError("restriction review belongs to different policy")
    for key in ("authorization", "reviewer", "scope"):
        if not isinstance(audit.get(key), str) or not audit[key].strip():
            raise ValueError("restriction review requires authorization, reviewer and scope")
    result = deepcopy(decisions)
    indexed = {(r["ingredient_id"], r["restriction_type"]): r for r in result}
    seen = set()
    for edit in audit["edits"]:
        key = edit["ingredient_id"], edit["restriction_type"]
        if type(key[0]) is not int or key not in indexed or key in seen:
            raise ValueError("duplicate or unknown restriction review pair")
        if edit.get("before") != indexed[key]["degree"]:
            raise ValueError("restriction review before value differs from votes")
        if edit.get("after") != "UNKNOWN":
            raise ValueError("insufficient-evidence review may only withhold a judgment")
        if not isinstance(edit.get("reason"), str) or not edit["reason"].strip():
            raise ValueError("restriction review requires a reason")
        indexed[key]["degree"] = "UNKNOWN"
        seen.add(key)
    return result
