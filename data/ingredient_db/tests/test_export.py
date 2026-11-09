# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: JSONL 재현·검토 집계와 불완전한 기록의 출력 차단

import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from data.ingredient_db.export import (
    FILENAMES,
    check,
    export_catalog,
    export_from_review,
    render,
)
from data.ingredient_db.restrictions import AGENTS, RESTRICTION_TYPES, reconcile
from data.ingredient_db.runner import digest
from data.ingredient_db.tests.test_restrictions import selected_fixture


def review_fixture():
    selected = selected_fixture()
    ingredients = selected["ingredients"]
    responses = {
        agent: {
            "rows": [
                {
                    "ingredient_id": 1,
                    "restriction_type": kind,
                    "degree": "NEVER",
                    "reason": "Single grain identity in source description.",
                }
                for kind in RESTRICTION_TYPES
            ]
        }
        for agent in AGENTS
    }
    return {
        **selected,
        "schema_version": 1,
        "metadata": {
            "model": "fixture-model",
            "agents": list(AGENTS),
            "policy_sha256": hashlib.sha256(b"fixture policy").hexdigest(),
            "source": selected["metadata"],
            "source_sha256": digest(
                {"metadata": selected["metadata"], "rows": selected["sources"]}
            ),
        },
        "restriction_votes": reconcile(ingredients, responses),
    }


