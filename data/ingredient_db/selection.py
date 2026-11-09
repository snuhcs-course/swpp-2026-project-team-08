# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 원본별 재료 선정과 이름·구성원 다수결

"""원본 전체의 세 판단을 비교하고 같은 재료를 묶는다."""

import json
import unicodedata
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from .runner import AGENTS, write_json

DECISIONS = {"INCLUDE", "EXCLUDE", "UNKNOWN"}
ROW_SCHEMA = {
    "type": "object",
    "properties": {
        "source_id": {"type": "integer"},
        "decision": {"type": "string", "enum": sorted(DECISIONS)},
        "english_name": {"type": "string"},
        "reason": {"type": "string"},
    },
    "required": ["source_id", "decision", "english_name", "reason"],
    "additionalProperties": False,
}
SELECTION_SCHEMA = {
    "type": "object",
    "properties": {"rows": {"type": "array", "items": ROW_SCHEMA}},
    "required": ["rows"],
    "additionalProperties": False,
}
GROUP_SCHEMA = {
    "type": "object",
    "properties": {
        "groups": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source_ids": {"type": "array", "items": {"type": "integer"}},
                    "english_name": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["source_ids", "english_name", "reason"],
                "additionalProperties": False,
            },
        },
        "unresolved": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"source_id": {"type": "integer"}, "reason": {"type": "string"}},
                "required": ["source_id", "reason"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["groups", "unresolved"],
    "additionalProperties": False,
}


def clean_name(value: str) -> str:
    value = " ".join(unicodedata.normalize("NFC", value).split())
    for index, character in enumerate(value):
        if character.isalpha():
            return value[:index] + character.upper() + value[index + 1 :]
    return value


def name_key(value: str) -> str:
    return clean_name(value).casefold()


def majority(values: list):
    value, count = Counter(values).most_common(1)[0]
    return value if count >= 2 else None


def _nonblank(value) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_selection(payload: dict, source_ids: set[int]) -> None:
    if not isinstance(payload, dict) or set(payload) != {"rows"}:
        raise ValueError("selection must contain rows")
    if not isinstance(payload["rows"], list):
        raise ValueError("rows must be an array")
    seen = set()
    for row in payload["rows"]:
        if not isinstance(row, dict) or set(row) != set(ROW_SCHEMA["required"]):
            raise ValueError("invalid selection fields")
        source_id = row["source_id"]
        if type(source_id) is not int or source_id not in source_ids or source_id in seen:
            raise ValueError("invalid, unknown or duplicate source ID")
        seen.add(source_id)
        if row["decision"] not in DECISIONS or not _nonblank(row["reason"]):
            raise ValueError("invalid decision or missing reason")
        name = row["english_name"]
        if not isinstance(name, str):
            raise ValueError("name must be a string")
        if (row["decision"] == "INCLUDE") != bool(name.strip()):
            raise ValueError("only included foods must have an English name")
    if seen != source_ids:
        raise ValueError("selection omitted source rows")


def validate_groups(payload: dict, source_ids: set[int]) -> None:
    if not isinstance(payload, dict) or set(payload) != {"groups", "unresolved"}:
        raise ValueError("group response requires groups and unresolved")
    if not isinstance(payload["groups"], list) or not isinstance(payload["unresolved"], list):
        raise ValueError("groups and unresolved must be arrays")
    members = []
    names = set()
    for group in payload["groups"]:
        if set(group) != {"source_ids", "english_name", "reason"}:
            raise ValueError("invalid group fields")
        ids = group["source_ids"]
        if not isinstance(ids, list) or not ids or any(type(i) is not int for i in ids):
            raise ValueError("group must have integer source IDs")
        if not _nonblank(group["english_name"]) or not _nonblank(group["reason"]):
            raise ValueError("group needs a name and reason")
        key = name_key(group["english_name"])
        if key in names:
            raise ValueError("different groups cannot have the same name")
        names.add(key)
        members.extend(ids)
    for row in payload["unresolved"]:
        if set(row) != {"source_id", "reason"} or not _nonblank(row["reason"]):
            raise ValueError("invalid unresolved row")
        if type(row["source_id"]) is not int:
            raise ValueError("unresolved source ID must be an integer")
        members.append(row["source_id"])
    if len(members) != len(set(members)) or set(members) != source_ids:
        raise ValueError("groups must partition all source IDs exactly once")


