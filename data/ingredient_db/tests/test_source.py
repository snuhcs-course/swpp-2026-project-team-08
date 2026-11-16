# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: USDA CSV 필드와 원본 누락·중복 검사

import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from data.ingredient_db.source import read_archive


class SourceTests(unittest.TestCase):
    def archive(self, path, foods):
        with ZipFile(path, "w") as archive:
            archive.writestr(
                "release/food.csv", "fdc_id,data_type,description,food_category_id\n" + foods
            )
            archive.writestr("release/food_category.csv", "id,code,description\n1,0100,Grains\n")
            archive.writestr("release/sr_legacy_food.csv", "fdc_id,NDB_number\n100,02000\n")

    def test_reads_original_ids_names_categories_and_archive_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "foods.zip"
            self.archive(path, '100,sr_legacy_food,"Rice, raw",1\n')
            result = read_archive(path)
        self.assertEqual(result["metadata"]["row_count"], 1)
        self.assertEqual(result["metadata"]["release"], "2018-04")
        self.assertEqual(len(result["metadata"]["archive_sha256"]), 64)
        self.assertEqual(result["rows"][0]["ndb_number"], "02000")
        self.assertEqual(result["rows"][0]["description"], "Rice, raw")

    def test_rejects_wrong_type_duplicate_ids_and_blank_names(self):
        for foods in (
            "100,foundation_food,Rice,1\n",
            "100,sr_legacy_food, ,1\n",
            "100,sr_legacy_food,Rice,1\n100,sr_legacy_food,Rice,1\n",
        ):
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "foods.zip"
                self.archive(path, foods)
                with self.assertRaises(ValueError):
                    read_archive(path)


if __name__ == "__main__":
    unittest.main()
