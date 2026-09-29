// 모든 스크립트가 로드된 뒤 시작
const langSel = $('#lang');
langSel.innerHTML = Object.entries(LANGS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
langSel.value = lang;
langSel.onchange = () => { setLang(langSel.value); render(); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
setInterval(poll, 45000);
window.addEventListener('pagehide', () => { flush(); });
(async () => { await bootAuth(); render(); })();
