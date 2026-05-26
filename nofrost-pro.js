// =====================================================
// NOFROST-PRO.JS — v3
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

<div class="dx-etapa-label">ETAPA 1 — Triage inicial</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">🏷️ Marca del equipo <span style="color:#445566;font-weight:400;">(opcional)</span></label>
    <select class="hvac-select" id="nofrostMarca">
          <option value="">— Seleccionar marca —</option>
      <option value="Whirlpool">Whirlpool</option>
      <option value="Mabe">Mabe</option>
      <option value="Samsung">Samsung</option>
      <option value="LG">LG</option>
      <option value="Electrolux">Electrolux</option>
      <option value="Drean">Drean</option>
      <option value="Brightstar">Brightstar / BGH</option>
      <option value="otra">Otra marca</option>
    </select>
  </div>
  <div class="dx-field" id="nofrostModeloWrap" style="display:none;">
    <label class="dx-label">📋 Modelo <span style="color:#445566;font-weight:400;">(si lo sabés)</span></label>
    <input type="text" class="hvac-input" id="nofrostModelo" placeholder="ej: WRB20N2HRW, GSF25..."/>
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
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">¿Freezer frío?</label>
      <select class="hvac-select" id="nofrostFreezer">
        <option value="si">✅ Sí</option><option value="no">❌ No</option>
      </select>
    </div>
    <div class="dx-field">
      <label class="dx-label">¿Heladera fría?</label>
      <select class="hvac-select" id="nofrostAbajo">
        <option value="si">✅ Sí</option><option value="no">❌ No</option>
      </select>
    </div>
  </div>
</div>

<div class="dx-etapa-label">ETAPA 2 — Mediciones</div>
<div class="dx-card">
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">⚡ Amperaje (A)</label>
      <input type="number" class="hvac-input" id="nofrostAmp" placeholder="ej: 1.8" step="0.1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">📉 Presión proceso (PSI)</label>
      <input type="number" class="hvac-input" id="nofrostPsi" placeholder="ej: 3" step="0.5"/>
    </div>
  </div>
</div>

<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="chkNFEvapCongelado"> <span>🧊 Evaporador congelado visible</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFVentDetenido"> <span>🌬️ Ventilador del evaporador detenido</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFContinuo"> <span>🔄 Compresor trabaja continuo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFResistencia"> <span>🔌 Resistencia de deshielo sospechosa</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFBimetal"> <span>🌡️ Bimetal / termostato de deshielo sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkNFPlaca"> <span>💻 Placa electrónica con error</span></label>
  </div>
</div>

<div class="dx-btn-row" id="dxBtnRow">
  <button class="hvac-btn btn-secondary" id="clearNofrost">🗑 Limpiar</button>
  <button class="hvac-btn btn-primary"   id="analyzeNofrost">🔍 Diagnosticar</button>
  <div id="dxPdfSlot"></div>
</div>

<div id="dxResult"></div>
`;
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById("backHome")?.addEventListener("click", () => Router.back());
    document.getElementById("openDxHist")?.addEventListener("click", () => Router.go("dx-historial"));
    document.getElementById("nofrostMarca")?.addEventListener("change", () => {
      const wrap = document.getElementById("nofrostModeloWrap");
      const val  = document.getElementById("nofrostMarca").value;
      if (wrap) wrap.style.display = val ? "block" : "none";
    });
    document.getElementById("analyzeNofrost")?.addEventListener("click", () => this.runAnalysis());
    document.getElementById("clearNofrost")?.addEventListener("click", () => {
      DxActions.clearForm(["nofrostAmp","nofrostPsi","chkNFEvapCongelado","chkNFVentDetenido",
        "chkNFContinuo","chkNFResistencia","chkNFBimetal","chkNFPlaca"]);
      Historial.showToast("✅ Campos limpiados");
    });
  },

  runAnalysis() {
    const d = {
      marca:       document.getElementById("nofrostMarca")?.value || "",
      modelo:      document.getElementById("nofrostModelo")?.value || "",
      gas:         document.getElementById("nofrostGas").value,
      arranca:     document.getElementById("nofrostArranca").value,
      freezerFrio: document.getElementById("nofrostFreezer").value === "si",
      abajoFrio:   document.getElementById("nofrostAbajo").value === "si",
      amp:         document.getElementById("nofrostAmp").value,
      psi:         document.getElementById("nofrostPsi").value,
      chkEvapCongelado: document.getElementById("chkNFEvapCongelado").checked,
      chkVentDetenido:  document.getElementById("chkNFVentDetenido").checked,
      chkContinuo:      document.getElementById("chkNFContinuo").checked,
      chkResistencia:   document.getElementById("chkNFResistencia").checked,
      chkBimetal:       document.getElementById("chkNFBimetal").checked,
      chkPlaca:         document.getElementById("chkNFPlaca").checked
    };
    DxActions.showResult("nofrost", d, NoFrostEngine.analyze(d));
  }
};
