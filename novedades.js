// =====================================================
// HVAC PRO ARGENTINA
// NOVEDADES.JS — Changelog y versión visible
// =====================================================

const Novedades = {

  KEY_VISTA: "hvac_ultima_version_vista",
  data: null,

  async init() {
    if (this.data) return;
    try {
      const res = await fetch("./changelog.json");
      this.data = await res.json();
    } catch (e) {
      console.warn("Novedades: no se pudo cargar changelog.json", e);
    }
  },

  // ¿Hay una versión nueva que el usuario no vio?
  hayNovedad() {
    if (!this.data) return false;
    const vista = localStorage.getItem(this.KEY_VISTA);
    return vista !== this.data.actual;
  },

  marcarVista() {
    if (!this.data) return;
    localStorage.setItem(this.KEY_VISTA, this.data.actual);
  },

  // Badge para mostrar en el home (punto rojo en el ícono de versión)
  renderBadgeHome() {
    if (!this.data) return "";
    const v = this.data.actual;
    const nuevo = this.hayNovedad();
    return `
<button class="home-version-tag" id="openNovedades">
  <span class="home-version-txt">v${v}</span>
  ${nuevo ? `<span class="home-version-dot"></span>` : ""}
</button>`;
  },

  // ═══════════════════════════════════════════════
  // RENDER PRINCIPAL — pantalla de novedades
  // ═══════════════════════════════════════════════
  async render() {
    await this.init();
    const app = document.getElementById("app");
    if (!app || !this.data) return;

    this.marcarVista();

    const tipoConfig = {
      nuevo:      { label: "NUEVO",      color: "#00d9ff", bg: "rgba(0,217,255,.12)",  ico: "✨" },
      mejora:     { label: "MEJORA",     color: "#44cc88", bg: "rgba(0,200,100,.12)",  ico: "⚡" },
      correccion: { label: "CORRECCIÓN", color: "#ff9b42", bg: "rgba(255,155,66,.12)", ico: "🔧" },
      eliminado:  { label: "ELIMINADO",  color: "#ff5252", bg: "rgba(255,80,80,.12)",  ico: "🗑️" }
    };

    const versionesHTML = this.data.versiones.map((v, i) => `
<div class="nov-version-card ${i === 0 ? 'nov-version-actual' : ''}">

  <div class="nov-version-header">
    <div class="nov-version-num">
      <span class="nov-version-badge">v${v.version}</span>
      ${i === 0 ? `<span class="nov-actual-tag">VERSIÓN ACTUAL</span>` : ""}
    </div>
    <span class="nov-version-fecha">${v.fecha}</span>
  </div>

  <div class="nov-version-titulo">${v.titulo}</div>

  <div class="nov-cambios-list">
    ${v.cambios.map(c => {
      const t = tipoConfig[c.tipo] || tipoConfig.mejora;
      return `
    <div class="nov-cambio-item">
      <span class="nov-cambio-badge" style="color:${t.color};background:${t.bg}">${t.ico} ${t.label}</span>
      <span class="nov-cambio-txt">${c.texto}</span>
    </div>`;
    }).join("")}
  </div>

</div>`).join("");

    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="novBack">←</div>
  <div>
    <h1 class="hvac-title">🆕 Novedades</h1>
    <p class="hvac-subtitle">Historial de versiones y mejoras</p>
  </div>
</header>

<div class="nov-intro-card">
  <div class="nov-intro-ico">📱</div>
  <div class="nov-intro-txt">
    <div class="nov-intro-version">Versión instalada: <strong>v${this.data.actual}</strong></div>
    <div class="nov-intro-sub">Cada actualización mejora los diagnósticos, agrega herramientas o corrige errores reportados.</div>
  </div>
</div>

${versionesHTML}

<div style="height:24px"></div>`;

    document.getElementById("novBack")?.addEventListener("click", () => Router.back());
  }

};
