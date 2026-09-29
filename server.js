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
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const SESSION_MS = 30 * 24 * 3600 * 1000;
const { sanitizers, sanitizeData, DATA_KEYS, CLIENT_KEYS, MAX_DATA_BYTES, SHARED_DEEP, clip: clipStr, int: intIn, isDate } = require('./lib/sanitize');
const SEC_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
};

// ---------- 저장소 (SQLite 우선, 없으면 JSON) ----------
const { openStore } = require('./lib/store');
const store = openStore(DATA_DIR);
const db = store.load();
// 바뀐 사용자만 저장한다.
function persist(...users) { for (const u of users) if (u && db.users[u.id]) store.saveUser(u); }
function removeUserEverywhere(id) { // 사용자를 지우고 다른 사용자의 연결 목록에서도 정리
  delete db.users[id]; store.removeUser(id);
  for (const o of Object.values(db.users)) if ((o.links || []).includes(id)) { o.links = o.links.filter((x) => x !== id); persist(o); }
}

// ---------- 유틸 ----------
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const newCode = () => crypto.randomBytes(4).toString('hex').toUpperCase(); // 보호자 연결용 8자리 코드
const checkPw = (u, pw) => crypto.timingSafeEqual(Buffer.from(hashPw(String(pw || ''), u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
function dropSessions(userId) { for (const [k, v] of Object.entries(db.sessions)) if (v.userId === userId) delete db.sessions[k]; store.removeSessionsOf(userId); }
const userByEmail = (email) => Object.values(db.users).find((u) => u.email === email);


// ---------- 다국어 (요청의 X-Lang 헤더: ko | vi) ----------
const LANGS = ['ko', 'vi'];
const langOf = (req) => { const l = String(req.headers['x-lang'] || '').slice(0, 2).toLowerCase(); return LANGS.includes(l) ? l : 'ko'; };
const M = {
  ko: {
    tooMany: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', tooLarge: '요청이 너무 큽니다.', badReq: '잘못된 요청입니다.', needLogin: '로그인이 필요해요.',
    aiConnect: 'AI 서버에 연결하지 못했습니다.', aiFail: 'AI 호출 실패', aiParse: 'AI 응답을 해석하지 못했어요. 다시 시도해 주세요.',
    goalReq: '목표를 입력해 주세요.', planFail: 'AI가 계획을 만들지 못했어요. 다시 시도해 주세요.', subjectReq: '과목/주제를 입력해 주세요.',
    quizNeedKey: '퀴즈는 AI 기능이라 서버에 ANTHROPIC_API_KEY 설정이 필요해요.', quizFail: '퀴즈를 만들지 못했어요. 다시 시도해 주세요.',
    badEmail: '올바른 이메일을 입력해 주세요.', pwShort: '비밀번호는 8자 이상이어야 해요.', nameReq: '이름을 입력해 주세요.', emailTaken: '이미 가입된 이메일이에요.', badCred: '이메일 또는 비밀번호가 맞지 않아요.',
    learnerOnly: '학습자 계정만 저장할 수 있어요.', guardianOnlyLink: '보호자/교사 계정만 연결할 수 있어요.', codeNotFound: '연결 코드를 찾을 수 없어요.', guardianOnly: '보호자/교사 전용이에요.',
    curPwBad: '현재 비밀번호가 맞지 않아요.', newPwShort: '새 비밀번호는 8자 이상이어야 해요.', pwBad: '비밀번호가 맞지 않아요.', msgReq: '메시지가 필요합니다.', serverErr: '서버 오류가 발생했어요.',
    diagNeedKey: 'AI 진단서는 서버에 ANTHROPIC_API_KEY 설정이 필요해요. (아래의 기본 해석은 키 없이도 볼 수 있어요.)', forbidden: '접근 권한이 없어요.', notFound: '찾을 수 없어요.', staffOnly: '강사/관리자 전용이에요.', adminOnly: '관리자 전용이에요.',
    lastAdmin: '마지막 남은 관리자 계정은 변경하거나 삭제할 수 없어요.', roleBad: '역할이 올바르지 않아요.', notManaged: '강사가 등록한 학생만 활성화할 수 있어요.', dataTooBig: '저장할 데이터가 너무 커요.', selfDelete: '내 계정은 여기서 삭제할 수 없어요. 계정 탭을 이용해 주세요.',
    resetBad: '재설정 코드가 올바르지 않거나 만료됐어요.', noReset: '이메일 계정이 있는 사용자만 재설정 코드를 발급할 수 있어요.',
    msgEmpty: '메시지를 입력해 주세요.', noNote: '내용을 입력해 주세요.',
    noKeyChat: 'AI 코치를 쓰려면 서버에 ANTHROPIC_API_KEY 환경변수를 설정해 주세요. (진로검사·학습관리는 키 없이도 사용할 수 있어요.)',
  },
  vi: {
    tooMany: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', tooLarge: 'Yêu cầu quá lớn.', badReq: 'Yêu cầu không hợp lệ.', needLogin: 'Bạn cần đăng nhập.',
    aiConnect: 'Không kết nối được máy chủ AI.', aiFail: 'Gọi AI thất bại.', aiParse: 'Không đọc được phản hồi của AI. Vui lòng thử lại.',
    goalReq: 'Vui lòng nhập mục tiêu.', planFail: 'AI chưa tạo được kế hoạch. Vui lòng thử lại.', subjectReq: 'Vui lòng nhập môn học/chủ đề.',
    quizNeedKey: 'Trắc nghiệm là tính năng AI nên máy chủ cần cài đặt ANTHROPIC_API_KEY.', quizFail: 'Chưa tạo được câu hỏi. Vui lòng thử lại.',
    badEmail: 'Vui lòng nhập email hợp lệ.', pwShort: 'Mật khẩu phải có ít nhất 8 ký tự.', nameReq: 'Vui lòng nhập tên.', emailTaken: 'Email này đã được đăng ký.', badCred: 'Email hoặc mật khẩu không đúng.',
    learnerOnly: 'Chỉ tài khoản người học mới có thể lưu dữ liệu.', guardianOnlyLink: 'Chỉ tài khoản phụ huynh/giáo viên mới có thể kết nối.', codeNotFound: 'Không tìm thấy mã kết nối.', guardianOnly: 'Chỉ dành cho phụ huynh/giáo viên.',
    curPwBad: 'Mật khẩu hiện tại không đúng.', newPwShort: 'Mật khẩu mới phải có ít nhất 8 ký tự.', pwBad: 'Mật khẩu không đúng.', msgReq: 'Cần có tin nhắn.', serverErr: 'Đã xảy ra lỗi máy chủ.',
    diagNeedKey: 'Bản chẩn đoán AI cần cài đặt ANTHROPIC_API_KEY trên máy chủ. (Phần diễn giải cơ bản bên dưới vẫn xem được khi không có khóa.)', forbidden: 'Bạn không có quyền truy cập.', notFound: 'Không tìm thấy.', staffOnly: 'Chỉ dành cho giáo viên/quản trị viên.', adminOnly: 'Chỉ dành cho quản trị viên.',
    lastAdmin: 'Không thể thay đổi hoặc xóa tài khoản quản trị viên cuối cùng.', roleBad: 'Vai trò không hợp lệ.', notManaged: 'Chỉ học viên do giáo viên đăng ký mới có thể kích hoạt.', dataTooBig: 'Dữ liệu cần lưu quá lớn.', selfDelete: 'Không thể xóa tài khoản của chính bạn ở đây. Hãy dùng tab Tài khoản.',
    resetBad: 'Mã đặt lại không đúng hoặc đã hết hạn.', noReset: 'Chỉ có thể cấp mã đặt lại cho người dùng đã có tài khoản email.',
    msgEmpty: 'Vui lòng nhập tin nhắn.', noNote: 'Vui lòng nhập nội dung.',
    noKeyChat: 'Để dùng AI, hãy cài biến môi trường ANTHROPIC_API_KEY trên máy chủ. (Trắc nghiệm sở thích và quản lý học tập vẫn dùng được khi không có khóa.)',
  },
};

class HttpError extends Error { constructor(code, key, raw) { super(raw || key); this.code = code; this.key = key; this.raw = raw; } }

// 단순 메모리 속도 제한 (무차별 대입·AI 비용 남용 방지)
const hits = new Map();
function limit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) throw new HttpError(429, 'tooMany');
  arr.push(now); hits.set(key, arr);
}

setInterval(() => { const now = Date.now(); for (const [k, arr] of hits) if (!arr.length || now - arr.at(-1) > 3600000) hits.delete(k); }, 600000).unref();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) { req.destroy(); reject(new HttpError(413, 'tooLarge')); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new HttpError(400, 'badReq')); } });
  });
}