def reconcile_rows(source_rows: list[dict], responses: dict[str, list[dict]]) -> tuple:
    source_ids = {row["source_id"] for row in source_rows}
    if set(responses) != set(AGENTS):
        raise ValueError("all three agents are required")
    for rows in responses.values():
        validate_selection({"rows": rows}, source_ids)
    indexed = {agent: {row["source_id"]: row for row in rows} for agent, rows in responses.items()}
    included, excluded, unresolved, review = [], [], [], []
    for source_id in sorted(source_ids):
        votes = {agent: indexed[agent][source_id] for agent in AGENTS}
        decision = majority([row["decision"] for row in votes.values()])
        record = {"source_id": source_id, "decision": decision or "UNKNOWN", "votes": votes}
        if decision == "INCLUDE":
            named = [row for row in votes.values() if row["decision"] == "INCLUDE"]
            key = majority([name_key(row["english_name"]) for row in named])
            if key is not None:
                name = sorted(
                    clean_name(row["english_name"])
                    for row in named
                    if name_key(row["english_name"]) == key
                )[0]
                included.append({"source_id": source_id, "english_name": name})
                record["english_name"] = name
            else:
                unresolved.append({"source_id": source_id, "reason": "English names disagree"})
                record["decision"] = "UNKNOWN"
        elif decision == "EXCLUDE":
            excluded.append({"source_id": source_id, "reason": "Excluded by majority"})
        else:
            unresolved.append({"source_id": source_id, "reason": "No inclusion majority"})
        review.append(record)
    return included, excluded, unresolved, review, indexed


def _components(included: list[dict], indexed: dict) -> list[list[int]]:
    """세 응답 어디서든 같은 이름을 제안한 원본을 한 검토 묶음으로 모은다."""
    links = {row["source_id"]: row["source_id"] for row in included}

    def find(source_id):
        while links[source_id] != source_id:
            links[source_id] = links[links[source_id]]
            source_id = links[source_id]
        return source_id

    names = {}
    for source_id in links:
        for agent in AGENTS:
            vote = indexed[agent][source_id]
            if vote["decision"] != "INCLUDE":
                continue
            key = name_key(vote["english_name"])
            if key in names:
                links[find(source_id)] = find(names[key])
            else:
                names[key] = source_id
    components = defaultdict(list)
    for source_id in links:
        components[find(source_id)].append(source_id)
    return sorted((sorted(ids) for ids in components.values()), key=lambda ids: ids[0])


def _initial_groups(ids: list[int], indexed: dict) -> dict[str, dict]:
    result = {}
    for agent in AGENTS:
        groups = defaultdict(list)
        unresolved = []
        for source_id in ids:
            vote = indexed[agent][source_id]
            if vote["decision"] == "INCLUDE":
                groups[name_key(vote["english_name"])].append(vote)
            else:
                unresolved.append({"source_id": source_id, "reason": vote["reason"]})
        result[agent] = {
            "groups": [
                {
                    "source_ids": sorted(row["source_id"] for row in rows),
                    "english_name": clean_name(rows[0]["english_name"]),
                    "reason": "Shared name in independent source decisions",
                }
                for rows in groups.values()
            ],
            "unresolved": unresolved,
        }
    return result


def reconcile_groups(responses: dict[str, dict], source_ids: set[int]) -> tuple[list, list]:
    if set(responses) != set(AGENTS):
        raise ValueError("all three group responses are required")
    counts = Counter()
    examples = {}
    for response in responses.values():
        validate_groups(response, source_ids)
        for group in response["groups"]:
            key = (name_key(group["english_name"]), tuple(sorted(group["source_ids"])))
            counts[key] += 1
            examples.setdefault(key, group)
    groups = []
    covered = set()
    for key, count in sorted(counts.items()):
        if count >= 2:
            if covered.intersection(key[1]):
                raise ValueError("majority groups overlap")
            groups.append(
                {
                    "english_name": clean_name(examples[key]["english_name"]),
                    "source_ids": list(key[1]),
                }
            )
            covered.update(key[1])
    unresolved = [
        {"source_id": source_id, "reason": "No matching name and member-set majority"}
        for source_id in sorted(source_ids - covered)
    ]
    return groups, unresolved


