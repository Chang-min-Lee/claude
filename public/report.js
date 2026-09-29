// 리포트: 종합 결과 / 학생용 / 학부모용(인쇄) / 진단서(인쇄, AI 보강) / 강사용
const isGuardianView = () => state.user?.role === 'guardian';
const isStaffView = () => ['teacher', 'admin'].includes(state.user?.role);
const PRINT_TESTS = TEST_IDS.filter((id) => id !== 'wellbeing'); // 외부에 제출하는 문서에는 정서웰빙을 넣지 않는다
const reportTabs = () => (isGuardianView() ? ['parent', 'comp', 'diag'] : isStaffView() ? ['comp', 'student', 'parent', 'diag', 'teacher'] : ['comp', 'student', 'parent', 'diag']);

function docNo(code) {
  const seed = state.viewAs?.id || state.profile?.name || 'x';
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `JA-${code}-${today().replace(/-/g, '')}-${h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
}
const lastRes = (id) => state.deep[id]?.at(-1) || null;
const prevRes = (id) => state.deep[id]?.at(-2) || null;

// ---------- 데이터 모으기 ----------
function hollandCats() { // 정밀 검사(60문항)가 있으면 그것을, 없으면 간이 검사(12문항) 결과를 5점 척도로 환산
  const h = lastRes('holland');
  if (h) return h.cat;
  if (answered() === Q().length) return Object.fromEntries(Object.entries(scores()).map(([k, v]) => [k, Math.round(v / 2 * 10) / 10]));
  return null;
}
const sortedCats = (cat) => Object.entries(cat).sort((a, b) => b[1] - a[1]);
function weekMinutes() { let s = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); s += state.log[dk(d)] || 0; } return s; }
function scheduleStats() {
  const total = state.schedule.reduce((a, b) => a + blockHours(b), 0);
  const days = new Set(state.schedule.map((b) => b.day)).size;
  const weekend = state.schedule.filter((b) => b.day >= 5).reduce((a, b) => a + blockHours(b), 0);
  return { total, days, weekend, weekday: total - weekend };
}
const checkinsThisWeek = () => { const m = new Date(); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return state.checkins.filter((c) => c.date >= dk(m)).length; };
const taskStats = () => ({ done: state.tasks.filter((x) => x.done).length, total: state.tasks.length });
const quizAvg = () => (state.quiz.length ? Math.round(state.quiz.reduce((a, q) => a + q.score / q.total, 0) / state.quiz.length * 100) : null);
const intensityOf = () => { const s = lastRes('sdl'); return !s ? null : s.overall >= 3.8 ? 'loose' : s.overall >= 3.0 ? 'normal' : 'tight'; };

// ---------- 규칙 기반 해석(AI 키가 없어도 항상 제공) ----------
function interpret() {
  const T = C().tips, out = { interest: [], style: [], ability: [], habit: [], mind: [], careers: [], strengths: [], weaknesses: [] };
  const kid = false, hc = hollandCats();
  if (hc) {
    const top = sortedCats(hc).slice(0, 3).map(([k]) => k);
    out.interest.push(t('int_holland', { code: top.join(''), label: R()[top[0]].name }));
    out.careers = [...new Set(top.slice(0, 2).flatMap((k) => C().careers[k][kid ? 'kid' : 'std'].slice(0, 3)))];
    out.strengths.push(`${R()[top[0]].name}: ${hc[top[0]].toFixed(1)}`);
  }
  const wv = lastRes('workvalues');
  if (wv) { const s = sortedCats(wv.cat); out.interest.push(t('int_values', { a: testLabel('workvalues', s[0][0]), b: testLabel('workvalues', s[1][0]) })); }
  const bf = lastRes('bigfive');
  if (bf) { const s = sortedCats(bf.cat); out.style.push(t('int_persona', { p: tx('bigfive').persona[s[0][0]] }), T.bigfive[s[0][0]]); if (s.at(-1)[1] < 3) out.weaknesses.push(`${testLabel('bigfive', s.at(-1)[0])}: ${s.at(-1)[1].toFixed(1)}`); }
  const ap = lastRes('aptitude');
  if (ap) {
    const s = sortedCats(ap.cat);
    out.ability.push(t('int_apt_strong', { a: testLabel('aptitude', s[0][0]), b: testLabel('aptitude', s[1][0]) }));
    if (s.at(-1)[1] < 3.5) { out.ability.push(t('int_apt_weak', { a: testLabel('aptitude', s.at(-1)[0]), v: s.at(-1)[1].toFixed(1) }), T.aptitude[s.at(-1)[0]]); out.weaknesses.push(`${testLabel('aptitude', s.at(-1)[0])}: ${s.at(-1)[1].toFixed(1)}`); }
    out.strengths.push(`${testLabel('aptitude', s[0][0])}: ${s[0][1].toFixed(1)}`);
  }
  const sd = lastRes('sdl');
  if (sd) {
    const band = sd.overall >= 4 ? 0 : sd.overall >= 3.2 ? 1 : sd.overall >= 2.5 ? 2 : 3, s = sortedCats(sd.cat);
    out.habit.push(T.sdlBand[band]);
    if (s.at(-1)[1] < 3.5) { out.habit.push(T.sdl[s.at(-1)[0]]); out.weaknesses.push(`${testLabel('sdl', s.at(-1)[0])}: ${s.at(-1)[1].toFixed(1)}`); }
  }
  const wb = lastRes('wellbeing');
  if (wb) out.mind.push(t('int_wb_' + (wb.overall >= 4 ? 0 : wb.overall >= 3 ? 1 : 2)));
  return out;
}

// ---------- 공통 조각 ----------
const chips = (tags) => tags.map(([l, c]) => `<span class="tag ${c}">${esc(l)}</span>`).join('');
const barRow = (label, v, extra = '') => `<div class="row"><span style="width:130px">${esc(label)}</span>${scaleBar(v)}<span style="width:64px;text-align:right">${v.toFixed(1)}${extra}</span></div>`;
function testCard(id, opts = {}) {
  const r = lastRes(id); if (!r) return '';
  const test = testById(id), d = describeTest(id, r), p = prevRes(id);
  const delta = (k) => { if (!p || opts.noDelta) return ''; const x = Math.round((r.cat[k] - p.cat[k]) * 10) / 10; return x ? ` <span class="sub">${x > 0 ? '▲' : '▼'}${Math.abs(x).toFixed(1)}</span>` : ''; };
  return `<div class="card"><h2>${esc(tx(id).name)}</h2><p><b>${esc(d.headline)}</b> <span class="sub">${esc(r.date)}</span></p><p>${chips(d.tags)}</p>
    ${opts.radar === false ? '' : radarSvg(test.cats.map((k) => ({ label: testLabel(id, k), short: shortLabel(id, k), value: r.cat[k] })))}
    ${test.cats.map((k) => barRow(testLabel(id, k), r.cat[k], delta(k))).join('')}
    ${r.v?.length ? `<p class="sub">⚠ ${t('valid_title')}</p>` : ''}</div>`;
}
function letterhead(title, no) {
  return `<div class="letterhead"><div><div class="org">🧭 ${t('title')}</div><div class="lh-title">${title}</div></div>
    <div class="lh-meta">${t('doc_no')}: <b>${no}</b><br>${t('doc_date')}: <b>${today()}</b><br>${t('doc_name')}: <b>${esc(state.profile.name)}</b> · ${esc(groupLabel(state.profile.group))}</div></div>`;
}
const printBtn = () => `<div class="noprint"><button class="primary" id="doprint">🖨 ${t('btn_print')}</button> <span class="sub">${t('print_hint')}</span></div>`;
const bindPrint = () => { const b = $('#doprint'); if (b) b.onclick = () => window.print(); };

// ---------- 화면 ----------
function renderReport(app) {
  const tabs = reportTabs();
  if (!tabs.includes(state.sub.report)) state.sub.report = tabs[0];
  app.innerHTML = subnav('report', tabs) + '<div id="repbody"></div>';
  bindSubnav(app, 'report');
  ({ comp: compView, student: studentView, parent: parentView, diag: diagView, teacher: teacherView }[state.sub.report])($('#repbody'));
  bindPrint();
}

function compView(body) {
  const ids = TEST_IDS.filter((id) => lastRes(id)), missing = TEST_IDS.filter((id) => !lastRes(id) && !(id === 'wellbeing' && (state.viewAs || isGuardianView())));
  const it = interpret();
  const sec = (title, lines) => (lines.length ? `<div class="card"><h2>${title}</h2><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : '');
  body.innerHTML = `<div class="card"><h2>${t('comp_title')}</h2><p class="sub">${t('comp_intro')}</p>
      <p>${ids.length}/${TEST_IDS.length} ${t('comp_done')}</p>
      ${missing.length ? `<p class="sub">${t('comp_missing')}: ${missing.map((id) => esc(tx(id).name)).join(', ')}</p>` : ''}
      ${state.ro ? '' : `<button class="primary" data-goto="tests">${missing.length ? t('comp_continue') : t('comp_retake')}</button>`}</div>
    ${ids.length ? `<div class="card"><h2>${t('comp_summary')}</h2>${ids.map((id) => { const d = describeTest(id, lastRes(id)); return `<p><b>${esc(tx(id).name)}</b><br>${esc(d.headline)} ${chips(d.tags)}</p>`; }).join('')}</div>` : ''}
    ${sec(t('int_sec_interest'), it.interest)}${it.careers.length ? `<div class="card"><h2>${t('int_sec_careers')}</h2><p>${it.careers.map((c) => `<span class="tag">${esc(c)}</span>`).join('')}</p><p class="sub">${t('comp_career_note')}</p></div>` : ''}
    ${sec(t('int_sec_style'), it.style)}${sec(t('int_sec_ability'), it.ability)}${sec(t('int_sec_habit'), it.habit)}${sec(t('int_sec_mind'), it.mind)}
    ${ids.length ? `<div class="card"><h2>${t('res_next')}</h2><ul>${C().next[state.profile.group].map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
    ${ids.map((id) => testCard(id)).join('')}
    <p class="sub">${t('comp_disclaimer')}</p>`;
  body.querySelectorAll('[data-goto]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.goto; render(); }));
}

function studentView(body) {
  const ts = taskStats(), it = interpret(), n = ddayOf(state.goal.date), ci = checkinsThisWeek(), q = quizAvg();
  body.innerHTML = `<div class="card"><h2>${t('stu_title')}</h2>
      <div class="stats"><div><b>${unit('unit_day', streak())}</b><span class="sub">${t('stat_streak')}</span></div><div><b>${unit('unit_min', weekMinutes())}</b><span class="sub">${t('last7')}</span></div><div><b>${ts.done}/${ts.total}</b><span class="sub">${t('stu_tasks')}</span></div></div>
      <p class="sub">${t('rep_checkins', { n: ci })}${q !== null ? ' · ' + t('rep_quiz_avg', { n: q }) : ''}${n !== null ? ` · ${esc(state.goal.label)} ${ddayText(n)}` : ''}</p></div>
    ${it.strengths.length ? `<div class="card"><h2>${t('stu_strengths')}</h2><p>${it.strengths.map((s) => `<span class="tag strong">${esc(s)}</span>`).join('')}</p></div>` : ''}
    ${it.weaknesses.length ? `<div class="card"><h2>${t('stu_weak')}</h2><p>${it.weaknesses.map((s) => `<span class="tag weak">${esc(s)}</span>`).join('')}</p></div>` : ''}
    ${!it.strengths.length && !it.weaknesses.length ? `<div class="card"><p class="sub">${t('stu_need_tests')}</p></div>` : ''}
    <div class="card"><h2>${t('today_step')}</h2><ul>${C().next[state.profile.group].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}

function weeklyBars() {
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { day: C().days[d.getDay()], m: state.log[dk(d)] || 0 }; });
  const max = Math.max(60, ...days.map((x) => x.m));
  return `<div class="week">${days.map((w) => `<div><i style="height:${w.m / max * 80}px"></i>${w.day}<br>${w.m}</div>`).join('')}</div>`;
}
function latestGrades() { const by = {}; state.grades.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((g) => { (by[g.subject] = by[g.subject] || []).push(g); }); return by; }