function authUser(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  const s = t && db.sessions[sha(t)];
  if (!s || s.exp < Date.now()) return null;
  return db.users[s.userId] || null;
}
const needUser = (req) => authUser(req) || (() => { throw new HttpError(401, 'needLogin'); })();

function issueToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const rec = { userId, exp: Date.now() + SESSION_MS };
  db.sessions[sha(token)] = rec; store.saveSession(sha(token), rec);
  for (const [k, v] of Object.entries(db.sessions)) if (v.exp < Date.now()) delete db.sessions[k];
  store.purgeSessions(Date.now());
  persist(db.users[userId]); // 가입·활성화·비밀번호 변경 직후의 사용자 변경도 함께 저장
  return token;
}
const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role, shareCode: u.role === 'learner' ? u.shareCode : undefined, managed: u.role === 'learner' ? !u.email : undefined });

// ---------- 역할·접근 제어 ----------
// learner: 본인 / guardian: 연결된 학습자 읽기 전용 / teacher: 연결된(담당) 학습자 읽기·쓰기 / admin: 모든 학습자
const isStaff = (u) => u.role === 'teacher' || u.role === 'admin';
function canRead(actor, learner) {
  if (!learner || learner.role !== 'learner') return false;
  if (actor.id === learner.id || actor.role === 'admin') return true;
  return (actor.role === 'teacher' || actor.role === 'guardian') && (actor.links || []).includes(learner.id);
}
const canWrite = (actor, learner) => !!learner && learner.role === 'learner' && (actor.id === learner.id || actor.role === 'admin' || (actor.role === 'teacher' && (actor.links || []).includes(learner.id)));
function learnerOr404(actor, id, write = false) {
  const l = db.users[id];
  if (!l || l.role !== 'learner' || !(write ? canWrite(actor, l) : canRead(actor, l))) throw new HttpError(l ? 403 : 404, l ? 'forbidden' : 'notFound');
  return l;
}
// 다른 사람이 볼 때의 데이터: 상담 대화는 절대 공개하지 않고, 정서웰빙은 본인 동의가 있을 때 강사/관리자에게만 공개한다.
function dataFor(actor, learner) {
  const d = { ...(learner.data || {}) };
  if (actor.id === learner.id) { delete d.counsel; return d; } // 상담일지는 강사용 내부 기록
  delete d.chat;
  if (!isStaff(actor)) { delete d.messages; delete d.counsel; }
  const showWb = isStaff(actor) && !!d.consent?.wellbeing;
  if (d.deep && !showWb) { d.deep = { ...d.deep }; delete d.deep.wellbeing; }
  return d;
}
function unassignTeacher(learnerId) {
  for (const o of Object.values(db.users)) if (o.role === 'teacher' && (o.links || []).includes(learnerId)) { o.links = o.links.filter((x) => x !== learnerId); persist(o); }
}
function assignTeacher(learnerId, teacherId) { // 한 학생은 한 명의 담당 강사
  unassignTeacher(learnerId);
  const t = db.users[teacherId];
  if (t && t.role === 'teacher' && !t.links.includes(learnerId)) { t.links.push(learnerId); persist(t); }
}
const teacherOf = (learnerId) => Object.values(db.users).find((o) => o.role === 'teacher' && (o.links || []).includes(learnerId));
const adminCount = () => Object.values(db.users).filter((u) => u.role === 'admin').length;
function newUser(fields) { return { id: crypto.randomUUID(), data: {}, links: [], shareCode: newCode(), createdAt: Date.now(), ...fields }; }

