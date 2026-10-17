#!/bin/bash
# AI-generated with Claude Sonnet 5.5, 2026-10-17, reviewed by Jaemin Kim
# EC2 에서 실행되는 배포 스크립트. GitHub Actions 가 SSM(AWS-RunShellScript)으로 보낸다.
#
# 호출하는 쪽이 아래 환경변수를 먼저 설정해 준다.
#   IMAGE    배포할 이미지 전체 이름 (예: <registry>/nurturebites-server:<sha>)
#   REGISTRY ECR 레지스트리 주소
#   REGION   AWS 리전
#
# 순서: 설정 읽기 → 이미지 pull → DB 마이그레이션 → 컨테이너 교체 → 헬스체크 → 실패 시 롤백
set -euo pipefail

PARAM_PATH="/nurturebites/prod"
CONTAINER="nurturebites-server"
PORT=8000

ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE" "$ENV_FILE.json"' EXIT
chmod 600 "$ENV_FILE"

# 1. SSM Parameter Store 의 값을 KEY=VALUE 파일로 만든다 (파라미터 이름의 마지막 부분이 변수 이름).
aws ssm get-parameters-by-path \
  --region "$REGION" --path "$PARAM_PATH" --with-decryption --output json > "$ENV_FILE.json"
python3 - "$ENV_FILE.json" > "$ENV_FILE" <<'PY'
import json
import sys

for p in json.load(open(sys.argv[1]))["Parameters"]:
    print(f'{p["Name"].rsplit("/", 1)[-1]}={p["Value"]}')
PY
if [ ! -s "$ENV_FILE" ]; then
  echo "SSM 경로 $PARAM_PATH 에서 파라미터를 읽지 못했습니다" >&2
  exit 1
fi

# 2. 새 이미지를 받는다.
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"
docker pull "$IMAGE"

# 3. 롤백에 쓸 현재 이미지를 기억해 둔다 (처음 배포면 비어 있다).
PREVIOUS="$(docker inspect --format '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)"

# 4. DB 마이그레이션. 새 이미지로 한 번 실행하고 끝난다.
docker run --rm --env-file "$ENV_FILE" "$IMAGE" alembic upgrade head

# 5. 컨테이너 교체.
start_container() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$CONTAINER" --restart unless-stopped \
    --env-file "$ENV_FILE" -p "$PORT:8000" "$1" >/dev/null
}

wait_healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS "http://localhost:$PORT/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

start_container "$IMAGE"
if wait_healthy; then
  echo "배포 성공: $IMAGE"
  # 일주일 넘은 사용하지 않는 이미지를 정리한다 (롤백용 최근 이미지는 남는다).
  docker image prune -af --filter "until=168h" >/dev/null || true
  exit 0
fi

# 6. 헬스체크 실패 → 로그를 남기고 이전 이미지로 되돌린다.
echo "헬스체크 실패: $IMAGE" >&2
docker logs --tail 50 "$CONTAINER" >&2 || true
if [ -n "$PREVIOUS" ]; then
  echo "이전 이미지로 롤백: $PREVIOUS" >&2
  start_container "$PREVIOUS"
fi
exit 1
