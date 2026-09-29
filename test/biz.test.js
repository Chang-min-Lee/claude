// 사업 운영 기능: 기관 설정, 학부모 공유 링크, 검사 AI 해석, 재진단 회차 저장, 재시작 후 설정 유지
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let server, mock, base, dataDir, port, mockReply = '';
const api = (method, p, body, token) => fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: 'Bearer ' + token }) }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) }));
const post = (p, b, t) => api('POST', p, b, t), get = (p, t) => api('GET', p, undefined, t), put = (p, b, t) => api('PUT', p, b, t), del = (p, t) => api('DELETE', p, undefined, t);
async function start() {
  server = spawn('node', ['server.js'], { env: { ...process.env, PORT: port, DATA_DIR: dataDir, ADMIN_EMAIL: 'admin@x.co', ADMIN_PASSWORD: 'adminpass1', ANTHROPIC_API_KEY: 'test', ANTHROPIC_BASE_URL: `http://localhost:${mock.address().port}` }, stdio: 'pipe' });
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/'); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  throw new Error('server did not start');
}
before(async () => {
  mock = http.createServer((req, res) => { req.resume(); req.on('end', () => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ content: [{ type: 'text', text: mockReply }] })); }); });
  await new Promise((r) => mock.listen(0, r));
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jinro-biz-')); port = 4100 + Math.floor(Math.random() * 400); base = `http://localhost:${port}`;
  await start();
});
after(() => { server.kill(); mock.close(); fs.rmSync(dataDir, { recursive: true, force: true }); });
const S = {};

test('기관 설정: 누구나 읽고 관리자만 바꾸며, 재시작 후에도 유지', async () => {
  const empty = await get('/api/settings'); assert.equal(empty.status, 200); assert.equal(empty.orgName, '');
  S.admin = (await post('/api/login', { email: 'admin@x.co', password: 'adminpass1' })).token;
  await post('/api/staff', { email: 't1@x.co', password: 'teacherpw1', name: '김강사', role: 'teacher' }, S.admin);
  await post('/api/staff', { email: 't2@x.co', password: 'teacherpw2', name: '박강사', role: 'teacher' }, S.admin);
  S.t1 = (await post('/api/login', { email: 't1@x.co', password: 'teacherpw1' })).token; S.t2 = (await post('/api/login', { email: 't2@x.co', password: 'teacherpw2' })).token;
  assert.equal((await put('/api/settings', { orgName: 'x' }, S.t1)).status, 403);
  assert.equal((await put('/api/settings', { orgName: '스마트어학원', orgPhone: '02-000-0000', orgEmail: 'a@b.co' })).status, 401);
  const r = await put('/api/settings', { orgName: '스마트어학원', orgPhone: '02-000-0000', orgEmail: 'a@b.co' }, S.admin);
  assert.equal(r.orgName, '스마트어학원');
  server.kill(); await new Promise((r) => setTimeout(r, 300)); await start();
  assert.equal((await get('/api/settings')).orgName, '스마트어학원');
  S.admin = (await post('/api/login', { email: 'admin@x.co', password: 'adminpass1' })).token; // 서버 재시작 후에도 세션이 살아 있어도 무방하나 안전하게 다시 로그인
});

test('학부모 공유 링크: 읽기 전용, 민감 정보 제외, 재발급·해제', async () => {
  const c = await post('/api/students', { name: '응웬 마이', group: 'high' }, S.t1); S.kid = c.id;
  await put(`/api/students/${S.kid}/data`, { data: { goal: { type: 'abroad', label: 'TOPIK', date: '2027-01-01', milestones: [] }, consent: { wellbeing: true }, deep: { wellbeing: [{ date: '2026-09-01', cat: { stable: 2, energy: 2, relation: 2, stress: 2 }, overall: 2, v: [] }] } } }, S.t1);
  await post(`/api/students/${S.kid}/messages`, { text: '비공개 메시지' }, S.t1);
  await post(`/api/students/${S.kid}/counsel`, { text: '비공개 상담' }, S.t1);
  assert.equal((await post(`/api/students/${S.kid}/parent-link`, {}, S.t2)).status, 403); // 담당 아님
  assert.equal((await post(`/api/students/${S.kid}/parent-link`, {})).status, 401);
  const a = await post(`/api/students/${S.kid}/parent-link`, {}, S.t1); assert.equal(a.status, 200); assert.ok(a.token.length >= 40);
  const v = await get(`/api/parent?t=${a.token}`);
  assert.equal(v.status, 200); assert.equal(v.name, '응웬 마이'); assert.equal(v.teacher, '김강사'); assert.equal(v.data.goal.label, 'TOPIK'); assert.equal(v.org.orgName, '스마트어학원');
  assert.equal(v.data.messages, undefined); assert.equal(v.data.counsel, undefined); assert.equal(v.data.chat, undefined); assert.equal(v.data.deep?.wellbeing, undefined);
  assert.equal((await get('/api/parent?t=short')).status, 404); assert.equal((await get('/api/parent')).status, 404);
  assert.equal((await get(`/api/students/${S.kid}`, S.t1)).user.parentToken, a.token); // 강사는 링크를 다시 볼 수 있다
  const b = await post(`/api/students/${S.kid}/parent-link`, {}, S.t1);
  assert.equal((await get(`/api/parent?t=${a.token}`)).status, 404); assert.equal((await get(`/api/parent?t=${b.token}`)).status, 200); // 재발급하면 이전 링크는 무효
  assert.equal((await del(`/api/students/${S.kid}/parent-link`, S.t1)).status, 200);
  assert.equal((await get(`/api/parent?t=${b.token}`)).status, 404);
});

