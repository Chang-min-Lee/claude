// 진로AI 코치 — 데이터는 브라우저(localStorage)에만 저장됩니다.
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
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dk();

let state = {
  profile: store.get('profile', null),
  answers: store.get('answers', {}),
  tasks: store.get('tasks', []),
  log: store.get('log', {}), // { 'YYYY-MM-DD': 공부 분 }
  chat: store.get('chat', []),
  quiz: store.get('quiz', []), // [{date, subject, score, total}]
  wrong: store.get('wrong', []), // 틀린 문제 [{subject, q, choices, answer, explain}]
  token: store.get('token', null),
  user: null,
  tab: 'home',
};
const SYNC = ['profile', 'answers', 'tasks', 'log', 'chat', 'quiz', 'wrong'];
let pushTimer;
function schedulePush() {
  if (!state.token || state.user?.role !== 'learner') return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => api('/api/data', { method: 'PUT', body: { data: Object.fromEntries(SYNC.map((k) => [k, state[k]])) } }).catch(() => {}), 800);
}
const save = (k) => { store.set(k, state[k]); if (SYNC.includes(k)) schedulePush(); };

async function api(path, { method = 'GET', body } = {}) {
  let r;
  try { r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', 'X-Lang': lang, ...(state.token && { Authorization: 'Bearer ' + state.token }) }, body: body && JSON.stringify(body) }); } catch { throw new Error(t('err_conn')); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || t('req_failed'));
  return j;
}
function adopt(data) { SYNC.forEach((k) => { if (data[k] !== undefined && data[k] !== null) { state[k] = data[k]; store.set(k, data[k]); } }); }
async function afterAuth(res) {
  state.token = res.token; state.user = res.user; store.set('token', res.token);
  if (res.user.role === 'guardian') { state.tab = 'dash'; return; }
  const me = await api('/api/me');
  if (me.data.profile) adopt(me.data); else schedulePush(); // 서버에 기존 데이터가 있으면 그것을 사용, 없으면 이 기기 데이터를 올림
  state.tab = 'home';
}
async function boot() {
  if (state.token) {
    try {
      const me = await api('/api/me'); state.user = me.user;
      if (me.user.role === 'learner') { if (me.data.profile) adopt(me.data); else schedulePush(); } else state.tab = 'dash';
    } catch { state.token = null; store.set('token', null); }
  }
  render();
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
  return { name: state.profile.name, group: state.profile.group, riasec: top, tasks: state.tasks.filter((t) => !t.done).map((t) => t.text).slice(0, 10).join(' / ') };
}

// ---- 화면 ----
const LEARNER_TABS = ['home', 'explore', 'study', 'quiz', 'coach', 'account'];
const GUARDIAN_TABS = ['dash', 'account'];
function render() {
  const app = $('#app');
  document.documentElement.lang = lang; document.title = t('title'); $('#title').textContent = '🧭 ' + t('title');
  const guardian = state.user?.role === 'guardian';
  document.body.classList.toggle('kid', !guardian && state.profile?.group === 'elementary');
  const tabs = guardian ? GUARDIAN_TABS : LEARNER_TABS;
  if (guardian && !tabs.includes(state.tab)) state.tab = 'dash';
  const onboarding = !guardian && !state.profile;
  $('#nav').hidden = onboarding;
  $('#nav').innerHTML = tabs.map((k) => `<button data-tab="${k}" class="${k === state.tab ? 'on' : ''}">${t('tab_' + k)}</button>`).join('');
  $('#nav').querySelectorAll('button').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; render(); }));
  if (onboarding) return state.tab === 'account' ? renderAccount(app) : renderOnboarding(app);
  ({ home: renderHome, explore: renderExplore, study: renderStudy, quiz: renderQuiz, coach: renderCoach, account: renderAccount, dash: renderDash }[state.tab] || renderHome)(app);
}

