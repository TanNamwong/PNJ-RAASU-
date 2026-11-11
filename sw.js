/* PNJ RAASU service worker  — เปลี่ยน VERSION ทุกครั้งที่อัพเดท (ใช้ bump_version.py) */
const VERSION = '1.9.0';
const CACHE = 'pnj-raasu-' + VERSION;
const SHELL = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png',
  './maskable-512.png', './apple-touch-icon.png', './nurse-base.png', './nurse-hand.png', './nurse-sound.png', './brain-nurse.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  // ไม่ skipWaiting อัตโนมัติ: รอให้ผู้ใช้กด "อัพเดทตอนนี้"
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pnj-raasu-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION' && e.source) e.source.postMessage({ type: 'VERSION', version: VERSION });
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // ลิงก์ภายนอกไม่เกี่ยวกับแอพ
  if (url.pathname.endsWith('/version.json')) return;  // ตรวจอัพเดทต้องดึงจากเน็ตเสมอ
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => {
    if (list.length) return list[0].focus();
    return self.clients.openWindow('./');
  }));
});