test('검사 AI 해석: 정상/파싱 실패/잘못된 요청', async () => {
  const body = { group: 'high', name: '성격유형', headline: '성실형', goal: 'TOPIK', cats: [{ label: '성실성', value: 4.2 }, { label: '개방성', value: 3 }] };
  mockReply = '{"summary":"요약 <b>x</b>","strengths":["a","b"],"cautions":["c"],"tips":["d","e","f","g","h"]}';
  const r = await post('/api/testdetail', body); assert.equal(r.status, 200); assert.equal(r.detail.strengths.length, 2); assert.equal(r.detail.tips.length, 4); assert.ok(r.detail.summary.includes('요약'));
  mockReply = 'not json'; assert.equal((await post('/api/testdetail', body)).status, 502);
  assert.equal((await post('/api/testdetail', { group: 'high' })).status, 400);
});

test('재진단 회차(diagHist)와 진단서 검사 스냅샷 저장·검증', async () => {
  const d1 = { date: '2026-08-01', lang: 'ko', overall: '첫 진단', tests: { holland: 3.5, wellbeing: 2, bigfive: 9 } };
  const d2 = { date: '2026-09-01', lang: 'ko', overall: '재진단', tests: { holland: 4.1 } };
  assert.equal((await put(`/api/students/${S.kid}/data`, { data: { diag: d2, diagHist: [d1, { date: '', overall: '날짜 없음' }] } }, S.t1)).status, 200);
  const r = await get(`/api/students/${S.kid}`, S.t1);
  assert.equal(r.data.diagHist.length, 1); assert.deepEqual(r.data.diagHist[0].tests, { holland: 3.5, bigfive: 5 }); // 정서웰빙 제외, 범위 보정
  assert.deepEqual(r.data.diag.tests, { holland: 4.1 });
});

test('반·출결: 강사만 기록, 담당 학생만, 학생 본인은 못 씀 + 요약에 출석률', async () => {
  const day = new Date().toISOString().slice(0, 10);
  const c2 = await post('/api/students', { name: '레 남', group: 'middle' }, S.t2); S.kid2 = c2.id;
  await put(`/api/students/${S.kid}/data`, { data: { profile: { name: '응웬 마이', group: 'high', className: '고1 영어반', parentName: '엄마', parentPhone: '010-1', status: 'paused', nextSession: '2099-01-01' } } }, S.t1);
  const r = await post('/api/attendance', { date: day, marks: { [S.kid]: 'p', [S.kid2]: 'a', bogus: 'p' } }, S.t1);
  assert.equal(r.saved, 1); assert.equal(r.skipped, 2); // 남의 학생·없는 학생은 건너뜀
  assert.equal((await post('/api/attendance', { date: 'bad', marks: {} }, S.t1)).status, 400);
  assert.equal((await post('/api/attendance', { date: day, marks: {} })).status, 401);
  await post('/api/attendance', { date: '2026-01-01', marks: { [S.kid]: 'l' } }, S.t1);
  await post('/api/attendance', { date: '2026-01-02', marks: { [S.kid]: 'z' } }, S.t1); // 잘못된 값은 저장 안 됨
  const dash = await get(`/api/dashboard?today=${day}`, S.t1); const l = dash.learners.find((x) => x.id === S.kid);
  assert.equal(l.className, '고1 영어반'); assert.equal(l.enroll, 'paused'); assert.equal(l.nextSession, '2099-01-01'); assert.equal(l.attRate, 100); assert.equal(l.att[day], 'p'); assert.equal(l.att['2026-01-02'], undefined);
  const kid = await get(`/api/students/${S.kid}`, S.t1); assert.equal(kid.data.attendance['2026-01-01'], 'l'); assert.equal(kid.data.attendance['2026-01-02'], undefined);
  await post('/api/attendance', { date: day, marks: { [S.kid]: '' } }, S.t1); // 지우기
  assert.equal((await get(`/api/students/${S.kid}`, S.t1)).data.attendance[day], undefined);
  // 학생 본인 계정은 출결을 못 쓴다
  const me = await post('/api/signup', { email: 's@x.co', password: 'password12', name: '학생', role: 'learner' }); 
  await put('/api/data', { data: { attendance: { [day]: 'p' }, consent: { wellbeing: false, research: true } } }, me.token);
  const mine = await get('/api/me', me.token); assert.equal(mine.data.attendance, undefined); assert.equal(mine.data.consent.research, true); S.me = me;
});

