// =====================================================
// HVAC PRO ARGENTINA
// CORE/DX-ACTIONS.JS — Acciones post-diagnóstico
// clearForm · showResult · guardar historial · PDF
// =====================================================

const DxActions = {

  // ===================================================
  // LIMPIAR FORMULARIO
  // ===================================================

  clearForm(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox") el.checked = false;
      else if (el.type === "number" || el.type === "text") el.value = "";
    });
    // Limpiar resultado anterior
    const res = document.getElementById("dxResult");
    if (res) res.innerHTML = "";
  },

  // ===================================================
  // MOSTRAR RESULTADO + GUARDAR EN HISTORIAL DX
  // ===================================================

  showResult(modulo, datos, result) {
    const el = document.getElementById("dxResult");
    if (!el) return;

    // Extraer título y certeza del HTML del resultado para guardar
    const tmp = document.createElement("div");
    tmp.innerHTML = result.html;
    const titulo   = tmp.querySelector(".dx-titulo")?.textContent?.trim()   || "Diagnóstico";
    const certeza  = tmp.querySelector(".dx-certeza-txt")?.textContent?.trim() || "";

    // El botón PDF va en el mismo row que Limpiar/Diagnosticar
    // Lo inyectamos en el slot reservado con id="dxPdfSlot"
    const slot = document.getElementById("dxPdfSlot");
    if (slot) {
      slot.innerHTML = `<button class="hvac-btn dx-pdf-btn" id="dxDownloadPDF">📄 Descargar</button>`;
    }

    el.innerHTML = result.html;
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Guardar en historial de diagnósticos
    DxHistorial.add({
      modulo,
      titulo,
      certeza,
      datos,
      html: result.html,
      fecha: new Date().toISOString()
    });

    // Inyectar análisis SH/SC si hay datos de temperatura de línea
    if (modulo === "split") SHSCEngine.inyectarEnResultado(datos);

    // Inyectar info de marca (códigos de error, tipo de equipo)
    MarcaDx.inyectarEnResultado(modulo, datos, titulo);

    // Inyectar mentor contextual después de mostrar el resultado
    Mentor.inyectarEnResultado(modulo, titulo, parseInt(certeza) || 0);

    // Evento PDF
    document.getElementById("dxDownloadPDF")?.addEventListener("click", () => {
      this.generarPDF(modulo, datos, titulo, parseInt(certeza) || 0, result.html);
    });
  },

  // ===================================================
  // GENERAR PDF — sin librería externa
  // Usa window.print() con CSS @media print dedicado
  // ===================================================

  generarPDF(modulo, datos, titulo, certeza, resultHTML) {
    const moduloLabel = {
      split:    "❄️ Split PRO",
      ciclica:  "🧊 Cíclica PRO",
      nofrost:  "🌬️ No Frost PRO",
      comercial:"🏭 Comercial PRO"
    }[modulo] || modulo;

    const fecha = new Date().toLocaleString("es-AR", {
      day:"2-digit", month:"2-digit", year:"numeric",
      hour:"2-digit", minute:"2-digit"
    });

    // Extraer texto plano del resultado para el PDF
    const tmp = document.createElement("div");
    tmp.innerHTML = resultHTML;

    const causa  = tmp.querySelector(".dx-causa")?.textContent?.trim() || "";
    const alerta = tmp.querySelector(".dx-alerta")?.textContent?.trim() || "";
    const pasos  = [...tmp.querySelectorAll(".dx-paso-txt")].map((p, i) =>
      `${i + 1}. ${p.textContent.trim()}`
    ).join("\n");

    const datosLineas = this.formatDatosParaPDF(modulo, datos);

    const contenido = `
EVER PRO ARGENTINA — Informe de Diagnóstico
${"=".repeat(50)}
Módulo:    ${moduloLabel}
Fecha:     ${fecha}
${"─".repeat(50)}

DIAGNÓSTICO: ${titulo}
Probabilidad: ${certeza}

${"─".repeat(50)}
DATOS INGRESADOS:
${datosLineas}

${"─".repeat(50)}
ANÁLISIS:
${causa}

${"─".repeat(50)}
PASOS DE INTERVENCIÓN:
${pasos}

${alerta ? `${"─".repeat(50)}\n⚠️ ALERTA:\n${alerta}\n` : ""}
${"=".repeat(50)}
Generado por Ever PRO Argentina v${APP_CONFIG.version}
`;

    // Descargar como TXT (máxima compatibilidad mobile)
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const fechaFile = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
    a.href     = url;
    a.download = `dx-${modulo}-${fechaFile}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Historial.showToast("✅ Informe descargado");
  },

  formatDatosParaPDF(modulo, d) {
    const lineas = [];
    if (d.marca)     lineas.push(`  Marca:       ${d.marca}${d.modelo ? ' — ' + d.modelo : ''}`);
    if (d.gas)       lineas.push(`  Gas:         ${d.gas}`);
    if (d.frigorias) lineas.push(`  Frigorías:   ${d.frigorias} FG`);
    if (d.hp)        lineas.push(`  Potencia:    ${d.hp} HP`);
    if (d.arranca)   lineas.push(`  Compresor:   ${d.arranca === "si" ? "Arranca" : "No arranca"}`);
    if (d.amp)       lineas.push(`  Amperaje:    ${d.amp} A`);
    if (d.psi)       lineas.push(`  PSI:         ${d.psi}`);
    if (d.tempIn)    lineas.push(`  Temp. entrada: ${d.tempIn}°C`);
    if (d.tempOut)   lineas.push(`  Temp. salida:  ${d.tempOut}°C`);
    if (d.tempAmbiente) lineas.push(`  Temp. ambiente: ${d.tempAmbiente}°C`);

    // Síntomas marcados
    const sintomas = [];
    const labels = {
      chkFrozen:       "Retorno congelado",
      chkPocofrio:     "Poco frío",
      chkAirflow:      "Poco caudal de aire",
      chkCondSucio:    "Condensador sucio",
      chkGasExceso:    "Posible exceso de gas",
      chkCapacitor:    "Capacitor sospechoso",
      chkTermico:      "Protector térmico disparado",
      chkContinuo:     "Trabaja continuo",
      chkPTC:          "PTC sospechoso",
      chkEscarcha:     "Escarcha excesiva",
      chkCondCaliente: "Condensador caliente",
      chkEvapCongelado:"Evaporador congelado",
      chkVentDetenido: "Ventilador detenido",
      chkResistencia:  "Resistencia sospechosa",
      chkBimetal:      "Bimetal sospechoso",
      chkPlaca:        "Placa con error",
      chkPresostato:   "Presostato disparado",
      chkNoTemp:       "No alcanza temperatura"
    };
    Object.entries(labels).forEach(([key, label]) => {
      if (d[key]) sintomas.push(label);
    });
    if (sintomas.length) lineas.push(`  Síntomas:    ${sintomas.join(", ")}`);

    return lineas.join("\n") || "  Sin datos medidos";
  }
};

// =====================================================
// DX HISTORIAL — historial de diagnósticos por módulo
// =====================================================

const DxHistorial = {

  KEY: "hvac_dx_historial",
  MAX: 80,

  add(entry) {
    try {
      const all = this.getAll();
      all.unshift(entry);
      localStorage.setItem(this.KEY, JSON.stringify(all.slice(0, this.MAX)));
    } catch(e) { console.warn("DxHistorial.add:", e); }
  },

  getAll(filtroModulo) {
    try {
      const all = JSON.parse(localStorage.getItem(this.KEY) || "[]");
      if (filtroModulo) return all.filter(e => e.modulo === filtroModulo);
      return all;
    } catch { return []; }
  },

  remove(idx) {
    const all = this.getAll();
    all.splice(idx, 1);
    localStorage.setItem(this.KEY, JSON.stringify(all));
  },

  clear(modulo) {
    if (modulo) {
      const all = this.getAll().filter(e => e.modulo !== modulo);
      localStorage.setItem(this.KEY, JSON.stringify(all));
    } else {
      localStorage.removeItem(this.KEY);
    }
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

  // ===================================================
  // RENDER — pantalla completa del historial dx
  // ===================================================

  render(filtroModulo) {
    const app = document.getElementById("app");
    if (!app) return;

    this.filtroActivo = filtroModulo || "todos";
    const todos = this.getAll();
    const lista = filtroModulo && filtroModulo !== "todos"
      ? todos.filter(e => e.modulo === filtroModulo)
      : todos;

    const tabs = [
      { key:"todos",    label:"Todos",    icono:"📋" },
      { key:"split",    label:"Split",    icono:"❄️" },
      { key:"ciclica",  label:"Cíclica",  icono:"🧊" },
      { key:"nofrost",  label:"No Frost", icono:"🌬️" },
      { key:"comercial",label:"Comercial",icono:"🏭" }
    ];

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="dxHistBack">←</div>
  <div>
    <h1 class="hvac-title">📋 Historial Dx</h1>
    <p class="hvac-subtitle">Diagnósticos realizados</p>
  </div>
</header>

<!-- FILTROS POR MÓDULO -->
<div class="dxh-tabs">
  ${tabs.map(t => `
  <button class="dxh-tab ${this.filtroActivo === t.key ? "active" : ""}" data-modulo="${t.key}">
    ${t.icono} ${t.label}
    <span class="dxh-count">${t.key === "todos" ? todos.length : todos.filter(e=>e.modulo===t.key).length}</span>
  </button>`).join("")}
</div>

<!-- ACCIONES -->
${lista.length ? `
<div class="hist-actions">
  <button class="hist-export-btn" id="dxHistExport">📄 Exportar TXT</button>
  <button class="hist-clear-btn"  id="dxHistClear">🗑 Borrar filtro</button>
</div>` : ""}

<!-- LISTA -->
<div id="dxh-list">
  ${lista.length ? this.renderLista(lista) : this.renderEmpty()}
</div>
`;
    this.bindEvents(lista);
  },

  renderLista(lista) {
    return lista.map((entry, idx) => `
<div class="dxh-item" data-idx="${idx}">
  <div class="dxh-item-top">
    <span class="dxh-modulo-badge dxh-${entry.modulo}">${this.moduloLabel(entry.modulo)}</span>
    <span class="dxh-fecha">${this.formatFecha(entry.fecha)}</span>
    <button class="hist-item-del" data-del="${idx}">✕</button>
  </div>
  <div class="dxh-titulo">${entry.titulo}</div>
  ${entry.certeza ? `<div class="dxh-certeza">${entry.certeza}</div>` : ""}
  <div class="dxh-datos-mini">${this.resumenDatos(entry.datos)}</div>
</div>
`).join("");
  },

  renderEmpty() {
    return `<div class="ref-empty" style="padding-top:60px;">
      <span>📋</span>
      <p>No hay diagnósticos registrados todavía.<br>Corrí un diagnóstico en Split, Cíclica, No Frost o Comercial.</p>
    </div>`;
  },

  moduloLabel(m) {
    return { split:"❄️ Split", ciclica:"🧊 Cíclica", nofrost:"🌬️ No Frost", comercial:"🏭 Comercial" }[m] || m;
  },

  resumenDatos(d) {
    const partes = [];
    if (d.gas)       partes.push(d.gas);
    if (d.frigorias) partes.push(`${d.frigorias} FG`);
    if (d.hp)        partes.push(`${d.hp} HP`);
    if (d.amp)       partes.push(`${d.amp}A`);
    if (d.psi)       partes.push(`${d.psi} PSI`);
    return partes.join(" · ") || "Sin mediciones";
  },

  exportTXT() {
    const filtro = this.filtroActivo === "todos" ? null : this.filtroActivo;
    const lista  = this.getAll(filtro);
    if (!lista.length) return false;

    const lineas = [
      "EVER PRO ARGENTINA — Historial de Diagnósticos",
      `Filtro: ${this.filtroActivo === "todos" ? "Todos los módulos" : this.moduloLabel(this.filtroActivo)}`,
      `Exportado: ${new Date().toLocaleString("es-AR")}`,
      "=".repeat(50), ""
    ];

    lista.forEach((e, i) => {
      lineas.push(`${i + 1}. [${this.formatFecha(e.fecha)}] ${this.moduloLabel(e.modulo)}`);
      lineas.push(`   ${e.titulo}${e.certeza ? " — " + e.certeza : ""}`);
      lineas.push(`   ${this.resumenDatos(e.datos)}`);
      lineas.push("");
    });

    const blob = new Blob([lineas.join("\n")], { type:"text/plain;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `dx-historial-${new Date().toLocaleDateString("es-AR").replace(/\//g,"-")}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    return true;
  },

  bindEvents(lista) {
    document.getElementById("dxHistBack")?.addEventListener("click", () => Router.back());

    // Filtros
    document.querySelectorAll(".dxh-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const m = btn.dataset.modulo;
        this.render(m === "todos" ? null : m);
      });
    });

    // Exportar
    document.getElementById("dxHistExport")?.addEventListener("click", () => {
      this.exportTXT()
        ? Historial.showToast("✅ Exportado")
        : Historial.showToast("No hay diagnósticos");
    });

    // Borrar filtro activo
    document.getElementById("dxHistClear")?.addEventListener("click", () => {
      const m = this.filtroActivo === "todos" ? null : this.filtroActivo;
      const label = m ? this.moduloLabel(m) : "todos los módulos";
      if (confirm(`¿Borrar historial de ${label}?`)) {
        this.clear(m);
        this.render(m);
        Historial.showToast("🗑 Historial borrado");
      }
    });

    // Expandir / ver detalle al tocar
    document.querySelectorAll(".dxh-item").forEach(el => {
      el.addEventListener("click", e => {
        if (e.target.closest(".hist-item-del")) return;
        el.classList.toggle("dxh-item-open");
      });
    });

    // Eliminar individual
    document.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const globalIdx = this.resolveGlobalIdx(Number(btn.dataset.del), lista);
        if (globalIdx >= 0) {
          this.remove(globalIdx);
          this.render(this.filtroActivo === "todos" ? null : this.filtroActivo);
        }
      });
    });
  },

  resolveGlobalIdx(localIdx, listaFiltrada) {
    // El idx local puede ser distinto al global si hay filtro activo
    const entry = listaFiltrada[localIdx];
    if (!entry) return -1;
    return this.getAll().findIndex(e => e.fecha === entry.fecha && e.modulo === entry.modulo);
  }

};
