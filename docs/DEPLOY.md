# 인터넷에 올리기 (Render 기준, 맥에서 따라 하기)

목표: 주소(예: `https://jinro-ai.onrender.com`)를 누구에게나 보내 줄 수 있게 만든다.
※ 요금·메뉴 이름은 바뀔 수 있어요. 막히면 화면을 캡처해서 알려 주세요.

## 준비물
- GitHub 계정 (이 저장소가 이미 있어요: `chang-min-lee/claude`)
- Render 계정 (render.com, GitHub로 가입)
- Anthropic API 키 (console.anthropic.com → API Keys). AI 기능(코치·퀴즈·진단서·검사 해석)에 필요해요. 없어도 나머지는 다 동작해요.
- 카드 등록 (Render 유료 플랜 + API 사용량)

## 순서
1. Render에서 **New → Blueprint** 선택 → GitHub 저장소 `claude` 연결.
   브랜치는 배포할 브랜치(`claude/ecstatic-bohr-0v8b8o`, 또는 합친 뒤의 main)를 고르세요.
2. `render.yaml`을 읽어서 서비스가 만들어져요. 아래 세 값을 물어보면 입력:
   - `ADMIN_EMAIL`: 내가 쓸 관리자 이메일
   - `ADMIN_PASSWORD`: 8자 이상 (첫 로그인 후 계정 화면에서 바꾸세요)
   - `ANTHROPIC_API_KEY`: 위에서 만든 키 (모르면 비워 두고 나중에 추가)
3. 배포가 끝나면 주소가 나와요. 열어서 **관리자 이메일/비밀번호로 로그인**.
4. 바로 확인:
   - `주소/healthz` 가 `{"ok":true,"storage":"sqlite"}` 로 보이는지 (sqlite 가 아니면 알려 주세요)
   - 계정 탭 → 기관 이름·전화·이메일 입력 → 저장
   - 계정 탭 → **백업 파일 내려받기** 가 되는지
5. **데이터가 남는지 확인 (중요)**: 학생을 한 명 등록 → Render에서 서비스 **Manual Deploy → Restart** → 다시 열어서 학생이 그대로 있는지 확인.
   (디스크가 없으면 다시 배포할 때 데이터가 사라져요.)

## API 키 넣기·바꾸기
Render → 서비스 → **Environment** → `ANTHROPIC_API_KEY` 수정 → 저장(자동 재배포).
비용 줄이기: `CLAUDE_MODEL=claude-haiku-4-5-20251001` 추가. Anthropic 콘솔에서 **월 사용 한도**를 꼭 걸어 두세요.

## 내 도메인 연결 (선택)
Render → Settings → Custom Domains 에 도메인 추가 → 안내에 나오는 DNS 값을 도메인 업체에 입력. HTTPS는 자동이에요.

## 백업 (매주)
- 관리자 로그인 → 계정 → **백업 파일 내려받기** → 안전한 곳에 보관 (개인정보 포함).
- 복구가 필요하면 알려 주세요. 파일을 서버의 데이터 폴더에 되돌려 놓는 방법을 안내해 드려요.

## 문제가 생기면
- 화면이 안 열림: Render → Logs 확인. `⚠` 로 시작하는 줄이 원인을 알려 줘요.
- AI가 안 됨: 로그의 `ANTHROPIC_API_KEY 가 없어요` 문구 확인, 키·결제 상태 확인.
- 로그인 불가: 관리자 비밀번호를 잊었다면 Environment의 `ADMIN_PASSWORD`는 **처음 계정을 만들 때만** 쓰여요. 알려 주시면 재설정 방법을 안내해요.

## 이 환경에서 확인하지 못한 것
Docker 이미지 빌드와 Render 배포는 이 개발 환경에서 직접 시험하지 못했어요(도커 없음). 첫 배포에서 오류가 나면 로그를 보여 주세요.
