// 강사·관리자·보호자·학생 권한과 데이터 흐름 검증
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let server, mock, base, dataDir, mockReplies = [];
const api = (method, p, body, token, lang) => fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(lang && { 'x-lang': lang }), ...(token && { authorization: 'Bearer ' + token }) }, body: body === undefined ? undefined : JSON.stringify(body) }).then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) }));
const post = (p, b, t, l) => api('POST', p, b, t, l), get = (p, t) => api('GET', p, undefined, t), put = (p, b, t) => api('PUT', p, b, t), del = (p, t, b) => api('DELETE', p, b, t);

async function start(env) {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jinro-staff-'));
  const port = 3600 + Math.floor(Math.random() * 500);
  base = `http://localhost:${port}`;
  server = spawn('node', ['server.js'], { env: { ...process.env, PORT: port, DATA_DIR: dataDir, ADMIN_EMAIL: 'admin@x.co', ADMIN_PASSWORD: 'adminpass1', ...env }, stdio: 'pipe' });
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/'); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  throw new Error('server did not start');
}
before(async () => {
  mock = http.createServer((req, res) => { req.resume(); req.on('end', () => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ content: [{ type: 'text', text: mockReplies.shift() || '{}' }] })); }); });
  await new Promise((r) => mock.listen(0, r));
  await start({ ANTHROPIC_API_KEY: 'test', ANTHROPIC_BASE_URL: `http://localhost:${mock.address().port}` });
});
after(() => { server.kill(); mock.close(); fs.rmSync(dataDir, { recursive: true, force: true }); });

const S = {}; // 테스트 간 공유 상태
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

test('관리자 부트스트랩·강사 계정 관리 권한', async () => {
  const a = await post('/api/login', { email: 'admin@x.co', password: 'adminpass1' });
  assert.equal(a.status, 200); assert.equal(a.user.role, 'admin'); S.admin = a.token; S.adminId = a.user.id;
  assert.equal((await post('/api/staff', { email: 't1@x.co', password: 'short', name: '김', role: 'teacher' }, S.admin)).status, 400);
  assert.equal((await post('/api/staff', { email: 't1@x.co', password: 'teacherpw1', name: '김강사', role: 'boss' }, S.admin)).status, 400);
  const t1 = await post('/api/staff', { email: 't1@x.co', password: 'teacherpw1', name: '김강사', role: 'teacher' }, S.admin);
  const t2 = await post('/api/staff', { email: 't2@x.co', password: 'teacherpw2', name: '박강사', role: 'teacher' }, S.admin);
  assert.equal(t1.status, 200); S.t1Id = t1.id; S.t2Id = t2.id;
  assert.equal((await post('/api/staff', { email: 't1@x.co', password: 'teacherpw1', name: 'x', role: 'teacher' }, S.admin)).status, 409);
  S.t1 = (await post('/api/login', { email: 't1@x.co', password: 'teacherpw1' })).token;
  S.t2 = (await post('/api/login', { email: 't2@x.co', password: 'teacherpw2' })).token;
  assert.equal((await get('/api/staff', S.t1)).status, 403); // 일반 강사는 강사 관리 불가
  assert.equal((await post('/api/staff', { email: 'z@x.co', password: 'teacherpw1', name: 'z', role: 'admin' }, S.t1)).status, 403);
  assert.equal((await get('/api/staff', S.admin)).staff.length, 3);
});

test('학생 등록·담당제 접근 제어·데이터 검증', async () => {
  assert.equal((await post('/api/students', { name: '응웬' }, undefined)).status, 401);
  const c = await post('/api/students', { name: '응웬 티 마이', group: 'high', goalType: 'abroad', goalLabel: 'TOPIK 4급', goalDate: '2027-01-15', services: { study: true, career: false } }, S.t1);
  assert.equal(c.status, 200); S.kidId = c.id; S.code = c.shareCode;
  const dash = await get(`/api/dashboard?today=${today}`, S.t1);
  assert.equal(dash.learners.length, 1); assert.equal(dash.learners[0].managed, true); assert.equal(dash.learners[0].goal.label, 'TOPIK 4급'); assert.equal(dash.learners[0].teacher.name, '김강사');
  assert.equal((await get('/api/dashboard', S.t2)).learners.length, 0); // 다른 강사에게는 안 보임
  assert.equal((await get(`/api/students/${S.kidId}`, S.t2)).status, 403);
  assert.equal((await get(`/api/students/${S.kidId}`, S.admin)).status, 200);
  assert.equal((await get('/api/dashboard', S.admin)).learners.length, 1);
  // 데이터 저장: 잘못된 값은 버림, chat 은 강사가 못 씀
  const w = await put(`/api/students/${S.kidId}/data`, { data: {
    schedule: [{ day: 1, start: 19, end: 20, label: '수학', color: '#123456' }, { day: 9, start: 1, end: 2, label: 'bad' }],
    weekplan: [{ subject: '수학', kind: 'zzz', detail: 'd', days: ['green', 'nope', 'red'] }],
    grades: [{ subject: '수학', score: '85', date: '2026-09-01' }, { subject: '', score: '1' }],
    checkins: [{ date: today, time: '09:10' }, { date: today, time: '10:00' }],
    goal: { type: 'abroad', label: 'TOPIK 4급', date: '2027-01-15', milestones: [{ text: '모의고사', date: 'bad', done: 1 }] },
    chat: [{ role: 'user', content: '강사가 쓰면 안 됨' }], evil: 1,
  } }, S.t1);
  assert.equal(w.status, 200);
  const r = await get(`/api/students/${S.kidId}`, S.t1);
  assert.equal(r.data.schedule.length, 1); assert.deepEqual(r.data.weekplan[0].days, ['green', '', 'red', '', '', '', '']); assert.equal(r.data.weekplan[0].kind, 'self');
  assert.equal(r.data.grades.length, 1); assert.equal(r.data.checkins.length, 1); assert.equal(r.data.goal.milestones[0].done, true); assert.equal(r.data.goal.milestones[0].date, '');
  assert.equal(r.data.chat, undefined); assert.equal(r.data.evil, undefined); assert.equal(r.canWrite, true);
  assert.equal((await put(`/api/students/${S.kidId}/data`, { data: { tasks: [] } }, S.t2)).status, 403);
});

