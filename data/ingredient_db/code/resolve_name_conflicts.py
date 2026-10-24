# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""RDA 원본을 확인한 19개 한영 이름 충돌 묶음을 최종 목록에 반영한다."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELATIONS = ROOT.parent / "ingredient_restrictions/relations-reviewed.json"
ENGLISH_NAMES = {
    "갈색양송이버섯": "Brown button mushroom",
    "검은비늘버섯": "Pholiota adiposa mushroom",
    "꽃송이버섯": "Cauliflower mushroom",
    "나도팽나무버섯": "Nameko mushroom",
    "노루궁뎅이버섯": "Lion's mane mushroom",
    "라즈베리": "Raspberry",
    "만가닥버섯": "Beech mushroom",
    "목이버섯": "Wood ear mushroom",
    "문어": "Octopus",
    "미더덕": "Sea squirt",
    "성게": "Sea urchin",
    "소고기 목심": "Beef chuck",
    "소고기 설도": "Beef round cuts",
    "송이버섯": "Matsutake mushroom",
    "싸리버섯": "Cauliflower coral mushroom",
    "양송이버섯": "White button mushroom",
    "용과": "Dragon fruit",
    "체리 통조림": "Canned cherries",
}
LOBSTER_CODES = {
    "K6130010000a", "K6130060000a", "K6130120000a", "K6130170000a"
}


def resolve(catalog: dict, relations: dict, rda: dict, restrictions: dict) -> tuple[dict, dict]:
    """기존 판정은 보존하고 새 재료의 미판정 관계는 명시적으로 보류한다."""
    groups = catalog["unresolved_name_groups"]
    if len(groups) != 19 or {g["kor_name"] for g in groups} != {*ENGLISH_NAMES, "새우"}:
        raise ValueError("Expected 19 original name-conflict groups")
    originals = {r["source_record_id"]: r for r in rda["rows"]}
    existing = {i["kor_name"] for i in catalog["ingredients"]}
    resolved = []
    audit = []
    for group in groups:
        name = group["kor_name"]
        code_groups = (
            {"새우": sorted(set(group["source_codes"]) - LOBSTER_CODES),
             "바닷가재류": sorted(LOBSTER_CODES)}
            if name == "새우" else {name: group["source_codes"]}
        )
        for name_ko, codes in code_groups.items():
            if not codes or name_ko in existing:
                raise ValueError(f"Empty or duplicate resolved name: {name_ko}")
            if any(c not in originals for c in codes):
                raise ValueError("Unknown RDA source code")
            name_en = (
                "Shrimp and prawns" if name_ko == "새우" else
                "Lobster varieties" if name_ko == "바닷가재류" else ENGLISH_NAMES[name_ko]
            )
            item = dict(group, kor_name=name_ko, eng_name=name_en,
                        source_codes=sorted(codes), review_required=False,
                        english_name_conflict=False,
                        ai_reviewed_source_codes=sorted(codes))
            item["english_options"] = sorted({
                originals[c]["name_en"] for c in codes
            })
            resolved.append(item)
            existing.add(name_ko)
            audit.append({"from_group": group["kor_name"], "kor_name": name_ko,
                          "eng_name": name_en, "source_codes": sorted(codes),
                          "reason": "RDA의 생·건조·데침·냉동·품종 표기를 대표 이름으로 통합"
                          if name_ko != "바닷가재류" and group["kor_name"] != "새우"
                          else "새우류와 영어명이 lobster인 원본 행을 분리"})
    if sum(len(x["source_codes"]) for x in resolved) != 86:
        raise ValueError("Resolution lost source rows")
    catalog["ingredients"] = sorted(catalog["ingredients"] + resolved,
                                    key=lambda x: x["kor_name"])
    catalog["unresolved_name_groups"] = []
    catalog["name_conflict_resolution"] = {
        "reviewer_model": "GPT-6", "review_type": "AI_REVIEW_NOT_HUMAN_APPROVAL",
        "source_rows": 86, "groups_resolved": 19, "ingredients_added": len(resolved),
        "decisions": audit,
    }
    old = {(r["ingredient_key"], r["restriction_id"]) for r in relations["rows"]}
    added = []
    for item in resolved:
        for restriction in restrictions["restrictions"]:
            key = item["kor_name"], restriction["id"]
            if key in old:
                raise ValueError(f"Existing relation: {key}")
            added.append({"ingredient_key": key[0], "restriction_id": key[1],
                          "relation": None, "review_status": "UNRESOLVED",
                          "reason": "이름 충돌 해결 후 재료가 추가됨; 제한 판정 근거 미검토",
                          "evidence_ids": [f"rda:{code}" for code in item["source_codes"]]})
    relations["rows"] = sorted(relations["rows"] + added,
                                key=lambda r: (r["ingredient_key"], r["restriction_id"]))
    relations["name_conflict_pairs_pending_review"] = len(added)
    return catalog, relations


def main() -> None:
    catalog_path = ROOT / "ingredients-reviewed.json"
    paths = [catalog_path, RELATIONS]
    catalog, relations = [json.loads(p.read_text(encoding="utf-8")) for p in paths]
    rda = json.loads((ROOT / "rda-source.json").read_text(encoding="utf-8"))
    restrictions = json.loads((ROOT / "restrictions.json").read_text(encoding="utf-8"))
    catalog, relations = resolve(catalog, relations, rda, restrictions)
    for path, data in zip(paths, (catalog, relations), strict=True):
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Resolved 19 groups into 20 ingredients; 340 new restriction pairs remain unresolved.")


if __name__ == "__main__":
    main()