function parentView(body) {
  const ts = taskStats(), n = ddayOf(state.goal.date), q = quizAvg(), inten = intensityOf(), lg = latestGrades();
  const tests = PRINT_TESTS.filter((id) => lastRes(id));
  const comment = state.profile.teacherNote || state.diag.insight || '';
  body.innerHTML = `<div class="doc">${letterhead(t('rep_parent_title'), docNo('PR'))}
    <div class="docsec"><h3>${t('rep_status')}</h3>
      <div class="statgrid"><div><b>${unit('unit_day', streak())}</b><span>${t('stat_streak')}</span></div><div><b>${unit('unit_min', weekMinutes())}</b><span>${t('last7')}</span></div><div><b>${checkinsThisWeek()}</b><span>${t('rep_checkin_lbl')}</span></div><div><b>${ts.total ? Math.round(ts.done / ts.total * 100) + '%' : '-'}</b><span>${t('rep_task_rate')}</span></div></div>
      ${weeklyBars()}${q !== null ? `<p class="sub">${t('rep_quiz_avg', { n: q })}</p>` : ''}</div>
    ${state.goal.label || state.goal.date ? `<div class="docsec"><h3>${t('goal_title')}</h3><p><b>${esc(state.goal.label)}</b> ${n !== null ? `· ${ddayText(n)} (${esc(state.goal.date)})` : ''}</p>${state.goal.milestones.length ? `<p class="sub">${t('ms_title')}: ${state.goal.milestones.filter((m) => m.done).length}/${state.goal.milestones.length}</p>` : ''}${state.goal.note ? `<p class="sub">${esc(state.goal.note)}</p>` : ''}</div>` : ''}
    ${Object.keys(lg).length ? `<div class="docsec"><h3>${t('gr_title')}</h3>${gradeTrendSvg(state.grades)}<table class="rtbl"><tbody>${Object.entries(lg).map(([s, arr]) => { const a = arr.at(-1), b = arr.at(-2), dn = b && scoreNum(a.score) !== null && scoreNum(b.score) !== null ? Math.round(scoreNum(a.score) - scoreNum(b.score)) : null; return `<tr><td class="k">${esc(s)}</td><td>${esc(a.score)} <span class="sub">${esc(a.date)}</span>${dn ? ` <b>${dn > 0 ? '▲' : '▼'}${Math.abs(dn)}</b>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : ''}
    ${tests.length ? `<div class="docsec"><h3>${t('rep_tests')}</h3><table class="rtbl"><tbody>${tests.map((id) => { const d = describeTest(id, lastRes(id)); return `<tr><td class="k">${esc(tx(id).name)}</td><td>${esc(d.headline)}<br>${chips(d.tags)}</td></tr>`; }).join('')}</tbody></table>${inten ? `<p class="sub">${t('rep_intensity')}: <b>${t('int_' + inten)}</b></p>` : ''}</div>` : ''}
    ${comment ? `<div class="docsec"><h3>${t('rep_comment')}</h3><p>${esc(comment)}</p></div>` : ''}
    ${state.weekplan.length ? `<div class="docsec"><h3>${t('rep_next')}</h3><table class="rtbl"><tbody>${state.weekplan.map((r) => `<tr><td class="k">${esc(r.subject)}</td><td>${t('kind_' + r.kind)} · ${esc(r.detail)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <div class="docfoot"><span class="sub">${t('rep_disclaimer')}</span></div></div>${printBtn()}`;
}

// ----- 진단서 -----
function scheduleAnalysis() {
  const s = scheduleStats();
  if (!s.total) return t('dg_time_none');
  return t('dg_time', { total: s.total, days: s.days, wk: s.weekday, we: s.weekend }) + ' ' + (s.total < 5 ? t('dg_time_low') : s.total > 25 ? t('dg_time_high') : t('dg_time_ok'));
}
function diagModel() {
  const d = state.diag && state.diag.date ? state.diag : null, it = interpret(), T = C().tips, hc = hollandCats();
  const fb = {}; // fallback (규칙 기반)
  fb.purpose = t('dg_purpose', { g: groupLabel(state.profile.group), goal: state.goal.label || t('dg_goal_none') });
  fb.overall = [...it.interest, ...it.style, ...it.ability, ...it.habit].join(' ');
  fb.subjects = [];
  const ap = lastRes('aptitude'), sd = lastRes('sdl'), bf = lastRes('bigfive');
  if (ap) sortedCats(ap.cat).forEach(([k, v]) => fb.subjects.push([testLabel('aptitude', k), `${v.toFixed(1)} / 5${v < 3.5 ? ' — ' + T.aptitude[k] : ''}`]));
  if (sd) sortedCats(sd.cat).forEach(([k, v]) => fb.subjects.push([testLabel('sdl', k), `${v.toFixed(1)} / 5${v < 3.5 ? ' — ' + T.sdl[k] : ''}`]));
  fb.subjects = fb.subjects.slice(0, 8);
  fb.timeAnalysis = scheduleAnalysis();
  fb.methods = [];
  if (ap) { const w = sortedCats(ap.cat).at(-1); fb.methods.push([testLabel('aptitude', w[0]), [T.aptitude[w[0]]]]); }
  if (sd) { const w = sortedCats(sd.cat).at(-1); fb.methods.push([testLabel('sdl', w[0]), [T.sdl[w[0]]]]); }
  fb.career = it.careers.length ? t('dg_career', { c: it.careers.join(', ') }) + ' ' + (lastRes('workvalues') ? it.interest.at(-1) : '') : '';
  fb.checklist = state.tasks.filter((x) => !x.done).slice(0, 4).map((x) => x.text);
  if (!fb.checklist.length) fb.checklist = C().next[state.profile.group].slice(0, 3);
  fb.weekplan = state.weekplan.map((r) => ({ subject: r.subject, kind: r.kind, detail: r.detail }));
  const pick = (k) => (d && d[k] && (Array.isArray(d[k]) ? d[k].length : true) ? d[k] : fb[k]);
  return { ai: !!d, date: d ? d.date : today(), dlang: d?.lang, before: d?.before || '', insight: d?.insight || '', intensity: d?.intensityLabel || (intensityOf() ? t('int_' + intensityOf()) : ''), intensityReason: d?.intensityReason || '',
    purpose: pick('purpose'), overall: pick('overall'), subjects: pick('subjects'), timeAnalysis: pick('timeAnalysis'), methods: pick('methods'), career: pick('career'), checklist: pick('checklist'), weekplan: pick('weekplan'), etc: d?.etc || [] };
}
function diagView(body) {
  const m = diagModel(), tests = PRINT_TESTS.filter((id) => lastRes(id));
  const ro = state.ro || isGuardianView();
  body.innerHTML = `<div class="card noprint"><h2>${t('dg_ai_title')}</h2><p class="sub">${t('dg_ai_desc')}</p>
      ${ro ? '' : `<button class="primary" id="dgai" ${tests.length ? '' : 'disabled'}>${m.ai ? t('dg_ai_redo') : t('dg_ai_btn')}</button>`} <span class="sub" id="dgmsg">${tests.length ? '' : t('dg_need_tests')}</span>
      ${m.ai && m.dlang && m.dlang !== lang ? `<p class="sub">${t('dg_lang_diff')}</p>` : ''}</div>
    <div class="doc">${letterhead(t('rep_diag_title'), docNo('DG'))}
      <div class="docsec"><h3>1. ${t('dg_basic')}</h3><table class="rtbl"><tbody>
        <tr><td class="k">${t('doc_name')}</td><td>${esc(state.profile.name)} (${esc(groupLabel(state.profile.group))})</td></tr>
        <tr><td class="k">${t('goal_title')}</td><td>${esc(state.goal.label || t('dg_goal_none'))}${state.goal.date ? ` · ${ddayText(ddayOf(state.goal.date))} (${esc(state.goal.date)})` : ''}</td></tr>
        ${m.intensity ? `<tr><td class="k">${t('rep_intensity')}</td><td>${esc(m.intensity)}${m.intensityReason ? ` — ${esc(m.intensityReason)}` : ''}</td></tr>` : ''}</tbody></table></div>
      <div class="docsec"><h3>2. ${t('dg_purpose_h')}</h3><p>${esc(m.purpose)}</p></div>
      <div class="docsec"><h3>3. ${t('rep_tests')}</h3>${tests.length ? `<table class="rtbl"><tbody>${tests.map((id) => { const d = describeTest(id, lastRes(id)); return `<tr><td class="k">${esc(tx(id).name)}</td><td>${esc(d.headline)}<br>${chips(d.tags)}</td></tr>`; }).join('')}</tbody></table>` : `<p class="sub">${t('dg_need_tests')}</p>`}
        ${m.before ? `<p>${esc(m.before)}</p>` : ''}</div>
      ${m.overall ? `<div class="docsec"><h3>4. ${t('dg_overall')}</h3><p>${esc(m.overall)}</p>${m.insight ? `<p class="sub">${esc(m.insight)}</p>` : ''}</div>` : ''}
      ${m.subjects.length ? `<div class="docsec"><h3>5. ${t('dg_subjects')}</h3><table class="rtbl"><tbody>${m.subjects.map(([a, b]) => `<tr><td class="k">${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="docsec"><h3>6. ${t('dg_time_h')}</h3><p>${esc(m.timeAnalysis)}</p></div>
      ${m.methods.length ? `<div class="docsec"><h3>7. ${t('dg_methods')}</h3>${m.methods.map(([s, arr]) => `<p><b>${esc(s)}</b></p><ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}</div>` : ''}
      ${m.career ? `<div class="docsec"><h3>8. ${t('dg_career_h')}</h3><p>${esc(m.career)}</p></div>` : ''}
      <div class="docsec"><h3>9. ${t('dg_week')}</h3><ul>${m.checklist.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        ${m.weekplan.length ? `<table class="rtbl"><tbody>${m.weekplan.map((r) => `<tr><td class="k">${esc(r.subject)}</td><td>${t('kind_' + r.kind)} · ${esc(r.detail)}</td></tr>`).join('')}</tbody></table>` : ''}</div>
      <div class="docfoot"><div class="sign"><div>${t('dg_sign_learner')}<span></span></div><div>${t('dg_sign_teacher')}<span></span></div></div><p class="sub">${t('rep_disclaimer')} ${m.ai ? t('dg_ai_note') : t('dg_rule_note')}</p></div></div>${printBtn()}`;
  const b = $('#dgai');
  if (b) b.onclick = async () => {
    b.disabled = true; $('#dgmsg').textContent = t('dg_making');
    try {
      const body2 = { group: state.profile.group, name: state.profile.name, today: today(), goal: { label: state.goal.label, dday: ddayOf(state.goal.date) },
        tests: tests.map((id) => ({ name: tx(id).name, headline: describeTest(id, lastRes(id)).headline, cats: testById(id).cats.map((k) => ({ label: testLabel(id, k), value: lastRes(id).cat[k] })) })),
        grades: state.grades.slice(-12).map((g) => ({ subject: g.subject, score: g.score })), schedule: { hours: scheduleStats().total }, tasksDone: taskStats().done, tasksTotal: taskStats().total };
      const r = await api('/api/diagnosis', { method: 'POST', body: body2 });
      state.diag = r.diag; save('diag'); render();
    } catch (e) { $('#dgmsg').textContent = e.message; b.disabled = false; }
  };
}

// ----- 강사용 -----
function teacherActions() {
  const items = [], ts = taskStats(), n = ddayOf(state.goal.date);
  if (TEST_IDS.some((id) => lastRes(id)?.v?.length)) items.push(t('ta_validity'));
  const wb = lastRes('wellbeing');
  if (wb && wb.overall < 3) items.push(t('ta_wellbeing'));
  const lastAct = [...Object.keys(state.log).filter((k) => state.log[k] > 0), ...state.checkins.map((c) => c.date)].sort().at(-1);
  if (!lastAct || Math.round((new Date(today()) - new Date(lastAct)) / 86400000) >= 3) items.push(t('ta_idle'));
  if (n !== null && n >= 0 && n <= 14) items.push(t('ta_dday', { n, label: state.goal.label }));
  if (ts.total && ts.done < ts.total) items.push(t('ta_tasks', { d: ts.done, n: ts.total }));
  if (state.weekplan.length && !allGreen()) items.push(t('ta_weekplan'));
  if (!items.length) items.push(t('ta_ok'));
  return items;
}
function teacherView(body) {
  const inten = intensityOf();
  body.innerHTML = `<div class="card"><h2>${t('ta_title')}</h2><ul>${teacherActions().map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${inten ? `<p class="sub">${t('rep_intensity')}: <b>${t('int_' + inten)}</b></p>` : ''}</div>
    <div class="card"><h2>${t('ta_note')}</h2><p class="sub">${t('ta_note_help')}</p>
      <textarea id="tnote" rows="3" maxlength="300">${esc(state.profile.teacherNote || '')}</textarea><button class="primary" id="tnotesave">${t('btn_save')}</button> <span class="sub" id="tnotemsg"></span></div>
    <div class="card"><h2>${t('ta_wb_h')}</h2><p class="sub">${state.deep.wellbeing ? t('ta_wb_shared') : t('ta_wb_hidden')}</p></div>`;
  $('#tnotesave').onclick = () => { state.profile.teacherNote = $('#tnote').value.trim().slice(0, 300); save('profile'); $('#tnotemsg').textContent = t('saved'); };
}
