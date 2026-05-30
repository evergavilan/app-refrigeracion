// =====================================================
// HVAC PRO ARGENTINA
// INSTALACION.JS — Errores comunes de instalación
// =====================================================

const InstalacionDx = {

  data: null,
  activeCategoria: "cañerias",
  activeTab: "errores",
  checklist: {},

  async init() {
    if (this.data) return;
    try {
      const res  = await fetch("./instalacion.json");
      this.data  = await res.json();
    } catch(e) { console.error("Error cargando instalacion.json:", e); }
    try {
      this.checklist = JSON.parse(localStorage.getItem("hvac_checklist_inst") || "{}");
    } catch { this.checklist = {}; }
  },

  async render(tab = "errores") {
    await this.init();
    this.activeTab = tab;
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="instBack">←</div>
  <div>
    <h1 class="hvac-title">🔧 Instalación</h1>
    <p class="hvac-subtitle">Errores frecuentes</p>
  </div>
</header>

<div class="ft-tabs">
  <button class="ft-tab ${tab==="errores"?"active":""}"   data-tab="errores">⚠️ Errores</button>
  <button class="ft-tab ${tab==="checklist"?"active":""}" data-tab="checklist">✅ Checklist</button>
</div>

<div id="inst-content">
  ${this.renderTab(tab)}
</div>`;

    this.bindEvents();
  },

  renderTab(tab) {
    return tab === "checklist" ? this.renderChecklist() : this.renderErrores();
  },

  // ═══════════════════════════════════════════════
  // ERRORES
  // ═══════════════════════════════════════════════

  renderErrores() {
    const cats = this.data?.categorias || [];
    const frecuenciaColor = {
      "MUY FRECUENTE": "#ff5252",
      "FRECUENTE":     "#ff9b42",
      "MENOS FRECUENTE": "#ffc800"
    };

    const catsHTML = `
<div class="inst-cats">
  ${cats.map(c => `
  <button class="inst-cat-btn ${this.activeCategoria===c.id?"active":""}" data-cat="${c.id}">
    ${c.icono} ${c.titulo}
  </button>`).join("")}
</div>`;

    const cat = cats.find(c => c.id === this.activeCategoria) || cats[0];
    if (!cat) return catsHTML;

    const erroresHTML = cat.errores.map(e => {
      const color = frecuenciaColor[e.frecuencia] || "#ff9b42";
      return `
<div class="inst-card">

  <div class="inst-card-header" style="border-left-color:${color};">
    <div style="flex:1;">
      <div class="inst-card-nombre">${e.nombre}</div>
      <div class="inst-frecuencia" style="color:${color};">
        ${e.frecuencia}
      </div>
    </div>
  </div>

  <div class="inst-consecuencia">
    ⚠️ <strong>Consecuencia:</strong> ${e.consecuencia}
  </div>

  <div class="inst-section-titulo">🔍 Cómo reconocerlo en campo:</div>
  ${e.como_reconocerlo.map((r, i) => `
  <div class="inst-item">
    <span class="inst-item-bullet" style="color:${color};">•</span>
    <span class="inst-item-txt">${r}</span>
  </div>`).join("")}

  <div class="inst-section-titulo">🔧 Cómo evitarlo / corregirlo:</div>
  ${e.como_evitarlo.map((r, i) => `
  <div class="inst-paso">
    <span class="inst-paso-num">${i+1}</span>
    <span class="inst-paso-txt">${r}</span>
  </div>`).join("")}

  <div class="inst-mentor-card">
    <span class="inst-mentor-avatar">👨‍🔧</span>
    <div>
      <div class="inst-mentor-label">El Mentor:</div>
      <div class="inst-mentor-frase">"${e.mentor}"</div>
    </div>
  </div>

</div>`;
    }).join("");

    return catsHTML + erroresHTML;
  },

  // ═══════════════════════════════════════════════
  // CHECKLIST DE INSTALACIÓN
  // ═══════════════════════════════════════════════

  renderChecklist() {
    const ch    = this.data?.checklist_instalacion;
    if (!ch) return "";

    const total    = ch.items.length;
    const marcados = ch.items.filter(i => this.checklist[i.id]).length;
    const pct      = Math.round((marcados / total) * 100);
    const listo    = marcados === total;
    const barColor = listo ? "#00ff88" : pct > 70 ? "#ff9b42" : "#ff5252";

    // Agrupar por categoría
    const grupos = {};
    ch.items.forEach(item => {
      if (!grupos[item.categoria]) grupos[item.categoria] = [];
      grupos[item.categoria].push(item);
    });

    return `
<div class="seg-checklist-header">
  <div class="seg-checklist-titulo">${ch.titulo}</div>
  <div class="seg-progress-wrap">
    <div class="seg-progress-bar" style="width:${pct}%;background:${barColor}"></div>
  </div>
  <div class="seg-progress-txt" style="color:${barColor};">
    ${marcados}/${total} — ${listo ? "✅ Instalación completa y verificada" : `Faltan ${total - marcados} verificaciones`}
  </div>
</div>

<div class="seg-check-list">
  ${Object.entries(grupos).map(([cat, items]) => `
  <div class="inst-grupo-label">${cat}</div>
  ${items.map(item => `
  <label class="seg-check-item ${this.checklist[item.id] ? "seg-check-done" : ""}">
    <input type="checkbox" class="seg-check-input inst-check" data-id="${item.id}" ${this.checklist[item.id] ? "checked" : ""}>
    <span class="seg-check-texto">${item.texto}</span>
  </label>`).join("")}`).join("")}
</div>

<div style="display:flex;gap:8px;padding:12px 16px 24px;flex-wrap:wrap;">
  <button class="seg-reset-btn" id="instResetChecklist">↺ Nueva instalación</button>
  ${listo ? `<div class="seg-listo-badge">✅ Lista para entregar al cliente</div>` : ""}
</div>`;
  },

  // ═══════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════

  bindEvents() {
    document.getElementById("instBack")?.addEventListener("click", () => Router.back());

    // Tabs principales
    document.querySelectorAll(".ft-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll(".ft-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("inst-content").innerHTML = this.renderTab(this.activeTab);
        this.bindContentEvents();
      });
    });

    this.bindContentEvents();
  },

  bindContentEvents() {
    // Categorías de errores
    document.querySelectorAll(".inst-cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeCategoria = btn.dataset.cat;
        document.querySelectorAll(".inst-cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("inst-content").innerHTML = this.renderErrores();
        this.bindContentEvents();
      });
    });

    // Checklist
    document.querySelectorAll(".inst-check").forEach(chk => {
      chk.addEventListener("change", () => {
        this.checklist[chk.dataset.id] = chk.checked;
        localStorage.setItem("hvac_checklist_inst", JSON.stringify(this.checklist));
        document.getElementById("inst-content").innerHTML = this.renderChecklist();
        this.bindContentEvents();
      });
    });

    // Reset checklist
    document.getElementById("instResetChecklist")?.addEventListener("click", () => {
      if (confirm("¿Reiniciar el checklist para una nueva instalación?")) {
        this.checklist = {};
        localStorage.removeItem("hvac_checklist_inst");
        document.getElementById("inst-content").innerHTML = this.renderChecklist();
        this.bindContentEvents();
      }
    });
  }

};
