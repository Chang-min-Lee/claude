# 무료로 베타 열기 (내 맥 + 무료 터널)

비용: 0원 (카드·가입 불필요). 대신 **맥이 켜져 있는 동안에만** 접속돼요.
알맞은 규모: 참가자 10명 안팎, 2~4주 시험. 정식 서비스에는 맞지 않아요.

## 준비 (처음 한 번)
1. **Node.js 설치**: https://nodejs.org 에서 LTS 버전(22.5 이상)을 받아 설치.
2. **코드 받기**: 터미널에서
   ```
   git clone https://github.com/chang-min-lee/claude.git
   cd claude
   git checkout claude/ecstatic-bohr-0v8b8o
   ```
3. **무료 터널 도구 설치(cloudflared)**: Homebrew가 있으면 `brew install cloudflared`.
   (Homebrew가 없으면 https://brew.sh 안내를 따르거나, https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ 에서 맥용을 받으세요.)

## 실행
```
bash scripts/beta-mac.sh
```
- 처음 한 번은 관리자 이메일·비밀번호(8자 이상)·Anthropic API 키(없으면 Enter)를 물어봐요. 입력한 값은 `.beta.env` 파일에 저장되고 인터넷에 올라가지 않아요.
- 잠시 뒤 `참가자에게 보낼 주소: https://○○○.trycloudflare.com` 이 나와요. 이 주소를 참가자에게 보내세요.
- 맥이 잠들지 않도록 자동으로 처리해요(`caffeinate`). 전원을 꽂아 두세요.
- 끄려면 터미널에서 **Ctrl+C**. 창을 닫거나 맥을 끄면 접속이 끊겨요.

## 꼭 알아 둘 것
- **주소가 바뀌어요**: 프로그램을 다시 켤 때마다 새 주소가 생겨요. 다시 켜면 참가자에게 새 주소를 알려 주세요. (Cloudflare 임시 터널은 시험용이고 동시 요청 수 제한이 있어요.)
- **데이터는 내 맥의 `data` 폴더에 저장돼요.** 학생 개인정보가 있으니 맥에 화면 잠금 비밀번호를 걸고, 관리자 화면의 **백업 파일 내려받기**를 주 1회 하세요.
- 이미 쓰던 데이터는 다시 켜도 그대로 남아요. (같은 폴더에서 실행할 때)
- ngrok 같은 다른 무료 터널은 2026년 초부터 제한이 커서(월 1GB 등) 추천하지 않아요.
- 참가자가 접속하는 시간에 맥이 꺼져 있으면 첫인상이 나빠져요. 미리 접속 가능한 시간대를 알려 주세요.

## 나중에 정식으로 옮길 때
관리자 화면의 백업 파일로 데이터를 그대로 옮길 수 있어요 ([DEPLOY.md](DEPLOY.md) 참고).
