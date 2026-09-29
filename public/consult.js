// 컨설팅 운영 기능: 상담 문진, 성인·대학생 커리어(지원 현황), 반·출결, 데이터 현황
const ATT_KEYS = ['p', 'l', 'a', 'e'];
const attLabel = (k) => t('att_' + k);
function attStats(att, days = 30) {
  const from = new Date(); from.setDate(from.getDate() - (days - 1));
  const vals = Object.entries(att || {}).filter(([k]) => k >= dk(from) && k <= today()).map(([, v]) => v);
  const c = (k) => vals.filter((v) => v === k).length;
  return { n: vals.length, p: c('p'), l: c('l'), a: c('a'), e: c('e'), rate: vals.length ? Math.round((100 * (c('p') + c('l'))) / vals.length) : null };
}
const daysUntil = (d) => Math.round((new Date(d) - new Date(today())) / 86400000);

// 다음 상담일 안내 카드 (학생 홈)
function nextSessionCard() {
  const d = state.profile?.nextSession;
  if (!d || d < today()) return '';
  const n = daysUntil(d);
  return `<div class="card callout"><h2>📅 ${t('ns_title')}</h2><p><b>${esc(d)}</b> · ${n === 0 ? t('ns_today') : t('ns_in', { n })}</p></div>`;
}

// ---------- 초기 상담 문진 ----------
const INTAKE_FIELDS = ['concern', 'goal', 'strengths', 'interests', 'habits', 'background'];
function intakeCard(el) {
  el.innerHTML = `<div class="card"><p class="sub">${t('intake_help')}</p>
    ${INTAKE_FIELDS.map((k) => `<label class="sub">${t('intake_' + k)}<textarea data-in="${k}" rows="2" maxlength="600">${esc(state.intake[k] || '')}</textarea></label>`).join('')}
    <span class="sub" id="inmsg"></span></div>`;
  el.querySelectorAll('[data-in]').forEach((x) => (x.onchange = () => { state.intake = { ...state.intake, [x.dataset.in]: x.value.trim() }; save('intake'); $('#inmsg').textContent = t('saved'); }));
}

// ---------- 성인·대학생 커리어 ----------
const JOB_STATUS = ['interested', 'applied', 'interview', 'offer', 'rejected', 'closed'];
function careerView(el) {
  const c = state.career;
  el.innerHTML = `<div class="card"><h2>${t('cr_profile')}</h2><p class="sub">${t('cr_help')}</p>
      <div class="row"><input type="text" id="crjob" maxlength="60" placeholder="${t('cr_job')}" value="${esc(c.job)}"><input type="text" id="crind" maxlength="60" placeholder="${t('cr_industry')}" value="${esc(c.industry)}"><input type="number" id="cryears" min="0" max="60" placeholder="${t('cr_years')}" value="${c.years || ''}" style="max-width:110px"></div>
      <div class="row"><input type="text" id="crtarget" maxlength="80" placeholder="${t('cr_target')}" value="${esc(c.target)}"><input type="text" id="crtind" maxlength="60" placeholder="${t('cr_tindustry')}" value="${esc(c.targetIndustry)}"></div>
      <input type="text" id="crskills" placeholder="${t('cr_skills')}" value="${esc((c.skills || []).join(', '))}">
      <textarea id="crmotive" rows="2" maxlength="500" placeholder="${t('cr_motive')}">${esc(c.motive)}</textarea>
      <textarea id="crcons" rows="2" maxlength="400" placeholder="${t('cr_constraints')}">${esc(c.constraints)}</textarea><span class="sub" id="crmsg"></span></div>
    <div class="card"><h2>${t('jb_title')}</h2><p class="sub">${t('jb_help')}</p>
      ${state.jobs.length ? `<div class="tscroll"><table class="wplan"><tbody>${state.jobs.map((j, i) => `<tr><td class="subj">${esc(j.company)}<br><span class="sub">${esc(j.role)}</span></td>
        <td><select data-js="${i}">${JOB_STATUS.map((s) => `<option value="${s}" ${j.status === s ? 'selected' : ''}>${t('jb_' + s)}</option>`).join('')}</select></td><td class="detail">${esc(j.date)} ${esc(j.note)}</td><td><button data-jd="${i}" aria-label="${t('btn_delete_item')}">✕</button></td></tr>`).join('')}</tbody></table></div>` : `<p class="sub">${t('jb_empty')}</p>`}
      <div class="row"><input type="text" id="jbco" maxlength="60" placeholder="${t('jb_company')}"><input type="text" id="jbrole" maxlength="60" placeholder="${t('jb_role')}"></div>
      <div class="row"><input type="date" id="jbdate" value="${today()}" style="max-width:170px"><input type="text" id="jbnote" maxlength="200" placeholder="${t('jb_note')}"><button class="primary" id="jbadd">${t('btn_add')}</button></div></div>`;
  const upd = () => {
    state.career = { job: $('#crjob').value.trim(), industry: $('#crind').value.trim(), years: Math.max(0, Math.min(60, parseInt($('#cryears').value, 10) || 0)), target: $('#crtarget').value.trim(), targetIndustry: $('#crtind').value.trim(),
      skills: $('#crskills').value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12), motive: $('#crmotive').value.trim(), constraints: $('#crcons').value.trim() };
    save('career'); $('#crmsg').textContent = t('saved');
  };
  ['#crjob', '#crind', '#cryears', '#crtarget', '#crtind', '#crskills', '#crmotive', '#crcons'].forEach((s) => ($(s).onchange = upd));
  $('#jbadd').onclick = () => {
    const company = $('#jbco').value.trim(); if (!company) return;
    state.jobs = [...state.jobs, { company, role: $('#jbrole').value.trim(), status: 'interested', date: $('#jbdate').value, note: $('#jbnote').value.trim() }]; save('jobs'); render();
  };
  el.querySelectorAll('[data-js]').forEach((s) => (s.onchange = () => { state.jobs[+s.dataset.js].status = s.value; save('jobs'); render(); }));
  el.querySelectorAll('[data-jd]').forEach((b) => (b.onclick = () => { state.jobs.splice(+b.dataset.jd, 1); save('jobs'); render(); }));
}
function renderCareer(app) {
  app.innerHTML = '<div id="careerbox"></div>'; careerView($('#careerbox'));
}

