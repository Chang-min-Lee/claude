const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let server, mock, base, dataDir, mockReplies = [], lastAiBody = null;

const post = (p, body, token, method = 'POST', lang) => fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(lang && { 'x-lang': lang }), ...(token && { authorization: 'Bearer ' + token }) }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, ...(await r.json()) }));
const get = (p, token) => fetch(base + p, { headers: token ? { authorization: 'Bearer ' + token } : {} }).then(async (r) => ({ status: r.status, ...(await r.json()) }));

async function start(env) {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jinro-'));
  const port = 3100 + Math.floor(Math.random() * 500);
  base = `http://localhost:${port}`;
  server = spawn('node', ['server.js'], { env: { ...process.env, PORT: port, DATA_DIR: dataDir, ...env }, stdio: 'pipe' });
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/'); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  throw new Error('server did not start');
}

before(async () => {
  mock = http.createServer((req, res) => { // 가짜 Anthropic API
    let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => { try { lastAiBody = JSON.parse(raw); } catch {} res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ content: [{ type: 'text', text: mockReplies.shift() || 'ok' }] })); });
  });
  await new Promise((r) => mock.listen(0, r));
  await start({ ANTHROPIC_API_KEY: 'test', ANTHROPIC_BASE_URL: `http://localhost:${mock.address().port}` });
});
after(() => { server.kill(); mock.close(); fs.rmSync(dataDir, { recursive: true, force: true }); });

test('가입·로그인·동기화', async () => {
  assert.equal((await post('/api/signup', { email: 'a@b.co', password: 'short', name: 'A' })).status, 400);
  const s = await post('/api/signup', { email: 'kid@b.co', password: 'password1', name: '민지' });
  assert.equal(s.status, 200); assert.ok(s.user.shareCode);
  assert.equal((await post('/api/signup', { email: 'KID@b.co', password: 'password1', name: 'x' })).status, 409);
  assert.equal((await post('/api/login', { email: 'kid@b.co', password: 'wrongpass1' })).status, 401);
  const l = await post('/api/login', { email: 'kid@b.co', password: 'password1' });
  await post('/api/data', { data: { profile: { name: '민지', group: 'elementary' }, evil: 1 } }, l.token, 'PUT');
  const me = await get('/api/me', l.token);
  assert.equal(me.data.profile.group, 'elementary'); assert.equal(me.data.evil, undefined);
  assert.equal((await get('/api/me')).status, 401);
});

test('보호자 연결·대시보드·해제', async () => {
  const kid = await post('/api/login', { email: 'kid@b.co', password: 'password1' });
  const answers = Object.fromEntries([...Array(12)].map((_, i) => [i, i < 2 ? 5 : 1])); // R 최고점
  const d = new Date(); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await post('/api/data', { data: { answers, log: { [key]: 40 }, tasks: [{ text: '수학', done: false }, { text: '영어', done: true }], chat: [{ role: 'user', content: '비밀' }] } }, kid.token, 'PUT');
  const g = await post('/api/signup', { email: 'mom@b.co', password: 'password1', name: '엄마', role: 'guardian' });
  assert.equal((await post('/api/link', { code: 'ZZZZZZZZ' }, g.token)).status, 404);
  assert.equal((await post('/api/link', { code: kid.user.shareCode }, kid.token)).status, 403);
  assert.equal((await post('/api/link', { code: kid.user.shareCode }, g.token)).status, 200);
  const dash = await get(`/api/dashboard?today=${key}`, g.token);
  const L = dash.learners[0];
  assert.equal(L.today, 40); assert.equal(L.streak, 1); assert.deepEqual(L.riasec[0], 'R');
  assert.equal(L.openCount, 1); assert.equal(JSON.stringify(dash).includes('비밀'), false); // 상담 내용은 비공개
  assert.equal((await get('/api/guardians', kid.token)).guardians.length, 1);
  await post('/api/unlink', { id: g.user.id }, kid.token); // 학습자가 연결 해제
  assert.equal((await get('/api/dashboard', g.token)).learners.length, 0);
});

