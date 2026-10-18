# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
"""이메일 변경 확인 코드 발급. 테스트에서 monkeypatch 한다."""

import secrets


def issue_email_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"
