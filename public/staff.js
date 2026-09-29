// 강사·관리자 콘솔(학생 목록·등록·강사 관리)과 보호자 대시보드, 학생 열어보기
const newProfile = (name) => ({ name, group: 'adult', services: { study: true, career: true }, school: '', note: '', teacherNote: '' });

async function openStudent(id) {
  await flush(); dirty.clear();
  try {
    const r = await api('/api/students/' + id);
    loadData(r.data);
    state.viewAs = { id, name: r.user.name, teacher: r.teacher, managed: r.user.managed, shareCode: r.user.shareCode };
    state.ro = !r.canWrite;
    if (!state.profile) state.profile = newProfile(r.user.name);
    state.profile.services = state.profile.services || { study: true, career: true };
    state.tab = state.ro ? 'report' : 'home'; state.sub = { plan: 'schedule', report: state.ro ? 'parent' : 'comp' }; tv = freshTv();
    render(); scrollTo(0, 0);
  } catch (e) { state.notice = e.message; render(); }
}
async function closeStudent() {
  await flush(); dirty.clear();
  state.viewAs = null; state.ro = false; loadData({}); tv = freshTv();
  state.tab = roleOf() === 'guardian' ? 'dash' : 'roster';
  roster.loaded = false; gdash.loaded = false; render(); scrollTo(0, 0);
}

const flagReasons = (l) => [l.flags.idle && t('flag_idle'), l.flags.validity && t('flag_validity'), l.flags.wellbeing && t('flag_wellbeing'), l.flags.ddaySoon && t('flag_dday', { n: l.goal.dday })].filter(Boolean);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const ddayCell = (l) => (l.goal.dday === null ? '' : ` <span class="tag">${ddayText(l.goal.dday)}</span>`);

