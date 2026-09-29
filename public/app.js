// 진로AI 코치 — 데이터는 브라우저(localStorage)에만 저장됩니다.
const GROUPS = {
  elementary: { label: '초등학생', kid: true },
  middle: { label: '중학생' },
  high: { label: '고등학생' },
  college: { label: '대학(원)생' },
  adult: { label: '성인/직장인' },
};

// RIASEC 흥미검사: 유형별 2문항, 초등용(kid)과 일반용 문장을 분리
const RIASEC = {
  R: { name: '현실형', desc: '몸으로 만들고 고치고 움직이는 활동을 좋아해요.' },
  I: { name: '탐구형', desc: '궁금한 것을 관찰하고 분석하며 파고드는 걸 좋아해요.' },
  A: { name: '예술형', desc: '상상하고 표현하고 새로운 것을 만드는 걸 좋아해요.' },
  S: { name: '사회형', desc: '사람을 돕고 가르치고 함께하는 걸 좋아해요.' },
  E: { name: '진취형', desc: '이끌고 설득하고 도전하는 걸 좋아해요.' },
  C: { name: '관습형', desc: '정리하고 계획하고 꼼꼼하게 처리하는 걸 좋아해요.' },
};
const QUESTIONS = [
  ['R', '무언가를 직접 만들거나 고치는 것이 재미있어요.', '도구나 기계를 다루며 무언가를 만들고 고치는 일이 즐겁다.'],
  ['R', '밖에서 몸을 움직이며 활동하는 게 좋아요.', '야외나 현장에서 몸을 쓰며 일하는 것이 잘 맞는다.'],
  ['I', '왜 그럴까? 하고 궁금한 걸 끝까지 알아내고 싶어요.', '원리를 파악하고 문제를 분석하는 일에 몰입한다.'],
  ['I', '실험이나 관찰하는 활동이 재미있어요.', '자료를 조사하고 가설을 세워 검증하는 일이 흥미롭다.'],
  ['A', '그림, 음악, 글쓰기 등으로 나를 표현하는 게 좋아요.', '나만의 아이디어를 창작물로 표현하는 일이 즐겁다.'],
  ['A', '새롭고 특이한 것을 상상하는 게 재미있어요.', '정해진 틀보다 자유롭고 독창적인 방식이 편하다.'],
  ['S', '친구를 도와주거나 가르쳐 주면 기뻐요.', '다른 사람의 성장이나 문제 해결을 돕는 일에 보람을 느낀다.'],
  ['S', '여러 사람과 함께 활동하는 게 좋아요.', '사람들과 협력하고 소통하는 환경에서 에너지를 얻는다.'],
  ['E', '모둠에서 앞장서서 이끄는 게 좋아요.', '목표를 세우고 사람들을 이끌거나 설득하는 일이 잘 맞는다.'],
  ['E', '새로운 일에 도전하고 발표하는 게 즐거워요.', '새로운 사업·프로젝트를 시작하고 성과를 내는 일이 흥미롭다.'],
  ['C', '물건과 계획을 깔끔하게 정리하는 게 좋아요.', '체계적으로 정리하고 정확하게 처리하는 일이 편하다.'],
  ['C', '정해진 규칙과 순서대로 하면 마음이 편해요.', '정해진 절차와 기준에 따라 꼼꼼히 일하는 것이 잘 맞는다.'],
];
// 유형별 추천 직업 (초등은 친숙한 직업, 그 외는 전공·커리어 포함)
const CAREERS = {
  R: { kid: ['소방관', '요리사', '건축가', '로봇 만드는 사람'], std: ['기계·전기 엔지니어', '건축·토목 설계', '항공정비사', '스마트팜 전문가', '드론·로봇 기술자'] },
  I: { kid: ['과학자', '의사', '우주비행사', '동물 연구원'], std: ['데이터 과학자', 'AI 연구원', '의사·약사', '바이오 연구원', '소프트웨어 개발자'] },
  A: { kid: ['웹툰 작가', '가수', '디자이너', '영화감독'], std: ['UX/UI 디자이너', '콘텐츠 크리에이터', '영상 감독', '게임 기획자', '작가·에디터'] },
  S: { kid: ['선생님', '간호사', '상담사', '사회복지사'], std: ['교사·교수', '임상심리사', '간호사', '평생교육 강사', '인사(HR) 담당자'] },
  E: { kid: ['사장님', '변호사', '방송 진행자', '축구 감독'], std: ['창업가', '마케터', '영업·사업개발', '변호사', '프로덕트 매니저'] },
  C: { kid: ['도서관 사서', '은행원', '회계사', '우체국 집배원'], std: ['회계사·세무사', '데이터 관리자', '공무원', '금융 분석가', '물류·SCM 전문가'] },
};
// 나이대별 다음 행동 제안
const NEXT = {
  elementary: ['좋아하는 직업 1개를 골라 그 직업이 하는 일을 부모님과 이야기해 보기', '도서관에서 그 직업 관련 책 1권 빌리기', '오늘 배운 것 중 가장 재미있던 것 한 줄로 적기'],
  middle: ['관심 직업 인터뷰 영상 2개 찾아보기', '진로체험(직업체험) 프로그램 신청해 보기', '좋아하는 과목과 직업의 연결점 적어 보기'],
  high: ['관심 학과 3곳의 교육과정 비교하기', '학과 선배/전문가 인터뷰 또는 진로 특강 신청', '생활기록부에 연결할 탐구·동아리 활동 계획 세우기'],
  college: ['관심 직무 채용공고 5개에서 공통 요구역량 뽑기', '역량 갭을 채울 프로젝트·인턴·자격증 1개 정하기', '현직자 커피챗 1회 요청하기'],
  adult: ['현재 경력에서 이어갈 수 있는 강점 3가지 정리', '관심 분야 온라인 강의/직업훈련 1개 수강 시작', '주 3시간 학습 시간을 캘린더에 고정하기'],
};

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
  token: store.get('token', null),
  user: null,
  tab: 'home',
};
const SYNC = ['profile', 'answers', 'tasks', 'log', 'chat', 'quiz'];
let pushTimer;
function schedulePush() {
  if (!state.token || state.user?.role !== 'learner') return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => api('/api/data', { method: 'PUT', body: { data: Object.fromEntries(SYNC.map((k) => [k, state[k]])) } }).catch(() => {}), 800);
}
const save = (k) => { store.set(k, state[k]); if (SYNC.includes(k)) schedulePush(); };

