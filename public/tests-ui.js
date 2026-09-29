// 검사 센터: 종합검사(6종 통합, 중간 저장·이어하기) + 개별 검사
const freshTv = () => ({ mode: 'list', ids: [], idx: 0, ans: {}, comp: false, resultId: null });
let tv = freshTv();
let compSel = new Set(TEST_IDS); // 종합검사에 포함할 검사 (기본: 6종 전부)
const DRAFT_KEY = 'comp_draft';
const estMin = (n) => Math.max(2, Math.round(n * 10 / 60)); // 문항당 약 10초
const scaleBar = (v) => `<div class="bar" style="flex:1"><i style="width:${v / 5 * 100}%"></i></div>`;
const answeredIn = (id) => { const a = tv.ans[id] || []; return testById(id).items.filter((_, i) => a[i] !== undefined && a[i] !== null).length; };
const draft = () => (state.viewAs ? null : store.get(DRAFT_KEY, null)); // 학생을 대신 열어 둔 상태에서는 임시 저장을 쓰지 않는다
const saveDraft = () => { if (tv.comp && !state.viewAs) store.set(DRAFT_KEY, { ids: tv.ids, idx: tv.idx, ans: tv.ans, at: today() }); };

function renderTests(app) {
  if (GROUPS[state.profile.group].kid) return renderQuick(app); // 초등학생: 쉬운 흥미검사 (종합검사는 중학생부터)
  if (tv.mode === 'take') return renderTake(app);
  if (tv.mode === 'result' && state.deep[tv.resultId]?.length) return renderTestResult(app, tv.resultId);
  tv = freshTv();
  const dr = draft(), items = (ids) => ids.reduce((a, id) => a + testById(id).items.length, 0);
  const drDone = dr ? dr.ids.reduce((a, id) => a + testById(id).items.filter((_, i) => dr.ans[id]?.[i] != null).length, 0) : 0;
  app.innerHTML = `<div class="card"><h2>${t('comp_test_title')}</h2><p class="sub">${t('comp_test_desc')}</p>
      ${TEST_IDS.map((id) => `<label class="row"><input type="checkbox" data-sel="${id}" ${compSel.has(id) ? 'checked' : ''} style="flex:none;width:20px"> <span>${esc(tx(id).name)} <span class="sub">(${t('items_n', { n: testById(id).items.length })})</span></span></label>`).join('')}
      <p class="sub" id="compsum"></p>
      ${dr ? `<p>💾 ${t('comp_resume_info', { a: drDone, b: items(dr.ids) })}</p><button class="primary" id="resume">${t('comp_resume')}</button> <button id="restart">${t('comp_restart')}</button>` : `<button class="primary" id="compstart">${t('comp_start')}</button>`}</div>
    <div class="card"><h2>${t('tests_title')}</h2><p class="sub">${t('tests_intro')}</p></div>` + TESTS.map((test) => {
    const T = tx(test.id), last = state.deep[test.id]?.at(-1);
    return `<div class="card"><h2>${esc(T.name)}</h2><p class="sub">${esc(T.intro)} · ${t('test_meta', { n: test.items.length, m: estMin(test.items.length) })}</p>
      ${test.sensitive ? `<p class="sub">${esc(T.safety)}</p><p class="sub">${t('test_private')}</p>` : ''}
      ${last ? `<p><b>${esc(describeTest(test.id, last).headline)}</b> <span class="sub">${t('test_last', { date: esc(last.date) })}</span></p>` : ''}
      <button class="primary" data-start="${test.id}">${last ? t('btn_retest') : t('btn_start_test')}</button> ${last ? `<button data-view="${test.id}">${t('btn_view_result')}</button>` : ''}</div>`;
  }).join('');
  const sum = () => { const ids = TEST_IDS.filter((id) => compSel.has(id)), n = items(ids); $('#compsum').textContent = t('comp_sum', { k: ids.length, n, m: estMin(n) }); if ($('#compstart')) $('#compstart').disabled = !ids.length; };
  app.querySelectorAll('[data-sel]').forEach((c) => (c.onchange = () => { c.checked ? compSel.add(c.dataset.sel) : compSel.delete(c.dataset.sel); sum(); }));
  sum();
  if ($('#compstart')) $('#compstart').onclick = () => { tv = { mode: 'take', ids: TEST_IDS.filter((id) => compSel.has(id)), idx: 0, ans: {}, comp: true, resultId: null }; saveDraft(); render(); scrollTo(0, 0); };
  if ($('#resume')) $('#resume').onclick = () => { tv = { mode: 'take', ids: dr.ids, idx: Math.min(dr.idx, dr.ids.length - 1), ans: dr.ans, comp: true, resultId: null }; render(); scrollTo(0, 0); };
  if ($('#restart')) $('#restart').onclick = () => { store.set(DRAFT_KEY, null); render(); };
  app.querySelectorAll('[data-start]').forEach((b) => (b.onclick = () => { tv = { mode: 'take', ids: [b.dataset.start], idx: 0, ans: {}, comp: false, resultId: null }; render(); scrollTo(0, 0); }));
  app.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => { tv = { ...freshTv(), mode: 'result', resultId: b.dataset.view }; render(); scrollTo(0, 0); }));
}

