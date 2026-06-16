// =====================================================
// HVAC PRO ARGENTINA
// FUNCIONES-TECNICAS.JS — Datos premium con tabs
// =====================================================

const FuncionesTecnicas = {

  data: null,
  activeTab: "amp",
  activeSubTab: "aires",
  activePTGas: "r410a",
  activeNTCVal: "10k",

  async init() {
    if (this.data) return;
    try {
      const res = await fetch(`./funciones-tecnicas.json`);
      this.data  = await res.json();
    } catch(e) { console.error("Error cargando funciones técnicas:", e); }
  },

  async render(startTab = "amp") {
    await this.init();
    this.activeTab = startTab;
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="ftBack">←</div>
  <div>
    <h1 class="hvac-title">📘 Funciones Técnicas</h1>
    <p class="hvac-subtitle">Datos Premium Argentina</p>
  </div>
</header>

<!-- TABS PRINCIPALES — scroll horizontal -->
<div class="ft-tabs">
  <button class="ft-tab ${startTab==='amp'?'active':''}"         data-tab="amp">⚡ AMP</button>
  <button class="ft-tab ${startTab==='capacitor'?'active':''}"   data-tab="capacitor">🔋 CAP</button>
  <button class="ft-tab ${startTab==='temp'?'active':''}"        data-tab="temp">🌡️ TEMP</button>
  <button class="ft-tab ${startTab==='pt'?'active':''}"          data-tab="pt">📊 P/T</button>
  <button class="ft-tab ${startTab==='ntc'?'active':''}"         data-tab="ntc">📡 NTC</button>
  <button class="ft-tab ${startTab==='quickstart'?'active':''}"  data-tab="quickstart">⚡ QS</button>
  <button class="ft-tab ${startTab==='resistencias'?'active':''}" data-tab="resistencias">🌀 RES</button>
  <button class="ft-tab ${startTab==='relay'?'active':''}"       data-tab="relay">🔴 RELAY</button>
  <button class="ft-tab ${startTab==='calc'?'active':''}"		data-tab="calc">🧮 CALC</button>
  <button class="ft-tab ${startTab==='shsc'?'active':''}"		data-tab="shsc">🌡️ SH/SC</button>
  <button class="ft-tab ${startTab==='caneria'?'active':''}" data-tab="caneria">🔧 CAÑO</button>
  <button class="ft-tab ${startTab==='gases'?'active':''}" data-tab="gases">⚗️ GASES</button>
</div>

<div id="ft-content">
  ${this.renderTab(startTab)}
</div>`;

    this.bindEvents();
  },

  renderTab(tab) {
    switch(tab) {
      case "amp":          return this.renderAmp();
      case "capacitor":    return this.renderCapacitor();
      case "temp":         return this.renderTemp();
      case "pt":           return this.renderPT();
      case "ntc":          return this.renderNTC();
      case "quickstart":   return this.renderQuickStart();
      case "resistencias": return this.renderResistencias();
      case "relay":        return this.renderRelay();
      case "shsc":         return this.renderSHSC();
      case "calc":         return this.renderCalc();
      case "caneria":      return this.renderCaneria();
      case "gases":         return this.renderGases();
      default:             return this.renderAmp();
    }
  },

  // ═══════════════════════════════════════════════
  // AMP
  // ═══════════════════════════════════════════════

  renderAmp() {
    const sub = this.activeSubTab;
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${sub==='aires'?'active':''}" data-sub="aires">❄️ Aires</button>
  <button class="ft-subtab ${sub==='heladeras'?'active':''}" data-sub="heladeras">🧊 Heladeras</button>
</div>
<div class="ft-info-badge">⚡ Valores a 220V — 50Hz — Condiciones normales Argentina</div>
${sub === 'aires' ? this.renderAmpAires() : this.renderAmpHeladeras()}`;
  },

  renderAmpAires() {
    return (this.data?.amperaje?.aires || []).map(item => `
<div class="ft-card">
  <div class="ft-card-header">
    <span class="ft-card-title">❄️ ${item.frigorias}</span>
    <span class="ft-card-badge">${item.hp}</span>
  </div>
  <div class="ft-grid-3">
    <div class="ft-data-block ft-r22">
      <div class="ft-gas-label">R22</div>
      <div class="ft-amp-value">${item.r22.trabajo}</div>
      <div class="ft-amp-max">máx ${item.r22.max}</div>
    </div>
    <div class="ft-data-block ft-r410">
      <div class="ft-gas-label">R410A</div>
      <div class="ft-amp-value">${item.r410a.trabajo}</div>
      <div class="ft-amp-max">máx ${item.r410a.max}</div>
    </div>
    <div class="ft-data-block ft-r32">
      <div class="ft-gas-label">R32</div>
      <div class="ft-amp-value">${item.r32.trabajo}</div>
      <div class="ft-amp-max">máx ${item.r32.max}</div>
    </div>
  </div>
  <div class="ft-nota">💡 ${item.nota}</div>
</div>`).join("");
  },

  renderAmpHeladeras() {
    return (this.data?.amperaje?.heladeras || []).map(item => `
<div class="ft-card">
  <div class="ft-card-header">
    <span class="ft-card-title">🧊 ${item.tipo}</span>
    <span class="ft-card-badge">${item.hp}</span>
  </div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Capacidad</span><span class="ft-row-value">${item.capacidad}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Trabajo</span><span class="ft-row-value ft-highlight">${item.trabajo}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Arranque</span><span class="ft-row-value ft-warn">${item.arranque}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Gas</span><span class="ft-row-value">${item.gas}</span></div>
  </div>
  <div class="ft-nota">💡 ${item.nota}</div>
</div>`).join("");
  },

  // ═══════════════════════════════════════════════
  // CAPACITOR
  // ═══════════════════════════════════════════════

  renderCapacitor() {
    const sub = this.activeSubTab;
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${sub==='aires'?'active':''}" data-sub="aires">❄️ Aires</button>
  <button class="ft-subtab ${sub==='heladeras'?'active':''}" data-sub="heladeras">🧊 Heladeras</button>
</div>
<div class="ft-info-badge">🔋 Tolerancia ±10%. Verificar siempre con capacímetro antes de reponer</div>
${sub === 'aires' ? this.renderCapAires() : this.renderCapHeladeras()}`;
  },

  renderCapAires() {
    return (this.data?.capacitores?.aires || []).map(item => `
<div class="ft-card">
  <div class="ft-card-header"><span class="ft-card-title">❄️ ${item.frigorias}</span><span class="ft-card-badge">Dual</span></div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Dual (comp+vent)</span><span class="ft-row-value ft-highlight">${item.dual}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Compresor</span><span class="ft-row-value">${item.compresor}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Ventilador</span><span class="ft-row-value">${item.ventilador}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Protector térmico</span><span class="ft-row-value ft-warn">${item.protector}</span></div>
  </div>
  <div class="ft-nota">💡 ${item.nota}</div>
</div>`).join("");
  },

  renderCapHeladeras() {
    return (this.data?.capacitores?.heladeras || []).map(item => `
<div class="ft-card">
  <div class="ft-card-header"><span class="ft-card-title">🧊 ${item.tipo}</span></div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Capacitor</span><span class="ft-row-value ft-highlight">${item.capacitor}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Protector térmico</span><span class="ft-row-value ft-warn">${item.protector}</span></div>
  </div>
  <div class="ft-nota">💡 ${item.nota}</div>
</div>`).join("");
  },

  // ═══════════════════════════════════════════════
  // TEMPERATURA
  // ═══════════════════════════════════════════════

  renderTemp() {
    const sub = this.activeSubTab;
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${sub==='aires'?'active':''}" data-sub="aires">❄️ Aires</button>
  <button class="ft-subtab ${sub==='heladeras'?'active':''}" data-sub="heladeras">🧊 Heladeras</button>
</div>

<!-- IDENTIFICADOR DE GAS POR PRESIÓN DE REPOSO -->
<div class="ft-id-gas-card">
  <div class="ft-id-gas-titulo">🔍 Identificar gas por presión de reposo</div>
  <div class="ft-id-gas-sub">Equipo apagado ≥ 30 minutos. Conectá el manómetro y medí.</div>
  <div class="ft-id-gas-row">
    <div class="ft-id-gas-field">
      <label class="ft-id-gas-label">PSI medido</label>
      <input type="number" class="hvac-input" id="ftIdPsi" placeholder="ej: 185" min="0" max="600"/>
    </div>
    <div class="ft-id-gas-field">
      <label class="ft-id-gas-label">Temp. ambiente</label>
      <select class="hvac-select" id="ftIdTemp">
        <option value="20">20°C</option>
        <option value="25" selected>25°C</option>
        <option value="30">30°C</option>
        <option value="35">35°C</option>
        <option value="40">40°C</option>
      </select>
    </div>
    <button class="hvac-btn btn-primary ft-id-gas-btn" id="ftIdBtnIdentificar">Identificar</button>
  </div>
  <div id="ftIdResultado" class="ft-id-gas-resultado" style="display:none"></div>
</div>

<div class="ft-info-badge">🌡️ Temperaturas normales de trabajo. Fuera de rango = problema</div>
${sub === 'aires' ? this.renderTempAires() : this.renderTempHeladeras()}`;
  },

  renderTempAires() {
    return (this.data?.temperaturas?.aires || []).map(item => `
<div class="ft-card">
  <div class="ft-card-header">
    <span class="ft-card-title">🌡️ ${item.gas}</span>
    <span class="ft-card-badge">${item.nota.includes('desuso')?'⚠️ Viejo':'✅ Actual'}</span>
  </div>

  <div class="ft-section-label">🌡️ Temperaturas de trabajo</div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Evaporación</span><span class="ft-row-value ft-cold">${item.evaporacion_normal}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Condensación</span><span class="ft-row-value ft-hot">${item.condensacion_normal}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Succión</span><span class="ft-row-value">${item.succion_normal}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Descarga normal</span><span class="ft-row-value ft-warn">${item.descarga_normal}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Descarga máxima</span><span class="ft-row-value ft-danger">${item.descarga_max}</span></div>
  </div>

  ${item.psi_baja_normal ? `
  <div class="ft-section-label ft-section-psi">📊 Presiones normales de trabajo</div>
  <div class="ft-row-data ft-psi-block">
    <div class="ft-row-item ft-psi-row">
      <span class="ft-row-label">PSI Baja <span class="ft-psi-sub">(línea gruesa)</span></span>
      <span class="ft-row-value ft-psi-baja">${item.psi_baja_normal}</span>
    </div>
    <div class="ft-row-item ft-psi-row">
      <span class="ft-row-label">PSI Alta <span class="ft-psi-sub">(línea fina)</span></span>
      <span class="ft-row-value ft-psi-alta">${item.psi_alta_normal}</span>
    </div>
    <div class="ft-psi-nota">⚙️ ${item.psi_nota}</div>
  </div>` : ""}

  ${item.psi_reposo ? `
  <div class="ft-section-label ft-section-reposo">🔌 Presión de reposo (equipo apagado)</div>
  <div class="ft-reposo-bloque">
    <div class="ft-reposo-intro">Con el equipo apagado y temperatura ambiente estabilizada. Sirve para identificar el gas sin etiqueta.</div>
    <div class="ft-reposo-tabla">
      <div class="ft-reposo-header">
        <span>Temp. amb.</span><span>PSI reposo</span>
      </div>
      ${["20","25","30","35","40"].map(t => `
      <div class="ft-reposo-fila ${t==="25"?"ft-reposo-ref":""}">
        <span class="ft-reposo-temp">${t}°C${t==="25"?" <span class='ft-reposo-ref-tag'>ref</span>":""}</span>
        <span class="ft-reposo-psi">${item.psi_reposo[t]} PSI</span>
      </div>`).join("")}
    </div>
    ${item.identificacion ? `<div class="ft-reposo-id">🔍 ${item.identificacion}</div>` : ""}
    ${item.nota_reposo ? `<div class="ft-psi-nota" style="margin-top:6px">⚠️ ${item.nota_reposo}</div>` : ""}
  </div>` : ""}

  <div class="ft-nota">💡 ${item.nota}</div>
</div>`).join("");
  },

  renderTempHeladeras() {
    return (this.data?.temperaturas?.heladeras || []).map(item => `
<div class="ft-card">
  <div class="ft-card-header"><span class="ft-card-title">🌡️ ${item.gas}</span><span class="ft-card-badge">${item.tipo}</span></div>

  <div class="ft-section-label">🌡️ Temperaturas de trabajo</div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Evaporador</span><span class="ft-row-value ft-cold">${item.evaporador}</span></div>
    ${item.interior_heladera ? `
    <div class="ft-row-item"><span class="ft-row-label">Interior heladera</span><span class="ft-row-value">${item.interior_heladera}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Interior freezer</span><span class="ft-row-value ft-cold">${item.interior_freezer}</span></div>
    ` : `<div class="ft-row-item"><span class="ft-row-label">Interior</span><span class="ft-row-value">${item.interior}</span></div>`}
    <div class="ft-row-item"><span class="ft-row-label">Succión</span><span class="ft-row-value">${item.succion}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Descarga</span><span class="ft-row-value ft-warn">${item.descarga}</span></div>
  </div>

  ${item.psi_baja_normal ? `
  <div class="ft-section-label ft-section-psi">📊 Presiones normales de trabajo</div>
  <div class="ft-row-data ft-psi-block">
    <div class="ft-row-item ft-psi-row">
      <span class="ft-row-label">PSI Baja</span>
      <span class="ft-row-value ft-psi-baja">${item.psi_baja_normal}</span>
    </div>
    <div class="ft-row-item ft-psi-row">
      <span class="ft-row-label">PSI Alta</span>
      <span class="ft-row-value ft-psi-alta">${item.psi_alta_normal}</span>
    </div>
    <div class="ft-psi-nota">⚙️ ${item.psi_nota}</div>
  </div>` : ""}

  ${item.psi_reposo ? `
  <div class="ft-section-label ft-section-reposo">🔌 Presión de reposo (equipo apagado)</div>
  <div class="ft-reposo-bloque">
    <div class="ft-reposo-intro">Con el equipo apagado y temperatura ambiente estabilizada. Sirve para identificar el gas sin etiqueta.</div>
    <div class="ft-reposo-tabla">
      <div class="ft-reposo-header">
        <span>Temp. amb.</span><span>PSI reposo</span>
      </div>
      ${["20","25","30","35","40"].map(t => `
      <div class="ft-reposo-fila ${t==="25"?"ft-reposo-ref":""}">
        <span class="ft-reposo-temp">${t}°C${t==="25"?" <span class='ft-reposo-ref-tag'>ref</span>":""}</span>
        <span class="ft-reposo-psi">${item.psi_reposo[t]} PSI</span>
      </div>`).join("")}
    </div>
    ${item.identificacion ? `<div class="ft-reposo-id">🔍 ${item.identificacion}</div>` : ""}
    ${item.nota_reposo ? `<div class="ft-psi-nota" style="margin-top:6px">⚠️ ${item.nota_reposo}</div>` : ""}
  </div>` : ""}

  <div class="ft-nota">💡 ${item.nota}</div>
</div>`).join("");
  },

  // ═══════════════════════════════════════════════
  // P/T
  // ═══════════════════════════════════════════════

  renderPT() {
    const gas = this.activePTGas;
    const labels = { r22:"R22", r410a:"R410A", r32:"R32", r134a:"R134a", r404a:"R404A" };
    return `
<div class="ft-gas-selector">
  ${Object.entries(labels).map(([k,v]) => `<button class="ft-gas-btn ${gas===k?'active':''}" data-gas="${k}">${v}</button>`).join("")}
</div>
<div class="ft-info-badge">📊 ${labels[gas]} — Presión de saturación</div>
<div class="ft-table-wrapper">
  <table class="ft-table">
    <thead><tr><th>Temp °C</th><th>PSI</th><th>BAR</th></tr></thead>
    <tbody>
      ${(this.data?.pt[gas] || []).map(r => `
      <tr><td>${r.temp}</td><td class="ft-psi">${r.psi}</td><td class="ft-bar">${r.bar}</td></tr>`).join("")}
    </tbody>
  </table>
</div>`;
  },

  // ═══════════════════════════════════════════════
  // NTC — SENSORES
  // ═══════════════════════════════════════════════

  renderNTC() {
    const val = this.activeNTCVal;
    const d   = this.data?.ntc;
    if (!d) return "";
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${val==='5k'?'active':''}"  data-ntc="5k">NTC 5kΩ</button>
  <button class="ft-subtab ${val==='10k'?'active':''}" data-ntc="10k">NTC 10kΩ</button>
  <button class="ft-subtab ${val==='15k'?'active':''}" data-ntc="15k">NTC 15kΩ</button>
  <button class="ft-subtab ${val==='diag'?'active':''}" data-ntc="diag">🔍 Diagnóstico</button>
</div>

${val === 'diag' ? `
<div class="ft-info-badge">🔍 Qué hacer según lo que medís con el multímetro</div>
${d.diagnostico.map(row => `
<div class="ft-card">
  <div class="ft-card-header">
    <span class="ft-card-title">${row.condicion}</span>
  </div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Causa</span><span class="ft-row-value ft-warn">${row.causa}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Acción</span><span class="ft-row-value ft-highlight">${row.accion}</span></div>
  </div>
</div>`).join("")}
` : `
<div class="ft-info-badge">📡 NTC ${val.toUpperCase()} — Resistencia nominal a 25°C: <strong>${val === '5k' ? '5.000' : val === '10k' ? '10.000' : '15.000'} Ω</strong></div>
<div class="ft-info-badge" style="border-color:rgba(255,155,66,.3);background:rgba(255,155,66,.07);color:#ff9b42;">
  💡 Medí con multímetro en Ω. Sensor desconectado de la placa. Tolerancia ±10% del valor de la tabla.
</div>
<div class="ft-table-wrapper">
  <table class="ft-table">
    <thead>
      <tr><th>Temp</th><th>Resistencia</th><th>¿Normal?</th></tr>
    </thead>
    <tbody>
      ${(d[val] || []).map(r => {
        const highlight = ["20°C","25°C","30°C"].includes(r.temp);
        return `<tr ${highlight ? 'style="background:rgba(0,217,255,.06);"' : ''}>
          <td>${r.temp}</td>
          <td class="ft-psi">${r.ohms} Ω</td>
          <td style="font-size:11px;color:${highlight?'#00d9ff':'#445566'}">${highlight ? '✅ Ref. típica' : '—'}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</div>
<div class="ft-card" style="margin-top:10px;">
  <div class="ft-card-title" style="margin-bottom:10px;">📐 Cómo usar esta tabla en campo</div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">1. Medí la temp del sensor</span><span class="ft-row-value" style="font-size:12px;">Termómetro cerca del sensor</span></div>
    <div class="ft-row-item"><span class="ft-row-label">2. Medí la resistencia</span><span class="ft-row-value" style="font-size:12px;">Multímetro en Ω, sensor desconectado</span></div>
    <div class="ft-row-item"><span class="ft-row-label">3. Buscá la temp en la tabla</span><span class="ft-row-value" style="font-size:12px;">Compará el valor medido</span></div>
    <div class="ft-row-item"><span class="ft-row-label">4. ±10% = normal</span><span class="ft-row-value ft-highlight" style="font-size:12px;">Más diferencia → reemplazar</span></div>
  </div>
</div>`}`;
  },

  // ═══════════════════════════════════════════════
  // QUICK START
  // ═══════════════════════════════════════════════

  renderQuickStart() {
    const d = this.data?.quickstart;
    if (!d) return "";
    const sub = this.activeSubTab;
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${sub==='valores'?'active':''}" data-sub="valores">📊 Valores</button>
  <button class="ft-subtab ${sub==='cuando'?'active':''}"  data-sub="cuando">❓ Cuándo usarlo</button>
  <button class="ft-subtab ${sub==='inst'?'active':''}"    data-sub="inst">🔧 Instalación</button>
</div>

<div class="ft-info-badge">⚡ ${d.info}</div>

${sub === 'valores' ? `
${d.valores.map(v => `
<div class="ft-card">
  <div class="ft-card-header">
    <span class="ft-card-title">⚡ ${v.hp}</span>
    <span class="ft-card-badge">${v.nota}</span>
  </div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Cap. compresor original</span><span class="ft-row-value">${v.compCapacitor}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Cap. Quick Start</span><span class="ft-row-value ft-highlight">${v.quickstartCap}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Amp. trabajo normal</span><span class="ft-row-value">${v.corrienteNormal}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Amp. arranque SIN QS</span><span class="ft-row-value ft-danger">${v.corrienteArranqueSin}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Amp. arranque CON QS</span><span class="ft-row-value ft-highlight">${v.corrienteArranqueCon}</span></div>
  </div>
</div>`).join("")}
` : sub === 'cuando' ? `
${d.cuandoUsarlo.map((item, i) => `
<div class="ft-card" style="display:flex;align-items:flex-start;gap:12px;">
  <div class="dx-paso-num">${i+1}</div>
  <span style="font-size:13px;color:#ccd9ee;line-height:1.6;">${item}</span>
</div>`).join("")}
` : `
${d.instalacion.map((paso, i) => `
<div class="ft-card" style="display:flex;align-items:flex-start;gap:12px;">
  <div class="dx-paso-num">${i+1}</div>
  <span style="font-size:13px;color:#ccd9ee;line-height:1.6;">${paso}</span>
</div>`).join("")}
`}`;
  },

  // ═══════════════════════════════════════════════
  // RESISTENCIAS DE DESHIELO
  // ═══════════════════════════════════════════════

  renderResistencias() {
    const d   = this.data?.resistencias;
    if (!d) return "";
    const sub = this.activeSubTab;
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${sub==='ciclica'?'active':''}"   data-sub="ciclica">🧊 Cíclica</button>
  <button class="ft-subtab ${sub==='nofrost'?'active':''}"   data-sub="nofrost">🌬️ No Frost</button>
  <button class="ft-subtab ${sub==='comercial'?'active':''}" data-sub="comercial">🏭 Comercial</button>
  <button class="ft-subtab ${sub==='bimetal'?'active':''}"   data-sub="bimetal">🌡️ Bimetal</button>
</div>

${sub !== 'bimetal' ? `
<div class="ft-info-badge">🌀 Medición en Ω con resistencia FRÍA y desconectada. Fórmula: R = 48.400 ÷ Watts</div>
<div class="ft-table-wrapper">
  <table class="ft-table">
    <thead><tr><th>Watts</th><th>Ω esperados</th><th>Amp</th><th>Uso</th></tr></thead>
    <tbody>
      ${(d[sub] || []).map(r => `
      <tr>
        <td style="font-weight:700;color:#fff;">${r.watt}</td>
        <td class="ft-psi">${r.ohms}</td>
        <td style="color:#ff9b42;">${r.corriente}</td>
        <td style="font-size:11px;color:#6688aa;">${r.uso}</td>
      </tr>
      ${r.nota ? `<tr><td colspan="4" style="font-size:11px;color:#445566;font-style:italic;padding:4px 12px 10px;">${r.nota}</td></tr>` : ''}`).join("")}
    </tbody>
  </table>
</div>
<div class="ft-card">
  <div class="ft-card-title" style="margin-bottom:8px;">📐 Fórmula de verificación</div>
  <div style="text-align:center;padding:12px;background:rgba(0,217,255,.05);border-radius:12px;">
    <div style="font-size:20px;font-weight:900;color:#00d9ff;">R = 48.400 ÷ W</div>
    <div style="font-size:12px;color:#556677;margin-top:6px;">Ejemplo: 150W → 48.400 ÷ 150 = 323 Ω</div>
  </div>
</div>
` : `
<div class="ft-info-badge">🌡️ El bimetal corta la resistencia cuando alcanza su temperatura de apertura</div>
${d.bimetal.map(b => `
<div class="ft-card">
  <div class="ft-card-header"><span class="ft-card-title">${b.tipo}</span></div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Uso</span><span class="ft-row-value">${b.uso}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Abre a</span><span class="ft-row-value ft-danger">${b.apertura}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Cierra a</span><span class="ft-row-value ft-cold">${b.cierre}</span></div>
  </div>
</div>`).join("")}
`}`;
  },



  // ═══════════════════════════════════════════════
  // SH / SC — CALCULADORAS
  // ═══════════════════════════════════════════════


  shsc_sh() {
    return `
<div class="ft-info-badge">
  🌡️ SH = Temp. succión medida − Temp. saturación a PSI de baja<br>
  <span style="color:#445566;">Rango normal splits: <strong style="color:#00d9ff;">5°C a 12°C</strong></span>
</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">Gas refrigerante</label>
    <select id="shGas" class="hvac-select">
      <option value="r410a">R410A</option>
      <option value="r32">R32</option>
      <option value="r22">R22</option>
      <option value="r134a">R134a</option>
      <option value="r404a">R404A</option>
    </select>
  </div>
  <div class="calc-field-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div class="calc-field">
      <label class="calc-label">📉 PSI de BAJA (manómetro)</label>
      <input type="number" id="shPsiBaja" class="hvac-input" placeholder="ej: 120" step="1"/>
    </div>
    <div class="calc-field">
      <label class="calc-label">🌡️ Temp. succión °C (termómetro contacto)</label>
      <input type="number" id="shTempSuccion" class="hvac-input" placeholder="ej: 12" step="0.5"/>
    </div>
  </div>
  <button class="calc-btn" id="calcSH">Calcular SH</button>
  <div id="calcSHResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">📋 Cómo medir la temperatura de succión</div>
  <div style="font-size:12.5px;color:#9aabbf;line-height:1.8;">
    • Termómetro de contacto (pinza o sonda) en el tubo <strong style="color:#fff;">grueso</strong><br>
    • Lo más cerca posible del compresor<br>
    • Bien apoyado sobre el cobre, aislado del ambiente<br>
    • Esperá 2 minutos que se estabilice antes de leer
  </div>
</div>`;
  },

  shsc_sc() {
    return `
<div class="ft-info-badge">
  ❄️ SC = Temp. saturación a PSI de alta − Temp. línea de líquido medida<br>
  <span style="color:#445566;">Rango normal splits: <strong style="color:#00d9ff;">4°C a 8°C</strong></span>
</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">Gas refrigerante</label>
    <select id="scGas" class="hvac-select">
      <option value="r410a">R410A</option>
      <option value="r32">R32</option>
      <option value="r22">R22</option>
      <option value="r134a">R134a</option>
      <option value="r404a">R404A</option>
    </select>
  </div>
  <div class="calc-field-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div class="calc-field">
      <label class="calc-label">📈 PSI de ALTA (manómetro)</label>
      <input type="number" id="scPsiAlta" class="hvac-input" placeholder="ej: 330" step="1"/>
    </div>
    <div class="calc-field">
      <label class="calc-label">❄️ Temp. línea líquido °C (termómetro contacto)</label>
      <input type="number" id="scTempLiquido" class="hvac-input" placeholder="ej: 32" step="0.5"/>
    </div>
  </div>
  <button class="calc-btn" id="calcSC">Calcular SC</button>
  <div id="calcSCResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">📋 Cómo medir la temperatura de línea de líquido</div>
  <div style="font-size:12.5px;color:#9aabbf;line-height:1.8;">
    • Termómetro de contacto en el tubo <strong style="color:#fff;">fino</strong><br>
    • Después del condensador, antes del capilar o TXV<br>
    • Bien apoyado sobre el cobre, aislado del ambiente<br>
    • Esperá 2 minutos que se estabilice antes de leer
  </div>
</div>`;
  },

  shsc_patron() {
    const patrones = [
      { sh:"ALTO",   sc:"BAJO",   psi_baja:"BAJO",   psi_alta:"BAJO",   dx:"💨 Fuga de gas",          color:"#ff5252", desc:"El sistema perdió refrigerante. Buscá la fuga antes de cargar." },
      { sh:"BAJO",   sc:"ALTO",   psi_baja:"ALTO",   psi_alta:"ALTO",   dx:"⛽ Exceso de gas",         color:"#ff9b42", desc:"Se cargó más gas del necesario. Purgar de a poco." },
      { sh:"ALTO",   sc:"ALTO",   psi_baja:"BAJO",   psi_alta:"ALTO",   dx:"🔒 Restricción",           color:"#ff9b42", desc:"Capilar tapado, filtro deshidratador o TXV cerrada." },
      { sh:"BAJO",   sc:"BAJO",   psi_baja:"ALTO",   psi_alta:"ALTO",   dx:"🔥 Condensador sobrecargado", color:"#ff9b42", desc:"Condensador sucio o sin ventilación. Limpiar primero." },
      { sh:"NORMAL", sc:"NORMAL", psi_baja:"NORMAL", psi_alta:"NORMAL", dx:"✅ Sistema en rango",        color:"#00d9ff", desc:"El problema no está en el sistema refrigerante." },
      { sh:"BAJO",   sc:"NORMAL", psi_baja:"NORMAL", psi_alta:"NORMAL", dx:"🌬️ Airflow insuficiente",   color:"#ff9b42", desc:"Evaporador inundado por poco calor de retorno. Revisar filtro." },
    ];
    return `
<div class="ft-info-badge">🔍 Combiná SH + SC + PSI para identificar la falla</div>
${patrones.map(p => `
<div class="ft-card" style="border-left:3px solid ${p.color};">
  <div class="ft-card-header">
    <span class="ft-card-title" style="color:${p.color};">${p.dx}</span>
  </div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">SH</span><span class="ft-row-value" style="color:${p.sh==="NORMAL"?"#00d9ff":p.sh==="ALTO"?"#ff5252":"#ff9b42"};">${p.sh}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">SC</span><span class="ft-row-value" style="color:${p.sc==="NORMAL"?"#00d9ff":p.sc==="ALTO"?"#ff5252":"#ff9b42"};">${p.sc}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">PSI baja</span><span class="ft-row-value">${p.psi_baja}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">PSI alta</span><span class="ft-row-value">${p.psi_alta}</span></div>
  </div>
  <div class="ft-nota">💡 ${p.desc}</div>
</div>`).join("")}`;
  },

  // ═══════════════════════════════════════════════
  // CALCULADORAS TÉCNICAS
  // ═══════════════════════════════════════════════

  renderCalc() {
    const sub = this.activeSubTab === "deltat" || 
                this.activeSubTab === "cargagas" || 
                this.activeSubTab === "resistencia" || 
                this.activeSubTab === "conversor" ||
                this.activeSubTab === "psi_temp"
                ? this.activeSubTab : "deltat";

    return `
<div class="ft-subtabs" style="flex-wrap:wrap;gap:6px;">
  <button class="ft-subtab ${sub==="deltat"?"active":""}"     data-sub="deltat">🌡️ Delta T</button>
  <button class="ft-subtab ${sub==="cargagas"?"active":""}"   data-sub="cargagas">⚖️ Carga Gas</button>
  <button class="ft-subtab ${sub==="resistencia"?"active":""}" data-sub="resistencia">🌀 Resistencia</button>
  <button class="ft-subtab ${sub==="conversor"?"active":""}"  data-sub="conversor">🔄 Conversor</button>
  <button class="ft-subtab ${sub==="psi_temp"?"active":""}"   data-sub="psi_temp">📊 PSI/Temp</button>
</div>
${this["calc_" + sub]()}
`;
  },

  // --- DELTA T ---
  calc_deltat() {
    return `
<div class="ft-info-badge">🌡️ Diferencia de temperatura entrada/salida del evaporador. Normal: 8°C a 14°C</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">🌡️ Temperatura de entrada (retorno) °C</label>
    <input type="number" id="calcTempIn" class="hvac-input" placeholder="ej: 28" step="0.5"/>
  </div>
  <div class="calc-field">
    <label class="calc-label">❄️ Temperatura de salida (impulsión) °C</label>
    <input type="number" id="calcTempOut" class="hvac-input" placeholder="ej: 16" step="0.5"/>
  </div>
  <button class="calc-btn" id="calcDeltaT">Calcular Delta T</button>
  <div id="calcDeltaTResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">📋 Referencia Delta T</div>
  <div class="calc-ref-row"><span class="calc-ref-label">Menos de 6°C</span><span class="calc-ref-val calc-danger">❌ Muy bajo — Airflow o gas crítico</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">6°C a 8°C</span><span class="calc-ref-val calc-warn">⚠️ Bajo — Revisar filtros y gas</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">8°C a 14°C</span><span class="calc-ref-val calc-ok">✅ Normal</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">14°C a 18°C</span><span class="calc-ref-val calc-warn">⚠️ Alto — Posible exceso de gas</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">Más de 18°C</span><span class="calc-ref-val calc-danger">❌ Muy alto — Airflow muy bajo</span></div>
</div>`;
  },

  // --- CARGA DE GAS ---
  calc_cargagas() {
    return `
<div class="ft-info-badge">⚖️ Calculá exactamente cuántos gramos cargar según la plaqueta del equipo</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">📋 Carga nominal (plaqueta del equipo) en gramos</label>
    <input type="number" id="calcCargaNominal" class="hvac-input" placeholder="ej: 650" step="1"/>
  </div>
  <div class="calc-field">
    <label class="calc-label">⚖️ Peso botella LLENA (referencia) en gramos</label>
    <input type="number" id="calcBotellallena" class="hvac-input" placeholder="ej: 5800" step="1"/>
  </div>
  <div class="calc-field">
    <label class="calc-label">⚖️ Peso botella ACTUAL en gramos</label>
    <input type="number" id="calcBotellaActual" class="hvac-input" placeholder="ej: 5400" step="1"/>
  </div>
  <div class="calc-field">
    <label class="calc-label">⚖️ Peso del sistema ANTES de cargar en gramos</label>
    <input type="number" id="calcSistemaActual" class="hvac-input" placeholder="ej: 0 (si hizo vacío)" step="1"/>
    <span style="font-size:11px;color:#556677;margin-top:4px;display:block;">Si hiciste vacío completo, poné 0. Si hay gas residual, pesá el sistema.</span>
  </div>
  <button class="calc-btn" id="calcCargaGas">Calcular carga</button>
  <div id="calcCargaGasResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">⚠️ Recordá siempre</div>
  <div style="font-size:12.5px;color:#9aabbf;line-height:1.8;">
    • R410A y R404A: cargar en fase <strong style="color:#00d9ff;">líquida</strong> (botella invertida)<br>
    • R22 y R134a: podés cargar en fase gaseosa por baja presión<br>
    • R32: líquido, con cuidado — inflamable A2L<br>
    • Tolerancia de carga: ±3% del nominal de plaqueta<br>
    • Pesá la botella en balanza de 0.1g de resolución
  </div>
</div>`;
  },

  // --- RESISTENCIA ---
  calc_resistencia() {
    return `
<div class="ft-info-badge">🌀 Calculá la resistencia esperada de cualquier elemento resistivo</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">⚡ Potencia (Watts)</label>
    <input type="number" id="calcWatts" class="hvac-input" placeholder="ej: 150" step="1"/>
  </div>
  <div class="calc-field">
    <label class="calc-label">🔌 Tensión (Voltios)</label>
    <select id="calcVoltaje" class="hvac-select">
      <option value="220">220V (Argentina)</option>
      <option value="110">110V</option>
      <option value="380">380V (trifásico)</option>
      <option value="12">12V (DC)</option>
      <option value="24">24V (DC)</option>
    </select>
  </div>
  <button class="calc-btn" id="calcResistencia">Calcular</button>
  <div id="calcResistenciaResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">📐 Fórmulas usadas</div>
  <div style="font-size:13px;color:#9aabbf;line-height:2;">
    <strong style="color:#00d9ff;">R = V² ÷ W</strong> → Resistencia en Ω<br>
    <strong style="color:#00d9ff;">I = W ÷ V</strong> → Corriente en Amperes<br>
    <strong style="color:#00d9ff;">W = V × I</strong> → Potencia en Watts
  </div>
</div>`;
  },

  // --- CONVERSOR PSI / BAR / KPA ---
  calc_conversor() {
    return `
<div class="ft-info-badge">🔄 Convertí entre unidades de presión al instante</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">Valor a convertir</label>
    <input type="number" id="calcConvValor" class="hvac-input" placeholder="ej: 120" step="0.1"/>
  </div>
  <div class="calc-field">
    <label class="calc-label">Unidad de entrada</label>
    <select id="calcConvUnidad" class="hvac-select">
      <option value="psi">PSI</option>
      <option value="bar">BAR</option>
      <option value="kpa">kPa</option>
      <option value="kg">kgf/cm²</option>
      <option value="mpa">MPa</option>
    </select>
  </div>
  <button class="calc-btn" id="calcConversor">Convertir</button>
  <div id="calcConversorResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">📋 Equivalencias rápidas</div>
  <div class="calc-ref-row"><span class="calc-ref-label">1 PSI</span><span class="calc-ref-val" style="color:#00d9ff;">= 0.0689 BAR = 6.895 kPa</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">1 BAR</span><span class="calc-ref-val" style="color:#00d9ff;">= 14.504 PSI = 100 kPa</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">1 kgf/cm²</span><span class="calc-ref-val" style="color:#00d9ff;">= 14.22 PSI = 0.981 BAR</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">1 MPa</span><span class="calc-ref-val" style="color:#00d9ff;">= 145 PSI = 10 BAR</span></div>
</div>`;
  },

  // --- PSI SEGÚN TEMPERATURA AMBIENTE ---
  calc_psi_temp() {
    return `
<div class="ft-info-badge">📊 PSI de baja presión esperado según la temperatura ambiente del día</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">🌡️ Temperatura ambiente actual (°C)</label>
    <input type="number" id="calcTempAmb" class="hvac-input" placeholder="ej: 32" step="1"/>
  </div>
  <div class="calc-field">
    <label class="calc-label">Gas refrigerante</label>
    <select id="calcPsiGas" class="hvac-select">
      <option value="r410a">R410A</option>
      <option value="r32">R32</option>
      <option value="r22">R22</option>
      <option value="r134a">R134a</option>
      <option value="r404a">R404A</option>
    </select>
  </div>
  <div class="calc-field">
    <label class="calc-label">Tipo de equipo</label>
    <select id="calcPsiTipo" class="hvac-select">
      <option value="split">Split / Aire acondicionado</option>
      <option value="heladera">Heladera doméstica</option>
      <option value="comercial">Refrigeración comercial</option>
    </select>
  </div>
  <button class="calc-btn" id="calcPsiTemp">Calcular PSI esperado</button>
  <div id="calcPsiTempResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">💡 Por qué varía el PSI con la temperatura</div>
  <div style="font-size:12.5px;color:#9aabbf;line-height:1.7;">
    Con más calor ambiente, el condensador trabaja más y la presión de alta sube. 
    Eso arrastra también la presión de baja. Un PSI "bajo" en invierno puede ser 
    normal, mientras que en verano puede indicar falta de gas. Esta calculadora 
    ajusta el rango esperado según el contexto real del día.
  </div>
</div>`;
  },


  // ═══════════════════════════════════════════════
  // SH / SC — SOBRECALENTAMIENTO Y SUBENFRIAMIENTO
  // ═══════════════════════════════════════════════

  renderSHSC() {
    const sub = ["sh","sc","combinado"].includes(this.activeSubTab)
                ? this.activeSubTab : "sh";
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${sub==="sh"?"active":""}"        data-sub="sh">🌡️ Sobrecalent.</button>
  <button class="ft-subtab ${sub==="sc"?"active":""}"        data-sub="sc">❄️ Subenfriamiento</button>
  <button class="ft-subtab ${sub==="combinado"?"active":""}" data-sub="combinado">📊 Combinado</button>
</div>
${sub === "sh" ? this.renderSH() : sub === "sc" ? this.renderSC() : this.renderSHSCCombinado()}
`;
  },

  // ─── CALCULADORA SH ─────────────────────────────

  renderSH() {
    return `
<div class="ft-info-badge">
  🌡️ SH = Temp. succión medida − Temp. saturación a PSI de baja<br>
  <span style="font-size:11px;color:#445566;">Normal en splits: 6°C a 12°C · Ideal: 8°C</span>
</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">Gas refrigerante</label>
    <select id="shGas" class="hvac-select">
      <option value="R410A">R410A</option>
      <option value="R32">R32</option>
      <option value="R22">R22</option>
      <option value="R134a">R134a</option>
      <option value="R404A">R404A</option>
    </select>
  </div>
  <div class="calc-field">
    <label class="calc-label">Tipo de equipo</label>
    <select id="shTipo" class="hvac-select">
      <option value="split">Split / Aire acondicionado</option>
      <option value="heladera">Heladera</option>
      <option value="comercial">Comercial</option>
    </select>
  </div>
  <div class="dx-field-row">
    <div class="calc-field">
      <label class="calc-label">📉 PSI de BAJA (succión)</label>
      <input type="number" id="shPsiBaja" class="hvac-input" placeholder="ej: 120" step="1"/>
    </div>
    <div class="calc-field">
      <label class="calc-label">🌡️ Temp. succión medida (°C)</label>
      <input type="number" id="shTempSuccion" class="hvac-input" placeholder="ej: 15" step="0.5"/>
    </div>
  </div>
  <button class="calc-btn" id="calcSH">Calcular SH</button>
  <div id="calcSHResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">📋 Rangos de referencia SH</div>
  <div class="calc-ref-row"><span class="calc-ref-label">Menos de 2°C</span><span class="calc-ref-val calc-danger">🔴 CRÍTICO — Retorno de líquido</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">2°C a 6°C</span><span class="calc-ref-val calc-warn">🟠 Bajo — Evaporador inundado</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">6°C a 12°C</span><span class="calc-ref-val calc-ok">✅ Normal (splits)</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">12°C a 20°C</span><span class="calc-ref-val calc-warn">🟠 Alto — Falta gas / restricción</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">Más de 20°C</span><span class="calc-ref-val calc-danger">🔴 Muy alto — Situación crítica</span></div>
</div>`;
  },

  // ─── CALCULADORA SC ─────────────────────────────

  renderSC() {
    return `
<div class="ft-info-badge">
  ❄️ SC = Temp. saturación a PSI de alta − Temp. línea de líquido medida<br>
  <span style="font-size:11px;color:#445566;">Normal en splits: 4°C a 10°C · Ideal: 6°C</span>
</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">Gas refrigerante</label>
    <select id="scGas" class="hvac-select">
      <option value="R410A">R410A</option>
      <option value="R32">R32</option>
      <option value="R22">R22</option>
      <option value="R134a">R134a</option>
      <option value="R404A">R404A</option>
    </select>
  </div>
  <div class="calc-field">
    <label class="calc-label">Tipo de equipo</label>
    <select id="scTipo" class="hvac-select">
      <option value="split">Split / Aire acondicionado</option>
      <option value="heladera">Heladera</option>
      <option value="comercial">Comercial</option>
    </select>
  </div>
  <div class="dx-field-row">
    <div class="calc-field">
      <label class="calc-label">📈 PSI de ALTA (condensación)</label>
      <input type="number" id="scPsiAlta" class="hvac-input" placeholder="ej: 330" step="1"/>
    </div>
    <div class="calc-field">
      <label class="calc-label">❄️ Temp. línea de líquido (°C)</label>
      <input type="number" id="scTempLiquido" class="hvac-input" placeholder="ej: 35" step="0.5"/>
    </div>
  </div>
  <button class="calc-btn" id="calcSC">Calcular SC</button>
  <div id="calcSCResult"></div>
</div>
<div class="calc-ref-card">
  <div class="calc-ref-title">📋 Rangos de referencia SC</div>
  <div class="calc-ref-row"><span class="calc-ref-label">Negativo</span><span class="calc-ref-val calc-danger">🔴 Vapor en línea de líquido</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">0°C a 4°C</span><span class="calc-ref-val calc-warn">🟠 Bajo — Gas insuficiente</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">4°C a 10°C</span><span class="calc-ref-val calc-ok">✅ Normal (splits)</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">10°C a 15°C</span><span class="calc-ref-val calc-warn">🟠 Alto — Posible exceso</span></div>
  <div class="calc-ref-row"><span class="calc-ref-label">Más de 15°C</span><span class="calc-ref-val calc-danger">🔴 Muy alto — Restricción</span></div>
</div>`;
  },

  // ─── CALCULADORA COMBINADA ───────────────────────

  renderSHSCCombinado() {
    return `
<div class="ft-info-badge">
  📊 Calculá SH y SC juntos para el diagnóstico completo de carga de gas
</div>
<div class="calc-card">
  <div class="calc-field">
    <label class="calc-label">Gas refrigerante</label>
    <select id="combGas" class="hvac-select">
      <option value="R410A">R410A</option>
      <option value="R32">R32</option>
      <option value="R22">R22</option>
      <option value="R134a">R134a</option>
      <option value="R404A">R404A</option>
    </select>
  </div>
  <div class="calc-field">
    <label class="calc-label">Tipo de equipo</label>
    <select id="combTipo" class="hvac-select">
      <option value="split">Split / Aire acondicionado</option>
      <option value="heladera">Heladera</option>
      <option value="comercial">Comercial</option>
    </select>
  </div>
  <div class="dx-field-row">
    <div class="calc-field">
      <label class="calc-label">📉 PSI BAJA (succión)</label>
      <input type="number" id="combPsiBaja" class="hvac-input" placeholder="ej: 120" step="1"/>
    </div>
    <div class="calc-field">
      <label class="calc-label">📈 PSI ALTA (condensación)</label>
      <input type="number" id="combPsiAlta" class="hvac-input" placeholder="ej: 330" step="1"/>
    </div>
  </div>
  <div class="dx-field-row">
    <div class="calc-field">
      <label class="calc-label">🌡️ Temp. succión (°C)</label>
      <input type="number" id="combTempSuccion" class="hvac-input" placeholder="ej: 15" step="0.5"/>
    </div>
    <div class="calc-field">
      <label class="calc-label">❄️ Temp. línea líquido (°C)</label>
      <input type="number" id="combTempLiquido" class="hvac-input" placeholder="ej: 35" step="0.5"/>
    </div>
  </div>
  <button class="calc-btn" id="calcCombinado">📊 Diagnóstico completo</button>
  <div id="calcCombinadoResult"></div>
</div>`;
  },

  // ═══════════════════════════════════════════════
  // RELAY TÉRMICO
  // ═══════════════════════════════════════════════

  renderRelay() {
    const d   = this.data?.relay;
    if (!d) return "";
    const sub = this.activeSubTab;
    return `
<div class="ft-subtabs">
  <button class="ft-subtab ${sub==='calibracion'?'active':''}" data-sub="calibracion">⚙️ Calibración</button>
  <button class="ft-subtab ${sub==='verif'?'active':''}"       data-sub="verif">✅ Verificación</button>
  <button class="ft-subtab ${sub==='fallas'?'active':''}"      data-sub="fallas">❌ Fallas</button>
</div>

<div class="ft-info-badge">🔴 ${d.regla}</div>

${sub === 'calibracion' ? `
<div class="ft-table-wrapper">
  <table class="ft-table">
    <thead><tr><th>HP</th><th>Amp nominal</th><th>Calibrar en</th><th>Contactor</th></tr></thead>
    <tbody>
      ${d.calibracion.map(r => `
      <tr>
        <td style="font-weight:800;color:#fff;">${r.hp}</td>
        <td style="color:#aabbcc;">${r.ampNominal}</td>
        <td class="ft-psi">${r.calibrarEn}</td>
        <td style="font-size:11px;color:#6688aa;">${r.contactor}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>
` : sub === 'verif' ? `
${d.verificacion.map((paso, i) => `
<div class="ft-card" style="display:flex;align-items:flex-start;gap:12px;">
  <div class="dx-paso-num">${i+1}</div>
  <span style="font-size:13px;color:#ccd9ee;line-height:1.6;">${paso}</span>
</div>`).join("")}
` : `
${d.fallas.map(f => `
<div class="ft-card">
  <div class="ft-card-header"><span class="ft-card-title ft-danger">❌ ${f.falla}</span></div>
  <div class="ft-row-data">
    <div class="ft-row-item"><span class="ft-row-label">Causa</span><span class="ft-row-value ft-warn">${f.causa}</span></div>
    <div class="ft-row-item"><span class="ft-row-label">Acción</span><span class="ft-row-value ft-highlight">${f.accion}</span></div>
  </div>
</div>`).join("")}
`}`;
  },

  // ═══════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════

  bindEvents() {
    document.getElementById("ftBack")?.addEventListener("click", () => Router.back());

    document.querySelectorAll(".ft-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab    = btn.dataset.tab;
        this.activeSubTab = ["amp","capacitor","temp"].includes(this.activeTab) ? "aires"
                          : this.activeTab === "quickstart"   ? "valores"
                          : this.activeTab === "resistencias" ? "ciclica"
                          : this.activeTab === "relay"        ? "calibracion"
                          : this.activeTab === "ntc"          ? "10k"
                          : this.activeTab === "shsc"         ? "sh"
                          : this.activeTab === "calc"         ? "deltat"
                          : this.activeTab === "shsc"         ? "sh"
                          : "aires";
        document.querySelectorAll(".ft-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("ft-content").innerHTML = this.renderTab(this.activeTab);
        this.bindContentEvents();
      });
    });

    this.bindContentEvents();
  },

  bindContentEvents() {
    document.querySelectorAll(".ft-subtab").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.sub)  this.activeSubTab  = btn.dataset.sub;
        if (btn.dataset.ntc)  this.activeNTCVal  = btn.dataset.ntc;
        if (btn.dataset.gas)  this.activePTGas   = btn.dataset.gas;
        document.getElementById("ft-content").innerHTML = this.renderTab(this.activeTab);
        this.bindContentEvents();
      });
    });

    // ─── IDENTIFICADOR DE GAS POR REPOSO ────────────
    document.getElementById("ftIdBtnIdentificar")?.addEventListener("click", () => {
      this.identificarGasPorReposo();
    });
    document.getElementById("ftIdPsi")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.identificarGasPorReposo();
    });



    // ─── CALCULADORA SH ─────────────────────────────
    document.getElementById("calcSH")?.addEventListener("click", async () => {
      const gas  = document.getElementById("shGas")?.value;
      const psi  = document.getElementById("shPsiBaja")?.value;
      const temp = document.getElementById("shTempSuccion")?.value;
      const el   = document.getElementById("calcSHResult");
      if (!el) return;
      if (!psi || !temp) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá PSI de baja y temperatura de succión.</div>'; return; }

      await SHSCEngine.init();
      const result = SHSCEngine.calcSH(psi, temp, gas);
      if (!result) { el.innerHTML = '<div class="calc-error">⚠️ PSI fuera de rango para ese gas. Verificá los datos.</div>'; return; }

      const diag  = SHSCEngine.diagSH(result.sh, "split");
      el.innerHTML = `
        <div class="calc-result" style="border-color:${diag.color};">
          <div class="calc-result-val" style="color:${diag.color};">${result.sh}°C</div>
          <div class="calc-result-label">SH — Sobrecalentamiento</div>
          <div class="calc-result-estado" style="color:${diag.color};">${diag.icono} ${diag.titulo}</div>
          <div class="calc-ref-row" style="margin-top:12px;"><span class="calc-ref-label">T° saturación baja</span><span class="calc-ref-val" style="color:#00d9ff;">${result.tsat}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">T° succión medida</span><span class="calc-ref-val">${temp}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Rango normal splits</span><span class="calc-ref-val">5°C a 12°C</span></div>
          <div class="calc-result-consejo">💬 ${diag.accion}</div>
        </div>`;
    });

    // ─── CALCULADORA SC ─────────────────────────────
    document.getElementById("calcSC")?.addEventListener("click", async () => {
      const gas  = document.getElementById("scGas")?.value;
      const psi  = document.getElementById("scPsiAlta")?.value;
      const temp = document.getElementById("scTempLiquido")?.value;
      const el   = document.getElementById("calcSCResult");
      if (!el) return;
      if (!psi || !temp) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá PSI de alta y temperatura de línea de líquido.</div>'; return; }

      await SHSCEngine.init();
      const result = SHSCEngine.calcSC(psi, temp, gas);
      if (!result) { el.innerHTML = '<div class="calc-error">⚠️ PSI fuera de rango para ese gas. Verificá los datos.</div>'; return; }

      const diag  = SHSCEngine.diagSC(result.sc, "split");
      el.innerHTML = `
        <div class="calc-result" style="border-color:${diag.color};">
          <div class="calc-result-val" style="color:${diag.color};">${result.sc}°C</div>
          <div class="calc-result-label">SC — Subenfriamiento</div>
          <div class="calc-result-estado" style="color:${diag.color};">${diag.icono} ${diag.titulo}</div>
          <div class="calc-ref-row" style="margin-top:12px;"><span class="calc-ref-label">T° saturación alta</span><span class="calc-ref-val" style="color:#00d9ff;">${result.tsat}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">T° línea líquido medida</span><span class="calc-ref-val">${temp}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Rango normal splits</span><span class="calc-ref-val">4°C a 8°C</span></div>
          <div class="calc-result-consejo">💬 ${diag.accion}</div>
        </div>`;
    });

    // ─── CALCULADORAS ───────────────────────────────

    // Delta T
    document.getElementById("calcDeltaT")?.addEventListener("click", () => {
      const tin  = parseFloat(document.getElementById("calcTempIn")?.value);
      const tout = parseFloat(document.getElementById("calcTempOut")?.value);
      const el   = document.getElementById("calcDeltaTResult");
      if (!el) return;
      if (isNaN(tin) || isNaN(tout)) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá ambas temperaturas.</div>'; return; }
      const dt = tin - tout;
      const color = dt < 6 ? "#ff5252" : dt < 8 ? "#ff9b42" : dt <= 14 ? "#00d9ff" : dt <= 18 ? "#ff9b42" : "#ff5252";
      const estado = dt < 6 ? "❌ Muy bajo — Revisar airflow y gas urgente"
                   : dt < 8 ? "⚠️ Bajo — Limpiar filtros y verificar gas"
                   : dt <= 14 ? "✅ Normal — Sistema en rango correcto"
                   : dt <= 18 ? "⚠️ Alto — Posible exceso de gas o airflow muy bajo"
                   : "❌ Muy alto — Problema serio de airflow";
      const consejo = dt < 6 ? "Antes de tocar el gas: limpiá el filtro y medí el caudal de aire. En el 60% de los casos se resuelve sin gas."
                    : dt < 8 ? "Limpiar filtro es el primer paso. Si después de limpiar sigue bajo, ahí sí chequeá el gas."
                    : dt <= 14 ? "El sistema está transfiriendo calor correctamente. Registrá este valor como baseline."
                    : dt <= 18 ? "Revisá que el filtro no esté muy tapado reduciendo el caudal. También verificá si el gas fue cargado recientemente."
                    : "El caudal de aire es casi nulo. Revisá turbina, filtro y que no haya hielo en el evaporador.";
      el.innerHTML = `
        <div class="calc-result" style="border-color:${color};">
          <div class="calc-result-val" style="color:${color};">${dt.toFixed(1)}°C</div>
          <div class="calc-result-label">Delta T</div>
          <div class="calc-result-estado" style="color:${color};">${estado}</div>
          <div class="calc-result-consejo">💬 ${consejo}</div>
        </div>`;
    });

    // Carga de gas
    document.getElementById("calcCargaGas")?.addEventListener("click", () => {
      const nominal  = parseFloat(document.getElementById("calcCargaNominal")?.value);
      const botLlena = parseFloat(document.getElementById("calcBotellallena")?.value);
      const botActual= parseFloat(document.getElementById("calcBotellaActual")?.value);
      const sisActual= parseFloat(document.getElementById("calcSistemaActual")?.value) || 0;
      const el       = document.getElementById("calcCargaGasResult");
      if (!el) return;
      if (isNaN(nominal) || isNaN(botActual)) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá la carga nominal y el peso actual de la botella.</div>'; return; }
      const gasResidual   = sisActual;
      const gasACargar    = Math.max(0, nominal - gasResidual);
      const pesoObjetivo  = botActual - gasACargar;
      const gasEnBotella  = isNaN(botLlena) ? null : botActual - (botLlena - nominal * 10); // estimado
      const tolerancia    = nominal * 0.03;
      el.innerHTML = `
        <div class="calc-result" style="border-color:#00d9ff;">
          <div class="calc-result-val" style="color:#00d9ff;">${gasACargar.toFixed(0)}g</div>
          <div class="calc-result-label">Gas a cargar</div>
          <div class="calc-ref-row" style="margin-top:12px;"><span class="calc-ref-label">Carga nominal</span><span class="calc-ref-val">${nominal}g</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Gas residual en sistema</span><span class="calc-ref-val">${gasResidual}g</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Gas a agregar</span><span class="calc-ref-val" style="color:#00d9ff;font-weight:800;">${gasACargar.toFixed(0)}g</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Peso objetivo de botella</span><span class="calc-ref-val" style="color:#ff9b42;font-weight:800;">${isNaN(botActual)?"-":(botActual - gasACargar).toFixed(0)}g</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Tolerancia (±3%)</span><span class="calc-ref-val">±${tolerancia.toFixed(0)}g</span></div>
          <div class="calc-result-consejo">💬 Cargá hasta que la balanza marque ${isNaN(botActual)?"-":(botActual - gasACargar).toFixed(0)}g en la botella. Pará la carga y esperá 5 min para verificar PSI y amperaje.</div>
        </div>`;
    });

    // Resistencia
    document.getElementById("calcResistencia")?.addEventListener("click", () => {
      const watts   = parseFloat(document.getElementById("calcWatts")?.value);
      const voltaje = parseFloat(document.getElementById("calcVoltaje")?.value) || 220;
      const el      = document.getElementById("calcResistenciaResult");
      if (!el) return;
      if (isNaN(watts) || watts <= 0) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá los Watts.</div>'; return; }
      const R = (voltaje * voltaje) / watts;
      const I = watts / voltaje;
      const toleranciaMin = R * 0.9;
      const toleranciaMax = R * 1.1;
      el.innerHTML = `
        <div class="calc-result" style="border-color:#00d9ff;">
          <div class="calc-result-val" style="color:#00d9ff;">${R.toFixed(1)} Ω</div>
          <div class="calc-result-label">Resistencia esperada</div>
          <div class="calc-ref-row" style="margin-top:12px;"><span class="calc-ref-label">Corriente (I)</span><span class="calc-ref-val">${I.toFixed(2)} A</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Potencia</span><span class="calc-ref-val">${watts} W a ${voltaje}V</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Rango aceptable (±10%)</span><span class="calc-ref-val" style="color:#ff9b42;">${toleranciaMin.toFixed(0)} — ${toleranciaMax.toFixed(0)} Ω</span></div>
          <div class="calc-result-consejo">💬 Con el multímetro en Ω medís entre los terminales de la resistencia FRÍA y desconectada. Si mide dentro del rango → está bien. Fuera del rango o ∞ → reemplazar.</div>
        </div>`;
    });

    // Conversor de presión
    document.getElementById("calcConversor")?.addEventListener("click", () => {
      const valor  = parseFloat(document.getElementById("calcConvValor")?.value);
      const unidad = document.getElementById("calcConvUnidad")?.value;
      const el     = document.getElementById("calcConversorResult");
      if (!el) return;
      if (isNaN(valor)) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá un valor.</div>'; return; }

      // Convertir todo a PSI primero
      const toPSI = { psi: 1, bar: 14.5038, kpa: 0.14504, kg: 14.2233, mpa: 145.038 };
      const psi   = valor * toPSI[unidad];
      const bar   = psi / 14.5038;
      const kpa   = psi * 6.8948;
      const kg    = psi / 14.2233;
      const mpa   = psi / 145.038;

      const nombres = { psi:"PSI", bar:"BAR", kpa:"kPa", kg:"kgf/cm²", mpa:"MPa" };
      el.innerHTML = `
        <div class="calc-result" style="border-color:#00d9ff;">
          <div class="calc-result-label" style="margin-bottom:12px;">${valor} ${nombres[unidad]} equivale a:</div>
          ${[["PSI",psi.toFixed(2)],["BAR",bar.toFixed(3)],["kPa",kpa.toFixed(1)],["kgf/cm²",kg.toFixed(3)],["MPa",mpa.toFixed(4)]].map(([u,v]) => `
          <div class="calc-ref-row">
            <span class="calc-ref-label">${u}</span>
            <span class="calc-ref-val" style="color:${u==="PSI"||u==="BAR"?"#00d9ff":"#9aabbf"};font-weight:${u==="PSI"||u==="BAR"?"800":"500"};">${v}</span>
          </div>`).join("")}
        </div>`;
    });

    // PSI según temperatura ambiente
    document.getElementById("calcPsiTemp")?.addEventListener("click", () => {
      const tempAmb = parseFloat(document.getElementById("calcTempAmb")?.value);
      const gas     = document.getElementById("calcPsiGas")?.value;
      const tipo    = document.getElementById("calcPsiTipo")?.value;
      const el      = document.getElementById("calcPsiTempResult");
      if (!el) return;
      if (isNaN(tempAmb)) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá la temperatura ambiente.</div>'; return; }

      // PSI de baja presión esperado según gas y tipo de equipo
      // Basado en temperatura de evaporación típica + corrección por temp ambiente
      const rangos = {
        r410a: { split: [105,145], heladera: null,     comercial: null },
        r32:   { split: [110,150], heladera: null,     comercial: null },
        r22:   { split: [55,75],   heladera: null,     comercial: [50,70] },
        r134a: { split: null,      heladera: [0,5],    comercial: [0,5] },
        r404a: { split: null,      heladera: null,     comercial: [18,28] }
      };

      const rango = rangos[gas]?.[tipo];
      if (!rango) {
        el.innerHTML = `<div class="calc-error">⚠️ Combinación de gas y equipo no aplicable. Ej: R134a no va en splits.</div>`;
        return;
      }

      // Corrección por temperatura ambiente
      // Por cada 1°C sobre 25°C, la presión de baja sube ~0.5-1 PSI en splits
      // Por cada 1°C bajo 25°C, baja proporcionalmente
      let corrMin, corrMax, factorMin, factorMax;
      if (tipo === "split") {
        factorMin = 0.5; factorMax = 0.8;
      } else {
        factorMin = 0.2; factorMax = 0.4;
      }
      const delta = tempAmb - 25;
      corrMin = Math.round(rango[0] + delta * factorMin);
      corrMax = Math.round(rango[1] + delta * factorMax);

      const gasLabel = { r410a:"R410A", r32:"R32", r22:"R22", r134a:"R134a", r404a:"R404A" }[gas];
      const tipoLabel = { split:"Split/AC", heladera:"Heladera", comercial:"Comercial" }[tipo];

      const contexto = tempAmb >= 35 ? "🔥 Día muy caluroso — normal que el PSI esté en el límite superior. No confundas con exceso de gas."
                     : tempAmb >= 28 ? "☀️ Temperatura normal de verano argentino."
                     : tempAmb >= 18 ? "🌤️ Temperatura templada — rango estable."
                     : tempAmb >= 10 ? "🌡️ Día fresco — el PSI va a estar en el límite inferior. No confundas con falta de gas."
                     : "❄️ Día frío — PSI bajo es normal. Verificar con el sistema en régimen 20 min.";

      el.innerHTML = `
        <div class="calc-result" style="border-color:#00d9ff;">
          <div class="calc-result-val" style="color:#00d9ff;">${corrMin} — ${corrMax} PSI</div>
          <div class="calc-result-label">Rango esperado a ${tempAmb}°C ambiente — ${gasLabel} en ${tipoLabel}</div>
          <div class="calc-ref-row" style="margin-top:12px;"><span class="calc-ref-label">Rango base (25°C)</span><span class="calc-ref-val">${rango[0]} — ${rango[1]} PSI</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Corrección por temp</span><span class="calc-ref-val" style="color:${delta>0?"#ff9b42":"#64d8ff"};">${delta > 0 ? "+" : ""}${Math.round(delta * factorMin)} a ${delta > 0 ? "+" : ""}${Math.round(delta * factorMax)} PSI</span></div>
          <div class="calc-result-consejo">💬 ${contexto}</div>
        </div>`;
    });


    // ─── SH ─────────────────────────────────────────
    document.getElementById("calcSH")?.addEventListener("click", () => {
      const gas   = document.getElementById("shGas")?.value;
      const tipo  = document.getElementById("shTipo")?.value || "split";
      const psi   = parseFloat(document.getElementById("shPsiBaja")?.value);
      const tSuc  = parseFloat(document.getElementById("shTempSuccion")?.value);
      const el    = document.getElementById("calcSHResult");
      if (!el) return;
      if (isNaN(psi) || isNaN(tSuc)) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá PSI de baja y temperatura de succión.</div>'; return; }

      const res = SHSCEngine.calcularSH(gas, psi, tSuc);
      if (!res) { el.innerHTML = '<div class="calc-error">⚠️ PSI fuera de rango para ese gas.</div>'; return; }

      const dx = SHSCEngine.diagnosticarSH(res.sh, tipo);
      el.innerHTML = `
        <div class="calc-result" style="border-color:${dx.color};">
          <div class="calc-result-val" style="color:${dx.color};">${res.sh > 0 ? "+" : ""}${res.sh}°C</div>
          <div class="calc-result-label">Sobrecalentamiento (SH)</div>
          <div class="calc-result-estado" style="color:${dx.color};">${dx.icono} ${dx.estado}</div>
          <div class="calc-ref-row" style="margin-top:12px;"><span class="calc-ref-label">Temp. saturación (tabla P/T)</span><span class="calc-ref-val">${res.tempSaturacion}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Temp. medida en succión</span><span class="calc-ref-val">${tSuc}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">PSI de baja ingresado</span><span class="calc-ref-val">${psi} PSI</span></div>
          <div class="calc-result-consejo" style="margin-top:10px;border-top:1px solid rgba(255,255,255,.06);padding-top:10px;">
            <strong style="display:block;margin-bottom:4px;">${dx.desc}</strong>
            ${dx.accion}
          </div>
          <div class="mentor-dx-frase" style="margin-top:10px;">"${dx.mentor}"</div>
        </div>`;
    });

    // ─── SC ─────────────────────────────────────────
    document.getElementById("calcSC")?.addEventListener("click", () => {
      const gas   = document.getElementById("scGas")?.value;
      const tipo  = document.getElementById("scTipo")?.value || "split";
      const psi   = parseFloat(document.getElementById("scPsiAlta")?.value);
      const tLiq  = parseFloat(document.getElementById("scTempLiquido")?.value);
      const el    = document.getElementById("calcSCResult");
      if (!el) return;
      if (isNaN(psi) || isNaN(tLiq)) { el.innerHTML = '<div class="calc-error">⚠️ Ingresá PSI de alta y temperatura de línea de líquido.</div>'; return; }

      const res = SHSCEngine.calcularSC(gas, psi, tLiq);
      if (!res) { el.innerHTML = '<div class="calc-error">⚠️ PSI fuera de rango para ese gas.</div>'; return; }

      const dx = SHSCEngine.diagnosticarSC(res.sc, tipo);
      el.innerHTML = `
        <div class="calc-result" style="border-color:${dx.color};">
          <div class="calc-result-val" style="color:${dx.color};">${res.sc > 0 ? "+" : ""}${res.sc}°C</div>
          <div class="calc-result-label">Subenfriamiento (SC)</div>
          <div class="calc-result-estado" style="color:${dx.color};">${dx.icono} ${dx.estado}</div>
          <div class="calc-ref-row" style="margin-top:12px;"><span class="calc-ref-label">Temp. saturación (tabla P/T)</span><span class="calc-ref-val">${res.tempSaturacion}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">Temp. medida en línea de líquido</span><span class="calc-ref-val">${tLiq}°C</span></div>
          <div class="calc-ref-row"><span class="calc-ref-label">PSI de alta ingresado</span><span class="calc-ref-val">${psi} PSI</span></div>
          <div class="calc-result-consejo" style="margin-top:10px;border-top:1px solid rgba(255,255,255,.06);padding-top:10px;">
            <strong style="display:block;margin-bottom:4px;">${dx.desc}</strong>
            ${dx.accion}
          </div>
          <div class="mentor-dx-frase" style="margin-top:10px;">"${dx.mentor}"</div>
        </div>`;
    });

    // ─── COMBINADO ──────────────────────────────────
    document.getElementById("calcCombinado")?.addEventListener("click", () => {
      const gas    = document.getElementById("combGas")?.value;
      const tipo   = document.getElementById("combTipo")?.value || "split";
      const psiBaja= parseFloat(document.getElementById("combPsiBaja")?.value);
      const psiAlta= parseFloat(document.getElementById("combPsiAlta")?.value);
      const tSuc   = parseFloat(document.getElementById("combTempSuccion")?.value);
      const tLiq   = parseFloat(document.getElementById("combTempLiquido")?.value);
      const el     = document.getElementById("calcCombinadoResult");
      if (!el) return;
      if (isNaN(psiBaja)||isNaN(psiAlta)||isNaN(tSuc)||isNaN(tLiq)) {
        el.innerHTML = '<div class="calc-error">⚠️ Completá todos los campos para el diagnóstico combinado.</div>';
        return;
      }

      const resSH = SHSCEngine.calcularSH(gas, psiBaja, tSuc);
      const resSC = SHSCEngine.calcularSC(gas, psiAlta, tLiq);
      if (!resSH || !resSC) { el.innerHTML = '<div class="calc-error">⚠️ PSI fuera de rango para ese gas.</div>'; return; }

      const analisis = SHSCEngine.analizarCombinado(resSH.sh, resSC.sc, tipo);
      const { dxSH, dxSC, conclusion, certeza } = analisis;
      const barColor = certeza >= 85 ? "#00d9ff" : certeza >= 70 ? "#ff9b42" : "#8899aa";

      el.innerHTML = `
        <div class="calc-result" style="border-color:${barColor};margin-top:14px;">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div style="padding:12px;border-radius:12px;background:${dxSH.color}15;border:1px solid ${dxSH.color}30;text-align:center;">
              <div style="font-size:10px;color:#556677;font-weight:700;margin-bottom:4px;">SH</div>
              <div style="font-size:24px;font-weight:900;color:${dxSH.color};">${resSH.sh > 0?"+":""}${resSH.sh}°C</div>
              <div style="font-size:11px;color:${dxSH.color};font-weight:700;">${dxSH.icono} ${dxSH.estado}</div>
            </div>
            <div style="padding:12px;border-radius:12px;background:${dxSC.color}15;border:1px solid ${dxSC.color}30;text-align:center;">
              <div style="font-size:10px;color:#556677;font-weight:700;margin-bottom:4px;">SC</div>
              <div style="font-size:24px;font-weight:900;color:${dxSC.color};">${resSC.sc > 0?"+":""}${resSC.sc}°C</div>
              <div style="font-size:11px;color:${dxSC.color};font-weight:700;">${dxSC.icono} ${dxSC.estado}</div>
            </div>
          </div>

          <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin-bottom:6px;">
            <div style="height:100%;width:${certeza}%;background:${barColor};border-radius:2px;"></div>
          </div>
          <div style="font-size:11px;color:${barColor};font-weight:700;margin-bottom:12px;">${certeza}% certeza diagnóstica</div>

          <div class="calc-result-consejo" style="border-top:1px solid rgba(255,255,255,.06);padding-top:10px;">
            <strong style="display:block;margin-bottom:6px;color:#fff;">Conclusión:</strong>
            ${conclusion}
          </div>

          <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
            <div style="color:#7788aa;">
              <div>Temp. sat. baja: <strong style="color:#aabbcc;">${resSH.tempSaturacion}°C</strong></div>
              <div>Temp. sat. alta: <strong style="color:#aabbcc;">${resSC.tempSaturacion}°C</strong></div>
            </div>
            <div style="color:#7788aa;">
              <div>Succión: <strong style="color:#aabbcc;">${tSuc}°C</strong></div>
              <div>Lín. líquido: <strong style="color:#aabbcc;">${tLiq}°C</strong></div>
            </div>
          </div>
        </div>`;
    });

    document.querySelectorAll(".ft-gas-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activePTGas = btn.dataset.gas;
        document.getElementById("ft-content").innerHTML = this.renderPT();
        this.bindContentEvents();
      });
    });
  },

  // ═══════════════════════════════════════════════
  // GASES — tipos, estado, reemplazos, compatibilidad
  // ═══════════════════════════════════════════════
  renderGases() {
    const gases = this.data?.gases?.refrigerantes || [];
    if (!gases.length) return `<div style="padding:20px;color:#445566">Sin datos de gases.</div>`;

    const badgeConfig = {
      extincion:  { label: "EN EXTINCIÓN",  color: "#ff5252", bg: "rgba(255,80,80,.15)"  },
      vigente:    { label: "VIGENTE",        color: "#00cc66", bg: "rgba(0,200,100,.12)"  },
      actual:     { label: "ACTUAL",         color: "#00d9ff", bg: "rgba(0,217,255,.12)"  },
      transicion: { label: "EN TRANSICIÓN",  color: "#ff9b42", bg: "rgba(255,155,66,.15)" },
      reemplazo:  { label: "DROP-IN",        color: "#bb88ff", bg: "rgba(150,100,255,.15)"}
    };

    const gwpColor = (gwp) =>
      !gwp || gwp < 10  ? "#44cc88"
      : gwp < 700       ? "#00d9ff"
      : gwp < 1500      ? "#ff9b42"
      : "#ff5252";

    // ── Tabla GWP comparativa ──
    const maxGWP = 4000;
    const sortedGWP = [...gases].sort((a, b) => (a.gwp || 3) - (b.gwp || 3));

    const gwpHTML = `
<div class="gas-gwp-header">
  <div class="gas-gwp-titulo">📊 GWP comparativo — menor es mejor para el clima</div>
  <div class="gas-gwp-barras">
    ${sortedGWP.map(g => {
      const gwp   = g.gwp || 3;
      const w     = Math.max(3, Math.round(gwp / maxGWP * 100));
      const color = gwpColor(gwp);
      return `<div class="gas-gwp-fila">
        <span class="gas-gwp-nombre">${g.nombre}</span>
        <div class="gas-gwp-barra-wrap"><div class="gas-gwp-barra" style="width:${w}%;background:${color}"></div></div>
        <span class="gas-gwp-val" style="color:${color}">${gwp}</span>
      </div>`;
    }).join("")}
  </div>
</div>`;

    // ── Cards de cada gas ──
    const cardsHTML = gases.map(g => {
      const badge   = badgeConfig[g.badge] || badgeConfig.vigente;
      const gwp     = g.gwp || 3;
      const gwpC    = gwpColor(gwp);

      // Reemplazos
      const reemplazosHTML = g.reemplazos?.length ? `
<div class="gas-reemplazos">
  <div class="gas-reemplazos-titulo">🔄 Reemplazos / Sustitutos</div>
  ${g.reemplazos.map(r => `
  <div class="gas-reemplazo-item">
    <div class="gas-reemplazo-header">
      <span class="gas-reemplazo-gas">${r.gas}</span>
      <span class="gas-reemplazo-badge" style="color:${r.tipo === "reemplazo_directo" ? "#44cc88" : "#ff9b42"};border:1px solid ${r.tipo === "reemplazo_directo" ? "#44cc8844" : "#ff9b4244"};padding:2px 7px;border-radius:20px;font-size:9px;font-weight:800;">${r.tipo === "reemplazo_directo" ? "Reemplazo directo" : "Solo equipo nuevo"}</span>
      <span style="font-size:11px;font-weight:700;color:${r.compatible_directo ? "#44cc88" : "#ff9b42"}">${r.compatible_directo ? "✅ Compatible" : "⚠️ No mezclar"}</span>
    </div>
    <div class="gas-reemplazo-label">${r.label}</div>
    <div class="gas-reemplazo-detalle">${r.detalle}</div>
  </div>`).join("")}
</div>` : "";

      // Notas de campo
      const notasHTML = g.notas_campo?.length ? `
<div class="gas-notas">
  ${g.notas_campo.map(n => `<div class="gas-nota-item">${n}</div>`).join("")}
</div>` : "";

      // Mentor
      const mentorHTML = g.mentor ? `
<div class="gas-mentor">
  <span class="gas-mentor-ico">👨‍🔧</span>
  <span class="gas-mentor-txt">"${g.mentor}"</span>
</div>` : "";

      return `
<div class="gas-card" style="border-left:3px solid ${badge.color}">

  <div class="gas-card-header">
    <div class="gas-nombre-row">
      <span class="gas-icono">${g.icono}</span>
      <span class="gas-nombre">${g.nombre}</span>
      <span class="gas-badge" style="color:${badge.color};background:${badge.bg};padding:3px 9px;border-radius:20px;font-size:10px;font-weight:800;">${badge.label}</span>
      ${g.inflamable ? `<span class="gas-inflamable-tag">🔥 ${g.clase_inflamabilidad || "INFLAMABLE"}</span>` : ""}
    </div>
    <div class="gas-quimico">${g.nombre_quimico || ""}</div>
    <div class="gas-estado-arg">${g.estado_arg || ""}</div>
  </div>

  <div class="gas-datos-grid">
    <div class="gas-dato">
      <span class="gas-dato-label">GWP</span>
      <span class="gas-dato-val" style="color:${gwpC}">${gwp}</span>
    </div>
    <div class="gas-dato">
      <span class="gas-dato-label">Seguridad</span>
      <span class="gas-dato-val" style="font-size:12px">${g.clase_seguridad || "—"}</span>
    </div>
    <div class="gas-dato">
      <span class="gas-dato-label">Ozono</span>
      <span class="gas-dato-val" style="color:${g.ozono ? "#ff5252" : "#44cc88"};font-size:12px">${g.ozono ? "⚠️ Sí" : "✅ No"}</span>
    </div>
    <div class="gas-dato">
      <span class="gas-dato-label">PSI reposo ~25°C</span>
      <span class="gas-dato-val" style="font-size:11px;color:#00d9ff">${g.presion_baja_25c || "—"}</span>
    </div>
  </div>

  <div class="gas-aplicaciones">
    ${(g.uso_tipico || []).map(a => `<span class="gas-app-chip">${a}</span>`).join("")}
  </div>

  ${reemplazosHTML}
  ${notasHTML}
  ${mentorHTML}

</div>`;
    }).join("");

    return gwpHTML + cardsHTML;
  },


  // ═══════════════════════════════════════════════
  // CAÑERÍA Y TUERCAS — por frigorías
  // ═══════════════════════════════════════════════
  renderCaneria() {

    // Datos técnicos por frigorías (norma Argentina / ASHRAE)
    const tabla = [
      {
        fg:        "2250 FG",
        fg_btu:    "9.000 BTU",
        modelos:   "Equipo pequeño residencial",
        liquido:   { pulg: '1/4"',  mm: "6,35 mm",  pared: "0,76 mm" },
        succion:   { pulg: '3/8"',  mm: "9,52 mm",  pared: "0,80 mm" },
        tuerca_liq:{ hex: "17 mm",  torque: "18 N·m" },
        tuerca_suc:{ hex: "22 mm",  torque: "35 N·m" },
        largo_max: "10 m",
        nota: "Equipo de habitación pequeña. Con más de 10m de cañería puede perder performance."
      },
      {
        fg:        "3000 FG",
        fg_btu:    "12.000 BTU",
        modelos:   "Equipo pequeño/mediano",
        liquido:   { pulg: '1/4"',  mm: "6,35 mm",  pared: "0,76 mm" },
        succion:   { pulg: '3/8"',  mm: "9,52 mm",  pared: "0,80 mm" },
        tuerca_liq:{ hex: "17 mm",  torque: "18 N·m" },
        tuerca_suc:{ hex: "22 mm",  torque: "35 N·m" },
        largo_max: "15 m",
        nota: "Misma cañería que 2250 FG. Tolera algo más de longitud."
      },
      {
        fg:        "4500 FG",
        fg_btu:    "18.000 BTU",
        modelos:   "Equipo estándar residencial",
        liquido:   { pulg: '1/4"',  mm: "6,35 mm",  pared: "0,80 mm" },
        succion:   { pulg: '1/2"',  mm: "12,70 mm", pared: "0,80 mm" },
        tuerca_liq:{ hex: "17 mm",  torque: "18 N·m" },
        tuerca_suc:{ hex: "26 mm",  torque: "55 N·m" },
        largo_max: "20 m",
        nota: "El más común en Argentina. La succión sube a 1/2 pulgada respecto a los modelos chicos."
      },
      {
        fg:        "5500 FG",
        fg_btu:    "22.000 BTU",
        modelos:   "Equipo mediano",
        liquido:   { pulg: '1/4"',  mm: "6,35 mm",  pared: "0,80 mm" },
        succion:   { pulg: '1/2"',  mm: "12,70 mm", pared: "0,80 mm" },
        tuerca_liq:{ hex: "17 mm",  torque: "18 N·m" },
        tuerca_suc:{ hex: "26 mm",  torque: "55 N·m" },
        largo_max: "20 m",
        nota: "Misma cañería que 4500 FG. Verificar plaqueta — algunos modelos piden 5/8 pulgadas en succión."
      },
      {
        fg:        "6000 FG",
        fg_btu:    "24.000 BTU",
        modelos:   "Equipo mediano/grande",
        liquido:   { pulg: '3/8"',  mm: "9,52 mm",  pared: "0,80 mm" },
        succion:   { pulg: '5/8"',  mm: "15,88 mm", pared: "1,00 mm" },
        tuerca_liq:{ hex: "22 mm",  torque: "35 N·m" },
        tuerca_suc:{ hex: "29 mm",  torque: "65 N·m" },
        largo_max: "25 m",
        nota: "La línea de líquido sube a 3/8' y la succión a 5/8. Tuercas más grandes."
      },
      {
        fg:        "7500 FG",
        fg_btu:    "30.000 BTU",
        modelos:   "Equipo grande",
        liquido:   { pulg: '3/8"',  mm: "9,52 mm",  pared: "0,80 mm" },
        succion:   { pulg: '5/8"',  mm: "15,88 mm", pared: "1,00 mm" },
        tuerca_liq:{ hex: "22 mm",  torque: "35 N·m" },
        tuerca_suc:{ hex: "29 mm",  torque: "65 N·m" },
        largo_max: "25 m",
        nota: "Mismo diámetro que 6000 FG. Siempre verificar plaqueta del equipo."
      },
      {
        fg:        "9000 FG",
        fg_btu:    "36.000 BTU",
        modelos:   "Equipo grande / multisplit",
        liquido:   { pulg: '3/8"',  mm: "9,52 mm",  pared: "1,00 mm" },
        succion:   { pulg: '5/8"',  mm: "15,88 mm", pared: "1,00 mm" },
        tuerca_liq:{ hex: "22 mm",  torque: "35 N·m" },
        tuerca_suc:{ hex: "29 mm",  torque: "70 N·m" },
        largo_max: "30 m",
        nota: "Pared más gruesa (1mm) por la mayor presión de trabajo. Torque de succión más alto."
      }
    ];

    const cardsHTML = tabla.map(r => `
<div class="can-card">

  <!-- Header de la card -->
  <div class="can-card-header">
    <div>
      <div class="can-fg">${r.fg}</div>
      <div class="can-btu">${r.fg_btu} · ${r.modelos}</div>
    </div>
    <div class="can-largo-max">
      <span class="can-largo-label">Largo máx.</span>
      <span class="can-largo-val">${r.largo_max}</span>
    </div>
  </div>

  <!-- Tabla de cañerías -->
  <div class="can-lineas">

    <!-- Línea de LÍQUIDO -->
    <div class="can-linea can-linea-liq">
      <div class="can-linea-tipo">
        <span class="can-linea-ico">🔵</span>
        <span class="can-linea-label">Línea de líquido</span>
        <span class="can-linea-sub">caño fino · alta presión</span>
      </div>
      <div class="can-linea-datos">
        <div class="can-dato">
          <span class="can-dato-label">Diámetro</span>
          <span class="can-dato-val can-val-liq">${r.liquido.pulg}</span>
          <span class="can-dato-mm">${r.liquido.mm}</span>
        </div>
        <div class="can-dato">
          <span class="can-dato-label">Pared</span>
          <span class="can-dato-val">${r.liquido.pared}</span>
        </div>
        <div class="can-dato">
          <span class="can-dato-label">Tuerca (hex)</span>
          <span class="can-dato-val can-val-liq">${r.tuerca_liq.hex}</span>
        </div>
        <div class="can-dato">
          <span class="can-dato-label">Torque</span>
          <span class="can-dato-val">${r.tuerca_liq.torque}</span>
        </div>
      </div>
    </div>

    <!-- Línea de SUCCIÓN -->
    <div class="can-linea can-linea-suc">
      <div class="can-linea-tipo">
        <span class="can-linea-ico">🔴</span>
        <span class="can-linea-label">Línea de succión</span>
        <span class="can-linea-sub">caño grueso · baja presión</span>
      </div>
      <div class="can-linea-datos">
        <div class="can-dato">
          <span class="can-dato-label">Diámetro</span>
          <span class="can-dato-val can-val-suc">${r.succion.pulg}</span>
          <span class="can-dato-mm">${r.succion.mm}</span>
        </div>
        <div class="can-dato">
          <span class="can-dato-label">Pared</span>
          <span class="can-dato-val">${r.succion.pared}</span>
        </div>
        <div class="can-dato">
          <span class="can-dato-label">Tuerca (hex)</span>
          <span class="can-dato-val can-val-suc">${r.tuerca_suc.hex}</span>
        </div>
        <div class="can-dato">
          <span class="can-dato-label">Torque</span>
          <span class="can-dato-val">${r.tuerca_suc.torque}</span>
        </div>
      </div>
    </div>

  </div>

  <!-- Nota técnica -->
  <div class="can-nota">💡 ${r.nota}</div>

</div>`).join("");

    return `
<!-- Aviso general -->
<div class="can-aviso">
  <span class="can-aviso-ico">⚠️</span>
  <span>Siempre verificar la plaqueta del equipo — algunos fabricantes especifican diámetros propios. Los datos abajo son los estándares más frecuentes en Argentina.</span>
</div>

<!-- Referencia rápida de tuercas -->
<div class="can-ref-tuercas">
  <div class="can-ref-titulo">🔑 Referencia rápida de tuercas flare</div>
  <div class="can-ref-grid">
    <div class="can-ref-item">
      <span class="can-ref-pulg">1/4"</span>
      <span class="can-ref-hex">Hex 17 mm</span>
      <span class="can-ref-torque">18 N·m</span>
      <span class="can-ref-uso">Líquido 2250–5500 FG</span>
    </div>
    <div class="can-ref-item">
      <span class="can-ref-pulg">3/8"</span>
      <span class="can-ref-hex">Hex 22 mm</span>
      <span class="can-ref-torque">35 N·m</span>
      <span class="can-ref-uso">Suc. 2250–3000 FG / Líq. 6000–9000 FG</span>
    </div>
    <div class="can-ref-item">
      <span class="can-ref-pulg">1/2"</span>
      <span class="can-ref-hex">Hex 26 mm</span>
      <span class="can-ref-torque">55 N·m</span>
      <span class="can-ref-uso">Succión 4500–5500 FG</span>
    </div>
    <div class="can-ref-item">
      <span class="can-ref-pulg">5/8"</span>
      <span class="can-ref-hex">Hex 29 mm</span>
      <span class="can-ref-torque">65–70 N·m</span>
      <span class="can-ref-uso">Succión 6000–9000 FG</span>
    </div>
  </div>
</div>

<!-- Dato importante sobre torque -->
<div class="can-torque-tip">
  <div class="can-torque-tip-titulo">🔧 Torque correcto — clave para evitar fugas</div>
  <div class="can-torque-tip-body">
    El flare mal apretado es la causa #1 de fugas en instalaciones nuevas. <strong>Poco torque</strong> → fuga inmediata. <strong>Mucho torque</strong> → el cobre se fisura y la fuga aparece semanas después. Sin llave dinamométrica: <em>media vuelta más un cuarto</em> después de sentir resistencia es una regla de campo razonable para 1/2" y 5/8".
  </div>
</div>

${cardsHTML}

<!-- Nota final -->
<div class="can-nota-final">
  📏 <strong>Longitud máxima:</strong> superar el largo máximo recomendado requiere carga adicional de gas (~15g por metro extra). La presión cae y el compresor trabaja más. Siempre documentar la longitud real instalada.
</div>`;

  },

  // ═══════════════════════════════════════════════
  // IDENTIFICADOR DE GAS POR PRESIÓN DE REPOSO
  // Compara el PSI medido contra todos los gases
  // con interpolación entre temperaturas
  // ═══════════════════════════════════════════════
  identificarGasPorReposo() {
    const psiInput  = document.getElementById("ftIdPsi");
    const tempSel   = document.getElementById("ftIdTemp");
    const resultDiv = document.getElementById("ftIdResultado");
    if (!psiInput || !tempSel || !resultDiv) return;

    const psiMedido = Number(psiInput.value);
    const tempAmb   = tempSel.value;

    if (!psiMedido || psiMedido <= 0) {
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `<div class="ft-id-error">⚠️ Ingresá el PSI medido con el equipo apagado.</div>`;
      return;
    }

    // Todos los gases con datos de reposo
    const aires    = this.data?.temperaturas?.aires    || [];
    const heladeras= this.data?.temperaturas?.heladeras|| [];
    const todos    = [...aires, ...heladeras];

    // Calcular diferencia de cada gas al PSI medido
    const resultados = todos
      .filter(g => g.psi_reposo && g.psi_reposo[tempAmb])
      .map(g => {
        const psiRef = Number(g.psi_reposo[tempAmb]);
        const diff   = Math.abs(psiMedido - psiRef);
        const pct    = Math.round((diff / psiRef) * 100);
        return {
          gas:    g.gas,
          psiRef,
          diff,
          pct,
          nota:   g.nota_reposo || "",
          id:     g.identificacion || "",
          esCrit: g.gas.includes("R600") // inflamable
        };
      })
      .sort((a, b) => a.diff - b.diff);

    if (!resultados.length) {
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `<div class="ft-id-error">⚠️ Sin datos para esa temperatura.</div>`;
      return;
    }

    const mejor   = resultados[0];
    const segundo = resultados[1];

    // Calcular certeza
    const certeza = mejor.pct <= 3  ? 99
                  : mejor.pct <= 6  ? 95
                  : mejor.pct <= 10 ? 88
                  : mejor.pct <= 15 ? 75
                  : mejor.pct <= 22 ? 60
                  : 40;

    const certColor = certeza >= 90 ? "#00cc66"
                    : certeza >= 75 ? "#00d9ff"
                    : certeza >= 60 ? "#ff9b42"
                    : "#ff5252";

    // Texto de conclusión según certeza
    const conclusion = certeza >= 90
      ? `✅ El PSI de ${psiMedido} PSI a ${tempAmb}°C corresponde con alta certeza a <strong>${mejor.gas}</strong>. PSI de referencia: ${mejor.psiRef} PSI (diferencia de solo ${mejor.diff} PSI = ${mejor.pct}%).`
      : certeza >= 70
      ? `🟡 El PSI más cercano corresponde a <strong>${mejor.gas}</strong> (${mejor.psiRef} PSI de referencia, diferencia ${mejor.diff} PSI). Pero la diferencia es significativa — puede ser variación de temperatura o gas mezclado.`
      : `🔴 El PSI de ${psiMedido} PSI no coincide bien con ningún gas conocido (diferencia mínima de ${mejor.diff} PSI respecto a ${mejor.gas}). Verificá que el equipo lleve ≥30 min apagado y que la temperatura sea estable.`;

    // Candidatos alternativos
    const alternativosHTML = resultados.slice(1, 3).map(r => `
      <div class="ft-id-alt-item">
        <span class="ft-id-alt-gas">${r.gas}</span>
        <span class="ft-id-alt-ref">${r.psiRef} PSI ref.</span>
        <span class="ft-id-alt-diff">±${r.diff} PSI</span>
        <span class="ft-id-alt-pct" style="color:${r.pct<=10?"#ff9b42":"#556677"}">${r.pct}% diferencia</span>
      </div>`).join("");

    // Advertencia R600a (inflamable)
    const r600Warning = mejor.gas.includes("R600")
      ? `<div class="ft-id-warning-inflamable">🔴 <strong>R600a (isobutano) es INFLAMABLE.</strong> No usar herramientas que generen chispa. Ventilación obligatoria. No usar manómetro no apto para gases inflamables.</div>`
      : "";

    // Mostrar resultado
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `
<div class="ft-id-resultado-card">

  <div class="ft-id-resultado-header">
    <div class="ft-id-gas-detectado">
      <span class="ft-id-gas-nombre">${mejor.gas}</span>
      <span class="ft-id-certeza" style="color:${certColor}">${certeza}% certeza</span>
    </div>
    <div class="ft-id-barra-wrap">
      <div class="ft-id-barra-fill" style="width:${certeza}%;background:${certColor}"></div>
    </div>
  </div>

  <div class="ft-id-medicion-row">
    <div class="ft-id-med-item">
      <span class="ft-id-med-label">PSI medido</span>
      <span class="ft-id-med-val">${psiMedido}</span>
    </div>
    <div class="ft-id-med-item">
      <span class="ft-id-med-label">PSI referencia</span>
      <span class="ft-id-med-val" style="color:${certColor}">${mejor.psiRef}</span>
    </div>
    <div class="ft-id-med-item">
      <span class="ft-id-med-label">Diferencia</span>
      <span class="ft-id-med-val" style="color:${mejor.pct<=6?"#44cc88":"#ff9b42"}">±${mejor.diff} PSI</span>
    </div>
    <div class="ft-id-med-item">
      <span class="ft-id-med-label">Temp. amb.</span>
      <span class="ft-id-med-val">${tempAmb}°C</span>
    </div>
  </div>

  <div class="ft-id-conclusion">${conclusion}</div>

  ${mejor.id ? `<div class="ft-id-id-nota">🔍 ${mejor.id}</div>` : ""}

  ${r600Warning}

  ${alternativosHTML ? `
  <div class="ft-id-alternos-titulo">Otros candidatos:</div>
  <div class="ft-id-alternos">${alternativosHTML}</div>` : ""}

  <div class="ft-id-tip">
    💡 <strong>Para mayor precisión:</strong> Equipo apagado ≥ 30 minutos. Temperatura ambiente estable. Manómetro en puerto de baja (línea gruesa). Si el resultado no coincide con la etiqueta → probable contaminación o gas mezclado.
  </div>

</div>`;

  }

};
