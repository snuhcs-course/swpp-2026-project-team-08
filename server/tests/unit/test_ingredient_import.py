# AI-generated with GPT-6, 2026-11-20, reviewed by Haechan Jung
# Changed: 재료 입력 검증과 통합 CLI의 파일 검사·명령 선택 검증

"""JSONL 검증과 CLI 모드 선택은 DB 연결 없이 확인한다."""

import json

import pytest

from scripts.ingredient_catalog import cli
from scripts.ingredient_catalog.load import read_catalog, validate

RICE = {"id": 1, "korean_name": None, "english_name": "Rice"}
SAFE = {"ingredient_id": 1, "restriction_type": "ALLERGY.EGGS", "degree": "NEVER"}


@pytest.mark.parametrize(
    "ingredients,restrictions",
    [
        ([], []),
        ([{**RICE, "id": True}], []),
        ([{**RICE, "id": 0}], []),
        ([{**RICE, "id": -1}], []),
        ([{**RICE, "id": 2**63}], []),
        ([{**RICE, "id": 1.0}], []),
        ([{**RICE, "id": "1"}], []),
        ([{**RICE, "english_name": " "}], []),
        ([{**RICE, "english_name": None}], []),
        ([{**RICE, "korean_name": "쌀"}], []),
        ([{"id": 1, "english_name": "Rice"}], []),
        ([{**RICE, "source": "USDA"}], []),
        ([RICE, {**RICE, "english_name": "Milk"}], []),
        ([RICE, {**RICE, "id": 2, "english_name": " RICE "}], []),
        ([RICE], [{**SAFE, "ingredient_id": True}]),
        ([RICE], [{**SAFE, "ingredient_id": 9}]),
        ([RICE], [{**SAFE, "restriction_type": "ALLERGY.UNKNOWN"}]),
        ([RICE], [{**SAFE, "restriction_type": "ALLERGY.NONE"}]),
        ([RICE], [{**SAFE, "degree": "UNKNOWN"}]),
        ([RICE], [SAFE, SAFE]),
        ([RICE], [{**SAFE, "note": "extra field"}]),
    ],
    ids=[
        "빈_카탈로그",
        "불리언_ID",
        "0_ID",
        "음수_ID",
        "BIGINT_초과",
        "실수_ID",
        "문자열_ID",
        "빈_영어_이름",
        "이름_null",
        "한국어_이름",
        "누락_필드",
        "추가_필드",
        "중복_ID",
        "정규화_중복_이름",
        "판정_불리언_ID",
        "고아_판정",
        "없는_제한",
        "알러지_없음",
        "미판정_enum",
        "중복_판정",
        "판정_추가_필드",
    ],
)
def test_잘못된_입력은_거절한다(ingredients, restrictions):
    with pytest.raises(ValueError):
        validate(ingredients, restrictions)


def test_미판정_행은_생략할_수_있다():
    names, judgements = validate([RICE], [])
    assert names == {1: "Rice"}
    assert judgements == []


@pytest.mark.parametrize("name", ["쌀", "Рис", "Rice\n", "Rice\x00", "Rice\u200b", "123 (2%)"])
def test_영어가_아닌_글자와_제어문자_및_숫자만_있는_이름은_거절한다(name):
    with pytest.raises(ValueError, match="invalid ingredient row"):
        validate([{**RICE, "english_name": name}], [])


@pytest.mark.parametrize("name", ["Jalapeño", "Crème fraîche", "Milk (2% fat)", "Baker's yeast"])
def test_악센트와_숫자_및_구두점이_있는_영어_이름을_허용한다(name):
    names, judgements = validate([{**RICE, "english_name": name}], [])
    assert names == {1: name}
    assert judgements == []


@pytest.mark.parametrize(
    "filename,row",
    [
        ("ingredients.jsonl", '{"id":1,"id":2,"korean_name":null,"english_name":"Rice"}'),
        (
            "ingredients_restrictions.jsonl",
            '{"ingredient_id":1,"restriction_type":"ALLERGY.EGGS",'
            '"degree":"ALWAYS","degree":"NEVER"}',
        ),
    ],
    ids=["재료_ID_덮어쓰기", "제한_판정_덮어쓰기"],
)
def test_중복_JSON_키로_앞의_값을_덮어쓸_수_없다(tmp_path, filename, row):
    ingredients, restrictions = write_files(tmp_path)
    (tmp_path / filename).write_text(row + "\n", encoding="utf-8")
    with pytest.raises(ValueError, match="duplicate JSON key"):
        read_catalog(ingredients, restrictions)


def test_ID_상한과_제품별_판정을_허용한다():
    names, judgements = validate(
        [{**RICE, "id": 2**63 - 1}],
        [{**SAFE, "ingredient_id": 2**63 - 1, "degree": "DEPENDS_ON_PRODUCT"}],
    )
    assert names == {2**63 - 1: "Rice"}
    assert len(judgements) == 1
    assert judgements[0][2].value == "DEPENDS_ON_PRODUCT"


@pytest.mark.parametrize(
    "commands",
    [[], ["unknown"], ["check", "replace"]],
    ids=["미선택", "없는_명령", "중복선택"],
)
def test_실행_명령을_하나만_선택해야_한다(commands):
    with pytest.raises(SystemExit) as raised:
        cli.main(commands)
    assert raised.value.code == 2


def write_files(tmp_path):
    ingredients = tmp_path / "ingredients.jsonl"
    restrictions = tmp_path / "ingredients_restrictions.jsonl"
    ingredients.write_text(json.dumps(RICE) + "\n", encoding="utf-8")
    restrictions.write_text(json.dumps(SAFE) + "\n", encoding="utf-8")
    return ingredients, restrictions


@pytest.fixture
def forbid_cli_database(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("file validation must not open a DB session")

    monkeypatch.setattr(cli, "run", forbidden)
    monkeypatch.setattr("app.core.database.AsyncSessionLocal", forbidden)


def test_check는_DB_접속_없이_파일만_검증한다(tmp_path, forbid_cli_database, capsys):
    ingredients, restrictions = write_files(tmp_path)
    cli.main(
        [
            "check",
            "--ingredients",
            str(ingredients),
            "--restrictions",
            str(restrictions),
        ],
    )
    assert "재료 1개, 제한 판정 1개" in capsys.readouterr().out


def test_기본_assets_경로는_실행_위치와_무관하다(
    tmp_path, monkeypatch, forbid_cli_database, capsys
):
    monkeypatch.chdir(tmp_path)
    cli.main(["check"])
    assert "OK: 재료 " in capsys.readouterr().out


@pytest.mark.parametrize("command", ["check", "replace", "apply", "verify"])
@pytest.mark.parametrize("failure", ["missing", "invalid_json", "unknown_ingredient"])
def test_입력_오류는_DB_접속과_성공_출력_전에_실패한다(
    tmp_path, forbid_cli_database, capsys, command, failure
):
    ingredients, restrictions = write_files(tmp_path)
    if failure == "missing":
        ingredients.unlink()
    elif failure == "invalid_json":
        ingredients.write_text("{broken\n", encoding="utf-8")
    else:
        restrictions.write_text(json.dumps({**SAFE, "ingredient_id": 2}) + "\n", encoding="utf-8")

    with pytest.raises((FileNotFoundError, ValueError)):
        cli.main(
            [
                command,
                "--ingredients",
                str(ingredients),
                "--restrictions",
                str(restrictions),
            ]
        )
    assert capsys.readouterr().out == ""