class ExportTests(unittest.TestCase):
    def test_summary_counts_distinguish_majority_splits_and_three_way_disagreements(self):
        review = review_fixture()
        source = review["metadata"]["source"]
        source.update(release="2018-04", license="CC0-1.0")
        review["metadata"]["source_sha256"] = digest(
            {"metadata": source, "rows": review["sources"]}
        )
        first, second, third = review["restriction_votes"][:3]
        first["votes"]["c"]["degree"] = "ALWAYS"
        for agent in ("a", "b"):
            second["votes"][agent]["degree"] = "UNKNOWN"
        second["degree"] = "UNKNOWN"
        third["votes"]["a"]["degree"] = "ALWAYS"
        third["votes"]["b"]["degree"] = "DEPENDS_ON_PRODUCT"
        third["degree"] = "UNKNOWN"
        _, summary = render(review)
        self.assertEqual(summary["two_to_one_restrictions"], 2)
        self.assertEqual(summary["three_way_restrictions"], 1)
        self.assertEqual(summary["restriction_counts"][first["restriction_type"]]["NEVER"], 1)
        self.assertEqual(summary["restriction_counts"][second["restriction_type"]]["UNKNOWN"], 1)
        self.assertTrue(
            all(sum(counts.values()) == 1 for counts in summary["restriction_counts"].values())
        )
        self.assertEqual(summary["included_sources"], 1)
        self.assertEqual(
            summary["source_rows"],
            summary["included_sources"]
            + summary["excluded_sources"]
            + summary["unresolved_sources"],
        )
        self.assertEqual(
            summary["provenance"],
            {"model": "fixture-model", "source_release": "2018-04", "license": "CC0-1.0"},
        )
        example = summary["restriction_disagreement_examples"][0]
        self.assertEqual(example["ingredient_name"], "Rice")
        self.assertEqual(example["votes"], {"a": "NEVER", "b": "NEVER", "c": "ALWAYS"})
        self.assertEqual(example["final"], "NEVER")

    def test_disagreement_examples_are_bounded_and_derived_from_saved_votes(self):
        review = review_fixture()
        for row in review["restriction_votes"]:
            row["votes"]["c"]["degree"] = "ALWAYS"
        review["selection_review"][0]["votes"]["c"]["english_name"] = "White rice"
        review["grouping_review"][0]["votes"]["c"]["groups"][0]["english_name"] = "White rice"
        _, summary = render(review)
        self.assertEqual(summary["two_to_one_restrictions"], 19)
        self.assertEqual(len(summary["restriction_disagreement_examples"]), 10)
        self.assertEqual(summary["source_name_disagreements"], 1)
        self.assertEqual(
            summary["source_name_disagreement_examples"],
            [
                {
                    "source_id": 123,
                    "description": "Rice, white",
                    "names": {"a": "Rice", "b": "Rice", "c": "White rice"},
                    "final": "Rice",
                }
            ],
        )
        review["restriction_votes"].reverse()
        review["selection_review"].reverse()
        self.assertEqual(render(review)[1], summary)

    def test_exact_fields_and_deterministic_bytes(self):
        review = review_fixture()
        files, summary = render(review)
        self.assertEqual(
            files["ingredients.jsonl"],
            b'{"id":1,"english_name":"Rice","korean_name":null}\n',
        )
        rows = [json.loads(line) for line in files["ingredients_restrictions.jsonl"].splitlines()]
        self.assertEqual(len(rows), 19)
        self.assertTrue(
            all(set(row) == {"ingredient_id", "restriction_type", "degree"} for row in rows)
        )
        self.assertEqual(summary["agent_votes"], 57)
        self.assertEqual(summary["restrictions"] + summary["unresolved_restrictions"], 19)
        shuffled = copy.deepcopy(review)
        shuffled["restriction_votes"].reverse()
        self.assertEqual(render(shuffled), (files, summary))

    def test_unknown_and_three_way_split_do_not_create_relation_rows(self):
        review = review_fixture()
        first, second = review["restriction_votes"][:2]
        for agent in ("a", "b"):
            first["votes"][agent]["degree"] = "UNKNOWN"
        first["degree"] = "UNKNOWN"
        second["votes"]["a"]["degree"] = "ALWAYS"
        second["votes"]["b"]["degree"] = "DEPENDS_ON_PRODUCT"
        second["degree"] = "UNKNOWN"
        files, summary = render(review)
        self.assertEqual(summary["unresolved_restrictions"], 2)
        self.assertEqual(len(files["ingredients_restrictions.jsonl"].splitlines()), 17)
        self.assertNotIn(b'"UNKNOWN"', files["ingredients_restrictions.jsonl"])

    def test_missing_or_extra_agent_cannot_be_exported(self):
        for modification in ("remove", "add"):
            review = review_fixture()
            votes = review["restriction_votes"][0]["votes"]
            if modification == "remove":
                del votes["c"]
            else:
                votes["retry-a"] = copy.deepcopy(votes["a"])
            with self.subTest(modification=modification), self.assertRaises(ValueError):
                render(review)

    def test_missing_pair_or_changed_majority_is_rejected(self):
        for modification in ("missing", "changed"):
            review = review_fixture()
            if modification == "missing":
                review["restriction_votes"].pop()
            else:
                review["restriction_votes"][0]["degree"] = "ALWAYS"
            with self.subTest(modification=modification), self.assertRaises(ValueError):
                render(review)

    def test_missing_source_mapping_is_rejected(self):
        review = review_fixture()
        review["sources"] = []
        with self.assertRaises(ValueError):
            render(review)

    def test_missing_source_selection_vote_is_rejected(self):
        for modification in ("all", "one"):
            review = review_fixture()
            if modification == "all":
                review["selection_review"] = []
            else:
                del review["selection_review"][0]["votes"]["c"]
            with self.subTest(modification=modification), self.assertRaises(ValueError):
                render(review)

    def test_ingredient_cannot_be_changed_without_matching_group_votes(self):
        for field, value in [("english_name", "Wheat"), ("source_ids", [124])]:
            review = review_fixture()
            review["ingredients"][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                render(review)

    def test_missing_excluded_source_or_group_vote_is_rejected(self):
        for modification in ("excluded", "grouping"):
            review = review_fixture()
            if modification == "excluded":
                review["excluded"] = []
            else:
                del review["grouping_review"][0]["votes"]["b"]
            with self.subTest(modification=modification), self.assertRaises(ValueError):
                render(review)

    def test_source_modification_invalidates_provenance(self):
        review = review_fixture()
        review["sources"][0]["description"] = "Wheat, whole"
        with self.assertRaisesRegex(ValueError, "source data differs"):
            render(review)

    def test_incomplete_review_leaves_previous_results_untouched(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "result"
            export_catalog(review_fixture(), output)
            before = {name: (output / name).read_bytes() for name in FILENAMES}
            incomplete = review_fixture()
            incomplete["restriction_votes"].pop()
            with self.assertRaises(ValueError):
                export_catalog(incomplete, output)
            self.assertEqual({name: (output / name).read_bytes() for name in FILENAMES}, before)

    def test_review_alone_can_regenerate_and_check_both_files(self):
        with tempfile.TemporaryDirectory() as folder:
            folder = Path(folder)
            review_path = folder / "review" / "catalog.json"
            review_path.parent.mkdir()
            review_path.write_text(json.dumps(review_fixture()))
            output = folder / "result"
            first = export_from_review(review_path, output)
            before = {name: (output / name).read_bytes() for name in FILENAMES}
            self.assertEqual(check(review_path, output), first)
            for name in FILENAMES:
                (output / name).unlink()
            second = export_from_review(review_path, output)
            self.assertEqual(first, second)
            self.assertEqual({name: (output / name).read_bytes() for name in FILENAMES}, before)
            self.assertEqual({path.name for path in output.iterdir()}, set(FILENAMES))

    def test_extra_file_is_not_silently_deleted(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder)
            extra = output / "notes.txt"
            extra.write_text("Keep this")
            with self.assertRaises(ValueError):
                export_catalog(review_fixture(), output)
            self.assertEqual(extra.read_text(), "Keep this")

    def test_replace_failure_restores_previous_files_and_allows_retry(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "result"
            export_catalog(review_fixture(), output)
            before = {name: (output / name).read_bytes() for name in FILENAMES}
            modified = review_fixture()
            row = modified["restriction_votes"][0]
            row["degree"] = "ALWAYS"
            for vote in row["votes"].values():
                vote["degree"] = "ALWAYS"
            original_replace = Path.replace

            def fail_second(path, target):
                if path.name == FILENAMES[1]:
                    raise OSError("simulated write failure")
                return original_replace(path, target)

            with patch.object(Path, "replace", fail_second), self.assertRaises(OSError):
                export_catalog(modified, output)
            self.assertEqual({name: (output / name).read_bytes() for name in FILENAMES}, before)
            export_catalog(modified, output)
            self.assertEqual({path.name for path in output.iterdir()}, set(FILENAMES))

    def test_abandoned_sibling_staging_does_not_block_export(self):
        with tempfile.TemporaryDirectory() as folder:
            folder = Path(folder)
            abandoned = folder / ".ingredient-export-interrupted"
            abandoned.mkdir()
            (abandoned / FILENAMES[0]).write_bytes(b"partial")
            export_catalog(review_fixture(), folder / "result")
            self.assertEqual((abandoned / FILENAMES[0]).read_bytes(), b"partial")

    def test_check_detects_changed_jsonl_or_summary(self):
        for target in ("jsonl", "summary"):
            with self.subTest(target=target), tempfile.TemporaryDirectory() as folder:
                folder = Path(folder)
                review_path = folder / "catalog.json"
                review_path.write_text(json.dumps(review_fixture()))
                output = folder / "result"
                export_from_review(review_path, output)
                path = output / FILENAMES[0] if target == "jsonl" else folder / "summary.json"
                path.write_text("{}\n")
                with self.assertRaises(ValueError):
                    check(review_path, output)


if __name__ == "__main__":
    unittest.main()
