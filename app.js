// =====================================================
// HVAC PRO ARGENTINA
// CORE/APP.JS
// =====================================================

// =====================================================
// ROUTER — historial del navegador con #hash
// =====================================================

const Router = {

  routes: {
    "home":       ()      => HVACApp.renderHome(),
    "split":      ()      => SplitPRO.render(),
    "ciclica":    ()      => CiclicaPRO.render(),
    "nofrost":    ()      => NoFrostPRO.render(),
    "comercial":  ()      => ComercialPRO.render(),
    "referencias":()      => ReferenciasHVAC.render(),
    "amp":        ()      => FuncionesTecnicas.render("amp"),
    "capacitor":  ()      => FuncionesTecnicas.render("capacitor"),
    "temp":       ()      => FuncionesTecnicas.render("temp"),
    "pt":         ()      => FuncionesTecnicas.render("pt"),
    "calc":       ()      => FuncionesTecnicas.render("calc"),
    "historial":  ()      => Historial.render(),
    "dx-historial": ()    => DxHistorial.render(),
    "seguridad":  ()      => SeguridadPRO.render(),
    "ruidos":     ()      => RuidosDx.render(),
    "instalacion":()      => InstalacionDx.render(),
    "btu":        ()      => BTUCalc.render(),
    "heladera-temp":()    => HeladeraTempDx.render()
  },

  go(route) {
    history.pushState({ route }, "", `#${route}`);
    this.render(route);
  },

  back() {
    history.back();
  },

  render(route) {
    const handler = this.routes[route] || this.routes["home"];
    handler();
  },

  init() {
    // Botón atrás nativo del celular
    window.addEventListener("popstate", e => {
      const route = e.state?.route || "home";
      this.render(route);
    });

    // Cargar ruta inicial desde el hash si existe
    const initial = location.hash.replace("#", "") || "home";
    this.render(initial);
  }

};

// =====================================================
// APP
// =====================================================

