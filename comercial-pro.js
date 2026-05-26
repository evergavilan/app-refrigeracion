// =====================================================
// COMERCIAL-PRO.JS — v3
// =====================================================

const ComercialPRO = {
  render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="backHome">←</div>
  <div><h1 class="hvac-title">🏭 Comercial PRO</h1><p class="hvac-subtitle">Diagnóstico refrigeración comercial</p></div>
  <button class="dx-hist-badge" id="openDxHist">📋</button>
</header>

<div class="dx-etapa-label">ETAPA 1 — Datos del equipo</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">🏷️ Marca del compresor <span style="color:#445566;font-weight:400;">(opcional)</span></label>
    <select class="hvac-select" id="comercialMarca">
          <option value="">— Seleccionar marca —</option>
      <option value="Zanotti">Zanotti</option>
      <option value="Tecumseh">Tecumseh</option>
      <option value="Embraco">Embraco</option>
      <option value="Maneurop">Maneurop</option>
      <option value="Copeland">Copeland</option>
      <option value="otra">Otra / sin marca</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">Gas refrigerante</label>
    <select class="hvac-select" id="comercialGas">
      <option value="R404A">R404A (exhibidoras / cámaras)</option>
      <option value="R134a">R134a (heladeras comerciales)</option>
      <option value="R22">R22 (equipos viejos)</option>
      <option value="R448A">R448A (reemplazo R404A)</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">Potencia del compresor</label>
    <select class="hvac-select" id="comercialHP">
      <option value="1/3">1/3 HP</option>
      <option value="1/2" selected>1/2 HP</option>
      <option value="3/4">3/4 HP</option>
      <option value="1">1 HP</option>
      <option value="1.5">1.5 HP</option>
      <option value="2">2 HP</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">¿El compresor arranca?</label>
    <select class="hvac-select" id="comercialArranca">
      <option value="si">✅ Sí arranca</option>
      <option value="no">❌ No arranca</option>
    </select>
  </div>
</div>

<div class="dx-etapa-label">ETAPA 2 — Mediciones</div>
<div class="dx-card">
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">⚡ Amperaje (A)</label>
      <input type="number" class="hvac-input" id="comercialAmp" placeholder="ej: 3.5" step="0.1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">📉 Presión baja (PSI)</label>
      <input type="number" class="hvac-input" id="comercialPsi" placeholder="ej: 22"/>
    </div>
  </div>
  <div class="dx-field">
    <label class="dx-label">🌡️ Temperatura ambiente del local (°C)</label>
    <input type="number" class="hvac-input" id="comercialTempAmb" placeholder="ej: 28"/>
  </div>
</div>

<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="chkCondSucioC"> <span>🔥 Condensador sucio / tapado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkEvapCongeladoC"> <span>🧊 Evaporador congelado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNoTemp"> <span>🌡️ No alcanza temperatura objetivo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkContinuoC"> <span>🔄 Compresor trabaja continuo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCapacitorC"> <span>🔋 Capacitor sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkPresostato"> <span>🔴 Presostato de alta disparado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkVentCondC"> <span>💨 Ventilador condensador detenido</span></label>
  </div>
</div>

<div class="dx-btn-row" id="dxBtnRow">
  <button class="hvac-btn btn-secondary" id="clearComercial">🗑 Limpiar</button>
  <button class="hvac-btn btn-primary"   id="analyzeComercial">🔍 Diagnosticar</button>
  <div id="dxPdfSlot"></div>
</div>

<div id="dxResult"></div>
`;
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById("backHome")?.addEventListener("click", () => Router.back());
    document.getElementById("openDxHist")?.addEventListener("click", () => Router.go("dx-historial"));
    document.getElementById("analyzeComercial")?.addEventListener("click", () => this.runAnalysis());
    document.getElementById("clearComercial")?.addEventListener("click", () => {
      DxActions.clearForm(["comercialAmp","comercialPsi","comercialTempAmb",
        "chkCondSucioC","chkEvapCongeladoC","chkNoTemp","chkContinuoC",
        "chkCapacitorC","chkPresostato","chkVentCondC"]);
      Historial.showToast("✅ Campos limpiados");
    });
  },

  runAnalysis() {
    const d = {
      marca:       document.getElementById("comercialMarca")?.value || "",
      gas:         document.getElementById("comercialGas").value,
      hp:          document.getElementById("comercialHP").value,
      arranca:     document.getElementById("comercialArranca").value,
      amp:         document.getElementById("comercialAmp").value,
      psi:         document.getElementById("comercialPsi").value,
      tempAmbiente:document.getElementById("comercialTempAmb").value,
      chkCondSucio:    document.getElementById("chkCondSucioC").checked,
      chkEvapCongelado:document.getElementById("chkEvapCongeladoC").checked,
      chkNoTemp:       document.getElementById("chkNoTemp").checked,
      chkContinuo:     document.getElementById("chkContinuoC").checked,
      chkCapacitor:    document.getElementById("chkCapacitorC").checked,
      chkPresostato:   document.getElementById("chkPresostato").checked,
      chkVentCond:     document.getElementById("chkVentCondC").checked
    };
    DxActions.showResult("comercial", d, ComercialEngine.analyze(d));
  }
};
