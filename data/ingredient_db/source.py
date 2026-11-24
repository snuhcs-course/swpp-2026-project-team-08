# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: USDA SR Legacy 원본 수집과 식품 식별자 검증

"""SR Legacy CSV에서 분류에 필요한 식품 이름과 출처를 읽는다."""

import csv
import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

SOURCE_URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"


def read_archive(path: Path) -> dict:
    with ZipFile(path) as archive:

        def table(filename: str) -> list[dict]:
            matches = [name for name in archive.namelist() if name.rsplit("/", 1)[-1] == filename]
            if len(matches) != 1:
                raise ValueError(f"expected one {filename} in archive")
            with archive.open(matches[0]) as stream:
                return list(csv.DictReader(io.TextIOWrapper(stream, encoding="utf-8-sig")))

        categories = {row["id"]: row["description"] for row in table("food_category.csv")}
        numbers = {row["fdc_id"]: row["NDB_number"] for row in table("sr_legacy_food.csv")}
        foods = table("food.csv")
    rows = []
    seen = set()
    for food in foods:
        source_id = int(food["fdc_id"])
        if source_id <= 0 or source_id in seen:
            raise ValueError(f"invalid or duplicate source ID: {source_id}")
        if food["data_type"] != "sr_legacy_food":
            raise ValueError("archive contains a different data type")
        if not food["description"].strip():
            raise ValueError(f"missing food description: {source_id}")
        seen.add(source_id)
        rows.append(
            {
                "source_id": source_id,
                "description": food["description"],
                "category_id": int(food["food_category_id"]),
                "category": categories[food["food_category_id"]],
                "ndb_number": numbers[food["fdc_id"]],
                "data_type": food["data_type"],
            }
        )
    if not rows or len(numbers) != len(rows):
        raise ValueError("food and SR Legacy tables must cover the same rows")
    rows.sort(key=lambda row: (row["category_id"], row["description"], row["source_id"]))
    return {
        "metadata": {
            "url": SOURCE_URL,
            "release": "2018-04",
            "archive_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "row_count": len(rows),
            "license": "CC0-1.0",
        },
        "rows": rows,
    }


def prepare(work_dir: Path, *, archive_path: Path | None = None) -> dict:
    work_dir.mkdir(parents=True, exist_ok=True)
    path = archive_path or work_dir / "sr-legacy-2018-04.zip"
    if not path.exists():
        temporary = path.with_suffix(".download")
        try:
            with urlopen(SOURCE_URL, timeout=120) as response, temporary.open("wb") as output:
                while chunk := response.read(1024 * 1024):
                    output.write(chunk)
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
    result = read_archive(path)
    destination = work_dir / "source.json"
    if destination.exists():
        if json.loads(destination.read_text(encoding="utf-8")) != result:
            raise ValueError("source changed; use a new work directory")
    else:
        destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    return result