// ---------- 학생 목록 (강사/관리자) ----------
const roster = { learners: [], teachers: [], loaded: false, loading: false, q: '', teacher: '', watch: false, sel: new Set(), err: '', summary: '', msg: '' };
async function loadRoster() {
  roster.loading = true;
  try { const r = await api('/api/dashboard?today=' + today()); roster.learners = r.learners; roster.teachers = r.teachers || []; roster.err = ''; } catch (e) { roster.err = e.message; }
  roster.loading = false; roster.loaded = true;
  if (state.tab === 'roster' && !state.viewAs) render();
}
function weeklySummary(list) {
  const n = list.length, w = list.filter((l) => l.status === 'watch');
  const avgMin = n ? Math.round(sum(list.map((l) => sum(l.week))) / n) : 0, avgCi = n ? (sum(list.map((l) => l.checkinsWeek)) / n).toFixed(1) : '0';
  return [t('ws_head', { date: today(), n, ok: n - w.length, w: w.length }), t('ws_avg', { min: avgMin, ci: avgCi }), w.length ? t('ws_watch', { names: w.map((l) => l.name).join(', ') }) : ''].filter(Boolean).join('\n');
}
function renderRoster(app) {
  if (!roster.loaded && !roster.loading) loadRoster();
  const admin = roleOf() === 'admin', q = roster.q.trim().toLowerCase();
  const list = roster.learners.filter((l) => (!q || l.name.toLowerCase().includes(q)) && (!roster.teacher || (roster.teacher === '_none' ? !l.teacher : l.teacher?.id === roster.teacher)) && (!roster.watch || l.status === 'watch'));
  const watchN = roster.learners.filter((l) => l.status === 'watch').length;
  app.innerHTML = `<div class="card"><h2>${t('roster_title')} <span class="sub">${roster.learners.length}</span></h2>
      <div class="row"><input type="text" id="rq" placeholder="${t('roster_search')}" value="${esc(roster.q)}">
        ${admin ? `<select id="rt" style="max-width:170px"><option value="">${t('roster_all_teachers')}</option><option value="_none" ${roster.teacher === '_none' ? 'selected' : ''}>${t('unassigned')}</option>${roster.teachers.map((x) => `<option value="${esc(x.id)}" ${roster.teacher === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}</div>
      <label class="row"><input type="checkbox" id="rw" ${roster.watch ? 'checked' : ''} style="flex:none;width:20px"> <span>${t('roster_watch_only')} <span class="sub">(${watchN})</span></span></label>
      <div class="row"><input type="text" id="lcode" maxlength="8" placeholder="${t('code_ph')}" style="max-width:220px"><button id="lbtn">${t('btn_link')}</button><span class="sub" id="lmsg">${esc(roster.msg)}</span></div>
      <div class="row"><button id="wsum">${t('ws_btn')}</button><button id="rreload">${t('btn_reload')}</button></div>
      ${roster.summary ? `<textarea id="wstext" rows="4" readonly>${esc(roster.summary)}</textarea><p class="sub" id="wscopy"></p>` : ''}
      ${roster.err ? `<p class="sub">${esc(roster.err)}</p>` : ''}</div>
    ${roster.loading && !roster.learners.length ? `<p class="sub">${t('loading')}</p>` : list.length ? `<div class="card"><div class="tscroll"><table class="wplan roster"><thead><tr><th></th><th>${t('roster_name')}</th><th>${t('roster_goal')}</th><th>${t('stat_streak')}</th><th>${t('last7')}</th><th>${t('roster_tasks')}</th><th>${t('rep_checkin_lbl')}</th><th>${t('roster_status')}</th>${admin ? `<th>${t('teacher_lbl')}</th>` : ''}<th></th></tr></thead><tbody>
      ${list.map((l) => `<tr><td><input type="checkbox" data-sel="${esc(l.id)}" ${roster.sel.has(l.id) ? 'checked' : ''}></td>
        <td class="subj">${esc(l.name)}${l.managed ? ` <span class="tag">${t('managed')}</span>` : ''}<br><span class="sub">${l.group ? esc(groupLabel(l.group)) : ''}</span>${flagReasons(l).length ? `<br><span class="sub">${flagReasons(l).map(esc).join(' · ')}</span>` : ''}</td>
        <td class="detail">${esc(l.goal.label)}${ddayCell(l)}</td><td>${unit('unit_day', l.streak)}</td><td>${unit('unit_min', sum(l.week))}</td><td>${l.doneCount}/${l.doneCount + l.openCount}</td><td>${l.checkinsWeek}</td>
        <td><span class="pill ${l.status}">${t('st_' + l.status)}</span></td>${admin ? `<td>${l.teacher ? esc(l.teacher.name) : `<span class="sub">${t('unassigned')}</span>`}</td>` : ''}
        <td><button class="primary" data-open="${esc(l.id)}">${t('btn_open')}</button></td></tr>`).join('')}</tbody></table></div></div>` : `<div class="card"><p class="sub">${roster.learners.length ? t('roster_none_match') : t('roster_empty')}</p></div>`}`;
  $('#rq').oninput = (e) => { roster.q = e.target.value; const pos = e.target.selectionStart; render(); const el = $('#rq'); el.focus(); el.setSelectionRange(pos, pos); };
  if ($('#rt')) $('#rt').onchange = (e) => { roster.teacher = e.target.value; render(); };
  $('#rw').onchange = (e) => { roster.watch = e.target.checked; render(); };
  $('#rreload').onclick = () => { roster.loaded = false; render(); };
  $('#lbtn').onclick = async () => { try { const r = await api('/api/link', { method: 'POST', body: { code: $('#lcode').value } }); roster.msg = t('linked_ok', { name: r.name }); roster.loaded = false; } catch (e) { roster.msg = e.message; } render(); };
  $('#wsum').onclick = async () => {
    const pick = roster.sel.size ? list.filter((l) => roster.sel.has(l.id)) : list;
    roster.summary = weeklySummary(pick); render();
    try { await navigator.clipboard.writeText(roster.summary); $('#wscopy').textContent = t('ws_copied'); } catch { const el = $('#wstext'); if (el) { el.focus(); el.select(); } $('#wscopy').textContent = t('ws_copy_manual'); }
  };
  app.querySelectorAll('[data-sel]').forEach((c) => (c.onchange = () => { c.checked ? roster.sel.add(c.dataset.sel) : roster.sel.delete(c.dataset.sel); }));
  app.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => openStudent(b.dataset.open)));
}

