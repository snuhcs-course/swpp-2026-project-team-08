# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 전체 Grouping 검토의 원본별 확정과 재현 검증

"""위임받은 원본별 결정을 적용하고 같은 최종 이름의 원본을 모은다."""

from collections import defaultdict

from .runner import digest


def apply_decisions(ingredients, excluded, pending, decisions, policy_hash):
    from .selection import _finish, clean_name, is_english_name, name_key

    if not decisions:
        return ingredients, excluded, pending
    before = {"ingredients": ingredients, "excluded": excluded, "unresolved": pending}
    if decisions.get("before_sha256") != digest(before):
        raise ValueError("catalog review belongs to different grouping results")
    if decisions.get("policy_sha256") != policy_hash:
        raise ValueError("catalog review belongs to different policy")
    for key in ("reviewer", "authorization", "scope"):
        if not isinstance(decisions.get(key), str) or not decisions[key].strip():
            raise ValueError("catalog review requires reviewer, authorization and scope")
    required = {sid for item in ingredients for sid in item["source_ids"]}
    required.update(r["source_id"] for r in pending)
    known = required | {r["source_id"] for r in excluded}
    seen, names, groups, holds, exclusions = set(), {}, defaultdict(list), [], []
    for row in decisions["decisions"]:
        sid = row["source_id"]
        if type(sid) is not int or sid not in known or sid in seen:
            raise ValueError("unknown or duplicate catalog review source")
        seen.add(sid)
        if not isinstance(row.get("reason"), str) or not row["reason"].strip():
            raise ValueError("catalog decision requires reason")
        if row["action"] == "INCLUDE":
            if not is_english_name(row.get("english_name")):
                raise ValueError("included source requires English name")
            key = name_key(row["english_name"])
            names.setdefault(key, clean_name(row["english_name"]))
            groups[key].append(sid)
        elif row["action"] in {"EXCLUDE", "UNKNOWN"}:
            target = exclusions if row["action"] == "EXCLUDE" else holds
            target.append({"source_id": sid, "reason": "Catalog review: " + row["reason"]})
        else:
            raise ValueError("invalid catalog review action")
    if not required <= seen:
        raise ValueError("catalog review must cover every grouping candidate")
    final, unresolved = _finish(
        [{"english_name": names[key], "source_ids": sorted(ids)} for key, ids in groups.items()],
        holds,
    )
    excluded = [r for r in excluded if r["source_id"] not in seen] + exclusions
    return final, sorted(excluded, key=lambda r: r["source_id"]), unresolved
