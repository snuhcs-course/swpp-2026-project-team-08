# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
import copy
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

from data.ingredient_restrictions.run_workflow import (
    CATALOG, check_run, decision, derive_status, estimate_relation, NUMERIC, prepare, read, reconcile, run, validate, write,
)


def fake_row(item, rid):
    row = decision(item["ingredient_key"], rid, None, "자료 부족", [])
    if rid in NUMERIC:
        row.update(relation="NEVER", review_status="ESTIMATED",
                   evidence_ids=[item["evidence"][0]["id"]],
                   nutrition_estimate=dict(context="시험 음식 1인분", amount_g=5, per_100g=0,
                                           amount_reason="가상 사용량", composition_reason="가상 추정"))
    return row


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name) / "run"
        prepare(self.folder, CATALOG / "ingredients-reviewed.json", CATALOG / "restrictions.json",
                CATALOG / "docs/restriction-policy.md", CATALOG / "rda-source.json", None, limit=2, assessment_mode="LEGACY_PORTION")

    def test_input_changes_and_overwriting_are_rejected(self):
        (self.folder / "policy.md").write_text("changed")
        with self.assertRaisesRegex(ValueError, "changed"):
            check_run(self.folder)
        with self.assertRaisesRegex(ValueError, "new run"):
            prepare(self.folder, None, None, None, None, None)

    def test_result_requires_complete_keys_and_supplied_evidence(self):
        task = read(self.folder / "tasks/task-0001.json")
        rows = [decision(i["ingredient_key"], task["restriction_id"], None, "정보 부족", [])
                for i in task["ingredients"]]
        answer = {"task_id": task["task_id"], "rows": rows}
        validate(task, answer)
        with self.assertRaisesRegex(ValueError, "missing"):
            validate(task, dict(answer, rows=rows[:1]))
        bad = copy.deepcopy(answer)
        bad["rows"][0].update(relation="NEVER", review_status="DECIDED", evidence_ids=["made-up"])
        with self.assertRaisesRegex(ValueError, "evidence"):
            validate(task, bad)

    def test_numeric_boundaries_and_estimate_validation(self):
        def assumed(value, amount=100):
            return dict(context="음식 1인분", amount_g=amount, per_100g=value,
                        amount_reason="일반 사용량 가정", composition_reason="모델 추정")
        self.assertEqual(estimate_relation("x", "low-sodium", assumed(140)), "NEVER")
        self.assertEqual(estimate_relation("x", "low-sodium", assumed(140.1)), "ALWAYS")
        self.assertEqual(estimate_relation("x", "low-sodium", assumed(500, 5)), "NEVER")
        for invalid in (assumed(float("nan")), assumed(0, 0), {}):
            with self.assertRaises(ValueError):
                estimate_relation("x", "low-sodium", invalid)

    def test_status_is_derived_without_altering_model_relation_or_reason(self):
        task = read(self.folder / "tasks/task-0001.json")
        original = {"rows": [decision("x", task["restriction_id"], "DEPENDS_ON_PRODUCT", "제품 차이", [])]}
        original["rows"][0]["review_status"] = "UNRESOLVED"
        normalized = derive_status(task, original)
        self.assertEqual(normalized["rows"][0]["review_status"], "DECIDED")
        self.assertEqual(normalized["rows"][0]["relation"], "DEPENDS_ON_PRODUCT")
        self.assertEqual(normalized["rows"][0]["reason"], "제품 차이")
        self.assertEqual(original["rows"][0]["review_status"], "UNRESOLVED")

    def test_resume_skips_valid_submissions_without_reading_key(self):
        def respond(prompt, model, key):
            task = __import__("json").JSONDecoder().raw_decode(prompt.split("\nTASK:\n", 1)[1])[0]
            return {"task_id": task["task_id"], "rows": [
                fake_row(i, rid)
                for i in task["ingredients"] for rid in i["restriction_ids"]]}
        module = "data.ingredient_restrictions.run_workflow"
        with patch(module + ".generate", side_effect=respond), patch(module + ".load_api_key", return_value="fake"):
            run(self.folder, ["a"], "fake")
        with patch(module + ".generate") as provider, patch(module + ".load_api_key") as key:
            run(self.folder, ["a"], "fake")
            provider.assert_not_called()
            key.assert_not_called()
        with self.assertRaisesRegex(ValueError, "model changed"):
            run(self.folder, ["a"], "other-model")

    def test_merge_preserves_disagreement_and_derives_combined(self):
        manifest = read(self.folder / "manifest.json")
        for tid in manifest["tasks"]:
            task = read(self.folder / "tasks" / (tid + ".json"))
            for agent in ("a", "b"):
                rows = []
                for item in task["ingredients"]:
                    relation = "ALWAYS" if task["restriction_id"] == "gluten-free" else "NEVER"
                    if task["restriction_id"] == "milk" and agent == "b":
                        relation = None
                    rows.append(fake_row(item, task["restriction_id"]) if task["restriction_id"] in NUMERIC else
                                decision(item["ingredient_key"], task["restriction_id"], relation,
                                         "가짜 판정", [item["evidence"][0]["id"]]))
                write(self.folder / "submissions" / agent / (tid + ".json"),
                      {"answer": {"task_id": tid, "rows": rows}, "model": "fake"})
        summary = reconcile(self.folder)
        self.assertEqual(summary["relations"], 34)
        self.assertEqual(summary["disagreements"], 2)
        rows = read(self.folder / "results/relations.json")["rows"]
        self.assertTrue(all(r["relation"] == "ALWAYS" for r in rows
                            if r["restriction_id"] == "gluten-casein-free"))
        self.assertTrue(all(r["relation"] is None for r in rows if r["restriction_id"] == "milk"))
        self.assertEqual(len({(r["ingredient_key"], r["restriction_id"]) for r in rows}), 34)

    def test_existing_single_restriction_results_are_reused(self):
        task = read(self.folder / "tasks/task-0001.json")
        write(self.folder / "submissions/a/task-0001.json", {
            "model": "fake", "answer": {"task_id": task["task_id"], "rows": [
                fake_row(i, task["restriction_id"]) for i in task["ingredients"]]}})
        module = "data.ingredient_restrictions.run_workflow"
        def respond(prompt, model, key):
            import json
            bundle = json.JSONDecoder().raw_decode(prompt.split("\nTASK:\n", 1)[1])[0]
            self.assertTrue(all(task["restriction_id"] not in i["restriction_ids"]
                                for i in bundle["ingredients"]))
            return {"task_id": bundle["task_id"], "rows": [fake_row(i, rid)
                    for i in bundle["ingredients"] for rid in i["restriction_ids"]]}
        with patch(module + ".generate", side_effect=respond) as api, patch(module + ".load_api_key"):
            run(self.folder, ["a"], "fake")
            self.assertEqual(api.call_count, 1)
        self.assertEqual(len(list((self.folder / "submissions/a").glob("*.json"))), 16)

    def test_parallel_failure_keeps_receipt_and_resume_only_requests_missing(self):
        import json
        import threading
        barrier = threading.Barrier(2)
        module = "data.ingredient_restrictions.run_workflow"
        failed_key = read(self.folder / "inputs.json")["ingredients"][0]["kor_name"]
        def respond(prompt, model, key):
            bundle = json.JSONDecoder().raw_decode(prompt.split("\nTASK:\n", 1)[1])[0]
            barrier.wait(timeout=5)
            if bundle["ingredients"][0]["ingredient_key"] == failed_key:
                raise RuntimeError("quota")
            return {"task_id": bundle["task_id"], "rows": [fake_row(i, rid)
                    for i in bundle["ingredients"] for rid in i["restriction_ids"]]}
        with patch(module + ".generate", side_effect=respond), patch(module + ".load_api_key"):
            with self.assertRaisesRegex(RuntimeError, "quota"):
                run(self.folder, ["a"], "fake", batch_size=1, workers=2)
        self.assertEqual(len(list((self.folder / "bundles/a").glob("*.json"))), 1)
        def resume(prompt, model, key):
            bundle = json.JSONDecoder().raw_decode(prompt.split("\nTASK:\n", 1)[1])[0]
            self.assertEqual([i["ingredient_key"] for i in bundle["ingredients"]], [failed_key])
            return {"task_id": bundle["task_id"], "rows": [fake_row(i, rid)
                    for i in bundle["ingredients"] for rid in i["restriction_ids"]]}
        with patch(module + ".generate", side_effect=resume) as api, patch(module + ".load_api_key"):
            run(self.folder, ["a"], "fake", batch_size=10)
            self.assertEqual(api.call_count, 1)

    def test_bundle_rejects_missing_duplicate_and_invalid_numeric_rows(self):
        from data.ingredient_restrictions.batch_runner import load_progress, plan, validate_bundle
        tasks = [read(p) for p in sorted((self.folder / "tasks").glob("*.json"))]
        completed, mapping = load_progress(self.folder, "a", "fake", tasks, "test")
        bundle = plan(tasks, completed, 10)[0]
        rows = [fake_row(i, rid) for i in bundle["ingredients"] for rid in i["restriction_ids"]]
        answer = {"task_id": bundle["task_id"], "rows": rows}
        validate_bundle(bundle, answer, mapping)
        for invalid in (rows[:-1], rows + rows[:1]):
            with self.assertRaises(ValueError):
                validate_bundle(bundle, dict(answer, rows=invalid), mapping)
        bad = copy.deepcopy(answer)
        next(r for r in bad["rows"] if r["restriction_id"] == "low-sodium")["nutrition_estimate"]["amount_g"] = 0
        with self.assertRaises(ValueError):
            validate_bundle(bundle, bad, mapping)

    def test_dry_run_does_not_call_api_or_save_results(self):
        module = "data.ingredient_restrictions.run_workflow"
        with patch(module + ".generate") as api, patch(module + ".load_api_key") as key:
            result = run(self.folder, ["a", "b"], "fake", dry_run=True)
            self.assertEqual(result["a"]["remaining_requests"], 1)
            api.assert_not_called()
            key.assert_not_called()
        self.assertFalse((self.folder / "submissions").exists())

    def test_name_based_numeric_restrictions_need_no_estimate(self):
        folder = Path(self.temp.name) / "names"
        prepare(folder, CATALOG / "ingredients-reviewed.json", CATALOG / "restrictions.json",
                CATALOG / "docs/restriction-policy.md", CATALOG / "rda-source.json", None, limit=2)
        for path in (folder / "tasks").glob("*.json"):
            task = read(path)
            rows = [decision(i["ingredient_key"], task["restriction_id"], None, "양 정보 필요", [])
                    for i in task["ingredients"]]
            validate(task, {"task_id": task["task_id"], "rows": rows})
            if task["restriction_id"] in NUMERIC:
                rows[0]["nutrition_estimate"] = {}
                with self.assertRaises(ValueError):
                    validate(task, {"task_id": task["task_id"], "rows": rows})
