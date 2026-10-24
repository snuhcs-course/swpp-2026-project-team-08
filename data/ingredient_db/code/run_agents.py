# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Prepare independent RDA reviews, run external agents, and reconcile drafts."""

import argparse
import hashlib
import html
import json
import shlex
import subprocess
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data/ingredient_db"
FIELDS = ("code", "decision", "name_ko", "name_en", "reason", "evidence")
DECISIONS = {"INCLUDE", "EXCLUDE", "UNRESOLVED"}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_source(path):
    rows = json.loads(path.read_text(encoding="utf-8"))["rows"]
    codes = [row["source_record_id"] for row in rows]
    if len(codes) != len(set(codes)) or not rows:
        raise ValueError("RDA rows missing or duplicate source codes")
    return rows


def prepare(source, policy, out, chunk_size, limit=None):
    if chunk_size < 1:
        raise ValueError("chunk size must be positive")
    rows = load_source(source)
    if limit is not None:
        if limit < 1:
            raise ValueError("limit must be positive")
        rows = rows[:limit]
    previous = out / "manifest.json"
    if previous.exists():
        old = json.loads(previous.read_text(encoding="utf-8"))
        if old.get("source_sha256") != digest(source) or old.get("policy_sha256") != digest(policy):
            raise ValueError("source or policy changed; choose a new output directory")
    groups = defaultdict(list)
    for row in rows:
        groups[row["source_category_name"]].append({
            "code": row["source_record_id"], "name_ko": row["name_ko"],
            "name_en": row["name_en"], "scientific_name": row["scientific_name"],
            "category": row["source_category_name"], "locator": row["source_locator"],
        })
    tasks = []
    for category, category_rows in groups.items():
        for offset in range(0, len(category_rows), chunk_size):
            task_id = f"task-{len(tasks) + 1:03d}"
            task = {"task_id": task_id, "category": category,
                    "rows": category_rows[offset:offset + chunk_size]}
            write_json(out / "tasks" / f"{task_id}.json", task)
            tasks.append({"task_id": task_id, "category": category,
                          "count": len(task["rows"]), "codes": [r["code"] for r in task["rows"]]})
    manifest = {"schema_version": 1, "source_path": str(source.resolve()),
                "policy_path": str(policy.resolve()), "source_sha256": digest(source),
                "policy_sha256": digest(policy), "source_rows": len(rows),
                "passes": ["a", "b"], "tasks": tasks}
    if previous.exists() and json.loads(previous.read_text(encoding="utf-8")) != manifest:
        raise ValueError("task layout changed; choose a new output directory")
    write_json(out / "manifest.json", manifest)
    return manifest


def validate_result(task, result):
    if not isinstance(result, dict) or result.get("task_id") != task["task_id"]:
        raise ValueError("wrong task_id")
    rows = result.get("rows")
    if not isinstance(rows, list):
        raise ValueError("rows must be a list")
    expected = {row["code"] for row in task["rows"]}
    seen = set()
    for row in rows:
        if not isinstance(row, dict) or set(row) != set(FIELDS):
            raise ValueError("unexpected result fields")
        code = row["code"]
        if code not in expected or code in seen:
            raise ValueError(f"unexpected or repeated code: {code}")
        seen.add(code)
        if row["decision"] not in DECISIONS:
            raise ValueError(f"invalid decision: {code}")
        if any(not isinstance(row[field], str) for field in FIELDS):
            raise ValueError(f"non-string field: {code}")
        if not row["reason"].strip() or not row["evidence"].strip():
            raise ValueError(f"missing reason/evidence: {code}")
        included = row["decision"] == "INCLUDE"
        if included != bool(row["name_ko"].strip() and row["name_en"].strip()):
            raise ValueError(f"names must be present only for INCLUDE: {code}")
    if seen != expected:
        raise ValueError(f"missing {len(expected - seen)} codes")


def check_manifest(manifest):
    for path_field, hash_field in (("source_path", "source_sha256"),
                                   ("policy_path", "policy_sha256")):
        path = Path(manifest[path_field])
        if not path.exists() or digest(path) != manifest[hash_field]:
            raise ValueError(f"input changed or missing: {path}")