const HVACApp = {

  mentorTips: [],
  currentModule: null,

  // ===================================================
  // INIT — carga datos JSON antes de renderizar
  // ===================================================

  async init() {

    console.log(`✅ ${APP_CONFIG.name} v${APP_CONFIG.version}`);

    // Cargar tips desde JSON (sin hardcodear en el JS)
    try {
      const res  = await fetch(`./mentor-tips.json`);
      this.mentorTips = await res.json();
    } catch(e) {
      // Fallback offline si el JSON no carga
      this.mentorTips = ["Revisá siempre el airflow antes de cargar gas."];
    }

    // Inicializar Mentor (carga async el JSON)
    Mentor.init();

    // Inicializar MarcaDx (carga config de marcas y códigos de error)
    MarcaDx.init();

    // Logger de errores en producción
    this._initErrorLogger();

    Router.init();

  },

  getRandomTip() {
    if (!this.mentorTips.length) return "";
    return this.mentorTips[Math.floor(Math.random() * this.mentorTips.length)];
  },

  // ===================================================
  // ERROR LOGGER — guarda errores para debug remoto
  // ===================================================

  _initErrorLogger() {
    window.onerror = (msg, src, line, col, err) => {
      try {
        const errors = JSON.parse(localStorage.getItem("hvac_errors") || "[]");
        errors.push({
          msg,
          src: src?.split("/").pop(), // solo el nombre del archivo
          line,
          date: new Date().toISOString()
        });
        // Guardar solo los últimos 10 errores
        localStorage.setItem("hvac_errors", JSON.stringify(errors.slice(-10)));
        if (APP_CONFIG.debug) console.error("[HVAC Error]", msg, src, line);
      } catch(_) {}
    };
  },

  // ===================================================
  // HOME
  // ===================================================

  renderHome() {

    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header
class="hvac-header"
style="align-items:center;gap:18px;"
>

<img
src="./icon-192.png"
alt="HVAC PRO"
style="
width:72px;height:72px;
border-radius:22px;
box-shadow:0 0 20px rgba(0,217,255,.22);
"
/>

<div>
<h1
class="hvac-title"
style="font-size:42px;font-weight:900;letter-spacing:1px;margin-bottom:6px;"
>
EVER
<span style="color:#00d9ff;">SCANNER</span>
</h1>
<p
class="hvac-subtitle"
style="font-size:18px;letter-spacing:3px;color:#00d9ff;"
>
HVAC PRO TOOL
</p>
</div>

</header>

<section class="status-card">
<div class="status-top">
<span class="status-label">Estado del sistema</span>
<div class="status-badge">🟢 LISTO</div>
</div>
<p class="status-message">
Sistema preparado para diagnóstico HVAC.
</p>
</section>

<!-- FUNCIONES TÉCNICAS -->
<section style="margin-top:28px;">
<h2 class="references-title">📘 Funciones Técnicas</h2>
<div class="functions-grid">
<div class="function-card" id="openPSI">PSI</div>
<div class="function-card" id="openPT">PT</div>
<div class="function-card" id="openAMP">AMP</div>
<div class="function-card" id="openCapacitor">Capacitor</div>
<div class="function-card" id="openQuick">Quick Start</div>
</div>
</section>

<!-- SISTEMAS PRO -->
<section style="margin-top:34px;">
<h2 class="references-title">⚙️ Sistemas PRO</h2>
<div class="home-grid">
<div class="home-card" id="openSplit">❄️ Split</div>
<div class="home-card" id="openCiclica">🧊 Cíclica</div>
<div class="home-card" id="openNoFrost">🌬️ No Frost</div>
<div class="home-card" id="openComercial">🏭 Comercial</div>
</div>
</section>

<section
class="references-card"
style="padding:18px;display:flex;align-items:center;
       justify-content:space-between;gap:14px;flex-wrap:nowrap;"
>
<img
src="./logo-dyf.png"
alt="Refrigeración D&F"
style="width:140px;max-width:42%;display:block;object-fit:contain;"
/>
<a href="https://wa.me/541168495693" target="_blank" style="text-decoration:none;flex:1;">
<div style="display:flex;align-items:center;justify-content:center;gap:12px;
            padding:14px;border-radius:18px;
            background:rgba(0,217,255,.05);
            border:1px solid rgba(0,217,255,.12);">
<div style="font-size:32px;">📲</div>
<div>
<div style="font-size:13px;color:#00d9ff;font-weight:700;margin-bottom:4px;">
¿Necesitás servicio técnico?
</div>
<div style="font-size:17px;color:#fff;font-weight:800;">
+54 11 6849 5693
</div>
</div>
</div>
</a>
</section>

<!-- REFERENCIAS HVAC -->
<section style="margin-top:34px;">
<h2 class="references-title">📚 Referencias HVAC</h2>
<div class="home-grid">
<div class="home-card" id="openReferencias">❄️ Refrigeración</div>
<div class="home-card" id="openElectricas">⚡ Eléctricas</div>
</div>
<button class="hist-home-btn" id="openHistorialHome">
  📋 Ver historial de búsquedas
</button>
</section>

<!-- SEGURIDAD -->
<section style="margin-top:20px;padding-bottom:32px;">
<button class="seg-home-btn" id="openSeguridad">
  🛡️ Seguridad — Antes de trabajar, leé esto
</button>
<button class="ruidos-home-btn" id="openRuidos">
  🔊 Diagnóstico por ruidos y vibraciones
</button>
<button class="inst-home-btn" id="openInstalacion">
  🔧 Errores de instalación
</button>
<button class="btu-home-btn" id="openBTU">
  📐 Calculadora de dimensionamiento BTU
</button>
<button class="ht-home-btn" id="openHeladeraTemp">
  🌡️ Heladera por temperatura — sin manómetro
</button>
</section>

`;

    this.bindHomeEvents();

  },

  // ===================================================
  // EVENTS — todos los listeners en un solo lugar
  // ===================================================

  bindHomeEvents() {

    const nav = (route) => () => Router.go(route);

    const bindings = {
      "openSplit":      nav("split"),
      "openCiclica":    nav("ciclica"),
      "openNoFrost":    nav("nofrost"),
      "openComercial":  nav("comercial"),
      "openReferencias":nav("referencias"),
      "openElectricas": nav("referencias"),
      "openHistorialHome": nav("historial"),
      "openSeguridad":     nav("seguridad"),
      "openRuidos":        nav("ruidos"),
      "openInstalacion":    nav("instalacion"),
      "openBTU":           nav("btu"),
      "openHeladeraTemp":   nav("heladera-temp"),
      "openPSI":        nav("pt"),
      "openPT":         nav("pt"),
      "openAMP":        nav("amp"),
      "openCapacitor":  nav("capacitor"),
      "openQuick":      nav("referencias"),
      "openReferences": nav("referencias")
    };

    Object.entries(bindings).forEach(([id, handler]) => {
      document.getElementById(id)?.addEventListener("click", handler);
    });

  }

};

// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  HVACApp.init();
});
