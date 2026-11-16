# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 위임받은 이름·묶음 수정과 원래 판정 보존

"""Apply authorized catalog corrections without changing original model votes."""

from .runner import digest


def apply_decisions(ingredients, decisions, policy_hash):
    from .selection import _finish, is_english_name, name_key

    if not decisions:
        return ingredients
    if decisions.get("ingredients_sha256") != digest(ingredients):
        raise ValueError("grouping decisions belong to different ingredients")
    if decisions.get("policy_sha256") != policy_hash:
        raise ValueError("grouping decisions belong to different policy")
    for field in ("authorization", "reviewer", "scope"):
        if not isinstance(decisions.get(field), str) or not decisions[field].strip():
            raise ValueError("grouping decisions require authorization, reviewer and scope")
    original = {item["id"]: item for item in ingredients}
    changed, replacements = set(), []
    for edit in decisions["edits"]:
        before = edit["before"]
        ident = before["id"]
        if ident in changed or original.get(ident) != before:
            raise ValueError("duplicate or changed original ingredient")
        if not isinstance(edit.get("reason"), str) or not edit["reason"].strip():
            raise ValueError("grouping correction requires a reason")
        members = []
        for group in edit["after"]:
            if set(group) != {"english_name", "source_ids"} or not is_english_name(
                group["english_name"]
            ):
                raise ValueError("invalid corrected ingredient")
            ids = group["source_ids"]
            if not isinstance(ids, list) or not ids or any(type(i) is not int for i in ids):
                raise ValueError("corrected groups require source IDs")
            members.extend(ids)
            replacements.append(group)
        if len(members) != len(set(members)) or set(members) != set(before["source_ids"]):
            raise ValueError("correction must preserve every original source exactly once")
        changed.add(ident)
    groups = [
        {"english_name": i["english_name"], "source_ids": i["source_ids"]}
        for i in ingredients
        if i["id"] not in changed
    ] + replacements
    names = [name_key(g["english_name"]) for g in groups]
    if len(names) != len(set(names)):
        raise ValueError("corrected names collide")
    return _finish(groups, [])[0]
