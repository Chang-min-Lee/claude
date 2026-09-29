// 진로AI 코치 — 코어: 상태·동기화·화면 전환·홈·진로탐색·학습관리·AI 코치·계정
const PREVIEW = false; // 미리보기 빌드에서만 true (서버 없이 동작하는 기능만 남김)
const GROUPS = { elementary: { kid: true }, middle: {}, high: {}, college: {}, adult: {} };
const groupLabel = (g) => t('g_' + g);
const levelLabel = (g) => t('lv_' + g);
const R = () => C().riasec;
const Q = () => C().questions;
const REVIEW = '__review__'; // 복습 기록의 과목 표시(언어 독립)
const subjLabel = (s) => (s === REVIEW ? t('review_name') : s);
const unit = (k, n) => t(k, { n });

const $ = (s, el = document) => el.querySelector(s);
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dk();
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---- 상태: 동기화되는 데이터 키와 기본값 ----
const DEFAULTS = {
  profile: null, answers: {}, tasks: [], log: {}, chat: [], quiz: [], wrong: [], deep: {},
  consent: { wellbeing: false, research: false }, schedule: [], weekplan: [], weekhist: [],
  goal: { type: 'general', label: '', date: '', note: '', milestones: [] },
  grades: [], checkins: [], closeouts: [], diag: {}, diagHist: [],
  visits: [], // 스터디카페 입·퇴실 기록
  attendance: {}, // 출결(강사 기록) 날짜 → p/l/a/e
  intake: { concern: '', goal: '', strengths: '', interests: '', habits: '', background: '' }, // 초기 상담 문진
  career: { job: '', industry: '', years: 0, target: '', targetIndustry: '', skills: [], motive: '', constraints: '' }, jobs: [], // 성인·대학생 커리어
  messages: [], counsel: [], // 서버가 관리(POST 전용) — 화면에서는 읽기만
};
const SERVER_KEYS = ['messages', 'counsel'];
const SYNC = Object.keys(DEFAULTS).filter((k) => !SERVER_KEYS.includes(k)); // 저장(PUT) 대상
const LOAD_KEYS = Object.keys(DEFAULTS);
const normalize = (k, v) => (v === null || v === undefined ? clone(DEFAULTS[k]) : (['goal', 'consent', 'intake', 'career'].includes(k) ? { ...DEFAULTS[k], ...v } : v));

let state = { token: store.get('token', null), user: null, tab: 'home', sub: { plan: 'schedule', report: 'comp' }, viewAs: null, ro: false, notice: null };
LOAD_KEYS.forEach((k) => { state[k] = normalize(k, SERVER_KEYS.includes(k) ? null : store.get(k, null)); });
if (state.goal && !Array.isArray(state.goal.milestones)) state.goal.milestones = [];

const dirty = new Set(); // 서버로 아직 보내지 않은 키만 전송해서, 다른 기기·강사가 바꾼 다른 키를 덮어쓰지 않는다
let pushTimer;
function saveTarget() { // 저장 대상: 내 계정 / 열어 둔 학생(강사) / 저장 안 함(읽기 전용·비로그인)
  if ((PREVIEW && !state.viewAs) || !state.token || state.ro) return null;
  if (state.viewAs) return `/api/students/${state.viewAs.id}/data`;
  return state.user?.role === 'learner' ? '/api/data' : null;
}
async function flush() {
  const url = saveTarget(), keys = [...dirty];
  if (!url || !keys.length) return;
  try { await api(url, { method: 'PUT', body: { data: Object.fromEntries(keys.map((k) => [k, state[k]])) } }); keys.forEach((k) => dirty.delete(k)); setSaveState('ok'); }
  catch { setSaveState('fail'); clearTimeout(pushTimer); pushTimer = setTimeout(flush, 10000); } // 실패하면 안내를 띄우고 10초 뒤 다시 시도
}
function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(flush, 700); }
const save = (k) => {
  if (!state.viewAs) store.set(k, state[k]);
  if (SYNC.includes(k)) { dirty.add(k); if (saveTarget()) schedulePush(); }
};
function loadData(data, persistLocal = false) { // 서버 데이터로 상태를 통째로 교체
  LOAD_KEYS.forEach((k) => { state[k] = normalize(k, data?.[k]); if (persistLocal && !SERVER_KEYS.includes(k)) store.set(k, state[k]); });
}
function adopt(data) { // 아직 보내지 않은 내 변경(dirty)이 없는 키만 서버 값으로 갱신
  LOAD_KEYS.forEach((k) => { if (data[k] !== undefined && data[k] !== null && !dirty.has(k)) { state[k] = normalize(k, data[k]); if (!state.viewAs && !SERVER_KEYS.includes(k)) store.set(k, state[k]); } });
}
function clearLocal() { SYNC.forEach((k) => store.set(k, null)); store.set('comp_draft', null); state.myTeacher = null; loadData({}); }

