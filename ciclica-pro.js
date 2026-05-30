// =====================================================
// HVAC PRO ARGENTINA
// CICLICA-PRO.JS — v4 con temperaturas reales
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

<div class="dx-etapa-label">ETAPA 1 — Datos del equipo</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">🏷️ Marca <span style="color:#445566;font-weight:400;">(opcional)</span></label>
    <select class="hvac-select" id="ciclicaMarca">
      <option value="">— Seleccionar —</option>
      <option value="Whirlpool">Whirlpool</option>
      <option value="Mabe">Mabe</option>
      <option value="Samsung">Samsung</option>
      <option value="LG">LG</option>
      <option value="Electrolux">Electrolux</option>
      <option value="Drean">Drean</option>
      <option value="Brightstar">Brightstar / BGH</option>
      <option value="otra">Otra</option>
    </select>
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
</div>

<div class="dx-etapa-label">ETAPA 2 — Temperaturas reales (termómetro)</div>
<div class="dx-card">
  <div class="ft-info-badge" style="margin:0 0 12px;">
    🌡️ Si tenés termómetro, ingresá las temperaturas reales. Si no tenés, indicá si enfría o no.
  </div>
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">❄️ Temp. freezer (°C)</label>
      <input type="number" class="hvac-input" id="ciclicaTempFreezer"
        placeholder="ej: -15" step="1"/>
      <span style="font-size:11px;color:#445566;margin-top:4px;display:block;">Normal: -12°C a -18°C</span>
    </div>
    <div class="dx-field">
      <label class="dx-label">🌡️ Temp. interior heladera (°C)</label>
      <input type="number" class="hvac-input" id="ciclicaTempHeladera"
        placeholder="ej: 7" step="1"/>
      <span style="font-size:11px;color:#445566;margin-top:4px;display:block;">Normal: 3°C a 8°C</span>
    </div>
  </div>
  <div class="dx-field-row" style="margin-top:8px;">
    <div class="dx-field">
      <label class="dx-label">📉 PSI proceso (si tenés manómetro)</label>
      <input type="number" class="hvac-input" id="ciclicaPsi" placeholder="ej: 2" step="0.5"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">⚡ Amperaje (A)</label>
      <input type="number" class="hvac-input" id="ciclicaAmp" placeholder="ej: 1.5" step="0.1"/>
    </div>
  </div>
  <div class="dx-hint">💡 Con solo el termómetro ya podés diagnosticar — PSI y AMP son opcionales</div>
</div>

<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="chkPTC"> <span>🔌 PTC / Relay sospechoso</span></label>
    <label class="dx-check"><input type="checkbox" id="chkEscarcha"> <span>❄️ Escarcha excesiva en freezer</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCiclicaContinuo"> <span>🔄 Compresor trabaja continuo</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCondCaliente"> <span>🔥 Condensador trasero muy caliente</span></label>
    <label class="dx-check"><input type="checkbox" id="chkCiclicaRuido"> <span>🔊 Ruidos anormales</span></label>
    <label class="dx-check"><input type="checkbox" id="chkBurleteRoto"> <span>🚪 Burlete de puerta deteriorado</span></label>
    <label class="dx-check"><input type="checkbox" id="chkComidaCaliente"> <span>🍲 Había comida caliente adentro reciente</span></label>
  </div>
</div>

<div class="dx-btn-row" id="dxBtnRow">
  <button class="hvac-btn btn-secondary" id="clearCiclica">🗑 Limpiar</button>
  <button class="hvac-btn btn-primary"   id="analyzeCiclica">🔍 Diagnosticar</button>
  <div id="dxPdfSlot"></div>
</div>

<div id="dxResult"></div>`;
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById("backHome")?.addEventListener("click", () => Router.back());
    document.getElementById("openDxHist")?.addEventListener("click", () => Router.go("dx-historial"));

    document.getElementById("clearCiclica")?.addEventListener("click", () => {
      DxActions.clearForm([
        "ciclicaAmp","ciclicaPsi","ciclicaTempFreezer","ciclicaTempHeladera",
        "chkPTC","chkEscarcha","chkCiclicaContinuo","chkCondCaliente",
        "chkCiclicaRuido","chkBurleteRoto","chkComidaCaliente"
      ]);
      Historial.showToast("✅ Campos limpiados");
    });

    document.getElementById("analyzeCiclica")?.addEventListener("click", () => this.runAnalysis());
  },

  runAnalysis() {
    const d = {
      gas:         document.getElementById("ciclicaGas").value,
      marca:       document.getElementById("ciclicaMarca").value,
      arranca:     document.getElementById("ciclicaArranca").value,
      tempFreezer: document.getElementById("ciclicaTempFreezer").value,
      tempHeladera:document.getElementById("ciclicaTempHeladera").value,
      amp:         document.getElementById("ciclicaAmp").value,
      psi:         document.getElementById("ciclicaPsi").value,
      // derivar arribaFrio/abajoFrio desde temperatura real si está ingresada
      arribaFrio:  document.getElementById("ciclicaTempFreezer").value
                     ? Number(document.getElementById("ciclicaTempFreezer").value) < -5
                     : true,
      abajoFrio:   document.getElementById("ciclicaTempHeladera").value
                     ? Number(document.getElementById("ciclicaTempHeladera").value) < 12
                     : true,
      chkPTC:          document.getElementById("chkPTC").checked,
      chkEscarcha:     document.getElementById("chkEscarcha").checked,
      chkContinuo:     document.getElementById("chkCiclicaContinuo").checked,
      chkCondCaliente: document.getElementById("chkCondCaliente").checked,
      chkRuido:        document.getElementById("chkCiclicaRuido").checked,
      chkBurleteRoto:  document.getElementById("chkBurleteRoto").checked,
      chkComidaCaliente: document.getElementById("chkComidaCaliente").checked
    };

    const result = CiclicaEngine.analyze(d);
    DxActions.showResult("ciclica", d, result);
  }
};