def _finish(groups: list, unresolved: list) -> tuple[list, list]:
    name_counts = Counter(name_key(group["english_name"]) for group in groups)
    accepted, pending = [], list(unresolved)
    for group in groups:
        if name_counts[name_key(group["english_name"])] != 1:
            pending.extend(
                {"source_id": source_id, "reason": "Name collision across reviewed groups"}
                for source_id in group["source_ids"]
            )
        else:
            accepted.append(group)
    accepted.sort(key=lambda group: (name_key(group["english_name"]), group["english_name"]))
    return (
        [{"id": index, **group} for index, group in enumerate(accepted, 1)],
        sorted(pending, key=lambda row: row["source_id"]),
    )


def validate_selected(selected: dict) -> None:
    """저장된 세 표로 선정 결과를 다시 계산하고 전체 원본의 처리를 확인한다."""
    sources = selected["sources"]
    source_ids = {row["source_id"] for row in sources}
    if len(source_ids) != len(sources):
        raise ValueError("duplicate source ID")
    records = selected["selection_review"]
    if len(records) != len(sources) or {row["source_id"] for row in records} != source_ids:
        raise ValueError("selection review must cover all source rows")
    responses = {agent: [] for agent in AGENTS}
    for record in records:
        if set(record["votes"]) != set(AGENTS):
            raise ValueError("selection requires three votes")
        for agent in AGENTS:
            vote = record["votes"][agent]
            if vote["source_id"] != record["source_id"]:
                raise ValueError("selection vote has wrong source ID")
            responses[agent].append(vote)
    included, excluded, pending, computed, indexed = reconcile_rows(sources, responses)
    if sorted(records, key=lambda row: row["source_id"]) != computed:
        raise ValueError("recorded selection differs from its votes")
    expected = {tuple(ids) for ids in _components(included, indexed)}
    grouping_review = selected["grouping_review"]
    if len(grouping_review) != len(expected):
        raise ValueError("grouping review is incomplete")
    groups, seen = [], set()
    for record in grouping_review:
        ids = record["source_ids"]
        key = tuple(sorted(ids))
        if len(ids) != len(set(ids)) or key not in expected or key in seen:
            raise ValueError("unexpected or duplicate grouping component")
        seen.add(key)
        if len(ids) == 1:
            if record.get("method") != "source_name" or record["votes"] != _initial_groups(
                ids, indexed
            ):
                raise ValueError("singleton must retain source name votes")
        elif record.get("method") != "group_review":
            raise ValueError("merged ingredients require explicit member-set review")
        decided, unresolved = reconcile_groups(record["votes"], set(ids))
        groups.extend(decided)
        pending.extend(unresolved)
    ingredients, unresolved = _finish(groups, pending)
    if selected["ingredients"] != ingredients or selected["excluded"] != excluded:
        raise ValueError("selected ingredients or exclusions differ from votes")
    if selected["unresolved"] != unresolved:
        raise ValueError("unresolved sources differ from votes")
    final_ids = [i for item in ingredients for i in item["source_ids"]]
    final_ids += [row["source_id"] for row in excluded + unresolved]
    if len(final_ids) != len(set(final_ids)) or set(final_ids) != source_ids:
        raise ValueError("each source must be included, excluded or unresolved exactly once")