function renderTake(app) {
  const id = tv.ids[tv.idx], test = testById(id), T = tx(id), n = test.items.length;
  const ans = (tv.ans[id] = tv.ans[id] || []);
  const doneHere = answeredIn(id), last = tv.idx === tv.ids.length - 1;
  const totalItems = tv.ids.reduce((a, x) => a + testById(x).items.length, 0), totalDone = tv.ids.reduce((a, x) => a + answeredIn(x), 0);
  const item = (it, i) => {
    if (test.perf) {
      const q = T.items[i];
      return `<div class="titem"><b>${i + 1}.</b> ${q.context ? `<div class="ctx">${esc(q.context)}</div>` : ''}<div class="qtext">${esc(q.prompt)}</div>
        ${q.choices.map((c, k) => `<button class="choice ${ans[i] === k ? 'on' : ''}" data-i="${i}" data-v="${k}">${'①②③④'[k]} ${esc(c)}</button>`).join('')}</div>`;
    }
    return `<div class="titem"><b>${i + 1}.</b> ${esc(T.items[i])}<div class="scale">${[1, 2, 3, 4, 5].map((v) => `<button data-i="${i}" data-v="${v}" class="${ans[i] === v ? 'on' : ''}">${t('lk' + v)}</button>`).join('')}</div></div>`;
  };
  app.innerHTML = `<div class="card">${tv.comp ? `<p class="sub">${t('comp_step', { i: tv.idx + 1, n: tv.ids.length })} · ${t('test_progress', { a: totalDone, b: totalItems })}</p><div class="bar"><i style="width:${totalDone / totalItems * 100}%"></i></div>` : ''}
    <h2 style="margin-top:12px">${esc(T.name)}</h2><p class="sub">${t('test_progress', { a: doneHere, b: n })}</p><div class="bar"><i style="width:${doneHere / n * 100}%"></i></div>
    ${test.sensitive ? `<p class="sub" style="margin-top:12px">${esc(T.safety)}</p>` : ''}
    <div style="margin-top:14px">${test.items.map(item).join('')}</div>
    <div class="row">${tv.comp && tv.idx > 0 ? `<button id="prev">${t('btn_prev')}</button>` : ''}<button class="primary" id="next" ${doneHere < n ? 'disabled' : ''}>${last ? t('btn_finish_test') : t('btn_next_test')}</button><button id="cancel">${tv.comp ? t('comp_later') : t('btn_cancel')}</button></div></div>`;
  app.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { ans[+b.dataset.i] = +b.dataset.v; saveDraft(); const y = scrollY; render(); scrollTo(0, y); }));
  $('#cancel').onclick = () => { if (tv.comp) saveDraft(); tv = freshTv(); render(); };
  if ($('#prev')) $('#prev').onclick = () => { tv.idx--; saveDraft(); render(); scrollTo(0, 0); };
  $('#next').onclick = () => { if (!last) { tv.idx++; saveDraft(); render(); scrollTo(0, 0); } else finishTests(); };
}

function finishTests() {
  const ids = tv.ids, comp = tv.comp;
  ids.forEach((id) => {
    const test = testById(id), a = tv.ans[id], r = scoreTest(test, a);
    state.deep[id] = [...(state.deep[id] || []), { date: today(), cat: r.cat, overall: r.overall, v: validityOf(test, a) }].slice(-5);
  });
  save('deep');
  if (!state.viewAs) store.set(DRAFT_KEY, null);
  if (comp) { state.tab = 'report'; state.sub.report = 'comp'; tv = freshTv(); }
  else tv = { ...freshTv(), mode: 'result', resultId: ids[0] };
  render(); scrollTo(0, 0);
}

