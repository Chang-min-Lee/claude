#!/bin/bash
# 내 맥에서 무료로 베타 서버를 열기: 서버 실행 + Cloudflare 임시 터널(무료, 가입 불필요)
# 사용법: 터미널에서 이 폴더로 이동한 뒤  bash scripts/beta-mac.sh
cd "$(dirname "$0")/.." || exit 1

# 1) Node 확인 (22.5 이상 필요)
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js 가 없어요. https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요."; exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
NODE_MINOR=$(node -p "process.versions.node.split('.')[1]")
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 5 ]; }; then
  echo "❌ Node.js 22.5 이상이 필요해요. (지금: $(node -v)) https://nodejs.org 에서 새로 설치하세요."; exit 1
fi

# 2) 첫 실행이면 관리자 계정 정보를 물어서 .beta.env 에 저장 (Git 에 올라가지 않아요)
ENVF=".beta.env"
if [ ! -f "$ENVF" ]; then
  echo "처음 실행이네요. 관리자 계정을 정해 주세요."
  read -r -p "관리자 이메일: " AE
  while true; do
    read -r -s -p "관리자 비밀번호(8자 이상): " AP; echo
    [ ${#AP} -ge 8 ] && break
    echo "8자 이상이어야 해요."
  done
  read -r -p "Anthropic API 키(없으면 그냥 Enter): " AK
  { echo "ADMIN_EMAIL='$AE'"; echo "ADMIN_PASSWORD='$AP'"; echo "ANTHROPIC_API_KEY='$AK'"; } > "$ENVF"
  chmod 600 "$ENVF"
fi
set -a; . "./$ENVF"; set +a
export BETA=1 TRUST_PROXY=1 PORT="${PORT:-3000}" DATA_DIR="${DATA_DIR:-$(pwd)/data}"
mkdir -p "$DATA_DIR"

# 3) 터널(선택): cloudflared 가 있으면 인터넷 주소를 만든다
TUN_PID=""
if command -v cloudflared >/dev/null 2>&1; then
  TLOG=$(mktemp)
  cloudflared tunnel --url "http://localhost:$PORT" >"$TLOG" 2>&1 &
  TUN_PID=$!
  echo "터널 주소를 만드는 중… (최대 20초)"
  for _ in $(seq 1 20); do
    URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TLOG" | head -1)
    [ -n "$URL" ] && break
    sleep 1
  done
  if [ -n "$URL" ]; then
    echo ""; echo "✅ 참가자에게 보낼 주소:  $URL"; echo "   (이 주소는 이 프로그램을 다시 켤 때마다 바뀌어요)"; echo ""
  else
    echo "⚠ 터널 주소를 찾지 못했어요. 로그: $TLOG"
  fi
else
  echo "ℹ cloudflared 가 없어서 이 컴퓨터에서만 열려요 (http://localhost:$PORT)."
  echo "  인터넷에 열려면:  brew install cloudflared  (Homebrew 필요) 후 다시 실행"
fi

cleanup() { [ -n "$TUN_PID" ] && kill "$TUN_PID" 2>/dev/null; exit 0; }
trap cleanup INT TERM

echo "서버를 시작해요. 끄려면 Ctrl+C. 이 창을 닫거나 맥이 꺼지면 접속이 끊겨요."
# caffeinate: 서버가 도는 동안 맥이 잠들지 않게 함 (맥 전용)
if command -v caffeinate >/dev/null 2>&1; then caffeinate -i node server.js; else node server.js; fi
cleanup