// ---------- 학생 등록 ----------
let reg = { result: null, msg: '' };
function renderRegister(app) {
  const admin = roleOf() === 'admin';
  if (admin && !roster.loaded && !roster.loading) loadRoster();
  app.innerHTML = `<div class="card"><h2>${t('reg_title')}</h2><p class="sub">${t('reg_desc')}</p>
      <input type="text" id="rname" maxlength="20" placeholder="${t('reg_name')}">
      <div class="row"><select id="rgroup">${Object.keys(GROUPS).map((k) => `<option value="${k}" ${k === 'high' ? 'selected' : ''}>${groupLabel(k)}</option>`).join('')}</select></div>
      <div class="row"><input type="text" id="rschool" maxlength="40" placeholder="${t('reg_school')}"></div>
      <div class="row"><select id="rgtype">${GOAL_TYPES.map((k) => `<option value="${k}">${t('gt_' + k)}</option>`).join('')}</select><input type="text" id="rglabel" maxlength="60" placeholder="${t('goal_label_ph')}"></div>
      <div class="row"><span class="sub">${t('goal_date')}</span><input type="date" id="rgdate" style="max-width:170px"></div>
      <label class="row"><input type="checkbox" id="rs1" checked style="flex:none;width:20px"> <span>${t('svc_study')}</span></label>
      <label class="row"><input type="checkbox" id="rs2" checked style="flex:none;width:20px"> <span>${t('svc_career')}</span></label>
      ${admin ? `<div class="row"><select id="rteacher"><option value="">${t('unassigned')}</option>${roster.teachers.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></div>` : ''}
      <textarea id="rnote" rows="2" maxlength="200" placeholder="${t('reg_note')}"></textarea>
      <p class="sub">${t('reg_consent_note')}</p>
      <button class="primary" id="rsubmit">${t('reg_btn')}</button> <span class="sub" id="rmsg">${esc(reg.msg)}</span></div>
    ${reg.result ? `<div class="card callout"><h2>✅ ${t('reg_done', { name: esc(reg.result.name) })}</h2><p>${t('reg_code')}: <b style="font-size:1.3em;letter-spacing:2px">${esc(reg.result.shareCode)}</b></p><p class="sub">${t('reg_code_help')}</p><button class="primary" id="ropen">${t('btn_open')}</button></div>` : ''}`;
  $('#rsubmit').onclick = async () => {
    const name = $('#rname').value.trim(); if (!name) { $('#rmsg').textContent = t('reg_need_name'); return; }
    $('#rsubmit').disabled = true;
    try {
      const r = await api('/api/students', { method: 'POST', body: { name, group: $('#rgroup').value, school: $('#rschool').value, note: $('#rnote').value, goalType: $('#rgtype').value, goalLabel: $('#rglabel').value, goalDate: $('#rgdate').value, services: { study: $('#rs1').checked, career: $('#rs2').checked }, teacherId: $('#rteacher')?.value || '' } });
      reg = { result: { id: r.id, name, shareCode: r.shareCode }, msg: '' }; roster.loaded = false; render();
    } catch (e) { $('#rmsg').textContent = e.message; $('#rsubmit').disabled = false; }
  };
  if ($('#ropen')) $('#ropen').onclick = () => openStudent(reg.result.id);
}

// ---------- 강사 관리 (관리자) ----------
const stf = { list: [], loaded: false, loading: false, edit: null, msg: '', del: null };
const afind = { q: '', list: null, msg: '' };
async function loadStaff() {
  stf.loading = true;
  try { stf.list = (await api('/api/staff')).staff; stf.msg = ''; } catch (e) { stf.msg = e.message; }
  stf.loading = false; stf.loaded = true; if (state.tab === 'staff') render();
}
function renderStaffMgmt(app) {
  if (!stf.loaded && !stf.loading) loadStaff();
  const e = stf.edit; // null | 'new' | staff object
  app.innerHTML = `<div class="card"><h2>${t('staff_title')}</h2><p class="sub">${t('staff_desc')}</p>
      ${stf.list.map((s) => `<div class="task"><span><b>${esc(s.name)}</b> <span class="tag">${t('role_' + s.role)}</span><br><span class="sub">${esc(s.email)}${s.students !== null ? ` · ${t('staff_students', { n: s.students })}` : ''}</span></span>
        ${stf.del === s.id ? `<button data-delok="${esc(s.id)}" style="color:#d33">${t('staff_del_confirm')}</button><button data-delno>${t('btn_cancel')}</button>` : `<button data-edit="${esc(s.id)}">${t('btn_edit')}</button><button data-del="${esc(s.id)}" style="color:#d33">${t('btn_delete_item')}</button>`}</div>`).join('') || `<p class="sub">${t('loading')}</p>`}
      <button class="primary" id="snew">${t('staff_add')}</button> <span class="sub">${esc(stf.msg)}</span></div>
    ${e ? `<div class="card"><h2>${e === 'new' ? t('staff_add') : t('btn_edit')}</h2>
      <input type="text" id="sfname" maxlength="20" placeholder="${t('name_ph')}" value="${e === 'new' ? '' : esc(e.name)}">
      ${e === 'new' ? `<div class="row"><input type="text" id="sfemail" placeholder="${t('email_ph')}"></div>` : `<p class="sub">${esc(e.email)}</p>`}
      <div class="row"><input type="password" id="sfpw" placeholder="${e === 'new' ? t('pw_new_ph') : t('staff_pw_reset')}" autocomplete="new-password"></div>
      <div class="row"><select id="sfrole"><option value="teacher" ${e !== 'new' && e.role === 'teacher' ? 'selected' : ''}>${t('role_teacher')}</option><option value="admin" ${e !== 'new' && e.role === 'admin' ? 'selected' : ''}>${t('role_admin')}</option></select></div>
      <button class="primary" id="sfsave">${t('btn_save')}</button> <button id="sfcancel">${t('btn_cancel')}</button></div>` : ''}
    <div class="card"><h2>${t('acct_find_title')}</h2>
      <div class="row"><input type="text" id="afq" maxlength="40" placeholder="${t('acct_find_ph')}" value="${esc(afind.q)}"><button id="afgo">${t('acct_find_btn')}</button></div>
      ${afind.list === null ? '' : afind.list.length ? afind.list.map((x) => `<div class="task"><span><b>${esc(x.name)}</b> <span class="tag">${t('role_' + x.role)}</span><br><span class="sub">${esc(x.email)}</span></span><button data-rc="${esc(x.id)}">${t('reset_issue')}</button></div>`).join('') : `<p class="sub">${t('acct_none')}</p>`}
      <p id="afmsg">${esc(afind.msg)}</p></div>`;
  $('#snew').onclick = () => { stf.edit = 'new'; render(); };
  $('#afgo').onclick = async () => { afind.q = $('#afq').value; afind.msg = ''; try { afind.list = (await api('/api/accounts?q=' + encodeURIComponent(afind.q))).accounts; } catch (er) { afind.list = null; afind.msg = er.message; } render(); };
  app.querySelectorAll('[data-rc]').forEach((b2) => (b2.onclick = async () => { try { const r = await api(`/api/users/${b2.dataset.rc}/reset-code`, { method: 'POST' }); afind.msg = t('reset_issued', { name: r.name, code: r.code }); } catch (er) { afind.msg = er.message; } render(); }));
  app.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => { stf.edit = stf.list.find((s) => s.id === b.dataset.edit); render(); }));
  app.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { stf.del = b.dataset.del; render(); }));
  app.querySelectorAll('[data-delno]').forEach((b) => (b.onclick = () => { stf.del = null; render(); }));
  app.querySelectorAll('[data-delok]').forEach((b) => (b.onclick = async () => { try { await api('/api/staff/' + b.dataset.delok, { method: 'DELETE' }); stf.msg = ''; } catch (er) { stf.msg = er.message; } stf.del = null; stf.loaded = false; render(); }));
  if (e) {
    $('#sfcancel').onclick = () => { stf.edit = null; render(); };
    $('#sfsave').onclick = async () => {
      try {
        if (e === 'new') await api('/api/staff', { method: 'POST', body: { name: $('#sfname').value, email: $('#sfemail').value, password: $('#sfpw').value, role: $('#sfrole').value } });
        else await api('/api/staff/' + e.id, { method: 'PUT', body: { name: $('#sfname').value, role: $('#sfrole').value, ...($('#sfpw').value ? { password: $('#sfpw').value } : {}) } });
        stf.edit = null; stf.msg = t('saved'); stf.loaded = false; render();
      } catch (er) { stf.msg = er.message; render(); }
    };
  }
}