async function api(path, { method = 'GET', body } = {}) {
  let r;
  try { r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', 'X-Lang': lang, ...(state.token && { Authorization: 'Bearer ' + state.token }) }, body: body && JSON.stringify(body) }); } catch { throw new Error(t('err_conn')); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || t('req_failed'));
  return j;
}
async function afterAuth(res) {
  state.token = res.token; state.user = res.user; store.set('token', res.token);
  state.viewAs = null; state.ro = false; state.sub = { plan: 'schedule', report: 'comp' };
  const role = res.user.role;
  if (role === 'guardian') { loadData({}); state.tab = 'dash'; return; }
  if (role === 'teacher' || role === 'admin') { loadData({}); state.tab = 'roster'; if (typeof roster !== 'undefined') roster.loaded = false; return; }
  const me = await api('/api/me'); state.myTeacher = me.teacher || null;
  if (me.data.profile) { dirty.clear(); loadData(me.data, true); } else { SYNC.forEach((k) => dirty.add(k)); schedulePush(); } // 서버에 데이터가 없으면 이 기기 데이터를 올림
  state.tab = 'home';
}
async function poll() { // 다른 기기·강사가 바꾼 내용을 가져온다 (입력 중이면 화면은 건드리지 않음)
  if (document.hidden || dirty.size || !state.token || PREVIEW) return;
  try {
    let data;
    if (state.viewAs) data = (await api(`/api/students/${state.viewAs.id}`)).data;
    else if (state.user?.role === 'learner') { const me = await api('/api/me'); data = me.data; state.myTeacher = me.teacher || null; }
    else return;
    const before = JSON.stringify(SYNC.map((k) => state[k]));
    adopt(data);
    const el = document.activeElement;
    if (before !== JSON.stringify(SYNC.map((k) => state[k])) && !(el && /INPUT|TEXTAREA|SELECT/.test(el.tagName)) && !(typeof tv !== 'undefined' && tv.mode === 'take')) render();
  } catch { /* 네트워크 오류는 무시 */ }
}
async function bootAuth() {
  if (state.token) {
    try {
      const me = await api('/api/me'); state.user = me.user; state.myTeacher = me.teacher || null;
      const role = me.user.role;
      if (role === 'learner') { if (me.data.profile) { dirty.clear(); loadData(me.data, true); } else { SYNC.forEach((k) => dirty.add(k)); schedulePush(); } }
      else { loadData({}); state.tab = role === 'guardian' ? 'dash' : 'roster'; }
    } catch { state.token = null; store.set('token', null); }
  }
}

// ---- 계산 ----
function scores() {
  const s = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  Q().forEach(([ty], i) => { s[ty] += state.answers[i] || 0; });
  return s;
}
const answered = () => Object.keys(state.answers).length;
function topTypes() {
  const s = scores();
  return Object.keys(s).sort((a, b) => s[b] - s[a]).slice(0, 2);
}
function streak() {
  let n = 0;
  const d = new Date();
  if (!state.log[dk(d)]) d.setDate(d.getDate() - 1); // 오늘 아직 안 했어도 어제까지 이어졌으면 유지
  while (state.log[dk(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function profileForAI() {
  const top = answered() === Q().length ? topTypes().map((ty) => `${R()[ty].name}(${ty})`).join(', ') : '';
  const deep = TEST_IDS.filter((id) => id !== 'wellbeing' && state.deep[id]?.length).map((id) => `${tx(id).name}: ${describeTest(id, state.deep[id].at(-1)).headline}`).join(' / ');
  return { name: state.profile.name, group: state.profile.group, riasec: top, deep, tasks: state.tasks.filter((x) => !x.done).map((x) => x.text).slice(0, 10).join(' / ') };
}

// ---- 화면 전환 ----
const LEARNER_TABS = ['home', 'tests', 'study', 'plan', 'career', 'report', 'messages', 'quiz', 'coach', 'account'];
const STUDENT_VIEW_TABS = ['home', 'input', 'tests', 'study', 'plan', 'career', 'report', 'messages', 'counsel']; // 강사가 학생을 열었을 때
const GUARDIAN_TABS = ['dash', 'account'];
const STAFF_TABS = ['roster', 'classes', 'cafe', 'register', 'data', 'staff', 'account'];
const roleOf = () => state.user?.role || 'learner';
const ICONS = {
  input: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M13.5 8.5l3 3"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5h4v5"/>',
  tests: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="m9.5 13.5 2 2 3.5-4"/>',
  study: '<path d="M3 5.5c3-1 6-.6 9 1.5 3-2.1 6-2.5 9-1.5V19c-3-1-6-.6-9 1.5C9 18.4 6 18 3 19z"/><path d="M12 7v13"/>',
  plan: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  report: '<path d="M6.5 3.5h8l4 4V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 1c0 1.7-2.5 2-2.5 3.5M12 17h.01"/>',
  coach: '<path d="M20.5 12a8 8 0 0 1-11.8 7L4 20.5l1.5-4.6A8 8 0 1 1 20.5 12z"/><path d="M9 11.5h6M9 14.5h3.5"/>',
  messages: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 8 8 5.5L20 8"/>',
  account: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/>',
  dash: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  roster: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.7-3.2 3-4.9 5.5-4.9s4.8 1.7 5.5 4.9"/><path d="M16 5.5a3 3 0 0 1 0 6M17.5 14.9c1.9.5 3 2 3.5 4.6"/>',
  register: '<circle cx="10" cy="8.5" r="3.4"/><path d="M3.5 19.5c.8-3.3 3.2-5 6.5-5s5.7 1.7 6.5 5M19 8v6M16 11h6"/>',
  classes: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 13l2 2 3.5-3.5"/>',
  cafe: '<path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16M8 4v2M12 4v2"/>',
  data: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  career: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17"/>',
  staff: '<path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z"/><path d="m9.3 12 2 2 3.6-3.8"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ''}</svg>`;
const tabBadge = (k) => (typeof unreadCount === 'function' && k === 'messages' ? unreadCount() : 0);
function tabOk(tab) { // 가입한 서비스(학습관리/진로컨설팅)에 따라 탭을 숨김
  const sv = state.profile?.services || {};
  if (['study', 'plan', 'quiz'].includes(tab)) return sv.study !== false;
  if (tab === 'tests') return sv.career !== false;
  if (tab === 'career') return ['adult', 'college'].includes(state.profile?.group); // 성인·대학생만
  if (tab === 'messages') return !!state.viewAs || (!!state.user && !PREVIEW) || (PREVIEW && !!state.viewAs);
  return true;
}
function tabsNow() {
  if (state.viewAs) return state.ro ? ['report'] : STUDENT_VIEW_TABS.filter(tabOk);
  const role = roleOf();
  if (role === 'guardian') return GUARDIAN_TABS;
  if (role === 'teacher') return STAFF_TABS.filter((k) => k !== 'staff');
  if (role === 'admin') return STAFF_TABS;
  return LEARNER_TABS.filter(tabOk);
}
const RENDERERS = () => ({ cafe: renderCafe, classes: renderClasses, data: renderAnalytics, career: renderCareer, home: renderHome, input: renderInput, tests: renderTests, messages: renderMessages, counsel: renderCounsel, study: renderStudy, plan: renderPlan, report: renderReport, quiz: renderQuiz, coach: renderCoach, account: renderAccount, dash: renderDash, roster: renderRoster, register: renderRegister, staff: renderStaffMgmt });
function render() {
  const app = $('#app');
  document.documentElement.lang = lang; document.title = orgName(); $('#title').textContent = orgName();
  const role = roleOf(), staffLike = ['guardian', 'teacher', 'admin'].includes(role);
  document.body.classList.toggle('kid', !!state.profile && state.profile.group === 'elementary' && (!staffLike || !!state.viewAs));
  const onboarding = !state.user && !state.profile;
  const tabs = onboarding ? [] : tabsNow();
  if (!onboarding && !tabs.includes(state.tab)) state.tab = tabs[0]; // 온보딩 중에는 'account'(로그인 화면)만 허용
  $('#nav').hidden = onboarding;
  $('#nav').innerHTML = tabs.map((k) => { const n = tabBadge(k); return `<button data-tab="${k}" class="${k === state.tab ? 'on' : ''}">${icon(k)}<span>${t('tab_' + k)}</span>${n ? `<b class="dot">${n}</b>` : ''}</button>`; }).join('');
  $('#nav').querySelectorAll('button').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; if (typeof roster !== 'undefined' && ['roster', 'classes', 'cafe'].includes(state.tab)) roster.loaded = false; if (typeof an !== 'undefined' && state.tab === 'data') an.data = null; render(); scrollTo(0, 0); }));
  if (onboarding) { state.tab === 'account' ? renderAccount(app) : state.trial ? renderOnboarding(app) : renderLanding(app); app.insertAdjacentHTML('beforeend', legalFooter()); app.insertAdjacentHTML('afterbegin', betaBanner()); if ($('#betaclose')) $('#betaclose').onclick = () => { betaHidden = true; render(); }; return; }
  (RENDERERS()[state.tab] || renderHome)(app);
  app.insertAdjacentHTML('beforeend', legalFooter());
  app.insertAdjacentHTML('afterbegin', betaBanner()); if ($('#betaclose')) $('#betaclose').onclick = () => { betaHidden = true; render(); };
  if (state.viewAs) { // 학생을 열어 본 상태의 안내 줄
    app.insertAdjacentHTML('afterbegin', `<div class="viewas noprint"><button id="backlist">← ${t('back_list')}</button> <b>${esc(state.viewAs.name)}</b>${state.viewAs.teacher ? ` <span class="sub">· ${t('teacher_lbl')}: ${esc(state.viewAs.teacher.name)}</span>` : ''}${state.ro ? ` <span class="tag">${t('read_only')}</span>` : ''}
      ${!state.ro && !state.viewAs.managed && !PREVIEW ? ` <button id="resetcode">🔑 ${t('reset_issue')}</button>` : ''} <span class="sub" id="resetmsg"></span></div>`);
    $('#backlist').onclick = closeStudent;
    if ($('#resetcode')) $('#resetcode').onclick = async () => {
      try { const r = await api(`/api/users/${state.viewAs.id}/reset-code`, { method: 'POST' }); $('#resetmsg').textContent = t('reset_issued', { name: r.name, code: r.code }); } catch (e) { $('#resetmsg').textContent = e.message; }
    };
  }
}

// 처음 화면: 무엇을 하는 곳인지 + 로그인/회원가입/활성화 코드/체험 진입
function renderLanding(app) {
  const enter = (entry, mode) => () => {
    state.entry = entry;
    if (PREVIEW && mode === 'login') { state.trial = entry === 'learner'; return demoSwitch(entry); } // 미리보기: 로그인 버튼이 곧바로 샘플 화면으로 들어간다
    state.authMode = mode; state.tab = 'account'; render();
  };
  const IC = { learner: 'study', guardian: 'dash', teacher: 'roster', admin: 'staff' };
  app.innerHTML = `<div class="landing"><h1>${esc(orgName())}</h1><p class="lead">${t('land_tagline')}</p>
      <div class="entrygrid">${['learner', 'guardian', 'teacher', 'admin'].map((k) => `<button class="entrytile" data-en="${k}:login"><span class="ei">${icon(IC[k])}</span><span><b>${t('login_as_' + k)}</b><small>${t('ent_' + k + '_d')}</small></span></button>`).join('')}</div>
      <p class="sub landlinks"><button class="linkbtn" data-en="learner:signup">${t('auth_tab_signup')}</button> · <button class="linkbtn" data-en="learner:claim">${t('land_claim_q')} ${t('auth_tab_claim')}</button> · <button class="linkbtn" id="ltrial">${t('land_trial')}</button></p></div>`;
  app.querySelectorAll('[data-en]').forEach((b) => { const [e, m] = b.dataset.en.split(':'); b.onclick = enter(e, m); });
  $('#ltrial').onclick = () => { state.trial = true; render(); };
}
// 제목(로고)을 누르면 홈으로: 로그아웃 상태는 시작 화면, 로그인 상태는 각자의 첫 화면
function goHome() {
  if (state.viewAs) { closeStudent(); return; }
  state.authMode = 'login';
  if (!state.user && !state.profile) { state.trial = false; state.tab = 'home'; }
  else state.tab = tabsNow()[0] || 'home';
  render(); scrollTo(0, 0);
}
function renderOnboarding(app) {
  app.innerHTML = `${PREVIEW ? '' : `<button id="backland">${t('btn_back')}</button>`}<div class="card"><h2>${t('onb_hello')}</h2>
    <p class="sub">${t('onb_intro')}</p>
    <label>${t('onb_name')}<input type="text" id="name" maxlength="20" placeholder="${t('onb_name_ph')}"></label><br><br>
    <label>${t('onb_iam')}<select id="group">${Object.keys(GROUPS).map((k) => `<option value="${k}">${groupLabel(k)}</option>`).join('')}</select></label><br><br>
    <button class="primary" id="start">${t('onb_start')}</button>
    <p class="sub">${t('onb_local_note')}</p>
    ${PREVIEW ? '' : `<p>${t('onb_have_account')} <button id="tologin">${t('onb_login_signup')}</button></p>`}</div>`;
  if (!PREVIEW) { $('#tologin').onclick = () => { state.tab = 'account'; state.authMode = 'login'; render(); }; $('#backland').onclick = () => { state.trial = false; render(); }; }
  $('#start').onclick = () => {
    state.profile = { name: $('#name').value.trim() || t('friend'), group: $('#group').value, services: { study: true, career: true }, school: '', note: '', teacherNote: '' };
    save('profile'); render();
  };
}

// ---- 홈 ----
function renderHome(app) {
  const g = state.profile.group, kid = GROUPS[g].kid;
  const open = state.tasks.filter((x) => !x.done).length, mins = state.log[today()] || 0;
  const n = ddayOf(state.goal.date), ci = state.checkins.find((c) => c.date === today());
  const wd = (new Date().getDay() + 6) % 7, todays = state.schedule.filter((b) => b.day === wd).sort((a, b) => a.start - b.start);
  const cells = state.weekplan.length * 7, green = state.weekplan.reduce((x, r) => x + r.days.filter((v) => v === 'green').length, 0);
  const sv = state.profile.services || {}, done = doneTestCount(), quickDone = answered() === Q().length;
  const dateText = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  const career = sv.career === false ? '' : kid
    ? `<div class="card"><h2>${t('home_career')}</h2>${quickDone ? `<p>${t('home_types')} ${topTypes().map((ty) => `<span class="tag strong">${R()[ty].name}</span>`).join('')}</p>` : `<p class="sub">${t('home_not_tested', { a: answered(), b: Q().length })}</p>`}<button class="primary" data-go="tests">${quickDone ? t('btn_result') : t('btn_test')}</button></div>`
    : `<div class="card"><h2>${t('home_career')}</h2><p class="sub">${t('home_comp_progress', { a: done, b: TEST_IDS.length })}</p><div class="bar"><i style="width:${done / TEST_IDS.length * 100}%"></i></div>
        <div class="actions" style="margin-top:12px"><button class="primary" data-go="${done === TEST_IDS.length ? 'report' : 'tests'}">${done === TEST_IDS.length ? t('comp_view_report') : done ? t('comp_continue') : t('comp_start')}</button></div></div>`;
  app.innerHTML = `
    <div class="hero"><div><h1>${esc(t('home_welcome', { name: state.profile.name }))} ${kid ? '🌟' : ''}</h1><p class="sub">${esc(dateText)}</p></div><span class="chip">🔥 ${unit('unit_day', streak())}</span></div>
    <div class="card"><div class="tiles"><div class="tile"><b>${unit('unit_min', mins)}</b><span class="sub">${t('stat_today')}</span></div><div class="tile"><b>${unit('unit_count', open)}</b><span class="sub">${t('stat_open')}</span></div><div class="tile"><b>${checkinsThisWeek()}</b><span class="sub">${t('rep_checkin_lbl')}</span></div></div></div>
    <div class="grid2"><div>
      ${sv.study !== false ? `<div class="card"><h2>${t('home_today_sched')}</h2>${todays.length ? todays.map((b) => `<div class="slot"><span class="tag" style="background:${esc(b.color)};color:#fff">${hourLabel(b.start)}–${hourLabel(b.end)}</span><span>${esc(b.label)}</span></div>`).join('') : `<p class="sub">${t('home_no_sched')}</p>`}
        ${cells ? `<p class="sub">${t('home_wp', { g: green, n: cells })}</p>` : ''}<div class="actions"><button data-go="plan">${t('tab_plan')}</button>${ci ? '' : `<button class="primary" id="checkin">${t('ci_btn')}</button>`}</div>${ci ? `<p class="sub">✅ ${t('ci_done', { time: esc(ci.time) })}</p>` : ''}</div>` : `<div class="card"><h2>${t('ci_title')}</h2>${ci ? `<p>✅ ${t('ci_done', { time: esc(ci.time) })}</p>` : `<button class="primary" id="checkin">${t('ci_btn')}</button>`}</div>`}
      ${career}
      <div class="card"><h2>${t('today_step')}</h2><ul>${C().next[g].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div><div>
      ${nextSessionCard()}
      ${visitCard()}
      ${n !== null ? `<div class="card"><div class="dday"><b>${ddayText(n)}</b><span>${esc(state.goal.label || t('goal_title'))} · ${esc(state.goal.date)}</span></div></div>` : ''}
      <div class="card"><h2>${t('heat_title')}</h2>${heatmapHtml()}<p class="sub">${t('heat_hint')}</p></div>
      <div class="card"><h2>${t('bd_title')}</h2>${badgesHtml()}</div>
      ${state.quiz.length ? `<div class="card"><h2>${t('recent_quiz')}</h2>${state.quiz.slice(-3).reverse().map((q) => `<div class="sub">${esc(q.date)} · ${esc(subjLabel(q.subject))} · ${q.score}/${q.total}</div>`).join('')}</div>` : ''}
    </div></div>
    ${state.viewAs ? '' : `<p class="actions"><button id="reset" class="sub">${t('btn_reset')}</button></p>`}`;
  app.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.go; render(); }));
  if ($('#checkin')) $('#checkin').onclick = () => { const d = new Date(); state.checkins.push({ date: today(), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }); save('checkins'); render(); };
  if ($('#reset')) $('#reset').onclick = () => {
    if (confirm(t('confirm_reset'))) { SYNC.forEach((k) => { state[k] = clone(DEFAULTS[k]); save(k); }); state.tab = 'home'; render(); }
  };
}