def load_agent_rows(manifest_path, agent_pass):
    """Return every source row with one validated agent's decision."""
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    check_manifest(manifest)
    if agent_pass not in manifest["passes"]:
        raise ValueError("unknown agent pass")
    base = manifest_path.parent
    rows = []
    for entry in manifest["tasks"]:
        task_id = entry["task_id"]
        task = json.loads((base / "tasks" / f"{task_id}.json").read_text(encoding="utf-8"))
        answer = json.loads((base / "submissions" / agent_pass / f"{task_id}.json").read_text(encoding="utf-8"))
        validate_result(task, answer)
        by_code = {row["code"]: row for row in answer["rows"]}
        for source in task["rows"]:
            result = by_code[source["code"]]
            rows.append({"code": source["code"], "decision": result["decision"],
                         "name_ko": result["name_ko"], "name_en": result["name_en"]})
    if len(rows) != manifest["source_rows"] or len({row["code"] for row in rows}) != len(rows):
        raise ValueError("incomplete or duplicate source rows")
    return rows


def run(manifest_path, instruction, command, timeout, passes=None):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    check_manifest(manifest)
    base = manifest_path.parent
    argv = shlex.split(command)
    if not argv or not any("{output}" in part for part in argv):
        raise ValueError("command must contain {output}")
    selected_passes = passes or manifest["passes"]
    if not selected_passes or any(agent_pass not in manifest["passes"] for agent_pass in selected_passes):
        raise ValueError("unknown agent pass")
    completed = 0
    for task in manifest["tasks"]:
        task_path = base / "tasks" / f"{task['task_id']}.json"
        task_data = json.loads(task_path.read_text(encoding="utf-8"))
        for agent_pass in selected_passes:
            output = base / "submissions" / agent_pass / f"{task['task_id']}.json"
            if output.exists():
                validate_result(task_data, json.loads(output.read_text(encoding="utf-8")))
                continue
            output.parent.mkdir(parents=True, exist_ok=True)
            temporary = output.with_suffix(".tmp")
            values = {"task": str(task_path), "output": str(temporary),
                      "instructions": str(instruction), "pass": agent_pass}
            args = [part.format_map(values) for part in argv]
            try:
                subprocess.run(args, check=True, timeout=timeout)
                result = json.loads(temporary.read_text(encoding="utf-8"))
                validate_result(task_data, result)
                temporary.replace(output)
                completed += 1
                print(json.dumps({"completed": completed, "task_id": task["task_id"],
                                  "pass": agent_pass}), flush=True)
            finally:
                temporary.unlink(missing_ok=True)
    return completed


def group_review_rows(rows):
    """Combine repeated answer pairs without dropping source-specific evidence."""
    grouped = defaultdict(list)
    for row in rows:
        a, b = row["a"], row["b"]
        answer = lambda r: tuple(r[k].strip().casefold() for k in ("decision", "name_ko", "name_en"))
        # Empty names do not establish that unrelated unresolved foods are the same.
        unnamed = row["source"]["name_ko"] if not (a["name_ko"] or b["name_ko"]) else ""
        key = (row["review_reason"], row["source"]["category"], answer(a), answer(b), unnamed)
        grouped[key].append(row)
    return [{"review_reason": key[0], "category": key[1], "rows": members}
            for key, members in grouped.items()]