// ---------- 출결 (학생 입력 화면 안: 요약 + 하루 기록) ----------
function attendanceView(el) {
  const st = attStats(state.attendance, 30), recent = Object.entries(state.attendance).sort().reverse().slice(0, 14);
  el.innerHTML = `<div class="card"><p class="sub">${t('att_help')}</p>
    ${st.n ? `<div class="statgrid"><div><b>${st.rate}%</b><span>${t('att_rate30')}</span></div>${ATT_KEYS.map((k) => `<div><b>${st[k]}</b><span>${attLabel(k)}</span></div>`).join('')}</div>` : `<p class="sub">${t('att_none')}</p>`}
    ${state.ro ? '' : `<div class="row"><input type="date" id="atdate" value="${today()}" style="max-width:170px"><select id="atst">${ATT_KEYS.map((k) => `<option value="${k}">${attLabel(k)}</option>`).join('')}</select><button class="primary" id="atsave">${t('btn_save')}</button><span class="sub" id="atmsg"></span></div>`}
    ${recent.map(([d, v]) => `<span class="tag ${v === 'a' ? 'weak' : v === 'p' ? 'strong' : ''}">${esc(d.slice(5))} ${attLabel(v)}</span>`).join('')}</div>`;
  if ($('#atsave')) $('#atsave').onclick = async () => {
    const date = $('#atdate').value, st2 = $('#atst').value; if (!date) return;
    try { await api('/api/attendance', { method: 'POST', body: { date, marks: { [state.viewAs.id]: st2 } } }); state.attendance = { ...state.attendance, [date]: st2 }; roster.loaded = false; render(); } catch (e) { $('#atmsg').textContent = e.message; }
  };
}

