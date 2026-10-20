# 동의 문서 버전 관리

## 목차

- [버전 위치](#버전-위치)
- [변경 방법](#변경-방법)

## 버전 위치

온보딩의 계정·개인정보, 사진 분석, AI 학습 동의 문서 버전은
[`server/app/features/onboarding/consent_version.py`](../server/app/features/onboarding/consent_version.py)의
`DOCUMENT_VERSION`이다. 클라이언트는 버전을 요청에 보내지 않는다.

## 변경 방법

동의 문구를 바꿀 때 `DOCUMENT_VERSION`을 새 값으로 갱신한다. 서버는 이후 저장되는 동의에
이 값을 `user_consents.document_version`으로 기록한다. 기존 기록의 버전과 선택값은 수정하지 않는다.
같은 사용자의 최신 선택값과 문서 버전이 모두 같으면 기록을 중복 추가하지 않는다.
