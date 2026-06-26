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
"gases": () => FuncionesTecnicas.render("gases"),
"caneria": () => FuncionesTecnicas.render("caneria"),
"relay": () => FuncionesTecnicas.render("relay"),
"resistencias": () => FuncionesTecnicas.render("resistencias"),
    "shsc":      () => FuncionesTecnicas.render("shsc"),
    "historial":  ()      => Historial.render(),
    "dx-historial": ()    => DxHistorial.render(),
    "seguridad":  ()      => SeguridadPRO.render(),
    "ruidos":     ()      => RuidosDx.render(),
    "instalacion":()      => InstalacionDx.render(),
"btu": () => BTUCalc.render(),
"heladera-temp": () => HeladeraTempDx.render(),
"vacio": () => VacioCarga.render(),
"presupuesto": () => PresupuestoPRO.render(),
"novedades": () => Novedades.render(),
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

    // Inicializar Mentor (carga async el JSON, no bloquea el primer render)
    Mentor.init();

    // Inicializar Novedades — esperamos a que cargue ANTES de pintar
    // el home por primera vez, así el tag de versión aparece de entrada
    if (typeof Novedades !== "undefined") {
      await Novedades.init();
    }

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
  <div class="home-header-right">
    <div class="home-status-pill">
      <span class="home-status-dot"></span>
      <span>Listo</span>
    </div>
    ${typeof Novedades !== "undefined" ? Novedades.renderBadgeHome() : ""}
  </div>
</div>