// 환경변수 ADMIN_EMAIL / ADMIN_PASSWORD 로 최초 관리자 계정을 만든다 (이미 있으면 역할만 관리자로 보장, 비밀번호는 바꾸지 않음)
function bootstrapAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase(), pw = String(process.env.ADMIN_PASSWORD || '');
  if (!email || pw.length < 8) return;
  const existing = userByEmail(email);
  if (existing) { if (existing.role !== 'admin') { existing.role = 'admin'; persist(existing); } return; }
  const salt = crypto.randomBytes(16).toString('hex');
  const u = newUser({ email, name: '관리자', role: 'admin', salt, hash: hashPw(pw, salt) });
  db.users[u.id] = u; persist(u);
}
bootstrapAdmin();

// ---------- Claude ----------
const STYLE = {
  ko: {
    elementary: '초등학생에게 말하듯 쉬운 낱말과 짧은 문장으로, 친근하고 칭찬을 많이 하며 이모지를 조금 사용하세요.',
    middle: '중학생 눈높이로 친근하게, 구체적인 예시를 들어 설명하세요.',
    high: '고등학생에게 입시·전공 선택·진로 준비를 현실적으로 안내하세요.',
    college: '대학생에게 전공 활용, 인턴·자격증·포트폴리오 등 취업 준비를 구체적으로 안내하세요.',
    adult: '성인 학습자/직장인에게 커리어 전환, 재교육, 자기계발을 존중하는 어조로 실용적으로 안내하세요.',
  },
  vi: {
    elementary: 'Hãy nói với học sinh tiểu học bằng từ ngữ dễ hiểu, câu ngắn, thân thiện, khen ngợi nhiều và dùng ít biểu tượng cảm xúc. Xưng hô "cô/thầy – em" hoặc "mình – bạn" cho tự nhiên.',
    middle: 'Hãy giải thích thân thiện theo tầm nhìn của học sinh THCS, có ví dụ cụ thể (ví dụ: lựa chọn sau lớp 9 giữa THPT và giáo dục nghề nghiệp).',
    high: 'Hãy hướng dẫn học sinh THPT một cách thực tế về chọn ngành, tổ hợp môn xét tuyển, kỳ thi tốt nghiệp THPT và chuẩn bị nghề nghiệp.',
    college: 'Hãy hướng dẫn sinh viên cụ thể về tận dụng chuyên ngành, thực tập, chứng chỉ, hồ sơ năng lực để chuẩn bị đi làm.',
    adult: 'Hãy hướng dẫn người đi làm/người học lớn tuổi một cách tôn trọng và thực tế về chuyển nghề, học lại và phát triển bản thân.',
  },
};
const LEVEL = {
  ko: { elementary: '초등학생', middle: '중학생', high: '고등학생', college: '대학생', adult: '성인 학습자' },
  vi: { elementary: 'học sinh tiểu học', middle: 'học sinh THCS', high: 'học sinh THPT', college: 'sinh viên', adult: 'người học trưởng thành' },
};