// ---- 초등학생용 쉬운 흥미검사 (검사 탭 안에서 사용) ----
function renderQuick(app) {
  const kid = GROUPS[state.profile.group].kid;
  if (answered() < Q().length) {
    app.innerHTML = `<div class="card"><h2>${t('test_title')}</h2><p class="sub">${kid ? t('test_hint_kid') : t('test_hint')} (${answered()}/${Q().length})</p>
      ${Q().map((q, i) => `<div><b>${i + 1}.</b> ${esc(kid ? q[1] : q[2])}<div class="scale" data-q="${i}">${C().scale.map((l, v) => `<button data-v="${v + 1}" class="${state.answers[i] === v + 1 ? 'on' : ''}">${l}</button>`).join('')}</div></div>`).join('')}
      <button class="primary" id="finish" ${answered() < Q().length ? 'disabled' : ''}>${t('btn_result')}</button></div>`;
    app.querySelectorAll('.scale').forEach((sc) => sc.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      state.answers[sc.dataset.q] = +b.dataset.v; save('answers');
      const y = scrollY; render(); scrollTo(0, y);
    })));
    return;
  }
  const s = scores(), top = topTypes();
  app.innerHTML = `<div class="card"><h2>${t('res_title')}</h2>
    ${Object.keys(s).sort((a, b) => s[b] - s[a]).map((ty) => `<div class="row"><span style="width:120px">${R()[ty].name}</span><div class="bar" style="flex:1"><i style="width:${s[ty] / 10 * 100}%"></i></div><span>${s[ty]}/10</span></div>`).join('')}</div>
    ${top.map((ty) => `<div class="card"><h2>${R()[ty].name} (${ty})</h2><p>${R()[ty].desc}</p><p class="sub">${t('res_jobs')}</p>${C().careers[ty][kid ? 'kid' : 'std'].map((c) => `<span class="tag">${esc(c)}</span>`).join('')}</div>`).join('')}
    <div class="card"><h2>${t('res_next')}</h2><ul>${C().next[state.profile.group].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    ${state.viewAs ? '' : `<button class="primary" data-go="coach">${t('btn_ask_coach')}</button> `}<button id="redo">${t('btn_redo')}</button></div>
    <p class="sub">${t('res_disclaimer')}</p>`;
  app.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.go; render(); }));
  $('#redo').onclick = () => { state.answers = {}; save('answers'); render(); };
}

