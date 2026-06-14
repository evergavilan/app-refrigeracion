// =====================================================
// HVAC PRO ARGENTINA
// REFERENCIAS-HVAC.JS — Biblioteca técnica v2
// =====================================================

const ReferenciasHVAC = {

  data: { teoria: null, procedimientos: null, errores: null },
  activeTab: "teoria",
  searchQuery: "",

  async loadData() {
    const base = "./";
    const load = async (key, file) => {
      if (this.data[key]) return;
      try {
        const res = await fetch(`${base}${file}`);
        this.data[key] = await res.json();
      } catch(e) { console.error(`Error cargando ${file}:`, e); }
    };
    await Promise.all([
      load("teoria",         "teoria.json"),
      load("procedimientos", "procedimientos.json"),
      load("errores",        "codigos-error.json")
    ]);
  },

  async render(tab = "teoria") {
    await this.loadData();
    this.activeTab   = tab;
    this.searchQuery = "";

    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="backHome">←</div>
  <div>
    <h1 class="hvac-title">📚 Biblioteca Técnica</h1>
    <p class="hvac-subtitle">HVAC PRO Argentina</p>
  </div>
</header>

<!-- BUSCADOR -->
<div class="ref-search-wrap">
  <div class="ref-search-row">
    <input
      type="text"
      id="refSearch"
      class="ref-search"
      placeholder="🔍  Buscar... Delta T, E1, vacío, NTC..."
    />
    <button class="ref-hist-btn" id="openHistorial" title="Ver historial de búsquedas">
      📋
    </button>
  </div>
</div>

<!-- TABS -->
<div class="ft-tabs">
  <button class="ft-tab ${tab==='teoria'?'active':''}"        data-tab="teoria">🧠 Teoría</button>
  <button class="ft-tab ${tab==='procedimientos'?'active':''}" data-tab="procedimientos">🔧 Procedimientos</button>
  <button class="ft-tab ${tab==='errores'?'active':''}"       data-tab="errores">⚠️ Errores</button>
  <button class="ft-tab ${tab==='circuitos'?'active':''}"     data-tab="circuitos">📐 Circuitos</button>
</div>

<div id="ref-content">
  ${this.renderTab(tab)}
</div>

`;
    this.bindEvents();
  },

  renderTab(tab, query = "") {
    switch(tab) {
      case "teoria":          return this.renderTeoria(query);
      case "procedimientos":  return this.renderProcedimientos(query);
      case "errores":         return this.renderErrores(query);
      case "circuitos":       return this.renderCircuitos();
      default:                return this.renderTeoria(query);
    }
  },

  // ═══════════════════════════════════════════════
  // TEORÍA
  // ═══════════════════════════════════════════════

  renderTeoria(query = "") {
    const modulos = this.data.teoria?.modulos || [];
    const filtrados = query
      ? modulos.filter(m =>
          m.titulo.toLowerCase().includes(query) ||
          m.subtitulo.toLowerCase().includes(query) ||
          m.conceptos.some(c => c.titulo.toLowerCase().includes(query) || c.detalle.toLowerCase().includes(query))
        )
      : modulos;

    if (!filtrados.length) return this.renderEmpty("No hay resultados para esa búsqueda en Teoría.");

    return filtrados.map(m => `
<div class="ref-module-card" data-teoria="${m.id}" style="border-left:3px solid ${m.color || '#00d9ff'}22">

  <div class="ref-module-header">
    <span class="ref-module-icono" style="color:${m.color || '#00d9ff'}">${m.icono}</span>
    <div style="flex:1">
      <div class="ref-module-titulo">${m.titulo}</div>
      <div class="ref-module-sub">${m.subtitulo}</div>
    </div>
    <span class="ref-arrow">›</span>
  </div>

  <div class="ref-module-preview">${m.intro}</div>

  <div class="ref-module-chips">
    ${m.conceptos.map(c => `<span class="ref-chip ref-chip-${c.tipo || 'explicacion'}">${c.titulo}</span>`).join("")}
  </div>

  ${m.valores_referencia?.length ? `
  <div class="ref-module-vals">
    ${m.valores_referencia.slice(0,2).map(v => `
    <span class="ref-module-val-item ref-valor-${v.color || 'cyan'}">${v.label}: <strong>${v.valor}</strong></span>`).join("")}
  </div>` : ""}

</div>
`).join("");
  },

  renderTeoriaDetalle(id) {
    const m = this.data.teoria?.modulos?.find(x => x.id === id);
    if (!m) return "";

    const app = document.getElementById("app");
    if (!app) return;

    const accentColor = m.color || "#00d9ff";

    // Render cada concepto según su tipo
    const renderConcepto = (c, i) => {
      const tipoLabel = {
        explicacion: "📖 Explicación",
        clave:       "🔑 Concepto clave",
        practica:    "🔧 En la práctica",
        tabla:       ""
      }[c.tipo] || "";

      const badgeHTML = tipoLabel
        ? `<span class="ref-tipo-badge ref-tipo-${c.tipo}">${tipoLabel}</span>`
        : "";

      const contenidoHTML = c.tipo === "tabla" && c.tabla
        ? this.renderTabla(c.tabla)
        : `<div class="ref-concepto-detalle">${c.detalle}</div>`;

      return `
<div class="ref-concepto-card ref-tipo-card-${c.tipo || 'explicacion'}">
  ${badgeHTML}
  <div class="ref-concepto-titulo">${c.titulo}</div>
  ${contenidoHTML}
</div>`;
    };

    // Valores de referencia
    const valoresHTML = m.valores_referencia?.length ? `
<div class="ref-valores-bloque">
  <div class="ref-valores-titulo">📐 Valores de referencia</div>
  <div class="ref-valores-grid">
    ${m.valores_referencia.map(v => `
    <div class="ref-valor-item ref-valor-${v.color || 'cyan'}">
      <span class="ref-valor-label">${v.label}</span>
      <span class="ref-valor-val">${v.valor}</span>
    </div>`).join("")}
  </div>
</div>` : "";

    // Errores comunes
    const erroresHTML = m.errores_comunes?.length ? `
<div class="ref-errores-bloque">
  <div class="ref-errores-titulo">⚠️ Errores frecuentes</div>
  ${m.errores_comunes.map(e => `
  <div class="ref-error-item">
    <span class="ref-error-ico">✗</span>
    <span class="ref-error-txt">${e}</span>
  </div>`).join("")}
</div>` : "";

    // Mentor frase
    const mentorHTML = m.mentor_frase ? `
<div class="ref-mentor-bloque">
  <div class="ref-mentor-header">
    <span class="ref-mentor-avatar">👨‍🔧</span>
    <div>
      <div class="ref-mentor-nombre">El Mentor</div>
      <div class="ref-mentor-sub">30 años en el rubro</div>
    </div>
  </div>
  <div class="ref-mentor-frase">"${m.mentor_frase}"</div>
</div>` : "";

    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="backRefs">←</div>
  <div>
    <h1 class="hvac-title" style="color:${accentColor}">${m.icono} ${m.titulo}</h1>
    <p class="hvac-subtitle">${m.subtitulo}</p>
  </div>
</header>

<div style="margin:12px 16px 4px;">
  <div class="ref-intro-card" style="border-left-color:${accentColor}">${m.intro}</div>
</div>

${m.conceptos.map(renderConcepto).join("")}

${valoresHTML}
${erroresHTML}
${mentorHTML}

<div style="height:24px"></div>`;

    document.getElementById("backRefs")?.addEventListener("click", () => this.render("teoria"));
  },

  renderTabla(tabla) {
    if (!tabla?.headers || !tabla?.filas) return "";
    return `
<div class="ref-tabla-wrap">
  <table class="ref-tabla">
    <thead>
      <tr>${tabla.headers.map(h => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${tabla.filas.map(fila => `
      <tr>${fila.map(celda => `<td>${celda}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
</div>`;
  },

  // ═══════════════════════════════════════════════
  // PROCEDIMIENTOS
  // ═══════════════════════════════════════════════

  renderProcedimientos(query = "") {
    const procs = this.data.procedimientos?.procedimientos || [];
    const filtrados = query
      ? procs.filter(p =>
          p.titulo.toLowerCase().includes(query) ||
          p.pasos.some(s => s.titulo.toLowerCase().includes(query) || s.detalle.toLowerCase().includes(query))
        )
      : procs;

    if (!filtrados.length) return this.renderEmpty("No hay resultados para esa búsqueda en Procedimientos.");

    return filtrados.map(p => `
<div class="ref-module-card" data-proc="${p.id}">

  <div class="ref-module-header">
    <span class="ref-module-icono">${p.icono}</span>
    <div style="flex:1">
      <div class="ref-module-titulo">${p.titulo}</div>
      <div class="ref-proc-meta">
        <span class="ref-badge-nivel">${p.nivel}</span>
        <span class="ref-badge-tiempo">⏱ ${p.tiempo}</span>
      </div>
    </div>
    <span class="ref-arrow">›</span>
  </div>

  <div class="ref-herramientas">
    🔧 ${p.herramientas.join(" · ")}
  </div>

</div>
`).join("");
  },

  renderProcDetalle(id) {
    const p = this.data.procedimientos?.procedimientos?.find(x => x.id === id);
    if (!p) return;

    const app = document.getElementById("app");
    if (!app) return;

    // Destruir timers anteriores al navegar
    TimerEngine.destruirTodos();

    const tieneTimers = p.pasos.some(s => s.timer_segundos);

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="backRefs">←</div>
  <div>
    <h1 class="hvac-title">${p.icono} ${p.titulo}</h1>
    <p class="hvac-subtitle">${p.nivel} · ${p.tiempo}</p>
  </div>
</header>

<div style="margin:12px 16px 0;">
  <div class="ref-herramientas-full">
    <span style="color:#00d9ff;font-weight:700;font-size:12px;">🔧 HERRAMIENTAS</span><br>
    ${p.herramientas.map(h => `<span class="ref-herramienta-item">• ${h}</span>`).join(" ")}
  </div>
</div>

${tieneTimers ? `
<div class="proc-timer-aviso">
  ⏱ Este procedimiento tiene pasos con tiempo de espera. Los timers te avisan con vibración y notificación cuando termina cada etapa.
</div>` : ""}

${p.pasos.map(s => `
<div class="ref-paso-card ${s.timer_segundos ? "ref-paso-con-timer" : ""}">
  <div class="ref-paso-header">
    <div class="ref-paso-num">${s.n}</div>
    <div class="ref-paso-titulo">${s.titulo}${s.timer_segundos ? " <span class='paso-timer-badge'>⏱</span>" : ""}</div>
  </div>
  <div class="ref-paso-detalle">${s.detalle}</div>
  ${s.timer_segundos ? TimerEngine.renderWidget(s) : ""}
</div>
`).join("")}

${p.alertas.length ? `
<div style="margin:12px 16px 24px;">
  <div style="font-size:11px;font-weight:800;color:#ff9b42;letter-spacing:1px;margin-bottom:8px;">⚠️ ALERTAS IMPORTANTES</div>
  ${p.alertas.map(a => `
  <div class="ref-alerta-item">⚠️ ${a}</div>
  `).join("")}
</div>
` : ""}

`;
    document.getElementById("backRefs")?.addEventListener("click", () => {
      TimerEngine.destruirTodos();
      this.render("procedimientos");
    });

    // Conectar todos los timers del DOM
    TimerEngine.bindAll();
  },

  // ═══════════════════════════════════════════════
  // CÓDIGOS DE ERROR
  // ═══════════════════════════════════════════════

  renderErrores(query = "") {
    const marcas = this.data.errores?.marcas || [];

    if (query) {
      const resultados = [];
      marcas.forEach(m => {
        const codsFiltrados = m.codigos.filter(c =>
          c.codigo.toLowerCase().includes(query) ||
          c.descripcion.toLowerCase().includes(query) ||
          c.accion.toLowerCase().includes(query) ||
          m.marca.toLowerCase().includes(query)
        );
        if (codsFiltrados.length) {
          resultados.push({ ...m, codigos: codsFiltrados });
        }
      });
      if (!resultados.length) return this.renderEmpty("No hay resultados para ese código o marca.");
      return this.renderMarcasHTML(resultados);
    }

    return `
<div class="ft-info-badge" style="margin:12px 16px 4px;">
  💡 Buscá el código de error directamente: E1, CH05, F3...
</div>
${this.renderMarcasHTML(marcas)}
`;
  },

  renderMarcasHTML(marcas) {
    return marcas.map(m => `
<div class="ref-marca-section">

  <div class="ref-marca-header">
    <span class="ref-marca-icono">${m.icono}</span>
    <span class="ref-marca-nombre">${m.marca}</span>
  </div>

  ${m.codigos.map(c => `
  <div class="ref-error-card">
    <div class="ref-error-header">
      <span class="ref-error-code">${c.codigo}</span>
      <span class="ref-error-desc">${c.descripcion}</span>
    </div>
    <div class="ref-error-accion">
      <span class="ref-error-accion-label">✅ Acción:</span> ${c.accion}
    </div>
  </div>
  `).join("")}

</div>
`).join("");
  },

  // ═══════════════════════════════════════════════
  // CIRCUITOS
  // ═══════════════════════════════════════════════

  renderCircuitos() {
    const circuitos = [
      { id: "refSplitGas",        icono: "❄️", titulo: "Split — Circuito refrigerante",    sub: "Alta y baja presión", fn: () => SplitRefrigeracionRef.render() },
      { id: "refSplitElectrica",  icono: "⚡", titulo: "Split — Circuito eléctrico",       sub: "Placa, capacitor, sensores", fn: () => SplitElectricaRef.render() },
      { id: "refCiclicaGas",      icono: "🧊", titulo: "Cíclica — Circuito refrigerante",  sub: "Compresor, capilar, evaporador", fn: () => CiclicaRefrigeracionRef.render() },
      { id: "refCiclicaElectrica",icono: "🔌", titulo: "Cíclica — Circuito eléctrico",     sub: "Termostato, PTC, protector", fn: () => CiclicaElectricaRef.render() },
      { id: "refNoFrostGas",      icono: "🌬️", titulo: "No Frost — Circuito refrigerante", sub: "Airflow y deshielo", fn: () => NoFrostRefrigeracionRef.render() },
      { id: "refNoFrostElectrica",icono: "💡", titulo: "No Frost — Circuito eléctrico",    sub: "Resistencia, bimetal, timer", fn: () => NoFrostElectricaRef.render() }
    ];

    return circuitos.map(c => `
<div class="ref-module-card ref-circuito-card" id="${c.id}">
  <div class="ref-module-header">
    <span class="ref-module-icono">${c.icono}</span>
    <div>
      <div class="ref-module-titulo">${c.titulo}</div>
      <div class="ref-module-sub">${c.sub}</div>
    </div>
    <span class="ref-arrow">›</span>
  </div>
</div>
`).join("");
  },

  renderEmpty(msg) {
    return `<div class="ref-empty"><span>🔍</span><p>${msg}</p></div>`;
  },

  // ═══════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════

  bindEvents() {

    document.getElementById("backHome")?.addEventListener("click", () => Router.back());
    document.getElementById("openHistorial")?.addEventListener("click", () => Router.go("historial"));

    // Tabs
    document.querySelectorAll(".ft-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab   = btn.dataset.tab;
        this.searchQuery = "";
        document.getElementById("refSearch").value = "";
        document.querySelectorAll(".ft-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("ref-content").innerHTML = this.renderTab(this.activeTab);
        this.bindContentEvents();
      });
    });

    // Buscador con historial
    let searchTimer = null;
    document.getElementById("refSearch")?.addEventListener("input", e => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      document.getElementById("ref-content").innerHTML = this.renderTab(this.activeTab, this.searchQuery);
      this.bindContentEvents();
      clearTimeout(searchTimer);
      if (this.searchQuery.length >= 2) {
        const querySnapshot = this.searchQuery; // captura el valor actual
        searchTimer = setTimeout(() => {
          // Verificar que el query sigue siendo el mismo (usuario no borró)
          if (!querySnapshot || querySnapshot !== this.searchQuery) return;
          const resultCount = document.querySelectorAll("[data-teoria], [data-proc], .ref-error-card, .ref-module-card").length;
          Historial.add(querySnapshot, this.activeTab, resultCount);
        }, 1200);
      }
    });

    this.bindContentEvents();
  },

  bindContentEvents() {

    // Cards de teoría
    document.querySelectorAll("[data-teoria]").forEach(card => {
      card.addEventListener("click", () => this.renderTeoriaDetalle(card.dataset.teoria));
    });

    // Cards de procedimientos
    document.querySelectorAll("[data-proc]").forEach(card => {
      card.addEventListener("click", () => this.renderProcDetalle(card.dataset.proc));
    });

    // Circuitos (existentes)
    const circuitoFns = {
      refSplitGas:         () => SplitRefrigeracionRef.render(),
      refSplitElectrica:   () => SplitElectricaRef.render(),
      refCiclicaGas:       () => CiclicaRefrigeracionRef.render(),
      refCiclicaElectrica: () => CiclicaElectricaRef.render(),
      refNoFrostGas:       () => NoFrostRefrigeracionRef.render(),
      refNoFrostElectrica: () => NoFrostElectricaRef.render()
    };
    Object.entries(circuitoFns).forEach(([id, fn]) => {
      document.getElementById(id)?.addEventListener("click", fn);
    });
  }

};
