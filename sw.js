// 歯周検査アプリ：院内の回線が落ちていても、最後に開けた版でアプリを開けるようにする。
// ネット優先（ふだんは必ず公開中の最新の版を読む。6秒たっても読めない・サーバーの不調のときだけ、手元に控えた最後の版を出す）。
// 画面の読み込み（navigate）だけを扱い、院内保管庫など他への通信には一切触らない。同じ配信元の他のアプリの控えにも触らない。
// ★止めたいとき：このファイルの中身を「install で skipWaiting・activate で self.registration.unregister()」だけにして公開する。
const CACHE='perio-shell-v1';
const isApp=u=>{const p=new URL(u).pathname,base=new URL('./',self.registration.scope).pathname;return p===base||p===base+'index.html';};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.add(new Request('./',{cache:'reload'}))).catch(()=>{}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('perio-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const offline=()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><p style="font:17px -apple-system,sans-serif;padding:28px;line-height:1.7">回線につながっていないため、アプリを開けませんでした。<br>回線が戻ってから開き直してください（記録はこのiPadの中に残っています）。</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||r.mode!=='navigate')return;
  if(new URL(r.url).origin!==self.location.origin)return;
  e.respondWith((async()=>{const cached=async()=>{try{const c=await caches.open(CACHE);return (await c.match('./'))||null;}catch(_){return null;}};
    let res;try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),6000);res=await fetch(r,{cache:'no-cache',signal:ctl.signal});clearTimeout(t);}
    catch(_){return (await cached())||offline();}
    if(res.type==='opaqueredirect')return res;
    if(res.status>=500){const hit=await cached();if(hit)return hit;return res;}
    // 控えるのはアプリ本体（このフォルダの index）の正常な HTML だけ
    if(res.ok&&res.type==='basic'&&isApp(r.url)&&/text\/html/.test(res.headers.get('content-type')||'')){try{const c=await caches.open(CACHE);await c.put('./',res.clone());}catch(_){}}
    return res;})());});
