# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 기존 선정 응답의 출처 보존과 누락 슬롯 재개

"""Reuse explicitly imported selection votes without relabeling their policy or model."""

import json
from concurrent.futures import FIRST_COMPLETED, wait
from copy import deepcopy
from pathlib import Path

from .runner import AGENTS, digest, write_json


def import_votes(previous: Path, work: Path, source: dict) -> dict:
    from .selection import decode_selection

    original = json.loads((previous / "source.json").read_text())
    manifest = json.loads((previous / "manifest.json").read_text())
    if original != source or manifest["source_sha256"] != digest(source):
        raise ValueError("reuse requires the same complete source dataset")
    ids = {row["source_id"] for row in source["rows"]}
    votes = {agent: {} for agent in AGENTS}
    parent_path = previous / "reused_selection.json"
    parent = json.loads(parent_path.read_text()) if parent_path.exists() else None
    if parent:
        validate_reuse(parent, source["rows"])
        votes = {a: {r["source_id"]: deepcopy(r) for r in parent["votes"][a]} for a in AGENTS}
    files = []
    for agent in AGENTS:
        for path in sorted((previous / "submissions/selection" / agent).glob("*.json")):
            if path.name.endswith(".invalid.json"):
                continue
            cached = json.loads(path.read_text())
            wire = cached["response"]["rows"]
            batch_ids = (
                {int(r["i"]) for r in wire} if isinstance(wire, list) else {int(k) for k in wire}
            )
            if not batch_ids or not batch_ids <= ids or not cached.get("fingerprint"):
                raise ValueError("invalid imported selection cache")
            rows = decode_selection(cached["response"], batch_ids)
            if set(votes[agent]).intersection(batch_ids):
                raise ValueError("duplicate imported agent/source vote")
            votes[agent].update({row["source_id"]: row for row in rows})
            files.append(
                {
                    "agent": agent,
                    "file": path.name,
                    "sha256": digest(cached),
                    "fingerprint": cached["fingerprint"],
                }
            )
    record = {
        "metadata": manifest,
        "files": files,
        "votes": {agent: [rows[i] for i in sorted(rows)] for agent, rows in votes.items()},
    }
    if parent:
        record["parent"] = parent
    path = work / "reused_selection.json"
    if path.exists() and json.loads(path.read_text()) != record:
        raise ValueError("imported selection snapshot changed")
    write_json(path, record)
    return record


def validate_reuse(record, source_rows, selection_review=None):
    from .selection import validate_selection

    if "parent" in record:
        parent = record["parent"]
        validate_reuse(parent, source_rows, selection_review)
        for agent in AGENTS:
            current = {r["source_id"]: r for r in record["votes"][agent]}
            if any(current.get(r["source_id"]) != r for r in parent["votes"][agent]):
                raise ValueError("reused parent vote was changed")
    metadata = record["metadata"]
    if digest({"metadata": metadata["source"], "rows": source_rows}) != metadata["source_sha256"]:
        raise ValueError("reused votes belong to different sources")
    if set(record["votes"]) != set(AGENTS):
        raise ValueError("reuse must identify all three agents")
    source_ids = {row["source_id"] for row in source_rows}
    reviewed = {row["source_id"]: row["votes"] for row in selection_review or []}
    for agent, rows in record["votes"].items():
        ids = {row["source_id"] for row in rows}
        if not ids <= source_ids:
            raise ValueError("unknown reused source")
        validate_selection({"rows": rows}, ids)
        if selection_review is not None:
            for row in rows:
                if reviewed[row["source_id"]][agent] != row:
                    raise ValueError("reused vote was changed")


def collect_missing(rows, record, *, pool, call_agent, batch_size):
    from .selection import build_prompt, decode_selection, selection_schema

    validate_reuse(record, rows)
    votes = {
        agent: {row["source_id"]: deepcopy(row) for row in record["votes"][agent]}
        for agent in AGENTS
    }
    queues = {}
    for agent in AGENTS:
        missing = [row for row in rows if row["source_id"] not in votes[agent]]
        queues[agent] = [missing[i : i + batch_size] for i in range(0, len(missing), batch_size)]
    tasks = iter(
        (agent, queues[agent][number])
        for number in range(max(map(len, queues.values()), default=0))
        for agent in AGENTS
        if number < len(queues[agent])
    )
    pending = {}

    def submit_next():
        task = next(tasks, None)
        if task is None:
            return
        agent, batch = task
        ids = {row["source_id"] for row in batch}
        task_id = "selection/remaining-" + digest(sorted(ids))[:20]
        future = pool.submit(
            call_agent,
            agent,
            task_id,
            build_prompt(batch),
            selection_schema(ids),
            lambda payload, expected=ids: decode_selection(payload, expected),
        )
        pending[future] = agent, ids

    for _ in AGENTS:
        submit_next()
    try:
        while pending:
            completed, _ = wait(pending, return_when=FIRST_COMPLETED)
            for future in completed:
                agent, ids = pending.pop(future)
                votes[agent].update(
                    {row["source_id"]: row for row in decode_selection(future.result(), ids)}
                )
                done = len(set.intersection(*(set(v) for v in votes.values())))
                print(f"selection {done}/{len(rows)}", flush=True)
            for _ in completed:
                submit_next()
    except BaseException:
        for future in pending:
            future.cancel()
        raise
    return {agent: [items[i] for i in sorted(items)] for agent, items in votes.items()}
