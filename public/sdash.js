// 학생 대시보드(강사 화면): 학생을 열면 가장 먼저 보이는 "한눈에 보기"
const rosterOf = (id) => roster.learners.find((l) => l.id === id) || null;
const pctOf = (a, b) => (b ? Math.round((100 * a) / b) : null);

// 진도율: 할 일 완료율 → 없으면 주간계획 이행률
function progressPct() {
  const ts = taskStats(); if (ts.total) return pctOf(ts.done, ts.total);
  const cells = state.weekplan.length * 7; if (!cells) return null;
  return pctOf(state.weekplan.reduce((x, r) => x + r.days.filter((v) => v === 'green').length, 0), cells);
}
const planPct = () => { const c = state.weekplan.length * 7; return c ? pctOf(state.weekplan.reduce((x, r) => x + r.days.filter((v) => v === 'green').length, 0), c) : null; };

// 최근 8주 주간 학습 시간(분) 막대그래프
function weeklyTrendSvg() {
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const weeks = [...Array(8)].map((_, i) => {
    const s = new Date(mon); s.setDate(s.getDate() - 7 * (7 - i)); let m = 0;
    for (let d = 0; d < 7; d++) { const x = new Date(s); x.setDate(x.getDate() + d); m += state.log[dk(x)] || 0; }
    return { label: `${s.getMonth() + 1}/${s.getDate()}`, m };
  });
  const max = Math.max(60, ...weeks.map((w) => w.m)), W = 320, H = 110, bw = 26, gap = (W - bw * 8) / 7;
  return `<svg viewBox="0 0 ${W} ${H + 26}" class="trend" role="img" aria-label="${t('sd_trend')}">${weeks.map((w, i) => { const h = Math.max(2, (w.m / max) * H), x = i * (bw + gap);
    return `<rect x="${x}" y="${H - h}" width="${bw}" height="${h}" rx="5" class="${i === 7 ? 'cur' : ''}"/><text x="${x + bw / 2}" y="${H + 14}" text-anchor="middle">${w.label}</text><text x="${x + bw / 2}" y="${H - h - 4}" text-anchor="middle" class="v">${w.m ? Math.round(w.m / 6) / 10 + 'h' : ''}</text>`; }).join('')}</svg>`;
}

// 같은 반(없으면 같은 목표 유형) 학생 평균과 비교
function peerCompare(me) {
  const same = (l) => (me.className ? l.className === me.className : l.goal.type === me.goal.type);
  const peers = roster.learners.filter((l) => l.id !== me.id && l.enroll !== 'left' && same(l));
  const prog = (l) => pctOf(l.doneCount, l.doneCount + l.openCount), tavg = (l) => { const v = Object.values(l.deep || {}).map((r) => r.overall); return v.length ? sum(v) / v.length : null; };
  const avg = (f) => { const v = peers.map(f).filter((x) => x !== null); return v.length ? sum(v) / v.length : null; };
  return { n: peers.length, label: me.className || t('gt_' + me.goal.type), prog: { me: prog(me), avg: avg(prog) }, test: { me: tavg(me), avg: avg(tavg) } };
}
const deltaTag = (a, b, unitStr = '') => (a === null || b === null ? '' : `<span class="dl ${a - b >= 0 ? 'up' : 'dn'}">${a - b >= 0 ? '▲' : '▼'} ${Math.abs(Math.round((a - b) * 10) / 10)}${unitStr}</span>`);