function renderOnboarding(app) {
  app.innerHTML = `<div class="card"><h2>${t('onb_hello')}</h2>
    <p class="sub">${t('onb_intro')}</p>
    <label>${t('onb_name')}<input type="text" id="name" maxlength="20" placeholder="${t('onb_name_ph')}"></label><br><br>
    <label>${t('onb_iam')}<select id="group">${Object.keys(GROUPS).map((k) => `<option value="${k}">${groupLabel(k)}</option>`).join('')}</select></label><br><br>
    <button class="primary" id="start">${t('onb_start')}</button>
    <p class="sub">${t('onb_local_note')}</p>
    <p>${t('onb_have_account')} <button id="tologin">${t('onb_login_signup')}</button></p></div>`;
  $('#tologin').onclick = () => { state.tab = 'account'; render(); };
  $('#start').onclick = () => {
    state.profile = { name: $('#name').value.trim() || t('friend'), group: $('#group').value };
    save('profile'); render();
  };
}

function renderHome(app) {
  const g = state.profile.group;
  const done = answered() === Q().length;
  const open = state.tasks.filter((t) => !t.done).length;
  const mins = state.log[today()] || 0;
  app.innerHTML = `
    <div class="card"><h2>${esc(t('home_welcome', { name: state.profile.name }))} ${GROUPS[g].kid ? '🌟' : ''}</h2>
      <div class="stats"><div><b>${unit('unit_day', streak())}</b><span class="sub">${t('stat_streak')}</span></div><div><b>${unit('unit_min', mins)}</b><span class="sub">${t('stat_today')}</span></div><div><b>${unit('unit_count', open)}</b><span class="sub">${t('stat_open')}</span></div></div></div>
    <div class="card"><h2>${t('explore_title')}</h2>${done
      ? `<p>${t('home_types')} ${topTypes().map((ty) => `<span class="tag">${R()[ty].name}</span>`).join('')}</p>`
      : `<p class="sub">${t('home_not_tested', { a: answered(), b: Q().length })}</p>`}
      <button class="primary" data-go="explore">${done ? t('btn_result') : t('btn_test')}</button></div>
    ${state.quiz.length ? `<div class="card"><h2>${t('recent_quiz')}</h2>${state.quiz.slice(-3).reverse().map((q) => `<div class="sub">${esc(q.date)} · ${esc(subjLabel(q.subject))} · ${q.score}/${q.total}</div>`).join('')}</div>` : ''}
    <div class="card"><h2>${t('today_step')}</h2><ul>${C().next[g].map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
    <div class="card"><button data-go="study">${t('tab_study')}</button> <button data-go="quiz">${t('tab_quiz')}</button> <button data-go="coach">${t('btn_ai_consult')}</button> <button id="reset">${t('btn_reset')}</button></div>`;
  app.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.go; render(); }));
  $('#reset').onclick = () => { if (confirm(t('confirm_reset'))) {
      Object.assign(state, { profile: null, answers: {}, tasks: [], log: {}, chat: [], quiz: [], wrong: [], tab: 'home' });
      SYNC.forEach(save); render();
    } };
}