// ---------- 보호자 대시보드 ----------
const gdash = { learners: [], loaded: false, loading: false, err: '', msg: '' };
async function loadGdash() {
  gdash.loading = true;
  try { gdash.learners = (await api('/api/dashboard?today=' + today())).learners; gdash.err = ''; } catch (e) { gdash.err = e.message; }
  gdash.loading = false; gdash.loaded = true; if (state.tab === 'dash' && !state.viewAs) render();
}
function renderDash(app) {
  if (!gdash.loaded && !gdash.loading) loadGdash();
  app.innerHTML = `<div class="card"><h2>${t('dash_link_title')}</h2><div class="row"><input type="text" id="code" maxlength="8" placeholder="${t('code_ph')}"><button class="primary" id="link">${t('btn_link')}</button></div><p class="sub" id="dmsg">${esc(gdash.msg)}</p></div>
    ${gdash.err ? `<p class="sub">${esc(gdash.err)}</p>` : ''}${gdash.loading && !gdash.learners.length ? `<p class="sub">${t('loading')}</p>` : ''}
    ${!gdash.loading && !gdash.learners.length && !gdash.err ? `<p class="sub">${t('dash_empty')}</p>` : ''}
    ${gdash.learners.map((l) => {
      const max = Math.max(60, ...l.week), days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return C().days[d.getDay()]; });
      const avg = l.quiz.length ? Math.round(l.quiz.reduce((a, q) => a + q.score / q.total, 0) / l.quiz.length * 100) : null;
      return `<div class="card"><h2>${esc(l.name)} <span class="sub">${l.group ? esc(groupLabel(l.group)) : ''}</span>${ddayCell(l)}</h2>
        <div class="stats"><div><b>${unit('unit_day', l.streak)}</b><span class="sub">${t('stat_streak')}</span></div><div><b>${unit('unit_min', l.today)}</b><span class="sub">${t('today_short')}</span></div><div><b>${unit('unit_min', sum(l.week))}</b><span class="sub">${t('last7')}</span></div></div>
        <div class="week" style="margin-top:12px">${l.week.map((m, i) => `<div><i style="height:${m / max * 80}px"></i>${days[i]}<br>${m}</div>`).join('')}</div>
        <p>${t('goals_line', { d: l.doneCount, o: l.openCount })}${l.goal.label ? ` · ${esc(l.goal.label)}` : ''}</p>${l.openTasks.length ? `<ul>${l.openTasks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <p>${t('riasec_line')} ${l.riasec.length ? l.riasec.map((ty) => `<span class="tag">${esc(R()[ty].name)}</span>`).join('') : `<span class="sub">${t('not_tested')}</span>`}</p>
        <p>${t('deep_title')}: ${Object.keys(l.deep || {}).length ? Object.entries(l.deep).map(([id, r]) => `<span class="tag">${esc(tx(id).name)} · ${esc(describeTest(id, r).headline)}</span>`).join('') : `<span class="sub">${t('deep_none')}</span>`}</p>
        <p>${t('quiz_avg')} ${avg === null ? `<span class="sub">${t('no_record')}</span>` : unit('score_pt', avg)}</p>
        <button class="primary" data-open="${esc(l.id)}">${t('btn_open_report')}</button> <button data-u="${esc(l.id)}">${t('btn_unlink')}</button></div>`;
    }).join('')}`;
  $('#link').onclick = async () => { try { const r = await api('/api/link', { method: 'POST', body: { code: $('#code').value } }); gdash.msg = t('linked_ok', { name: r.name }); gdash.loaded = false; } catch (e) { gdash.msg = e.message; } render(); };
  app.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => openStudent(b.dataset.open)));
  app.querySelectorAll('[data-u]').forEach((b) => (b.onclick = async () => { if (confirm(t('confirm_unlink'))) { await api('/api/unlink', { method: 'POST', body: { id: b.dataset.u } }); gdash.loaded = false; render(); } }));
}