// ---------- 반·출결 (강사 콘솔) ----------
const cls = { name: null, date: '', marks: {}, msg: '' };
function renderClasses(app) {
  if (!roster.loaded && !roster.loading) loadRoster();
  if (!cls.date) cls.date = today();
  const active = roster.learners.filter((l) => l.enroll !== 'left');
  const names = [...new Set(active.map((l) => l.className || ''))].sort((a, b) => (a || '￿').localeCompare(b || '￿'));
  if (cls.name === null && names.length) cls.name = names[0];
  const list = active.filter((l) => (l.className || '') === (cls.name || ''));
  const label = (n) => n || t('cls_none');
  const summary = names.map((n) => { const m = active.filter((l) => (l.className || '') === n), rates = m.filter((l) => l.attRate !== null).map((l) => l.attRate); return `<tr><td class="subj">${esc(label(n))}</td><td>${m.length}</td><td>${rates.length ? Math.round(sum(rates) / rates.length) + '%' : '-'}</td><td>${m.filter((l) => l.att[cls.date]).length}/${m.length}</td></tr>`; }).join('');
  const cur = (l) => cls.marks[l.id] ?? l.att[cls.date] ?? '';
  app.innerHTML = `<div class="card"><h2>${t('cls_title')}</h2><p class="sub">${t('cls_help')}</p>
      ${names.length ? `<div class="row"><select id="clsname">${names.map((n) => `<option value="${esc(n)}" ${n === cls.name ? 'selected' : ''}>${esc(label(n))}</option>`).join('')}</select><input type="date" id="clsdate" value="${esc(cls.date)}" style="max-width:170px"><button id="clsall">${t('cls_all_present')}</button></div>`
        : `<p class="sub">${roster.loading ? t('loading') : t('cls_empty')}</p>`}
      ${list.length ? `<div class="tscroll"><table class="wplan"><thead><tr><th>${t('roster_name')}</th><th>${t('att_rate30')}</th><th>${t('cls_today')}</th></tr></thead><tbody>${list.map((l) => `<tr><td class="subj">${esc(l.name)}${l.enroll === 'paused' ? ` <span class="tag">${t('en_paused')}</span>` : ''}</td><td>${l.attRate === null ? '-' : l.attRate + '%'}</td>
        <td>${ATT_KEYS.map((k) => `<button data-mk="${esc(l.id)}:${k}" class="${cur(l) === k ? 'primary' : ''}">${attLabel(k)}</button>`).join(' ')}</td></tr>`).join('')}</tbody></table></div>
        <div class="row"><button class="primary" id="clssave">${t('btn_save')}</button><span class="sub" id="clsmsg">${esc(cls.msg)}</span></div>` : ''}</div>
    ${names.length ? `<div class="card"><h2>${t('cls_overview')}</h2><table class="wplan"><thead><tr><th>${t('cls_name')}</th><th>${t('cls_n')}</th><th>${t('att_rate30')}</th><th>${t('cls_today')}</th></tr></thead><tbody>${summary}</tbody></table></div>` : ''}`;
  if ($('#clsname')) $('#clsname').onchange = (e) => { cls.name = e.target.value; cls.marks = {}; cls.msg = ''; render(); };
  if ($('#clsdate')) $('#clsdate').onchange = (e) => { cls.date = e.target.value || today(); cls.marks = {}; cls.msg = ''; render(); };
  if ($('#clsall')) $('#clsall').onclick = () => { list.forEach((l) => (cls.marks[l.id] = 'p')); render(); };
  app.querySelectorAll('[data-mk]').forEach((b) => (b.onclick = () => { const [id, k] = b.dataset.mk.split(':'); cls.marks[id] = cls.marks[id] === k ? '' : k; render(); }));
  if ($('#clssave')) $('#clssave').onclick = async () => {
    const marks = Object.fromEntries(list.filter((l) => cls.marks[l.id] !== undefined).map((l) => [l.id, cls.marks[l.id]]));
    if (!Object.keys(marks).length) { cls.msg = t('cls_nochange'); render(); return; }
    try { const r = await api('/api/attendance', { method: 'POST', body: { date: cls.date, marks } }); cls.msg = t('cls_saved', { n: r.saved }); cls.marks = {}; roster.loaded = false; } catch (e) { cls.msg = e.message; }
    render();
  };
}

