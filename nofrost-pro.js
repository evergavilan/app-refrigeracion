// =====================================================
// HVAC PRO ARGENTINA
// NOFROST-PRO.JS — v4 con temperaturas reales
// =====================================================

const NoFrostPRO = {
  render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="backHome">←</div>
  <div><h1 class="hvac-title">🌬️ No Frost PRO</h1><p class="hvac-subtitle">Diagnóstico clínico heladera</p></div>
  <button class="dx-hist-badge" id="openDxHist">📋</button>
</header>

<div class="dx-etapa-label">ETAPA 1 — Datos del equipo</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">🏷️ Marca <span style="color:#445566;font-weight:400;">(opcional)</span></label>
    <select class="hvac-select" id="nofrostMarca">
      <option value="">— Seleccionar —</option>
      <option value="Whirlpool">Whirlpool</option>
      <option value="Samsung">Samsung</option>
      <option value="LG">LG</option>
      <option value="Electrolux">Electrolux</option>
      <option value="Mabe">Mabe</option>
      <option value="otra">Otra</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">Gas refrigerante</label>
    <select class="hvac-select" id="nofrostGas">
      <option value="R134a">R134a (más común)</option>
      <option value="R600a">R600a — Isobutano</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">¿El compresor arranca?</label>
    <select class="hvac-select" id="nofrostArranca">
      <option value="si">✅ Sí arranca</option>
      <option value="no">❌ No arranca</option>
    </select>
  </div>
</div>

<div class="dx-etapa-label">ETAPA 2 — Temperaturas reales (termómetro)</div>
<div class="dx-card">
  <div class="ft-info-badge" style="margin:0 0 12px;">
    🌡️ En No Frost el termómetro es la herramienta principal — muchos diagnósticos se resuelven sin manómetro.
  </div>
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">❄️ Temp. freezer (°C)</label>
      <input type="number" class="hvac-input" id="nofrostTempFreezer"
        placeholder="ej: -14" step="1"/>
      <span style="font-size:11px;color:#445566;margin-top:4px;display:block;">Normal: -12°C a -18°C</span>
    </div>
    <div class="dx-field">
      <label class="dx-label">🌡️ Temp. interior heladera (°C)</label>
      <input type="number" class="hvac-input" id="nofrostTempHeladera"
        placeholder="ej: 8" step="1"/>
      <span style="font-size:11px;color:#445566;margin-top:4px;display:block;">Normal: 3°C a 8°C</span>
    </div>
  </div>
  <div class="dx-field-row" style="margin-top:8px;">
    <div class="dx-field">
      <label class="dx-label">📉 PSI proceso (opcional)</label>
      <input type="number" class="hvac-input" id="nofrostPsi" placeholder="ej: 3" step="0.5"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">⚡ Amperaje (A)</label>
      <input type="number" class="hvac-input" id="nofrostAmp" placeholder="ej: 1.8" step="0.1"/>
    </div>
  </div>
  <div class="dx-hint">💡 Con el termómetro solo ya podés diagnosticar la mayoría de los problemas de No Frost</div>
</div>

<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="chkNFEvapCongelado"> <span>🧊 Evaporador congelado (bloque de hielo visible)</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFVentDetenido"> <span>🌬️ Ventilador del evaporador detenido</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFContinuo"> <span>🔄 Compresor trabaja continuo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFResistencia"> <span>🔌 Resistencia de deshielo sospechosa</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFBimetal"> <span>🌡️ Bimetal sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFPlaca"> <span>💻 Placa con error</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFBurlete"> <span>🚪 Burlete deteriorado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFEscarcha"> <span>❄️ Escarcha visible en paredes del freezer</span></label>
  </div>
</div>

<div class="dx-btn-row" id="dxBtnRow">
  <button class="hvac-btn btn-secondary" id="clearNofrost">🗑 Limpiar</button>
  <button class="hvac-btn btn-primary"   id="analyzeNofrost">🔍 Diagnosticar</button>
  <div id="dxPdfSlot"></div>
</div>

<div id="dxResult"></div>`;
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById("backHome")?.addEventListener("click", () => Router.back());
    document.getElementById("openDxHist")?.addEventListener("click", () => Router.go("dx-historial"));

    document.getElementById("clearNofrost")?.addEventListener("click", () => {
      DxActions.clearForm([
        "nofrostAmp","nofrostPsi","nofrostTempFreezer","nofrostTempHeladera",
        "chkNFEvapCongelado","chkNFVentDetenido","chkNFContinuo",
        "chkNFResistencia","chkNFBimetal","chkNFPlaca","chkNFBurlete","chkNFEscarcha"
      ]);
      Historial.showToast("✅ Campos limpiados");
    });

    document.getElementById("analyzeNofrost")?.addEventListener("click", () => this.runAnalysis());
  },

  runAnalysis() {
    const tf = document.getElementById("nofrostTempFreezer").value;
    const th = document.getElementById("nofrostTempHeladera").value;
    const d = {
      gas:          document.getElementById("nofrostGas").value,
      marca:        document.getElementById("nofrostMarca").value,
      arranca:      document.getElementById("nofrostArranca").value,
      tempFreezer:  tf,
      tempHeladera: th,
      amp:          document.getElementById("nofrostAmp").value,
      psi:          document.getElementById("nofrostPsi").value,
      freezerFrio:  tf ? Number(tf) < -5  : true,
      abajoFrio:    th ? Number(th) < 12  : true,
      chkEvapCongelado: document.getElementById("chkNFEvapCongelado").checked,
      chkVentDetenido:  document.getElementById("chkNFVentDetenido").checked,
      chkContinuo:      document.getElementById("chkNFContinuo").checked,
      chkResistencia:   document.getElementById("chkNFResistencia").checked,
      chkBimetal:       document.getElementById("chkNFBimetal").checked,
      chkPlaca:         document.getElementById("chkNFPlaca").checked,
      chkBurlete:       document.getElementById("chkNFBurlete").checked,
      chkEscarcha:      document.getElementById("chkNFEscarcha").checked
    };

    const result = NoFrostEngine.analyze(d);
    DxActions.showResult("nofrost", d, result);
  }
};
