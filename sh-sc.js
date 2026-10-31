// =====================================================
// HVAC PRO ARGENTINA
// SH-SC.JS — Motor de Sobrecalentamiento y Subenfriamiento
// =====================================================

const SHSCEngine = {

  // Tabla de saturación cargada desde funciones-tecnicas.json
  tablas: null,

  // Rangos normales por tipo de sistema
  // Se pueden sobrescribir con rangos dinámicos desde funciones-tecnicas.json
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
  // CARGAR RANGOS DINÁMICOS
  // ═══════════════════════════════════════════════

  cargarRangosDinamicos(gas = 'r410a', tipoEquipo = 'split') {
    // Guardar una copia de los rangos base y restaurarla en cada llamada,
    // para que los rangos de un gas no queden "pegados" al calcular otro.
    if (!this._rangosBase) this._rangosBase = JSON.parse(JSON.stringify(this.rangos));
    if (this._rangosBase[tipoEquipo]) {
      this.rangos[tipoEquipo] = JSON.parse(JSON.stringify(this._rangosBase[tipoEquipo]));
    }

    if (!window.FuncionesTecnicasJSON || !window.FuncionesTecnicasJSON.rangos_shsc) {
      return; // Usar rangos por defecto
    }

    const gasBuscador = String(gas).toLowerCase().replace(/[^a-z0-9]/g, '');
    const rangoGas = window.FuncionesTecnicasJSON.rangos_shsc[gasBuscador];

    if (rangoGas && rangoGas[tipoEquipo]) {
      const nr = rangoGas[tipoEquipo];
      this.rangos[tipoEquipo] = {
        sh: { min: nr.sh.min, max: nr.sh.max, optimo: nr.sh.ideal },
        sc: { min: nr.sc.min, max: nr.sc.max, optimo: nr.sc.ideal }
      };
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

  // Tablas: usa las ya cargadas por init() o, si todavía no, las que app.js
  // dejó en window.FuncionesTecnicasJSON (así nunca queda en null).
  _getTablas() {
    if (!this.tablas && window.FuncionesTecnicasJSON && window.FuncionesTecnicasJSON.saturacion) {
      this.tablas = window.FuncionesTecnicasJSON.saturacion;
    }
    return this.tablas;
  },

  psiToTsat(psi, gas) {
    const tablas = this._getTablas();
    if (!tablas || gas === undefined || gas === null) return null;
    const tabla = tablas[String(gas).toLowerCase().replace(/[^a-z0-9]/g, "")];
    if (!tabla || !tabla.length) return null;

    const psiNum = Number(psi);
    if (psi === "" || psi === null || isNaN(psiNum)) return null;

    // Fuera del rango de la tabla (-40 a 60 °C) no se inventa un valor
    if (psiNum < tabla[0][1] - 0.5 || psiNum > tabla[tabla.length - 1][1] + 0.5) return null;

    for (let i = 0; i < tabla.length - 1; i++) {
      const [t1, p1] = tabla[i];
      const [t2, p2] = tabla[i + 1];
      if (psiNum >= p1 && psiNum <= p2) {
        return t1 + ((psiNum - p1) / (p2 - p1)) * (t2 - t1);
      }
    }
    return psiNum <= tabla[0][1] ? tabla[0][0] : tabla[tabla.length - 1][0];
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
  // API USADA POR LAS PANTALLAS
  // (adaptadores sobre el MISMO cálculo: calcSH / calcSC / diagSH / diagSC)
  // ═══════════════════════════════════════════════

  psiATemp(gas, psi) { return this.psiToTsat(psi, gas); },

  // Devuelven {sh|sc, tsat, tempSaturacion} (tempSaturacion = nombre que lee la pantalla)
  calcularSH(gas, psiBaja, tempSuccion) {
    const r = this.calcSH(psiBaja, tempSuccion, gas);
    return r && Object.assign({}, r, { tempSaturacion: r.tsat });
  },
  calcularSC(gas, psiAlta, tempLiquido) {
    const r = this.calcSC(psiAlta, tempLiquido, gas);
    return r && Object.assign({}, r, { tempSaturacion: r.tsat });
  },

  _mentorSH: {
    "CRÍTICO": "Esto es lo más grave que podés ver en un compresor. Líquido en la succión = golpe hidráulico = compresor muerto. Apagalo ya.",
    "BAJO": "SH bajo con gas normal → la válvula de expansión está abriendo de más. SH bajo con gas cargado recientemente → cargaste de más.",
    "NORMAL": "SH en rango. El evaporador absorbe calor como debe. Chequeá el SC también para tener el cuadro completo.",
    "ALTO": "SH alto casi siempre es gas insuficiente. Antes de cargar: buscá la fuga. Si no hay fuga, el sistema perdió gas por algún lado.",
    "MUY ALTO": "SH muy alto: el compresor está recalentándose. La temperatura de descarga va a estar por las nubes. Atendé esto urgente."
  },
  _mentorSC: {
    "CRÍTICO": "SC negativo es vapor en la línea de líquido. Eso significa que al capilar llega mezcla en vez de líquido puro — la expansión va a ser errática y el equipo no va a enfriar bien.",
    "BAJO": "SC bajo: el condensador no está terminando de condensar el gas. Revisá si está sucio o si hay muy poco gas.",
    "NORMAL": "SC en rango. El condensador hace bien su trabajo. Junto con el SH normal, el sistema está cargado correctamente.",
    "ALTO": "SC alto: el condensador enfría de más el líquido. Puede ser gas de más o temperatura ambiente muy baja. No purgues sin confirmar.",
    "MUY ALTO": "SC muy alto: antes de pensar en exceso de gas, verificá el filtro deshidratador. Un filtro tapado acumula líquido en el condensador y sube el SC."
  },

  _paraPantalla(d, tabla) {
    return Object.assign({}, d, {
      desc:   d.descripcion || d.titulo || "",
      mentor: d.mentor || tabla[d.estado] || ""
    });
  },

  diagnosticarSH(sh, tipo = "split", gas = "r410a") {
    return this._paraPantalla(this.diagSH(sh, tipo, gas), this._mentorSH);
  },

  diagnosticarSC(sc, tipo = "split", gas = "r410a") {
    return this._paraPantalla(this.diagSC(sc, tipo, gas), this._mentorSC);
  },

  analizarCombinado(sh, sc, tipo = "split", gas = "r410a") {
    const dxSH = this.diagnosticarSH(sh, tipo, gas);
    const dxSC = this.diagnosticarSC(sc, tipo, gas);   // ya cargó los rangos del gas/tipo
    const r    = this.rangos[tipo] || this.rangos.split;
    const rSH  = r.sh, rSC = r.sc;

    const shOk = sh >= rSH.min && sh <= rSH.max;
    const scOk = sc >= rSC.min && sc <= rSC.max;

    let conclusion, certeza;
    if (shOk && scOk) {
      conclusion = "✅ Sistema cargado correctamente. SH y SC en rango. El diagnóstico de carga de gas es normal.";
      certeza = 95;
    } else if (sh > rSH.max && sc < rSC.min) {
      conclusion = "⚠️ SH alto + SC bajo = gas insuficiente. Hay fuga o el sistema perdió gas. Buscar fuga antes de cargar.";
      certeza = 92;
    } else if (sh < rSH.min && sc > rSC.max) {
      conclusion = "⚠️ SH bajo + SC alto = exceso de gas o válvula de expansión cerrada de más. Verificar antes de purgar.";
      certeza = 88;
    } else if (sh < rSH.min && scOk) {
      conclusion = "🟠 SH bajo con SC normal: válvula de expansión abriendo de más. Sistema con gas correcto pero expansión mal regulada.";
      certeza = 82;
    } else if (sh > rSH.max && scOk) {
      conclusion = "🟠 SH alto con SC normal: posible restricción en la línea de succión o evaporador con airflow reducido.";
      certeza = 80;
    } else if (shOk && sc < rSC.min) {
      conclusion = "🟠 SC bajo con SH normal: condensador con problemas de disipación. Limpiar condensador y verificar ventilación.";
      certeza = 82;
    } else if (shOk && sc > rSC.max) {
      conclusion = "🟠 SC alto con SH normal: posible exceso leve de gas o temperatura ambiente baja. Monitorear.";
      certeza = 75;
    } else {
      conclusion = "Condición mixta — evaluá cada parámetro por separado y considerá el contexto del equipo.";
      certeza = 65;
    }
    return { dxSH, dxSC, conclusion, certeza };
  },

  // ═══════════════════════════════════════════════
  // DIAGNOSTICAR SH
  // ═══════════════════════════════════════════════

  diagSH(sh, tipo = "split", gas = "r410a") {
    this.cargarRangosDinamicos(gas, tipo);
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

  diagSC(sc, tipo = "split", gas = "r410a") {
    this.cargarRangosDinamicos(gas, tipo);
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
      if (shResult) shDiag = this.diagSH(shResult.sh, "split", d.gas);
    }

    if (tieneSC) {
      scResult = this.calcSC(d.psiAlta, d.tempLiquido, d.gas);
      if (scResult) scDiag = this.diagSC(scResult.sc, "split", d.gas);
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

window.SHSCEngine = SHSCEngine;
