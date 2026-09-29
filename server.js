// 의존성 없는 Node 서버: 정적 파일 + 계정/동기화 + 보호자 대시보드 + Claude 프록시(API 키는 서버에만 보관)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const API_BASE = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const SESSION_MS = 30 * 24 * 3600 * 1000;
const SYNC_KEYS = ['profile', 'answers', 'tasks', 'log', 'chat', 'quiz'];

// ---------- 저장소 (JSON 파일) ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'db.json');
let db = { users: {}, sessions: {} };
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch {}
function persist() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

// ---------- 유틸 ----------
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const newCode = () => crypto.randomBytes(4).toString('hex').toUpperCase(); // 보호자 연결용 8자리 코드
const userByEmail = (email) => Object.values(db.users).find((u) => u.email === email);

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }

// 단순 메모리 속도 제한 (무차별 대입·AI 비용 남용 방지)
const hits = new Map();
function limit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) throw new HttpError(429, '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.');
  arr.push(now); hits.set(key, arr);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) { req.destroy(); reject(new HttpError(413, '요청이 너무 큽니다.')); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new HttpError(400, '잘못된 요청입니다.')); } });
  });
}

function authUser(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  const s = t && db.sessions[sha(t)];
  if (!s || s.exp < Date.now()) return null;
  return db.users[s.userId] || null;
}
const needUser = (req) => authUser(req) || (() => { throw new HttpError(401, '로그인이 필요해요.'); })();

function issueToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[sha(token)] = { userId, exp: Date.now() + SESSION_MS };
  for (const [k, v] of Object.entries(db.sessions)) if (v.exp < Date.now()) delete db.sessions[k];
  persist();
  return token;
}
const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role, shareCode: u.role === 'learner' ? u.shareCode : undefined });

// ---------- Claude ----------
const STYLE = {
  elementary: '초등학생에게 말하듯 쉬운 낱말과 짧은 문장으로, 친근하고 칭찬을 많이 하며 이모지를 조금 사용하세요.',
  middle: '중학생 눈높이로 친근하게, 구체적인 예시를 들어 설명하세요.',
  high: '고등학생에게 입시·전공 선택·진로 준비를 현실적으로 안내하세요.',
  college: '대학생에게 전공 활용, 인턴·자격증·포트폴리오 등 취업 준비를 구체적으로 안내하세요.',
  adult: '성인 학습자/직장인에게 커리어 전환, 재교육, 자기계발을 존중하는 어조로 실용적으로 안내하세요.',
};
const LEVEL = { elementary: '초등학생', middle: '중학생', high: '고등학생', college: '대학생', adult: '성인 학습자' };

function systemPrompt({ name, group, riasec, tasks } = {}) {
  return [
    '당신은 진로탐색과 학습관리를 돕는 AI 코치입니다. 한국어로 답합니다.',
    STYLE[group] || STYLE.adult,
    name ? `사용자 이름: ${String(name).slice(0, 20)}` : '',
    riasec ? `진로 흥미검사(RIASEC) 상위 유형: ${String(riasec).slice(0, 60)}` : '',
    tasks ? `현재 학습 목표/할 일: ${String(tasks).slice(0, 600)}` : '',
    '원칙: 정답을 강요하지 말고 질문을 통해 스스로 탐색하도록 돕고, 다음에 할 수 있는 작은 행동 1~3가지를 제안하세요.',
    '의학·법률·재정 등 전문 영역은 단정하지 말고 전문가 상담을 권하세요. 답변은 간결하게(최대 10문장 안팎).',
  ].filter(Boolean).join('\n');
}

