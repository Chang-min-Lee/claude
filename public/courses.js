// 학습 유형별 강의(인강) 추천: 검사 결과로 학습 유형을 읽고, 기관이 등록한 강의 카탈로그에서 맞는 강의를 골라 준다.
// 강의 정보(가격·강사·내용)는 자주 바뀌므로 앱이 임의로 만들지 않는다. 기관이 직접 등록하고, 기본 예시는 공개 무료 서비스만 둔다.
const CRS_TAGS = ['managed', 'selfdriven', 'short', 'long', 'visual', 'concept', 'story', 'live', 'solo', 'gentle', 'intensive'];
const CRS_SUBJECTS = ['국어', '수학', '영어', '과학', '사회', '한국사', '코딩', '자격증'];
const CRS_SEEDS = [
  { id: 'seed-ebsi', title: 'EBSi', platform: 'EBSi', subjects: ['국어', '수학', '영어', '과학', '사회'], groups: ['middle', 'high'], tags: ['concept', 'solo', 'selfdriven'], url: 'https://www.ebsi.co.kr', seed: true },
  { id: 'seed-ebs-primary', title: 'EBS 초등', platform: 'EBS', subjects: [], groups: ['elementary'], tags: ['short', 'gentle'], url: 'https://primary.ebs.co.kr', seed: true },
  { id: 'seed-ebs-mid', title: 'EBS 중학', platform: 'EBS', subjects: [], groups: ['middle'], tags: ['concept', 'solo'], url: 'https://mid.ebs.co.kr', seed: true },
  { id: 'seed-kmooc', title: 'K-MOOC', platform: 'K-MOOC', subjects: [], groups: ['college', 'adult'], tags: ['selfdriven', 'long', 'concept'], url: 'https://www.kmooc.kr', seed: true },
  { id: 'seed-kocw', title: 'KOCW', platform: 'KOCW', subjects: [], groups: ['college', 'adult'], tags: ['selfdriven', 'long', 'solo'], url: 'https://www.kocw.net', seed: true },
];
const crsGuide = {}; // AI 수강 학습법 캐시(화면을 떠나면 사라짐)
const crs = { list: null, loading: false, err: '', sel: new Set(), edit: null, msg: '' };
async function loadCourses() {
  if (crs.loading) return; crs.loading = true;
  try { crs.list = (await api('/api/courses')).courses; crs.err = ''; } catch (e) { crs.err = e.message; crs.list = []; }
  crs.loading = false; render();
}

// 검사 결과 → 학습 유형 태그(강도 w: 1 또는 2)와 이유. 정서웰빙은 쓰지 않는다.
function learningProfile() {
  const sd = lastRes('sdl'), bf = lastRes('bigfive'), ap = lastRes('aptitude'), g = state.profile.group, out = [];
  const add = (k, w, why, vars = {}) => { if (!out.some((x) => x.k === k)) out.push({ k, w, why, vars }); };
  if (sd) {
    if (sd.overall < 3.3) add('managed', sd.overall < 2.8 ? 2 : 1, 'managed', { n: sd.overall.toFixed(1) });
    if (sd.overall >= 3.8) add('selfdriven', sd.overall >= 4.2 ? 2 : 1, 'selfdriven', { n: sd.overall.toFixed(1) });
    if (sd.cat.persist < 3.3) add('short', sd.cat.persist < 2.8 ? 2 : 1, 'short_persist', { n: sd.cat.persist.toFixed(1) });
    if (sd.cat.persist >= 3.8 && (!bf || bf.cat.C >= 3.5)) add('long', 1, 'long', { n: sd.cat.persist.toFixed(1) });
  }
  if (bf) {
    if (bf.cat.C < 3.3) add('short', bf.cat.C < 2.8 ? 2 : 1, 'short_c', { n: bf.cat.C.toFixed(1) });
    if (bf.cat.E >= 3.8) add('live', 1, 'live_e', { n: bf.cat.E.toFixed(1) });
    if (bf.cat.E <= 2.6) add('solo', 1, 'solo', { n: bf.cat.E.toFixed(1) });
    if (bf.cat.N < 3.0) add('gentle', bf.cat.N < 2.5 ? 2 : 1, 'gentle', { n: bf.cat.N.toFixed(1) });
  }
  if (ap) {
    if (ap.cat.spatial >= 3.8) add('visual', 1, 'visual', { n: ap.cat.spatial.toFixed(1) });
    if (ap.cat.lang >= 3.8) add('story', 1, 'story', { n: ap.cat.lang.toFixed(1) });
    if (Math.max(ap.cat.logic, ap.cat.math) >= 3.8) add('concept', 1, 'concept', { n: Math.max(ap.cat.logic, ap.cat.math).toFixed(1) });
    if (ap.cat.social >= 3.8) add('live', 1, 'live_s', { n: ap.cat.social.toFixed(1) });
  }
  if (g === 'elementary') add('short', 1, 'short_age');
  return { tags: out, hasTests: !!(sd || bf || ap) };
}

