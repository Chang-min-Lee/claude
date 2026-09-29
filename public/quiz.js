// ---- 퀴즈 ----
let qz = null; // { subject, questions, i, picked, score, done, review }
function renderQuiz(app) {
  if (qz && !qz.done) {
    const q = qz.questions[qz.i], answered = qz.picked !== null;
    app.innerHTML = `<div class="card"><h2>${esc(t('quiz_q_title', { subject: subjLabel(qz.subject), i: qz.i + 1, n: qz.questions.length }))}</h2><p><b>${esc(q.q)}</b></p>
      ${q.choices.map((c, k) => `<button data-k="${k}" style="display:block;width:100%;text-align:left;margin:6px 0;${answered && k === q.answer ? 'border-color:var(--ok);background:var(--main2)' : ''}" ${answered ? 'disabled' : ''}>${'①②③④'[k]} ${esc(c)}${answered && k === qz.picked ? (k === q.answer ? ' ✅' : ' ❌') : ''}</button>`).join('')}
      ${answered ? `<p>${qz.picked === q.answer ? t('quiz_ok') : t('quiz_no', { c: '①②③④'[q.answer] })}</p><p class="sub">${esc(q.explain)}</p><button class="primary" id="next">${qz.i + 1 < qz.questions.length ? t('btn_next') : t('btn_result')}</button>` : ''}</div>`;
    app.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => {
      qz.picked = +b.dataset.k;
      const same = (w) => w.q === q.q;
      if (qz.picked === q.answer) { qz.score++; if (qz.review) { state.wrong = state.wrong.filter((w) => !same(w)); save('wrong'); } } // 복습에서 맞히면 목록에서 제거
      else if (!state.wrong.some(same)) { state.wrong.push({ subject: qz.subject, q: q.q, choices: q.choices, answer: q.answer, explain: q.explain }); save('wrong'); }
      render();
    }));
    if (answered) $('#next').onclick = () => {
      if (qz.i + 1 < qz.questions.length) { qz.i++; qz.picked = null; } else {
        qz.done = true; state.quiz.push({ date: today(), subject: qz.review ? REVIEW : qz.subject, score: qz.score, total: qz.questions.length }); save('quiz');
      }
      render();
    };
    return;
  }
  const done = qz?.done ? `<div class="card"><h2>${t('quiz_result', { s: qz.score, n: qz.questions.length })}</h2><p>${qz.score === qz.questions.length ? t('quiz_perfect') : qz.score >= qz.questions.length / 2 ? t('quiz_good') : t('quiz_try')}</p></div>` : '';
  app.innerHTML = `${done}<div class="card"><h2>${t('quiz_ai_title')}</h2><p class="sub">${t('quiz_desc', { level: levelLabel(state.profile.group) })}</p>
    <input type="text" id="subj" maxlength="40" placeholder="${t('quiz_subj_ph')}">
    <div class="row"><select id="cnt"><option>3</option><option selected>5</option><option>10</option></select><span class="sub">${t('q_unit')}</span><button class="primary" id="go">${t('btn_quiz_start')}</button></div><p class="sub" id="qmsg"></p></div>
    ${state.wrong.length ? `<div class="card"><h2>${t('review_title')}</h2><p class="sub">${t('review_desc', { n: state.wrong.length })}</p><button id="review">${t('btn_review')}</button></div>` : ''}
    ${state.quiz.length ? `<div class="card"><h2>${t('quiz_history')}</h2>${state.quiz.slice(-8).reverse().map((q) => `<div class="sub">${esc(q.date)} · ${esc(subjLabel(q.subject))} · ${q.score}/${q.total}</div>`).join('')}</div>` : ''}`;
  if ($('#review')) $('#review').onclick = () => { qz = { subject: REVIEW, questions: state.wrong.slice(0, 5), i: 0, picked: null, score: 0, done: false, review: true }; render(); };
  $('#go').onclick = async () => {
    const subject = $('#subj').value.trim(); if (!subject) { $('#qmsg').textContent = t('quiz_need_subj'); return; }
    $('#go').disabled = true; $('#qmsg').textContent = t('quiz_making');
    try {
      const r = await api('/api/quiz', { method: 'POST', body: { subject, count: +$('#cnt').value, group: state.profile.group } });
      qz = { subject, questions: r.questions, i: 0, picked: null, score: 0, done: false }; render();
    } catch (e) { $('#qmsg').textContent = e.message; $('#go').disabled = false; }
  };
}

