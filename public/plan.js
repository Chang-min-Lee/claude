// 학습 계획: 주간 시간표(드래그 입력) / 주간 학습계획표 / 목표·D-day / 성적 추이
const H0 = 6, H1 = 23; // 시간표 표시 범위 06:00 ~ 23:00
const SCH_COLORS = ['#BE185D', '#0E7490', '#4338CA', '#B45309', '#15803D', '#6D28D9', '#78716C'];
const KINDS = ['self', 'school', 'extra'];
const STATUS_CYCLE = ['', 'green', 'yellow', 'red'];
const monFirst = () => [1, 2, 3, 4, 5, 6, 0].map((i) => C().days[i]);
const pad2 = (n) => String(n).padStart(2, '0');
const hourLabel = (h) => `${pad2(h)}:00`;
const ddayOf = (date) => (date ? Math.round((new Date(date + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000) : null);
const ddayText = (n) => (n === null ? '' : n === 0 ? 'D-Day' : n > 0 ? `D-${n}` : `D+${-n}`);

function subnav(tab, ids) {
  return `<div class="subnav">${ids.map((k) => `<button data-sub="${k}" class="${state.sub[tab] === k ? 'on' : ''}">${t('sub_' + k)}</button>`).join('')}</div>`;
}
function bindSubnav(app, tab) { app.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => { state.sub[tab] = b.dataset.sub; render(); })); }

function renderPlan(app) {
  app.innerHTML = subnav('plan', ['schedule', 'weekplan', 'goal', 'grades']) + '<div id="planbody"></div>';
  bindSubnav(app, 'plan');
  ({ schedule: schedView, weekplan: weekplanView, goal: goalView, grades: gradesView }[state.sub.plan] || schedView)($('#planbody'));
}

// ---------- 주간 시간표 ----------
let sg = { draft: null, msg: '', drag: null, moved: false };
let sgUp = null; // 현재 시간표 화면의 mouseup 처리기 (문서 전체에 한 번만 등록)
document.addEventListener('mouseup', () => sgUp && sgUp());
const blockHours = (b) => b.end - b.start;

// AI 없이(서버 키 없음·미리보기) 쓰는 기본 시간표 — 서버의 fallbackSchedule 과 같은 규칙
const SLOT_ORDER = [[0, 19], [1, 19], [2, 19], [3, 19], [4, 19], [5, 10], [6, 10], [0, 20], [1, 20], [2, 20], [3, 20], [4, 20], [5, 14], [6, 14], [0, 18], [1, 18], [2, 18], [3, 18], [4, 18], [5, 15], [6, 15], [5, 11], [6, 11], [5, 16], [6, 16], [0, 21], [1, 21], [2, 21], [3, 21], [4, 21]];
function localSchedule({ subjects, hours }) {
  const subs = subjects.length ? subjects : lang === 'vi' ? ['Ngữ văn', 'Toán', 'Tiếng Anh'] : ['국어', '수학', '영어'];
  const review = lang === 'vi' ? 'Ôn tập' : '복습·정리', color = {};
  const schedule = SLOT_ORDER.slice(0, Math.min(hours, SLOT_ORDER.length)).map(([day, start], i) => {
    const l = i % (subs.length + 1) === subs.length ? review : subs[i % (subs.length + 1)];
    color[l] = color[l] || SCH_COLORS[Object.keys(color).length % SCH_COLORS.length];
    return { day, start, end: start + 1, label: l, color: color[l] };
  });
  const per = Math.max(1, Math.round(hours / subs.length));
  return { ai: false, schedule, weekplan: subs.map((subject) => ({ subject, kind: 'self', detail: lang === 'vi' ? `Học ${per} giờ/tuần · ôn lại 30 phút` : `주 ${per}시간 학습 · 복습 30분` })) };
}

