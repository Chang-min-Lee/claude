// 사용자 데이터(동기화 키) 서버 검증. 알려진 필드만, 길이·범위를 제한해서 저장한다.
const GROUPS = ['elementary', 'middle', 'high', 'college', 'adult'];
const GOAL_TYPES = ['abroad', 'school', 'career', 'general'];
const STATUS = ['', 'green', 'yellow', 'red'];
const KINDS = ['self', 'school', 'extra'];

// 심층검사 id별 영역 키. wellbeing(정서웰빙)은 민감 정보라 보호자에게는 절대 공개하지 않는다.
const DEEP_CATS = {
  holland: 'RIASEC', bigfive: 'OCEAN',
  workvalues: ['growth', 'stability', 'reward', 'autonomy', 'recognition', 'fun'],
  aptitude: ['lang', 'math', 'spatial', 'social', 'logic', 'creative'],
  sdl: ['plan', 'monitor', 'goal', 'persist'],
  wellbeing: ['stable', 'energy', 'relation', 'stress'],
};
const SHARED_DEEP = ['holland', 'bigfive', 'workvalues', 'aptitude', 'sdl'];

const clip = (v, n) => String(v ?? '').trim().slice(0, n); // HTML 이스케이프는 화면 출력 시점(esc)에서 처리한다
const int = (v, lo, hi, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
// 범위를 벗어난 값은 보정하지 않고 -1(무효)로 처리
const strict = (v, lo, hi) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : -1; };
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const arr = (v, max) => (Array.isArray(v) ? v.slice(-max) : []);
const dateOr = (s) => (isDate(s) ? s : '');
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

function sanitizeDeep(d) {
  const out = {};
  if (!d || typeof d !== 'object') return out;
  const num = (v) => (Number.isFinite(+v) ? Math.min(5, Math.max(1, Math.round(+v * 10) / 10)) : null);
  for (const [id, cats] of Object.entries(DEEP_CATS)) {
    if (!Array.isArray(d[id])) continue;
    const keys = Array.isArray(cats) ? cats : cats.split('');
    out[id] = d[id].slice(-5).map((r) => {
      const cat = {};
      for (const k of keys) { const v = num(r?.cat?.[k]); if (v === null) return null; cat[k] = v; }
      const overall = num(r.overall);
      if (overall === null) return null;
      return { date: dateOr(r.date), cat, overall, v: arr(r.v, 3).filter((x) => ['same', 'run', 'flat'].includes(x)) };
    }).filter(Boolean);
  }
  return out;
}

const pairs = (v, maxN, maxA, maxB) => arr(v, maxN).map((p) => (Array.isArray(p) ? [clip(p[0], maxA), clip(p[1], maxB)] : null)).filter((p) => p && p[0]);

