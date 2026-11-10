const VERSION='1.0.2';
const CACHE='pnj-raasu-shell-v'+VERSION;
const SHELL=['./','./index.html','./manifest.json','./version.json','./logo.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png','./developer.png'];
self.addEventListener('install',e=>{
 // cache:'reload' ข้ามแคช HTTP ของ GitHub Pages เพื่อให้ได้ไฟล์ล่าสุดจริง
 e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'}))))));
});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{
 const req=e.request; if(req.method!=='GET')return;
 const url=new URL(req.url); if(url.origin!==self.location.origin)return;
 if(url.pathname.endsWith('/version.json')){
  e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('./version.json')));return;
 }
 if(req.mode==='navigate'){
  e.respondWith(fetch(req,{cache:'no-cache'}).then(res=>{
   if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));}
   return res;
  }).catch(()=>caches.match('./index.html')));return;
 }
 // stale-while-revalidate สำหรับไฟล์อื่น
 e.respondWith(caches.match(req).then(hit=>{
  const net=fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;}).catch(()=>hit);
  return hit||net;
 }));
});