function schedView(body) {
  const days = monFirst(), ro = state.ro;
  const hours = []; for (let h = H0; h < H1; h++) hours.push(h);
  const row = (h) => h - H0 + 2;
  const grid = `<div class="sgrid" id="sgrid" style="grid-template-rows:auto repeat(${hours.length},28px)">
    ${days.map((n, d) => `<div class="dayhead" style="grid-column:${d + 2};grid-row:1">${n}</div>`).join('')}
    ${hours.map((h) => `<div class="hourlbl" style="grid-column:1;grid-row:${row(h)}">${hourLabel(h)}</div>` + days.map((_, d) => `<div class="sgcell" data-d="${d}" data-h="${h}" style="grid-column:${d + 2};grid-row:${row(h)}"></div>`).join('')).join('')}
    ${state.schedule.map((b, i) => `<div class="sgblock" data-i="${i}" title="${esc(b.label)}" style="grid-column:${b.day + 2};grid-row:${row(b.start)}/${row(b.end)};background:${esc(b.color)}">${esc(b.label)}</div>`).join('')}
  </div>`;
  const total = state.schedule.reduce((a, b) => a + blockHours(b), 0), by = {};
  state.schedule.forEach((b) => { by[b.label] = (by[b.label] || 0) + blockHours(b); });
  const dr = sg.draft;
  const panel = dr ? `<div class="sg-panel"><b>${days[dr.day]} ${hourLabel(dr.start)}–${hourLabel(dr.end)}</b>
      <div class="row"><select id="sgstart">${hours.map((h) => `<option value="${h}" ${h === dr.start ? 'selected' : ''}>${hourLabel(h)}</option>`).join('')}</select> ~
      <select id="sgend">${hours.map((h) => h + 1).map((h) => `<option value="${h}" ${h === dr.end ? 'selected' : ''}>${hourLabel(h)}</option>`).join('')}</select></div>
      <input type="text" id="sglabel" maxlength="30" placeholder="${t('sch_label_ph')}" value="${esc(dr.label)}">
      <div class="swatches">${SCH_COLORS.map((c) => `<button class="swatch ${c === dr.color ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
      <div class="row"><button class="primary" id="sgsave">${t('btn_save')}</button><button id="sgcancel">${t('btn_cancel')}</button>${dr.idx !== undefined ? `<button id="sgdel" style="color:#d33">${t('btn_delete_item')}</button>` : ''}</div>
      ${sg.msg ? `<p class="sub">${esc(sg.msg)}</p>` : ''}</div>` : '';
  body.innerHTML = `<div class="card"><h2>${t('sch_title')}</h2><p class="sub">${ro ? '' : t('sch_help')}</p>
      <div class="sgwrap">${grid}</div>${ro ? '' : panel}
      <p>${t('sch_total', { n: total })}</p><p>${Object.entries(by).map(([l, h]) => `<span class="tag">${esc(l)} ${h}h</span>`).join('') || `<span class="sub">${t('sch_empty')}</span>`}</p></div>
    ${ro ? '' : `<div class="card"><h2>${t('sch_ai_title')}</h2><p class="sub">${t('sch_ai_desc')}</p>
      <input type="text" id="aisubj" maxlength="80" placeholder="${t('sch_ai_subj_ph')}">
      <div class="row"><input type="number" id="aihours" min="1" max="30" value="8" style="max-width:90px"><span class="sub">${t('per_week')}</span><button class="primary" id="aigen">${t('sch_ai_btn')}</button></div>
      <p class="sub" id="aimsg">${state.notice ? esc(state.notice) : ''}</p></div>`}`;
  state.notice = null;
  if (ro) return;
  const grid$ = $('#sgrid');
  const openDraft = (d) => { sg.draft = d; sg.msg = ''; render(); const el = $('#sglabel'); if (el) el.focus(); };
  const ghost = () => {
    let g = $('#sgghost');
    if (!sg.drag) { if (g) g.remove(); return; }
    if (!g) { g = document.createElement('div'); g.id = 'sgghost'; g.className = 'sgghost'; grid$.appendChild(g); }
    const a = Math.min(sg.drag.h0, sg.drag.h1), b = Math.max(sg.drag.h0, sg.drag.h1) + 1;
    g.style.cssText = `grid-column:${sg.drag.d + 2};grid-row:${row(a)}/${row(b)}`;
  };
  grid$.addEventListener('mousedown', (e) => { const c = e.target.closest('.sgcell'); if (!c) return; sg.drag = { d: +c.dataset.d, h0: +c.dataset.h, h1: +c.dataset.h }; sg.moved = false; e.preventDefault(); });
  grid$.addEventListener('mouseover', (e) => { const c = e.target.closest('.sgcell'); if (!sg.drag || !c || +c.dataset.d !== sg.drag.d) return; sg.drag.h1 = +c.dataset.h; if (sg.drag.h1 !== sg.drag.h0) { sg.moved = true; ghost(); } });
  const up = () => {
    if (!sg.drag) return;
    const d = sg.drag; sg.drag = null; ghost();
    if (sg.moved) { sg.moved = false; sg.suppress = true; setTimeout(() => { sg.suppress = false; }, 0); openDraft({ day: d.d, start: Math.min(d.h0, d.h1), end: Math.max(d.h0, d.h1) + 1, label: '', color: SCH_COLORS[state.schedule.length % SCH_COLORS.length] }); }
  };
  sgUp = up;
  grid$.addEventListener('click', (e) => { // 클릭/탭: 블록이면 수정, 빈 칸이면 1시간짜리 새 블록
    if (sg.suppress) { sg.suppress = false; return; }
    const b = e.target.closest('.sgblock');
    if (b) { const i = +b.dataset.i, x = state.schedule[i]; return openDraft({ idx: i, day: x.day, start: x.start, end: x.end, label: x.label, color: x.color }); }
    const c = e.target.closest('.sgcell');
    if (c) openDraft({ day: +c.dataset.d, start: +c.dataset.h, end: +c.dataset.h + 1, label: '', color: SCH_COLORS[state.schedule.length % SCH_COLORS.length] });
  });
  if (dr) {
    body.querySelectorAll('[data-color]').forEach((b) => (b.onclick = () => { dr.label = $('#sglabel').value; dr.start = +$('#sgstart').value; dr.end = +$('#sgend').value; dr.color = b.dataset.color; render(); }));
    $('#sgcancel').onclick = () => { sg.draft = null; render(); };
    if ($('#sgdel')) $('#sgdel').onclick = () => { state.schedule.splice(dr.idx, 1); save('schedule'); sg.draft = null; render(); };
    $('#sgsave').onclick = () => {
      const label = $('#sglabel').value.trim(), start = +$('#sgstart').value, end = +$('#sgend').value;
      dr.label = label; dr.start = start; dr.end = end;
      if (!label) { sg.msg = t('sch_need_label'); return render(); }
      if (end <= start) { sg.msg = t('sch_bad_range'); return render(); }
      if (state.schedule.some((b, i) => i !== dr.idx && b.day === dr.day && start < b.end && b.start < end)) { sg.msg = t('sch_overlap'); return render(); }
      const blk = { day: dr.day, start, end, label, color: dr.color };
      if (dr.idx !== undefined) state.schedule[dr.idx] = blk; else state.schedule.push(blk);
      save('schedule'); sg.draft = null; render();
    };
  }
  $('#aigen').onclick = async () => {
    const subjects = $('#aisubj').value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 6), hours = Math.min(30, Math.max(1, +$('#aihours').value || 8));
    $('#aigen').disabled = true; $('#aimsg').textContent = t('sch_ai_making');
    try {
      const r = PREVIEW ? localSchedule({ subjects, hours }) : await api('/api/schedule', { method: 'POST', body: { group: state.profile.group, goal: state.goal.label, hours, subjects } });
      state.schedule = r.schedule; save('schedule');
      if (r.weekplan?.length) { state.weekplan = r.weekplan.map((w) => ({ ...w, days: ['', '', '', '', '', '', ''] })); save('weekplan'); }
      state.notice = t('sch_ai_done', { n: r.schedule.length }) + (r.ai ? '' : t('sch_ai_template'));
      render();
    } catch (e) { $('#aimsg').textContent = e.message; $('#aigen').disabled = false; }
  };
}

// ---------- 주간 학습계획표 ----------
const allGreen = () => state.weekplan.length > 0 && state.weekplan.every((r) => r.days.every((d) => d === 'green'));
function weekplanView(body) {
  const days = monFirst(), ro = state.ro;
  const rows = state.weekplan.map((r, ri) => `<tr><td class="subj">${esc(r.subject)}</td><td class="kind">${t('kind_' + r.kind)}</td><td class="detail">${esc(r.detail)}</td>
      ${r.days.map((v, di) => `<td><button class="daycell ${v || 'none'}" data-r="${ri}" data-d="${di}" aria-label="${esc(r.subject)} ${days[di]}" ${ro ? 'disabled' : ''}></button></td>`).join('')}
      <td>${ro ? '' : `<button data-delrow="${ri}" aria-label="${t('btn_delete_item')}">✕</button>`}</td></tr>`).join('');
  const hist = state.weekhist.slice().reverse().slice(0, 6);
  body.innerHTML = `<div class="card"><h2>${t('wp_title')}</h2><p class="sub">${t('wp_help')}</p>
      <div class="legend"><span class="lg green"></span>${t('wp_done')} <span class="lg yellow"></span>${t('wp_partial')} <span class="lg red"></span>${t('wp_missed')}</div>
      ${state.weekplan.length ? `<div class="tscroll"><table class="wplan"><thead><tr><th>${t('wp_subject')}</th><th>${t('wp_kind')}</th><th>${t('wp_detail')}</th>${days.map((d) => `<th>${d}</th>`).join('')}<th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="sub">${t('wp_empty')}</p>`}
      ${ro ? '' : `<div class="row"><button class="primary" id="wpsubmit" ${allGreen() ? '' : 'disabled'}>${t('wp_submit')}</button><span class="sub">${allGreen() ? '' : t('wp_submit_hint')}</span></div>`}</div>
    ${ro ? '' : `<div class="card"><h2>${t('wp_add')}</h2>
      <div class="row"><input type="text" id="wps" maxlength="30" placeholder="${t('wp_subject')}"><select id="wpk">${KINDS.map((k) => `<option value="${k}">${t('kind_' + k)}</option>`).join('')}</select></div>
      <div class="row"><input type="text" id="wpd" maxlength="80" placeholder="${t('wp_detail')}"><button class="primary" id="wpadd">${t('btn_add')}</button></div>
      <button id="wpfromsch">${t('wp_from_schedule')}</button></div>`}
    ${hist.length ? `<div class="card"><h2>${t('wp_history')}</h2>${hist.map((h) => `<div class="sub">${esc(h.date)} · ${h.subjects.map(esc).join(', ')}</div>`).join('')}</div>` : ''}`;
  if (ro) return;
  body.querySelectorAll('.daycell').forEach((b) => (b.onclick = () => {
    const r = state.weekplan[+b.dataset.r], di = +b.dataset.d;
    r.days[di] = STATUS_CYCLE[(STATUS_CYCLE.indexOf(r.days[di]) + 1) % STATUS_CYCLE.length]; save('weekplan'); render();
  }));
  body.querySelectorAll('[data-delrow]').forEach((b) => (b.onclick = () => { state.weekplan.splice(+b.dataset.delrow, 1); save('weekplan'); render(); }));
  $('#wpadd').onclick = () => { const s = $('#wps').value.trim(); if (!s) return; state.weekplan.push({ subject: s, kind: $('#wpk').value, detail: $('#wpd').value.trim(), days: ['', '', '', '', '', '', ''] }); save('weekplan'); render(); };
  $('#wpfromsch').onclick = () => {
    const have = new Set(state.weekplan.map((r) => r.subject));
    [...new Set(state.schedule.map((b) => b.label))].filter((l) => !have.has(l)).forEach((l) => state.weekplan.push({ subject: l, kind: 'self', detail: '', days: ['', '', '', '', '', '', ''] }));
    save('weekplan'); render();
  };
  $('#wpsubmit').onclick = () => {
    if (!allGreen()) return;
    state.weekhist.push({ date: today(), subjects: state.weekplan.map((r) => r.subject) }); state.weekhist = state.weekhist.slice(-30); save('weekhist');
    state.weekplan.forEach((r) => { r.days = ['', '', '', '', '', '', '']; }); save('weekplan'); render();
  };
}

// ---------- 목표·D-day ----------
const GOAL_TYPES = ['abroad', 'school', 'career', 'general'];
function goalView(body) {
  const g = state.goal, ro = state.ro, n = ddayOf(g.date);
  const done = g.milestones.filter((m) => m.done).length;
  body.innerHTML = `<div class="card"><h2>${t('goal_title')}</h2>
      ${g.date ? `<div class="dday"><b>${ddayText(n)}</b><span>${esc(g.label)} · ${esc(g.date)}</span></div>` : ''}
      <div class="row"><select id="gtype" ${ro ? 'disabled' : ''}>${GOAL_TYPES.map((k) => `<option value="${k}" ${g.type === k ? 'selected' : ''}>${t('gt_' + k)}</option>`).join('')}</select></div>
      <div class="row"><input type="text" id="glabel" maxlength="60" placeholder="${t('goal_label_ph')}" value="${esc(g.label)}" ${ro ? 'disabled' : ''}><input type="date" id="gdate" value="${esc(g.date)}" style="max-width:170px" ${ro ? 'disabled' : ''}></div>
      <textarea id="gnote" maxlength="200" rows="2" placeholder="${t('goal_note_ph')}" ${ro ? 'disabled' : ''}>${esc(g.note)}</textarea></div>
    <div class="card"><h2>${t('ms_title')} <span class="sub">${done}/${g.milestones.length}</span></h2>
      ${g.milestones.map((m, i) => `<div class="task ${m.done ? 'done' : ''}"><input type="checkbox" data-mdone="${i}" ${m.done ? 'checked' : ''} ${ro ? 'disabled' : ''}><span>${esc(m.text)}${m.date ? ` <span class="sub">${esc(m.date)}</span>` : ''}</span>${ro ? '' : `<button data-mdel="${i}" aria-label="${t('btn_delete_item')}">✕</button>`}</div>`).join('') || `<p class="sub">${t('ms_empty')}</p>`}
      ${ro ? '' : `<div class="row"><input type="text" id="mtext" maxlength="60" placeholder="${t('ms_ph')}"><input type="date" id="mdate" style="max-width:170px"><button class="primary" id="madd">${t('btn_add')}</button></div>`}</div>`;
  if (ro) return;
  const upd = () => { g.type = $('#gtype').value; g.label = $('#glabel').value.trim(); g.date = $('#gdate').value; g.note = $('#gnote').value.trim(); save('goal'); };
  ['#gtype', '#glabel', '#gdate', '#gnote'].forEach((s) => ($(s).onchange = () => { upd(); render(); }));
  body.querySelectorAll('[data-mdone]').forEach((c) => (c.onchange = () => { g.milestones[+c.dataset.mdone].done = c.checked; save('goal'); render(); }));
  body.querySelectorAll('[data-mdel]').forEach((b) => (b.onclick = () => { g.milestones.splice(+b.dataset.mdel, 1); save('goal'); render(); }));
  $('#madd').onclick = () => { const x = $('#mtext').value.trim(); if (!x) return; g.milestones.push({ text: x, date: $('#mdate').value, done: false }); g.milestones = g.milestones.slice(-12); save('goal'); render(); };
}

// ---------- 성적 ----------
const scoreNum = (s) => { const m = String(s).match(/^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/); if (!m) return null; return m[2] ? (+m[1] / +m[2]) * 100 : +m[1]; };
function gradeTrendSvg(grades) {
  const by = {};
  grades.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((g) => { const v = scoreNum(g.score); if (v !== null) (by[g.subject] = by[g.subject] || []).push(v); });
  const series = Object.entries(by).filter(([, v]) => v.length >= 2).slice(0, 6);
  if (!series.length) return '';
  const W = 320, Hh = 170, L = 34, Rr = 10, T = 12, B = 22;
  const maxV = Math.max(100, ...series.flatMap(([, v]) => v)), maxN = Math.max(...series.map(([, v]) => v.length));
  const x = (i) => L + (maxN === 1 ? 0 : (i / (maxN - 1)) * (W - L - Rr)), y = (v) => T + (1 - v / maxV) * (Hh - T - B);
  const grid = [0, 50, 100].map((v) => `<line x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 4}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="var(--sub)">${v}</text>`).join('');
  const lines = series.map(([name, v], k) => { const c = SCH_COLORS[k % SCH_COLORS.length]; return `<polyline fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" points="${v.map((s, i) => `${x(i)},${y(s)}`).join(' ')}"/>${v.map((s, i) => `<circle cx="${x(i)}" cy="${y(s)}" r="3" fill="${c}"><title>${esc(name)}: ${s.toFixed(0)}</title></circle>`).join('')}`; }).join('');
  const legend = series.map(([name], k) => `<span class="tag" style="border-left:8px solid ${SCH_COLORS[k % SCH_COLORS.length]}">${esc(name)}</span>`).join('');
  return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="grades" style="width:100%;max-width:420px;display:block">${grid}${lines}</svg><p>${legend}</p>`;
}
function gradesView(body) {
  const ro = state.ro;
  const list = state.grades.map((g, i) => ({ ...g, i })).sort((a, b) => b.date.localeCompare(a.date));
  body.innerHTML = `<div class="card"><h2>${t('gr_title')}</h2>${gradeTrendSvg(state.grades) || `<p class="sub">${t('gr_trend_hint')}</p>`}
      ${list.length ? `<div class="tscroll"><table class="wplan"><thead><tr><th>${t('gr_date')}</th><th>${t('gr_subject')}</th><th>${t('gr_score')}</th><th>${t('gr_note')}</th><th></th></tr></thead><tbody>
        ${list.map((g) => `<tr><td>${esc(g.date)}</td><td class="subj">${esc(g.subject)}</td><td>${esc(g.score)}</td><td class="detail">${esc(g.note)}</td><td>${ro ? '' : `<button data-gdel="${g.i}" aria-label="${t('btn_delete_item')}">✕</button>`}</td></tr>`).join('')}</tbody></table></div>` : `<p class="sub">${t('gr_empty')}</p>`}</div>
    ${ro ? '' : `<div class="card"><h2>${t('gr_add')}</h2>
      <div class="row"><input type="text" id="grs" maxlength="30" placeholder="${t('gr_subject')}"><input type="text" id="grv" maxlength="12" placeholder="${t('gr_score_ph')}" style="max-width:110px"></div>
      <div class="row"><input type="date" id="grd" value="${today()}" style="max-width:170px"><input type="text" id="grn" maxlength="60" placeholder="${t('gr_note')}"><button class="primary" id="gradd">${t('btn_add')}</button></div>
      <p class="sub" id="grmsg"></p><button id="grdl" ${state.grades.length ? '' : 'disabled'}>${t('csv_btn')}</button></div>
      <div class="card"><h2>${t('gr_csv_title')}</h2><p class="sub">${t('gr_csv_help')}</p><textarea id="grcsv" rows="4" placeholder="${t('gr_csv_ph')}"></textarea><button id="grimport">${t('gr_csv_btn')}</button> <span class="sub" id="grcsvmsg"></span></div>`}`;
  if (ro) return;
  body.querySelectorAll('[data-gdel]').forEach((b) => (b.onclick = () => { state.grades.splice(+b.dataset.gdel, 1); save('grades'); render(); }));
  $('#grdl').onclick = () => downloadCsv(`grades-${today()}.csv`, [[t('gr_date'), t('gr_subject'), t('gr_score'), t('gr_note')], ...state.grades.slice().sort((a, b) => a.date.localeCompare(b.date)).map((g) => [g.date, g.subject, g.score, g.note])]);
  $('#gradd').onclick = () => {
    const subject = $('#grs').value.trim(), score = $('#grv').value.trim();
    if (!subject || !score) { $('#grmsg').textContent = t('gr_need'); return; }
    state.grades.push({ subject, score, date: $('#grd').value || today(), note: $('#grn').value.trim() }); state.grades = state.grades.slice(-200); save('grades'); render();
  };
  $('#grimport').onclick = () => { // 줄마다 "과목,점수[,날짜[,메모]]"
    const rows = $('#grcsv').value.split('\n').map((l) => l.split(/[,\t]/).map((x) => x.trim())).filter((r) => r[0] && r[1]);
    rows.forEach(([subject, score, date, note]) => state.grades.push({ subject: subject.slice(0, 30), score: score.slice(0, 12), date: /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : today(), note: (note || '').slice(0, 60) }));
    state.grades = state.grades.slice(-200);
    if (rows.length) { save('grades'); state.notice = t('gr_csv_done', { n: rows.length }); render(); } else $('#grcsvmsg').textContent = t('gr_csv_none');
  };
  if (state.notice) { $('#grcsvmsg').textContent = state.notice; state.notice = null; }
}
