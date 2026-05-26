# Ever PRO Argentina 🇦🇷

Herramienta HVAC profesional para técnicos argentinos. PWA instalable, funciona offline.

## Estructura del proyecto

Todos los archivos están en la raíz — sin subcarpetas.
Compatible con subida directa desde el celular a GitHub.

### Archivos principales
- `index.html` — Entry point
- `config.js` — Versión y configuración central
- `service-worker.js` — Cache PWA offline
- `manifest.json` — Config PWA

### JS Core
- `app.js` — Router + lógica principal
- `timer.js` — Timers integrados en procedimientos
- `mentor.js` — Mentor contextual por diagnóstico
- `marca-dx.js` — Diagnóstico personalizado por marca
- `dx-actions.js` — Acciones post-diagnóstico (PDF, historial)
- `historial.js` — Historial de búsquedas
- `pwa.js` — Instalación PWA

### JS Módulos de diagnóstico
- `split-engine.js` / `split-pro.js`
- `ciclica-engine.js` / `ciclica-pro.js`
- `nofrost-engine.js` / `nofrost-pro.js`
- `comercial-engine.js` / `comercial-pro.js`
- `seguridad.js` — Módulo de seguridad

### JS Referencias
- `referencias-hvac.js` — Biblioteca técnica principal
- `funciones-tecnicas.js` — Tabs AMP, CAP, TEMP, P/T, NTC, QS, RES, RELAY, CALC
- `referencias.js` / `referencias-data.js`
- `split/ciclica/nofrost-refrigeracion-ref.js`
- `split/ciclica/nofrost-electrica-ref.js`

### CSS
- `mobile.css` / `dashboard.css` / `animations.css`

### JSON Data
- `mentor.json` — Frases del mentor por diagnóstico
- `marcas-config.json` — Config por marca de equipo
- `funciones-tecnicas.json` — Datos AMP, CAP, TEMP, P/T
- `teoria.json` / `procedimientos.json` / `codigos-error.json`
- `seguridad.json` — Contenido del módulo de seguridad
- `referencias.json` / `mentor-tips.json`

## Cómo actualizar la versión

Solo editá `config.js`:
```js
const APP_CONFIG = {
  version: "1.0.1",  // ← acá
  ...
};
```

## Nota sobre el Service Worker

El SW funciona en HTTPS o localhost real.
GitHub Pages activa HTTPS automáticamente — subí el proyecto y funciona.

## Debug de errores en producción

```js
JSON.parse(localStorage.getItem("hvac_errors"))
```
