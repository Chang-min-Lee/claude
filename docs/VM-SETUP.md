# 무료 크레딧으로 서버 열기 (AWS 무료 플랜, 서울 지역)

목표: 맥을 켜 두지 않아도 24시간 켜져 있는 서버 + 무료 HTTPS 주소. 처음 6개월은 무료 크레딧으로 사실상 0원.
※ 화면 이름·요금은 바뀔 수 있어요. 아래 내용은 웹 검색으로 확인한 범위이고, 이 환경에서 실제 서버로는 시험하지 못했어요. 막히면 화면 캡처를 보여 주세요.

## 비용에 대해 (중요)
- AWS: 신규 가입은 6개월 동안 $100~$200 크레딧을 받는 "무료 플랜"으로 알려져 있어요. 크레딧이 끝나거나 6개월이 지나면 계정이 닫히거나 유료로 바뀔 수 있으니 **날짜를 달력에 적어 두세요**.
- 공인 IP 주소는 클라우드 대부분에서 시간당 약 $0.005(월 $3.6 정도)가 붙어요. AWS 크레딧 안에서는 크레딧에서 차감돼요.
- Google Cloud의 무료 서버(e2-micro)는 서버 자체는 무료지만 **IP 요금(월 $3.6 정도)이 별도**로 붙는 것으로 확인돼서 "0원"이 아니에요.
- 어느 쪽이든 **예산 알림을 꼭 설정**하세요 (AWS: Billing → Budgets → 월 $1 초과 시 이메일).

## 1. AWS 가입 · 서버 만들기
1. aws.amazon.com 에서 가입(카드, 본인 확인). 가입 시 **무료 플랜(Free plan)** 을 선택.
2. 오른쪽 위 지역을 **아시아 태평양(서울) ap-northeast-2** 로 바꾸기.
3. **EC2 → 인스턴스 시작(Launch instance)**
   - 이름: `smartedu`
   - 이미지(AMI): **Ubuntu Server 24.04 LTS**
   - 인스턴스 유형: 무료 플랜에서 선택 가능한 작은 유형(예: `t3.micro`, 화면에 "Free plan eligible" 표시)
   - 키 페어: 새로 만들고 `.pem` 파일을 내려받아 보관 (없으면 서버에 접속 못 해요)
   - 네트워크 설정: **SSH(22), HTTP(80), HTTPS(443)** 모두 허용
   - 스토리지: 20~30GB
4. 시작 후 **탄력적 IP(Elastic IP)** 를 할당해서 이 서버에 연결 (서버를 껐다 켜도 IP가 안 바뀌게).

## 2. 무료 도메인 만들기 (DuckDNS)
1. duckdns.org 에 구글/GitHub로 로그인.
2. 원하는 이름(예: `smartedu`)으로 서브도메인 생성 → `smartedu.duckdns.org`
3. **current ip** 칸에 위에서 만든 서버의 IP를 입력하고 update.

## 3. 서버에 설치
1. 맥 터미널에서 접속 (키 파일 경로와 IP를 바꿔서):
   ```
   chmod 400 ~/Downloads/키이름.pem
   ssh -i ~/Downloads/키이름.pem ubuntu@서버IP
   ```
2. 서버 안에서:
   ```
   git clone https://github.com/chang-min-lee/claude.git
   cd claude
   git checkout claude/ecstatic-bohr-0v8b8o
   sudo bash scripts/setup-vm.sh
   ```
3. 물어보는 값 입력: 도메인(`smartedu.duckdns.org`), 관리자 이메일, 관리자 비밀번호, Anthropic API 키(없으면 Enter).
4. 끝나면 `https://smartedu.duckdns.org` 로 접속 → **관리자 로그인**.

## 4. 확인
- 주소 뒤에 `/healthz` → `{"ok":true,"storage":"sqlite"}`
- 학생을 등록 → 서버 재시작(`sudo systemctl restart smartedu`) → 학생이 그대로 있는지
- 관리자 화면 → 계정 → **백업 파일 내려받기**

## 운영
- 로그: `sudo journalctl -u smartedu -f`
- 다시 시작: `sudo systemctl restart smartedu`
- 코드 업데이트: `cd ~/claude && git pull && sudo systemctl restart smartedu`
- 매일 자동 백업이 서버의 `/var/lib/smartedu/backups`에 14개 남아요. 서버가 사라질 때를 대비해 **관리자 화면의 백업 내려받기도 주 1회** 하세요.
- 서버 보안: AWS 보안 그룹에서 SSH(22)는 "내 IP만" 허용하는 것을 권장해요.

## 6개월 뒤
크레딧이 끝나기 전에 (1) 유료로 전환해 계속 쓰거나 (2) 다른 곳으로 옮기세요. 옮길 때는 백업 파일을 새 서버의 `/var/lib/smartedu/`에 복원하면 돼요(복원 방법은 알려 주세요).
