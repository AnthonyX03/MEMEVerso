const CACHE_NAME='memeverso-offline-v2';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./media-config.js','./RickRoll.mp4','./archivos/10_1200_FRASES_DE_AYUDANTE.txt','./archivos/00_LEEME_SI_TE_ATREVES.txt','./archivos/01_ACTA_DEL_GANSO.txt','./archivos/02_TRANSCRIPCION_DE_LA_PARED.txt','./archivos/03_FACTURA_DEL_VACIO.txt','./archivos/04_MANUAL_PARA_SER_UN_OBJETO.txt','./archivos/05_CORREO_DE_AYUDANTE.txt','./archivos/06_LISTA_DE_COSAS_QUE_NO_ESTAN.txt','./archivos/07_PROTOCOLO_DE_EMERGENCIA.txt','./archivos/09_INFORME_DEL_ARCHIVO_QUE_FALTA.txt'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
  if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}
  return response;
 }).catch(()=>caches.match('./index.html'))));
});