test('정서웰빙: 동의 시 강사에게만, 보호자에게는 항상 숨김', async () => {
  const wb = { date: today, cat: { stable: 2, energy: 2, relation: 2, stress: 2 }, overall: 2, v: [] };
  await put(`/api/students/${S.kidId}/data`, { data: { deep: { wellbeing: [wb] } } }, S.t1); // 등록 학생은 기본 동의
  let d = await get(`/api/dashboard?today=${today}`, S.t1);
  assert.equal(d.learners[0].flags.wellbeing, true); assert.equal(d.learners[0].status, 'watch');
  assert.equal((await get(`/api/students/${S.kidId}`, S.t1)).data.deep.wellbeing.length, 1);
  const g = await post('/api/signup', { email: 'mom@x.co', password: 'password1', name: '어머니', role: 'guardian' });
  S.g = g.token;
  assert.equal((await post('/api/link', { code: S.code }, S.g)).status, 200);
  const gv = await get(`/api/students/${S.kidId}`, S.g);
  assert.equal(gv.status, 200); assert.equal(gv.data.deep.wellbeing, undefined); assert.equal(gv.data.chat, undefined); assert.equal(gv.canWrite, false);
  assert.equal((await put(`/api/students/${S.kidId}/data`, { data: { tasks: [] } }, S.g)).status, 403);
  d = await get(`/api/dashboard?today=${today}`, S.g);
  assert.equal(d.learners[0].flags.wellbeing, false);
  assert.equal(JSON.stringify(d).includes('"wellbeing":[') , false);
});

test('학생 계정 활성화(claim)·동의 철회·강사 저장 시 웰빙 기록 보존', async () => {
  assert.equal((await post('/api/claim', { code: 'NOPE0000', email: 's@x.co', password: 'studentpw1' })).status, 404);
  assert.equal((await post('/api/claim', { code: S.code, email: 's@x.co', password: 'short' })).status, 400);
  const c = await post('/api/claim', { code: S.code, email: 's@x.co', password: 'studentpw1' });
  assert.equal(c.status, 200); assert.equal(c.user.managed, false); S.kid = c.token; S.newCode = c.user.shareCode;
  assert.notEqual(S.newCode, S.code); // 활성화 코드는 교체됨
  assert.equal((await post('/api/claim', { code: S.code, email: 'again@x.co', password: 'studentpw1' })).status, 404);
  assert.equal((await post('/api/login', { email: 's@x.co', password: 'studentpw1' })).status, 200);
  // 학생이 동의 철회 → 강사/관리자에게 웰빙 숨김
  await put('/api/data', { data: { consent: { wellbeing: false } } }, S.kid);
  const tv = await get(`/api/students/${S.kidId}`, S.t1);
  assert.equal(tv.data.deep.wellbeing, undefined);
  assert.equal((await get(`/api/dashboard?today=${today}`, S.t1)).learners[0].flags.wellbeing, false);
  // 강사가 다른 검사 결과를 저장해도 학생의 웰빙 기록은 지워지지 않는다
  await put(`/api/students/${S.kidId}/data`, { data: { deep: { bigfive: [{ date: today, cat: { O: 4, C: 4, E: 4, A: 4, N: 4 }, overall: 4, v: [] }] } } }, S.t1);
  const own = await get('/api/me', S.kid);
  assert.equal(own.data.deep.wellbeing.length, 1); assert.equal(own.data.deep.bigfive.length, 1);
  // 본인 계정 학생의 동의 설정은 강사가 바꿀 수 없다
  await put(`/api/students/${S.kidId}/data`, { data: { consent: { wellbeing: true } } }, S.t1);
  assert.equal((await get('/api/me', S.kid)).data.consent.wellbeing, false);
});