async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(state.token && { Authorization: 'Bearer ' + state.token }) }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || '요청에 실패했어요.');
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
  QUESTIONS.forEach(([t], i) => { s[t] += state.answers[i] || 0; });
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
  const top = answered() === QUESTIONS.length ? topTypes().map((t) => `${RIASEC[t].name}(${t})`).join(', ') : '';
  return { name: state.profile.name, group: state.profile.group, riasec: top, tasks: state.tasks.filter((t) => !t.done).map((t) => t.text).slice(0, 10).join(' / ') };
}

// ---- 화면 ----
const LEARNER_TABS = [['home', '홈'], ['explore', '진로탐색'], ['study', '학습관리'], ['quiz', '퀴즈'], ['coach', 'AI 코치'], ['account', '계정']];
const GUARDIAN_TABS = [['dash', '대시보드'], ['account', '계정']];
function render() {
  const app = $('#app');
  const guardian = state.user?.role === 'guardian';
  document.body.classList.toggle('kid', !guardian && state.profile?.group === 'elementary');
  const tabs = guardian ? GUARDIAN_TABS : LEARNER_TABS;
  if (guardian && !tabs.some(([k]) => k === state.tab)) state.tab = 'dash';
  const onboarding = !guardian && !state.profile;
  $('#nav').hidden = onboarding;
  $('#nav').innerHTML = tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === state.tab ? 'on' : ''}">${l}</button>`).join('');
  $('#nav').querySelectorAll('button').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; render(); }));
  if (onboarding) return state.tab === 'account' ? renderAccount(app) : renderOnboarding(app);
  ({ home: renderHome, explore: renderExplore, study: renderStudy, quiz: renderQuiz, coach: renderCoach, account: renderAccount, dash: renderDash }[state.tab] || renderHome)(app);
}