<!-- Mini manómetros animados — alta y baja presión -->
<div class="home-manom-row">

  <div class="home-manom">
    <svg viewBox="0 0 60 60" class="home-manom-svg">
      <defs>
        <radialGradient id="manomBodyBaja" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#1c2940"/>
          <stop offset="100%" stop-color="#0a1220"/>
        </radialGradient>
        <linearGradient id="manomRimBaja" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5a6d85"/>
          <stop offset="50%" stop-color="#2a3548"/>
          <stop offset="100%" stop-color="#0d1420"/>
        </linearGradient>
      </defs>

      <!-- Aro metálico exterior -->
      <circle cx="30" cy="30" r="28" fill="url(#manomRimBaja)"/>
      <!-- Cuerpo del manómetro -->
      <circle cx="30" cy="30" r="24.5" fill="url(#manomBodyBaja)" stroke="rgba(0,170,255,.4)" stroke-width="1"/>

      <!-- Zona verde (rango normal) -->
      <path d="M 30 30 L 18 11 A 22 22 0 0 1 42 11 Z" fill="#00cc66" opacity=".14"/>
      <!-- Zona roja (sobre-rango) -->
      <path d="M 30 30 L 42 11 A 22 22 0 0 1 48 22 Z" fill="#ff3344" opacity=".12"/>

      <!-- Marcas de escala -->
      <g class="manom-ticks manom-ticks-baja">
        <line x1="30" y1="7"   x2="30" y2="10.5" /><line x1="41.7" y1="9.8" x2="40.2" y2="13" />
        <line x1="50.3" y1="18.3" x2="47" y2="19.8" /><line x1="53" y1="30" x2="49.5" y2="30" />
        <line x1="50.3" y1="41.7" x2="47" y2="40.2" /><line x1="41.7" y1="50.3" x2="40.2" y2="47" />
        <line x1="30" y1="53" x2="30" y2="49.5" /><line x1="18.3" y1="50.3" x2="19.8" y2="47" />
        <line x1="9.8" y1="41.7" x2="13" y2="40.2" /><line x1="7" y1="30" x2="10.5" y2="30" />
        <line x1="9.8" y1="18.3" x2="13" y2="19.8" /><line x1="18.3" y1="9.8" x2="19.8" y2="13" />
      </g>

      <!-- Aguja con contrapeso -->
      <g class="home-manom-needle home-manom-needle-baja">
        <line x1="30" y1="35" x2="30" y2="10" stroke-width="2" stroke-linecap="round"/>
        <line x1="30" y1="30" x2="30" y2="37" stroke-width="3.4" stroke-linecap="round" opacity=".5"/>
      </g>
      <circle cx="30" cy="30" r="3" class="home-manom-pivot"/>
      <circle cx="30" cy="30" r="1.1" fill="#0a1220"/>

      <!-- Brillo superior -->
      <ellipse cx="22" cy="16" rx="11" ry="6" fill="#ffffff" opacity=".05"/>
    </svg>
    <span class="home-manom-unidad home-manom-unidad-baja">PSI</span>
    <span class="home-manom-label home-manom-label-baja">BAJA</span>
  </div>

  <div class="home-manom">
    <svg viewBox="0 0 60 60" class="home-manom-svg">
      <defs>
        <radialGradient id="manomBodyAlta" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#402020"/>
          <stop offset="100%" stop-color="#1a0a0a"/>
        </radialGradient>
        <linearGradient id="manomRimAlta" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8a5a5a"/>
          <stop offset="50%" stop-color="#482828"/>
          <stop offset="100%" stop-color="#200d0d"/>
        </linearGradient>
      </defs>

      <circle cx="30" cy="30" r="28" fill="url(#manomRimAlta)"/>
      <circle cx="30" cy="30" r="24.5" fill="url(#manomBodyAlta)" stroke="rgba(255,68,68,.4)" stroke-width="1"/>

      <path d="M 30 30 L 18 11 A 22 22 0 0 1 36 9.5 Z" fill="#00cc66" opacity=".12"/>
      <path d="M 30 30 L 36 9.5 A 22 22 0 0 1 50.3 18.3 A 22 22 0 0 1 50.3 41.7 Z" fill="#ff3344" opacity=".16"/>

      <g class="manom-ticks manom-ticks-alta">
        <line x1="30" y1="7"   x2="30" y2="10.5" /><line x1="41.7" y1="9.8" x2="40.2" y2="13" />
        <line x1="50.3" y1="18.3" x2="47" y2="19.8" /><line x1="53" y1="30" x2="49.5" y2="30" />
        <line x1="50.3" y1="41.7" x2="47" y2="40.2" /><line x1="41.7" y1="50.3" x2="40.2" y2="47" />
        <line x1="30" y1="53" x2="30" y2="49.5" /><line x1="18.3" y1="50.3" x2="19.8" y2="47" />
        <line x1="9.8" y1="41.7" x2="13" y2="40.2" /><line x1="7" y1="30" x2="10.5" y2="30" />
        <line x1="9.8" y1="18.3" x2="13" y2="19.8" /><line x1="18.3" y1="9.8" x2="19.8" y2="13" />
      </g>

      <g class="home-manom-needle home-manom-needle-alta">
        <line x1="30" y1="35" x2="30" y2="10" stroke-width="2" stroke-linecap="round"/>
        <line x1="30" y1="30" x2="30" y2="37" stroke-width="3.4" stroke-linecap="round" opacity=".5"/>
      </g>
      <circle cx="30" cy="30" r="3" class="home-manom-pivot"/>
      <circle cx="30" cy="30" r="1.1" fill="#1a0a0a"/>

      <ellipse cx="22" cy="16" rx="11" ry="6" fill="#ffffff" opacity=".05"/>
    </svg>
    <span class="home-manom-unidad home-manom-unidad-alta">PSI</span>
    <span class="home-manom-label home-manom-label-alta">ALTA</span>
  </div>

  <div class="home-pump">
    <svg viewBox="0 0 60 60" class="home-pump-svg">
      <defs>
        <linearGradient id="pumpBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3a4456"/>
          <stop offset="55%" stop-color="#222b3a"/>
          <stop offset="100%" stop-color="#11161f"/>
        </linearGradient>
        <linearGradient id="pumpTank" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1a2230"/>
          <stop offset="50%" stop-color="#2e3a4d"/>
          <stop offset="100%" stop-color="#161d28"/>
        </linearGradient>
      </defs>

      <!-- Patas -->
      <rect x="14" y="50" width="5" height="4" rx="1" fill="#0a0d12"/>
      <rect x="41" y="50" width="5" height="4" rx="1" fill="#0a0d12"/>

      <!-- Tanque/base cilíndrica de la bomba -->
      <rect x="10" y="32" width="40" height="19" rx="5" fill="url(#pumpTank)" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
      <ellipse cx="30" cy="32" rx="20" ry="3.5" fill="#384458"/>

      <!-- Cuerpo motor (vibra) -->
      <g class="home-pump-motor">
        <rect x="14" y="13" width="32" height="21" rx="4" fill="url(#pumpBody)" stroke="rgba(0,217,255,.25)" stroke-width="1"/>
        <!-- Rejillas de ventilación -->
        <line x1="19" y1="18" x2="19" y2="29" stroke="rgba(0,0,0,.4)" stroke-width="1.4"/>
        <line x1="23" y1="18" x2="23" y2="29" stroke="rgba(0,0,0,.4)" stroke-width="1.4"/>
        <line x1="27" y1="18" x2="27" y2="29" stroke="rgba(0,0,0,.4)" stroke-width="1.4"/>
        <!-- Etiqueta -->
        <rect x="31" y="20" width="12" height="7" rx="1.5" fill="rgba(0,217,255,.12)" stroke="rgba(0,217,255,.3)" stroke-width=".6"/>
        <!-- Pata de apoyo superior -->
        <circle cx="18" cy="13" r="1.6" fill="#0a0d12"/>
        <circle cx="42" cy="13" r="1.6" fill="#0a0d12"/>
      </g>

      <!-- Manguera hacia el manómetro de baja (izquierda) -->
      <path class="home-pump-hose" d="M 10 40 Q 0 40 0 34" fill="none" stroke="#2db8ff" stroke-width="2.4" stroke-linecap="round"/>

      <!-- Líneas de vacío / succión (animadas, salen y se desvanecen) -->
      <g class="home-pump-vac">
        <circle cx="30" cy="8" r="1.3"/>
        <circle cx="25" cy="6" r="1"/>
        <circle cx="35" cy="6" r="1"/>
      </g>
    </svg>
    <span class="home-pump-unidad">μ</span>
    <span class="home-pump-label">VACÍO</span>
  </div>

  <div class="home-split">
    <svg viewBox="0 0 70 50" class="home-split-svg">
      <defs>
        <linearGradient id="splitBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f4f7fb"/>
          <stop offset="60%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#cbd3df"/>
        </linearGradient>
      </defs>

      <!-- Soportes de pared -->
      <rect x="6" y="6" width="5" height="3" fill="#3a4456"/>
      <rect x="59" y="6" width="5" height="3" fill="#3a4456"/>

      <!-- Carcasa del split -->
      <rect x="3" y="8" width="64" height="20" rx="7" fill="url(#splitBody)" stroke="rgba(0,0,0,.12)" stroke-width=".6"/>

      <!-- Panel frontal / rejilla -->
      <rect x="7" y="13" width="56" height="2" rx="1" fill="rgba(120,140,165,.4)"/>
      <rect x="7" y="17" width="56" height="2" rx="1" fill="rgba(120,140,165,.4)"/>
      <rect x="7" y="21" width="56" height="2" rx="1" fill="rgba(120,140,165,.4)"/>

      <!-- LED indicador (parpadea) -->
      <circle cx="59" cy="11" r="1.4" class="home-split-led"/>

      <!-- Lamas de salida de aire (se abren/cierran levemente) -->
      <g class="home-split-lamas">
        <rect x="6" y="29" width="58" height="4" rx="2" fill="#b8c2d1"/>
        <line x1="10" y1="31" x2="60" y2="31" stroke="#8a96a8" stroke-width=".6"/>
      </g>

      <!-- Flujo de aire frío saliendo (líneas onduladas animadas) -->
      <g class="home-split-flow">
        <path d="M 14 36 Q 18 40 14 44" />
        <path d="M 30 36 Q 34 40 30 44" />
        <path d="M 46 36 Q 50 40 46 44" />
        <path d="M 58 36 Q 62 40 58 44" />
      </g>
    </svg>
    <span class="home-split-label">FUNCIONANDO</span>
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

  <button class="home-tool-btn" id="openTemp">
    <span class="home-tool-ico">🌡️</span>
    <span class="home-tool-label">Temperatura</span>
  </button>

  <button class="home-tool-btn" id="openGases">
    <span class="home-tool-ico">⚗️</span>
    <span class="home-tool-label">Gases</span>
  </button>

  <button class="home-tool-btn" id="openCaneria">
    <span class="home-tool-ico">🔧</span>
    <span class="home-tool-label">Cañería</span>
  </button>

  <button class="home-tool-btn" id="openCalc">
    <span class="home-tool-ico">🧮</span>
    <span class="home-tool-label">Calculadoras</span>
  </button>

  <button class="home-tool-btn" id="openBTU">
    <span class="home-tool-ico">📐</span>
    <span class="home-tool-label">BTU</span>
  </button>

  <button class="home-tool-btn" id="openRelay">
    <span class="home-tool-ico">🔴</span>
    <span class="home-tool-label">Relay / PTC</span>
  </button>

  <button class="home-tool-btn" id="openResistencias">
    <span class="home-tool-ico">🌀</span>
    <span class="home-tool-label">Resistencias</span>
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

  <button class="home-util-item" id="openCatalogoAyP">
    <div class="home-util-left">
      <span class="home-util-ico home-util-green">🛒</span>
      <div>
        <div class="home-util-name">Catálogo A&P Refrigeración</div>
        <div class="home-util-sub">Precios de repuestos y kits de instalación</div>
      </div>
    </div>
    <span class="home-util-arrow">↗</span>
  </button>

  <button class="home-util-item" id="openPreciosCAR">
    <div class="home-util-left">
      <span class="home-util-ico home-util-orange">💵</span>
      <div>
        <div class="home-util-name">Precios sugeridos C.A.R.</div>
        <div class="home-util-sub">Mano de obra de referencia — Cámara Argentina de Refrigeración</div>
      </div>
    </div>
    <span class="home-util-arrow">↗</span>
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
      "openTemp":          nav("temp"),
      "openGases":         nav("gases"),
      "openCaneria":       nav("caneria"),
      "openCalc":          nav("calc"),
      "openBTU":           nav("btu"),
      "openRelay":         nav("relay"),
      "openResistencias":  nav("resistencias"),
      "openReferencias":   nav("referencias"),
      "openElectricas":    nav("referencias"),
      // Utilidades
      "openVacio":          nav("vacio"),
      "openSeguridad":     nav("seguridad"),
      "openRuidos":        nav("ruidos"),
      "openInstalacion":   nav("instalacion"),
      "openHistorialHome": nav("historial"),
      "openCatalogoAyP":    () => window.open("https://catalogoayp.vercel.app", "_blank"),
      "openPreciosCAR":     () => window.open("https://www.camaraargentinaderefrigeracion.com/precios-sugeridos-2019-2020", "_blank"),
      "openNovedades":      nav("novedades"),
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