// ---- 학습관리 ----
function renderStudy(app) {
  const week = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = dk(d); return { day: C().days[d.getDay()], m: state.log[k] || 0 }; });
  const max = Math.max(60, ...week.map((w) => w.m));
  const ts = state.tasks.filter((x) => x.done).length;
  app.innerHTML = `<div class="card"><h2>${t('study_tasks_title')}</h2>
      <div class="row"><input type="text" id="newtask" placeholder="${t('task_ph')}" maxlength="80"><button class="primary" id="add">${t('btn_add')}</button></div>
      ${state.tasks.length ? state.tasks.map((x, i) => `<div class="task ${x.done ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${x.done ? 'checked' : ''}><span>${esc(x.text)}</span><button data-del="${i}" aria-label="${t('btn_delete_item')}">✕</button></div>`).join('') : `<p class="sub">${t('task_empty')}</p>`}
      ${state.tasks.length ? `<div class="row"><button id="closeout" ${ts ? '' : 'disabled'}>${t('co_btn')}</button><span class="sub">${t('co_hint', { d: ts, n: state.tasks.length })}</span></div>` : ''}
      ${state.closeouts.length ? `<p class="sub">${t('co_history')}: ${state.closeouts.slice(-4).reverse().map((c) => `${esc(c.date)} ${c.done}/${c.total}`).join(' · ')}</p>` : ''}</div>
    <div class="card"><h2>${t('plan_title')}</h2>
      <p class="sub">${t('plan_desc')}</p>
      <input type="text" id="pgoal" maxlength="100" placeholder="${t('plan_goal_ph')}">
      <div class="row"><select id="pweeks">${[1, 2, 3, 4, 6, 8, 12].map((w) => `<option value="${w}" ${w === 4 ? 'selected' : ''}>${unit('weeks_opt', w)}</option>`).join('')}</select><input type="number" id="phours" min="1" max="40" value="5" style="max-width:90px"><span class="sub">${t('per_week')}</span><button class="primary" id="pmake">${t('btn_plan')}</button></div>
      <p class="sub" id="pmsg"></p></div>
    <div class="card"><h2>${t('log_title')}</h2>
      <div class="row"><input type="number" id="mins" min="1" max="600" placeholder="${t('min_ph')}"><button class="primary" id="log">${t('btn_log')}</button><button id="timer">${t('btn_timer')}</button></div>
      <p class="sub" id="timerout"></p>
      <div class="week">${week.map((w) => `<div><i style="height:${w.m / max * 80}px"></i>${w.day}<br>${w.m}</div>`).join('')}</div></div>`;
  const addTask = () => { const v = $('#newtask').value.trim(); if (!v) return; state.tasks.unshift({ text: v, done: false }); save('tasks'); render(); };
  $('#add').onclick = addTask; $('#newtask').onkeydown = (e) => e.key === 'Enter' && addTask();
  app.querySelectorAll('[data-i]').forEach((c) => (c.onchange = () => { state.tasks[c.dataset.i].done = c.checked; save('tasks'); render(); }));
  app.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { state.tasks.splice(b.dataset.del, 1); save('tasks'); render(); }));
  if ($('#closeout')) $('#closeout').onclick = () => { // 주간 마감: 완료 항목을 정리하고 기록을 남긴다
    state.closeouts = [...state.closeouts, { date: today(), done: ts, total: state.tasks.length }].slice(-52); save('closeouts');
    state.tasks = state.tasks.filter((x) => !x.done); save('tasks'); render();
  };
  $('#pmake').onclick = async () => {
    const goal = $('#pgoal').value.trim(); if (!goal) { $('#pmsg').textContent = t('plan_need_goal'); return; }
    $('#pmake').disabled = true; $('#pmsg').textContent = t('plan_making');
    try {
      const r = await api('/api/plan', { method: 'POST', body: { goal, weeks: +$('#pweeks').value, hours: +$('#phours').value, group: state.profile.group } });
      state.tasks = [...r.tasks.map((tk) => ({ text: `${t('week_tag', { w: tk.week })} ${tk.text}`, done: false })), ...state.tasks]; save('tasks');
      state.notice = t('plan_added', { n: r.tasks.length }) + (r.ai ? '' : t('plan_template'));
      render();
    } catch (e) { $('#pmsg').textContent = e.message; $('#pmake').disabled = false; }
  };
  if (state.notice) { $('#pmsg').textContent = state.notice; state.notice = null; }
  const addMin = (m) => { state.log[today()] = (state.log[today()] || 0) + m; save('log'); render(); };
  $('#log').onclick = () => { const m = parseInt($('#mins').value, 10); if (m > 0) addMin(Math.min(m, 600)); };
  $('#timer').onclick = () => {
    let left = 25 * 60; $('#timer').disabled = true;
    const iv = setInterval(() => {
      left--; const out = $('#timerout');
      if (!out) return clearInterval(iv); // 다른 탭으로 이동
      out.textContent = t('timer_left', { t: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` });
      if (left <= 0) { clearInterval(iv); addMin(25); alert(t('timer_done')); }
    }, 1000);
  };
}

