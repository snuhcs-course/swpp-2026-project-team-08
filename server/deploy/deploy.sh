#!/bin/bash
# AI-generated with Claude Sonnet 5.5, 2026-10-17, reviewed by Jaemin Kim
# Changed: CD 스크립트 작성
# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 재료 변경 시 자동 적재와 배포 실패 처리

# EC2에서 SSM으로 실행한다. IMAGE, REGISTRY, REGION은 워크플로에서 전달한다.
set -Eeuo pipefail
umask 077

PARAM_PATH="/nurturebites/prod"
CONTAINER="nurturebites-server"
OPERATION="nurturebites-deploy-operation"
PORT=8000
CATALOG_ARGS=(
  --ingredients assets/ingredients.jsonl
  --restrictions assets/ingredients_restrictions.jsonl
)
# 중단된 SSM 명령과 다음 배포가 겹치지 않도록 호스트에서도 잠근다.
exec 9>/var/lock/nurturebites-deploy.lock
flock -n 9 || { echo "다른 배포가 실행 중입니다" >&2; exit 1; }

ENV_FILE="$(mktemp)"
SERVER_STOPPED=0
trap 'rm -f "$ENV_FILE" "$ENV_FILE.json"' EXIT

stop_operation() {
  local name
  name="$(docker ps -a --filter "name=^/${OPERATION}$" --format '{{.Names}}')" || return 1
  if [ "$name" = "$OPERATION" ]; then
    # Docker 클라이언트가 죽어도 작업 컨테이너는 남을 수 있다. 이전 DB 작업부터 끝낸다.
    if ! docker stop --time 60 "$OPERATION" >/dev/null; then
      # 조회와 stop 사이에 --rm 작업이 정상 종료된 경우에는 이미 정리가 끝났다.
      name="$(docker ps -a --filter "name=^/${OPERATION}$" --format '{{.Names}}')" || return 1
      [ -z "$name" ] || return 1
    fi
    name="$(docker ps -a --filter "name=^/${OPERATION}$" --format '{{.Names}}')" || return 1
    if [ "$name" = "$OPERATION" ]; then docker rm "$OPERATION" >/dev/null || return 1; fi
  fi
}

run_operation() {
  docker run --name "$OPERATION" --rm --env-file "$ENV_FILE" "$@"
}

stop_container() {
  # 조회 오류를 컨테이너 부재로 취급하지 않는다.
  local name
  name="$(docker ps -a --filter "name=^/${CONTAINER}$" --format '{{.Names}}')" || return 1
  if [ "$name" = "$CONTAINER" ]; then
    docker update --restart=no "$CONTAINER" >/dev/null || return 1
    docker stop --time 60 "$CONTAINER" >/dev/null || return 1
  fi
}

remove_stopped_container() {
  local name
  name="$(docker ps -a --filter "name=^/${CONTAINER}$" --format '{{.Names}}')" || return 1
  if [ "$name" = "$CONTAINER" ]; then docker rm "$CONTAINER" >/dev/null || return 1; fi
}

start_container() {
  remove_stopped_container || return 1
  # 확인이 끝나기 전에 EC2가 재부팅돼도 새 서버를 자동 시작하지 않는다.
  docker run -d --name "$CONTAINER" --restart=no \
    --env-file "$ENV_FILE" -p "$PORT:8000" "$1" >/dev/null
}

wait_healthy() {
  for _ in $(seq 1 30); do
    if curl --connect-timeout 2 --max-time 3 -fsS "http://localhost:$PORT/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

on_failure() {
  local status="$1"
  trap - ERR INT TERM
  stop_operation || true
  if [ "$SERVER_STOPPED" -eq 1 ]; then
    stop_container || true
    echo "배포 실패: 서버를 중지합니다. 적재 완료된 데이터는 유지하며 수정 후 재배포하세요" >&2
  fi
  exit "$status"
}
trap 'on_failure $?' ERR
trap 'on_failure 130' INT
trap 'on_failure 143' TERM

# 설정 값은 출력하지 않는다.
aws ssm get-parameters-by-path \
  --region "$REGION" --path "$PARAM_PATH" --with-decryption --output json > "$ENV_FILE.json"
python3 - "$ENV_FILE.json" > "$ENV_FILE" <<'PY'
import json
import sys

for parameter in json.load(open(sys.argv[1]))["Parameters"]:
    print(f'{parameter["Name"].rsplit("/", 1)[-1]}={parameter["Value"]}')
PY
missing=0
for key in ENVIRONMENT JWT_SECRET_KEY POSTGRES_HOST POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
  if ! grep -q "^${key}=." "$ENV_FILE"; then
    echo "필수 파라미터가 없거나 비어 있습니다: $PARAM_PATH/$key" >&2
    missing=1
  fi
done
if ! grep -qx "ENVIRONMENT=production" "$ENV_FILE"; then
  echo "ENVIRONMENT 는 production 이어야 합니다" >&2
  missing=1
fi
if [ "$missing" -ne 0 ]; then exit 1; fi
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"
stop_operation

docker pull "$IMAGE"
run_operation "$IMAGE" python scripts/load_ingredients.py --check "${CATALOG_ARGS[@]}"
run_operation "$IMAGE" alembic upgrade head
SERVER_STOPPED=1
stop_container
run_operation "$IMAGE" python -m scripts.ingredient_catalog.deploy apply "${CATALOG_ARGS[@]}"
start_container "$IMAGE"
if ! wait_healthy; then
  echo "새 서버 헬스체크 실패: $IMAGE" >&2
  on_failure 1
fi
run_operation "$IMAGE" python -m scripts.ingredient_catalog.deploy verify "${CATALOG_ARGS[@]}"
docker update --restart=unless-stopped "$CONTAINER" >/dev/null
echo "배포 성공: $IMAGE"
docker image prune -af --filter "until=168h" >/dev/null || true