async function callClaude(system, messages, maxTokens = 1024) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  let r;
  try {
    r = await fetch(`${API_BASE}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
    });
  } catch { throw new HttpError(502, 'AI 서버에 연결하지 못했습니다.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, j.error?.message || 'AI 호출 실패');
  return j.content.map((c) => c.text || '').join('');
}

function extractJson(text) {
  const m = text && text.match(/\{[\s\S]*\}/);
  if (!m) throw new HttpError(502, 'AI 응답을 해석하지 못했어요. 다시 시도해 주세요.');
  try { return JSON.parse(m[0]); } catch { throw new HttpError(502, 'AI 응답을 해석하지 못했어요. 다시 시도해 주세요.'); }
}
const clampInt = (v, lo, hi, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const str = (v, max) => String(v ?? '').trim().slice(0, max);

// ---------- 학습 계획 ----------
function fallbackPlan(goal, weeks, hours) {
  const steps = ['현재 수준 점검과 학습 자료 정하기', '핵심 개념 익히기', '문제/실습으로 적용하기', '틀린 부분 복습·정리하기', '실전 점검 및 다음 목표 세우기'];
  const tasks = [];
  for (let w = 1; w <= weeks; w++) tasks.push({ week: w, text: `${goal} — ${steps[Math.min(steps.length - 1, Math.floor(((w - 1) / weeks) * steps.length))]} (주 ${hours}시간)` });
  return tasks;
}

async function makePlan(body) {
  const goal = str(body.goal, 100);
  if (!goal) throw new HttpError(400, '목표를 입력해 주세요.');
  const weeks = clampInt(body.weeks, 1, 12, 4);
  const hours = clampInt(body.hours, 1, 40, 5);
  const group = LEVEL[body.group] ? body.group : 'adult';
  const text = await callClaude(
    `당신은 ${LEVEL[group]} 학습 계획 전문가입니다. 반드시 JSON만 출력하세요.`,
    [{ role: 'user', content: `목표: ${goal}\n기간: ${weeks}주, 주당 ${hours}시간.\n주차별로 1~3개의 구체적이고 확인 가능한 할 일을 만들어 다음 형식으로만 답하세요: {"tasks":[{"week":1,"text":"..."}]} (text는 60자 이내, 한국어)` }],
    1500);
  if (text === null) return { tasks: fallbackPlan(goal, weeks, hours), ai: false };
  const tasks = (extractJson(text).tasks || []).slice(0, 36)
    .map((t) => ({ week: clampInt(t.week, 1, weeks, 1), text: str(t.text, 80) })).filter((t) => t.text);
  if (!tasks.length) throw new HttpError(502, 'AI가 계획을 만들지 못했어요. 다시 시도해 주세요.');
  return { tasks, ai: true };
}

// ---------- 퀴즈 ----------
async function makeQuiz(body) {
  const subject = str(body.subject, 40);
  if (!subject) throw new HttpError(400, '과목/주제를 입력해 주세요.');
  const count = clampInt(body.count, 3, 10, 5);
  const group = LEVEL[body.group] ? body.group : 'adult';
  const text = await callClaude(
    `당신은 ${LEVEL[group]} 수준의 퀴즈 출제자입니다. 정확한 사실만 출제하고 반드시 JSON만 출력하세요.`,
    [{ role: 'user', content: `주제: ${subject}\n객관식(4지선다) ${count}문제를 다음 형식으로만 답하세요: {"questions":[{"q":"...","choices":["","","",""],"answer":0,"explain":"한두 문장 해설"}]} (answer는 0~3 정답 인덱스)` }],
    3000);
  if (text === null) throw new HttpError(503, '퀴즈는 AI 기능이라 서버에 ANTHROPIC_API_KEY 설정이 필요해요.');
  const questions = (extractJson(text).questions || []).slice(0, count).map((q) => ({
    q: str(q.q, 300), choices: (q.choices || []).slice(0, 4).map((c) => str(c, 120)), answer: clampInt(q.answer, 0, 3, -1), explain: str(q.explain, 300),
  })).filter((q) => q.q && q.choices.length === 4 && q.answer >= 0);
  if (!questions.length) throw new HttpError(502, '퀴즈를 만들지 못했어요. 다시 시도해 주세요.');
  return { questions };
}

// ---------- 대시보드 요약 (보호자/교사에게는 요약만 공개, 상담 대화는 제외) ----------
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function summarize(u, todayStr) {
  const d = u.data || {};
  const log = d.log || {};
  const [y, m, dd] = todayStr.split('-').map(Number);
  const base = new Date(y, m - 1, dd);
  const week = [...Array(7)].map((_, i) => { const x = new Date(base); x.setDate(x.getDate() - (6 - i)); return log[dayKey(x)] || 0; });
  const cur = new Date(base);
  if (!log[dayKey(cur)]) cur.setDate(cur.getDate() - 1);
  let streak = 0;
  while (log[dayKey(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
  const sc = {};
  Object.entries(d.answers || {}).forEach(([i, v]) => { const t = 'RIASEC'[Math.floor(i / 2)]; if (t) sc[t] = (sc[t] || 0) + (+v || 0); });
  const top = Object.keys(d.answers || {}).length === 12 ? Object.keys(sc).sort((a, b) => sc[b] - sc[a]).slice(0, 2) : [];
  const tasks = d.tasks || [];
  return {
    id: u.id, name: u.name, group: d.profile?.group || null, streak, week, today: week[6],
    openTasks: tasks.filter((t) => !t.done).slice(0, 5).map((t) => t.text), doneCount: tasks.filter((t) => t.done).length, openCount: tasks.filter((t) => !t.done).length,
    riasec: top, quiz: (d.quiz || []).slice(-5),
  };
}

// ---------- 라우터 ----------
const ip = (req) => req.socket.remoteAddress || '';
const routes = {
  'POST /api/signup': async (req) => {
    limit('auth:' + ip(req), 20, 15 * 60000);
    const b = await readBody(req);
    const email = str(b.email, 100).toLowerCase(), password = String(b.password || ''), name = str(b.name, 20);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, '올바른 이메일을 입력해 주세요.');
    if (password.length < 8) throw new HttpError(400, '비밀번호는 8자 이상이어야 해요.');
    if (!name) throw new HttpError(400, '이름을 입력해 주세요.');
    if (userByEmail(email)) throw new HttpError(409, '이미 가입된 이메일이에요.');
    const role = b.role === 'guardian' ? 'guardian' : 'learner';
    const salt = crypto.randomBytes(16).toString('hex');
    const u = { id: crypto.randomUUID(), email, name, role, salt, hash: hashPw(password, salt), data: {}, links: [], shareCode: newCode() };
    db.users[u.id] = u;
    return { token: issueToken(u.id), user: publicUser(u) };
  },
  'POST /api/login': async (req) => {
    limit('auth:' + ip(req), 20, 15 * 60000);
    const b = await readBody(req);
    const u = userByEmail(str(b.email, 100).toLowerCase());
    const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw(String(b.password || ''), u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
    if (!ok) throw new HttpError(401, '이메일 또는 비밀번호가 맞지 않아요.');
    return { token: issueToken(u.id), user: publicUser(u) };
  },
  'POST /api/logout': async (req) => {
    const t = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (t) { delete db.sessions[sha(t)]; persist(); }
    return { ok: true };
  },
  'GET /api/me': async (req) => { const u = needUser(req); return { user: publicUser(u), data: u.data || {} }; },
  'PUT /api/data': async (req) => {
    const u = needUser(req);
    if (u.role !== 'learner') throw new HttpError(403, '학습자 계정만 저장할 수 있어요.');
    const b = await readBody(req);
    const data = {};
    for (const k of SYNC_KEYS) if (b.data && k in b.data) data[k] = b.data[k];
    if (Array.isArray(data.chat)) data.chat = data.chat.slice(-50);
    if (Array.isArray(data.quiz)) data.quiz = data.quiz.slice(-100);
    u.data = { ...u.data, ...data };
    persist();
    return { ok: true };
  },
  'POST /api/regen-code': async (req) => { const u = needUser(req); u.shareCode = newCode(); persist(); return { shareCode: u.shareCode }; },
  'POST /api/link': async (req) => {
    limit('link:' + ip(req), 10, 15 * 60000);
    const u = needUser(req);
    if (u.role !== 'guardian') throw new HttpError(403, '보호자/교사 계정만 연결할 수 있어요.');
    const code = str((await readBody(req)).code, 8).toUpperCase();
    const learner = Object.values(db.users).find((x) => x.role === 'learner' && x.shareCode === code);
    if (!code || !learner) throw new HttpError(404, '연결 코드를 찾을 수 없어요.');
    if (!u.links.includes(learner.id)) u.links.push(learner.id);
    persist();
    return { ok: true, name: learner.name };
  },
  'POST /api/unlink': async (req) => {
    const u = needUser(req);
    const id = str((await readBody(req)).id, 60);
    if (u.role === 'guardian') u.links = u.links.filter((x) => x !== id);
    else if (db.users[id]) db.users[id].links = db.users[id].links.filter((x) => x !== u.id); // 학습자가 보호자 연결을 끊음
    persist();
    return { ok: true };
  },
  'GET /api/guardians': async (req) => {
    const u = needUser(req);
    return { guardians: Object.values(db.users).filter((g) => g.role === 'guardian' && g.links.includes(u.id)).map((g) => ({ id: g.id, name: g.name })) };
  },
  'GET /api/dashboard': async (req, url) => {
    const u = needUser(req);
    if (u.role !== 'guardian') throw new HttpError(403, '보호자/교사 전용이에요.');
    const today = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('today') || '') ? url.searchParams.get('today') : dayKey(new Date());
    return { learners: u.links.map((id) => db.users[id]).filter(Boolean).map((l) => summarize(l, today)) };
  },
  'POST /api/chat': async (req) => {
    limit('ai:' + ip(req), 30, 10 * 60000);
    const b = await readBody(req);
    const messages = (b.messages || []).slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
    if (!messages.length || messages[0].role !== 'user') throw new HttpError(400, '메시지가 필요합니다.');
    const reply = await callClaude(systemPrompt(b.profile), messages);
    return { reply: reply ?? 'AI 코치를 쓰려면 서버에 ANTHROPIC_API_KEY 환경변수를 설정해 주세요. (진로검사·학습관리는 키 없이도 사용할 수 있어요.)' };
  },
  'POST /api/plan': async (req) => { limit('ai:' + ip(req), 30, 10 * 60000); return makePlan(await readBody(req)); },
  'POST /api/quiz': async (req) => { limit('ai:' + ip(req), 30, 10 * 60000); return makeQuiz(await readBody(req)); },
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const handler = routes[`${req.method} ${url.pathname}`];
  if (handler) {
    try {
      const out = await handler(req, url);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(out));
    } catch (e) {
      const code = e instanceof HttpError ? e.code : 500;
      if (code === 500) console.error(e);
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: code === 500 ? '서버 오류가 발생했어요.' : e.message }));
    }
  }
  if (url.pathname.startsWith('/api/')) { res.writeHead(404); return res.end(); }
  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname);
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
