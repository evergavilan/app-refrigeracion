// =====================================================
// HVAC PRO ARGENTINA
// HELADERA-TEMP.JS — Diagnóstico por temperatura real
// Sin manómetro — solo termómetro
// =====================================================

const HeladeraTempDx = {

  // Rangos normales de temperatura por zona
  rangos: {
    freezer:      { min: -20, max: -10, optimo: -15 },
    heladera:     { min: 2,   max: 8,   optimo: 5   },
    evaporador:   { min: -25, max: -10, optimo: -18 },
    condensador:  { min: 45,  max: 65,  optimo: 55  },
    compresor:    { min: 50,  max: 80,  optimo: 65  }
  },

  // ═══════════════════════════════════════════════
  // RENDER — pantalla principal
  // ═══════════════════════════════════════════════

  render() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `

<header class="hvac-header">
  <div class="module-back" id="htBack">←</div>
  <div>
    <h1 class="hvac-title">🌡️ Heladera por Temp.</h1>
    <p class="hvac-subtitle">Diagnóstico sin manómetro</p>
  </div>
</header>

<div class="ft-info-badge" style="margin:12px 16px 4px;">
  🌡️ Solo necesitás un termómetro. Medí las temperaturas reales y el sistema te dice qué está fallando.
</div>

<!-- TIPO DE HELADERA -->
<div class="dx-etapa-label">ETAPA 1 — Tipo de heladera</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">Tipo</label>
    <select class="hvac-select" id="htTipo">
      <option value="ciclica">🧊 Cíclica (con freezer manual)</option>
      <option value="nofrost">🌬️ No Frost (deshielo automático)</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">¿El compresor arranca?</label>
    <select class="hvac-select" id="htArranca">
      <option value="si">✅ Sí arranca</option>
      <option value="no">❌ No arranca / zumba y se apaga</option>
    </select>
  </div>
  <div class="dx-field">
    <label class="dx-label">⏱️ ¿Cuánto tiempo lleva funcionando?</label>
    <select class="hvac-select" id="htTiempo">
      <option value="normal">Funcionamiento normal (más de 2 hs)</option>
      <option value="poco">Poco tiempo (menos de 2 hs desde que se encendió)</option>
      <option value="parada">Estuvo mucho tiempo apagada</option>
    </select>
  </div>
</div>

<!-- TEMPERATURAS -->
<div class="dx-etapa-label">ETAPA 2 — Temperaturas medidas con termómetro</div>
<div class="dx-card">

  <div class="ht-ayuda-medicion">
    <div class="ht-ayuda-titulo">📍 Dónde medir</div>
    <div class="ht-ayuda-item">🧊 <strong>Freezer:</strong> Termómetro en el centro del freezer, 10 min dentro</div>
    <div class="ht-ayuda-item">🥛 <strong>Heladera:</strong> Termómetro en el centro de la heladera (no en la puerta)</div>
    <div class="ht-ayuda-item">🔥 <strong>Condensador:</strong> Termómetro de contacto en el serpentín trasero/inferior</div>
    <div class="ht-ayuda-item">⚙️ <strong>Compresor:</strong> Termómetro de contacto en la carcasa del compresor</div>
  </div>

  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">🧊 Temp. Freezer (°C)</label>
      <input type="number" class="hvac-input" id="htTempFreezer"
             placeholder="normal: -15 a -20°C" step="1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">🥛 Temp. Heladera (°C)</label>
      <input type="number" class="hvac-input" id="htTempHeladera"
             placeholder="normal: 3 a 7°C" step="1"/>
    </div>
  </div>
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">🔥 Temp. Condensador (°C) <span style="color:#445566;font-size:11px;">(opcional)</span></label>
      <input type="number" class="hvac-input" id="htTempCond"
             placeholder="normal: 45-65°C" step="1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">⚙️ Temp. Compresor (°C) <span style="color:#445566;font-size:11px;">(opcional)</span></label>
      <input type="number" class="hvac-input" id="htTempComp"
             placeholder="normal: 50-80°C" step="1"/>
    </div>
  </div>

  <div class="dx-hint">
    💡 Con solo el freezer y la heladera ya podés diagnosticar. Condensador y compresor son opcionales pero mejoran la precisión.
  </div>

</div>

<!-- SÍNTOMAS ADICIONALES -->
<div class="dx-etapa-label">ETAPA 3 — Síntomas observados</div>
<div class="dx-card">
  <div class="dx-checks">
    <label class="dx-check"><input type="checkbox" id="htChkEscarcha"> <span>❄️ Mucha escarcha en el freezer (cíclica)</span></label>
    <label class="dx-check"><input type="checkbox" id="htChkHielo"> <span>🧊 Bloque de hielo visible en el evaporador (No Frost)</span></label>
    <label class="dx-check"><input type="checkbox" id="htChkVentParado"> <span>🌬️ Ventilador del evaporador detenido (No Frost)</span></label>
    <label class="dx-check"><input type="checkbox" id="htChkContinuo"> <span>🔄 Compresor trabaja continuo sin cortar</span></label>
    <label class="dx-check"><input type="checkbox" id="htChkCondHot"> <span>🔥 Condensador muy caliente al tacto</span></label>
    <label class="dx-check"><input type="checkbox" id="htChkBurlete"> <span>🚪 Burlete de puerta sospechoso o deteriorado</span></label>
    <label class="dx-check"><input type="checkbox" id="htChkSobreCargada"> <span>📦 Heladera muy llena o con comida caliente adentro</span></label>
  </div>
</div>

<div class="dx-btn-row" id="dxBtnRow">
  <button class="hvac-btn btn-secondary" id="clearHT">🗑 Limpiar</button>
  <button class="hvac-btn btn-primary"   id="analyzeHT">🔍 Diagnosticar</button>
  <div id="dxPdfSlot"></div>
</div>

<div id="dxResult"></div>`;

    this.bindEvents();
  },

  // ═══════════════════════════════════════════════
  // ENGINE DE DIAGNÓSTICO POR TEMPERATURA
  // ═══════════════════════════════════════════════

  analyze(d) {

    const tF  = d.tempFreezer  !== "" ? Number(d.tempFreezer)  : null;
    const tH  = d.tempHeladera !== "" ? Number(d.tempHeladera) : null;
    const tC  = d.tempCond     !== "" ? Number(d.tempCond)     : null;
    const tCo = d.tempComp     !== "" ? Number(d.tempComp)     : null;

    const rF = this.rangos.freezer;
    const rH = this.rangos.heladera;
    const rC = this.rangos.condensador;
    const rCo= this.rangos.compresor;

    const freezerFrio = tF !== null && tF <= rF.max;
    const freezerCaliente = tF !== null && tF > rF.max + 5;
    const heladeraFria  = tH !== null && tH >= rH.min && tH <= rH.max;
    const heladeraCaliente = tH !== null && tH > rH.max + 5;
    const condMuyCaliente  = tC !== null && tC > rC.max;
    const compMuyCaliente  = tCo !== null && tCo > rCo.max;

    // ─── COMPRESOR NO ARRANCA ───────────────────
    if (d.arranca === "no") return this.dx({
      icono: "⚡",
      titulo: "Compresor no arranca",
      certeza: 75,
      causa: "El compresor no intenta arrancar o arranca y se apaga en segundos. Las temperaturas aún no son diagnósticas — el problema es eléctrico de arranque.",
      interpretacion: null,
      pasos: [
        "Verificá tensión en el tomacorriente: debe ser 210-230V.",
        "Retirá y medí el PTC (relay de arranque): debe tener alta resistencia en frío.",
        "Verificá el Klixon (protector térmico): debe tener continuidad cuando está frío.",
        "Si PTC y Klixon están ok → medí los devanados del compresor con el multímetro.",
        "Un zumbido sin arranque casi siempre es el PTC o tensión de red baja."
      ],
      alerta: "⚠️ No intentes arrancar más de 3 veces seguidas — esperá que enfríe entre intentos."
    });

    // ─── SIN DATOS DE TEMPERATURA ───────────────
    if (tF === null && tH === null) return this.dx({
      icono: "🌡️",
      titulo: "Ingresá al menos una temperatura",
      certeza: 0,
      causa: "Con temperaturas medidas el diagnóstico es mucho más preciso. Usá un termómetro de cocina o de contacto.",
      interpretacion: null,
      pasos: [
        "Dejá un termómetro en el centro del freezer por 10 minutos.",
        "Dejá otro termómetro en el centro de la heladera (no en la puerta).",
        "Si no tenés dos termómetros, medí uno por vez.",
        "Con esos dos valores volvé a correr el diagnóstico."
      ],
      alerta: null
    });

    // ─── POCO TIEMPO FUNCIONANDO ────────────────
    if (d.tiempo === "poco" || d.tiempo === "parada") {
      const msg = d.tiempo === "parada"
        ? "La heladera estuvo apagada mucho tiempo — necesita varias horas para llegar a temperatura."
        : "Con menos de 2 horas de funcionamiento las temperaturas todavía no son representativas.";
      return this.dx({
        icono: "⏱️",
        titulo: "Tiempo insuficiente de funcionamiento",
        certeza: 85,
        causa: msg,
        interpretacion: { tF, tH, tC, tCo },
        pasos: [
          "Dejá la heladera funcionando sin abrir por 4-6 horas.",
          "Evitá meter comida caliente o abrir la puerta frecuentemente.",
          "Después de 6 horas medí las temperaturas nuevamente.",
          "Una heladera que estuvo mucho tiempo apagada puede tardar 8-12 horas en estabilizarse."
        ],
        alerta: null
      });
    }

    // ─── FREEZER FRÍO + HELADERA CALIENTE ───────
    // Patrón más clásico: restricción o sistema de deshielo
    if (freezerFrio && heladeraCaliente) {

      if (d.tipo === "nofrost" && (d.chkHielo || d.chkVentParado)) return this.dx({
        icono: "🧊❌",
        titulo: "Sistema de deshielo fallado (No Frost)",
        certeza: 93,
        causa: `Freezer frío (${tF !== null ? tF+"°C" : "ok"}) pero heladera caliente (${tH !== null ? tH+"°C" : "alta"}). El evaporador está congelado y el aire frío no puede circular hacia la parte inferior.`,
        interpretacion: { tF, tH, tC, tCo },
        pasos: [
          "Hacé un deshielo manual: desconectá 24-48 horas con puertas abiertas.",
          "Si después del deshielo enfría abajo aunque sea por días → confirmás sistema de deshielo.",
          "Medí la resistencia de deshielo: debe estar entre 20-60Ω. Si da ∞ → reemplazarla.",
          "Medí el bimetal: debe tener continuidad en frío. Si está abierto → reemplazar.",
          "Si resistencia y bimetal están ok → revisar timer o placa de deshielo."
        ],
        alerta: "💡 Antes de abrir el equipo, el deshielo manual confirma el diagnóstico y es gratis."
      });

      if (d.tipo === "ciclica") return this.dx({
        icono: "🔒",
        titulo: "Restricción en capilar o filtro",
        certeza: 85,
        causa: `Freezer frío (${tF !== null ? tF+"°C" : "ok"}) pero heladera caliente (${tH !== null ? tH+"°C" : "alta"}). El refrigerante llega al freezer pero no alcanza el evaporador de la heladera.`,
        interpretacion: { tF, tH, tC, tCo },
        pasos: [
          "Primero: deshielo manual completo (24h) — el hielo puede tapar el capilar.",
          "Si después del deshielo sigue igual → restricción real en capilar o filtro.",
          "Tocá el filtro deshidratador: si está más frío que el resto del sistema → está tapado.",
          "Si el filtro está ok → el capilar puede estar parcialmente tapado.",
          "Un capilar restringido requiere reemplazo o desbloqueo con nitrógeno."
        ],
        alerta: null
      });
    }

    // ─── AMBOS CALIENTES ────────────────────────
    if (freezerCaliente && heladeraCaliente) {

      // Condensador muy caliente → problema de disipación
      if (condMuyCaliente || d.chkCondHot) return this.dx({
        icono: "🔥",
        titulo: `Condensador sobrecargado — ${tC !== null ? tC+"°C" : "muy caliente al tacto"}`,
        certeza: 88,
        causa: `Ninguna zona está fría y el condensador está muy caliente${tC !== null ? ` (${tC}°C, normal hasta ${rC.max}°C)` : ""}. El calor no se disipa correctamente.`,
        interpretacion: { tF, tH, tC, tCo },
        pasos: [
          "Limpiá el condensador (serpentín trasero o inferior) con aspiradora y cepillo.",
          "Verificá que haya espacio libre atrás y abajo de la heladera.",
          "Verificá que el condensador no esté cubierto por objetos o empotrado sin ventilación.",
          "Después de limpiar: dejá 2 horas y re-medí las temperaturas.",
          "Si el condensador sigue muy caliente con todo limpio → posible exceso de gas o compresor."
        ],
        alerta: null
      });

      // Sin gas — ambos calientes, compresor ok
      return this.dx({
        icono: "💨",
        titulo: "Sin refrigeración — posible fuga de gas",
        certeza: 82,
        causa: `Ni el freezer (${tF !== null ? tF+"°C" : "--"}) ni la heladera (${tH !== null ? tH+"°C" : "--"}) están fríos con el compresor funcionando. El sistema no está transfiriendo calor.`,
        interpretacion: { tF, tH, tC, tCo },
        pasos: [
          "Buscá fuga con agua jabonosa en todas las conexiones y el compresor.",
          "Prestá atención al compresor: ¿está caliente? (toca la carcasa). Si está frío y corriendo → puede estar sin compresión.",
          "Si el compresor está muy caliente → posible fuga con el compresor trabajando en vacío.",
          "Si no hay fuga visible → pressurizá con nitrógeno para encontrarla.",
          "No cargues gas antes de encontrar la fuga."
        ],
        alerta: d.tipo === "nofrost" && !d.chkHielo
          ? "💡 En No Frost con ambos lados calientes: primero verificá que no sea sistema de deshielo con el evaporador congelado."
          : null
      });
    }

    // ─── FREEZER CALIENTE + HELADERA CALIENTE (LEVE) ──
    if (freezerCaliente && tH !== null && tH > 10) return this.dx({
      icono: "🌡️",
      titulo: `Temperaturas elevadas — Freezer: ${tF}°C / Heladera: ${tH}°C`,
      certeza: 78,
      causa: "Ambas zonas están por encima de los valores normales pero no totalmente calientes. El sistema refrigera pero con muy baja eficiencia.",
      interpretacion: { tF, tH, tC, tCo },
      pasos: [
        "Verificá el estado del burlete de la puerta — un burlete que no sella bien hace que el compresor trabaje continuamente sin llegar a temperatura.",
        "Revisá si la heladera está muy llena o tiene comida caliente — reduce la eficiencia.",
        "Limpiá el condensador si hace más de 6 meses.",
        "Si el compresor trabaja continuo → probá presionar el burlete en todo el perímetro y ver si la temperatura mejora.",
        "Si el burlete está bien → evaluar gas (si tenés manómetro) o condensador."
      ],
      alerta: d.chkBurlete ? "⚠️ Burlete sospechoso marcado — este es el primer punto a verificar y el más fácil de resolver." : null
    });

    // ─── COMPRESOR TRABAJA CONTINUO + TEMPERATURAS OK ──
    if (d.chkContinuo && freezerFrio && heladeraFria) return this.dx({
      icono: "🔄",
      titulo: "Compresor continuo — temperaturas en rango",
      certeza: 80,
      causa: `Las temperaturas son correctas (Freezer: ${tF !== null ? tF+"°C" : "ok"}, Heladera: ${tH !== null ? tH+"°C" : "ok"}) pero el compresor nunca para. El sistema refrigera bien pero no puede descansar.`,
      interpretacion: { tF, tH, tC, tCo },
      pasos: [
        "Revisá el burlete de las puertas — pasá un papel por todo el perímetro con la puerta cerrada. Si sale fácil → el burlete no sella.",
        "Verificá el termostato o controlador: puede estar mal calibrado o pediendo más frío del necesario.",
        "Verificá si hay objetos que impidan que la puerta cierre completamente.",
        "En verano con temperatura ambiente muy alta (más de 35°C) → puede ser normal que trabaje más.",
        "Si el burlete está bien y la temperatura ambiente es normal → revisar termostato."
      ],
      alerta: d.chkBurlete ? "⚠️ Burlete marcado como sospechoso — es la causa más frecuente del compresor continuo." : null
    });

    // ─── COMPRESOR CONTINUO + HELADERA CALIENTE ─
    if (d.chkContinuo && heladeraCaliente) return this.dx({
      icono: "🔄🌡️",
      titulo: "Compresor continuo sin enfriar — falla importante",
      certeza: 85,
      causa: `La heladera está a ${tH !== null ? tH+"°C" : "temperatura alta"} y el compresor no para. El sistema no logra alcanzar la temperatura objetivo — hay una falla que lo impide.`,
      interpretacion: { tF, tH, tC, tCo },
      pasos: [
        "Si el freezer sí enfría pero la heladera no → restricción o sistema de deshielo (No Frost).",
        "Si ninguno enfría → fuga de gas o compresor sin compresión.",
        "Verificá el condensador: si está muy caliente → limpiarlo antes de evaluar el gas.",
        "Si tenés manómetro: conectá y medí PSI — con el PSI sabés si es gas o compresión.",
        "Sin manómetro: si el compresor está caliente y la succión no está fría → confirma falta de gas."
      ],
      alerta: null
    });

    // ─── TODO EN RANGO ───────────────────────────
    if (freezerFrio && heladeraFria) return this.dx({
      icono: "✅",
      titulo: `Sistema en rango — Freezer: ${tF !== null ? tF+"°C" : "ok"} / Heladera: ${tH !== null ? tH+"°C" : "ok"}`,
      certeza: 92,
      causa: "Las temperaturas medidas están dentro de los valores normales. El sistema está funcionando correctamente.",
      interpretacion: { tF, tH, tC, tCo },
      pasos: [
        "Verificá el burlete como mantenimiento preventivo.",
        "Limpiá el condensador si hace más de 6 meses.",
        "Registrá estas temperaturas como baseline para futuras comparaciones.",
        "Si el cliente reporta algún problema con el sistema en rango → puede ser percepción o uso incorrecto.",
        "Explicá al cliente las temperaturas normales esperadas."
      ],
      alerta: null
    });

    // ─── FREEZER FRÍO + HELADERA TIBIA (LEVE) ───
    return this.dx({
      icono: "🌡️",
      titulo: "Freezer frío, heladera tibia",
      certeza: 70,
      causa: `Freezer en rango${tF !== null ? ` (${tF}°C)` : ""} pero heladera un poco tibia${tH !== null ? ` (${tH}°C)` : ""}. Puede ser normal en días de calor o un inicio de problema.`,
      interpretacion: { tF, tH, tC, tCo },
      pasos: [
        "Verificá la temperatura ambiente del local — con más de 32°C es normal que la heladera esté un poco más tibia.",
        "Revisá que la puerta de la heladera cierre correctamente.",
        "Verificá que no haya comida caliente adentro o que esté muy llena.",
        "Si la temperatura de la heladera supera los 10°C consistentemente → hay un problema real.",
        "Limpiá el condensador como preventivo."
      ],
      alerta: null
    });
  },

  // ═══════════════════════════════════════════════
  // FORMATEADOR DE RESULTADO
  // ═══════════════════════════════════════════════

  dx({ icono, titulo, certeza, causa, interpretacion, pasos, alerta }) {
    const barColor = certeza >= 85 ? "#00d9ff"
                   : certeza >= 70 ? "#ff9b42"
                   : "#8899aa";

    const pasosHTML = pasos.map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i+1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");

    const alertaHTML = alerta
      ? `<div class="dx-alerta">${alerta}</div>` : "";

    // Panel de temperaturas medidas
    let tempHTML = "";
    if (interpretacion && Object.values(interpretacion).some(v => v !== null)) {
      const { tF, tH, tC, tCo } = interpretacion;
      const r = this.rangos;
      const tempsHTML = [
        tF  !== null ? { label:"Freezer",     val:tF,  rMin:r.freezer.min,     rMax:r.freezer.max,     unit:"°C" } : null,
        tH  !== null ? { label:"Heladera",    val:tH,  rMin:r.heladera.min,    rMax:r.heladera.max,    unit:"°C" } : null,
        tC  !== null ? { label:"Condensador", val:tC,  rMin:r.condensador.min, rMax:r.condensador.max, unit:"°C" } : null,
        tCo !== null ? { label:"Compresor",   val:tCo, rMin:r.compresor.min,   rMax:r.compresor.max,   unit:"°C" } : null,
      ].filter(Boolean);

      if (tempsHTML.length) {
        tempHTML = `<div class="dx-datos-grid">
          ${tempsHTML.map(t => {
            const bajo = t.val < t.rMin;
            const alto = t.val > t.rMax;
            const cls  = alto ? "dx-alto" : bajo ? "dx-bajo" : "dx-ok";
            return `<div class="dx-dato ${cls}">
              <span class="dx-dato-label">${t.label}</span>
              <span class="dx-dato-val">${t.val}${t.unit}</span>
              <span class="dx-dato-ref">${t.rMin} a ${t.rMax}${t.unit}</span>
            </div>`;
          }).join("")}
        </div>`;
      }
    }

    return { html: `
      <div class="dx-result-card">
        <div class="dx-header">
          <span class="dx-icono">${icono}</span>
          <div class="dx-title-block">
            <div class="dx-titulo">${titulo}</div>
            ${certeza > 0 ? `
            <div class="dx-certeza-bar">
              <div class="dx-certeza-fill" style="width:${certeza}%;background:${barColor}"></div>
            </div>
            <div class="dx-certeza-txt" style="color:${barColor}">${certeza}% probabilidad</div>` : ""}
          </div>
        </div>
        <div class="dx-causa">${causa}</div>
        ${tempHTML}
        ${alertaHTML}
        <div class="dx-pasos-titulo">📋 Pasos de intervención:</div>
        ${pasosHTML}
      </div>` };
  },

  // ═══════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════

  bindEvents() {
    document.getElementById("htBack")?.addEventListener("click", () => Router.back());

    document.getElementById("clearHT")?.addEventListener("click", () => {
      ["htTempFreezer","htTempHeladera","htTempCond","htTempComp"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      ["htChkEscarcha","htChkHielo","htChkVentParado","htChkContinuo",
       "htChkCondHot","htChkBurlete","htChkSobreCargada"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
      });
      const res = document.getElementById("dxResult");
      if (res) res.innerHTML = "";
      Historial.showToast("✅ Campos limpiados");
    });

    document.getElementById("analyzeHT")?.addEventListener("click", () => {
      const d = {
        tipo:          document.getElementById("htTipo").value,
        arranca:       document.getElementById("htArranca").value,
        tiempo:        document.getElementById("htTiempo").value,
        tempFreezer:   document.getElementById("htTempFreezer").value,
        tempHeladera:  document.getElementById("htTempHeladera").value,
        tempCond:      document.getElementById("htTempCond").value,
        tempComp:      document.getElementById("htTempComp").value,
        chkEscarcha:   document.getElementById("htChkEscarcha").checked,
        chkHielo:      document.getElementById("htChkHielo").checked,
        chkVentParado: document.getElementById("htChkVentParado").checked,
        chkContinuo:   document.getElementById("htChkContinuo").checked,
        chkCondHot:    document.getElementById("htChkCondHot").checked,
        chkBurlete:    document.getElementById("htChkBurlete").checked,
        chkSobreCargada: document.getElementById("htChkSobreCargada").checked
      };

      const result = this.analyze(d);
      DxActions.showResult("heladera-temp", d, result);
    });
  }

};
