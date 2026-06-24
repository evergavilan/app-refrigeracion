// =====================================================
// HVAC PRO ARGENTINA
// SERVICE-WORKER.JS
// =====================================================

// Importar config.js para tener APP_CONFIG disponible en el SW scope
importScripts("./config.js");

const CACHE_NAME = `hvac-pro-${APP_CONFIG.version}`;

const FILES_TO_CACHE = [

  "./",
  "./index.html",
  "./config.js",
  "./version.js",
  "./manifest.json",

  // ===================================================
  // CSS
  // ===================================================

  "./mobile.css",
  "./dashboard.css",
  "./animations.css",

  // ===================================================
  // CORE
  // ===================================================

  "./app.js",
  "./btu-calc.js",
  "./sh-sc.js",
  "./timer.js",
  "./mentor.js",
  "./marca-dx.js",
  "./dx-actions.js",
  "./historial.js",
  "./pwa.js",

  // ===================================================
  // MÓDULOS
  // ===================================================

  "./split-engine.js",
  "./split-pro.js",
  "./ciclica-engine.js",
  "./ciclica-pro.js",
  "./nofrost-engine.js",
  "./nofrost-pro.js",
  "./comercial-engine.js",
  "./comercial-pro.js",
  "./seguridad.js",
  "./ruidos.js",
  "./ruidos.json",
  "./instalacion.js",
  "./instalacion.json",
  "./heladera-temp.js",

  // ===================================================
  // REFERENCIAS
  // ===================================================

  "./referencias.js",
  "./referencias-hvac.js",
  "./funciones-tecnicas.js",
  "./split-refrigeracion-ref.js",
  "./split-electrica-ref.js",
  "./ciclica-refrigeracion-ref.js",
  "./ciclica-electrica-ref.js",
  "./nofrost-refrigeracion-ref.js",
  "./nofrost-electrica-ref.js",

  // ===================================================
  // DATA (JSON)
  // ===================================================

  "./referencias.json",
  "./mentor-tips.json",
  "./mentor.json",
  "./marcas-config.json",
  "./funciones-tecnicas.json",
  "./teoria.json",
  "./procedimientos.json",
  "./codigos-error.json",
  "./seguridad.json",

  // ===================================================
  // ASSETS
  // ===================================================

  "./diagnostico-historial.js",
  "./referencias-data.js",
  "./sh-sc-engine.js",
  "./temp-heladera.js",
  "./vacio-carga.js",
  "./presupuesto-pro.js",
  "./novedades.js",
  "./changelog.json",

  "./calculadoras.json",
  "./temp-heladera.json",
  "./icon-192.png",
  "./icon-512.png",
  "./logo-dyf.png",
  "./split-circuito.png",
  "./split-electrica.png",
  "./ciclica-circuito.png",
  "./ciclica-electrica.png",
  "./nofrost-circuito.png",
  "./nofrost-electrica.png"

];

// =====================================================
// INSTALL — tolera archivos faltantes individualmente
// para que un solo 404 no rompa toda la instalación
// =====================================================

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        FILES_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn(`[SW] No se pudo cachear: ${url}`, err);
          })
        )
      );
    })
  );

  self.skipWaiting();

});

// =====================================================
// ACTIVATE — limpia caches viejos automáticamente
// =====================================================

self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log(`[SW] Eliminando cache viejo: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();

});

// =====================================================
// FETCH — Network first, cache fallback
// Así el técnico siempre recibe la versión más nueva
// cuando tiene conexión, y solo usa caché sin internet.
// =====================================================

self.addEventListener("fetch", event => {

  // Solo interceptar GET — dejar pasar otros métodos sin tocar
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Actualizar el caché con la versión fresca
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return networkResponse;
      })
      .catch(() => {
        // Sin conexión — usar lo que haya en caché
        return caches.match(event.request);
      })
  );

});