def run(
    source: dict,
    work_dir: Path,
    *,
    call_agent,
    batch_size: int = 40,
    max_batches: int | None = None,
) -> dict | None:
    if batch_size < 1 or batch_size > 50:
        raise ValueError("selection batch size must be between 1 and 50")
    all_votes = {agent: [] for agent in AGENTS}
    rows = source["rows"]
    with ThreadPoolExecutor(max_workers=3) as pool:
        for batch_no, start in enumerate(range(0, len(rows), batch_size), 1):
            if max_batches is not None and batch_no > max_batches:
                return None
            batch = rows[start : start + batch_size]
            ids = {row["source_id"] for row in batch}
            prompt = (
                "For EVERY source row decide INCLUDE, EXCLUDE, or UNKNOWN under the policy. "
                "For INCLUDE provide a short American English ingredient name. For other decisions "
                "use an empty english_name. Include a short reason tied to the source description. "
                "Do not infer an unspecified product recipe. Preserve each source_id exactly once.\n"
                + json.dumps(batch, ensure_ascii=False)
            )
            tasks = {
                agent: pool.submit(
                    call_agent,
                    agent,
                    f"selection/batch-{batch_no:04d}",
                    prompt,
                    SELECTION_SCHEMA,
                    lambda payload, expected=ids: validate_selection(payload, expected),
                )
                for agent in AGENTS
            }
            for agent, future in tasks.items():
                all_votes[agent].extend(future.result()["rows"])
            print(f"selection {min(start + batch_size, len(rows))}/{len(rows)}", flush=True)
        included, excluded, unresolved, review, indexed = reconcile_rows(rows, all_votes)
        sources_by_id = {row["source_id"]: row for row in rows}
        groups, grouping_review, pending_groups = [], [], []
        for group_no, ids in enumerate(_components(included, indexed), 1):
            responses = _initial_groups(ids, indexed)
            decided, pending = reconcile_groups(responses, set(ids))
            if len(ids) > 1:
                pending_groups.append({"component_id": group_no, "source_ids": ids})
            else:
                groups.extend(decided)
                unresolved.extend(pending)
                grouping_review.append(
                    {"source_ids": ids, "votes": responses, "method": "source_name"}
                )
        component_schema = {
            **GROUP_SCHEMA,
            "properties": {"component_id": {"type": "integer"}, **GROUP_SCHEMA["properties"]},
            "required": ["component_id", *GROUP_SCHEMA["required"]],
        }
        batch_schema = {
            "type": "object",
            "properties": {"components": {"type": "array", "items": component_schema}},
            "required": ["components"],
            "additionalProperties": False,
        }
        for batch_no, start in enumerate(range(0, len(pending_groups), 20), 1):
            batch = pending_groups[start : start + 20]
            expected = {item["component_id"]: set(item["source_ids"]) for item in batch}

            def validate_batch(payload, expected=expected):
                if not isinstance(payload, dict) or set(payload) != {"components"}:
                    raise ValueError("group batch must contain components")
                if not isinstance(payload["components"], list):
                    raise ValueError("components must be an array")
                seen = set()
                for item in payload["components"]:
                    component_id = item.get("component_id")
                    if type(component_id) is not int or component_id not in expected:
                        raise ValueError("unknown component ID")
                    if component_id in seen:
                        raise ValueError("duplicate component ID")
                    seen.add(component_id)
                    validate_groups(
                        {key: value for key, value in item.items() if key != "component_id"},
                        expected[component_id],
                    )
                if seen != set(expected):
                    raise ValueError("missing component")

            prompt = (
                "These foods have passed ingredient inclusion. Independently partition every "
                "component's source IDs into ingredient groups under the naming policy. "
                "Groups need complete source_ids, English name and a short reason. Put uncertain "
                "IDs in unresolved with a reason. Every source ID belongs to exactly one group "
                "or unresolved within its component. Do not combine different component IDs.\n"
                + json.dumps(
                    [
                        {
                            "component_id": item["component_id"],
                            "sources": [sources_by_id[i] for i in item["source_ids"]],
                        }
                        for item in batch
                    ],
                    ensure_ascii=False,
                )
            )
            tasks = {
                agent: pool.submit(
                    call_agent,
                    agent,
                    f"grouping/batch-{batch_no:04d}",
                    prompt,
                    batch_schema,
                    validate_batch,
                )
                for agent in AGENTS
            }
            responses = {
                agent: {
                    item["component_id"]: {
                        key: value for key, value in item.items() if key != "component_id"
                    }
                    for item in future.result()["components"]
                }
                for agent, future in tasks.items()
            }
            for component in batch:
                component_id, ids = component["component_id"], component["source_ids"]
                votes = {agent: responses[agent][component_id] for agent in AGENTS}
                decided, pending = reconcile_groups(votes, set(ids))
                groups.extend(decided)
                unresolved.extend(pending)
                grouping_review.append(
                    {"source_ids": ids, "votes": votes, "method": "group_review"}
                )
            print(
                f"grouping {min(start + 20, len(pending_groups))}/{len(pending_groups)}", flush=True
            )
    ingredients, unresolved = _finish(groups, unresolved)
    result = {
        "metadata": source["metadata"],
        "sources": rows,
        "ingredients": ingredients,
        "excluded": excluded,
        "unresolved": unresolved,
        "selection_review": review,
        "grouping_review": grouping_review,
    }
    validate_selected(result)
    write_json(work_dir / "selected.json", result)
    return result
