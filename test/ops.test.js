// 운영 설정: 프록시 뒤 클라이언트 IP 구분(TRUST_PROXY), HTTPS 헤더, 헤더 위조 방지, 상태 점검
const { test } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function run(env) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jinro-ops-')), port = 4900 + Math.floor(Math.random() * 90), base = `http://localhost:${port}`;
  const proc = spawn('node', ['server.js'], { env: { ...process.env, PORT: port, DATA_DIR: dir, ANTHROPIC_API_KEY: '', ...env }, stdio: 'pipe' });
  for (let i = 0; i < 60; i++) { try { await fetch(base + '/healthz'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  return { base, stop: () => new Promise((r) => { proc.once('exit', () => { fs.rmSync(dir, { recursive: true, force: true }); r(); }); proc.kill('SIGTERM'); }) };
}
const login = (base, xff) => fetch(base + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json', ...(xff && { 'x-forwarded-for': xff }) }, body: JSON.stringify({ email: 'no@x.co', password: 'wrongpass' }) }).then((r) => r.status);

test('TRUST_PROXY=1: 프록시 뒤에서도 사용자별로 속도 제한, HTTPS 헤더', async () => {
  const s = await run({ TRUST_PROXY: '1' });
  let last; for (let i = 0; i < 22; i++) last = await login(s.base, '1.1.1.1');
  assert.equal(last, 429); // 한 사용자는 제한에 걸리지만
  assert.equal(await login(s.base, '2.2.2.2'), 401); // 다른 사용자는 영향 없음
  const h = await fetch(s.base + '/healthz', { headers: { 'x-forwarded-proto': 'https' } });
  assert.equal((await h.json()).ok, true); assert.match(h.headers.get('strict-transport-security'), /max-age/);
  assert.equal((await fetch(s.base + '/healthz')).headers.get('strict-transport-security'), null); // HTTPS 가 아니면 붙이지 않음
  await s.stop();
});

test('TRUST_PROXY 미설정: X-Forwarded-For 위조로 속도 제한을 피할 수 없음', async () => {
  const s = await run({});
  let last; for (let i = 0; i < 22; i++) last = await login(s.base, `9.9.9.${i}`); // 매번 다른 IP 를 주장
  assert.equal(last, 429);
  assert.equal((await fetch(s.base + '/healthz', { headers: { 'x-forwarded-proto': 'https' } })).headers.get('strict-transport-security'), null);
  await s.stop();
});
