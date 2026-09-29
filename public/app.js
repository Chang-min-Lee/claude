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
const today = () => new Date().toISOString().slice(0, 10);

let state = {
  profile: store.get('profile', null),
  answers: store.get('answers', {}),
  tasks: store.get('tasks', []),
  log: store.get('log', {}), // { 'YYYY-MM-DD': 공부 분 }
  chat: store.get('chat', []),
  tab: 'home',
};
const save = (k) => store.set(k, state[k]);

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
  if (!state.log[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1); // 오늘 아직 안 했어도 어제까지 이어졌으면 유지
  while (state.log[d.toISOString().slice(0, 10)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function profileForAI() {
  const top = answered() === QUESTIONS.length ? topTypes().map((t) => `${RIASEC[t].name}(${t})`).join(', ') : '';
  return { name: state.profile.name, group: state.profile.group, riasec: top, tasks: state.tasks.filter((t) => !t.done).map((t) => t.text).slice(0, 10).join(' / ') };
}

// ---- 화면 ----
function render() {
  const app = $('#app');
  document.body.classList.toggle('kid', state.profile?.group === 'elementary');
  $('#nav').hidden = !state.profile;
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  if (!state.profile) return renderOnboarding(app);
  ({ home: renderHome, explore: renderExplore, study: renderStudy, coach: renderCoach }[state.tab])(app);
}

function renderOnboarding(app) {
  app.innerHTML = `<div class="card"><h2>안녕하세요! 👋</h2>
    <p class="sub">진로 탐색과 학습 관리를 함께 도와드려요. 나이에 맞게 말투와 내용이 달라져요.</p>
    <label>이름(별명)<input type="text" id="name" maxlength="20" placeholder="예: 민지"></label><br><br>
    <label>나는<select id="group">${Object.entries(GROUPS).map(([k, g]) => `<option value="${k}">${g.label}</option>`).join('')}</select></label><br><br>
    <button class="primary" id="start">시작하기</button>
    <p class="sub">입력한 정보는 이 기기의 브라우저에만 저장돼요.</p></div>`;
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
    <div class="card"><h2>오늘의 한 걸음</h2><ul>${NEXT[g].map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
    <div class="card"><button data-go="study">학습관리</button> <button data-go="coach">AI 코치와 상담</button> <button id="reset">처음부터</button></div>`;
  app.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.go; render(); }));
  $('#reset').onclick = () => { if (confirm('모든 데이터를 지우고 처음부터 시작할까요?')) { localStorage.clear(); state = { profile: null, answers: {}, tasks: [], log: {}, chat: [], tab: 'home' }; render(); } };
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
  const week = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = d.toISOString().slice(0, 10); return { day: '일월화수목금토'[d.getDay()], m: state.log[k] || 0 }; });
  const max = Math.max(60, ...week.map((w) => w.m));
  app.innerHTML = `<div class="card"><h2>학습 목표 / 할 일</h2>
      <div class="row"><input type="text" id="newtask" placeholder="예: 영어 단어 30개 외우기" maxlength="80"><button class="primary" id="add">추가</button></div>
      ${state.tasks.length ? state.tasks.map((t, i) => `<div class="task ${t.done ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span><button data-del="${i}">✕</button></div>`).join('') : '<p class="sub">아직 목표가 없어요. 오늘 할 일부터 적어 볼까요?</p>'}</div>
    <div class="card"><h2>공부 시간 기록</h2>
      <div class="row"><input type="number" id="mins" min="1" max="600" placeholder="분"><button class="primary" id="log">기록</button><button id="timer">⏱ 25분 타이머</button></div>
      <p class="sub" id="timerout"></p>
      <div class="week">${week.map((w) => `<div><i style="height:${w.m / max * 80}px"></i>${w.day}<br>${w.m}</div>`).join('')}</div></div>`;
  const addTask = () => { const v = $('#newtask').value.trim(); if (!v) return; state.tasks.unshift({ text: v, done: false }); save('tasks'); render(); };
  $('#add').onclick = addTask; $('#newtask').onkeydown = (e) => e.key === 'Enter' && addTask();
  app.querySelectorAll('[data-i]').forEach((c) => (c.onchange = () => { state.tasks[c.dataset.i].done = c.checked; save('tasks'); render(); }));
  app.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { state.tasks.splice(b.dataset.del, 1); save('tasks'); render(); }));
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

document.querySelectorAll('nav button').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; render(); }));
render();