// ---------- 데이터 현황 ----------
const an = { data: null, loading: false, err: '' };
async function loadAnalytics() {
  an.loading = true;
  try { an.data = await api('/api/analytics'); an.err = ''; } catch (e) { an.err = e.message; }
  an.loading = false; if (state.tab === 'data') render();
}
function renderAnalytics(app) {
  if (!an.data && !an.loading) loadAnalytics();
  const d = an.data;
  if (!d) { app.innerHTML = `<div class="card"><p class="sub">${an.err || t('loading')}</p></div>`; return; }
  const goal = d.complete, step = goal >= 100 ? 3 : goal >= 30 ? 2 : goal >= 10 ? 1 : 0, next = [10, 30, 100, 100][step];
  const tid = Object.keys(d.tests);
  app.innerHTML = `<div class="card"><h2>${t('an_title')}</h2><p class="sub">${t('an_help')}</p>
      <div class="tiles"><div class="tile"><b>${d.n}</b><span class="sub">${t('an_students')}</span></div><div class="tile"><b>${d.complete}</b><span class="sub">${t('an_complete')}</span></div><div class="tile"><b>${d.activeWeek}</b><span class="sub">${t('an_active')}</span></div></div></div>
    <div class="card callout"><h2>🎯 ${t('an_goal_title')}</h2><div class="bar"><i style="width:${Math.min(100, (goal / next) * 100)}%"></i></div>
      <p><b>${t('an_goal_now', { a: goal, b: next })}</b></p><ul><li>${t('an_lv1')}${step >= 1 ? ' ✅' : ''}</li><li>${t('an_lv2')}${step >= 2 ? ' ✅' : ''}</li><li>${t('an_lv3')}${step >= 3 ? ' ✅' : ''}</li></ul><p class="sub">${t('an_caveat')}</p></div>
    <div class="card"><h2>${t('an_tests')}</h2><div class="tscroll"><table class="wplan"><thead><tr><th>${t('an_test')}</th><th>n</th><th>${t('an_avg')}</th><th>${t('an_retake')}</th><th>${t('an_invalid')}</th></tr></thead><tbody>${tid.map((id) => `<tr><td class="subj">${esc(tx(id).name)}</td><td>${d.tests[id].n}</td><td>${d.tests[id].avg ?? '-'}</td><td>${d.tests[id].retake}</td><td>${d.tests[id].invalid}</td></tr>`).join('')}</tbody></table></div></div>
    ${feedbackCard()}<div class="card"><h2>${t('an_records')}</h2><ul><li>${t('an_r_goal', { n: d.withGoal })}</li><li>${t('an_r_grades', { n: d.withGrades })}</li><li>${t('an_r_sessions', { n: d.withSessions, s: d.sessions })}</li><li>${t('an_r_diag', { n: d.withDiag })}</li><li>${t('an_r_retest', { n: d.retest })}</li><li>${t('an_r_att', { n: d.attMarks })}</li><li>${t('an_r_research', { n: d.research })}</li></ul>
      <p class="sub">${t('an_groups')}: ${Object.entries(d.groups).map(([k, v]) => `${k === '-' ? '-' : groupLabel(k)} ${v}`).join(' · ')}</p>
      <div class="row"><button id="anreload">${t('btn_reload')}</button>${roleOf() === 'admin' ? `<button id="anexport">${t('an_export')}</button>` : ''}<span class="sub" id="anmsg"></span></div><p class="sub">${t('an_export_note')}</p></div>`;
  bindFeedbackCard();
  $('#anreload').onclick = () => { an.data = null; render(); };
  if ($('#anexport')) $('#anexport').onclick = async () => {
    try {
      const { rows } = await api('/api/analytics/export');
      const ids = Object.keys(d.tests), head = ['id', 'group', 'orgType', 'sessions', 'checkins', 'gradeCount'];
      const catKeys = (id) => Object.keys(d.tests[id].cats);
      ids.forEach((id) => { head.push(id + '_date', id + '_overall', id + '_invalid', ...catKeys(id).map((k) => `${id}_${k}`)); });
      downloadCsv(`research-${today()}.csv`, [head, ...rows.map((r) => [r.id, r.group, r.orgType, r.sessions, r.checkins, r.gradeCount, ...ids.flatMap((id) => { const x = r[id]; return x ? [x.date, x.overall, x.invalid ? 1 : 0, ...catKeys(id).map((k) => x.cat[k])] : ['', '', '', ...catKeys(id).map(() => '')]; })])]);
      $('#anmsg').textContent = t('an_exported', { n: rows.length });
    } catch (e) { $('#anmsg').textContent = e.message; }
  };
}

// ---------- 스터디카페: 입·퇴실 ----------
const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const minsOf = (a, b) => (+b.slice(0, 2) * 60 + +b.slice(3)) - (+a.slice(0, 2) * 60 + +a.slice(3));
const openVisit = () => state.visits.findLast((v) => !v.out);
const passLeft = (end) => (end ? daysUntil(end) : null);

// 학생 홈: 입실/퇴실 (스터디카페 이용자 또는 이미 기록이 있는 학생)
function visitCard() {
  if (state.viewAs || !(state.profile?.orgType === 'studycafe' || state.visits.length)) return '';
  const o = openVisit(), left = passLeft(state.profile.passEnd);
  return `<div class="card"><h2>☕ ${t('cafe_title')}</h2>
    ${o ? `<p><span class="pill ok">${t('cafe_in_now')}</span> ${t('cafe_since', { time: esc(o.in) })}</p><button class="primary" id="vout">${t('cafe_out')}</button>` : `<button class="primary" id="vin">${t('cafe_in')}</button>`}
    ${state.profile.seat ? `<p class="sub">${t('cafe_seat')}: <b>${esc(state.profile.seat)}</b></p>` : ''}
    ${left !== null ? `<p class="sub">${esc(state.profile.passType || t('cafe_pass'))} · ${left < 0 ? t('cafe_pass_expired') : t('cafe_pass_left', { n: left })}</p>` : ''}</div>`;
}
document.addEventListener('click', (e) => { // 홈 화면의 입·퇴실 버튼
  const id = e.target?.id;
  if (id !== 'vin' && id !== 'vout') return;
  if (id === 'vin') state.visits = [...state.visits, { date: today(), in: hhmm(), out: '' }];
  else {
    const o = openVisit(); if (!o) return;
    o.out = hhmm(); const m = o.date === today() ? minsOf(o.in, o.out) : 0;
    if (m > 0) { state.log[o.date] = Math.min(1440, (state.log[o.date] || 0) + m); save('log'); }
  }
  save('visits'); render();
});