def write_review_markdown(out, groups):
    """Write a fresh review snapshot; callers must never overwrite reviewer notes."""
    out.mkdir(parents=True, exist_ok=False)
    header = "<!-- AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung -->\n"
    sections = [("01-decisions", "포함 여부·한국어 이름", "AGENT_DISAGREEMENT"),
                ("02-unresolved", "보류", "UNRESOLVED"),
                ("03-english", "영어 이름", "ENGLISH_NAME_DIFFERENCE")]
    escape = lambda value: html.escape(str(value)).replace("|", "&#124;").replace("\n", "<br>")
    labels = {"INCLUDE": "포함", "EXCLUDE": "제외", "UNRESOLVED": "보류"}
    index = [header, "# 재료 검토 시작\n", "## 목차\n\n1. 검토 방법\n2. 검토할 파일\n",
             "## 핵심 요약\n\n1. 같은 식품군에서 A/B의 결정과 한영 후보가 같은 행은 한 질문으로 묶었다.\n"
             "2. A/B가 일치한 행은 필수 검토에서 제외하고, 영어만 다른 항목은 별도로 모았다.\n"
             "3. 항목을 묶은 것은 재료 병합이나 승인이 아니다. 원본별 예외는 따로 결정한다.\n",
             "## 검토 방법\n\nA/B 후보를 비교하고 결정 칸에 선택·수정한 이름을 적는다. "
             "묶음의 모든 원본에 적용할 수 없는 결정은 예외 코드를 함께 적는다. "
             "원본·이유·근거는 각 묶음 아래 펼침 영역에서 확인한다.\n\n"
             "검토 메모는 JSON/DB에 자동 반영되지 않는다. 이 파일들은 생성 당시의 정적 사본이다. "
             "일치한 결과도 사실 검증된 것은 아니며, 전체 원문은 실행 폴더의 reconciliation.json에 보존한다.\n",
             "## 검토할 파일\n"]
    for slug, title, reason in sections:
        selected = [g for g in groups if g["review_reason"] == reason]
        folder = out / slug
        folder.mkdir()
        index.append(f"### {title}: {len(selected)}건 / 원본 {sum(len(g['rows']) for g in selected)}행\n")
        for offset in range(0, len(selected), 30):
            filename = f"{offset // 30 + 1:02d}.md"
            index.append(f"- [{offset + 1}–{min(offset + 30, len(selected))}번]({slug}/{filename})\n")
            body = [header, f"# {title}\n", "[검토 목차](../README.md)\n"]
            for number, group in enumerate(selected[offset:offset + 30], offset + 1):
                members = group["rows"]
                first = members[0]
                body.append(f"## {number}. {escape(first['a']['name_ko'] or first['b']['name_ko'] or first['source']['name_ko'])} · {len(members)}행\n")
                body.append(f"식품군: {escape(group['category'])}\n\n| 판단자 | 결정 | 한국어 | 영어 |\n|---|---|---|---|\n")
                for who in ("a", "b"):
                    answer = first[who]
                    body.append("| " + " | ".join(escape(v) for v in (who.upper(), labels[answer["decision"]], answer["name_ko"] or "—", answer["name_en"] or "—")) + " |\n")
                body.append("\n**사람 결정:** 미검토  \n**확정 이름 / 예외 코드 / 이유:** \n\n<details>\n<summary>원본별 판단 근거 펼치기</summary>\n\n")
                for row in members:
                    source = row["source"]
                    body.append(f"- **{row['code']} · {escape(source['name_ko'])}** / {escape(source['name_en'])} / 학명: {escape(source['scientific_name'])}\n")
                    for who in ("a", "b"):
                        body.append(f"  - {who.upper()}: {escape(row[who]['reason'])} (근거: {escape(row[who]['evidence'])})\n")
                    body.append(f"  - 원본 위치: {escape(source['locator'])}\n")
                body.append("\n</details>\n")
            (folder / filename).write_text("\n".join(body), encoding="utf-8")
    (out / "README.md").write_text("\n".join(index), encoding="utf-8")