function renderExplore(app) {
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
    <div class="card"><h2>${t('res_next')}</h2><ul>${C().next[state.profile.group].map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <button class="primary" data-go="coach">${t('btn_ask_coach')}</button> <button id="redo">${t('btn_redo')}</button></div>
    <p class="sub">${t('res_disclaimer')}</p>`;
  $('[data-go]').onclick = () => { state.tab = 'coach'; render(); };
  $('#redo').onclick = () => { state.answers = {}; save('answers'); render(); };
}

function renderStudy(app) {
  const week = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = dk(d); return { day: C().days[d.getDay()], m: state.log[k] || 0 }; });
  const max = Math.max(60, ...week.map((w) => w.m));
  app.innerHTML = `<div class="card"><h2>${t('study_tasks_title')}</h2>
      <div class="row"><input type="text" id="newtask" placeholder="${t('task_ph')}" maxlength="80"><button class="primary" id="add">${t('btn_add')}</button></div>
      ${state.tasks.length ? state.tasks.map((t, i) => `<div class="task ${t.done ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span><button data-del="${i}">✕</button></div>`).join('') : `<p class="sub">${t('task_empty')}</p>`}</div>
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

// ---- 퀴즈 ----
let qz = null; // { subject, questions, i, picked, score, done, review }
function renderQuiz(app) {
  if (qz && !qz.done) {
    const q = qz.questions[qz.i], answered = qz.picked !== null;
    app.innerHTML = `<div class="card"><h2>${esc(t('quiz_q_title', { subject: subjLabel(qz.subject), i: qz.i + 1, n: qz.questions.length }))}</h2><p><b>${esc(q.q)}</b></p>
      ${q.choices.map((c, k) => `<button data-k="${k}" style="display:block;width:100%;text-align:left;margin:6px 0;${answered && k === q.answer ? 'border-color:var(--ok);background:var(--main2)' : ''}" ${answered ? 'disabled' : ''}>${'①②③④'[k]} ${esc(c)}${answered && k === qz.picked ? (k === q.answer ? ' ✅' : ' ❌') : ''}</button>`).join('')}
      ${answered ? `<p>${qz.picked === q.answer ? t('quiz_ok') : t('quiz_no', { c: '①②③④'[q.answer] })}</p><p class="sub">${esc(q.explain)}</p><button class="primary" id="next">${qz.i + 1 < qz.questions.length ? t('btn_next') : t('btn_result')}</button>` : ''}</div>`;
    app.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => {
      qz.picked = +b.dataset.k;
      const same = (w) => w.q === q.q;
      if (qz.picked === q.answer) { qz.score++; if (qz.review) { state.wrong = state.wrong.filter((w) => !same(w)); save('wrong'); } } // 복습에서 맞히면 목록에서 제거
      else if (!state.wrong.some(same)) { state.wrong.push({ subject: qz.subject, q: q.q, choices: q.choices, answer: q.answer, explain: q.explain }); save('wrong'); }
      render();
    }));
    if (answered) $('#next').onclick = () => {
      if (qz.i + 1 < qz.questions.length) { qz.i++; qz.picked = null; } else {
        qz.done = true; state.quiz.push({ date: today(), subject: qz.review ? REVIEW : qz.subject, score: qz.score, total: qz.questions.length }); save('quiz');
      }
      render();
    };
    return;
  }
  const done = qz?.done ? `<div class="card"><h2>${t('quiz_result', { s: qz.score, n: qz.questions.length })}</h2><p>${qz.score === qz.questions.length ? t('quiz_perfect') : qz.score >= qz.questions.length / 2 ? t('quiz_good') : t('quiz_try')}</p></div>` : '';
  app.innerHTML = `${done}<div class="card"><h2>${t('quiz_ai_title')}</h2><p class="sub">${t('quiz_desc', { level: levelLabel(state.profile.group) })}</p>
    <input type="text" id="subj" maxlength="40" placeholder="${t('quiz_subj_ph')}">
    <div class="row"><select id="cnt"><option>3</option><option selected>5</option><option>10</option></select><span class="sub">${t('q_unit')}</span><button class="primary" id="go">${t('btn_quiz_start')}</button></div><p class="sub" id="qmsg"></p></div>
    ${state.wrong.length ? `<div class="card"><h2>${t('review_title')}</h2><p class="sub">${t('review_desc', { n: state.wrong.length })}</p><button id="review">${t('btn_review')}</button></div>` : ''}
    ${state.quiz.length ? `<div class="card"><h2>${t('quiz_history')}</h2>${state.quiz.slice(-8).reverse().map((q) => `<div class="sub">${esc(q.date)} · ${esc(subjLabel(q.subject))} · ${q.score}/${q.total}</div>`).join('')}</div>` : ''}`;
  if ($('#review')) $('#review').onclick = () => { qz = { subject: REVIEW, questions: state.wrong.slice(0, 5), i: 0, picked: null, score: 0, done: false, review: true }; render(); };
  $('#go').onclick = async () => {
    const subject = $('#subj').value.trim(); if (!subject) { $('#qmsg').textContent = t('quiz_need_subj'); return; }
    $('#go').disabled = true; $('#qmsg').textContent = t('quiz_making');
    try {
      const r = await api('/api/quiz', { method: 'POST', body: { subject, count: +$('#cnt').value, group: state.profile.group } });
      qz = { subject, questions: r.questions, i: 0, picked: null, score: 0, done: false }; render();
    } catch (e) { $('#qmsg').textContent = e.message; $('#go').disabled = false; }
  };
}