test('AI 계획·퀴즈·채팅 (목 API)', async () => {
  mockReplies = ['```json\n{"tasks":[{"week":1,"text":"분수 개념"},{"week":9,"text":"범위 밖 주차"}]}\n```'];
  const p = await post('/api/plan', { goal: '분수', weeks: 2, hours: 3, group: 'elementary' });
  assert.equal(p.ai, true); assert.equal(p.tasks[1].week, 2); // 주차 클램프
  mockReplies = ['{"questions":[{"q":"1+1?","choices":["1","2","3","4"],"answer":1,"explain":"2"},{"q":"bad","choices":["a"],"answer":0}]}'];
  const q = await post('/api/quiz', { subject: '수학', count: 5 });
  assert.equal(q.questions.length, 1);
  mockReplies = ['not json'];
  assert.equal((await post('/api/quiz', { subject: '수학' })).status, 502);
  mockReplies = ['안녕!'];
  assert.equal((await post('/api/chat', { messages: [{ role: 'user', content: 'hi' }] })).reply, '안녕!');
});

test('API 키 없을 때: 계획은 기본 템플릿, 퀴즈는 503', async () => {
  server.kill(); await new Promise((r) => setTimeout(r, 200));
  await start({ ANTHROPIC_API_KEY: '' });
  const p = await post('/api/plan', { goal: '영어', weeks: 3, hours: 4 });
  assert.equal(p.ai, false); assert.equal(p.tasks.length, 3);
  assert.equal((await post('/api/quiz', { subject: '영어' })).status, 503);
});

test('비밀번호 변경·내보내기·계정 삭제·보안 헤더', async () => {
  const a = await post('/api/signup', { email: 'del@b.co', password: 'password1', name: '삭제' });
  const g = await post('/api/signup', { email: 'g2@b.co', password: 'password1', name: '보호자', role: 'guardian' });
  await post('/api/link', { code: a.user.shareCode }, g.token);
  await post('/api/data', { data: { tasks: [{ text: 'x', done: false }], wrong: [{ q: 'q', choices: ['a', 'b', 'c', 'd'], answer: 1, explain: 'e' }] } }, a.token, 'PUT');
  assert.equal((await post('/api/password', { current: 'nope', next: 'newpassword1' }, a.token)).status, 401);
  assert.equal((await post('/api/password', { current: 'password1', next: 'short' }, a.token)).status, 400);
  const c = await post('/api/password', { current: 'password1', next: 'newpassword1' }, a.token);
  assert.equal((await get('/api/me', a.token)).status, 401); // 기존 토큰 무효화
  assert.equal((await post('/api/login', { email: 'del@b.co', password: 'password1' })).status, 401);
  const ex = await get('/api/export', c.token);
  assert.equal(ex.account.email, 'del@b.co'); assert.equal(ex.data.wrong.length, 1);
  assert.equal((await post('/api/delete-account', { password: 'bad' }, c.token)).status, 401);
  assert.equal((await post('/api/delete-account', { password: 'newpassword1' }, c.token)).status, 200);
  assert.equal((await post('/api/login', { email: 'del@b.co', password: 'newpassword1' })).status, 401);
  assert.equal((await get('/api/dashboard', g.token)).learners.length, 0);
  const h = await fetch(base + '/'); assert.match(h.headers.get('content-security-policy'), /default-src 'self'/); assert.equal(h.headers.get('x-content-type-options'), 'nosniff');
});

