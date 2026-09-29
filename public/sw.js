// 앱 설치·오프라인용 서비스 워커. 화면 파일만 저장하고, API 응답(개인 데이터)은 절대 저장하지 않는다.
const CACHE = 'jinro-shell-v1';
const SHELL = ['/', '/index.html', '/style.css', '/theme.js', '/i18n.js', '/i18n2.js', '/tests.js', '/app.js', '/plan.js', '/tests-ui.js', '/quiz.js', '/report.js', '/staff.js', '/extras.js', '/input.js', '/main.js', '/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname === '/healthz') return; // 네트워크에 그대로 맡김
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; }) // 온라인이면 항상 최신 파일
    .catch(() => caches.match(e.request).then((m) => m || caches.match('/index.html'))));
});
