// =====================================================
// HVAC PRO ARGENTINA
// RUIDOS.JS — Diagnóstico por ruidos y vibraciones
// =====================================================

const RuidosDx = {

  data: null,
  activeCategoria: "compresor",
  activeEquipo: "split",

  async init() {
    if (this.data) return;
    try {
      const res  = await fetch("./ruidos.json");
      this.data  = await res.json();
    } catch(e) { console.error("Error cargando ruidos.json:", e); }
  },

  async render() {
    await this.init();
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="ruidosBack">←</div>
  <div>
    <h1 class="hvac-title">🔊 Diagnóstico</h1>
    <p class="hvac-subtitle">Ruidos y vibraciones</p>
  </div>
</header>

<!-- FILTRO POR EQUIPO -->
<div class="ruidos-equipo-tabs">
  <button class="ruidos-eq-btn ${this.activeEquipo==="split"?"active":""}"     data-eq="split">❄️ Split</button>
  <button class="ruidos-eq-btn ${this.activeEquipo==="heladera"?"active":""}"  data-eq="heladera">🧊 Heladera</button>
  <button class="ruidos-eq-btn ${this.activeEquipo==="comercial"?"active":""}" data-eq="comercial">🏭 Comercial</button>
</div>

<!-- GUÍA RÁPIDA -->
${this.renderGuiaRapida()}

<!-- CATEGORÍAS -->
${this.renderCategorias()}

<!-- RUIDOS -->
<div id="ruidos-content">
  ${this.renderRuidos()}
</div>`;

    this.bindEvents();
  },

  renderGuiaRapida() {
    const g = this.data?.guia_rapida;
    if (!g) return "";
    return `
<div class="ruidos-guia-card">
  <div class="ruidos-guia-titulo">🔍 ${g.titulo}</div>
  ${g.pasos.map((p, i) => `
  <div class="ruidos-guia-paso">
    <span class="ruidos-guia-num">${i+1}</span>
    <span class="ruidos-guia-txt">${p}</span>
  </div>`).join("")}
</div>`;
  },

  renderCategorias() {
    const cats = this.data?.categorias?.filter(c =>
      c.equipo.includes(this.activeEquipo)
    ) || [];

    return `
<div class="ruidos-cats">
  ${cats.map(c => `
  <button class="ruidos-cat-btn ${this.activeCategoria===c.id?"active":""}" data-cat="${c.id}">
    ${c.icono} ${c.titulo}
  </button>`).join("")}
</div>`;
  },

  renderRuidos() {
    const cat = this.data?.categorias?.find(c =>
      c.id === this.activeCategoria && c.equipo.includes(this.activeEquipo)
    );

    if (!cat) {
      // Si la categoría activa no aplica al equipo seleccionado, mostrar la primera que sí aplica
      const primera = this.data?.categorias?.find(c => c.equipo.includes(this.activeEquipo));
      if (primera) {
        this.activeCategoria = primera.id;
        return this.renderRuidos();
      }
      return "";
    }

    const urgenciaColor = {
      "CRÍTICO": "#ff5252",
      "ALTO":    "#ff9b42",
      "MEDIO":   "#ffc800",
      "BAJO":    "#00d9ff",
      "NORMAL":  "#00ff88"
    };

    return cat.ruidos.map(r => {
      const color = urgenciaColor[r.urgencia] || "#ff9b42";
      return `
<div class="ruidos-card">

  <div class="ruidos-card-header" style="border-left-color:${color};">
    <div>
      <div class="ruidos-card-nombre">${r.nombre}</div>
      <div class="ruidos-card-desc">${r.descripcion}</div>
    </div>
    <div class="ruidos-urgencia" style="background:${color}20;color:${color};border-color:${color}40;">
      ${r.urgencia}
    </div>
  </div>

  <div class="ruidos-section-titulo">🔍 Causas posibles:</div>
  ${r.causas.map((c, i) => `
  <div class="ruidos-causa">
    <span class="ruidos-causa-num" style="background:${color}20;color:${color};">${i+1}</span>
    <span class="ruidos-causa-txt">${c}</span>
  </div>`).join("")}

  <div class="ruidos-section-titulo" style="margin-top:12px;">✅ Qué hacer:</div>
  ${r.que_hacer.map((q, i) => `
  <div class="ruidos-paso">
    <span class="ruidos-paso-num">${i+1}</span>
    <span class="ruidos-paso-txt">${q}</span>
  </div>`).join("")}

  <div class="ruidos-mentor-card">
    <span class="ruidos-mentor-avatar">👨‍🔧</span>
    <div>
      <div class="ruidos-mentor-label">El Mentor:</div>
      <div class="ruidos-mentor-frase">"${r.mentor}"</div>
    </div>
  </div>

</div>`;
    }).join("");
  },

  bindEvents() {
    document.getElementById("ruidosBack")?.addEventListener("click", () => Router.back());

    // Filtro equipo
    document.querySelectorAll(".ruidos-eq-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeEquipo = btn.dataset.eq;
        document.querySelectorAll(".ruidos-eq-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelector(".ruidos-cats").outerHTML = this.renderCategorias();
        document.getElementById("ruidos-content").innerHTML = this.renderRuidos();
        this.bindCatEvents();
      });
    });

    this.bindCatEvents();
  },

  bindCatEvents() {
    document.querySelectorAll(".ruidos-cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeCategoria = btn.dataset.cat;
        document.querySelectorAll(".ruidos-cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("ruidos-content").innerHTML = this.renderRuidos();
      });
    });
  }

};
