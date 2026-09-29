// 저장소: 재시작 후 유지, JSON→SQLite 자동 이전, JSON 폴백, 백업 복원
const { test } = require('node:test');
const assert = require('node:assert');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const jpost = (base, p, body, token, method = 'POST') => fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: 'Bearer ' + token }) }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) }));
async function run(dir, env = {}) {
  const port = 4100 + Math.floor(Math.random() * 800), base = `http://localhost:${port}`;
  const proc = spawn('node', ['server.js'], { env: { ...process.env, PORT: port, DATA_DIR: dir, ANTHROPIC_API_KEY: '', ...env }, stdio: 'pipe' });
  for (let i = 0; i < 60; i++) { try { const h = await fetch(base + '/healthz').then((r) => r.json()); return { base, proc, health: h }; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  throw new Error('server did not start');
}
const stop = (s) => new Promise((r) => { s.proc.once('exit', r); s.proc.kill('SIGTERM'); });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'jinro-store-'));

test('SQLite: 재시작 후에도 계정·데이터 유지, 삭제도 영구 반영', async () => {
  const dir = tmp();
  let s = await run(dir);
  assert.equal(s.health.storage, 'sqlite');
  const u = await jpost(s.base, '/api/signup', { email: 'p@x.co', password: 'password1', name: '영속' });
  await jpost(s.base, '/api/data', { data: { tasks: [{ text: '유지되는 할 일', done: false }], goal: { type: 'abroad', label: 'TOPIK', date: '2027-01-01', milestones: [] } } }, u.token, 'PUT');
  const u2 = await jpost(s.base, '/api/signup', { email: 'q@x.co', password: 'password1', name: '삭제될 사람' });
  await stop(s);
  s = await run(dir);
  const login = await jpost(s.base, '/api/login', { email: 'p@x.co', password: 'password1' });
  assert.equal(login.status, 200);
  const me = await fetch(s.base + '/api/me', { headers: { authorization: 'Bearer ' + login.token } }).then((r) => r.json());
  assert.equal(me.data.tasks[0].text, '유지되는 할 일'); assert.equal(me.data.goal.label, 'TOPIK');
  // 재시작 전에 발급한 세션 토큰도 그대로 유효
  assert.equal((await fetch(s.base + '/api/me', { headers: { authorization: 'Bearer ' + u.token } })).status, 200);
  // 계정 삭제는 영구 반영
  assert.equal((await jpost(s.base, '/api/delete-account', { password: 'password1' }, u2.token)).status, 200);
  await stop(s); s = await run(dir);
  assert.equal((await jpost(s.base, '/api/login', { email: 'q@x.co', password: 'password1' })).status, 401);
  assert.equal((await fetch(s.base + '/api/me', { headers: { authorization: 'Bearer ' + u2.token } })).status, 401);
  await stop(s); fs.rmSync(dir, { recursive: true, force: true });
});

test('기존 db.json 은 첫 실행 때 SQLite 로 자동 이전', async () => {
  const dir = tmp();
  let s = await run(dir, { STORAGE: 'json' }); // JSON 저장소로 데이터 만들기
  assert.equal(s.health.storage, 'json');
  const u = await jpost(s.base, '/api/signup', { email: 'old@x.co', password: 'password1', name: '옛 사용자' });
  await jpost(s.base, '/api/data', { data: { tasks: [{ text: '옛 할 일', done: true }] } }, u.token, 'PUT');
  await stop(s);
  assert.ok(fs.existsSync(path.join(dir, 'db.json')));
  s = await run(dir); // 기본(SQLite)으로 다시 실행
  assert.equal(s.health.storage, 'sqlite');
  assert.ok(fs.existsSync(path.join(dir, 'db.json.migrated'))); assert.ok(!fs.existsSync(path.join(dir, 'db.json')));
  const login = await jpost(s.base, '/api/login', { email: 'old@x.co', password: 'password1' });
  assert.equal(login.status, 200);
  const me = await fetch(s.base + '/api/me', { headers: { authorization: 'Bearer ' + login.token } }).then((r) => r.json());
  assert.equal(me.data.tasks[0].text, '옛 할 일');
  await stop(s); fs.rmSync(dir, { recursive: true, force: true });
});

test('백업 스크립트: 스냅샷을 만들고 그대로 복원해 서버가 뜬다', async () => {
  const dir = tmp(), restore = tmp();
  let s = await run(dir);
  const u = await jpost(s.base, '/api/signup', { email: 'b@x.co', password: 'password1', name: '백업' });
  await jpost(s.base, '/api/data', { data: { grades: [{ subject: '수학', score: '90', date: '2026-09-01', note: '' }] } }, u.token, 'PUT');
  const dest = path.join(restore, 'app.sqlite');
  execFileSync('node', ['scripts/backup.js', dest], { env: { ...process.env, DATA_DIR: dir } }); // 서버가 켜져 있는 상태에서 백업
  await stop(s);
  s = await run(restore);
  const login = await jpost(s.base, '/api/login', { email: 'b@x.co', password: 'password1' });
  const me = await fetch(s.base + '/api/me', { headers: { authorization: 'Bearer ' + login.token } }).then((r) => r.json());
  assert.equal(me.data.grades[0].score, '90');
  await stop(s); fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(restore, { recursive: true, force: true });
});
