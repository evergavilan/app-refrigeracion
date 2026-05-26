// =====================================================
// HVAC PRO ARGENTINA
// CORE/DIAGNOSTICO-HISTORIAL.JS
// Historial de diagnósticos (Split, Cíclica, No Frost, Comercial)
// =====================================================

const DiagnosticoHistorial = {

  MAX_ITEMS: 50,
  STORAGE_KEY: "hvac_dx_historial",

  // ═══════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════

  getAll() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
      return raw.filter(item => item && item.modulo && item.titulo);
    } catch { return []; }
  },

  add(modulo, datos, resultado) {
    if (!modulo || !resultado) return;
    const all = this.getAll();
    all.unshift({
      modulo,
      datos,
      titulo:  resultado.titulo  || "Diagnóstico",
      icono:   resultado.icono   || "🔍",
      certeza: resultado.certeza || 0,
      causa:   resultado.causa   || "",
      pasos:   resultado.pasos   || [],
      alerta:  resultado.alerta  || null,
      fecha:   new Date().toISOString()
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all.slice(0, this.MAX_ITEMS)));
  },

  remove(index) {
    const all = this.getAll();
    all.splice(index, 1);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  },

  clear(modulo) {
    if (modulo) {
      const filtered = this.getAll().filter(i => i.modulo !== modulo);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  },

  // ═══════════════════════════════════════════════
  // LABELS
  // ═══════════════════════════════════════════════

  moduloLabel(m) {
    return { split:"❄️ Split", ciclica:"🧊 Cíclica", nofrost:"🌬️ No Frost", comercial:"🏭 Comercial" }[m] || m;
  },

  formatFecha(iso) {
    const d   = new Date(iso);
    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    const hora = d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
    if (d.toDateString() === hoy.toDateString())  return `Hoy ${hora}`;
    if (d.toDateString() === ayer.toDateString()) return `Ayer ${hora}`;
    return d.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }) + ` ${hora}`;
  },

  // ═══════════════════════════════════════════════
  // RENDER PANTALLA HISTORIAL
  // ═══════════════════════════════════════════════

  render(filtroModulo) {
    const app = document.getElementById("app");
    if (!app) return;

    this.filtroActivo = filtroModulo || null;
    const all      = this.getAll();
    const filtered = filtroModulo ? all.filter(i => i.modulo === filtroModulo) : all;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="dxHistBack">←</div>
  <div>
    <h1 class="hvac-title">📋 Historial</h1>
    <p class="hvac-subtitle">Diagnósticos realizados</p>
  </div>
</header>

<!-- FILTROS POR MÓDULO -->
<div class="dxh-filtros">
  <button class="dxh-filtro ${!filtroModulo?'active':''}" data-modulo="">Todos</button>
  <button class="dxh-filtro ${filtroModulo==='split'?'active':''}"    data-modulo="split">❄️ Split</button>
  <button class="dxh-filtro ${filtroModulo==='ciclica'?'active':''}"  data-modulo="ciclica">🧊 Cíclica</button>
  <button class="dxh-filtro ${filtroModulo==='nofrost'?'active':''}"  data-modulo="nofrost">🌬️ No Frost</button>
  <button class="dxh-filtro ${filtroModulo==='comercial'?'active':''}" data-modulo="comercial">🏭 Comercial</button>
</div>

<!-- ACCIONES -->
${filtered.length ? `
<div class="hist-actions">
  <button class="hist-export-btn" id="dxHistExportTXT">📄 Descargar TXT</button>
  <button class="hist-export-btn hist-export-csv" id="dxHistExportCSV">📊 Descargar CSV</button>
  <button class="hist-clear-btn" id="dxHistClear">🗑 Borrar</button>
</div>` : ""}

<!-- STATS -->
${all.length ? `
<div class="hist-stats">
  <div class="hist-stat">
    <span class="hist-stat-val">${all.length}</span>
    <span class="hist-stat-label">diagnósticos</span>
  </div>
  <div class="hist-stat">
    <span class="hist-stat-val">${this.moduloMasUsado(all)}</span>
    <span class="hist-stat-label">más diagnosticado</span>
  </div>
  <div class="hist-stat">
    <span class="hist-stat-val">${this.promedioConfianza(all)}%</span>
    <span class="hist-stat-label">confianza prom.</span>
  </div>
</div>` : ""}

<!-- LISTA -->
<div id="dxh-list">
  ${filtered.length ? this.renderList(filtered) : this.renderEmpty(filtroModulo)}
</div>

`;
    this.bindEvents(filtered);
  },

  renderList(items) {
    return items.map((item, idx) => `
<div class="dxh-item" data-idx="${idx}">
  <div class="dxh-item-header">
    <span class="dxh-item-icono">${item.icono}</span>
    <div class="dxh-item-info">
      <div class="dxh-item-titulo">${item.titulo}</div>
      <div class="dxh-item-meta">
        ${this.moduloLabel(item.modulo)}
        ${item.certeza ? ` · ${item.certeza}% confianza` : ""}
        · ${this.formatFecha(item.fecha)}
      </div>
    </div>
    <button class="hist-item-del" data-del="${idx}">✕</button>
  </div>

  <!-- Datos ingresados -->
  ${item.datos ? `
  <div class="dxh-datos">
    ${Object.entries(item.datos).filter(([k,v]) => v && !['chk','undefined'].some(x => k.includes(x)) ).slice(0,4).map(([k,v]) =>
      `<span class="dxh-dato-chip">${this.datoLabel(k)}: <b>${v}</b></span>`
    ).join("")}
  </div>` : ""}

  <!-- Causa colapsable -->
  <div class="dxh-causa">${item.causa.slice(0,120)}${item.causa.length > 120 ? "..." : ""}</div>

  <!-- Botón ver detalle -->
  <button class="dxh-ver-btn" data-idx="${idx}">Ver diagnóstico completo ›</button>
</div>
`).join("");
  },

  renderDetalle(idx) {
    const all    = this.getAll();
    const item   = this.filtroActivo
      ? all.filter(i => i.modulo === this.filtroActivo)[idx]
      : all[idx];
    if (!item) return;

    const app = document.getElementById("app");
    if (!app) return;

    const pasosHTML = (item.pasos || []).map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i+1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="dxDetBack">←</div>
  <div>
    <h1 class="hvac-title">${item.icono} ${item.titulo}</h1>
    <p class="hvac-subtitle">${this.moduloLabel(item.modulo)} · ${this.formatFecha(item.fecha)}</p>
  </div>
</header>

${item.certeza ? `
<div style="margin:12px 16px 0;">
  <div class="dx-certeza-bar" style="height:6px;border-radius:3px;">
    <div class="dx-certeza-fill" style="width:${item.certeza}%;background:#00d9ff;"></div>
  </div>
  <div class="dx-certeza-txt" style="color:#00d9ff;margin-top:4px;">${item.certeza}% probabilidad</div>
</div>` : ""}

<div style="margin:12px 16px 0;">
  <div class="ref-intro-card">${item.causa}</div>
</div>

${item.alerta ? `
<div style="margin:8px 16px 0;">
  <div class="dx-alerta">${item.alerta}</div>
</div>` : ""}

<div style="margin:12px 16px 0;">
  <div class="dx-pasos-titulo">📋 Pasos de intervención:</div>
  ${pasosHTML}
</div>

<!-- DATOS USADOS EN EL DIAGNÓSTICO -->
${item.datos ? `
<div style="margin:16px 16px 24px;">
  <div class="dxh-datos-titulo">📊 Datos ingresados</div>
  <div class="dxh-datos" style="flex-wrap:wrap;">
    ${Object.entries(item.datos).filter(([k,v]) => v && v !== false && v !== "0").map(([k,v]) =>
      `<span class="dxh-dato-chip">${this.datoLabel(k)}: <b>${v}</b></span>`
    ).join("")}
  </div>
</div>` : ""}

`;
    document.getElementById("dxDetBack")?.addEventListener("click", () => this.render(this.filtroActivo));
  },

  renderEmpty(modulo) {
    const label = modulo ? this.moduloLabel(modulo) : "ningún equipo";
    return `<div class="ref-empty" style="padding-top:60px;">
      <span>🔍</span>
      <p>Todavía no hay diagnósticos de ${label}.<br>Realizá un diagnóstico y aparecerá acá.</p>
    </div>`;
  },

  // ═══════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════

  moduloMasUsado(all) {
    const counts = {};
    all.forEach(i => { counts[i.modulo] = (counts[i.modulo] || 0) + 1; });
    const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    if (!top) return "-";
    return { split:"Split", ciclica:"Cíclica", nofrost:"No Frost", comercial:"Comercial" }[top[0]] || top[0];
  },

  promedioConfianza(all) {
    const conCerteza = all.filter(i => i.certeza > 0);
    if (!conCerteza.length) return "-";
    return Math.round(conCerteza.reduce((s,i) => s + i.certeza, 0) / conCerteza.length);
  },

  datoLabel(key) {
    const labels = {
      gas:"Gas", frigorias:"FG", arranca:"Arranca", amp:"AMP",
      psi:"PSI", tempIn:"T. entrada", tempOut:"T. salida",
      hp:"HP", tempAmbiente:"T. ambiente"
    };
    return labels[key] || key;
  },

  // ═══════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════

  exportTXT(items) {
    const lineas = [
      "EVER PRO ARGENTINA — Historial de diagnósticos",
      `Exportado: ${new Date().toLocaleString("es-AR")}`,
      "=".repeat(50), ""
    ];
    items.forEach((item, i) => {
      lineas.push(`#${i+1} — ${item.icono} ${item.titulo}`);
      lineas.push(`Módulo: ${this.moduloLabel(item.modulo)}`);
      lineas.push(`Fecha: ${this.formatFecha(item.fecha)}`);
      lineas.push(`Confianza: ${item.certeza || "-"}%`);
      lineas.push(`Causa: ${item.causa}`);
      if (item.alerta) lineas.push(`⚠️ ${item.alerta}`);
      lineas.push("Pasos:");
      (item.pasos || []).forEach((p,j) => lineas.push(`  ${j+1}. ${p}`));
      lineas.push("-".repeat(40), "");
    });
    return lineas.join("\n");
  },

  exportCSV(items) {
    const header = "Fecha,Módulo,Diagnóstico,Confianza%,Causa\n";
    const rows = items.map(item => {
      const fecha = new Date(item.fecha).toLocaleDateString("es-AR");
      return [
        fecha,
        `"${this.moduloLabel(item.modulo)}"`,
        `"${item.titulo}"`,
        item.certeza || "",
        `"${item.causa.replace(/"/g,'""').slice(0,200)}"`
      ].join(",");
    });
    return header + rows.join("\n");
  },

  download(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ═══════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════

  bindEvents(filtered) {
    document.getElementById("dxHistBack")?.addEventListener("click", () => Router.back());

    // Filtros por módulo
    document.querySelectorAll(".dxh-filtro").forEach(btn => {
      btn.addEventListener("click", () => this.render(btn.dataset.modulo || null));
    });

    // Ver detalle
    document.querySelectorAll(".dxh-ver-btn").forEach(btn => {
      btn.addEventListener("click", () => this.renderDetalle(Number(btn.dataset.idx)));
    });

    // Eliminar individual
    document.querySelectorAll(".hist-item-del[data-del]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const all      = this.getAll();
        const toRemove = this.filtroActivo
          ? all.filter(i => i.modulo === this.filtroActivo)[Number(btn.dataset.del)]
          : all[Number(btn.dataset.del)];
        const globalIdx = all.indexOf(toRemove);
        if (globalIdx >= 0) this.remove(globalIdx);
        this.render(this.filtroActivo);
      });
    });

    // Exportar
    document.getElementById("dxHistExportTXT")?.addEventListener("click", () => {
      const content = this.exportTXT(filtered);
      const fecha   = new Date().toLocaleDateString("es-AR").replace(/\//g,"-");
      this.download(content, `hvac-diagnosticos-${fecha}.txt`, "text/plain;charset=utf-8;");
      Historial.showToast("✅ TXT descargado");
    });

    document.getElementById("dxHistExportCSV")?.addEventListener("click", () => {
      const content = this.exportCSV(filtered);
      const fecha   = new Date().toLocaleDateString("es-AR").replace(/\//g,"-");
      this.download(content, `hvac-diagnosticos-${fecha}.csv`, "text/csv;charset=utf-8;");
      Historial.showToast("✅ CSV descargado");
    });

    document.getElementById("dxHistClear")?.addEventListener("click", () => {
      const label = this.filtroActivo ? this.moduloLabel(this.filtroActivo) : "todos";
      if (confirm(`¿Borrar historial de ${label}?`)) {
        this.clear(this.filtroActivo);
        this.render(this.filtroActivo);
        Historial.showToast("🗑 Historial borrado");
      }
    });
  }

};
