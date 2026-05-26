// =====================================================
// CICLICA-PRO.JS — v3
// =====================================================

const CiclicaPRO = {
  render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="backHome">←</div>
  <div><h1 class="hvac-title">🧊 Cíclica PRO</h1><p class="hvac-subtitle">Diagnóstico clínico heladera</p></div>
  <button class="dx-hist-badge" id="openDxHist">📋</button>
</header>

<div class="dx-etapa-label">ETAPA 1 — Triage inicial</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">🏷️ Marca del equipo <span style="color:#445566;font-weight:400;">(opcional)</span></label>
    <select class="hvac-select" id="ciclicaMarca">
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
  <div class="dx-field" id="ciclicaModeloWrap" style="display:none;">
    <label class="dx-label">📋 Modelo <span style="color:#445566;font-weight:400;">(si lo sabés)</span></label>
    <input type="text" class="hvac-input" id="ciclicaModelo" placeholder="ej: WRB20N2HRW, GSF25..."/>
  </div>
  <div class="dx-field">
    <label class="dx-label">Gas refrigerante</label>
    <select class="hvac-select" id="ciclicaGas">
      <option value="R134a">R134a (más común)</option>
      <option value="R600a">R600a — Isobutano</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">¿El compresor arranca?</label>
    <select class="hvac-select" id="ciclicaArranca">
      <option value="si">✅ Sí arranca</option>
      <option value="no">❌ No arranca</option>
    </select>
  </div>
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">¿Enfría arriba (freezer)?</label>
      <select class="hvac-select" id="ciclicaArribaFrio">
        <option value="si">✅ Sí</option><option value="no">❌ No</option>
      </select>
    </div>
    <div class="dx-field">
      <label class="dx-label">¿Enfría abajo (heladera)?</label>
      <select class="hvac-select" id="ciclicaAbajoFrio">
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
      <input type="number" class="hvac-input" id="ciclicaAmp" placeholder="ej: 1.5" step="0.1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">📉 Presión proceso (PSI)</label>
      <input type="number" class="hvac-input" id="ciclicaPsi" placeholder="ej: 2" step="0.5"/>
    </div>
  </div>
  <div class="dx-hint">💡 En R600a los valores de PSI son muy bajos o negativos</div>
</div>

<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="chkPTC"> <span>🔌 PTC / Relay de arranque sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkEscarcha"> <span>❄️ Escarcha excesiva en freezer</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCiclicaContinuo"> <span>🔄 Compresor trabaja continuo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCondCaliente"> <span>🔥 Condensador trasero muy caliente</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCiclicaRuido"> <span>🔊 Ruidos anormales del compresor</span></label>
  </div>
</div>

<div class="dx-btn-row" id="dxBtnRow">
  <button class="hvac-btn btn-secondary" id="clearCiclica">🗑 Limpiar</button>
  <button class="hvac-btn btn-primary"   id="analyzeCiclica">🔍 Diagnosticar</button>
  <div id="dxPdfSlot"></div>
</div>

<div id="dxResult"></div>
`;
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById("backHome")?.addEventListener("click", () => Router.back());
    document.getElementById("openDxHist")?.addEventListener("click", () => Router.go("dx-historial"));
    document.getElementById("ciclicaMarca")?.addEventListener("change", () => {
      const wrap = document.getElementById("ciclicaModeloWrap");
      const val  = document.getElementById("ciclicaMarca").value;
      if (wrap) wrap.style.display = val ? "block" : "none";
    });
    document.getElementById("analyzeCiclica")?.addEventListener("click", () => this.runAnalysis());
    document.getElementById("clearCiclica")?.addEventListener("click", () => {
      DxActions.clearForm(["ciclicaAmp","ciclicaPsi","chkPTC","chkEscarcha","chkCiclicaContinuo","chkCondCaliente","chkCiclicaRuido"]);
      Historial.showToast("✅ Campos limpiados");
    });
  },

  runAnalysis() {
    const d = {
      marca:      document.getElementById("ciclicaMarca")?.value || "",
      modelo:     document.getElementById("ciclicaModelo")?.value || "",
      gas:        document.getElementById("ciclicaGas").value,
      arranca:    document.getElementById("ciclicaArranca").value,
      arribaFrio: document.getElementById("ciclicaArribaFrio").value === "si",
      abajoFrio:  document.getElementById("ciclicaAbajoFrio").value === "si",
      amp:        document.getElementById("ciclicaAmp").value,
      psi:        document.getElementById("ciclicaPsi").value,
      chkPTC:          document.getElementById("chkPTC").checked,
      chkEscarcha:     document.getElementById("chkEscarcha").checked,
      chkContinuo:     document.getElementById("chkCiclicaContinuo").checked,
      chkCondCaliente: document.getElementById("chkCondCaliente").checked,
      chkRuido:        document.getElementById("chkCiclicaRuido").checked
    };
    DxActions.showResult("ciclica", d, CiclicaEngine.analyze(d));
  }
};
