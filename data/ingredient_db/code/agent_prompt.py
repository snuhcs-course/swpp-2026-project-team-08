# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Build the shared RDA classification prompt for Gemini."""

import json


def build_prompt(task_path, instructions_path, policy_path):
    task = json.loads(task_path.read_text(encoding="utf-8"))
    instructions = instructions_path.read_text(encoding="utf-8")
    section = instructions.split("## 에이전트 지시문\n", 1)
    if len(section) != 2:
        raise ValueError("agent instruction section missing")
    quoted = [line[2:] for line in section[1].split("## 병합과 사람 검토", 1)[0].splitlines()
              if line.startswith("> ")]
    if not quoted:
        raise ValueError("agent instruction block missing")
    prompt = "\n\n".join([
        "Return exactly one JSON object. Do not use Markdown fences or commentary.",
        "The output schema has only code, decision, name_ko, name_en, reason, evidence. "
        "Do not assign A/E/U category codes; those headings in the reference policy are only context.",
        f"Output task_id must be exactly {task['task_id']}. Return exactly {len(task['rows'])} rows, "
        "one for each input code. Use empty names for EXCLUDE and UNRESOLVED.",
        "REFERENCE POLICY (use for inclusion boundaries; the task instructions below govern name merging):",
        policy_path.read_text(encoding="utf-8"),
        "TASK INSTRUCTIONS:",
        "\n".join(quoted),
        "TASK JSON:\n" + json.dumps(task, ensure_ascii=False),
        "FINAL OUTPUT CONTRACT: For every row, decision must be exactly one of INCLUDE, EXCLUDE, "
        "UNRESOLVED. Never output ACCEPT, MERGE, A01/E01/U01 or any policy heading as a decision. "
        "An item that should be merged under one display name still has decision INCLUDE. "
        "Use only code, decision, name_ko, name_en, reason, evidence in each row.",
    ])
    return task, prompt
