// =====================================================
// SPLIT-PRO.JS — v3 con limpiar, historial y descarga
// =====================================================

const SplitPRO = {

  lastDatos: null,
  lastResultado: null,

  render() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="backHome">←</div>
  <div>
    <h1 class="hvac-title">❄️ Split PRO</h1>
    <p class="hvac-subtitle">Diagnóstico clínico HVAC</p>
  </div>
  <button class="dx-hist-badge" id="openDxHist" title="Historial">📋</button>
</header>

<div class="dx-etapa-label">ETAPA 1 — Triage inicial</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">🏷️ Marca del equipo <span style="color:#445566;font-weight:400;">(opcional)</span></label>
    <select class="hvac-select" id="splitMarca">
          <option value="">— Seleccionar marca —</option>
      <option value="Carrier">Carrier</option>
      <option value="BGH">BGH</option>
      <option value="Rheem">Rheem</option>
      <option value="Gree">Gree</option>
      <option value="Samsung">Samsung</option>
      <option value="LG">LG</option>
      <option value="Philco">Philco</option>
      <option value="Electra">Electra</option>
      <option value="Daikin">Daikin</option>
      <option value="otra">Otra marca</option>
    </select>
  </div>
  <div class="dx-field" id="splitModeloWrap" style="display:none;">
    <label class="dx-label">📋 Modelo / Serie <span style="color:#445566;font-weight:400;">(si lo sabés)</span></label>
    <input type="text" class="hvac-input" id="splitModelo" placeholder="ej: MSP18CH, 09HK1..."/>
  </div>
  <div class="dx-field">
    <label class="dx-label">Gas refrigerante</label>
    <select class="hvac-select" id="splitGas">
      <option value="R410A">R410A</option>
      <option value="R32">R32</option>
      <option value="R22">R22</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">Frigorías del equipo</label>
    <select class="hvac-select" id="splitFrigorias">
      <option value="2250">2250 FG</option>
      <option value="3000">3000 FG</option>
      <option value="4500" selected>4500 FG</option>
      <option value="5500">5500 FG</option>
      <option value="6000">6000 FG</option>
      <option value="7500">7500 FG</option>
      <option value="9000">9000 FG</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">¿El compresor arranca?</label>
    <select class="hvac-select" id="splitArranca">
      <option value="si">✅ Sí arranca</option>
      <option value="no">❌ No arranca</option>
    </select>
  </div>
</div>

<div class="dx-etapa-label">ETAPA 2 — Mediciones</div>
<div class="dx-card">
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">⚡ Amperaje real (A)</label>
      <input type="number" class="hvac-input" id="splitAmp" placeholder="ej: 6.5" step="0.1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">📉 Presión baja (PSI)</label>
      <input type="number" class="hvac-input" id="splitPsi" placeholder="ej: 120"/>
    </div>
  </div>
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">🌡️ Temp entrada (°C)</label>
      <input type="number" class="hvac-input" id="splitTempIn" placeholder="ej: 28"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">❄️ Temp salida (°C)</label>
      <input type="number" class="hvac-input" id="splitTempOut" placeholder="ej: 16"/>
    </div>
  </div>
  <div class="dx-hint">💡 Sin instrumentos igualmente podés diagnosticar con los síntomas de abajo</div>
</div>

<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="chkFrozen"> <span>🧊 Retorno congelado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkPocofrio"> <span>❄️ Poco frío / no llega a temperatura</span></label>
    <label class="dx-check"><input type="checkbox" id="chkAirflow"> <span>🌬️ Poco caudal de aire</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCondSucio"> <span>🔥 Condensador caliente / sucio</span></label>
    <label class="dx-check"><input type="checkbox" id="chkGasExceso"> <span>⛽ Posible exceso de gas</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCapacitor"> <span>🔋 Capacitor sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkTermico"> <span>🌡️ Protector térmico disparado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkContinuo"> <span>🔄 Trabaja continuo sin cortar</span></label>
  </div>
</div>

<!-- BOTONES DE ACCIÓN -->
<div class="dx-btn-row" id="dxBtnRow">
  <button class="hvac-btn btn-secondary" id="clearSplit">🗑 Limpiar</button>
  <button class="hvac-btn btn-primary"   id="analyzeSplit">🔍 Diagnosticar</button>
  <div id="dxPdfSlot"></div>
</div>

<div id="dxResult"></div>

`;
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById("backHome")?.addEventListener("click", () => Router.back());
    document.getElementById("openDxHist")?.addEventListener("click", () => Router.go("dx-historial"));
    document.getElementById("splitMarca")?.addEventListener("change", () => {
      const wrap = document.getElementById("splitModeloWrap");
      const val  = document.getElementById("splitMarca").value;
      if (wrap) wrap.style.display = val ? "block" : "none";
    });
    document.getElementById("analyzeSplit")?.addEventListener("click", () => this.runAnalysis());
    document.getElementById("clearSplit")?.addEventListener("click", () => {
      DxActions.clearForm(["splitAmp","splitPsi","splitTempIn","splitTempOut",
        "chkFrozen","chkPocofrio","chkAirflow","chkCondSucio",
        "chkGasExceso","chkCapacitor","chkTermico","chkContinuo"]);
      Historial.showToast("✅ Campos limpiados");
    });
  },

  runAnalysis() {
    const d = {
      marca:     document.getElementById("splitMarca")?.value || "",
      modelo:    document.getElementById("splitModelo")?.value || "",
      gas:       document.getElementById("splitGas").value,
      frigorias: Number(document.getElementById("splitFrigorias").value),
      arranca:   document.getElementById("splitArranca").value,
      amp:       document.getElementById("splitAmp").value,
      psi:       document.getElementById("splitPsi").value,
      tempIn:    document.getElementById("splitTempIn").value,
      tempOut:   document.getElementById("splitTempOut").value,
      chkFrozen:    document.getElementById("chkFrozen").checked,
      chkPocofrio:  document.getElementById("chkPocofrio").checked,
      chkAirflow:   document.getElementById("chkAirflow").checked,
      chkCondSucio: document.getElementById("chkCondSucio").checked,
      chkGasExceso: document.getElementById("chkGasExceso").checked,
      chkCapacitor: document.getElementById("chkCapacitor").checked,
      chkTermico:   document.getElementById("chkTermico").checked,
      chkContinuo:  document.getElementById("chkContinuo").checked
    };
    this.lastDatos = d;
    const result   = SplitEngine.analyze(d);
    DxActions.showResult("split", d, result);
  }
};