function systemPrompt({ name, group, riasec, deep, tasks } = {}, lang = 'ko') {
  const ko = lang === 'ko';
  return [
    ko ? '당신은 진로탐색과 학습관리를 돕는 AI 코치입니다. 한국어로 답합니다.' : 'Bạn là huấn luyện viên AI giúp hướng nghiệp và quản lý học tập. Luôn trả lời bằng tiếng Việt.',
    STYLE[lang][group] || STYLE[lang].adult,
    name ? `${ko ? '사용자 이름' : 'Tên người dùng'}: ${String(name).slice(0, 20)}` : '',
    riasec ? `${ko ? '진로 흥미검사(RIASEC) 상위 유형' : 'Nhóm sở thích nghề nghiệp (RIASEC) nổi bật'}: ${String(riasec).slice(0, 60)}` : '',
    deep ? `${ko ? '심층 검사 결과' : 'Kết quả kiểm tra chuyên sâu'}: ${String(deep).slice(0, 500)}` : '',
    tasks ? `${ko ? '현재 학습 목표/할 일' : 'Mục tiêu/việc đang làm'}: ${String(tasks).slice(0, 600)}` : '',
    ko ? '원칙: 정답을 강요하지 말고 질문을 통해 스스로 탐색하도록 돕고, 다음에 할 수 있는 작은 행동 1~3가지를 제안하세요.'
      : 'Nguyên tắc: không áp đặt đáp án; hãy đặt câu hỏi để người dùng tự khám phá và gợi ý 1–3 hành động nhỏ tiếp theo.',
    ko ? '의학·법률·재정 등 전문 영역은 단정하지 말고 전문가 상담을 권하세요. 답변은 간결하게(최대 10문장 안팎).'
      : 'Với lĩnh vực y tế, pháp lý, tài chính, đừng khẳng định chắc chắn mà khuyên tham khảo chuyên gia. Trả lời ngắn gọn (tối đa khoảng 10 câu).',
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
  } catch { throw new HttpError(502, 'aiConnect'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, 'aiFail', j.error?.message);
  return j.content.map((c) => c.text || '').join('');
}

function extractJson(text) {
  const m = text && text.match(/\{[\s\S]*\}/);
  if (!m) throw new HttpError(502, 'aiParse');
  try { return JSON.parse(m[0]); } catch { throw new HttpError(502, 'aiParse'); }
}
const clampInt = (v, lo, hi, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const str = (v, max) => String(v ?? '').trim().slice(0, max);

const aiMod = require('./lib/ai')({ callClaude, extractJson, HttpError });

// ---------- 학습 계획 ----------
const PLAN_STEPS = {
  ko: ['현재 수준 점검과 학습 자료 정하기', '핵심 개념 익히기', '문제/실습으로 적용하기', '틀린 부분 복습·정리하기', '실전 점검 및 다음 목표 세우기'],
  vi: ['Đánh giá trình độ hiện tại và chọn tài liệu học', 'Nắm vững khái niệm cốt lõi', 'Áp dụng qua bài tập/thực hành', 'Ôn lại và tổng hợp phần làm sai', 'Kiểm tra thực tế và đặt mục tiêu tiếp theo'],
};
function fallbackPlan(goal, weeks, hours, lang) {
  const steps = PLAN_STEPS[lang];
  const perWeek = lang === 'vi' ? `${hours} giờ/tuần` : `주 ${hours}시간`;
  const tasks = [];
  for (let w = 1; w <= weeks; w++) tasks.push({ week: w, text: `${goal} — ${steps[Math.min(steps.length - 1, Math.floor(((w - 1) / weeks) * steps.length))]} (${perWeek})` });
  return tasks;
}

async function makePlan(body, lang) {
  const goal = str(body.goal, 100);
  if (!goal) throw new HttpError(400, 'goalReq');
  const weeks = clampInt(body.weeks, 1, 12, 4);
  const hours = clampInt(body.hours, 1, 40, 5);
  const group = LEVEL.ko[body.group] ? body.group : 'adult';
  const level = LEVEL[lang][group];
  const [sys, user] = lang === 'vi'
    ? [`Bạn là chuyên gia lập kế hoạch học tập cho ${level}. Chỉ trả về JSON.`, `Mục tiêu: ${goal}\nThời gian: ${weeks} tuần, mỗi tuần ${hours} giờ.\nHãy chia thành 1–3 việc cụ thể, kiểm tra được cho mỗi tuần và chỉ trả lời theo định dạng: {"tasks":[{"week":1,"text":"..."}]} (text tối đa 60 ký tự, tiếng Việt)`]
    : [`당신은 ${level} 학습 계획 전문가입니다. 반드시 JSON만 출력하세요.`, `목표: ${goal}\n기간: ${weeks}주, 주당 ${hours}시간.\n주차별로 1~3개의 구체적이고 확인 가능한 할 일을 만들어 다음 형식으로만 답하세요: {"tasks":[{"week":1,"text":"..."}]} (text는 60자 이내, 한국어)`];
  const text = await callClaude(sys, [{ role: 'user', content: user }], 1500);
  if (text === null) return { tasks: fallbackPlan(goal, weeks, hours, lang), ai: false };
  const tasks = (extractJson(text).tasks || []).slice(0, 36)
    .map((t) => ({ week: clampInt(t.week, 1, weeks, 1), text: str(t.text, 80) })).filter((t) => t.text);
  if (!tasks.length) throw new HttpError(502, 'planFail');
  return { tasks, ai: true };
}

// ---------- 퀴즈 ----------
async function makeQuiz(body, lang) {
  const subject = str(body.subject, 40);
  if (!subject) throw new HttpError(400, 'subjectReq');
  const count = clampInt(body.count, 3, 10, 5);
  const group = LEVEL.ko[body.group] ? body.group : 'adult';
  const level = LEVEL[lang][group];
  const [sys, user] = lang === 'vi'
    ? [`Bạn là người ra đề trắc nghiệm mức ${level}. Chỉ ra đề với kiến thức chính xác và chỉ trả về JSON.`, `Chủ đề: ${subject}\nTạo ${count} câu trắc nghiệm 4 lựa chọn, chỉ trả lời theo định dạng: {"questions":[{"q":"...","choices":["","","",""],"answer":0,"explain":"giải thích 1–2 câu"}]} (answer là chỉ số 0–3 của đáp án đúng; viết bằng tiếng Việt)`]
    : [`당신은 ${level} 수준의 퀴즈 출제자입니다. 정확한 사실만 출제하고 반드시 JSON만 출력하세요.`, `주제: ${subject}\n객관식(4지선다) ${count}문제를 다음 형식으로만 답하세요: {"questions":[{"q":"...","choices":["","","",""],"answer":0,"explain":"한두 문장 해설"}]} (answer는 0~3 정답 인덱스)`];
  const text = await callClaude(sys, [{ role: 'user', content: user }], 3000);
  if (text === null) throw new HttpError(503, 'quizNeedKey');
  const questions = (extractJson(text).questions || []).slice(0, count).map((q) => ({
    q: str(q.q, 300), choices: (q.choices || []).slice(0, 4).map((c) => str(c, 120)), answer: clampInt(q.answer, 0, 3, -1), explain: str(q.explain, 300),
  })).filter((q) => q.q && q.choices.length === 4 && q.answer >= 0);
  if (!questions.length) throw new HttpError(502, 'quizFail');
  return { questions };
}

// ---------- 대시보드 요약 (보호자/교사에게는 요약만 공개, 상담 대화는 제외) ----------
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
function summarize(u, todayStr, viewer) {
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
  const deep = Object.fromEntries(SHARED_DEEP.filter((id) => d.deep?.[id]?.length).map((id) => [id, d.deep[id].at(-1)]));
  const lastLog = Object.keys(log).filter((k) => log[k] > 0).sort().at(-1) || '';
  const lastCheckin = (d.checkins || []).map((c) => c.date).sort().at(-1) || '';
  const lastActive = [lastLog, lastCheckin].sort().at(-1) || '';
  const monday = new Date(base); monday.setDate(monday.getDate() - ((base.getDay() + 6) % 7));
  const checkinsWeek = (d.checkins || []).filter((c) => c.date >= dayKey(monday) && c.date <= todayStr).length;
  const goal = d.goal || {};
  const dday = goal.date ? daysBetween(todayStr, goal.date) : null;
  const sdl = d.deep?.sdl?.at(-1)?.overall;
  const idle = !u.createdAt || Date.now() - u.createdAt > 7 * 86400000 ? (!lastActive || daysBetween(lastActive, todayStr) >= 3) : false;
  const validity = Object.values(deep).some((r) => r.v?.length);
  const wb = d.deep?.wellbeing?.at(-1);
  // 정서웰빙 '주의' 표시는 본인 동의가 있을 때 강사/관리자에게만 (보호자에게는 항상 숨김)
  const wellbeing = !!(viewer && isStaff(viewer) && d.consent?.wellbeing && wb && wb.overall < 3.0);
  const ddaySoon = dday !== null && dday >= 0 && dday <= 14;
  const flags = { idle, validity, wellbeing, ddaySoon };
  const t = teacherOf(u.id);
  return {
    id: u.id, name: u.name, managed: !u.email, group: d.profile?.group || null, streak, week, today: week[6],
    openTasks: tasks.filter((x) => !x.done).slice(0, 5).map((x) => x.text), doneCount: tasks.filter((x) => x.done).length, openCount: tasks.filter((x) => !x.done).length,
    riasec: top, quiz: (d.quiz || []).slice(-5), deep,
    teacher: t ? { id: t.id, name: t.name } : null, lastActive, checkinsWeek, goal: { type: goal.type || 'general', label: goal.label || '', dday },
    intensity: sdl === undefined ? null : sdl >= 3.8 ? 'loose' : sdl >= 3.0 ? 'normal' : 'tight',
    awaiting: !!(viewer && isStaff(viewer) && d.messages?.at(-1)?.from === 'learner'),
    flags, status: idle || validity || wellbeing ? 'watch' : 'ok',
  };
}

function storeData(learner, clean) {
  const merged = { ...learner.data, ...clean };
  if (JSON.stringify(merged).length > MAX_DATA_BYTES) throw new HttpError(413, 'dataTooBig');
  learner.data = merged;
  if (clean.profile && !learner.email && clean.profile.name) learner.name = clean.profile.name; // 강사가 등록한 학생은 프로필 이름 = 계정 이름
  persist(learner);
}

// ---------- 라우터 ----------
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const ip = (req) => (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '';
const routes = {
  'GET /healthz': async () => ({ ok: true, storage: store.kind }),
  'POST /api/signup': async (req) => {
    limit('auth:' + ip(req), 20, 15 * 60000);
    const b = await readBody(req);
    const email = str(b.email, 100).toLowerCase(), password = String(b.password || ''), name = str(b.name, 20);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'badEmail');
    if (password.length < 8) throw new HttpError(400, 'pwShort');
    if (!name) throw new HttpError(400, 'nameReq');
    if (userByEmail(email)) throw new HttpError(409, 'emailTaken');
    const role = b.role === 'guardian' ? 'guardian' : 'learner';
    const salt = crypto.randomBytes(16).toString('hex');
    const u = newUser({ email, name, role, salt, hash: hashPw(password, salt) });
    db.users[u.id] = u;
    return { token: issueToken(u.id), user: publicUser(u) };
  },
  'POST /api/login': async (req) => {
    limit('auth:' + ip(req), 20, 15 * 60000);
    const b = await readBody(req);
    const u = userByEmail(str(b.email, 100).toLowerCase());
    const ok = u && u.hash && checkPw(u, b.password);
    if (!ok) throw new HttpError(401, 'badCred');
    return { token: issueToken(u.id), user: publicUser(u) };
  },
  'POST /api/logout': async (req) => {
    const t = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (t) { delete db.sessions[sha(t)]; store.removeSession(sha(t)); }
    return { ok: true };
  },
  'GET /api/me': async (req) => { const u = needUser(req); const d = { ...(u.data || {}) }; delete d.counsel; const t = u.role === 'learner' ? teacherOf(u.id) : null; return { user: publicUser(u), data: d, teacher: t ? { id: t.id, name: t.name } : null }; },
  'PUT /api/data': async (req) => {
    const u = needUser(req);
    if (u.role !== 'learner') throw new HttpError(403, 'learnerOnly');
    const b = await readBody(req);
    storeData(u, sanitizeData(b.data));
    return { ok: true };
  },
  'POST /api/password': async (req) => {
    limit('auth:' + ip(req), 20, 15 * 60000);
    const u = needUser(req);
    const b = await readBody(req);
    if (!checkPw(u, b.current)) throw new HttpError(401, 'curPwBad');
    if (String(b.next || '').length < 8) throw new HttpError(400, 'newPwShort');
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(String(b.next), u.salt);
    dropSessions(u.id); // 다른 기기의 로그인은 모두 해제
    return { token: issueToken(u.id) };
  },
  'POST /api/delete-account': async (req) => {
    limit('auth:' + ip(req), 20, 15 * 60000);
    const u = needUser(req);
    if (!checkPw(u, (await readBody(req)).password)) throw new HttpError(401, 'pwBad');
    if (u.role === 'admin' && adminCount() <= 1) throw new HttpError(400, 'lastAdmin');
    dropSessions(u.id);
    removeUserEverywhere(u.id); // 연결 정리 포함
    return { ok: true };
  },
  'GET /api/export': async (req) => { // 개인정보 열람·이동권: 내 계정 정보와 데이터 전체
    const u = needUser(req);
    const d = { ...(u.data || {}) }; delete d.counsel; // 강사의 내부 상담일지는 본인 내보내기에 포함하지 않는다
    return { account: { name: u.name, email: u.email, role: u.role }, data: d };
  },
  'POST /api/regen-code': async (req) => { const u = needUser(req); u.shareCode = newCode(); persist(u); return { shareCode: u.shareCode }; },
  'POST /api/link': async (req) => {
    limit('link:' + ip(req), 10, 15 * 60000);
    const u = needUser(req);
    if (u.role !== 'guardian' && u.role !== 'teacher') throw new HttpError(403, 'guardianOnlyLink');
    const code = str((await readBody(req)).code, 8).toUpperCase();
    const learner = Object.values(db.users).find((x) => x.role === 'learner' && x.shareCode === code);
    if (!code || !learner) throw new HttpError(404, 'codeNotFound');
    if (!u.links.includes(learner.id)) u.links.push(learner.id);
    persist(u);
    return { ok: true, name: learner.name };
  },
  'POST /api/unlink': async (req) => {
    const u = needUser(req);
    const id = str((await readBody(req)).id, 60);
    if (u.role === 'guardian' || u.role === 'teacher') u.links = u.links.filter((x) => x !== id);
    else if (db.users[id]) db.users[id].links = db.users[id].links.filter((x) => x !== u.id); // 학습자가 보호자 연결을 끊음
    persist(u, db.users[id]);
    return { ok: true };
  },
  'GET /api/guardians': async (req) => {
    const u = needUser(req);
    return { guardians: Object.values(db.users).filter((g) => g.role === 'guardian' && g.links.includes(u.id)).map((g) => ({ id: g.id, name: g.name })) };
  },
  'GET /api/dashboard': async (req, url) => {
    const u = needUser(req);
    if (u.role === 'learner') throw new HttpError(403, 'guardianOnly');
    const today = isDate(url.searchParams.get('today')) ? url.searchParams.get('today') : dayKey(new Date());
    const list = u.role === 'admin' ? Object.values(db.users).filter((x) => x.role === 'learner') : u.links.map((id) => db.users[id]).filter(Boolean);
    const out = { learners: list.map((l) => summarize(l, today, u)) };
    if (u.role === 'admin') out.teachers = Object.values(db.users).filter((x) => x.role === 'teacher').map((t) => ({ id: t.id, name: t.name }));
    return out;
  },
  'POST /api/chat': async (req) => {
    limit('ai:' + ip(req), 30, 10 * 60000);
    const b = await readBody(req);
    const messages = (b.messages || []).slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
    if (!messages.length || messages[0].role !== 'user') throw new HttpError(400, 'msgReq');
    const reply = await callClaude(systemPrompt(b.profile, langOf(req)), messages);
    return { reply: reply ?? M[langOf(req)].noKeyChat };
  },
  // ---- 강사/관리자: 학생 등록·활성화 ----
  'POST /api/students': async (req) => {
    const u = needUser(req);
    if (!isStaff(u)) throw new HttpError(403, 'staffOnly');
    const b = await readBody(req);
    const name = clipStr(b.name, 20);
    if (!name) throw new HttpError(400, 'nameReq');
    const profile = sanitizers.profile({ name, group: b.group, services: b.services, school: b.school, note: b.note, orgType: b.orgType });
    const goal = sanitizers.goal({ type: b.goalType, label: b.goalLabel, date: b.goalDate });
    const l = newUser({ email: null, name, role: 'learner', managedBy: u.id, data: { profile, goal, consent: { wellbeing: true } } });
    db.users[l.id] = l;
    const tid = u.role === 'teacher' ? u.id : db.users[b.teacherId]?.role === 'teacher' ? b.teacherId : null;
    if (tid) assignTeacher(l.id, tid);
    persist(l);
    return { id: l.id, shareCode: l.shareCode };
  },
  'POST /api/claim': async (req) => { // 강사가 등록한 학생이 본인 계정(이메일·비밀번호)을 만든다
    limit('auth:' + ip(req), 20, 15 * 60000);
    const b = await readBody(req);
    const code = clipStr(b.code, 8).toUpperCase();
    const l = code && Object.values(db.users).find((x) => x.role === 'learner' && x.shareCode === code);
    if (!l) throw new HttpError(404, 'codeNotFound');
    if (l.email) throw new HttpError(400, 'notManaged');
    const email = clipStr(b.email, 100).toLowerCase(), password = String(b.password || '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'badEmail');
    if (password.length < 8) throw new HttpError(400, 'pwShort');
    if (userByEmail(email)) throw new HttpError(409, 'emailTaken');
    l.email = email; l.salt = crypto.randomBytes(16).toString('hex'); l.hash = hashPw(password, l.salt);
    l.shareCode = newCode(); // 활성화 코드는 한 번만 쓸 수 있게 교체
    return { token: issueToken(l.id), user: publicUser(l) };
  },
  // ---- 관리자: 강사 계정 관리 ----
  'GET /api/staff': async (req) => {
    const u = needUser(req);
    if (u.role !== 'admin') throw new HttpError(403, 'adminOnly');
    return { staff: Object.values(db.users).filter(isStaff).map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role, students: s.role === 'teacher' ? s.links.length : null })) };
  },
  'POST /api/staff': async (req) => {
    const u = needUser(req);
    if (u.role !== 'admin') throw new HttpError(403, 'adminOnly');
    const b = await readBody(req);
    const email = clipStr(b.email, 100).toLowerCase(), password = String(b.password || ''), name = clipStr(b.name, 20);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'badEmail');
    if (password.length < 8) throw new HttpError(400, 'pwShort');
    if (!name) throw new HttpError(400, 'nameReq');
    if (!['teacher', 'admin'].includes(b.role)) throw new HttpError(400, 'roleBad');
    if (userByEmail(email)) throw new HttpError(409, 'emailTaken');
    const salt = crypto.randomBytes(16).toString('hex');
    const s = newUser({ email, name, role: b.role, salt, hash: hashPw(password, salt) });
    db.users[s.id] = s; persist(s);
    return { id: s.id };
  },
  // ---- 비밀번호 재설정: 이메일 대신 강사/관리자가 일회용 코드를 발급 ----
  'POST /api/reset': async (req) => {
    const b = await readBody(req);
    const email = clipStr(b.email, 100).toLowerCase();
    limit('auth:' + ip(req), 20, 15 * 60000); limit('reset:' + email, 6, 15 * 60000);
    const u = userByEmail(email), code = String(b.code || '').trim().toUpperCase();
    const ok = u && u.reset && u.reset.exp > Date.now() && code.length >= 8 && crypto.timingSafeEqual(Buffer.from(sha(code)), Buffer.from(u.reset.hash));
    if (!ok) throw new HttpError(400, 'resetBad');
    if (String(b.password || '').length < 8) throw new HttpError(400, 'pwShort');
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(String(b.password), u.salt); delete u.reset; // 코드는 한 번만 사용
    dropSessions(u.id);
    return { token: issueToken(u.id), user: publicUser(u) }; // issueToken 이 사용자 저장
  },
  'GET /api/accounts': async (req, url) => { // 관리자: 계정 찾기
    const u = needUser(req);
    if (u.role !== 'admin') throw new HttpError(403, 'adminOnly');
    const q = clipStr(url.searchParams.get('q'), 40).toLowerCase();
    if (q.length < 2) return { accounts: [] };
    return { accounts: Object.values(db.users).filter((x) => x.email && (x.email.includes(q) || String(x.name).toLowerCase().includes(q))).slice(0, 20).map((x) => ({ id: x.id, name: x.name, email: x.email, role: x.role })) };
  },
  'POST /api/schedule': async (req) => { limit('ai:' + ip(req), 30, 10 * 60000); return aiMod.makeSchedule(await readBody(req), langOf(req)); },
  'POST /api/diagnosis': async (req) => { limit('ai:' + ip(req), 20, 10 * 60000); return aiMod.makeDiagnosis(await readBody(req), langOf(req)); },
  'POST /api/plan': async (req) => { limit('ai:' + ip(req), 30, 10 * 60000); return makePlan(await readBody(req), langOf(req)); },
  'POST /api/quiz': async (req) => { limit('ai:' + ip(req), 30, 10 * 60000); return makeQuiz(await readBody(req), langOf(req)); },
};

