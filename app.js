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
"amp": () => FuncionesTecnicas.render("amp"),
"capacitor": () => FuncionesTecnicas.render("capacitor"),
"temp": () => FuncionesTecnicas.render("temp"),
"pt": () => FuncionesTecnicas.render("pt"),
"shsc": () => FuncionesTecnicas.render("shsc"),
"ntc": () => FuncionesTecnicas.render("ntc"),
"calc": () => FuncionesTecnicas.render("calc"),
    "shsc":      () => FuncionesTecnicas.render("shsc"),
"ntc":       () => FuncionesTecnicas.render("ntc"),
    "historial":  ()      => Historial.render(),
    "dx-historial": ()    => DxHistorial.render(),
    "seguridad":  ()      => SeguridadPRO.render(),
    "ruidos":     ()      => RuidosDx.render(),
    "instalacion":()      => InstalacionDx.render(),
"btu": () => BTUCalc.render(),
"heladera-temp": () => HeladeraTempDx.render(),
"vacio": () => VacioCarga.render(),
"presupuesto": () => PresupuestoPRO.render(),
// dev-tools eliminado
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

  currentModule: null,

  // ===================================================
  // INIT — carga datos JSON antes de renderizar
  // ===================================================

  async init() {

    console.log(`✅ ${APP_CONFIG.name} v${APP_CONFIG.version}`);

    // Inicializar Mentor (carga async el JSON)
    Mentor.init();

    // Inicializar MarcaDx (carga config de marcas y códigos de error)
    MarcaDx.init();

    // Logger de errores en producción
    this._initErrorLogger();

    Router.init();

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

<!-- ═══════════════════════════════════════════════ -->
<!-- HEADER                                          -->
<!-- ═══════════════════════════════════════════════ -->

<div class="home-header">
  <div class="home-header-left">
    <img src="./icon-192.png" class="home-logo" alt="Ever PRO"/>
    <div>
      <div class="home-app-name">EVER <span>SCANNER</span></div>
      <div class="home-app-sub">HVAC PRO ARGENTINA</div>
    </div>
  </div>
  <div class="home-status-pill">
    <span class="home-status-dot"></span>
    <span>Listo</span>
  </div>


</div>

<!-- ═══════════════════════════════════════════════ -->
<!-- DIAGNÓSTICO PRO — sección principal             -->
<!-- ═══════════════════════════════════════════════ -->

<div class="home-section-label">DIAGNÓSTICO PRO</div>

<div class="home-dx-grid">

  <button class="home-dx-card home-dx-split"   id="openSplit">
    <span class="home-dx-ico">❄️</span>
    <span class="home-dx-name">Split</span>
    <span class="home-dx-sub">Aire acondicionado</span>
  </button>

  <button class="home-dx-card home-dx-ciclica"  id="openCiclica">
    <span class="home-dx-ico">🧊</span>
    <span class="home-dx-name">Cíclica</span>
    <span class="home-dx-sub">Heladera doméstica</span>
  </button>

  <button class="home-dx-card home-dx-nofrost"  id="openNoFrost">
    <span class="home-dx-ico">🌬️</span>
    <span class="home-dx-name">No Frost</span>
    <span class="home-dx-sub">Con deshielo auto</span>
  </button>

  <button class="home-dx-card home-dx-comercial" id="openComercial">
    <span class="home-dx-ico">🏭</span>
    <span class="home-dx-name">Comercial</span>
    <span class="home-dx-sub">Refrigeración comercial</span>
  </button>

</div>

<!-- ═══════════════════════════════════════════════ -->
<!-- HERRAMIENTAS — fila de íconos                  -->
<!-- ═══════════════════════════════════════════════ -->

<div class="home-section-label">HERRAMIENTAS</div>

<div class="home-tools-grid">

  <button class="home-tool-btn" id="openPT">
    <span class="home-tool-ico">📊</span>
    <span class="home-tool-label">P/T</span>
  </button>

  <button class="home-tool-btn" id="openAMP">
    <span class="home-tool-ico">⚡</span>
    <span class="home-tool-label">AMP</span>
  </button>

  <button class="home-tool-btn" id="openCapacitor">
    <span class="home-tool-ico">🔋</span>
    <span class="home-tool-label">Capacitor</span>
  </button>

  <button class="home-tool-btn" id="openPSI">
    <span class="home-tool-ico">📉</span>
    <span class="home-tool-label">SH / SC</span>
  </button>

  <button class="home-tool-btn" id="openNTC">
    <span class="home-tool-ico">📡</span>
    <span class="home-tool-label">NTC</span>
  </button>

  <button class="home-tool-btn" id="openCalc">
    <span class="home-tool-ico">🧮</span>
    <span class="home-tool-label">Calculadoras</span>
  </button>

  <button class="home-tool-btn" id="openBTU">
    <span class="home-tool-ico">📐</span>
    <span class="home-tool-label">BTU</span>
  </button>

  <button class="home-tool-btn" id="openReferencias">
    <span class="home-tool-ico">📚</span>
    <span class="home-tool-label">Referencias</span>
  </button>

</div>

<!-- ═══════════════════════════════════════════════ -->
<!-- UTILIDADES — lista compacta                     -->
<!-- ═══════════════════════════════════════════════ -->

<div class="home-section-label">UTILIDADES</div>

<div class="home-utils-list">

  <button class="home-util-item" id="openVacio">
    <div class="home-util-left">
      <span class="home-util-ico home-util-cyan">🔬</span>
      <div>
        <div class="home-util-name">Vacío y Carga</div>
        <div class="home-util-sub">Procedimiento paso a paso con timers</div>
      </div>
    </div>
    <span class="home-util-arrow">›</span>
  </button>

  <button class="home-util-item" id="openPresupuesto">
    <div class="home-util-left">
      <span class="home-util-ico home-util-green">📄</span>
      <div>
        <div class="home-util-name">Presupuesto PRO</div>
        <div class="home-util-sub">Generá y enviá presupuestos en PDF</div>
      </div>
    </div>
    <span class="home-util-arrow">›</span>
  </button>

  <button class="home-util-item" id="openSeguridad">
    <div class="home-util-left">
      <span class="home-util-ico home-util-red">🛡️</span>
      <div>
        <div class="home-util-name">Seguridad</div>
        <div class="home-util-sub">Antes de trabajar, leé esto</div>
      </div>
    </div>
    <span class="home-util-arrow">›</span>
  </button>

  <button class="home-util-item" id="openRuidos">
    <div class="home-util-left">
      <span class="home-util-ico home-util-orange">🔊</span>
      <div>
        <div class="home-util-name">Ruidos y vibraciones</div>
        <div class="home-util-sub">Diagnóstico por sonido</div>
      </div>
    </div>
    <span class="home-util-arrow">›</span>
  </button>

  <button class="home-util-item" id="openInstalacion">
    <div class="home-util-left">
      <span class="home-util-ico home-util-yellow">🔧</span>
      <div>
        <div class="home-util-name">Errores de instalación</div>
        <div class="home-util-sub">24 errores frecuentes con solución</div>
      </div>
    </div>
    <span class="home-util-arrow">›</span>
  </button>

  <button class="home-util-item" id="openHistorialHome">
    <div class="home-util-left">
      <span class="home-util-ico home-util-blue">📋</span>
      <div>
        <div class="home-util-name">Historial de búsquedas</div>
        <div class="home-util-sub">Búsquedas recientes en la biblioteca</div>
      </div>
    </div>
    <span class="home-util-arrow">›</span>
  </button>

</div>

<!-- ═══════════════════════════════════════════════ -->
<!-- CONTACTO                                        -->
<!-- ═══════════════════════════════════════════════ -->

<a href="https://wa.me/541168495693" target="_blank" class="home-contact-card">
  <img src="./logo-dyf.png" class="home-contact-logo" alt="D&F"/>
  <div class="home-contact-info">
    <div class="home-contact-label">¿Necesitás servicio técnico?</div>
    <div class="home-contact-tel">📲 +54 11 6849 5693</div>
  </div>
  <span class="home-contact-arrow">›</span>
</a>

<div style="height:32px;"></div>

`;

    this.bindHomeEvents();

  },

  // ===================================================
  // EVENTS — todos los listeners en un solo lugar
  // ===================================================

  bindHomeEvents() {

    const nav = (route) => () => Router.go(route);

    const bindings = {
      // Diagnóstico PRO
      "openSplit":         nav("split"),
      "openCiclica":       nav("ciclica"),
      "openNoFrost":       nav("nofrost"),
      "openComercial":     nav("comercial"),
      // Herramientas (nueva barra)
      "openPT":            nav("pt"),
      "openPSI":           nav("shsc"),
      "openAMP":           nav("amp"),
      "openCapacitor":     nav("capacitor"),
      "openNTC":           nav("ntc"),
      "openCalc":          nav("calc"),
      "openBTU":           nav("btu"),
      "openReferencias":   nav("referencias"),
      "openElectricas":    nav("referencias"),
      // Utilidades
      "openVacio":          nav("vacio"),
      "openPresupuesto":    nav("presupuesto"),
      "openSeguridad":     nav("seguridad"),
      "openRuidos":        nav("ruidos"),
      "openInstalacion":   nav("instalacion"),
      "openHistorialHome": nav("historial"),
      // openDevTools eliminado
      // Legacy
      "openQuick":         nav("referencias"),
      "openReferences":    nav("referencias")
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
