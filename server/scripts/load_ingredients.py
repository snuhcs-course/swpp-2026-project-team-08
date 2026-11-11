# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 재료·제한 판정 raw JSONL 을 DB 에 한 번 적재하는 스크립트 추가
# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 재료 적재 패키지의 기존 실행 경로 유지

"""기존 적재 명령을 ingredient_catalog 패키지로 연결한다."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.ingredient_catalog.load import main  # noqa: E402

if __name__ == "__main__":
    main()