// ---------- 경로 매개변수 라우트 (/api/students/:id ...) ----------
const paramRoutes = [
  ['POST', /^\/api\/students\/([\w-]+)\/messages$/, async (req, url, [id]) => { // 학습자 본인 ↔ 담당 강사/관리자 (보호자는 불가)
    const u = needUser(req), l = learnerOr404(u, id, true);
    if (!(u.id === l.id || isStaff(u))) throw new HttpError(403, 'forbidden');
    limit('msg:' + u.id, 30, 10 * 60000);
    const text = clipStr((await readBody(req)).text, 500);
    if (!text) throw new HttpError(400, 'msgEmpty');
    const msgs = [...(l.data?.messages || []), { id: crypto.randomUUID(), at: new Date().toISOString(), from: u.id === l.id ? 'learner' : 'staff', name: u.name, text }].slice(-200);
    l.data = { ...l.data, messages: msgs };
    persist(l);
    return { messages: msgs };
  }],
  ['POST', /^\/api\/students\/([\w-]+)\/counsel$/, async (req, url, [id]) => { // 강사 전용 상담일지
    const u = needUser(req);
    if (!isStaff(u)) throw new HttpError(403, 'staffOnly');
    const l = learnerOr404(u, id, true), b = await readBody(req);
    const text = clipStr(b.text, 1000);
    if (!text) throw new HttpError(400, 'noNote');
    const entry = { id: crypto.randomUUID(), date: isDate(b.date) ? b.date : dayKey(new Date()), at: new Date().toISOString(), by: u.name, byId: u.id, text };
    const list = [...(l.data?.counsel || []), entry].slice(-300);
    l.data = { ...l.data, counsel: list };
    persist(l);
    return { counsel: list };
  }],
  ['DELETE', /^\/api\/students\/([\w-]+)\/counsel\/([\w-]+)$/, async (req, url, [id, cid]) => {
    const u = needUser(req);
    if (!isStaff(u)) throw new HttpError(403, 'staffOnly');
    const l = learnerOr404(u, id, true), cur = l.data?.counsel || [], e = cur.find((x) => x.id === cid);
    if (!e) throw new HttpError(404, 'notFound');
    if (u.role !== 'admin' && e.byId !== u.id) throw new HttpError(403, 'forbidden'); // 본인이 쓴 기록만 (관리자는 모두)
    const list = cur.filter((x) => x.id !== cid);
    l.data = { ...l.data, counsel: list };
    persist(l);
    return { counsel: list };
  }],
  ['GET', /^\/api\/students\/([\w-]+)$/, async (req, url, [id]) => {
    const u = needUser(req), l = learnerOr404(u, id);
    const t = teacherOf(l.id);
    return { user: { id: l.id, name: l.name, managed: !l.email, shareCode: isStaff(u) ? l.shareCode : undefined }, data: dataFor(u, l), teacher: t ? { id: t.id, name: t.name } : null, canWrite: canWrite(u, l) };
  }],
  ['PUT', /^\/api\/students\/([\w-]+)\/data$/, async (req, url, [id]) => {
    const u = needUser(req);
    if (!isStaff(u)) throw new HttpError(403, 'staffOnly');
    const l = learnerOr404(u, id, true);
    const b = await readBody(req);
    const allowed = CLIENT_KEYS.filter((k) => k !== 'chat' && !(l.email && k === 'consent')); // 본인 계정 학생의 동의 설정은 강사가 바꿀 수 없다
    const clean = sanitizeData(b.data, allowed);
    if ('deep' in clean && !l.data?.consent?.wellbeing) { // 정서웰빙 기록은 동의 없이는 강사 화면에 없으므로, 저장 시 기존 값을 그대로 보존
      const prev = l.data?.deep?.wellbeing;
      if (prev) clean.deep.wellbeing = prev; else delete clean.deep.wellbeing;
    }
    storeData(l, clean);
    return { ok: true };
  }],
  ['PUT', /^\/api\/students\/([\w-]+)\/meta$/, async (req, url, [id]) => { // 담당 강사 배정 (관리자)
    const u = needUser(req);
    if (u.role !== 'admin') throw new HttpError(403, 'adminOnly');
    const l = learnerOr404(u, id);
    const b = await readBody(req);
    const t = db.users[b.teacherId];
    if (b.teacherId === '') unassignTeacher(l.id);
    else if (t && t.role === 'teacher') assignTeacher(l.id, t.id);
    else throw new HttpError(400, 'roleBad');
    return { ok: true };
  }],
  ['DELETE', /^\/api\/students\/([\w-]+)$/, async (req, url, [id]) => {
    const u = needUser(req);
    if (!isStaff(u)) throw new HttpError(403, 'staffOnly');
    const l = learnerOr404(u, id, true);
    if (l.email) { u.links = (u.links || []).filter((x) => x !== id); persist(u); return { ok: true, unlinked: true }; } // 본인 계정은 삭제하지 않고 연결만 해제
    dropSessions(l.id); removeUserEverywhere(l.id);
    return { ok: true };
  }],
  ['POST', /^\/api\/users\/([\w-]+)\/reset-code$/, async (req, url, [id]) => { // 관리자: 누구든 / 강사: 담당 학생만
    const u = needUser(req), t = db.users[id];
    if (!isStaff(u)) throw new HttpError(403, 'staffOnly');
    if (!t) throw new HttpError(404, 'notFound');
    if (u.role === 'teacher' && !canWrite(u, t)) throw new HttpError(403, 'forbidden');
    if (!t.email || t.id === u.id) throw new HttpError(400, 'noReset');
    const code = crypto.randomBytes(6).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase().padEnd(8, 'X');
    t.reset = { hash: sha(code), exp: Date.now() + 24 * 3600 * 1000 };
    persist(t);
    return { code, name: t.name, expiresHours: 24 };
  }],
  ['PUT', /^\/api\/staff\/([\w-]+)$/, async (req, url, [id]) => {
    const u = needUser(req);
    if (u.role !== 'admin') throw new HttpError(403, 'adminOnly');
    const t = db.users[id];
    if (!t || !isStaff(t)) throw new HttpError(404, 'notFound');
    const b = await readBody(req);
    if (b.role && b.role !== t.role) {
      if (!['teacher', 'admin'].includes(b.role)) throw new HttpError(400, 'roleBad');
      if (t.role === 'admin' && adminCount() <= 1) throw new HttpError(400, 'lastAdmin');
      if (b.role === 'teacher') t.links = t.links || [];
      t.role = b.role;
    }
    if (b.name !== undefined) { const n = clipStr(b.name, 20); if (!n) throw new HttpError(400, 'nameReq'); t.name = n; }
    if (b.password) {
      if (String(b.password).length < 8) throw new HttpError(400, 'pwShort');
      t.salt = crypto.randomBytes(16).toString('hex'); t.hash = hashPw(String(b.password), t.salt); dropSessions(t.id);
    }
    persist(t);
    return { ok: true };
  }],
  ['DELETE', /^\/api\/staff\/([\w-]+)$/, async (req, url, [id]) => {
    const u = needUser(req);
    if (u.role !== 'admin') throw new HttpError(403, 'adminOnly');
    const t = db.users[id];
    if (!t || !isStaff(t)) throw new HttpError(404, 'notFound');
    if (t.id === u.id) throw new HttpError(400, 'selfDelete');
    if (t.role === 'admin' && adminCount() <= 1) throw new HttpError(400, 'lastAdmin');
    dropSessions(t.id); removeUserEverywhere(t.id); // 담당 학생은 삭제되지 않고 '미배정'이 된다
    return { ok: true };
  }],
];

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  for (const [k, v] of Object.entries(SEC_HEADERS)) res.setHeader(k, v);
  if (TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https') res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  let handler = routes[`${req.method} ${url.pathname}`], args = [];
  if (!handler) for (const [method, re, fn] of paramRoutes) { const m = method === req.method && url.pathname.match(re); if (m) { handler = fn; args = [m.slice(1)]; break; } }
  if (handler) {
    try {
      const out = await handler(req, url, ...args);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(out));
    } catch (e) {
      const code = e instanceof HttpError ? e.code : 500;
      if (code === 500) console.error(e);
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
      const m = M[langOf(req)];
      return res.end(JSON.stringify({ error: code === 500 ? m.serverErr : e.raw || m[e.key] || e.message }));
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
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { store.close(); process.exit(0); });
