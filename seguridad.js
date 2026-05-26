// =====================================================
// HVAC PRO ARGENTINA
// MODULES/SEGURIDAD/SEGURIDAD.JS
// =====================================================

const SeguridadPRO = {

  data: null,
  activeTab: "checklist",
  checklist: {},

  async init() {
    if (this.data) return;
    try {
      const res = await fetch(`./seguridad.json`);
      this.data  = await res.json();
    } catch(e) { console.error("Error cargando seguridad.json:", e); }
    try {
      this.checklist = JSON.parse(localStorage.getItem("hvac_checklist") || "{}");
    } catch { this.checklist = {}; }
  },

  async render(tab = "checklist") {
    await this.init();
    this.activeTab = tab;
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="segBack">←</div>
  <div>
    <h1 class="hvac-title">🛡️ Seguridad</h1>
    <p class="hvac-subtitle">Antes de trabajar, leé esto</p>
  </div>
</header>
<div class="ft-tabs">
  <button class="ft-tab ${tab==="checklist"?"active":""}"    data-tab="checklist">✅ Checklist</button>
  <button class="ft-tab ${tab==="gases"?"active":""}"        data-tab="gases">💨 Gases</button>
  <button class="ft-tab ${tab==="electrica"?"active":""}"    data-tab="electrica">⚡ Eléctrica</button>
  <button class="ft-tab ${tab==="herramientas"?"active":""}" data-tab="herramientas">🔧 Herramientas</button>
  <button class="ft-tab ${tab==="auxilios"?"active":""}"     data-tab="auxilios">🚑 Auxilios</button>
</div>
<div id="seg-content">${this.renderTab(tab)}</div>`;

    this.bindEvents();
  },

  renderTab(tab) {
    switch(tab) {
      case "checklist":    return this.renderChecklist();
      case "gases":        return this.renderGases();
      case "electrica":    return this.renderElectrica();
      case "herramientas": return this.renderHerramientas();
      case "auxilios":     return this.renderAuxilios();
      default:             return this.renderChecklist();
    }
  },

  // ─── CHECKLIST ──────────────────────────────────

  renderChecklist() {
    const ch = this.data?.checklist_previa;
    if (!ch) return "";
    const total    = ch.items.length;
    const marcados = ch.items.filter(i => this.checklist[i.id]).length;
    const pct      = Math.round((marcados / total) * 100);
    const listo    = marcados === total;
    const barColor = listo ? "#00ff88" : pct > 60 ? "#ff9b42" : "#ff5252";

    return `
<div class="seg-checklist-header">
  <div class="seg-checklist-titulo">${ch.titulo}</div>
  <div class="seg-checklist-desc">${ch.descripcion}</div>
  <div class="seg-progress-wrap">
    <div class="seg-progress-bar" style="width:${pct}%;background:${barColor}"></div>
  </div>
  <div class="seg-progress-txt" style="color:${barColor};">
    ${marcados}/${total} — ${listo ? "✅ Listo para trabajar" : "Completá el checklist antes de empezar"}
  </div>
</div>
<div class="seg-check-list">
  ${ch.items.map(item => `
  <label class="seg-check-item ${this.checklist[item.id] ? "seg-check-done" : ""}">
    <input type="checkbox" class="seg-check-input" data-id="${item.id}" ${this.checklist[item.id] ? "checked" : ""}>
    <span class="seg-check-texto">${item.texto}</span>
  </label>`).join("")}
</div>
<div style="display:flex;gap:8px;padding:12px 16px 24px;flex-wrap:wrap;">
  <button class="seg-reset-btn" id="segResetChecklist">↺ Reiniciar</button>
  ${listo ? `<div class="seg-listo-badge">✅ Podés empezar con seguridad</div>` : ""}
</div>`;
  },

  // ─── GASES ──────────────────────────────────────

  renderGases() {
    const cat = this.data?.categorias?.find(c => c.id === "gases");
    if (!cat) return "";
    const colorMap = { rojo: "#ff5252", naranja: "#ff9b42", verde: "#00d9ff" };

    return cat.gases.map(g => {
      const color = colorMap[g.color_alerta] || "#ff9b42";
      const badge = g.color_alerta === "rojo" ? "🔴 RIESGO ALTO"
                  : g.color_alerta === "naranja" ? "🟠 RIESGO MEDIO"
                  : "🟢 RIESGO BAJO";
      return `
<div class="seg-gas-card">
  <div class="seg-gas-header" style="border-left-color:${color};">
    <div style="flex:1;">
      <div class="seg-gas-nombre">${g.nombre}</div>
      <div class="seg-gas-clasif" style="color:${color};">${g.clasificacion}</div>
    </div>
    <div class="seg-gas-badge" style="background:${color}20;color:${color};border:1px solid ${color}40;">${badge}</div>
  </div>
  <div class="seg-gas-meta">
    <div class="seg-gas-meta-item">
      <span class="seg-gas-meta-label">📍 Presente en</span>
      <span class="seg-gas-meta-val">${g.presente_en}</span>
    </div>
    <div class="seg-gas-meta-item">
      <span class="seg-gas-meta-label">⚖️ Carga típica</span>
      <span class="seg-gas-meta-val">${g.carga_tipica}</span>
    </div>
  </div>
  <div class="seg-reglas-titulo">📋 Reglas:</div>
  ${g.reglas.map((r, i) => `
  <div class="seg-regla">
    <span class="seg-regla-num">${i+1}</span>
    <span class="seg-regla-txt">${r}</span>
  </div>`).join("")}
  <div class="seg-fuga-card">
    <div class="seg-fuga-titulo">🚨 Si hay fuga:</div>
    <div class="seg-fuga-txt">${g.que_hacer_si_fuga}</div>
  </div>
  <div class="seg-no-hacer-titulo">❌ Nunca:</div>
  ${g.que_no_hacer.map(n => `<div class="seg-no-hacer">✕ ${n}</div>`).join("")}
</div>`;
    }).join("");
  },

  // ─── HELPERS ────────────────────────────────────

  renderElectrica() {
    return this.renderItemsCat(this.data?.categorias?.find(c => c.id === "electrica"));
  },

  renderHerramientas() {
    return this.renderItemsCat(this.data?.categorias?.find(c => c.id === "herramientas"));
  },

  renderAuxilios() {
    const cat = this.data?.categorias?.find(c => c.id === "primeros_auxilios");
    const telHTML = `
<div class="seg-tel-card">
  <div class="seg-tel-titulo">📞 Emergencias Argentina</div>
  <div class="seg-tel-grid">
    <a href="tel:107" class="seg-tel-btn">📱 107 — SAME</a>
    <a href="tel:100" class="seg-tel-btn seg-tel-bomberos">🚒 100 — Bomberos</a>
    <a href="tel:911" class="seg-tel-btn seg-tel-policia">🚔 911 — Emergencias</a>
  </div>
</div>`;
    return telHTML + this.renderItemsCat(cat);
  },

  renderItemsCat(cat) {
    if (!cat) return "";
    const nivelColor = { "CRÍTICO":"#ff5252","URGENTE":"#ff5252","ALTO":"#ff9b42","MEDIO":"#ffc800","BAJO":"#00d9ff" };
    return (cat.items || []).map(item => {
      const color = nivelColor[item.nivel] || "#ff9b42";
      return `
<div class="seg-item-card">
  <div class="seg-item-header">
    <div class="seg-item-titulo">${item.titulo}</div>
    <div class="seg-item-nivel" style="color:${color};border:1px solid ${color}40;background:${color}15;">${item.nivel}</div>
  </div>
  ${item.reglas.map((r, i) => `
  <div class="seg-regla">
    <span class="seg-regla-num" style="background:${color}20;color:${color};">${i+1}</span>
    <span class="seg-regla-txt">${r}</span>
  </div>`).join("")}
</div>`;
    }).join("");
  },

  // ─── EVENTS ─────────────────────────────────────

  bindEvents() {
    document.getElementById("segBack")?.addEventListener("click", () => Router.back());

    document.querySelectorAll(".ft-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll(".ft-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("seg-content").innerHTML = this.renderTab(this.activeTab);
        this.bindContentEvents();
      });
    });

    this.bindContentEvents();
  },

  bindContentEvents() {
    document.querySelectorAll(".seg-check-input").forEach(chk => {
      chk.addEventListener("change", () => {
        this.checklist[chk.dataset.id] = chk.checked;
        localStorage.setItem("hvac_checklist", JSON.stringify(this.checklist));
        document.getElementById("seg-content").innerHTML = this.renderChecklist();
        this.bindContentEvents();
      });
    });

    document.getElementById("segResetChecklist")?.addEventListener("click", () => {
      if (confirm("¿Reiniciar el checklist?")) {
        this.checklist = {};
        localStorage.removeItem("hvac_checklist");
        document.getElementById("seg-content").innerHTML = this.renderChecklist();
        this.bindContentEvents();
      }
    });
  }

};
