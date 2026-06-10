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
    <label class="dx-label">🏭 Tipo de equipo</label>
    <select class="hvac-select" id="comercialTipo">
      <option value="exhibidora_cerrada">Exhibidora cerrada</option>
      <option value="exhibidora_abierta">Exhibidora abierta</option>
      <option value="camara_positiva">Cámara frigorífica positiva</option>
      <option value="camara_negativa">Cámara frigorífica negativa</option>
      <option value="bajo_mesada">Bajo mesada / cervecera</option>
      <option value="heladera_comercial">Heladera comercial</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">🏷️ Marca del compresor <span style="color:#445566;font-weight:400;">(opcional)</span></label>
    <select class="hvac-select" id="comercialMarca">
      <option value="">— Seleccionar —</option>
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
  <label class="dx-check" style="margin:8px 0 0 4px;"><input type="checkbox" id="chkTrifasico"> <span>⚡ Equipo trifásico (380V)</span></label>
</div>

<div class="dx-etapa-label">ETAPA 2 — Mediciones</div>
<div class="dx-card">
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">⚡ Amperaje (A)</label>
      <input type="number" class="hvac-input" id="comercialAmp" placeholder="ej: 3.5" step="0.1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">📉 PSI baja</label>
      <input type="number" class="hvac-input" id="comercialPsi" placeholder="ej: 22"/>
    </div>
  </div>
  <div class="dx-field-row" style="margin-top:8px;">
    <div class="dx-field">
      <label class="dx-label">📈 PSI alta (opcional)</label>
      <input type="number" class="hvac-input" id="comercialPsiAlta" placeholder="ej: 240"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">🌡️ Temp. evaporador (°C)</label>
      <input type="number" class="hvac-input" id="comercialTempEvap" placeholder="ej: -10" step="1"/>
    </div>
  </div>
  <div class="dx-field-row" style="margin-top:8px;">
    <div class="dx-field">
      <label class="dx-label">🌡️ Temp. interior local (°C)</label>
      <input type="number" class="hvac-input" id="comercialTempLocal" placeholder="ej: 8" step="1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">🌡️ Temp. ambiente exterior (°C)</label>
      <input type="number" class="hvac-input" id="comercialTempAmb" placeholder="ej: 30"/>
    </div>
  </div>
  <div class="dx-hint">💡 En comercial el manifold de alta y baja + temperatura del local son las herramientas clave</div>
</div>

<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="chkCondSucioC"> <span>🔥 Condensador sucio / tapado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkEvapCongeladoC"> <span>🧊 Evaporador congelado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNoTemp"> <span>🌡️ No alcanza temperatura objetivo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkContinuoC"> <span>🔄 Compresor trabaja continuo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCapacitorC"> <span>🔋 Capacitor sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkTermicoC"> <span>🌡️ Protector térmico (Klixon) disparado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkPresostato"> <span>🔴 Presostato de alta disparado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkVentCondC"> <span>💨 Ventilador condensador detenido</span></label>
    <label class="dx-check"><input type="checkbox" id="chkSolenoideC"> <span>🔌 Válvula solenoide sospechosa</span></label>
    <label class="dx-check"><input type="checkbox" id="chkFiltroC"> <span>🔒 Filtro deshidratador sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkDeshieloC"> <span>⏱️ Sistema de deshielo sospechoso</span></label>

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
      DxActions.clearForm(["comercialAmp","comercialPsi","comercialPsiAlta","comercialTempAmb",
        "comercialTempEvap","comercialTempLocal",
        "chkCondSucioC","chkEvapCongeladoC","chkNoTemp","chkContinuoC",
        "chkCapacitorC","chkTermicoC","chkPresostato","chkVentCondC",
        "chkSolenoideC","chkFiltroC","chkDeshieloC","chkTrifasico"]);
      Historial.showToast("✅ Campos limpiados");
    });
  },

  runAnalysis() {
    const d = {
      marca:        document.getElementById("comercialMarca")?.value || "",
      gas:          document.getElementById("comercialGas").value,
      hp:           document.getElementById("comercialHP").value,
      tipoEquipo:   document.getElementById("comercialTipo")?.value || "exhibidora_cerrada",
      arranca:      document.getElementById("comercialArranca").value,
      amp:          document.getElementById("comercialAmp").value,
      psi:          document.getElementById("comercialPsi").value,
      psiAlta:      document.getElementById("comercialPsiAlta")?.value || "",
      tempAmbiente: document.getElementById("comercialTempAmb").value,
      tempEvap:     document.getElementById("comercialTempEvap")?.value || "",
      tempLocal:    document.getElementById("comercialTempLocal")?.value || "",
      trifasico:    document.getElementById("chkTrifasico")?.checked || false,
      chkCondSucio:    document.getElementById("chkCondSucioC").checked,
      chkEvapCongelado:document.getElementById("chkEvapCongeladoC").checked,
      chkNoTemp:       document.getElementById("chkNoTemp").checked,
      chkContinuo:     document.getElementById("chkContinuoC").checked,
      chkCapacitor:    document.getElementById("chkCapacitorC").checked,
      chkTermico:      document.getElementById("chkTermicoC")?.checked || false,
      chkPresostato:   document.getElementById("chkPresostato").checked,
      chkVentCond:     document.getElementById("chkVentCondC").checked,
      chkSolenoide:    document.getElementById("chkSolenoideC")?.checked || false,
      chkFiltro:       document.getElementById("chkFiltroC")?.checked || false,
      chkDeshielo:     document.getElementById("chkDeshieloC")?.checked || false
    };
    DxActions.showResult("comercial", d, ComercialEngine.analyze(d));
  }
};
