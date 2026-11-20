# AI-generated with GPT-6, 2026-11-20, reviewed by Haechan Jung
# Changed: 재료 명령과 DB 트랜잭션·잠금 통합

"""서버 assets의 재료 카탈로그를 검사하거나 DB에 적용한다."""

import argparse
import asyncio
from pathlib import Path

from scripts.ingredient_catalog.deploy import apply_catalog, verify_catalog
from scripts.ingredient_catalog.load import CatalogInput, read_catalog, replace_catalog_data
from scripts.ingredient_catalog.lock import lock_catalog

ASSETS = Path(__file__).resolve().parents[2] / "assets"


async def run(command: str, catalog: CatalogInput) -> str:
    """같은 잠금과 트랜잭션 안에서 DB 작업을 실행하고 커밋 후 성공 메시지를 반환한다."""
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session, session.begin():
        await lock_catalog(session)
        if command == "replace":
            imported = await replace_catalog_data(session, catalog)
            message = (
                f"적재 완료: 재료 {imported.ingredients}개, 제한 판정 {imported.restrictions}개"
            )
        elif command == "apply":
            applied = await apply_catalog(session, catalog)
            action = "교체 완료" if applied.changed else "동일 파일: 교체 생략"
            message = f"{action} (재료 {applied.ingredients}개, 제한 판정 {applied.restrictions}개)"
        elif command == "verify":
            await verify_catalog(session, catalog)
            message = "재료 verify 완료"
        else:
            raise ValueError(f"unknown catalog command: {command}")
    return message


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    descriptions = {
        "check": "파일만 검증하고 DB에는 접속하지 않는다",
        "replace": "기존 공용 재료와 판정을 모두 교체한다",
        "apply": "마지막 적재 파일과 다를 때만 공용 재료와 판정을 교체한다",
        "verify": "DB의 공용 재료와 판정이 파일과 같은지 확인한다",
    }
    for command, description in descriptions.items():
        child = commands.add_parser(command, help=description, description=description)
        child.add_argument("--ingredients", type=Path, default=ASSETS / "ingredients.jsonl")
        child.add_argument(
            "--restrictions", type=Path, default=ASSETS / "ingredients_restrictions.jsonl"
        )
    args = parser.parse_args(argv)
    # 파일 검증 실패는 DB 세션을 만들기 전에 처리한다.
    catalog = read_catalog(args.ingredients, args.restrictions)
    if args.command == "check":
        print(
            f"OK: 재료 {len(catalog.names)}개, 제한 판정 {len(catalog.judgements)}개 "
            "(DB 는 바꾸지 않았다)"
        )
        return
    print(asyncio.run(run(args.command, catalog)))


if __name__ == "__main__":
    main()