test('상담 세션(주제·과제·다음 상담일), 문진·커리어·지원 현황 검증', async () => {
  const c = await post(`/api/students/${S.kid}/counsel`, { text: '진로 상담', topic: '유학 준비', next: '2099-02-01', actions: ['이력서 초안', '', 'a'.repeat(300)] }, S.t1);
  const e = c.counsel.at(-1); assert.equal(e.topic, '유학 준비'); assert.equal(e.next, '2099-02-01'); assert.equal(e.actions.length, 2); assert.equal(e.actions[1].length, 100); assert.equal(e.text, '진로 상담');
  const w = await put(`/api/students/${S.kid}/data`, { data: { intake: { concern: '진로가 막막함', evil: 'x' }, career: { job: '마케터', years: 99, skills: ['엑셀', ''], target: 'PM' }, jobs: [{ company: 'A사', role: 'PM', status: 'interview', date: '2026-09-01' }, { company: '', role: 'x' }, { company: 'B사', status: 'weird' }] } }, S.t1);
  assert.equal(w.status, 200);
  const d = (await get(`/api/students/${S.kid}`, S.t1)).data;
  assert.equal(d.intake.concern, '진로가 막막함'); assert.equal(d.intake.evil, undefined); assert.equal(d.career.years, 60); assert.deepEqual(d.career.skills, ['엑셀']);
  assert.equal(d.jobs.length, 2); assert.equal(d.jobs[1].status, 'interested');
});

test('데이터 현황(analytics)과 연구 동의 내보내기', async () => {
  await put(`/api/students/${S.kid}/data`, { data: { deep: { holland: [{ date: '2026-09-01', cat: { R: 3, I: 4, A: 3, S: 3, E: 3, C: 3 }, overall: 3.2, v: [] }, { date: '2026-09-10', cat: { R: 3, I: 5, A: 3, S: 3, E: 3, C: 3 }, overall: 3.3, v: ['same'] }] }, consent: { wellbeing: false, research: true } } }, S.t1);
  const a = await get('/api/analytics', S.admin);
  assert.equal(a.status, 200); assert.ok(a.n >= 3); assert.equal(a.tests.holland.n, 1); assert.equal(a.tests.holland.retake, 1); assert.equal(a.tests.holland.invalid, 1); assert.equal(a.tests.holland.cats.I, 5); assert.equal(a.complete, 0); assert.ok(a.research >= 2);
  assert.equal((await get('/api/analytics', S.t2)).n, 1); // 강사는 담당 학생만
  assert.equal((await get('/api/analytics', S.me.token)).status, 403);
  const ex = await get('/api/analytics/export', S.admin);
  assert.equal(ex.rows.length, a.research); assert.ok(ex.rows.every((r) => !('name' in r) && r.id.length === 10 && !('wellbeing' in r)));
  assert.equal((await get('/api/analytics/export', S.t1)).status, 403);
});

test('스터디카페 입·퇴실: 강사 기록, 이용 시간이 학습 기록에 반영, 중복·권한 방어', async () => {
  const day = new Date().toISOString().slice(0, 10);
  await put(`/api/students/${S.kid}/data`, { data: { profile: { name: '응웬 마이', group: 'high', orgType: 'studycafe', seat: 'A-12', passType: '월 정기권', passEnd: '2099-12-31' } } }, S.t1);
  assert.equal((await post('/api/visits', { date: day, time: '09:00', marks: { [S.kid]: 'in' } })).status, 401);
  assert.equal((await post('/api/visits', { date: day, time: '9:00', marks: {} }, S.t1)).status, 400);
  let r = await post('/api/visits', { date: day, time: '09:00', marks: { [S.kid]: 'in', [S.kid2]: 'in' } }, S.t1); assert.equal(r.saved, 1); assert.equal(r.skipped, 1); // 남의 학생은 건너뜀
  r = await post('/api/visits', { date: day, time: '09:30', marks: { [S.kid]: 'in' } }, S.t1); assert.equal(r.saved, 0); // 이미 입실 중
  let l = (await get(`/api/dashboard?today=${day}`, S.t1)).learners.find((x) => x.id === S.kid); assert.equal(l.inNow, true); assert.equal(l.seat, 'A-12'); assert.equal(l.passEnd, '2099-12-31');
  r = await post('/api/visits', { date: day, time: '11:30', marks: { [S.kid]: 'out' } }, S.t1); assert.equal(r.saved, 1);
  r = await post('/api/visits', { date: day, time: '12:00', marks: { [S.kid]: 'out' } }, S.t1); assert.equal(r.saved, 0); // 입실 중이 아님
  l = (await get(`/api/dashboard?today=${day}`, S.t1)).learners.find((x) => x.id === S.kid); assert.equal(l.inNow, false); assert.equal(l.todayMin, 150);
  const d = (await get(`/api/students/${S.kid}`, S.t1)).data; assert.equal(d.visits.length, 1); assert.equal(d.visits[0].out, '11:30'); assert.equal(d.log[day], 150);
});