function rankCourses(profile, subjects, all) {
  const want = new Map(profile.tags.map((x) => [x.k, x.w]));
  return all.filter((c) => !c.groups.length || c.groups.includes(state.profile.group)).map((c) => { // 다른 학년 대상 강의는 제외
    const matched = c.tags.filter((k) => want.has(k)), subj = subjects.length ? c.subjects.filter((s) => subjects.includes(s)) : [];
    let score = matched.reduce((a, k) => a + want.get(k) * 2, 0);
    if (subj.length) score += 4; else if (subjects.length && c.subjects.length) score -= 3;
    score += c.groups.includes(state.profile.group) ? 3 : 0.5;
    return { c, matched, subj, score };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
}

function gradeSubjects() { // 성적이 가장 낮은 과목부터 (칩 앞쪽에 보여 준다)
  const by = latestGrades(), low = Object.entries(by).map(([s, arr]) => [s, scoreNum(arr.at(-1).score)]).filter(([, v]) => v !== null).sort((a, b) => a[1] - b[1]).map(([s]) => s);
  return [...new Set([...low, ...CRS_SUBJECTS])];
}

const guideKey = (prof, subjects) => `${state.viewAs?.id || 'me'}|${prof.tags.map((x) => x.k).join(',')}|${subjects.join(',')}|${lang}`;
function aiGuideCard(prof, subjects) {
  const g = crsGuide[guideKey(prof, subjects)], ul = (a) => (a.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  return `<div class="card" id="aiguide"><h2>✨ ${t('crs_ai_title')}</h2>${g && g.summary ? `<p>${esc(g.summary)}</p><h3>${t('crs_ai_how')}</h3>${ul(g.how)}<h3>${t('crs_ai_week')}</h3>${ul(g.week)}<h3>${t('crs_ai_pit')}</h3>${ul(g.pitfalls)}` : `<p class="sub">${t('crs_ai_help')}</p>`}
    <div class="row"><button id="aigo">${g ? t('crs_ai_redo') : t('crs_ai_btn')}</button>${g && g.summary ? `<button id="aicopy">${t('crs_ai_copy')}</button>${state.viewAs && !state.ro ? `<button id="aisave">${t('crs_ai_save')}</button>` : ''}` : ''}<span class="sub" id="aimsg">${g && g.err ? esc(g.err) : ''}</span></div></div>`;
}
function guideText(g) { return [g.summary, '', t('crs_ai_how'), ...g.how.map((x) => '- ' + x), '', t('crs_ai_week'), ...g.week.map((x) => '- ' + x), '', t('crs_ai_pit'), ...g.pitfalls.map((x) => '- ' + x)].join('\n'); }
function bindAiGuide(prof, subjects) {
  if (!$('#aigo')) return;
  const key = guideKey(prof, subjects), msg = $('#aimsg');
  $('#aigo').onclick = async () => {
    $('#aigo').disabled = true; msg.textContent = t('dg_making');
    try {
      const body = { group: state.profile.group, tags: prof.tags.map((x) => ({ k: x.k, label: t('ct_' + x.k), why: t('crs_why_' + x.why, x.vars) })), subjects, goal: state.goal.label, dday: ddayOf(state.goal.date) };
      crsGuide[key] = (await api('/api/courseguide', { method: 'POST', body })).guide; render();
    } catch (e) { crsGuide[key] = crsGuide[key] ? { ...crsGuide[key], err: e.message } : { err: e.message }; $('#aigo').disabled = false; msg.textContent = e.message; }
  };
  if ($('#aicopy')) $('#aicopy').onclick = async () => { try { await navigator.clipboard.writeText(guideText(crsGuide[key])); msg.textContent = t('pl_copied'); } catch { msg.textContent = t('pl_copy_fail'); } };
  if ($('#aisave')) $('#aisave').onclick = async () => {
    try { state.counsel = (await api(`/api/students/${state.viewAs.id}/counsel`, { method: 'POST', body: { text: guideText(crsGuide[key]).slice(0, 1000), topic: t('crs_ai_title'), date: today() } })).counsel; msg.textContent = t('crs_ai_saved'); } catch (e) { msg.textContent = e.message; }
  };
}
function coursesView(el, manage) {
  if (!crs.list) { el.innerHTML = `<div class="card"><p class="sub">${t('loading')}</p></div>`; if (!crs.loading) loadCourses(); return; }
  const prof = learningProfile(), subjects = [...crs.sel], all = [...crs.list, ...CRS_SEEDS], ranked = rankCourses(prof, subjects, all);
  const subjChips = gradeSubjects().map((s) => `<button class="chipbtn ${crs.sel.has(s) ? 'on' : ''}" data-cs="${esc(s)}">${esc(s)}</button>`).join('');
  const e = crs.edit;
  el.innerHTML = `<div class="card"><h2>${t('crs_type_title')}</h2><p class="sub">${t('crs_type_help')}</p>
      ${prof.tags.length ? prof.tags.map((x) => `<div class="kv"><span><span class="tag ${x.w > 1 ? 'strong' : ''}">${t('ct_' + x.k)}</span> ${t('crs_why_' + x.why, x.vars)}</span></div>`).join('') : `<p class="sub">${prof.hasTests ? t('crs_no_type') : t('crs_need_tests')}</p>`}
      ${prof.tags.length ? `<h3>${t('crs_criteria')}</h3><ul>${prof.tags.map((x) => `<li>${t('crs_tip_' + x.k)}</li>`).join('')}</ul>` : ''}</div>
    ${prof.tags.length && !PREVIEW ? aiGuideCard(prof, subjects) : ''}
    <div class="card"><h2>${t('crs_rec_title')}</h2><p class="sub">${t('crs_subject_help')}</p><div class="chips">${subjChips}</div>
      ${ranked.length ? ranked.map(({ c, matched, subj }) => `<div class="task"><span><b>${esc(c.title)}</b> <span class="sub">${esc(c.platform)}${c.seed ? ' · ' + t('crs_seed') : ''}</span><br>
        ${c.subjects.map((s) => `<span class="tag ${subj.includes(s) ? 'strong' : ''}">${esc(s)}</span>`).join('')}${matched.map((k) => `<span class="tag strong">${t('ct_' + k)}</span>`).join('')}
        ${c.note ? `<br><span class="sub">${esc(c.note)}</span>` : ''}</span>
        <span class="row">${c.url ? `<a class="btnlink" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${t('crs_open')}</a>` : ''}${state.ro ? '' : `<button data-ct="${esc(c.id)}">${t('crs_to_task')}</button>`}</span></div>`).join('') : `<p class="sub">${t('crs_none')}</p>`}
      <p class="sub">${t('crs_disclaimer')}</p><span class="sub" id="crsmsg">${esc(crs.msg)}</span></div>
    ${manage ? `<div class="card"><h2>${t('crs_manage')}</h2><p class="sub">${t('crs_manage_help')}</p>
      <input type="text" id="cstitle" maxlength="80" placeholder="${t('crs_f_title')}" value="${esc(e?.title || '')}">
      <div class="row"><input type="text" id="csplat" maxlength="40" placeholder="${t('crs_f_platform')}" value="${esc(e?.platform || '')}"><input type="text" id="csurl" maxlength="300" placeholder="https://" value="${esc(e?.url || '')}"></div>
      <div class="row"><input type="text" id="cssubj" placeholder="${t('crs_f_subjects')}" value="${esc((e?.subjects || []).join(', '))}"></div>
      <div class="sub">${t('crs_f_groups')}</div><div class="chips">${['elementary', 'middle', 'high', 'college', 'adult'].map((g) => `<label class="chipbtn"><input type="checkbox" data-cg="${g}" ${(e?.groups || []).includes(g) ? 'checked' : ''} style="width:auto"> ${groupLabel(g)}</label>`).join('')}</div>
      <div class="sub">${t('crs_f_tags')}</div><div class="chips">${CRS_TAGS.map((k) => `<label class="chipbtn"><input type="checkbox" data-ctag="${k}" ${(e?.tags || []).includes(k) ? 'checked' : ''} style="width:auto"> ${t('ct_' + k)}</label>`).join('')}</div>
      <input type="text" id="csnote" maxlength="200" placeholder="${t('crs_f_note')}" value="${esc(e?.note || '')}">
      <div class="row"><button class="primary" id="cssave">${e ? t('btn_save') : t('btn_add')}</button>${e ? `<button id="cscancel">${t('btn_cancel')}</button>` : ''}<span class="sub" id="csmsg"></span></div>
      ${crs.list.length ? `<h3>${t('crs_mine')}</h3>${crs.list.map((c) => `<div class="task"><span><b>${esc(c.title)}</b> <span class="sub">${esc(c.platform)} · ${c.tags.map((k) => t('ct_' + k)).join(', ')}</span></span><span class="row"><button data-ce="${esc(c.id)}">${t('btn_edit')}</button><button data-cd="${esc(c.id)}" aria-label="${t('btn_delete_item')}">✕</button></span></div>`).join('')}` : ''}</div>` : ''}`;
  bindAiGuide(prof, subjects);
  el.querySelectorAll('[data-cs]').forEach((b) => (b.onclick = () => { const s = b.dataset.cs; crs.sel.has(s) ? crs.sel.delete(s) : crs.sel.add(s); render(); }));
  el.querySelectorAll('[data-ct]').forEach((b) => (b.onclick = () => {
    const c = all.find((x) => x.id === b.dataset.ct), text = t('crs_task', { t: c.title }).slice(0, 80);
    if (!state.tasks.some((x) => x.text === text)) { state.tasks.push({ text, done: false }); save('tasks'); }
    crs.msg = t('crs_added'); render();
  }));
  if (manage) {
    if ($('#cssave')) $('#cssave').onclick = async () => {
      const body = { id: crs.edit?.id, title: $('#cstitle').value, platform: $('#csplat').value, url: $('#csurl').value, subjects: $('#cssubj').value.split(',').map((x) => x.trim()).filter(Boolean),
        groups: [...el.querySelectorAll('[data-cg]:checked')].map((x) => x.dataset.cg), tags: [...el.querySelectorAll('[data-ctag]:checked')].map((x) => x.dataset.ctag), note: $('#csnote').value };
      if (!body.title.trim()) { $('#csmsg').textContent = t('crs_need_title'); return; }
      try { crs.list = (await api('/api/courses', { method: 'POST', body })).courses; crs.edit = null; render(); } catch (er) { $('#csmsg').textContent = er.message; }
    };
    if ($('#cscancel')) $('#cscancel').onclick = () => { crs.edit = null; render(); };
    el.querySelectorAll('[data-ce]').forEach((b) => (b.onclick = () => { crs.edit = crs.list.find((x) => x.id === b.dataset.ce); render(); scrollTo(0, document.body.scrollHeight); }));
    el.querySelectorAll('[data-cd]').forEach((b) => (b.onclick = async () => { try { crs.list = (await api('/api/courses/' + b.dataset.cd, { method: 'DELETE' })).courses; render(); } catch (er) { crs.msg = er.message; render(); } }));
  }
}
function renderCourses(app) { coursesView(app, true); }
