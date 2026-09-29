// 테마(자동/라이트/다크): 화면이 그려지기 전에 적용해 깜빡임을 막는다.
(function () {
  var t = null;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
})();