test('담당 강사 재배정·삭제·연결 해제', async () => {
  assert.equal((await api('PUT', `/api/students/${S.kidId}/meta`, { teacherId: S.t2Id }, S.t1)).status, 403); // 관리자만
  assert.equal((await api('PUT', `/api/students/${S.kidId}/meta`, { teacherId: S.adminId }, S.admin)).status, 400); // 강사 아님
  assert.equal((await api('PUT', `/api/students/${S.kidId}/meta`, { teacherId: S.t2Id }, S.admin)).status, 200);
  assert.equal((await get('/api/dashboard', S.t1)).learners.length, 0);
  assert.equal((await get('/api/dashboard', S.t2)).learners.length, 1);
  // 본인 계정 학생을 삭제하면 삭제가 아니라 연결 해제
  const rm = await del(`/api/students/${S.kidId}`, S.t2);
  assert.equal(rm.unlinked, true); assert.equal((await get('/api/me', S.kid)).status, 200);
  // 강사가 등록한 미활성 학생은 삭제됨
  const c = await post('/api/students', { name: '임시' }, S.t2);
  assert.equal((await del(`/api/students/${c.id}`, S.t1)).status, 403);
  assert.equal((await del(`/api/students/${c.id}`, S.t2)).ok, true);
  assert.equal((await get(`/api/students/${c.id}`, S.admin)).status, 404);
});

test('강사 관리: 역할·비밀번호 변경, 마지막 관리자 보호', async () => {
  assert.equal((await put(`/api/staff/${S.adminId}`, { role: 'teacher' }, S.admin)).status, 400); // 마지막 관리자
  assert.equal((await del(`/api/staff/${S.adminId}`, S.admin)).status, 400);
  assert.equal((await api('POST', '/api/delete-account', { password: 'adminpass1' }, S.admin)).status, 400);
  assert.equal((await put(`/api/staff/${S.t1Id}`, { name: '김선생', role: 'admin' }, S.admin)).status, 200); // 관리자 승격
  assert.equal((await put(`/api/staff/${S.adminId}`, { role: 'teacher' }, S.admin)).status, 200); // 이제 다른 관리자가 있어서 가능
  assert.equal((await put(`/api/staff/${S.adminId}`, { role: 'admin' }, S.t1)).status, 200); // 새 관리자가 원복
  assert.equal((await put(`/api/staff/${S.t2Id}`, { password: 'newteacherpw' }, S.admin)).status, 200);
  assert.equal((await get('/api/dashboard', S.t2)).status, 401); // 기존 로그인 해제
  assert.equal((await post('/api/login', { email: 't2@x.co', password: 'newteacherpw' })).status, 200);
  assert.equal((await del(`/api/staff/${S.t1Id}`, S.t1)).status, 400); // 자기 자신
  assert.equal((await del(`/api/staff/${S.t2Id}`, S.admin)).ok, true);
});

test('AI 시간표·진단서 (목 API) 및 키 없을 때', async () => {
  mockReplies = ['{"schedule":[{"day":0,"start":19,"end":21,"label":"수학"},{"day":0,"start":20,"end":22,"label":"겹침"},{"day":5,"start":9,"end":11,"label":"영어"}],"weekplan":[{"subject":"수학","kind":"school","detail":"문제집"}]}'];
  const s = await post('/api/schedule', { group: 'high', hours: 6, subjects: ['수학', '영어'] });
  assert.equal(s.ai, true); assert.equal(s.schedule.length, 2); // 겹치는 블록 제거
  assert.equal(s.weekplan[0].kind, 'school');
  mockReplies = ['{"before":"b","overall":"종합 <b>총평</b>","subjects":[["언어","코멘트"]],"methods":[["수학",["a","b"]]],"weekplan":[{"subject":"수학","kind":"self","detail":"d"}],"checklist":["c1"]}'];
  const d = await post('/api/diagnosis', { group: 'high', name: '마이', today, tests: [{ name: '성격', headline: 'x', cats: [{ label: '개방성', value: 4 }] }] }, undefined, 'vi');
  assert.equal(d.diag.date, today); assert.equal(d.diag.lang, 'vi'); assert.equal(d.diag.methods[0][1].length, 2); assert.ok(d.diag.overall.includes('총평'));
  mockReplies = ['not json'];
  assert.equal((await post('/api/diagnosis', { group: 'high' })).status, 502);
  server.kill(); await new Promise((r) => setTimeout(r, 200));
  await start({ ANTHROPIC_API_KEY: '' });
  const f = await post('/api/schedule', { subjects: ['국어', '수학'], hours: 5 });
  assert.equal(f.ai, false); assert.equal(f.schedule.length, 5); assert.ok(f.weekplan.length === 2);
  const fv = await post('/api/schedule', { hours: 3 }, undefined, 'vi');
  assert.match(fv.schedule[0].label, /Ngữ văn|Toán|Tiếng Anh|Ôn tập/);
  const nd = await post('/api/diagnosis', { group: 'high' }, undefined, 'vi');
  assert.equal(nd.status, 503); assert.match(nd.error, /ANTHROPIC_API_KEY/);
});
