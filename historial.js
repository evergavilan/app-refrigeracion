// =====================================================
// HVAC PRO ARGENTINA
// CORE/HISTORIAL.JS — Historial de búsquedas + export
// =====================================================

const Historial = {

  MAX_ITEMS: 100,
  STORAGE_KEY: "hvac_historial",

  // ═══════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════

  getAll() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
      // Sanear entradas viejas o corruptas
      return raw.filter(item =>
        item &&
        typeof item.query === "string" &&
        item.query.trim().length > 0
      ).map(item => ({
        ...item,
        tab:   item.tab   || "general",
        query: item.query.trim()
      }));
    } catch { return []; }
  },

  add(query, tab, resultCount) {
    // Guard: query debe ser string no vacío
    if (!query || typeof query !== "string" || query.trim().length < 2) return;
    const q = query.trim();

    const all = this.getAll();

    // Evitar duplicados consecutivos
    if (all.length && all[0].query?.toLowerCase() === q.toLowerCase()) return;

    all.unshift({
      query:       q,
      tab:         tab || "general",
      resultCount: resultCount ?? null,
      fecha:       new Date().toISOString()
    });

    // Mantener máximo
    const trimmed = all.slice(0, this.MAX_ITEMS);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
  },

  remove(index) {
    const all = this.getAll();
    all.splice(index, 1);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  // ═══════════════════════════════════════════════
  // FORMATO FECHA
  // ═══════════════════════════════════════════════

  formatFecha(iso) {
    const d = new Date(iso);
    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);

    const hora = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    if (d.toDateString() === hoy.toDateString())  return `Hoy ${hora}`;
    if (d.toDateString() === ayer.toDateString()) return `Ayer ${hora}`;
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) + ` ${hora}`;
  },

  // ═══════════════════════════════════════════════
  // EXPORT CSV (descarga premium)
  // ═══════════════════════════════════════════════

  exportCSV() {
    const all = this.getAll();
    if (!all.length) return null;

    const header = "Fecha,Hora,Búsqueda,Sección,Resultados\n";
    const rows = all.map(item => {
      const d    = new Date(item.fecha);
      const fecha = d.toLocaleDateString("es-AR");
      const hora  = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      const query = `"${item.query.replace(/"/g, '""')}"`;
      const tab   = `"${this.tabLabel(item.tab)}"`;
      return `${fecha},${hora},${query},${tab},${item.resultCount ?? "-"}`;
    }).join("\n");

    return header + rows;
  },

  exportTXT() {
    const all = this.getAll();
    if (!all.length) return null;

    const lineas = [
      "EVER PRO ARGENTINA — Historial de búsquedas",
      `Exportado: ${new Date().toLocaleString("es-AR")}`,
      "=".repeat(50),
      ""
    ];

    // Agrupar por fecha
    const grupos = {};
    all.forEach(item => {
      const d = new Date(item.fecha);
      const key = d.toLocaleDateString("es-AR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(item);
    });

    Object.entries(grupos).forEach(([fecha, items]) => {
      lineas.push(`📅 ${fecha.toUpperCase()}`);
      lineas.push("-".repeat(40));
      items.forEach(item => {
        const hora = new Date(item.fecha).toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
        const res  = item.resultCount != null ? ` (${item.resultCount} resultados)` : "";
        lineas.push(`  ${hora}  🔍 "${item.query}"  — ${this.tabLabel(item.tab)}${res}`);
      });
      lineas.push("");
    });

    lineas.push("=".repeat(50));
    lineas.push(`Total de búsquedas: ${all.length}`);

    return lineas.join("\n");
  },

  tabLabel(tab) {
    const labels = {
      teoria:          "Teoría",
      procedimientos:  "Procedimientos",
      errores:         "Códigos de error",
      circuitos:       "Circuitos"
    };
    return labels[tab] || tab || "General";
  },

  // ═══════════════════════════════════════════════
  // DESCARGA DE ARCHIVO
  // ═══════════════════════════════════════════════

  download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  downloadCSV() {
    const content = this.exportCSV();
    if (!content) return false;
    const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
    this.download(content, `hvac-historial-${fecha}.csv`, "text/csv;charset=utf-8;");
    return true;
  },

  downloadTXT() {
    const content = this.exportTXT();
    if (!content) return false;
    const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
    this.download(content, `hvac-historial-${fecha}.txt`, "text/plain;charset=utf-8;");
    return true;
  },

  // ═══════════════════════════════════════════════
  // RENDER — PANTALLA COMPLETA
  // ═══════════════════════════════════════════════

  render() {
    const app = document.getElementById("app");
    if (!app) return;

    const all = this.getAll();

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="histBackBtn">←</div>
  <div>
    <h1 class="hvac-title">📋 Historial</h1>
    <p class="hvac-subtitle">Búsquedas recientes</p>
  </div>
</header>

<!-- ACCIONES EXPORT -->
${all.length ? `
<div class="hist-actions">
  <button class="hist-export-btn" id="histExportTXT">
    📄 Descargar TXT
  </button>
  <button class="hist-export-btn hist-export-csv" id="histExportCSV">
    📊 Descargar CSV
  </button>
  <button class="hist-clear-btn" id="histClearAll">
    🗑 Borrar todo
  </button>
</div>
` : ""}

<!-- STATS -->
${all.length ? `
<div class="hist-stats">
  <div class="hist-stat">
    <span class="hist-stat-val">${all.length}</span>
    <span class="hist-stat-label">búsquedas</span>
  </div>
  <div class="hist-stat">
    <span class="hist-stat-val">${this.topTab(all)}</span>
    <span class="hist-stat-label">sección más usada</span>
  </div>
  <div class="hist-stat">
    <span class="hist-stat-val">${this.topQuery(all)}</span>
    <span class="hist-stat-label">más buscado</span>
  </div>
</div>
` : ""}

<!-- LISTA -->
<div id="hist-list">
  ${all.length ? this.renderList(all) : this.renderEmpty()}
</div>

`;

    this.bindEvents(all);
  },

  renderList(all) {
    // Agrupar por fecha
    const grupos = {};
    all.forEach((item, idx) => {
      const d   = new Date(item.fecha);
      const key = d.toDateString();
      const label = this.formatFecha(item.fecha).split(" ")[0]; // "Hoy" / "Ayer" / "DD/MM"
      if (!grupos[key]) grupos[key] = { label, items: [] };
      grupos[key].items.push({ ...item, idx });
    });

    return Object.values(grupos).map(g => `
<div class="hist-group">
  <div class="hist-group-label">${g.label}</div>
  ${g.items.map(item => `
  <div class="hist-item" data-idx="${item.idx}">
    <div class="hist-item-left">
      <span class="hist-item-icono">${this.tabIcono(item.tab)}</span>
      <div>
        <div class="hist-item-query">${this.escapeHTML(item.query)}</div>
        <div class="hist-item-meta">
          ${this.tabLabel(item.tab)}
          ${item.resultCount != null ? ` · ${item.resultCount} resultados` : ""}
          · ${this.formatFecha(item.fecha)}
        </div>
      </div>
    </div>
    <button class="hist-item-del" data-del="${item.idx}" title="Eliminar">✕</button>
  </div>
  `).join("")}
</div>
`).join("");
  },

  renderEmpty() {
    return `
<div class="ref-empty" style="padding-top:60px;">
  <span>🔍</span>
  <p>Todavía no hay búsquedas guardadas.<br>Empezá buscando en la Biblioteca Técnica.</p>
</div>`;
  },

  topTab(all) {
    const counts = {};
    all.forEach(i => { counts[i.tab] = (counts[i.tab] || 0) + 1; });
    const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    return top ? this.tabLabel(top[0]) : "-";
  },

  topQuery(all) {
    const counts = {};
    all.forEach(i => {
      if (!i.query) return;
      const q = i.query.toLowerCase();
      counts[q] = (counts[q] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    return top && top[1] > 1 ? `"${top[0]}"` : "-";
  },

  tabIcono(tab) {
    const iconos = {
      teoria:         "🧠",
      procedimientos: "🔧",
      errores:        "⚠️",
      circuitos:      "📐"
    };
    return iconos[tab] || "🔍";
  },

  escapeHTML(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  },

  // ═══════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════

  bindEvents(all) {

    document.getElementById("histBackBtn")?.addEventListener("click", () => Router.back());

    document.getElementById("histExportTXT")?.addEventListener("click", () => {
      const ok = this.downloadTXT();
      if (!ok) this.showToast("No hay búsquedas para exportar");
      else      this.showToast("✅ TXT descargado");
    });

    document.getElementById("histExportCSV")?.addEventListener("click", () => {
      const ok = this.downloadCSV();
      if (!ok) this.showToast("No hay búsquedas para exportar");
      else      this.showToast("✅ CSV descargado");
    });

    document.getElementById("histClearAll")?.addEventListener("click", () => {
      if (confirm("¿Borrar todo el historial? No se puede deshacer.")) {
        this.clear();
        this.render();
        this.showToast("🗑 Historial borrado");
      }
    });

    // Reusar búsqueda al tocar el item
    document.querySelectorAll(".hist-item").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".hist-item-del")) return;
        const idx  = Number(el.dataset.idx);
        const item = this.getAll()[idx];
        if (item) {
          Router.go("referencias");
          setTimeout(() => {
            const input = document.getElementById("refSearch");
            if (input) {
              input.value = item.query;
              input.dispatchEvent(new Event("input"));
            }
          }, 100);
        }
      });
    });

    // Eliminar item individual
    document.querySelectorAll(".hist-item-del").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.del);
        this.remove(idx);
        this.render();
      });
    });
  },

  showToast(msg) {
    const existing = document.getElementById("hvac-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "hvac-toast";
    toast.className = "hvac-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("hvac-toast-show"), 10);
    setTimeout(() => {
      toast.classList.remove("hvac-toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

};