// ---- 계정 ----
function renderAccount(app) {
  if (state.user) {
    const learner = state.user.role === 'learner';
    app.innerHTML = `<div class="card"><h2>${esc(t('acc_hello', { name: state.user.name, role: learner ? t('role_learner') : t('role_guardian') }))}</h2>
      <p class="sub">${learner ? t('acc_sync_desc') : t('acc_guardian_desc')}</p><button id="logout">${t('btn_logout')}</button></div>
      <div class="card"><h2>${t('acc_manage')}</h2>
        <div class="row"><input type="password" id="pwcur" placeholder="${t('pw_cur')}" autocomplete="current-password"></div>
        <div class="row"><input type="password" id="pwnew" placeholder="${t('pw_new')}" autocomplete="new-password"><button id="pwchg">${t('btn_change')}</button></div>
        <div class="row"><button id="export">${t('btn_export')}</button><button id="delacc" style="color:#d33">${t('btn_delete')}</button></div>
        <p class="sub" id="accmsg">${t('acc_note')}</p></div>
      ${learner ? `<div class="card"><h2>${t('link_title')}</h2><p>${t('link_code')}: <b style="font-size:1.3em;letter-spacing:2px">${esc(state.user.shareCode)}</b></p>
        <p class="sub">${t('link_desc')}</p>
        <button id="regen">${t('btn_regen')}</button><div id="glist" class="sub" style="margin-top:10px">${t('loading')}</div></div>` : ''}`;
    $('#logout').onclick = async () => { try { await api('/api/logout', { method: 'POST' }); } catch {} state.token = null; state.user = null; store.set('token', null); state.tab = 'home'; render(); };
    const msg = (t) => { $('#accmsg').textContent = t; };
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
        localStorage.clear(); Object.assign(state, { token: null, user: null, profile: null, answers: {}, tasks: [], log: {}, chat: [], quiz: [], wrong: [], tab: 'home' }); render();
      } catch (e) { msg(e.message); }
    };
    if (learner) {
      $('#regen').onclick = async () => { state.user.shareCode = (await api('/api/regen-code', { method: 'POST' })).shareCode; render(); };
      api('/api/guardians').then(({ guardians }) => {
        const el = $('#glist'); if (!el) return;
        el.innerHTML = guardians.length ? t('linked_to') + ' ' + guardians.map((g) => `${esc(g.name)} <button data-u="${esc(g.id)}">${t('btn_unlink')}</button>`).join(' ') : t('no_guardians');
        el.querySelectorAll('[data-u]').forEach((b) => (b.onclick = async () => { await api('/api/unlink', { method: 'POST', body: { id: b.dataset.u } }); render(); }));
      }).catch(() => {});
    }
    return;
  }
  app.innerHTML = `${state.profile ? '' : `<button id="back">${t('btn_back')}</button>`}
    <div class="card"><h2>${t('login_title')}</h2><input type="text" id="lemail" placeholder="${t('email_ph')}" autocomplete="username"><div class="row"><input type="password" id="lpw" placeholder="${t('pw_ph')}" autocomplete="current-password"></div><button class="primary" id="login">${t('btn_login')}</button></div>
    <div class="card"><h2>${t('signup_title')}</h2>
      <input type="text" id="sname" maxlength="20" placeholder="${t('name_ph')}"><div class="row"><input type="text" id="semail" placeholder="${t('email_ph')}"></div>
      <div class="row"><input type="password" id="spw" placeholder="${t('pw_new_ph')}" autocomplete="new-password"></div>
      <div class="row"><select id="srole"><option value="learner">${t('role_opt_learner')}</option><option value="guardian">${t('role_opt_guardian')}</option></select></div>
      <button class="primary" id="signup">${t('btn_signup')}</button>
      <p class="sub">${t('minor_note')}</p></div><p class="sub" id="amsg"></p>`;
  if ($('#back')) $('#back').onclick = () => { state.tab = 'home'; render(); };
  const go = (path, body) => async () => {
    $('#amsg').textContent = t('processing');
    try { await afterAuth(await api(path, { method: 'POST', body: body() })); render(); } catch (e) { $('#amsg').textContent = e.message; }
  };
  $('#login').onclick = go('/api/login', () => ({ email: $('#lemail').value, password: $('#lpw').value }));
  $('#signup').onclick = go('/api/signup', () => ({ name: $('#sname').value, email: $('#semail').value, password: $('#spw').value, role: $('#srole').value }));
}

