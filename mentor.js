// =====================================================
// HVAC PRO ARGENTINA — MENTOR.JS v3
// El Mentor: 30 años en el rubro. Voz propia.
// =====================================================

const Mentor = {

  data: null,

  async init() {
    if (this.data) return;
    try {
      const res = await fetch('./mentor.json');
      this.data  = await res.json();
    } catch(e) {
      console.warn("Mentor: no se pudo cargar mentor.json", e);
    }
  },

  // ═══════════════════════════════════════════════
  // BUSCAR FRASE POR MÓDULO + TÍTULO
  // ═══════════════════════════════════════════════

  getFrase(modulo, titulo) {
    if (!this.data) return null;
    const frases = this.data.frases;

    // 1. Match exacto módulo + título
    if (frases[modulo]?.[titulo]) return frases[modulo][titulo];

    // 2. Match parcial en el módulo
    if (frases[modulo]) {
      const keys  = Object.keys(frases[modulo]);
      const tLow  = titulo.toLowerCase();
      const match = keys.find(k =>
        tLow.includes(k.toLowerCase()) ||
        k.toLowerCase().includes(tLow.split("—")[0].trim())
      );
      if (match) return frases[modulo][match];
    }

    // 3. Sin match — null (no caer en genérico para evitar
    //    que el contexto equivocado confunda al técnico)
    return null;
  },

  // ═══════════════════════════════════════════════
  // OBSERVACIONES CRUZADAS
  // Solo cuando agregan información que el diagnóstico
  // principal NO incluye. SH/SC ya están en el dx.
  // ═══════════════════════════════════════════════

  getObservacionesCruzadas(modulo, datos) {
    if (!datos) return [];
    const obs = [];

    if (modulo === "split") {
      const psi    = Number(datos.psi) || 0;
      const a      = Number(datos.amp) || 0;
      const deltaT = (datos.tempIn && datos.tempOut)
        ? (Number(datos.tempIn) - Number(datos.tempOut)) : null;

      // NO agregar observación de SH/SC — ya está en el diagnóstico principal

      // Condensador sucio + PSI alto: recordar el orden correcto
      if (datos.chkCondSucio && psi > 0) {
        obs.push("🔧 <strong>Condensador sucio marcado:</strong> limpiar el condensador antes de tocar el gas. Un condensador tapado sube la presión y el amperaje — puede parecer exceso de gas cuando no lo es. Siempre limpiar primero y medir de nuevo.");
      }

      // Trabaja continuo + poco frío: puede ser dimensionamiento
      if (datos.chkContinuo && datos.chkPocofrio) {
        obs.push("📐 <strong>Trabaja continuo sin llegar al setpoint:</strong> si el gas está en rango, evaluá el dimensionamiento del equipo para ese ambiente. Un equipo chico para el m³ del local nunca llega al setpoint sin importar qué hagás con el gas.");
      }

      // Delta T fuera de rango (cuando está disponible)
      if (deltaT !== null && deltaT < 6) {
        obs.push(`🌡️ <strong>Delta T de ${deltaT}°C — muy bajo:</strong> la diferencia de temperatura entre entrada y salida del evaporador debe ser 8-14°C. Con ${deltaT}°C el evaporador no está transfiriendo bien. Revisá filtro, evaporador sucio, o velocidad del ventilador interior.`);
      } else if (deltaT !== null && deltaT > 16) {
        obs.push(`🌡️ <strong>Delta T de ${deltaT}°C — alto:</strong> el evaporador está absorbiendo mucho calor. Si el caudal de aire es normal, puede ser carga de gas en el límite superior o válvula de expansión que no regula bien.`);
      }
    }

    if (modulo === "nofrost") {
      if (datos.chkEvapCongelado && datos.chkVentDetenido) {
        obs.push("🧊 <strong>Evaporador congelado + ventilador detenido:</strong> el ventilador puede estar parado POR el hielo, no por falla del motor. Hacé el deshielo manual completo primero. Si después de descongelar el ventilador arranca solo, el motor está bien.");
      }
      if (datos.chkResistencia && datos.chkBimetal) {
        obs.push("⚡ <strong>Resistencia y bimetal ambos sospechosos:</strong> están en serie en el circuito de deshielo. Medí la resistencia primero (óhmetro, debe ser 20-60Ω). Si tiene continuidad, el problema es el bimetal o el timer de deshielo.");
      }
    }

    if (modulo === "ciclica") {
      if (datos.chkBurleteRoto && Number(datos.tempHeladera) > 10) {
        obs.push("🚪 <strong>Burlete roto con temperatura alta:</strong> incluso una apertura pequeña de 2-3mm en el burlete hace trabajar el compresor casi continuamente. Revisá todo el perímetro con una linterna y un papel — el papel no debe moverse con la puerta cerrada.");
      }
    }

    if (modulo === "comercial") {
      if (Number(datos.tempAmbiente) > 35) {
        obs.push(`🌡️ <strong>Temperatura ambiente de ${datos.tempAmbiente}°C:</strong> por encima de 35°C el rendimiento de refrigeración comercial cae significativamente. Verificá que el condensador tenga ventilación libre y evaluá si el equipo está dimensionado para esa temperatura ambiente.`);
      }
    }

    return obs;
  },

  // ═══════════════════════════════════════════════
  // RENDER DEL BLOQUE COMPLETO
  // ═══════════════════════════════════════════════

  renderBloque(modulo, titulo, certeza, datos) {
    const f   = this.getFrase(modulo, titulo);
    const obs = this.getObservacionesCruzadas(modulo, datos || {});

    // Sin frase y sin observaciones → no mostrar
    if (!f && !obs.length) return "";

    // Solo observaciones, sin frase específica
    if (!f && obs.length) {
      return `
<div class="mentor-dx-card">
  <div class="mentor-dx-header">
    <span class="mentor-dx-avatar">👨‍🔧</span>
    <div>
      <div class="mentor-dx-nombre">El Mentor</div>
      <div class="mentor-dx-subtitulo">30 años en el rubro</div>
    </div>
  </div>
  <div class="mentor-obs-bloque">
    <div class="mentor-obs-titulo">🔍 El Mentor observa:</div>
    ${obs.map(o => `<div class="mentor-obs-item">${o}</div>`).join("")}
  </div>
</div>`;
    }

    // Frase principal del maestro
    const fraseHTML = `
  <div class="mentor-frase">"${f.frase}"</div>`;

    // Por qué pasa esto
    const porQueHTML = f.por_que ? `
  <div class="mentor-seccion">
    <div class="mentor-seccion-titulo">🔬 Por qué pasa esto</div>
    <div class="mentor-seccion-body">${f.por_que}</div>
  </div>` : "";

    // Cómo proceder — guía para el novato
    const guiaHTML = f.guia_novato ? `
  <div class="mentor-seccion mentor-seccion-guia">
    <div class="mentor-seccion-titulo">📋 Cómo proceder</div>
    <div class="mentor-seccion-body">${f.guia_novato}</div>
  </div>` : "";

    // Cómo confirmar
    const señalesHTML = f.señales_confirmacion ? `
  <div class="mentor-seccion mentor-seccion-señales">
    <div class="mentor-seccion-titulo">✅ Cómo confirmar que lo resolviste</div>
    <div class="mentor-seccion-body">${f.señales_confirmacion}</div>
  </div>` : "";

    // Observaciones cruzadas (solo si aportan algo nuevo)
    const obsHTML = obs.length ? `
  <div class="mentor-obs-bloque">
    <div class="mentor-obs-titulo">🔍 El Mentor también observa:</div>
    ${obs.map(o => `<div class="mentor-obs-item">${o}</div>`).join("")}
  </div>` : "";

    // Footer: error común + regla de oro
    const errorTxt  = f.error_comun && f.error_comun !== "undefined" && f.error_comun !== null ? f.error_comun : null;
    const consejoTxt = f.consejo_rapido && f.consejo_rapido !== "undefined" && f.consejo_rapido !== null ? f.consejo_rapido : null;

    const footerHTML = (errorTxt || consejoTxt) ? `
  <div class="mentor-footer">
    ${consejoTxt ? `<div class="mentor-footer-item mentor-consejo">
      <span class="mentor-footer-label">💡 Regla de oro:</span>
      <span class="mentor-footer-txt">${consejoTxt}</span>
    </div>` : ""}
    ${errorTxt ? `<div class="mentor-footer-item mentor-error">
      <span class="mentor-footer-label">⚠️ Error frecuente:</span>
      <span class="mentor-footer-txt">${errorTxt}</span>
    </div>` : ""}
  </div>` : "";

    return `
<div class="mentor-dx-card">
  <div class="mentor-dx-header">
    <span class="mentor-dx-avatar">👨‍🔧</span>
    <div>
      <div class="mentor-dx-nombre">El Mentor</div>
      <div class="mentor-dx-subtitulo">30 años en el rubro</div>
    </div>
  </div>

  ${fraseHTML}
  ${porQueHTML}
  ${guiaHTML}
  ${señalesHTML}
  ${obsHTML}
  ${footerHTML}
</div>`;
  },

  // ═══════════════════════════════════════════════
  // INYECTAR EN RESULTADO DEL DOM
  // ═══════════════════════════════════════════════

  inyectarEnResultado(modulo, titulo, certeza, datos) {
    const resultEl = document.getElementById("dxResult");
    if (!resultEl) return;

    // Remover mentor previo
    resultEl.querySelector(".mentor-dx-card")?.remove();

    const bloque = this.renderBloque(modulo, titulo, certeza, datos);
    if (!bloque) return;

    const card = resultEl.querySelector(".dx-result-card");
    if (card) card.insertAdjacentHTML("beforeend", bloque);
  }

};