const sanitizers = {
  profile(p) {
    p = obj(p);
    const sv = obj(p.services);
    return {
      name: clip(p.name, 20), group: GROUPS.includes(p.group) ? p.group : '',
      services: { study: sv.study !== false, career: sv.career !== false },
      school: clip(p.school, 40), note: clip(p.note, 200), teacherNote: clip(p.teacherNote, 300),
    };
  },
  answers(a) {
    const out = {};
    for (const [k, v] of Object.entries(obj(a))) { const i = strict(k, 0, 11); if (i >= 0) out[i] = int(v, 1, 5, 3); }
    return out;
  },
  tasks: (t) => arr(t, 200).map((x) => ({ text: clip(x?.text, 80), done: !!x?.done })).filter((x) => x.text),
  log(l) {
    const out = {};
    for (const [k, v] of Object.entries(obj(l)).slice(-400)) if (isDate(k)) out[k] = int(v, 0, 1440, 0);
    return out;
  },
  chat: (c) => arr(c, 50).map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: clip(m?.content, 4000) })),
  quiz: (q) => arr(q, 100).map((x) => ({ date: dateOr(x?.date), subject: clip(x?.subject, 60), score: int(x?.score, 0, 50, 0), total: int(x?.total, 1, 50, 1) })),
  wrong: (w) => arr(w, 50).map((x) => ({
    subject: clip(x?.subject, 60), q: clip(x?.q, 300), choices: arr(x?.choices, 4).map((c) => clip(c, 120)),
    answer: int(x?.answer, 0, 3, 0), explain: clip(x?.explain, 300),
  })).filter((x) => x.q && x.choices.length === 4),
  deep: sanitizeDeep,
  consent: (c) => ({ wellbeing: !!obj(c).wellbeing }),
  // 주간 시간표 블록: 요일 0(월)~6(일), 시작/끝 시각(정수)
  schedule: (s) => arr(s, 80).map((b) => {
    const start = strict(b?.start, 5, 23), end = strict(b?.end, 6, 24);
    return { day: strict(b?.day, 0, 6), start, end, label: clip(b?.label, 30), color: /^#[0-9a-fA-F]{6}$/.test(b?.color || '') ? b.color : '#6D28D9' };
  }).filter((b) => b.day >= 0 && b.start >= 0 && b.end > b.start && b.label),
  // 주간 학습계획표: 과목·구분·세부내용 + 요일별 이행 상태(초록/노랑/빨강)
  weekplan: (w) => arr(w, 20).map((r) => ({
    subject: clip(r?.subject, 30), kind: KINDS.includes(r?.kind) ? r.kind : 'self', detail: clip(r?.detail, 80),
    days: [...Array(7)].map((_, i) => (STATUS.includes(arr(r?.days, 7)[i]) ? arr(r?.days, 7)[i] : '')),
  })).filter((r) => r.subject),
  weekhist: (h) => arr(h, 30).map((x) => ({ date: dateOr(x?.date), subjects: arr(x?.subjects, 20).map((s) => clip(s, 30)) })),
  goal(g) {
    g = obj(g);
    return {
      type: GOAL_TYPES.includes(g.type) ? g.type : 'general', label: clip(g.label, 60), date: dateOr(g.date), note: clip(g.note, 200),
      milestones: arr(g.milestones, 12).map((m) => ({ text: clip(m?.text, 60), date: dateOr(m?.date), done: !!m?.done })).filter((m) => m.text),
    };
  },
  grades: (g) => arr(g, 200).map((x) => ({ subject: clip(x?.subject, 30), score: clip(x?.score, 12), date: dateOr(x?.date), note: clip(x?.note, 60) })).filter((x) => x.subject && x.score),
  checkins(c) { // 하루 한 번(출석 체크인)
    const seen = new Set();
    return arr(c, 400).map((x) => ({ date: dateOr(x?.date), time: /^\d{2}:\d{2}$/.test(x?.time || '') ? x.time : '' })).filter((x) => x.date && !seen.has(x.date) && seen.add(x.date));
  },
  closeouts: (c) => arr(c, 52).map((x) => ({ date: dateOr(x?.date), done: int(x?.done, 0, 500, 0), total: int(x?.total, 0, 500, 0) })),
  diag(d) {
    d = obj(d);
    if (!d.date) return {};
    return {
      date: dateOr(d.date), lang: d.lang === 'vi' ? 'vi' : 'ko',
      before: clip(d.before, 700), insight: clip(d.insight, 400), intensityLabel: clip(d.intensityLabel, 30), intensityReason: clip(d.intensityReason, 200),
      purpose: clip(d.purpose, 900), overall: clip(d.overall, 1800), timeAnalysis: clip(d.timeAnalysis, 1200), career: clip(d.career, 1400),
      subjects: pairs(d.subjects, 8, 40, 500), etc: pairs(d.etc, 6, 40, 500),
      methods: arr(d.methods, 6).map((m) => (Array.isArray(m) ? [clip(m[0], 40), arr(m[1], 5).map((x) => clip(x, 200))] : null)).filter((m) => m && m[0]),
      checklist: arr(d.checklist, 6).map((x) => clip(x, 100)).filter(Boolean),
      weekplan: arr(d.weekplan, 8).map((r) => ({ subject: clip(r?.subject, 30), kind: KINDS.includes(r?.kind) ? r.kind : 'self', detail: clip(r?.detail, 80) })).filter((r) => r.subject),
    };
  },
};

const DATA_KEYS = Object.keys(sanitizers);
const MAX_DATA_BYTES = 600 * 1024;

// data 객체에서 들어온 키만 검증해 반환 (알 수 없는 키는 버림)
function sanitizeData(data, allowed = DATA_KEYS) {
  const out = {};
  for (const k of allowed) if (data && k in data && sanitizers[k]) out[k] = sanitizers[k](data[k]);
  return out;
}

module.exports = { sanitizers, GROUPS, GOAL_TYPES, KINDS, DEEP_CATS, SHARED_DEEP, DATA_KEYS, MAX_DATA_BYTES, sanitizeData, sanitizeDeep, clip, int, isDate, arr, obj };