def reconcile(manifest_path, out, review_out=None):
    if review_out is not None and review_out.exists():
        raise ValueError("review output already exists; choose a new folder to preserve review notes")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    check_manifest(manifest)
    base = manifest_path.parent
    rows = []
    for task in manifest["tasks"]:
        task_data = json.loads((base / "tasks" / f"{task['task_id']}.json").read_text(encoding="utf-8"))
        answers = []
        for agent_pass in manifest["passes"]:
            path = base / "submissions" / agent_pass / f"{task['task_id']}.json"
            result = json.loads(path.read_text(encoding="utf-8"))
            validate_result(task_data, result)
            answers.append({r["code"]: r for r in result["rows"]})
        for source in task_data["rows"]:
            code = source["code"]
            first, second = (answer[code] for answer in answers)
            key = lambda r: (r["decision"], r["name_ko"].strip().casefold(), r["name_en"].strip().casefold())
            agreed = key(first) == key(second)
            rows.append({"code": code, "source": source, "a": first, "b": second,
                         "status": "AGREED_DRAFT" if agreed and first["decision"] != "UNRESOLVED" else "HUMAN_REVIEW",
                         "review_reason": "" if agreed and first["decision"] != "UNRESOLVED" else
                         ("UNRESOLVED" if agreed else "AGENT_DISAGREEMENT")})
    if len(rows) != manifest["source_rows"]:
        raise ValueError("manifest source count mismatch")
    # Repeated source variants with agreed names are not independent review tasks.
    for row in rows:
        a, b = row["a"], row["b"]
        if row["review_reason"] == "AGENT_DISAGREEMENT" and (
            a["decision"] == b["decision"] == "INCLUDE"
            and a["name_ko"].strip().casefold() == b["name_ko"].strip().casefold()
        ):
            row["review_reason"] = "ENGLISH_NAME_DIFFERENCE"
    write_json(out / "reconciliation.json", {"schema_version": 1, "source_sha256": manifest["source_sha256"],
                                                "rows": rows})
    review = [r for r in rows if r["status"] == "HUMAN_REVIEW"]
    write_json(out / "human-review.json", {"schema_version": 1, "rows": review})
    candidate_groups = defaultdict(list)
    for row in rows:
        if row["a"]["decision"] == row["b"]["decision"] == "INCLUDE" and (
            row["a"]["name_ko"].strip().casefold(), row["a"]["name_en"].strip().casefold()
        ) == (
            row["b"]["name_ko"].strip().casefold(), row["b"]["name_en"].strip().casefold()
        ):
            candidate_groups[(row["a"]["name_ko"].strip(), row["a"]["name_en"].strip())].append(row["code"])
    write_json(out / "candidate-groups.json", {"schema_version": 1, "groups": [
        {"name_ko": names[0], "name_en": names[1], "source_codes": codes,
         "status": "UNAPPROVED_DRAFT"}
        for names, codes in sorted(candidate_groups.items())
    ]})
    groups = group_review_rows(review)
    write_json(out / "review-groups.json", {"schema_version": 1, "groups": groups})
    if review_out is not None:
        write_review_markdown(review_out, groups)
    return {"total": len(rows), "agreed_draft": len(rows) - len(review),
            "human_review": len(review), "review_groups": len(groups)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    prep = sub.add_parser("prepare")
    prep.add_argument("--source", type=Path, default=DATA_DIR / "rda-source.json")
    prep.add_argument("--policy", type=Path, default=DATA_DIR / "docs" / "classification-policy.md")
    prep.add_argument("--out", type=Path, required=True)
    prep.add_argument("--chunk-size", type=int, default=60)
    prep.add_argument("--limit", type=int, help="process only the first N RDA rows for a trial")
    execute = sub.add_parser("run")
    execute.add_argument("--manifest", type=Path, required=True)
    execute.add_argument("--instructions", type=Path, required=True)
    execute.add_argument("--agent-command", required=True)
    execute.add_argument("--timeout", type=int, default=900)
    execute.add_argument("--passes", nargs="+", choices=["a", "b"], help="run only selected passes")
    merge = sub.add_parser("reconcile")
    merge.add_argument("--manifest", type=Path, required=True)
    merge.add_argument("--out", type=Path, required=True)
    merge.add_argument("--review-out", type=Path, help="new folder for grouped Markdown review; never overwrites notes")
    args = parser.parse_args()
    if args.command == "prepare":
        value = prepare(args.source, args.policy, args.out, args.chunk_size, args.limit)
        print(json.dumps({"tasks": len(value["tasks"]), "rows": value["source_rows"]}))
    elif args.command == "run":
        print(json.dumps({"completed": run(args.manifest, args.instructions, args.agent_command,
                                            args.timeout, args.passes)}))
    else:
        print(json.dumps(reconcile(args.manifest, args.out, args.review_out)))


if __name__ == "__main__":
    main()