// 강사 콘솔: 입·퇴실 (카운터에서 학생 이름 옆 버튼을 누른다)
const cafe = { q: '', onlyIn: false, msg: '' };
function renderCafe(app) {
  if (!roster.loaded && !roster.loading) loadRoster();
  const active = roster.learners.filter((l) => l.enroll !== 'left'), q = cafe.q.trim().toLowerCase();
  const list = active.filter((l) => (!q || l.name.toLowerCase().includes(q) || (l.seat || '').toLowerCase().includes(q)) && (!cafe.onlyIn || l.inNow));
  const inN = active.filter((l) => l.inNow).length, soon = active.filter((l) => l.passEnd && passLeft(l.passEnd) <= 7).length, totalMin = sum(active.map((l) => l.todayMin));
  app.innerHTML = `<div class="card"><h2>${t('cafe_console')}</h2><p class="sub">${t('cafe_help')}</p>
      <div class="tiles"><div class="tile"><b>${inN}</b><span class="sub">${t('cafe_in_now')}</span></div><div class="tile"><b>${Math.round(totalMin / 60 * 10) / 10}h</b><span class="sub">${t('cafe_today_total')}</span></div><div class="tile"><b>${soon}</b><span class="sub">${t('cafe_pass_soon')}</span></div></div>
      <div class="row"><input type="text" id="cfq" placeholder="${t('cafe_search')}" value="${esc(cafe.q)}"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="cfin" ${cafe.onlyIn ? 'checked' : ''} style="flex:none;width:20px"> <span class="sub">${t('cafe_only_in')}</span></label></div>
      <span class="sub" id="cfmsg">${esc(cafe.msg)}</span></div>
    ${list.length ? `<div class="card"><div class="tscroll"><table class="wplan"><thead><tr><th>${t('roster_name')}</th><th>${t('cafe_seat')}</th><th>${t('cafe_today')}</th><th>${t('cafe_pass')}</th><th></th></tr></thead><tbody>${list.map((l) => { const left = l.passEnd ? passLeft(l.passEnd) : null; return `<tr><td class="subj">${esc(l.name)}${l.inNow ? ` <span class="pill ok">${t('cafe_in_now')}</span>` : ''}</td><td>${esc(l.seat || '-')}</td><td>${unit('unit_min', l.todayMin)}</td>
      <td class="detail">${left === null ? '-' : `${esc(l.passType || '')} ${left < 0 ? `<span class="tag weak">${t('cafe_pass_expired')}</span>` : left <= 7 ? `<span class="tag weak">${t('cafe_pass_left', { n: left })}</span>` : esc(l.passEnd)}`}</td>
      <td><button class="${l.inNow ? '' : 'primary'}" data-cf="${esc(l.id)}:${l.inNow ? 'out' : 'in'}">${l.inNow ? t('cafe_out') : t('cafe_in')}</button></td></tr>`; }).join('')}</tbody></table></div></div>` : `<div class="card"><p class="sub">${roster.loading ? t('loading') : t('cafe_empty')}</p></div>`}`;
  $('#cfq').oninput = (e) => { cafe.q = e.target.value; const pos = e.target.selectionStart; render(); const el = $('#cfq'); el.focus(); el.setSelectionRange(pos, pos); };
  $('#cfin').onchange = (e) => { cafe.onlyIn = e.target.checked; render(); };
  app.querySelectorAll('[data-cf]').forEach((b) => (b.onclick = async () => {
    const [id, st] = b.dataset.cf.split(':'); b.disabled = true;
    try { await api('/api/visits', { method: 'POST', body: { date: today(), time: hhmm(), marks: { [id]: st } } }); cafe.msg = ''; } catch (e) { cafe.msg = e.message; }
    roster.loaded = false; render();
  }));
}