function renderOnboarding(app) {
  app.innerHTML = `<div class="card"><h2>안녕하세요! 👋</h2>
    <p class="sub">진로 탐색과 학습 관리를 함께 도와드려요. 나이에 맞게 말투와 내용이 달라져요.</p>
    <label>이름(별명)<input type="text" id="name" maxlength="20" placeholder="예: 민지"></label><br><br>
    <label>나는<select id="group">${Object.entries(GROUPS).map(([k, g]) => `<option value="${k}">${g.label}</option>`).join('')}</select></label><br><br>
    <button class="primary" id="start">시작하기</button>
    <p class="sub">로그인하지 않으면 입력한 정보는 이 기기의 브라우저에만 저장돼요.</p>
    <p>이미 계정이 있거나 보호자·교사이신가요? <button id="tologin">로그인 / 가입</button></p></div>`;
  $('#tologin').onclick = () => { state.tab = 'account'; render(); };
  $('#start').onclick = () => {
    state.profile = { name: $('#name').value.trim() || '친구', group: $('#group').value };
    save('profile'); render();
  };
}

function renderHome(app) {
  const g = state.profile.group;
  const done = answered() === QUESTIONS.length;
  const open = state.tasks.filter((t) => !t.done).length;
  const mins = state.log[today()] || 0;
  app.innerHTML = `
    <div class="card"><h2>${esc(state.profile.name)}님, 반가워요! ${GROUPS[g].kid ? '🌟' : ''}</h2>
      <div class="stats"><div><b>${streak()}일</b><span class="sub">연속 학습</span></div><div><b>${mins}분</b><span class="sub">오늘 공부</span></div><div><b>${open}개</b><span class="sub">남은 목표</span></div></div></div>
    <div class="card"><h2>진로탐색</h2>${done
      ? `<p>내 흥미 유형: ${topTypes().map((t) => `<span class="tag">${RIASEC[t].name}</span>`).join('')}</p>`
      : `<p class="sub">아직 흥미검사를 하지 않았어요. (${answered()}/${QUESTIONS.length})</p>`}
      <button class="primary" data-go="explore">${done ? '결과 보기' : '검사 시작'}</button></div>
    ${state.quiz.length ? `<div class="card"><h2>최근 퀴즈</h2>${state.quiz.slice(-3).reverse().map((q) => `<div class="sub">${esc(q.date)} · ${esc(q.subject)} · ${q.score}/${q.total}</div>`).join('')}</div>` : ''}
    <div class="card"><h2>오늘의 한 걸음</h2><ul>${NEXT[g].map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
    <div class="card"><button data-go="study">학습관리</button> <button data-go="quiz">퀴즈</button> <button data-go="coach">AI 코치와 상담</button> <button id="reset">처음부터</button></div>`;
  app.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.go; render(); }));
  $('#reset').onclick = () => { if (confirm('학습 데이터를 모두 지우고 처음부터 시작할까요? (로그인 상태면 서버 데이터도 지워져요)')) {
      Object.assign(state, { profile: null, answers: {}, tasks: [], log: {}, chat: [], quiz: [], tab: 'home' });
      SYNC.forEach(save); render();
    } };
}

function renderExplore(app) {
  const kid = GROUPS[state.profile.group].kid;
  if (answered() < QUESTIONS.length) {
    app.innerHTML = `<div class="card"><h2>흥미 검사</h2><p class="sub">${kid ? '얼마나 그런지 눌러 보세요!' : '각 문항에 얼마나 동의하는지 선택하세요.'} (${answered()}/${QUESTIONS.length})</p>
      ${QUESTIONS.map((q, i) => `<div><b>${i + 1}.</b> ${esc(kid ? q[1] : q[2])}<div class="scale" data-q="${i}">${['전혀', '아니', '보통', '그래', '매우'].map((l, v) => `<button data-v="${v + 1}" class="${state.answers[i] === v + 1 ? 'on' : ''}">${l}</button>`).join('')}</div></div>`).join('')}
      <button class="primary" id="finish" ${answered() < QUESTIONS.length ? 'disabled' : ''}>결과 보기</button></div>`;
    app.querySelectorAll('.scale').forEach((sc) => sc.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      state.answers[sc.dataset.q] = +b.dataset.v; save('answers');
      const y = scrollY; render(); scrollTo(0, y);
    })));
    return;
  }
  const s = scores(), top = topTypes();
  app.innerHTML = `<div class="card"><h2>내 흥미 유형 결과</h2>
    ${Object.keys(s).sort((a, b) => s[b] - s[a]).map((t) => `<div class="row"><span style="width:90px">${RIASEC[t].name}</span><div class="bar" style="flex:1"><i style="width:${s[t] / 10 * 100}%"></i></div><span>${s[t]}/10</span></div>`).join('')}</div>
    ${top.map((t) => `<div class="card"><h2>${RIASEC[t].name} (${t})</h2><p>${RIASEC[t].desc}</p><p class="sub">어울리는 직업</p>${CAREERS[t][kid ? 'kid' : 'std'].map((c) => `<span class="tag">${esc(c)}</span>`).join('')}</div>`).join('')}
    <div class="card"><h2>이렇게 이어가 보세요</h2><ul>${NEXT[state.profile.group].map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <button class="primary" data-go="coach">AI 코치에게 자세히 물어보기</button> <button id="redo">다시 검사</button></div>
    <p class="sub">이 검사는 흥미를 탐색하는 참고 자료이며, 능력이나 가능성을 결정하지 않아요.</p>`;
  $('[data-go]').onclick = () => { state.tab = 'coach'; render(); };
  $('#redo').onclick = () => { state.answers = {}; save('answers'); render(); };
}