const tdetail = {}; // AI 상세 해석 캐시(화면을 떠나면 사라짐)
function renderTestResult(app, id) {
  const test = testById(id), T = tx(id), hist = state.deep[id], cur = hist.at(-1), prev = hist.at(-2);
  const d = describeTest(id, cur);
  const how = id === 'aptitude' ? t('res_how_apt') : id === 'wellbeing' ? t('res_how_wb') : t('res_how');
  const delta = (k) => { if (!prev) return ''; const x = Math.round((cur.cat[k] - prev.cat[k]) * 10) / 10; return x === 0 ? '' : ` <span class="sub">${x > 0 ? '▲' : '▼'}${Math.abs(x).toFixed(1)}</span>`; };
  app.innerHTML = `<div class="card"><h2>${esc(T.name)}</h2><p style="font-size:1.15em"><b>${esc(d.headline)}</b></p>
      <p>${d.tags.map(([l, c]) => `<span class="tag ${c}">${esc(l)}</span>`).join('')}</p>
      ${radarSvg(test.cats.map((k) => ({ label: testLabel(id, k), short: shortLabel(id, k), value: cur.cat[k] })))}
      ${test.cats.map((k) => `<div class="row"><span style="width:130px">${esc(testLabel(id, k))}</span>${scaleBar(cur.cat[k])}<span style="width:70px;text-align:right">${cur.cat[k].toFixed(1)}${delta(k)}</span></div>`).join('')}
      <p class="sub">${prev ? t('res_prev', { date: esc(prev.date) }) : t('res_first')}</p><p class="sub">${how}</p></div>
    ${cur.v?.length ? `<div class="card callout warn"><h2>⚠ ${t('valid_title')}</h2><p>${t('valid_body')}</p><ul>${cur.v.map((c) => `<li>${t('valid_' + c)}</li>`).join('')}</ul></div>` : ''}
    ${d.attention ? `<div class="card callout"><h2>💬 ${t('wb_title')}</h2><p>${t('wb_body')}</p><p><b>${t('wb_help')}</b></p><p class="sub">${esc(T.safety)}</p></div>` : ''}
    ${id !== 'wellbeing' && !PREVIEW ? `<div class="card" id="aidcard"></div>` : ''}
    ${test.sensitive ? `<p class="sub">${t('test_private')}</p>` : ''}
    <div class="card"><button class="primary" data-start="${id}">${t('btn_retest')}</button> <button id="torep">${t('comp_view_report')}</button> <button id="back">${t('btn_to_list')}</button></div>`;
  if ($('#aidcard')) {
    const key = `${state.viewAs?.id || 'me'}:${id}:${cur.date}`, box = $('#aidcard');
    const draw = (msg) => {
      const dd = tdetail[key], ul = (a) => (a.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
      box.innerHTML = `<h2>✨ ${t('aid_title')}</h2>${dd ? `<p>${esc(dd.summary)}</p><h3>${t('aid_strengths')}</h3>${ul(dd.strengths)}<h3>${t('aid_cautions')}</h3>${ul(dd.cautions)}<h3>${t('aid_tips')}</h3>${ul(dd.tips)}` : `<p class="sub">${t('aid_help')}</p>`}
        ${state.ro ? '' : `<button id="aidgo">${dd ? t('aid_redo') : t('aid_btn')}</button>`} <span class="sub">${esc(msg || '')}</span>`;
      if ($('#aidgo')) $('#aidgo').onclick = async () => {
        $('#aidgo').disabled = true; box.querySelector('.sub:last-child').textContent = t('dg_making');
        try {
          tdetail[key] = (await api('/api/testdetail', { method: 'POST', body: { group: state.profile.group, name: T.name, headline: d.headline, goal: state.goal.label, cats: test.cats.map((k) => ({ label: testLabel(id, k), value: cur.cat[k] })) } })).detail; draw();
        } catch (e) { draw(e.message); }
      };
    };
    draw();
  }
  $('[data-start]').onclick = () => { tv = { mode: 'take', ids: [id], idx: 0, ans: {}, comp: false, resultId: null }; render(); scrollTo(0, 0); };
  $('#torep').onclick = () => { state.tab = 'report'; state.sub.report = 'comp'; render(); scrollTo(0, 0); };
  $('#back').onclick = () => { tv = freshTv(); render(); };
}
