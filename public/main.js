// 모든 스크립트가 로드된 뒤 시작
const langSel = $('#lang');
langSel.innerHTML = Object.entries(LANGS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
langSel.value = lang;
langSel.onchange = () => { setLang(langSel.value); render(); applyTheme(currentTheme()); };
applyTheme(currentTheme());
$('#themebtn').onclick = () => { const o = ['auto', 'light', 'dark']; applyTheme(o[(o.indexOf(currentTheme()) + 1) % 3]); };
if ('serviceWorker' in navigator && !PREVIEW && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
setInterval(poll, 45000);
window.addEventListener('pagehide', () => { flush(); });
(async () => {
  const qs = new URLSearchParams(location.search), pt = qs.get('p'), lg = qs.get('legal');
  if (lg) { await loadOrg(); return renderLegal(lg); } // 개인정보 처리방침·이용약관
  if (pt) return renderParentPage(pt); // 학부모 공유 링크
  await Promise.all([bootAuth(), loadOrg()]); render();
})();
