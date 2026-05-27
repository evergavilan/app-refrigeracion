// =====================================================
// HVAC PRO ARGENTINA
// SH-SC.JS — Motor de Sobrecalentamiento y Subenfriamiento
// =====================================================

const SHSCEngine = {

  // Tabla de saturación cargada desde funciones-tecnicas.json
  tablas: null,

  // Rangos normales por tipo de sistema
  rangos: {
    split: {
      sh: { min: 5,  max: 12, optimo: 8 },
      sc: { min: 4,  max: 8,  optimo: 6 }
    },
    heladera: {
      sh: { min: 8,  max: 15, optimo: 10 },
      sc: { min: 2,  max: 6,  optimo: 4  }
    },
    comercial: {
      sh: { min: 8,  max: 20, optimo: 12 },
      sc: { min: 3,  max: 8,  optimo: 5  }
    }
  },

  // ═══════════════════════════════════════════════
  // CARGAR TABLAS
  // ═══════════════════════════════════════════════

  async init() {
    if (this.tablas) return;
    try {
      const res  = await fetch("./funciones-tecnicas.json");
      const data = await res.json();
      this.tablas = data.saturacion;
    } catch(e) {
      console.warn("SHSCEngine: no se pudo cargar tablas de saturación", e);
    }
  },

  // ═══════════════════════════════════════════════
  // INTERPOLACIÓN LINEAL
  // Dado PSI, retorna temperatura de saturación (°C)
  // ═══════════════════════════════════════════════

  psiToTsat(psi, gas) {
    if (!this.tablas) return null;
    const tabla = this.tablas[gas.toLowerCase().replace(/[^a-z0-9]/g, "")];
    if (!tabla || !tabla.length) return null;

    const psiNum = Number(psi);
    if (isNaN(psiNum)) return null;

    // La tabla es [temp, psi] — ordenada por temperatura
    // Buscamos el par donde el PSI ingresado cae entre dos puntos
    for (let i = 0; i < tabla.length - 1; i++) {
      const [t1, p1] = tabla[i];
      const [t2, p2] = tabla[i + 1];
      if (psiNum >= p1 && psiNum <= p2) {
        // Interpolación lineal
        const frac = (psiNum - p1) / (p2 - p1);
        return t1 + frac * (t2 - t1);
      }
    }

    // Fuera de rango — extrapolar si está cerca
    if (psiNum < tabla[0][1])  return tabla[0][0];
    if (psiNum > tabla[tabla.length-1][1]) return tabla[tabla.length-1][0];
    return null;
  },

  // ═══════════════════════════════════════════════
  // CALCULAR SOBRECALENTAMIENTO (SH)
  // SH = Temp real en línea de succión - Temp saturación a PSI de baja
  // ═══════════════════════════════════════════════

  calcSH(psiBaja, tempSuccion, gas) {
    const tsat = this.psiToTsat(psiBaja, gas);
    if (tsat === null) return null;
    const sh = Number(tempSuccion) - tsat;
    return { sh: Math.round(sh * 10) / 10, tsat: Math.round(tsat * 10) / 10 };
  },

  // ═══════════════════════════════════════════════
  // CALCULAR SUBENFRIAMIENTO (SC)
  // SC = Temp saturación a PSI de alta - Temp real en línea de líquido
  // ═══════════════════════════════════════════════

  calcSC(psiAlta, tempLiquido, gas) {
    const tsat = this.psiToTsat(psiAlta, gas);
    if (tsat === null) return null;
    const sc = tsat - Number(tempLiquido);
    return { sc: Math.round(sc * 10) / 10, tsat: Math.round(tsat * 10) / 10 };
  },

  // ═══════════════════════════════════════════════
  // DIAGNOSTICAR SH
  // ═══════════════════════════════════════════════

  diagSH(sh, tipo = "split") {
    const r = this.rangos[tipo]?.sh || this.rangos.split.sh;

    if (sh < 0) return {
      estado: "CRÍTICO",
      color:  "#ff5252",
      icono:  "🔴",
      titulo: "Retorno de líquido",
      descripcion: `SH negativo (${sh}°C) — hay líquido llegando al compresor. Riesgo de golpe de líquido y daño al compresor. Acción inmediata.`,
      accion: "Cerrá el equipo. Verificá carga de gas (exceso) y estado del evaporador. Si hay retorno congelado, deshielá primero."
    };

    if (sh < r.min) return {
      estado: "BAJO",
      color:  "#ff9b42",
      icono:  "🟠",
      titulo: `SH bajo (${sh}°C)`,
      descripcion: `Sobrecalentamiento por debajo del mínimo (${r.min}°C). El evaporador está inundado — hay demasiado refrigerante o muy poco calor para evaporar.`,
      accion: "Verificar exceso de gas, expansión bloqueada o evaporador con airflow insuficiente. Si hay retorno de líquido → reducir carga."
    };

    if (sh <= r.max) return {
      estado: "NORMAL",
      color:  "#00d9ff",
      icono:  "✅",
      titulo: `SH normal (${sh}°C)`,
      descripcion: `Sobrecalentamiento en rango correcto (${r.min}-${r.max}°C). El evaporador está trabajando bien.`,
      accion: "Sin acción necesaria. Registrá el valor como baseline."
    };

    if (sh <= r.max + 5) return {
      estado: "ALTO",
      color:  "#ff9b42",
      icono:  "🟠",
      titulo: `SH alto (${sh}°C)`,
      descripcion: `Sobrecalentamiento sobre el rango (${r.max}°C). El evaporador no está completamente inundado — falta refrigerante o hay restricción.`,
      accion: "Verificar nivel de gas, posible fuga lenta o restricción en el capilar/TXV."
    };

    return {
      estado: "MUY ALTO",
      color:  "#ff5252",
      icono:  "🔴",
      titulo: `SH muy alto (${sh}°C)`,
      descripcion: `Sobrecalentamiento excesivo (${sh}°C). El evaporador está muy poco inundado. Falta gas importante o restricción severa.`,
      accion: "Buscar fuga antes de cargar gas. Si no hay fuga, verificar capilar o filtro deshidratador tapado."
    };
  },

  // ═══════════════════════════════════════════════
  // DIAGNOSTICAR SC
  // ═══════════════════════════════════════════════

  diagSC(sc, tipo = "split") {
    const r = this.rangos[tipo]?.sc || this.rangos.split.sc;

    if (sc < 0) return {
      estado: "CRÍTICO",
      color:  "#ff5252",
      icono:  "🔴",
      titulo: "Vapor en línea de líquido",
      descripcion: `SC negativo (${sc}°C) — hay vapor en la línea de líquido. El refrigerante llega parcialmente evaporado a la expansión, lo que deteriora mucho el rendimiento.`,
      accion: "Gas insuficiente o condensador sobrecargado. Verificar nivel de gas y limpiar condensador."
    };

    if (sc < r.min) return {
      estado: "BAJO",
      color:  "#ff9b42",
      icono:  "🟠",
      titulo: `SC bajo (${sc}°C)`,
      descripcion: `Subenfriamiento por debajo del mínimo (${r.min}°C). El condensador no está completando la condensación o hay poco gas.`,
      accion: "Verificar nivel de gas y estado del condensador. Posible gas insuficiente o condensador sucio."
    };

    if (sc <= r.max) return {
      estado: "NORMAL",
      color:  "#00d9ff",
      icono:  "✅",
      titulo: `SC normal (${sc}°C)`,
      descripcion: `Subenfriamiento en rango correcto (${r.min}-${r.max}°C). El condensador está trabajando bien.`,
      accion: "Sin acción necesaria. Registrá el valor como baseline."
    };

    if (sc <= r.max + 5) return {
      estado: "ALTO",
      color:  "#ff9b42",
      icono:  "🟠",
      titulo: `SC alto (${sc}°C)`,
      descripcion: `Subenfriamiento sobre el rango (${r.max}°C). Puede ser exceso de gas o válvula de expansión con restricción.`,
      accion: "Verificar si se cargó gas recientemente. Si el condensador está limpio y el SC sigue alto → posible exceso de gas."
    };

    return {
      estado: "MUY ALTO",
      color:  "#ff5252",
      icono:  "🔴",
      titulo: `SC muy alto (${sc}°C)`,
      descripcion: `Subenfriamiento excesivo (${sc}°C). Exceso de gas o válvula de expansión muy restringida.`,
      accion: "Si fue cargado recientemente → purgar gas de a poco. Si no → revisar válvula de expansión (TXV)."
    };
  },

  // ═══════════════════════════════════════════════
  // RENDER — Bloque SH/SC para insertar en resultado
  // ═══════════════════════════════════════════════

  renderBloqueSHSC(shResult, scResult, shDiag, scDiag) {
    if (!shDiag && !scDiag) return "";

    const bloques = [];

    if (shDiag) {
      bloques.push(`
<div class="shsc-item" style="border-left-color:${shDiag.color};">
  <div class="shsc-item-header">
    <span class="shsc-icono">${shDiag.icono}</span>
    <div>
      <div class="shsc-titulo">SH — Sobrecalentamiento</div>
      <div class="shsc-valor" style="color:${shDiag.color};">${shDiag.titulo}</div>
    </div>
    <div class="shsc-badge" style="background:${shDiag.color}20;color:${shDiag.color};border-color:${shDiag.color}40;">${shDiag.estado}</div>
  </div>
  <div class="shsc-tsat">T° saturación baja: ${shResult.tsat}°C</div>
  <div class="shsc-desc">${shDiag.descripcion}</div>
  <div class="shsc-accion"><span class="shsc-accion-label">→</span> ${shDiag.accion}</div>
</div>`);
    }

    if (scDiag) {
      bloques.push(`
<div class="shsc-item" style="border-left-color:${scDiag.color};">
  <div class="shsc-item-header">
    <span class="shsc-icono">${scDiag.icono}</span>
    <div>
      <div class="shsc-titulo">SC — Subenfriamiento</div>
      <div class="shsc-valor" style="color:${scDiag.color};">${scDiag.titulo}</div>
    </div>
    <div class="shsc-badge" style="background:${scDiag.color}20;color:${scDiag.color};border-color:${scDiag.color}40;">${scDiag.estado}</div>
  </div>
  <div class="shsc-tsat">T° saturación alta: ${scResult.tsat}°C</div>
  <div class="shsc-desc">${scDiag.descripcion}</div>
  <div class="shsc-accion"><span class="shsc-accion-label">→</span> ${scDiag.accion}</div>
</div>`);
    }

    return `
<div class="shsc-card">
  <div class="shsc-card-titulo">🌡️ Análisis SH / SC</div>
  ${bloques.join("")}
</div>`;
  },

  // ═══════════════════════════════════════════════
  // INYECTAR en resultado del DOM
  // ═══════════════════════════════════════════════

  async inyectarEnResultado(d) {
    await this.init();

    const tieneSH = d.psi && d.tempSuccion;
    const tieneSC = d.psiAlta && d.tempLiquido;
    if (!tieneSH && !tieneSC) return;

    let shResult = null, scResult = null, shDiag = null, scDiag = null;

    if (tieneSH) {
      shResult = this.calcSH(d.psi, d.tempSuccion, d.gas);
      if (shResult) shDiag = this.diagSH(shResult.sh, "split");
    }

    if (tieneSC) {
      scResult = this.calcSC(d.psiAlta, d.tempLiquido, d.gas);
      if (scResult) scDiag = this.diagSC(scResult.sc, "split");
    }

    const bloque = this.renderBloqueSHSC(shResult, scResult, shDiag, scDiag);
    if (!bloque) return;

    const resultEl = document.getElementById("dxResult");
    if (!resultEl) return;

    resultEl.querySelector(".shsc-card")?.remove();

    // Insertar después del dx-datos-grid y antes del dx-alerta o dx-pasos-titulo
    const dxCard  = resultEl.querySelector(".dx-result-card");
    if (!dxCard) return;

    const insertBefore = dxCard.querySelector(".dx-alerta") ||
                         dxCard.querySelector(".dx-pasos-titulo");

    if (insertBefore) {
      insertBefore.insertAdjacentHTML("beforebegin", bloque);
    } else {
      dxCard.insertAdjacentHTML("afterbegin", bloque);
    }
  }

};
