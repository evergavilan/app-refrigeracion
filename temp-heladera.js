// =====================================================
// HVAC PRO ARGENTINA
// TEMP-HELADERA.JS — Diagnóstico heladera por temperatura
// Para técnicos sin manómetro — solo termómetro
// =====================================================

const TempHeladera = {

  data: null,
  activeTipo: "ciclica",

  async init() {
    if (this.data) return;
    try {
      const res  = await fetch("./temp-heladera.json");
      this.data  = await res.json();
    } catch(e) { console.error("Error cargando temp-heladera.json:", e); }
  },

  async render() {
    await this.init();
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="thBack">←</div>
  <div>
    <h1 class="hvac-title">🌡️ Heladera</h1>
    <p class="hvac-subtitle">Diagnóstico por temperatura</p>
  </div>
</header>

<div class="ft-info-badge" style="margin:12px 16px 4px;">
  🌡️ Sin manómetro podés diagnosticar con un termómetro. Medí las temperaturas reales y la app hace el resto.
</div>

<!-- TIPO DE EQUIPO -->
<div class="ruidos-equipo-tabs" style="margin-top:8px;">
  <button class="ruidos-eq-btn ${this.activeTipo==="ciclica"?"active":""}"   data-tipo="ciclica">🧊 Cíclica</button>
  <button class="ruidos-eq-btn ${this.activeTipo==="nofrost"?"active":""}"   data-tipo="nofrost">🌬️ No Frost</button>
  <button class="ruidos-eq-btn ${this.activeTipo==="comercial"?"active":""}" data-tipo="comercial">🏭 Comercial</button>
</div>

<!-- REFERENCIA RÁPIDA -->
${this.renderReferencia()}

<!-- FORMULARIO -->
<div class="th-form-card">
  <div class="th-form-titulo">📋 Ingresá las temperaturas medidas</div>

  ${this.activeTipo !== "comercial" ? `
  <div class="dx-field-row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
    <div>
      <label class="calc-label">🥶 Temp. Freezer (°C)</label>
      <input type="number" id="thTempFreezer" class="hvac-input"
        placeholder="ej: -15" step="1"/>
    </div>
    <div>
      <label class="calc-label">🧊 Temp. Heladera (°C)</label>
      <input type="number" id="thTempHeladera" class="hvac-input"
        placeholder="ej: 5" step="1"/>
    </div>
  </div>
  ` : `
  <div style="margin-bottom:12px;">
    <label class="calc-label">🌡️ Temperatura interior (°C)</label>
    <input type="number" id="thTempInterior" class="hvac-input"
      placeholder="ej: 3" step="1"/>
  </div>
  `}

  <div style="margin-bottom:12px;">
    <label class="calc-label">🔥 Temp. cuerpo del compresor °C <span style="color:#445566;font-size:11px;">(opcional — termómetro infrarrojo)</span></label>
    <input type="number" id="thTempCompresor" class="hvac-input"
      placeholder="ej: 55" step="1"/>
  </div>

  <div style="margin-bottom:16px;">
    <label class="calc-label">🌡️ Temp. ambiente del local (°C)</label>
    <input type="number" id="thTempAmbiente" class="hvac-input"
      placeholder="ej: 28" step="1" value="25"/>
  </div>

  <!-- Síntomas adicionales -->
  <div class="dx-checks" style="margin-bottom:16px;">
    <label class="dx-check">
      <input type="checkbox" id="thCompArra">
      <span>✅ El compresor arranca normalmente</span>
    </label>
    <label class="dx-check">
      <input type="checkbox" id="thContinuo">
      <span>🔄 Compresor trabaja continuo sin parar</span>
    </label>
    <label class="dx-check">
      <input type="checkbox" id="thRuido">
      <span>🔊 Hay ruido anormal en el compresor</span>
    </label>
  </div>

  <button class="calc-btn" id="thDiagnosticar">🔍 Diagnosticar por temperatura</button>
</div>

<div id="th-result"></div>`;

    this.bindEvents();
  },

  // ═══════════════════════════════════════════════
  // REFERENCIA RÁPIDA
  // ═══════════════════════════════════════════════

  renderReferencia() {
    const ref = this.data?.referencia_rapida[this.activeTipo];
    if (!ref) return "";

    return `
<div class="th-ref-card">
  <div class="th-ref-titulo">📋 Rangos normales — ${this.activeTipo === "ciclica" ? "Heladera Cíclica" : this.activeTipo === "nofrost" ? "No Frost" : "Comercial"}</div>
  ${ref.map(r => `
  <div class="th-ref-row">
    <span class="th-ref-zona">${r.zona}</span>
    <div>
      <span class="th-ref-normal">✅ ${r.normal}</span>
      <span class="th-ref-alerta">⚠️ ${r.preocuparse}</span>
    </div>
  </div>`).join("")}
</div>`;
  },

  // ═══════════════════════════════════════════════
  // DIAGNÓSTICO
  // ═══════════════════════════════════════════════

  diagnosticar() {
    const tipo         = this.activeTipo;
    const rangos       = this.data?.rangos[tipo === "comercial" ? "comercial_frio" : tipo];
    if (!rangos) return;

    const tempFreezer  = document.getElementById("thTempFreezer")  ? Number(document.getElementById("thTempFreezer").value)  : null;
    const tempHeladera = document.getElementById("thTempHeladera") ? Number(document.getElementById("thTempHeladera").value) : null;
    const tempInterior = document.getElementById("thTempInterior") ? Number(document.getElementById("thTempInterior").value) : null;
    const tempComp     = document.getElementById("thTempCompresor") ? Number(document.getElementById("thTempCompresor").value) : null;
    const tempAmb      = Number(document.getElementById("thTempAmbiente")?.value) || 25;
    const compArra     = document.getElementById("thCompArra")?.checked;
    const continuo     = document.getElementById("thContinuo")?.checked;
    const ruido        = document.getElementById("thRuido")?.checked;

    const el = document.getElementById("th-result");
    if (!el) return;

    // Validar que haya al menos un dato
    const hayDatos = tipo === "comercial"
      ? tempInterior !== null && !isNaN(tempInterior)
      : (tempFreezer !== null && !isNaN(tempFreezer)) || (tempHeladera !== null && !isNaN(tempHeladera));

    if (!hayDatos) {
      el.innerHTML = `<div class="calc-error" style="margin:10px 16px;">⚠️ Ingresá al menos una temperatura para diagnosticar.</div>`;
      return;
    }

    // Corrección por temperatura ambiente (a mayor temp ambiente, las temperaturas internas tienden a subir)
    const corrAmb = Math.max(0, (tempAmb - 25) * 0.3);

    // Evaluar estado de cada zona
    let freezer_ok = false, freezer_alto = false, freezer_muy_bajo = false, freezer_bajo_limite = false;
    let heladera_ok = false, heladera_alto = false, heladera_algo = false;
    let compresor_caliente = false;

    if (tipo !== "comercial" && tempFreezer !== null && !isNaN(tempFreezer)) {
      const rFreezer = rangos.freezer || this.data.rangos[tipo]?.freezer;
      freezer_ok          = tempFreezer >= rFreezer.min && tempFreezer <= rFreezer.max;
      freezer_alto        = tempFreezer > rFreezer.max + corrAmb;
      freezer_muy_bajo    = tempFreezer < rFreezer.min - 3;
      freezer_bajo_limite = tempFreezer > rFreezer.max - 2 && tempFreezer <= rFreezer.max + 4;
    }

    if (tipo !== "comercial" && tempHeladera !== null && !isNaN(tempHeladera)) {
      const rHel = rangos.heladera || this.data.rangos[tipo]?.heladera;
      heladera_ok   = tempHeladera >= rHel.min && tempHeladera <= rHel.max;
      heladera_alto = tempHeladera > rHel.max + corrAmb;
      heladera_algo = tempHeladera > rHel.max && tempHeladera < rHel.max + 6;
    }

    if (tempComp !== null && !isNaN(tempComp) && tempComp > 0) {
      const rComp = rangos.cuerpo_compresor || this.data.rangos[tipo]?.cuerpo_compresor;
      compresor_caliente = tempComp > rComp.max_critico;
    }

    // Seleccionar diagnóstico
    const diagnosticos = this.data?.diagnosticos || [];
    let dx = null;

    if (compresor_caliente) {
      dx = diagnosticos.find(d => d.id === "compresor-caliente");
    } else if (tipo !== "comercial" && tempFreezer !== null && !isNaN(tempFreezer) && tempHeladera !== null && !isNaN(tempHeladera)) {
      if (freezer_alto && heladera_alto)        dx = diagnosticos.find(d => d.id === "sin-frio-ninguno");
      else if (freezer_ok && heladera_alto)     dx = diagnosticos.find(d => d.id === "freezer-bien-heladera-no");
      else if (freezer_alto && heladera_ok)     dx = diagnosticos.find(d => d.id === "freezer-no-heladera-bien");
      else if (freezer_muy_bajo && heladera_ok) dx = diagnosticos.find(d => d.id === "freezer-muy-frio");
      else if (freezer_ok && heladera_ok)       dx = diagnosticos.find(d => d.id === "ok-todo");
      else if (freezer_bajo_limite && heladera_algo) dx = diagnosticos.find(d => d.id === "ambos-algo-frio");
    } else if (tipo === "comercial" && tempInterior !== null && !isNaN(tempInterior)) {
      const rInt = this.data.rangos.comercial_frio.interior;
      if (tempInterior > rInt.max + corrAmb) dx = diagnosticos.find(d => d.id === "sin-frio-ninguno");
      else if (tempInterior >= rInt.min && tempInterior <= rInt.max) dx = diagnosticos.find(d => d.id === "ok-todo");
      else dx = diagnosticos.find(d => d.id === "ambos-algo-frio");
    }

    // Ajuste por síntomas adicionales
    let notaExtra = "";
    if (continuo && dx?.id === "ok-todo") {
      notaExtra = "⚠️ Aunque las temperaturas están en rango, el compresor trabaja continuo. Revisá el sellado del burlete y la carga del compartimento.";
    }
    if (ruido) {
      notaExtra += (notaExtra ? " " : "") + "🔊 El ruido anormal puede indicar desgaste del compresor independientemente de las temperaturas.";
    }
    if (tempAmb > 35) {
      notaExtra += (notaExtra ? " " : "") + `☀️ Temperatura ambiente de ${tempAmb}°C — normal que el rendimiento sea algo menor al de días frescos.`;
    }

    if (!dx) {
      // Diagnóstico parcial con un solo dato
      el.innerHTML = this.renderResultadoParcial(tempFreezer, tempHeladera, tipo, corrAmb, notaExtra);
      return;
    }

    el.innerHTML = this.renderResultado(dx, tempFreezer, tempHeladera, tempInterior, tempComp, tempAmb, notaExtra);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Guardar en historial
    DxHistorial.add({
      modulo: "heladera-temp",
      titulo: dx.titulo,
      certeza: dx.certeza,
      datos:  { tipo, tempFreezer, tempHeladera, tempInterior, tempComp, tempAmb },
      html:   "",
      fecha:  new Date().toISOString()
    });
  },

  renderResultado(dx, tF, tH, tI, tC, tAmb, notaExtra) {
    const barColor = dx.certeza >= 85 ? "#00d9ff" : dx.certeza >= 75 ? "#ff9b42" : "#8899aa";
    const pasosHTML = dx.pasos.map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i+1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");

    const causasHTML = dx.causas_probables.length ? `
      <div class="th-causas-titulo">🔍 Causas probables:</div>
      ${dx.causas_probables.map(c => `
      <div class="th-causa">• ${c}</div>`).join("")}` : "";

    const tempDisplays = [];
    if (tF !== null && !isNaN(tF)) tempDisplays.push({ label: "Freezer", val: `${tF}°C`, tipo: this.activeTipo });
    if (tH !== null && !isNaN(tH)) tempDisplays.push({ label: "Heladera", val: `${tH}°C`, tipo: this.activeTipo });
    if (tI !== null && !isNaN(tI)) tempDisplays.push({ label: "Interior", val: `${tI}°C`, tipo: this.activeTipo });
    if (tC !== null && !isNaN(tC) && tC > 0) tempDisplays.push({ label: "Compresor", val: `${tC}°C`, tipo: "compresor" });

    const tempHTML = tempDisplays.length ? `
      <div class="th-temp-grid">
        ${tempDisplays.map(t => `
        <div class="th-temp-item">
          <div class="th-temp-val">${t.val}</div>
          <div class="th-temp-label">${t.label}</div>
        </div>`).join("")}
      </div>` : "";

    const notaHTML = notaExtra ? `<div class="th-nota-extra">${notaExtra}</div>` : "";

    return `
<div class="dx-result-card" style="margin:12px 16px 24px;">

  <div class="dx-header">
    <span class="dx-icono">${dx.icono}</span>
    <div class="dx-title-block">
      <div class="dx-titulo">${dx.titulo}</div>
      <div class="dx-certeza-bar">
        <div class="dx-certeza-fill" style="width:${dx.certeza}%;background:${barColor}"></div>
      </div>
      <div class="dx-certeza-txt" style="color:${barColor}">${dx.certeza}% probabilidad</div>
    </div>
  </div>

  ${tempHTML}

  ${notaHTML}

  ${causasHTML}

  <div class="dx-pasos-titulo">📋 Pasos de intervención:</div>
  ${pasosHTML}

  <div class="ruidos-mentor-card" style="margin-top:14px;">
    <span class="ruidos-mentor-avatar">👨‍🔧</span>
    <div>
      <div class="ruidos-mentor-label">El Mentor:</div>
      <div class="ruidos-mentor-frase">"${dx.mentor}"</div>
    </div>
  </div>

</div>`;
  },

  renderResultadoParcial(tF, tH, tipo, corrAmb, notaExtra) {
    const rangos = this.data?.rangos[tipo === "comercial" ? "comercial_frio" : tipo];

    const evaluar = (val, rango, nombre) => {
      if (val === null || isNaN(val)) return "";
      const ok   = val >= rango.min && val <= rango.max;
      const alto = val > rango.max + corrAmb;
      const bajo = val < rango.min - 2;
      const color = ok ? "#00ff88" : alto ? "#ff5252" : "#ff9b42";
      const estado = ok ? "✅ Normal" : alto ? "⬆️ Alto" : "⬇️ Bajo";
      return `
      <div class="th-temp-item" style="border-color:${color}40;background:${color}10;">
        <div class="th-temp-val" style="color:${color};">${val}°C</div>
        <div class="th-temp-label">${nombre}</div>
        <div style="font-size:11px;color:${color};font-weight:700;">${estado}</div>
      </div>`;
    };

    return `
<div class="dx-result-card" style="margin:12px 16px 24px;">
  <div class="dx-titulo" style="margin-bottom:12px;">Evaluación de temperatura</div>
  <div class="th-temp-grid">
    ${tF !== null && !isNaN(tF) ? evaluar(tF, rangos?.freezer || {min:-20,max:-12}, "Freezer") : ""}
    ${tH !== null && !isNaN(tH) ? evaluar(tH, rangos?.heladera || {min:2,max:8}, "Heladera") : ""}
  </div>
  ${notaExtra ? `<div class="th-nota-extra">${notaExtra}</div>` : ""}
  <div class="dx-causa" style="margin-top:12px;">Ingresá ambas temperaturas para obtener un diagnóstico completo.</div>
</div>`;
  },

  // ═══════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════

  bindEvents() {
    document.getElementById("thBack")?.addEventListener("click", () => Router.back());

    document.querySelectorAll("[data-tipo]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTipo = btn.dataset.tipo;
        this.render();
      });
    });

    document.getElementById("thDiagnosticar")?.addEventListener("click", () => {
      this.diagnosticar();
    });
  }

};