function renderSdash(app) {
  if (!roster.loaded && !roster.loading) loadRoster();
  const me = rosterOf(state.viewAs.id), p = state.profile, n = ddayOf(state.goal.date), prog = progressPct(), inten = intensityOf(), it = interpret();
  const org = p.orgType, chips = [
    `<span class="tag strong">${t('gt_' + state.goal.type)}</span>`, org ? `<span class="tag">${t('ot_' + org)}</span>` : '', p.className ? `<span class="tag">${esc(p.className)}</span>` : '',
    p.seat ? `<span class="tag">${t('cafe_seat')} ${esc(p.seat)}</span>` : '', (p.services || {}).study !== false ? `<span class="tag">✓ ${t('svc_study')}</span>` : '', (p.services || {}).career !== false ? `<span class="tag">✓ ${t('svc_career')}</span>` : '',
  ].join('');
  // 검사 전 → 분석 이후
  const before = state.diag.before || state.intake.concern || '', after = state.diag.insight || (state.diag.overall || '').slice(0, 300) || [...it.interest, ...it.style, ...it.ability].join(' ');
  const iv = me ? interpretationsFor(me) : [];
  const status = me ? me.status : 'ok';
  const cmp = me ? peerCompare(me) : null;
  const a30 = attStats(state.attendance, 30);
  // 운영 모델별 지표
  const week = weekMinutes(), visits7 = state.visits.filter((v) => v.date >= dk(new Date(Date.now() - 6 * 86400000))).length, left = passLeft(p.passEnd);
  const modelBox = org === 'studycafe' ? `<div class="kv"><span>${t('sd_week_time')}</span><b>${unit('unit_min', week)}</b></div><div class="kv"><span>${t('sd_visits7')}</span><b>${visits7}</b></div><div class="kv"><span>${t('cafe_pass')}</span><b>${left === null ? '-' : left < 0 ? t('cafe_pass_expired') : t('cafe_pass_left', { n: left })}</b></div>`
    : org === 'studyroom' ? `<div class="kv"><span>${t('sd_plan_rate')}</span><b>${planPct() === null ? '-' : planPct() + '%'}</b></div><div class="kv"><span>${t('rep_checkin_lbl')}</span><b>${checkinsThisWeek()}</b></div><div class="kv"><span>${t('sd_week_time')}</span><b>${unit('unit_min', week)}</b></div>`
    : org === 'consultant' ? `<div class="kv"><span>${t('sd_sessions')}</span><b>${state.counsel.length}</b></div><div class="kv"><span>${t('ns_label')}</span><b>${esc(p.nextSession || '-')}</b></div><div class="kv"><span>${t('sd_diag_rounds')}</span><b>${diagRounds().length}</b></div>`
    : `<div class="kv"><span>${t('sd_goal_prep')}</span><b>${n === null ? '-' : ddayText(n)}</b></div><div class="kv"><span>${t('sd_week_time')}</span><b>${unit('unit_min', week)}</b></div><div class="kv"><span>${t('rep_checkin_lbl')}</span><b>${checkinsThisWeek()}</b></div>`;
  const pace = n === null ? '' : n < 0 ? t('sd_pace_over') : n <= 14 && (prog === null || prog < 70) ? t('sd_pace_slow') : t('sd_pace_ok');
  app.innerHTML = `<div class="sdhead"><h1>${t('sd_title')}</h1><p class="sub">${t('sd_sub')}</p><div>${chips}</div></div>
    <div class="beforeafter"><div class="ba before"><small>${t('sd_before')}</small><p>${esc(before) || `<span class="sub">${t('sd_before_empty')}</span>`}</p></div><span class="arr">→</span><div class="ba after"><small>${t('sd_after')}</small><p>${esc(after) || `<span class="sub">${t('sd_after_empty')}</span>`}</p></div></div>
    <div class="tiles4">
      <div class="tile"><small>${t('sd_progress')}</small><b>${prog === null ? '-' : prog + '%'}</b>${prog !== null ? `<div class="bar"><i style="width:${prog}%"></i></div>` : ''}</div>
      <div class="tile"><small>${t('rep_intensity')}</small><b>${inten ? t('int_' + inten) : '-'}</b><span class="sub">${inten ? t('sd_sdl', { n: lastRes('sdl').overall.toFixed(1) }) : t('sd_no_test')}</span></div>
      <div class="tile"><small>${a30.n ? t('att_rate30') : t('rep_checkin_lbl')}</small><b>${a30.n ? a30.rate + '%' : checkinsThisWeek()}</b><span class="sub">${a30.n ? t('sd_att_n', { n: a30.n }) : t('sd_week')}</span></div>
      <div class="tile"><small>${t('sd_status')}</small><b><span class="pill ${status}">${t('st_' + status)}</span></b><span class="sub">${iv.length ? t('sd_reasons', { n: iv.length }) : t('sd_no_reason')}</span></div></div>
    ${n !== null ? `<div class="card ddband"><b class="d">${ddayText(n)}</b><div><b>${esc(state.goal.label || t('goal_title'))}</b> <span class="sub">${esc(state.goal.date)}</span><br><span class="pace">${pace}</span></div></div>` : ''}
    ${iv.length ? `<div class="card"><h2>${t('iv_title')}</h2><ul class="ivlist">${iv.map((a) => `<li><span class="tag ${a.sev >= 3 ? 'weak' : ''}">${t('iv_' + a.k)}</span> ${esc(a.why)}<br><span class="sub"><b>${t('iv_todo')}</b> ${esc(a.todo)}</span></li>`).join('')}</ul>
      <div class="row"><button class="primary" data-sdgo="${iv[0].tab}">${t('iv_open')}</button><button data-sdgo="messages">${t('iv_msg_btn')}</button></div></div>` : ''}
    <div class="grid2"><div class="card"><h2>${t('sd_peer')}${cmp ? ` <span class="sub">${esc(cmp.label)}</span>` : ''}</h2>${cmp && cmp.n >= 2 ? `<div class="kv"><span>${t('sd_progress')}</span><b>${cmp.prog.me ?? '-'}% ${deltaTag(cmp.prog.me, cmp.prog.avg, '%p')}</b></div><p class="sub">${t('sd_peer_avg', { n: cmp.n, v: cmp.prog.avg === null ? '-' : Math.round(cmp.prog.avg) + '%' })}</p>
        <div class="kv"><span>${t('sd_test_avg')}</span><b>${cmp.test.me === null ? '-' : cmp.test.me.toFixed(1)} ${deltaTag(cmp.test.me, cmp.test.avg)}</b></div><p class="sub">${t('sd_peer_avg', { n: cmp.n, v: cmp.test.avg === null ? '-' : cmp.test.avg.toFixed(1) })}</p>` : `<p class="sub">${roster.loading ? t('loading') : t('sd_peer_few', { n: cmp ? cmp.n : 0 })}</p>`}</div>
      <div class="card"><h2>${t('sd_model')}${org ? ` <span class="sub">${t('ot_' + org)}</span>` : ''}</h2>${modelBox}</div></div>
    <div class="card"><h2>${t('sd_trend')}</h2>${weeklyTrendSvg()}<p class="sub">${t('sd_trend_help')}</p></div>
    <div class="card"><h2>${t('sd_shortcuts')}</h2><div class="actions"><button data-sdgo="report">${t('tab_report')}</button><button data-sdgo="counsel">${t('tab_counsel')}</button><button data-sdgo="tests">${t('tab_tests')}</button><button data-sdgo="input">${t('tab_input')}</button><button data-sdgo="messages">${t('tab_messages')}</button></div></div>`;
  app.querySelectorAll('[data-sdgo]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.sdgo; render(); scrollTo(0, 0); }));
}
const interpretationsFor = (l) => (typeof interventions === 'function' ? interventions(l) : []);

// 위쪽 학생 전환 막대
function studentBar() {
  const v = state.viewAs, opts = roster.learners.filter((l) => l.enroll !== 'left');
  if (!roster.loaded && !roster.loading) loadRoster();
  return `<div class="viewas noprint"><button id="backlist" title="${t('back_list')}">←</button>
    <select id="stusw" aria-label="${t('sd_switch')}">${opts.some((l) => l.id === v.id) ? '' : `<option value="${esc(v.id)}">${esc(v.name)}</option>`}${opts.map((l) => `<option value="${esc(l.id)}" ${l.id === v.id ? 'selected' : ''}>${esc(l.name)}${l.className ? ' · ' + esc(l.className) : ''}</option>`).join('')}</select>
    ${v.teacher ? `<span class="sub">${t('teacher_lbl')}: ${esc(v.teacher.name)}</span>` : ''}
    ${!state.ro && !v.managed && !PREVIEW ? `<button id="resetcode" class="sub">🔑 ${t('reset_issue')}</button>` : ''}<span class="sub" id="resetmsg"></span></div>`;
}