test('베트남어: 오류 메시지·AI 프롬프트·기본 계획', async () => {
  server.kill(); await new Promise((r) => setTimeout(r, 200)); // 이전 테스트가 키 없는 서버로 바꿔 두었으므로 목 API 연결 상태로 재시작
  await start({ ANTHROPIC_API_KEY: 'test', ANTHROPIC_BASE_URL: `http://localhost:${mock.address().port}` });
  const bad = await post('/api/login', { email: 'no@b.co', password: 'password1' }, null, 'POST', 'vi');
  assert.equal(bad.status, 401); assert.match(bad.error, /Email hoặc mật khẩu/);
  assert.match((await post('/api/login', { email: 'no@b.co', password: 'x' })).error, /이메일 또는 비밀번호/); // 기본은 한국어
  assert.match((await post('/api/login', { email: 'no@b.co', password: 'x' }, null, 'POST', 'fr')).error, /이메일/); // 미지원 언어는 한국어
  mockReplies = ['Xin chào!'];
  await post('/api/chat', { messages: [{ role: 'user', content: 'chào' }], profile: { name: 'Lan', group: 'high' } }, null, 'POST', 'vi');
  assert.match(lastAiBody.system, /tiếng Việt/); assert.match(lastAiBody.system, /THPT/);
  mockReplies = ['{"questions":[{"q":"a","choices":["1","2","3","4"],"answer":0,"explain":"x"}]}'];
  await post('/api/quiz', { subject: 'Toán', group: 'middle' }, null, 'POST', 'vi');
  assert.match(lastAiBody.messages[0].content, /trắc nghiệm/); assert.match(lastAiBody.system, /THCS/);
  mockReplies = ['{"tasks":[]}'];
  const p = await post('/api/plan', { goal: 'x', weeks: 1 }, null, 'POST', 'vi');
  assert.equal(p.status, 502); assert.match(p.error, /kế hoạch/);
  server.kill(); await new Promise((r) => setTimeout(r, 200));
  await start({ ANTHROPIC_API_KEY: '' });
  const plan = await post('/api/plan', { goal: 'Toán', weeks: 2, hours: 3 }, null, 'POST', 'vi');
  assert.match(plan.tasks[0].text, /giờ\/tuần/);
  assert.match((await post('/api/quiz', { subject: 'Toán' }, null, 'POST', 'vi')).error, /ANTHROPIC_API_KEY/);
  assert.match((await post('/api/chat', { messages: [{ role: 'user', content: 'x' }] }, null, 'POST', 'vi')).reply, /Để dùng AI/);
});

test('심층검사: 저장 검증·보호자 요약(정서웰빙 제외)·AI 프롬프트', async () => {
  server.kill(); await new Promise((r) => setTimeout(r, 200));
  await start({ ANTHROPIC_API_KEY: 'test', ANTHROPIC_BASE_URL: `http://localhost:${mock.address().port}` });
  const kid = await post('/api/signup', { email: 'deep@b.co', password: 'password1', name: '하나' });
  const good = { date: '2026-09-29', cat: { O: 4, C: 3.5, E: 2, A: 3, N: 9 }, overall: 3.3, v: ['same', 'evil'] }; // N=9는 범위 초과 → 5로 보정
  const wb = { date: '2026-09-29', cat: { stable: 2, energy: 2, relation: 3, stress: 1.5 }, overall: 2.1, v: [] };
  await post('/api/data', { data: { deep: { bigfive: [{ cat: { O: 1 } }, good], wellbeing: [wb], hacked: [good] } } }, kid.token, 'PUT');
  const me = await get('/api/me', kid.token);
  assert.equal(me.data.deep.bigfive.length, 1); // 영역이 빠진 기록은 버림
  assert.equal(me.data.deep.bigfive[0].cat.N, 5); assert.deepEqual(me.data.deep.bigfive[0].v, ['same']);
  assert.equal(me.data.deep.hacked, undefined); assert.equal(me.data.deep.wellbeing.length, 1);
  const g = await post('/api/signup', { email: 'g3@b.co', password: 'password1', name: '보호자', role: 'guardian' });
  await post('/api/link', { code: kid.user.shareCode }, g.token);
  const dash = await get('/api/dashboard', g.token);
  assert.equal(dash.learners[0].deep.bigfive.overall, 3.3);
  assert.equal(dash.learners[0].deep.wellbeing, undefined); // 정서웰빙은 보호자에게 내려가지 않음
  assert.equal(JSON.stringify(dash).includes('stress'), false);
  mockReplies = ['ok'];
  await post('/api/chat', { messages: [{ role: 'user', content: 'hi' }], profile: { group: 'high', deep: '성격유형검사: 적극적 외향형' } });
  assert.match(lastAiBody.system, /적극적 외향형/);
});