// ---- 보호자/교사 대시보드 ----
function renderDash(app) {
  app.innerHTML = `<div class="card"><h2>${t('dash_link_title')}</h2><div class="row"><input type="text" id="code" maxlength="8" placeholder="${t('code_ph')}"><button class="primary" id="link">${t('btn_link')}</button></div><p class="sub" id="dmsg"></p></div><div id="learners">${t('loading')}</div>`;
  $('#link').onclick = async () => {
    try { const r = await api('/api/link', { method: 'POST', body: { code: $('#code').value } }); state.notice = t('linked_ok', { name: r.name }); render(); } catch (e) { $('#dmsg').textContent = e.message; }
  };
  if (state.notice) { $('#dmsg').textContent = state.notice; state.notice = null; }
  api('/api/dashboard?today=' + today()).then(({ learners }) => {
    const el = $('#learners'); if (!el) return;
    if (!learners.length) { el.innerHTML = `<p class="sub">${t('dash_empty')}</p>`; return; }
    el.innerHTML = learners.map((l) => {
      const max = Math.max(60, ...l.week), days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return C().days[d.getDay()]; });
      const avg = l.quiz.length ? Math.round(l.quiz.reduce((a, q) => a + q.score / q.total, 0) / l.quiz.length * 100) : null;
      return `<div class="card"><h2>${esc(l.name)} <span class="sub">${esc(l.group ? groupLabel(l.group) : '')}</span> <button data-u="${esc(l.id)}" style="float:right">${t('btn_unlink')}</button></h2>
        <div class="stats"><div><b>${unit('unit_day', l.streak)}</b><span class="sub">${t('stat_streak')}</span></div><div><b>${unit('unit_min', l.today)}</b><span class="sub">${t('today_short')}</span></div><div><b>${unit('unit_min', l.week.reduce((a, b) => a + b, 0))}</b><span class="sub">${t('last7')}</span></div></div>
        <div class="week" style="margin-top:12px">${l.week.map((m, i) => `<div><i style="height:${m / max * 80}px"></i>${days[i]}<br>${m}</div>`).join('')}</div>
        <p>${t('goals_line', { d: l.doneCount, o: l.openCount })}</p>${l.openTasks.length ? `<ul>${l.openTasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <p>${t('riasec_line')} ${l.riasec.length ? l.riasec.map((ty) => `<span class="tag">${esc(R()[ty].name)}</span>`).join('') : `<span class="sub">${t('not_tested')}</span>`}</p>
        <p>${t('quiz_avg')} ${avg === null ? `<span class="sub">${t('no_record')}</span>` : unit('score_pt', avg)}</p></div>`;
    }).join('');
    el.querySelectorAll('[data-u]').forEach((b) => (b.onclick = async () => { if (confirm(t('confirm_unlink'))) { await api('/api/unlink', { method: 'POST', body: { id: b.dataset.u } }); render(); } }));
  }).catch((e) => { const el = $('#learners'); if (el) el.textContent = e.message; });
}

const langSel = $('#lang');
langSel.innerHTML = Object.entries(LANGS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
langSel.value = lang;
langSel.onchange = () => { setLang(langSel.value); render(); };
boot();
