// 학생 정보·입력 (강사·관리자): 한 화면에서 기본 정보·목표·검사 결과·성적·시간표·주간계획·할 일·진단서를 모두 입력/수정
const ORG_TYPES = ['language', 'studyroom', 'consultant', 'studycafe'];
const inOpen = new Set(['basic']); // 펼쳐 둔 섹션(다시 그려도 유지)
const IN_SECTIONS = [['basic', 'in_s_basic'], ['intake', 'in_s_intake'], ['attend', 'in_s_attend'], ['career', 'in_s_career'], ['goal', 'in_s_goal'], ['tests', 'in_s_tests'], ['grades', 'in_s_grades'], ['sched', 'in_s_sched'], ['wp', 'in_s_wp'], ['tasks', 'in_s_tasks'], ['diag', 'in_s_diag']];
let inDel = false, inMsg = '';

const lines = (v) => String(v || '').split('\n').map((x) => x.trim()).filter(Boolean);
const splitPair = (line) => { const m = line.match(/^([^:：]+)[:：]\s*(.*)$/); return m ? [m[1].trim(), m[2].trim()] : [line, '']; };

function renderInput(app) {
  const v = state.viewAs;
  if (!v) { state.tab = 'roster'; return render(); }
  const sec = (id, title) => `<details class="fold" data-fold="${id}" id="fold_${id}" ${inOpen.has(id) ? 'open' : ''}><summary>${t(title)}</summary><div class="fold-body" id="in_${id}"></div></details>`;
  const secs = IN_SECTIONS.filter(([id]) => id !== 'career' || ['adult', 'college'].includes(state.profile.group)); // 커리어 섹션은 성인·대학생만
  app.innerHTML = `<div class="card"><h2>${t('in_title')}</h2><p class="sub">${t('in_help')}</p><div class="jump">${secs.map(([id, k]) => `<button data-jump="${id}">${t(k)}</button>`).join('')}</div></div>
    ${secs.map(([id, k]) => sec(id, k)).join('')}`;
  intakeCard($('#in_intake')); attendanceView($('#in_attend')); if ($('#in_career')) careerView($('#in_career'));
  basicCard($('#in_basic')); goalView($('#in_goal')); testsCard($('#in_tests')); gradesView($('#in_grades')); schedView($('#in_sched')); weekplanView($('#in_wp')); tasksCard($('#in_tasks')); diagCard($('#in_diag'));
  app.querySelectorAll('details[data-fold]').forEach((d) => d.addEventListener('toggle', () => { d.open ? inOpen.add(d.dataset.fold) : inOpen.delete(d.dataset.fold); }));
  app.querySelectorAll('[data-jump]').forEach((b) => (b.onclick = () => { const d = $('#fold_' + b.dataset.jump); d.open = true; inOpen.add(b.dataset.jump); d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
}

// ---- 기본 정보 ----
function basicCard(el) {
  const p = state.profile, v = state.viewAs, admin = roleOf() === 'admin';
  if (admin && !roster.loaded && !roster.loading) loadRoster().then(() => { if (state.tab === 'input') render(); });
  const sv = p.services || { study: true, career: true };
  el.innerHTML = `<div class="card">
    <input type="text" id="bname" maxlength="20" placeholder="${t('reg_name')}" value="${esc(p.name)}">
    <div class="row"><select id="bgroup">${Object.keys(GROUPS).map((k) => `<option value="${k}" ${p.group === k ? 'selected' : ''}>${groupLabel(k)}</option>`).join('')}</select>
      <input type="text" id="bschool" maxlength="40" placeholder="${t('reg_school')}" value="${esc(p.school)}"></div>
    <div class="row"><select id="borg"><option value="">${t('ot_none')}</option>${ORG_TYPES.map((k) => `<option value="${k}" ${p.orgType === k ? 'selected' : ''}>${t('ot_' + k)}</option>`).join('')}</select></div>
    <div class="row"><input type="text" id="bclass" maxlength="40" placeholder="${t('cls_ph')}" value="${esc(p.className || '')}"><select id="bstatus">${['active', 'paused', 'left'].map((k) => `<option value="${k}" ${(p.status || 'active') === k ? 'selected' : ''}>${t('en_' + k)}</option>`).join('')}</select></div>
    <div class="row"><input type="text" id="bseat" maxlength="20" placeholder="${t('cafe_seat')}" value="${esc(p.seat || '')}"><input type="text" id="bpass" maxlength="30" placeholder="${t('cafe_pass')}" value="${esc(p.passType || '')}"><input type="date" id="bpend" value="${esc(p.passEnd || '')}" title="${t('cafe_pass_end')}" style="max-width:170px"></div>
    <div class="row"><input type="text" id="bpname" maxlength="20" placeholder="${t('par_name')}" value="${esc(p.parentName || '')}"><input type="text" id="bpphone" maxlength="30" placeholder="${t('par_phone')}" value="${esc(p.parentPhone || '')}"></div>
    <div class="row"><span class="sub">${t('ns_label')}</span><input type="date" id="bnext" value="${esc(p.nextSession || '')}" style="max-width:170px"></div>
    <label class="row"><input type="checkbox" id="bs1" ${sv.study !== false ? 'checked' : ''} style="flex:none;width:20px"> <span>${t('svc_study')}</span></label>
    <label class="row"><input type="checkbox" id="bs2" ${sv.career !== false ? 'checked' : ''} style="flex:none;width:20px"> <span>${t('svc_career')}</span></label>
    <textarea id="bnote" rows="2" maxlength="200" placeholder="${t('reg_note')}">${esc(p.note)}</textarea>
    <p class="sub">${t('ta_note_help')}</p><textarea id="btnote" rows="2" maxlength="300" placeholder="${t('ta_note')}">${esc(p.teacherNote)}</textarea>
    ${admin ? `<div class="row"><span class="sub">${t('in_teacher')}</span><select id="bteacher"><option value="">${t('unassigned')}</option>${roster.teachers.map((x) => `<option value="${esc(x.id)}" ${v.teacher?.id === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>` : ''}
    ${v.managed ? `<label class="row"><input type="checkbox" id="brs" ${state.consent.research ? 'checked' : ''} style="flex:none;width:20px"> <span>${t('consent_rs')}</span></label><p class="sub">${t('consent_rs_note')}</p>` : ''}
    ${v.managed ? `<p>${t('in_code')}: <b style="font-size:1.2em;letter-spacing:2px">${esc(v.shareCode || '')}</b></p><p class="sub">${t('reg_code_help')}</p>` : `<p class="sub">${t('in_has_account')}</p>`}
    <div class="row">${inDel ? `<button style="color:var(--crit)" id="bdelok">${t('in_delete_confirm')}</button><button id="bdelno">${t('btn_cancel')}</button>` : `<button style="color:var(--crit)" id="bdel">${t('in_delete')}</button>`}<span class="sub" id="bmsg">${esc(inMsg)}</span></div></div>${parentLinkCard()}`;
  bindParentLinkCard();
  const upd = () => {
    p.name = $('#bname').value.trim() || p.name; p.group = $('#bgroup').value; p.school = $('#bschool').value.trim(); p.orgType = $('#borg').value; p.className = $('#bclass').value.trim(); p.status = $('#bstatus').value; p.parentName = $('#bpname').value.trim(); p.parentPhone = $('#bpphone').value.trim(); p.nextSession = $('#bnext').value; p.seat = $('#bseat').value.trim(); p.passType = $('#bpass').value.trim(); p.passEnd = $('#bpend').value;
    p.services = { study: $('#bs1').checked, career: $('#bs2').checked }; p.note = $('#bnote').value.trim(); p.teacherNote = $('#btnote').value.trim();
    state.viewAs.name = p.name; save('profile'); $('#bmsg').textContent = t('saved');
  };
  ['#bname', '#bgroup', '#bschool', '#borg', '#bclass', '#bstatus', '#bpname', '#bpphone', '#bnext', '#bseat', '#bpass', '#bpend', '#bs1', '#bs2', '#bnote', '#btnote'].forEach((s) => ($(s).onchange = upd));
  if ($('#brs')) $('#brs').onchange = (e) => { state.consent = { ...state.consent, research: e.target.checked }; save('consent'); $('#bmsg').textContent = t('saved'); };
  if ($('#bteacher')) $('#bteacher').onchange = async (e) => {
    try { await api(`/api/students/${v.id}/meta`, { method: 'PUT', body: { teacherId: e.target.value } }); v.teacher = roster.teachers.find((x) => x.id === e.target.value) || null; roster.loaded = false; $('#bmsg').textContent = t('saved'); } catch (er) { $('#bmsg').textContent = er.message; }
  };
  if ($('#bdel')) $('#bdel').onclick = () => { inDel = true; render(); };
  if ($('#bdelno')) $('#bdelno').onclick = () => { inDel = false; render(); };
  if ($('#bdelok')) $('#bdelok').onclick = async () => { try { await api('/api/students/' + v.id, { method: 'DELETE' }); inDel = false; inMsg = ''; await closeStudent(); } catch (er) { inMsg = er.message; render(); } };
}

// ---- 검사 결과 직접 입력 (외부에서 실시한 검사 점수를 옮겨 적기) ----
const mtOpen = new Set();
function testsCard(el) {
  const ids = TEST_IDS.filter((id) => id !== 'wellbeing' || state.consent.wellbeing);
  el.innerHTML = `<div class="card"><p class="sub">${t('mt_help')}</p>${ids.map((id) => {
    const test = testById(id), last = lastRes(id);
    return `<details class="subfold" data-mt="${id}" ${mtOpen.has(id) ? 'open' : ''}><summary><b>${esc(tx(id).name)}</b> ${last ? `<span class="tag strong">${esc(last.date)}</span> <span class="sub">${esc(describeTest(id, last).headline)}</span>` : `<span class="sub">${t('mt_none')}</span>`}</summary>
      <div class="mtgrid">${test.cats.map((k) => `<label><span class="sub">${esc(testLabel(id, k))}</span><input type="number" min="1" max="5" step="0.1" data-k="${k}" value="${last ? last.cat[k] : ''}" placeholder="1–5"></label>`).join('')}</div>
      <div class="row"><input type="date" class="mtd" value="${today()}" style="max-width:170px"><button class="primary" data-mtsave="${id}">${t('mt_save')}</button>${last ? `<button data-mtdel="${id}">${t('mt_del_last')}</button>` : ''}<span class="sub" data-mtmsg="${id}"></span></div></details>`; }).join('')}</div>`;
  el.querySelectorAll('details[data-mt]').forEach((d) => d.addEventListener('toggle', () => { d.open ? mtOpen.add(d.dataset.mt) : mtOpen.delete(d.dataset.mt); }));
  el.querySelectorAll('[data-mtsave]').forEach((b) => (b.onclick = () => {
    const id = b.dataset.mtsave, box = b.closest('details'), cat = {};
    for (const inp of box.querySelectorAll('input[data-k]')) { const n = parseFloat(inp.value); if (!(n >= 1 && n <= 5)) { box.querySelector('[data-mtmsg]').textContent = t('mt_need'); return; } cat[inp.dataset.k] = Math.round(n * 10) / 10; }
    const vals = Object.values(cat), d = box.querySelector('.mtd').value;
    state.deep[id] = [...(state.deep[id] || []), { date: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today(), cat, overall: Math.round(vals.reduce((a, x) => a + x, 0) / vals.length * 10) / 10, v: [] }].slice(-5);
    save('deep'); mtOpen.add(id); render();
  }));
  el.querySelectorAll('[data-mtdel]').forEach((b) => (b.onclick = () => { const id = b.dataset.mtdel; state.deep[id] = (state.deep[id] || []).slice(0, -1); if (!state.deep[id].length) delete state.deep[id]; save('deep'); mtOpen.add(id); render(); }));
}

// ---- 할 일·체크리스트 ----
function tasksCard(el) {
  el.innerHTML = `<div class="card"><div class="row"><input type="text" id="itask" maxlength="80" placeholder="${t('task_ph')}"><button class="primary" id="itadd">${t('btn_add')}</button></div>
    ${state.tasks.length ? state.tasks.map((x, i) => `<div class="task ${x.done ? 'done' : ''}"><input type="checkbox" data-td="${i}" ${x.done ? 'checked' : ''}><span>${esc(x.text)}</span><button data-tx="${i}" aria-label="${t('btn_delete_item')}">✕</button></div>`).join('') : `<p class="sub">${t('task_empty')}</p>`}</div>`;
  const add = () => { const s = $('#itask').value.trim(); if (!s) return; state.tasks.unshift({ text: s, done: false }); save('tasks'); render(); };
  $('#itadd').onclick = add; $('#itask').onkeydown = (e) => e.key === 'Enter' && add();
  el.querySelectorAll('[data-td]').forEach((c) => (c.onchange = () => { state.tasks[+c.dataset.td].done = c.checked; save('tasks'); render(); }));
  el.querySelectorAll('[data-tx]').forEach((b) => (b.onclick = () => { state.tasks.splice(+b.dataset.tx, 1); save('tasks'); render(); }));
}

// ---- 진단서 직접 작성 (AI 없이도 문장을 입력하거나, AI 초안을 고쳐 쓰기) ----
function diagCard(el) {
  const d = state.diag && state.diag.date ? state.diag : {};
  const f = (k) => esc(d[k] || '');
  el.innerHTML = `<div class="card"><p class="sub">${t('dgi_help')}</p>
    ${!PREVIEW ? `<div class="row"><button id="dgifill">✨ ${t('dgi_ai')}</button><span class="sub" id="dgimsg"></span></div>` : ''}
    <label class="sub">${t('dgi_before')}<textarea id="d_before" rows="2" maxlength="700">${f('before')}</textarea></label>
    <label class="sub">${t('dgi_insight')}<textarea id="d_insight" rows="2" maxlength="400">${f('insight')}</textarea></label>
    <div class="row"><input type="text" id="d_il" maxlength="30" placeholder="${t('dgi_int_label')}" value="${f('intensityLabel')}"><input type="text" id="d_ir" maxlength="200" placeholder="${t('dgi_int_reason')}" value="${f('intensityReason')}"></div>
    <label class="sub">${t('dg_purpose_h')}<textarea id="d_purpose" rows="3" maxlength="900">${f('purpose')}</textarea></label>
    <label class="sub">${t('dg_overall')}<textarea id="d_overall" rows="5" maxlength="1800">${f('overall')}</textarea></label>
    <label class="sub">${t('dg_time_h')}<textarea id="d_time" rows="3" maxlength="1200">${f('timeAnalysis')}</textarea></label>
    <label class="sub">${t('dg_career_h')}<textarea id="d_career" rows="4" maxlength="1400">${f('career')}</textarea></label>
    <label class="sub">${t('dgi_subjects')}<textarea id="d_subj" rows="4" placeholder="${t('dgi_subjects_ph')}">${esc((d.subjects || []).map(([a, b]) => `${a}: ${b}`).join('\n'))}</textarea></label>
    <label class="sub">${t('dgi_methods')}<textarea id="d_meth" rows="4" placeholder="${t('dgi_methods_ph')}">${esc((d.methods || []).map(([a, arr]) => `${a}: ${arr.join(' | ')}`).join('\n'))}</textarea></label>
    <label class="sub">${t('dgi_checklist')}<textarea id="d_check" rows="3" placeholder="${t('dgi_checklist_ph')}">${esc((d.checklist || []).join('\n'))}</textarea></label>
    <div class="row"><button class="primary" id="dgisave">${t('btn_save')}</button><button id="dgiview">${t('dgi_view')}</button><span class="sub" id="dgismsg"></span></div></div>`;
  $('#dgisave').onclick = () => {
    setDiag({
      date: today(), lang, before: $('#d_before').value.trim(), insight: $('#d_insight').value.trim(), intensityLabel: $('#d_il').value.trim(), intensityReason: $('#d_ir').value.trim(),
      purpose: $('#d_purpose').value.trim(), overall: $('#d_overall').value.trim(), timeAnalysis: $('#d_time').value.trim(), career: $('#d_career').value.trim(),
      subjects: lines($('#d_subj').value).map(splitPair).slice(0, 8), etc: d.etc || [], weekplan: d.weekplan || [],
      methods: lines($('#d_meth').value).map((l) => { const [a, b] = splitPair(l); return [a, b.split('|').map((x) => x.trim()).filter(Boolean).slice(0, 5)]; }).slice(0, 6),
      checklist: lines($('#d_check').value).slice(0, 6),
    }); $('#dgismsg').textContent = t('saved');
  };
  $('#dgiview').onclick = () => { state.tab = 'report'; state.sub.report = 'diag'; render(); scrollTo(0, 0); };
  if ($('#dgifill')) $('#dgifill').onclick = async () => { $('#dgifill').disabled = true; $('#dgimsg').textContent = t('dg_making'); try { await aiDiagnosis(); render(); } catch (e) { $('#dgimsg').textContent = e.message; $('#dgifill').disabled = false; } };
}