// ---- AI 코치 ----
function renderCoach(app) {
  app.innerHTML = `<div class="card"><h2>${t('coach_title')}</h2>
    <div class="chat" id="chat">${state.chat.length ? '' : `<div class="msg assistant">${esc(t('coach_hello', { name: state.profile.name }))}</div>`}
    ${state.chat.map((m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`).join('')}</div>
    <div class="row"><input type="text" id="q" placeholder="${t('coach_ph')}" maxlength="1000"><button class="primary" id="send">${t('btn_send')}</button></div>
    <button id="clr">${t('btn_clear_chat')}</button></div>`;
  const box = $('#chat'); box.scrollTop = box.scrollHeight;
  const send = async () => {
    const q = $('#q').value.trim(); if (!q) return;
    state.chat.push({ role: 'user', content: q }); save('chat');
    $('#q').value = ''; $('#send').disabled = true;
    box.insertAdjacentHTML('beforeend', `<div class="msg user">${esc(q)}</div><div class="msg assistant" id="wait">${t('thinking')}</div>`); box.scrollTop = box.scrollHeight;
    let reply;
    try { reply = (await api('/api/chat', { method: 'POST', body: { messages: state.chat, profile: profileForAI() } })).reply || t('err_generic'); } catch (e) { reply = e.message; }
    if (state.tab !== 'coach') { state.chat.push({ role: 'assistant', content: reply }); save('chat'); return; }
    state.chat.push({ role: 'assistant', content: reply }); save('chat'); render();
  };
  $('#send').onclick = send; $('#q').onkeydown = (e) => e.key === 'Enter' && send();
  $('#clr').onclick = () => { state.chat = []; save('chat'); render(); };
}

// ---- 계정 ----
function renderAccount(app) {
  if (state.user) {
    const role = state.user.role, learner = role === 'learner';
    app.innerHTML = `<div class="card"><h2>${esc(t('acc_hello', { name: state.user.name, role: t('role_' + role) }))}</h2>
      <p class="sub">${learner ? t('acc_sync_desc') : role === 'guardian' ? t('acc_guardian_desc') : t('acc_staff_desc')}</p><button id="logout">${t('btn_logout')}</button></div>
      ${role === 'admin' ? orgCard() + backupCard() : ''}
      <div class="card"><h2>${t('acc_manage')}</h2>
        <div class="row"><input type="password" id="pwcur" placeholder="${t('pw_cur')}" autocomplete="current-password"></div>
        <div class="row"><input type="password" id="pwnew" placeholder="${t('pw_new')}" autocomplete="new-password"><button id="pwchg">${t('btn_change')}</button></div>
        <div class="row"><button id="export">${t('btn_export')}</button><button id="delacc" style="color:#d33">${t('btn_delete')}</button></div>
        <p class="sub" id="accmsg">${t('acc_note')}</p></div>
      ${learner ? `<div class="card"><h2>${t('link_title')}</h2><p>${t('link_code')}: <b style="font-size:1.3em;letter-spacing:2px">${esc(state.user.shareCode)}</b></p>
        <p class="sub">${t('link_desc')}</p>
        <button id="regen">${t('btn_regen')}</button><div id="glist" class="sub" style="margin-top:10px">${t('loading')}</div></div>
        <div class="card"><h2>${t('consent_title')}</h2><label class="row"><input type="checkbox" id="consentwb" ${state.consent.wellbeing ? 'checked' : ''} style="flex:none;width:20px"> <span>${t('consent_wb')}</span></label><label class="row"><input type="checkbox" id="consentrs" ${state.consent.research ? 'checked' : ''} style="flex:none;width:20px"> <span>${t('consent_rs')}</span></label><p class="sub">${t('consent_note')} ${t('consent_rs_note')}</p></div>` : ''}`;
    bindOrgCard(); bindBackupCard();
    $('#logout').onclick = async () => {
      await flush(); try { await api('/api/logout', { method: 'POST' }); } catch {}
      state.token = null; state.user = null; state.viewAs = null; state.ro = false; store.set('token', null); dirty.clear(); clearLocal(); state.tab = 'home'; render(); // 공용 기기에 학습 데이터가 남지 않도록 로컬 사본을 지운다
    };
    const msg = (m) => { $('#accmsg').textContent = m; };
    $('#pwchg').onclick = async () => {
      try { const r = await api('/api/password', { method: 'POST', body: { current: $('#pwcur').value, next: $('#pwnew').value } }); state.token = r.token; store.set('token', r.token); $('#pwcur').value = $('#pwnew').value = ''; msg(t('pw_changed')); } catch (e) { msg(e.message); }
    };
    $('#export').onclick = async () => {
      try {
        const j = await api('/api/export');
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' })), download: 'my-data.json' });
        a.click(); URL.revokeObjectURL(a.href);
      } catch (e) { msg(e.message); }
    };
    $('#delacc').onclick = async () => {
      const pw = prompt(t('del_prompt'));
      if (!pw) return;
      try {
        await api('/api/delete-account', { method: 'POST', body: { password: pw } });
        localStorage.clear(); state.token = null; state.user = null; dirty.clear(); loadData({}); state.tab = 'home'; render();
      } catch (e) { msg(e.message); }
    };
    if (learner) {
      $('#regen').onclick = async () => { state.user.shareCode = (await api('/api/regen-code', { method: 'POST' })).shareCode; render(); };
      $('#consentwb').onchange = (e) => { state.consent = { ...state.consent, wellbeing: e.target.checked }; save('consent'); };
      if ($('#consentrs')) $('#consentrs').onchange = (e) => { state.consent = { ...state.consent, research: e.target.checked }; save('consent'); };
      api('/api/guardians').then(({ guardians }) => {
        const el = $('#glist'); if (!el) return;
        el.innerHTML = guardians.length ? t('linked_to') + ' ' + guardians.map((g) => `${esc(g.name)} <button data-u="${esc(g.id)}">${t('btn_unlink')}</button>`).join(' ') : t('no_guardians');
        el.querySelectorAll('[data-u]').forEach((b) => (b.onclick = async () => { await api('/api/unlink', { method: 'POST', body: { id: b.dataset.u } }); render(); }));
      }).catch(() => {});
    }
    return;
  }
  const entry = state.entry || 'learner', mode = state.authMode || 'login';
  const allowedTabs = entry === 'learner' ? ['login', 'signup', 'claim'] : entry === 'guardian' ? ['login', 'signup'] : ['login'];
  const tabsHtml = allowedTabs.map((k) => `<button data-am="${k}" class="${mode === k || (mode === 'reset' && k === 'login') ? 'on' : ''}">${t('auth_tab_' + k)}</button>`).join('');
  const forms = {
    login: `<div class="card"><h2>${t('login_as_' + entry)}</h2><input type="text" id="lemail" placeholder="${t('email_ph')}" autocomplete="username"><div class="row"><input type="password" id="lpw" placeholder="${t('pw_ph')}" autocomplete="current-password"></div><button class="primary" id="login">${t('btn_login')}</button> <button data-am="reset" class="sub">${t('auth_forgot')}</button>${entry === 'teacher' || entry === 'admin' ? `<p class="sub">${t('auth_staff_note')}</p>` : ''}</div>`,
    signup: `<div class="card"><h2>${t('signup_title')}</h2>
      <input type="text" id="sname" maxlength="20" placeholder="${t('name_ph')}"><div class="row"><input type="text" id="semail" placeholder="${t('email_ph')}"></div>
      <div class="row"><input type="password" id="spw" placeholder="${t('pw_new_ph')}" autocomplete="new-password"></div>
      <input type="hidden" id="srole" value="${entry === 'guardian' ? 'guardian' : 'learner'}">
      <label class="row"><input type="checkbox" id="sagree" style="flex:none;width:20px"> <span class="sub">${t('agree_label')} (<a href="?legal=privacy" target="_blank" rel="noopener">${t('agree_link')}</a>)</span></label>
      <button class="primary" id="signup">${t('btn_signup')}</button>
      <p class="sub">${t('minor_note')}</p></div>`,
    claim: `<div class="card"><h2>${t('claim_title')}</h2><p class="sub">${t('claim_desc')}</p>
      <input type="text" id="ccode" maxlength="8" placeholder="${t('claim_code_ph')}"><div class="row"><input type="text" id="cemail" placeholder="${t('email_ph')}"></div>
      <div class="row"><input type="password" id="cpw" placeholder="${t('pw_new_ph')}" autocomplete="new-password"></div><button class="primary" id="claim">${t('claim_btn')}</button></div>`,
    reset: `<div class="card"><h2>${t('reset_title')}</h2><p class="sub">${t('reset_desc')}</p>
      <input type="text" id="rsemail" placeholder="${t('email_ph')}" autocomplete="username"><div class="row"><input type="text" id="rscode" maxlength="8" placeholder="${t('reset_code_ph')}"></div>
      <div class="row"><input type="password" id="rspw" placeholder="${t('pw_new_ph')}" autocomplete="new-password"></div><button class="primary" id="rsgo">${t('reset_btn')}</button></div>`,
  };
  app.innerHTML = `${state.profile ? '' : `<button id="back">${t('btn_back')}</button>`}
    ${allowedTabs.length > 1 ? `<div class="subnav">${tabsHtml}</div>` : ''}${forms[mode]}<p class="sub" id="amsg"></p>`;
  app.querySelectorAll('[data-am]').forEach((b) => (b.onclick = () => { state.authMode = b.dataset.am; render(); }));
  if ($('#back')) $('#back').onclick = () => { state.tab = 'home'; state.trial = false; state.authMode = 'login'; render(); };
  const go = (path, body) => async () => {
    if (PREVIEW) { $('#amsg').textContent = t('land_preview_no'); return; } // 미리보기에서는 실제로 가입·로그인되지 않는다
    $('#amsg').textContent = t('processing');
    try { await afterAuth(await api(path, { method: 'POST', body: body() })); render(); } catch (e) { $('#amsg').textContent = e.message; }
  };
  if ($('#login')) $('#login').onclick = async () => {
    if (PREVIEW) { $('#amsg').textContent = t('land_preview_no'); return; }
    $('#amsg').textContent = t('processing');
    try {
      const r = await api('/api/login', { method: 'POST', body: { email: $('#lemail').value, password: $('#lpw').value } });
      if (r.user.role !== entry) { $('#amsg').textContent = t('login_wrong_role', { role: t('role_' + r.user.role), right: t('login_as_' + r.user.role) }); return; } // 다른 입구의 계정
      await afterAuth(r); render();
    } catch (e) { $('#amsg').textContent = e.message; }
  };
  if ($('#signup')) $('#signup').onclick = () => { if (PREVIEW) { $('#amsg').textContent = t('land_preview_no'); return; } if (!$('#sagree').checked) { $('#amsg').textContent = t('agree_need'); return; } return go('/api/signup', () => ({ name: $('#sname').value, email: $('#semail').value, password: $('#spw').value, role: $('#srole').value, agree: true }))(); };
  if ($('#claim')) $('#claim').onclick = go('/api/claim', () => ({ code: $('#ccode').value, email: $('#cemail').value, password: $('#cpw').value }));
  if ($('#rsgo')) $('#rsgo').onclick = go('/api/reset', () => ({ email: $('#rsemail').value, code: $('#rscode').value, password: $('#rspw').value }));
  app.querySelectorAll('input').forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = app.querySelector('.card .primary'); if (b) b.click(); } })); // Enter 로 제출
}
