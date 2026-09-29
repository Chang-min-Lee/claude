#!/bin/bash
# 우분투 서버(AWS/Google Cloud/아무 VPS)에 한 번에 설치: Node 22 + 서비스 자동 시작 + HTTPS(Caddy) + 매일 백업
# 사용법(서버에 접속한 뒤):
#   git clone https://github.com/chang-min-lee/claude.git && cd claude && git checkout claude/ecstatic-bohr-0v8b8o
#   sudo bash scripts/setup-vm.sh
# 준비물: 서버 주소가 가리키는 도메인(예: smartedu.duckdns.org). 80/443 포트가 열려 있어야 HTTPS 인증서가 발급돼요.
set -e
[ "$(id -u)" -eq 0 ] || { echo "❌ sudo 로 실행하세요:  sudo bash scripts/setup-vm.sh"; exit 1; }
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_USER="${SUDO_USER:-ubuntu}"
DATA_DIR=/var/lib/smartedu

echo "== 입력 =="
read -r -p "서비스 도메인 (예: smartedu.duckdns.org): " DOMAIN
read -r -p "관리자 이메일: " ADMIN_EMAIL
while true; do read -r -s -p "관리자 비밀번호(8자 이상): " ADMIN_PASSWORD; echo; [ ${#ADMIN_PASSWORD} -ge 8 ] && break; echo "8자 이상이어야 해요."; done
read -r -p "Anthropic API 키(없으면 Enter): " ANTHROPIC_API_KEY
[ -n "$DOMAIN" ] && [ -n "$ADMIN_EMAIL" ] || { echo "도메인과 이메일은 필수예요."; exit 1; }

echo "== 패키지 설치 (Node 22, Caddy) =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl gnupg ca-certificates debian-keyring debian-archive-keyring apt-transport-https
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "== 설정 저장 =="
mkdir -p "$DATA_DIR"
chown "$APP_USER":"$APP_USER" "$DATA_DIR"
umask 077
cat > /etc/smartedu.env <<ENV
PORT=3000
DATA_DIR=$DATA_DIR
TRUST_PROXY=1
BETA=1
NODE_ENV=production
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENV
chmod 600 /etc/smartedu.env
umask 022

echo "== 서비스 등록 =="
cat > /etc/systemd/system/smartedu.service <<UNIT
[Unit]
Description=SMART Edu learning system
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=/etc/smartedu.env
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now smartedu

echo "== HTTPS (Caddy) =="
cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN {
  encode gzip
  reverse_proxy 127.0.0.1:3000
}
CADDY
systemctl restart caddy

echo "== 매일 백업 =="
cat > /etc/cron.daily/smartedu-backup <<CRON
#!/bin/bash
# 데이터를 $DATA_DIR/backups 에 저장하고 오래된 것은 지운다 (기본 14개 보관)
set -a; . /etc/smartedu.env; set +a
cd "$APP_DIR" && su -p -s /bin/bash "$APP_USER" -c "node scripts/backup.js" >> /var/log/smartedu-backup.log 2>&1
CRON
chmod +x /etc/cron.daily/smartedu-backup

sleep 3
echo ""
if curl -fsS http://127.0.0.1:3000/healthz >/dev/null 2>&1; then
  echo "✅ 서버가 켜졌어요: $(curl -s http://127.0.0.1:3000/healthz)"
else
  echo "⚠ 서버 상태 확인 실패. 로그 보기:  sudo journalctl -u smartedu -n 50 --no-pager"
fi
echo "👉 잠시 뒤 https://$DOMAIN 으로 접속해 보세요. (도메인이 이 서버의 IP를 가리키고, 80/443 포트가 열려 있어야 해요)"
echo "   로그 보기:  sudo journalctl -u smartedu -f     다시 시작:  sudo systemctl restart smartedu"