function renderStudy(app) {
  const week = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = dk(d); return { day: '일월화수목금토'[d.getDay()], m: state.log[k] || 0 }; });
  const max = Math.max(60, ...week.map((w) => w.m));
  app.innerHTML = `<div class="card"><h2>학습 목표 / 할 일</h2>
      <div class="row"><input type="text" id="newtask" placeholder="예: 영어 단어 30개 외우기" maxlength="80"><button class="primary" id="add">추가</button></div>
      ${state.tasks.length ? state.tasks.map((t, i) => `<div class="task ${t.done ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span><button data-del="${i}">✕</button></div>`).join('') : '<p class="sub">아직 목표가 없어요. 오늘 할 일부터 적어 볼까요?</p>'}</div>
    <div class="card"><h2>AI 학습 계획 만들기</h2>
      <p class="sub">목표와 기간을 알려 주면 주차별 할 일을 만들어 목록에 추가해요.</p>
      <input type="text" id="pgoal" maxlength="100" placeholder="예: 3주 안에 분수 계산 익히기 / 토익 800점">
      <div class="row"><select id="pweeks">${[1, 2, 3, 4, 6, 8, 12].map((w) => `<option value="${w}" ${w === 4 ? 'selected' : ''}>${w}주</option>`).join('')}</select><input type="number" id="phours" min="1" max="40" value="5" style="max-width:90px"><span class="sub">시간/주</span><button class="primary" id="pmake">계획 만들기</button></div>
      <p class="sub" id="pmsg"></p></div>
    <div class="card"><h2>공부 시간 기록</h2>
      <div class="row"><input type="number" id="mins" min="1" max="600" placeholder="분"><button class="primary" id="log">기록</button><button id="timer">⏱ 25분 타이머</button></div>
      <p class="sub" id="timerout"></p>
      <div class="week">${week.map((w) => `<div><i style="height:${w.m / max * 80}px"></i>${w.day}<br>${w.m}</div>`).join('')}</div></div>`;
  const addTask = () => { const v = $('#newtask').value.trim(); if (!v) return; state.tasks.unshift({ text: v, done: false }); save('tasks'); render(); };
  $('#add').onclick = addTask; $('#newtask').onkeydown = (e) => e.key === 'Enter' && addTask();
  app.querySelectorAll('[data-i]').forEach((c) => (c.onchange = () => { state.tasks[c.dataset.i].done = c.checked; save('tasks'); render(); }));
  app.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { state.tasks.splice(b.dataset.del, 1); save('tasks'); render(); }));
  $('#pmake').onclick = async () => {
    const goal = $('#pgoal').value.trim(); if (!goal) { $('#pmsg').textContent = '목표를 입력해 주세요.'; return; }
    $('#pmake').disabled = true; $('#pmsg').textContent = '계획을 만드는 중…';
    try {
      const r = await api('/api/plan', { method: 'POST', body: { goal, weeks: +$('#pweeks').value, hours: +$('#phours').value, group: state.profile.group } });
      state.tasks = [...r.tasks.map((t) => ({ text: `[${t.week}주차] ${t.text}`, done: false })), ...state.tasks]; save('tasks');
      state.notice = `${r.tasks.length}개의 할 일을 추가했어요.${r.ai ? '' : ' (AI 키가 없어 기본 템플릿으로 만들었어요)'}`;
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
      out.textContent = `남은 시간 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (left <= 0) { clearInterval(iv); addMin(25); alert('25분 집중 완료! 5분 쉬어요 🎉'); }
    }, 1000);
  };
}

