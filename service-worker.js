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
// INSTALL
// =====================================================

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
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
// FETCH — Cache first, network fallback
// =====================================================

self.addEventListener("fetch", event => {

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );

});
