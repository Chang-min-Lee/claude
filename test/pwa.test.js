// 앱 설치(PWA) 파일과 다국어 문구의 정합성을 지키는 정적 테스트
const { test } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const PUB = path.join(__dirname, '..', 'public');

test('서비스 워커가 캐시하는 모든 파일과 매니페스트 아이콘이 실제로 제공된다', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jinro-pwa-')), port = 5100 + Math.floor(Math.random() * 90), base = `http://localhost:${port}`;
  const proc = spawn('node', ['server.js'], { env: { ...process.env, PORT: port, DATA_DIR: dir, ANTHROPIC_API_KEY: '' }, stdio: 'pipe' });
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(base + '/healthz'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
    const sw = fs.readFileSync(path.join(PUB, 'sw.js'), 'utf8');
    const shell = JSON.parse(sw.match(/const SHELL = (\[.*?\]);/)[1].replace(/'/g, '"'));
    for (const p of shell) { const r = await fetch(base + p); assert.equal(r.status, 200, p + ' 응답'); }
    const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
    for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.join(PUB, m[1])), 'index.html 이 참조하는 파일 없음: ' + m[1]);
    for (const m of html.matchAll(/<script src="([^"]+\.js)"/g)) assert.ok(shell.includes('/' + m[1]), '서비스 워커 캐시 목록에 없음: ' + m[1]);
    const mf = await fetch(base + '/manifest.webmanifest'); assert.match(mf.headers.get('content-type'), /manifest\+json/);
    const manifest = await mf.json();
    assert.equal(manifest.display, 'standalone');
    for (const ic of manifest.icons) assert.equal((await fetch(base + '/' + ic.src)).status, 200, ic.src);
    assert.match((await fetch(base + '/sw.js')).headers.get('content-type'), /javascript/);
  } finally { proc.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('한국어·베트남어 문구 키가 서로 같고, 코드가 쓰는 키가 모두 정의돼 있다', () => {
  const ctx = { localStorage: { getItem: () => null, setItem() {} }, navigator: { language: 'ko' } };
  vm.createContext(ctx);
  vm.runInContext(['i18n.js', 'i18n2.js', 'tests.js'].map((f) => fs.readFileSync(path.join(PUB, f), 'utf8')).join('\n') + '\n;this.out={UI,TEST_TEXT,CONTENT}', ctx);
  const { UI, TEST_TEXT, CONTENT } = ctx.out;
  const ko = Object.keys(UI.ko), vi = Object.keys(UI.vi);
  assert.deepEqual(ko.filter((k) => !vi.includes(k)), [], 'vi 에 없는 키'); assert.deepEqual(vi.filter((k) => !ko.includes(k)), [], 'ko 에 없는 키');
  for (const L of ['ko', 'vi']) for (const [k, v] of Object.entries(UI[L])) assert.ok(String(v).trim(), `${L}.${k} 가 비어 있음`);
  // 자리표시자({name} 등)도 두 언어가 같아야 한다
  for (const k of ko) assert.deepEqual([...UI.ko[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), [...UI.vi[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), `자리표시자 불일치: ${k}`);
  const used = new Set();
  for (const f of fs.readdirSync(PUB).filter((f) => f.endsWith('.js') && !['i18n.js', 'i18n2.js', 'tests.js', 'sw.js', 'theme.js'].includes(f)))
    for (const m of fs.readFileSync(path.join(PUB, f), 'utf8').matchAll(/\b(?:t|unit)\('([a-z0-9_]+)'/g)) used.add(m[1]);
  const dynamic = ['int_wb_', 'tab_', 'sub_', 'kind_', 'gt_', 'st_', 'role_', 'int_', 'valid_', 'g_', 'lv_', 'lk', 'bd_', 'theme_', 'demo_', 'ot_', 'jb_', 'iv_', 'fb_', 'auth_tab_', 'att_', 'en_', 'intake_'];
  const undefinedKeys = [...used].filter((k) => !ko.includes(k) && !dynamic.includes(k));
  assert.deepEqual(undefinedKeys, [], '정의되지 않은 문구 키');
  // 동적으로 만드는 키(탭·서브탭 등)도 모두 정의돼 있어야 한다
  const tabs = ['home', 'tests', 'study', 'plan', 'report', 'messages', 'quiz', 'coach', 'account', 'dash', 'roster', 'register', 'staff', 'counsel', 'input', 'classes', 'data', 'career', 'cafe'];
  const subs = ['schedule', 'weekplan', 'goal', 'grades', 'comp', 'student', 'parent', 'diag', 'teacher'];
  const need = [...tabs.map((x) => 'tab_' + x), ...subs.map((x) => 'sub_' + x), 'kind_self', 'kind_school', 'kind_extra', 'gt_abroad', 'gt_school', 'gt_career', 'gt_general', 'st_ok', 'st_watch', 'role_learner', 'role_guardian', 'role_teacher', 'role_admin', 'int_loose', 'int_normal', 'int_tight', 'int_wb_0', 'int_wb_1', 'int_wb_2', 'valid_same', 'valid_run', 'valid_flat', 'theme_auto', 'theme_light', 'theme_dark', 'ot_language', 'ot_studyroom', 'ot_consultant', 'ot_studycafe', ...['wb', 'msg', 'idle', 'att', 'val', 'dday'].map((x) => 'iv_' + x), ...['bug', 'confusing', 'idea', 'praise'].map((x) => 'fb_' + x), ...['login', 'signup', 'claim'].map((x) => 'auth_tab_' + x), ...['interested', 'applied', 'interview', 'offer', 'rejected', 'closed'].map((x) => 'jb_' + x), ...['p', 'l', 'a', 'e'].map((x) => 'att_' + x), 'en_active', 'en_paused', 'en_left', ...['concern', 'goal', 'strengths', 'interests', 'habits', 'background'].map((x) => 'intake_' + x), ...['checkin', 'streak3', 'streak7', 'streak30', 'test1', 'comp', 'goal', 'sched', 'weekplan', 'quiz', 'hours10'].map((x) => 'bd_' + x), ...['elementary', 'middle', 'high', 'college', 'adult'].flatMap((g) => ['g_' + g, 'lv_' + g]), ...[1, 2, 3, 4, 5].map((n) => 'lk' + n)];
  assert.deepEqual(need.filter((k) => !ko.includes(k)), [], '동적 키 누락');
  // 검사 문항: 두 언어의 문항 수·정답 위치가 같아야 한다
  for (const id of Object.keys(TEST_TEXT.ko)) { assert.equal(TEST_TEXT.ko[id].items.length, TEST_TEXT.vi[id].items.length, id + ' 문항 수'); assert.deepEqual(Object.keys(TEST_TEXT.ko[id].cats), Object.keys(TEST_TEXT.vi[id].cats), id + ' 영역'); }
  for (const L of ['ko', 'vi']) { const T = CONTENT[L].tips; assert.equal(Object.keys(T.bigfive).length, 5); assert.equal(T.sdlBand.length, 4); }
});