function renderCoach(app) {
  app.innerHTML = `<div class="card"><h2>AI 코치</h2>
    <div class="chat" id="chat">${state.chat.length ? '' : `<div class="msg assistant">안녕하세요, ${esc(state.profile.name)}님! 진로 고민이나 공부 계획, 뭐든 편하게 물어보세요.</div>`}
    ${state.chat.map((m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`).join('')}</div>
    <div class="row"><input type="text" id="q" placeholder="메시지를 입력하세요" maxlength="1000"><button class="primary" id="send">보내기</button></div>
    <button id="clr">대화 지우기</button></div>`;
  const box = $('#chat'); box.scrollTop = box.scrollHeight;
  const send = async () => {
    const q = $('#q').value.trim(); if (!q) return;
    state.chat.push({ role: 'user', content: q }); save('chat');
    $('#q').value = ''; $('#send').disabled = true;
    box.insertAdjacentHTML('beforeend', `<div class="msg user">${esc(q)}</div><div class="msg assistant" id="wait">생각 중…</div>`); box.scrollTop = box.scrollHeight;
    let reply;
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: state.chat, profile: profileForAI() }) });
      const j = await r.json(); reply = j.reply || j.error || '오류가 발생했어요.';
    } catch { reply = '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'; }
    if (state.tab !== 'coach') { state.chat.push({ role: 'assistant', content: reply }); save('chat'); return; }
    state.chat.push({ role: 'assistant', content: reply }); save('chat'); render();
  };
  $('#send').onclick = send; $('#q').onkeydown = (e) => e.key === 'Enter' && send();
  $('#clr').onclick = () => { state.chat = []; save('chat'); render(); };
}

// ---- 퀴즈 ----
let qz = null; // { subject, questions, i, picked, score, done }
function renderQuiz(app) {
  if (qz && !qz.done) {
    const q = qz.questions[qz.i], answered = qz.picked !== null;
    app.innerHTML = `<div class="card"><h2>${esc(qz.subject)} 퀴즈 (${qz.i + 1}/${qz.questions.length})</h2><p><b>${esc(q.q)}</b></p>
      ${q.choices.map((c, k) => `<button data-k="${k}" style="display:block;width:100%;text-align:left;margin:6px 0;${answered && k === q.answer ? 'border-color:var(--ok);background:var(--main2)' : ''}" ${answered ? 'disabled' : ''}>${'①②③④'[k]} ${esc(c)}${answered && k === qz.picked ? (k === q.answer ? ' ✅' : ' ❌') : ''}</button>`).join('')}
      ${answered ? `<p>${qz.picked === q.answer ? '정답이에요! 🎉' : '아쉬워요, 정답은 ' + '①②③④'[q.answer] + ' 이에요.'}</p><p class="sub">${esc(q.explain)}</p><button class="primary" id="next">${qz.i + 1 < qz.questions.length ? '다음 문제' : '결과 보기'}</button>` : ''}</div>`;
    app.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { qz.picked = +b.dataset.k; if (qz.picked === q.answer) qz.score++; render(); }));
    if (answered) $('#next').onclick = () => {
      if (qz.i + 1 < qz.questions.length) { qz.i++; qz.picked = null; } else {
        qz.done = true; state.quiz.push({ date: today(), subject: qz.subject, score: qz.score, total: qz.questions.length }); save('quiz');
      }
      render();
    };
    return;
  }
  const done = qz?.done ? `<div class="card"><h2>결과: ${qz.score} / ${qz.questions.length}</h2><p>${qz.score === qz.questions.length ? '만점이에요! 대단해요 🏆' : qz.score >= qz.questions.length / 2 ? '잘했어요! 틀린 부분을 한 번 더 복습해 볼까요?' : '괜찮아요, 틀린 문제가 가장 좋은 공부 재료예요. 다시 도전해 봐요!'}</p></div>` : '';
  app.innerHTML = `${done}<div class="card"><h2>AI 퀴즈</h2><p class="sub">공부한 과목이나 주제를 입력하면 ${LEVEL_LABEL[state.profile.group]} 수준의 객관식 문제를 만들어요.</p>
    <input type="text" id="subj" maxlength="40" placeholder="예: 분수의 덧셈 / 조선 후기 역사 / 엑셀 함수">
    <div class="row"><select id="cnt"><option>3</option><option selected>5</option><option>10</option></select><span class="sub">문제</span><button class="primary" id="go">퀴즈 시작</button></div><p class="sub" id="qmsg"></p></div>
    ${state.quiz.length ? `<div class="card"><h2>퀴즈 기록</h2>${state.quiz.slice(-8).reverse().map((q) => `<div class="sub">${esc(q.date)} · ${esc(q.subject)} · ${q.score}/${q.total}</div>`).join('')}</div>` : ''}`;
  $('#go').onclick = async () => {
    const subject = $('#subj').value.trim(); if (!subject) { $('#qmsg').textContent = '주제를 입력해 주세요.'; return; }
    $('#go').disabled = true; $('#qmsg').textContent = '문제를 만드는 중…';
    try {
      const r = await api('/api/quiz', { method: 'POST', body: { subject, count: +$('#cnt').value, group: state.profile.group } });
      qz = { subject, questions: r.questions, i: 0, picked: null, score: 0, done: false }; render();
    } catch (e) { $('#qmsg').textContent = e.message; $('#go').disabled = false; }
  };
}
const LEVEL_LABEL = { elementary: '초등학생', middle: '중학생', high: '고등학생', college: '대학생', adult: '성인' };

// ---- 계정 ----
function renderAccount(app) {
  if (state.user) {
    const learner = state.user.role === 'learner';
    app.innerHTML = `<div class="card"><h2>${esc(state.user.name)}님 (${learner ? '학습자' : '보호자/교사'})</h2>
      <p class="sub">${learner ? '학습 데이터가 자동으로 서버에 저장되어 다른 기기에서도 이어서 쓸 수 있어요.' : '연결된 학습자의 학습 요약을 대시보드에서 볼 수 있어요.'}</p><button id="logout">로그아웃</button></div>
      ${learner ? `<div class="card"><h2>보호자·교사 연결</h2><p>내 연결 코드: <b style="font-size:1.3em;letter-spacing:2px">${esc(state.user.shareCode)}</b></p>
        <p class="sub">이 코드를 알려 주면 보호자/교사가 나의 <b>학습 요약</b>(공부 시간, 목표, 흥미검사 결과, 퀴즈 점수)을 볼 수 있어요. AI 코치와 나눈 대화는 보이지 않아요.</p>
        <button id="regen">코드 다시 만들기</button><div id="glist" class="sub" style="margin-top:10px">불러오는 중…</div></div>` : ''}`;
    $('#logout').onclick = async () => { try { await api('/api/logout', { method: 'POST' }); } catch {} state.token = null; state.user = null; store.set('token', null); state.tab = 'home'; render(); };
    if (learner) {
      $('#regen').onclick = async () => { state.user.shareCode = (await api('/api/regen-code', { method: 'POST' })).shareCode; render(); };
      api('/api/guardians').then(({ guardians }) => {
        const el = $('#glist'); if (!el) return;
        el.innerHTML = guardians.length ? '연결된 분: ' + guardians.map((g) => `${esc(g.name)} <button data-u="${esc(g.id)}">연결 해제</button>`).join(' ') : '연결된 보호자/교사가 없어요.';
        el.querySelectorAll('[data-u]').forEach((b) => (b.onclick = async () => { await api('/api/unlink', { method: 'POST', body: { id: b.dataset.u } }); render(); }));
      }).catch(() => {});
    }
    return;
  }
  app.innerHTML = `${state.profile ? '' : '<button id="back">← 처음으로</button>'}
    <div class="card"><h2>로그인</h2><input type="text" id="lemail" placeholder="이메일" autocomplete="username"><div class="row"><input type="password" id="lpw" placeholder="비밀번호" autocomplete="current-password" style="width:100%;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"></div><button class="primary" id="login">로그인</button></div>
    <div class="card"><h2>계정 만들기</h2>
      <input type="text" id="sname" maxlength="20" placeholder="이름(별명)"><div class="row"><input type="text" id="semail" placeholder="이메일"></div>
      <div class="row"><input type="password" id="spw" placeholder="비밀번호 (8자 이상)" autocomplete="new-password" style="width:100%;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)"></div>
      <div class="row"><select id="srole"><option value="learner">학습자 (학생·성인)</option><option value="guardian">보호자 / 교사</option></select></div>
      <button class="primary" id="signup">가입하기</button>
      <p class="sub">만 14세 미만 어린이는 보호자와 함께 가입해 주세요. 가입하면 이 기기의 학습 데이터가 계정에 저장돼요.</p></div><p class="sub" id="amsg"></p>`;
  if ($('#back')) $('#back').onclick = () => { state.tab = 'home'; render(); };
  const go = (path, body) => async () => {
    $('#amsg').textContent = '처리 중…';
    try { await afterAuth(await api(path, { method: 'POST', body: body() })); render(); } catch (e) { $('#amsg').textContent = e.message; }
  };
  $('#login').onclick = go('/api/login', () => ({ email: $('#lemail').value, password: $('#lpw').value }));
  $('#signup').onclick = go('/api/signup', () => ({ name: $('#sname').value, email: $('#semail').value, password: $('#spw').value, role: $('#srole').value }));
}

// ---- 보호자/교사 대시보드 ----
function renderDash(app) {
  app.innerHTML = `<div class="card"><h2>학습자 연결</h2><div class="row"><input type="text" id="code" maxlength="8" placeholder="학습자가 알려준 8자리 코드"><button class="primary" id="link">연결</button></div><p class="sub" id="dmsg"></p></div><div id="learners">불러오는 중…</div>`;
  $('#link').onclick = async () => {
    try { const r = await api('/api/link', { method: 'POST', body: { code: $('#code').value } }); state.notice = `${r.name}님과 연결했어요.`; render(); } catch (e) { $('#dmsg').textContent = e.message; }
  };
  if (state.notice) { $('#dmsg').textContent = state.notice; state.notice = null; }
  api('/api/dashboard?today=' + today()).then(({ learners }) => {
    const el = $('#learners'); if (!el) return;
    if (!learners.length) { el.innerHTML = '<p class="sub">아직 연결된 학습자가 없어요. 학습자의 [계정] 탭에서 연결 코드를 받아 입력해 주세요.</p>'; return; }
    el.innerHTML = learners.map((l) => {
      const max = Math.max(60, ...l.week), days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return '일월화수목금토'[d.getDay()]; });
      const avg = l.quiz.length ? Math.round(l.quiz.reduce((a, q) => a + q.score / q.total, 0) / l.quiz.length * 100) : null;
      return `<div class="card"><h2>${esc(l.name)} <span class="sub">${esc(LEVEL_LABEL[l.group] || '')}</span> <button data-u="${esc(l.id)}" style="float:right">연결 해제</button></h2>
        <div class="stats"><div><b>${l.streak}일</b><span class="sub">연속 학습</span></div><div><b>${l.today}분</b><span class="sub">오늘</span></div><div><b>${l.week.reduce((a, b) => a + b, 0)}분</b><span class="sub">최근 7일</span></div></div>
        <div class="week" style="margin-top:12px">${l.week.map((m, i) => `<div><i style="height:${m / max * 80}px"></i>${days[i]}<br>${m}</div>`).join('')}</div>
        <p>목표: 완료 ${l.doneCount}개 · 진행 중 ${l.openCount}개</p>${l.openTasks.length ? `<ul>${l.openTasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <p>흥미 유형: ${l.riasec.length ? l.riasec.map((t) => `<span class="tag">${esc(RIASEC[t].name)}</span>`).join('') : '<span class="sub">검사 전</span>'}</p>
        <p>퀴즈 평균: ${avg === null ? '<span class="sub">기록 없음</span>' : avg + '점'}</p></div>`;
    }).join('');
    el.querySelectorAll('[data-u]').forEach((b) => (b.onclick = async () => { if (confirm('연결을 해제할까요?')) { await api('/api/unlink', { method: 'POST', body: { id: b.dataset.u } }); render(); } }));
  }).catch((e) => { const el = $('#learners'); if (el) el.textContent = e.message; });
}

boot();
