// 학습 달력(히트맵)·성취 배지·메시지·상담일지(강사 전용)·CSV 내보내기·테마
const totalMinutes = () => Object.values(state.log).reduce((a, b) => a + b, 0);
function maxStreak() {
  const days = Object.keys(state.log).filter((k) => state.log[k] > 0).sort();
  let best = 0, cur = 0, prev = null;
  for (const d of days) { cur = prev && Math.round((new Date(d) - new Date(prev)) / 86400000) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
  return best;
}
function heatmapHtml() { // 최근 12주 (월요일 시작), 공부 시간이 많을수록 진하게
  const end = new Date(), start = new Date(end);
  start.setDate(start.getDate() - ((end.getDay() + 6) % 7) - 77);
  let cells = '';
  for (let i = 0; i < 84; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (d > end) { cells += '<i style="visibility:hidden"></i>'; continue; }
    const k = dk(d), m = state.log[k] || 0;
    cells += `<i class="${m === 0 ? '' : m <= 20 ? 'l1' : m <= 45 ? 'l2' : m <= 90 ? 'l3' : 'l4'}" title="${k} · ${unit('unit_min', m)}"></i>`;
  }
  return `<div class="heat" role="img" aria-label="${t('heat_title')}">${cells}</div>`;
}
const doneTestCount = () => TEST_IDS.filter((id) => state.deep[id]?.length).length;
const BADGES = [
  ['checkin', '✅', () => state.checkins.length >= 1], ['streak3', '🔥', () => maxStreak() >= 3], ['streak7', '🏅', () => maxStreak() >= 7], ['streak30', '🏆', () => maxStreak() >= 30],
  ['test1', '🧭', () => doneTestCount() >= 1 || answered() === Q().length], ['comp', '🎓', () => doneTestCount() === TEST_IDS.length], ['goal', '🎯', () => !!state.goal.label],
  ['sched', '🗓', () => state.schedule.length >= 3], ['weekplan', '📗', () => state.weekhist.length >= 1], ['quiz', '📝', () => state.quiz.length >= 1], ['hours10', '⏱', () => totalMinutes() >= 600],
];
const badgesHtml = () => `<div class="badges">${BADGES.map(([id, ico, ok]) => `<div class="badge ${ok() ? 'got' : ''}"><span class="ico">${ico}</span>${t('bd_' + id)}</div>`).join('')}</div>`;

// ---------- 메시지 (학습자 ↔ 담당 강사) ----------
const msgSide = () => (state.viewAs || (state.user && state.user.role !== 'learner') ? 'staff' : 'learner');
const msgKey = () => `msgseen:${state.viewAs?.id || state.user?.id || 'local'}:${msgSide()}`;
function unreadCount() {
  if (!state.messages.length) return 0;
  const seen = store.get(msgKey(), ''), me = msgSide();
  return state.messages.filter((m) => m.from !== me && m.at > seen).length;
}
function renderMessages(app) {
  const me = msgSide(), sid = state.viewAs?.id || state.user?.id, teacher = state.viewAs ? null : state.myTeacher;
  app.innerHTML = `<div class="card"><h2>${t('msg_title')}</h2>
      <p class="sub">${state.viewAs ? t('msg_help_staff', { name: esc(state.viewAs.name) }) : teacher ? t('msg_help', { name: esc(teacher.name) }) : t('msg_no_teacher')}</p>
      <div class="thread" id="thread">${state.messages.length ? state.messages.map((m) => `<div class="bubble ${m.from === me ? 'me' : 'them'}"><small>${esc(m.name)} · ${esc(String(m.at).slice(5, 16).replace('T', ' '))}</small>${esc(m.text)}</div>`).join('') : `<p class="sub">${t('msg_empty')}</p>`}</div>
      <textarea id="mtext" rows="2" maxlength="500" placeholder="${t('msg_ph')}"></textarea>
      <div class="row"><button class="primary" id="msend">${t('btn_send')}</button><span class="sub" id="mmsg"></span></div></div>`;
  const th = $('#thread'); th.scrollTop = th.scrollHeight;
  store.set(msgKey(), state.messages.at(-1)?.at || ''); document.querySelector('#nav [data-tab=messages] .dot')?.remove();
  $('#msend').onclick = async () => {
    const text = $('#mtext').value.trim(); if (!text) return;
    $('#msend').disabled = true;
    try { state.messages = (await api(`/api/students/${sid}/messages`, { method: 'POST', body: { text } })).messages; store.set(msgKey(), state.messages.at(-1)?.at || ''); render(); } catch (e) { $('#mmsg').textContent = e.message; $('#msend').disabled = false; }
  };
}

// ---------- 상담일지 (강사·관리자 전용 — 학생·보호자에게 보이지 않음) ----------
function renderCounsel(app) {
  const sid = state.viewAs.id, list = state.counsel.slice().reverse(), canDel = (c) => roleOf() === 'admin' || c.byId === state.user?.id;
  app.innerHTML = `<div class="card"><h2>${t('cn_title')}</h2><p class="sub">${t('cn_help')}</p>
      <div class="row"><input type="date" id="cndate" value="${today()}" style="max-width:170px"></div>
      <textarea id="cntext" rows="3" maxlength="1000" placeholder="${t('cn_ph')}"></textarea>
      <div class="row"><button class="primary" id="cnadd">${t('btn_add')}</button><span class="sub" id="cnmsg"></span></div></div>
    <div class="card">${list.length ? list.map((c) => `<div class="task"><span><b>${esc(c.date)}</b> <span class="sub">${esc(c.by)}</span><br>${esc(c.text)}</span>${canDel(c) ? `<button data-cdel="${esc(c.id)}" aria-label="${t('btn_delete_item')}">✕</button>` : ''}</div>`).join('') : `<p class="sub">${t('cn_empty')}</p>`}</div>`;
  $('#cnadd').onclick = async () => {
    const text = $('#cntext').value.trim(); if (!text) { $('#cnmsg').textContent = t('cn_need'); return; }
    try { state.counsel = (await api(`/api/students/${sid}/counsel`, { method: 'POST', body: { text, date: $('#cndate').value } })).counsel; render(); } catch (e) { $('#cnmsg').textContent = e.message; }
  };
  app.querySelectorAll('[data-cdel]').forEach((b) => (b.onclick = async () => { try { state.counsel = (await api(`/api/students/${sid}/counsel/${b.dataset.cdel}`, { method: 'DELETE' })).counsel; render(); } catch (e) { $('#cnmsg').textContent = e.message; } }));
}

// ---------- CSV 내려받기 (엑셀에서 한글이 깨지지 않도록 BOM 포함, 수식 주입 방지) ----------
function downloadCsv(name, rows) {
  const cell = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })), download: name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- 테마(자동/라이트/다크) ----------
const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const THEME_ICON = { auto: svg('<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'), light: svg('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'), dark: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>') };
const currentTheme = () => store.get('theme_pref', 'auto');
function applyTheme(m) {
  if (m === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', m);
  try { localStorage.setItem('theme', m === 'auto' ? '' : m); } catch {}
  store.set('theme_pref', m);
  const b = $('#themebtn'); if (b) { b.innerHTML = THEME_ICON[m]; b.title = t('theme_' + m); b.setAttribute('aria-label', t('theme_' + m)); }
}
