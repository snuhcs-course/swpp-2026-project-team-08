# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
import json
import tempfile
import unittest
from pathlib import Path

from data.ingredient_db.code.agent_prompt import build_prompt
from data.ingredient_db.code.run_agents import prepare, reconcile, run, validate_result


class AgentWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "rda-source.json"
        self.policy = self.root / "policy.md"
        self.policy.write_text("draft policy", encoding="utf-8")
        rows = [{"source_record_id": code, "name_ko": name,
                 "name_en": "Potato", "scientific_name": "",
                 "source_category_name": "채소", "source_locator": code}
                for code, name in [("A", "감자, 생것"), ("B", "감자, 삶은것")]]
        self.source.write_text(json.dumps({"rows": rows}, ensure_ascii=False), encoding="utf-8")
        self.out = self.root / "build"
        self.manifest = prepare(self.source, self.policy, self.out, 10)
        self.task = json.loads((self.out / "tasks/task-001.json").read_text(encoding="utf-8"))

    def answer(self, name="감자"):
        return {"task_id": "task-001", "rows": [
            {"code": code, "decision": "INCLUDE", "name_ko": name, "name_en": "Potato",
             "reason": "같은 원물", "evidence": "RDA 원문"} for code in ("A", "B")
        ]}

    def submit(self, agent_pass, answer):
        path = self.out / "submissions" / agent_pass / "task-001.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(answer, ensure_ascii=False), encoding="utf-8")

    def test_complete_submission_required(self):
        incomplete = self.answer()
        incomplete["rows"].pop()
        with self.assertRaisesRegex(ValueError, "missing"):
            validate_result(self.task, incomplete)

    def test_matching_names_are_candidates_without_mandatory_review(self):
        self.submit("a", self.answer())
        self.submit("b", self.answer())
        result = reconcile(self.out / "manifest.json", self.out / "reconciled")
        self.assertEqual(result["human_review"], 0)
        groups = json.loads((self.out / "reconciled/candidate-groups.json").read_text(encoding="utf-8"))
        self.assertEqual(groups["groups"][0]["source_codes"], ["A", "B"])

    def test_disagreement_requires_review(self):
        first = self.answer()
        first["rows"][1]["name_ko"] = "고구마"
        second = self.answer()
        second["rows"][0]["name_ko"] = "토마토"
        second["rows"][1]["name_ko"] = "고구마"
        self.submit("a", first)
        self.submit("b", second)
        result = reconcile(self.out / "manifest.json", self.out / "reconciled")
        self.assertEqual(result["human_review"], 1)
        review = json.loads((self.out / "reconciled/human-review.json").read_text(encoding="utf-8"))
        self.assertEqual(review["rows"][0]["code"], "A")
        self.assertEqual(review["rows"][0]["review_reason"], "AGENT_DISAGREEMENT")

    def test_repeated_english_difference_is_one_question_with_all_evidence(self):
        self.submit("a", self.answer())
        second = self.answer()
        for row in second["rows"]:
            row["name_en"] = "Potatoes"
        self.submit("b", second)
        review_out = self.root / "review"
        result = reconcile(self.out / "manifest.json", self.out / "reconciled", review_out)
        self.assertEqual(result["review_groups"], 1)
        groups = json.loads((self.out / "reconciled/review-groups.json").read_text())["groups"]
        self.assertEqual(groups[0]["review_reason"], "ENGLISH_NAME_DIFFERENCE")
        self.assertEqual([r["code"] for r in groups[0]["rows"]], ["A", "B"])
        page = (review_out / "03-english/01.md").read_text()
        self.assertEqual(page.count("**사람 결정:**"), 1)
        self.assertIn("A · 감자, 생것", page)
        self.assertIn("B · 감자, 삶은것", page)
        with self.assertRaisesRegex(ValueError, "already exists"):
            reconcile(self.out / "manifest.json", self.out / "reconciled", review_out)
        self.assertEqual((review_out / "03-english/01.md").read_text(), page)

    def test_unnamed_unresolved_foods_are_not_combined(self):
        result = self.answer()
        for row in result["rows"]:
            row.update(decision="UNRESOLVED", name_ko="", name_en="")
        self.submit("a", result)
        self.submit("b", result)
        summary = reconcile(self.out / "manifest.json", self.out / "reconciled")
        self.assertEqual(summary["review_groups"], 2)

    def test_a_only_skips_valid_a_without_needing_b(self):
        self.submit("a", self.answer())
        self.assertEqual(run(self.out / "manifest.json", self.policy,
                             "agent --output {output}", 10, ["a"]), 0)

    def test_prompt_uses_instruction_block_without_document_examples(self):
        instructions = self.root / "instructions.md"
        instructions.write_text("## 에이전트 지시문\n> 실제 지시\n## 병합과 사람 검토\n"
                                "예시 task-999\n", encoding="utf-8")
        task, prompt = build_prompt(self.out / "tasks/task-001.json", instructions, self.policy)
        self.assertEqual(task["task_id"], "task-001")
        self.assertIn("실제 지시", prompt)
        self.assertNotIn("task-999", prompt)


if __name__ == "__main__":
    unittest.main()
