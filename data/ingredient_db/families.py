# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 기본 식품군 후보 구성과 전체 후보 Grouping

"""비교 후보군을 만들되 최종 통합은 세 응답으로 결정한다."""

import json
from collections import defaultdict

VERSION = "basic-family-v1"
ALIASES = {"oils": "oil", "pancake": "pancakes", "salad dressings": "salad dressing"}


def candidates(included, pending, review, audit):
    held = {row["source_id"] for row in (audit or {}).get("findings", [])}
    promoted = {
        row["source_id"]: next(
            vote["english_name"] for vote in row["votes"].values() if vote["decision"] == "INCLUDE"
        )
        for row in review
        if row["source_id"] not in held
        and row["decision"] == "UNKNOWN"
        and sum(v["decision"] == "INCLUDE" for v in row["votes"].values()) >= 2
    }
    return (
        included + [{"source_id": sid, "english_name": name} for sid, name in promoted.items()],
        [row for row in pending if row["source_id"] not in promoted],
    )


def components(included, indexed, sources):
    from .selection import _components, name_key

    parents = {row["source_id"]: row["source_id"] for row in included}

    def root(sid):
        while parents[sid] != sid:
            parents[sid] = parents[parents[sid]]
            sid = parents[sid]
        return sid

    def connect(ids):
        for sid in ids[1:]:
            parents[root(sid)] = root(ids[0])

    for ids in _components(included, indexed):
        connect(ids)
    families = defaultdict(list)
    for row in sources:
        if row["source_id"] in parents:
            key = name_key(row["description"].split(",")[0])
            families[ALIASES.get(key, key)].append(row["source_id"])
    for ids in families.values():
        connect(ids)
    result = defaultdict(list)
    for sid in sorted(parents):
        result[root(sid)].append(sid)
    return sorted(result.values(), key=lambda ids: ids[0])


def batches(groups, max_sources=120):
    """큰 군은 그대로 보내고 작은 군만 요청당 원본 수에 맞춰 함께 보낸다."""
    batch, size = [], 0
    for group in groups:
        count = len(group["source_ids"])
        if batch and (size + count > max_sources or len(batch) == 20):
            yield batch
            batch, size = [], 0
        batch.append(group)
        size += count
    if batch:
        yield batch


def prompt(components):
    return """Independently group EVERY supplied source, including singletons, under the policy.
Each component is a broad comparison pool, NOT a mandatory merged ingredient.
Use short US English base ingredient names. Merge product formulations, fat/salt levels,
fortification and complete/incomplete dry-mix variants of the same basic ingredient.
Buckwheat, plain and whole-wheat pancake dry mixes belong to ONE group named Pancake mix.
Do not retain USDA catalog qualifiers in service names. Keep source IDs and all original
composition evidence so restriction judging can use DEPENDS_ON_PRODUCT or UNKNOWN.
Keep genuinely different ingredients, edible parts and uses separate: wheat/rice flour,
egg white/yolk, fruit/dried fruit, whole foods/oils/flours. Do not merge all foods in a pool.
Recheck brands, recipe foods and finished dishes against policy; put ineligible sources in
unresolved with reasons. Generic dry baking mixes ARE ingredients, prepared pancakes are not.
Return components with component_id, groups (source_ids, english_name, reason), and unresolved
(source_id, reason). Cover every source exactly once within its component. Do not move IDs
between components. Do not infer another agent's answer. Keep reasons short.
COMPONENTS_JSON:
""" + json.dumps(components, ensure_ascii=False)
