// =====================================================
// HVAC PRO ARGENTINA
// SH-SC-ENGINE.JS — Motor de Sobrecalentamiento y Subenfriamiento
// =====================================================

const SHSCEngine = {

  // ═══════════════════════════════════════════════
  // TABLAS PSI → TEMPERATURA DE SATURACIÓN
  // Interpolación lineal para calcular SH y SC
  // Fuente: tablas termodinámicas estándar
  // ═══════════════════════════════════════════════

  tablas: {
    R410A: [
      { psi:  74, temp: -20 }, { psi:  89, temp: -15 }, { psi: 105, temp: -10 },
      { psi: 124, temp:  -5 }, { psi: 144, temp:   0 }, { psi: 166, temp:   5 },
      { psi: 191, temp:  10 }, { psi: 218, temp:  15 }, { psi: 248, temp:  20 },
      { psi: 281, temp:  25 }, { psi: 317, temp:  30 }, { psi: 398, temp:  40 },
      { psi: 493, temp:  50 }, { psi: 604, temp:  60 }
    ],
    R32: [
      { psi:  64, temp: -20 }, { psi:  78, temp: -15 }, { psi:  94, temp: -10 },
      { psi: 112, temp:  -5 }, { psi: 133, temp:   0 }, { psi: 156, temp:   5 },
      { psi: 182, temp:  10 }, { psi: 210, temp:  15 }, { psi: 242, temp:  20 },
      { psi: 277, temp:  25 }, { psi: 315, temp:  30 }, { psi: 400, temp:  40 },
      { psi: 499, temp:  50 }, { psi: 615, temp:  60 }
    ],
    R22: [
      { psi:  21, temp: -20 }, { psi:  27, temp: -15 }, { psi:  34, temp: -10 },
      { psi:  41, temp:  -5 }, { psi:  50, temp:   0 }, { psi:  60, temp:   5 },
      { psi:  71, temp:  10 }, { psi:  84, temp:  15 }, { psi:  98, temp:  20 },
      { psi: 114, temp:  25 }, { psi: 131, temp:  30 }, { psi: 169, temp:  40 },
      { psi: 213, temp:  50 }, { psi: 265, temp:  60 }
    ],
    R134a: [
      { psi: -1,  temp: -20 }, { psi:  2,  temp: -15 }, { psi:  5,  temp: -10 },
      { psi:  9,  temp:  -5 }, { psi: 14,  temp:   0 }, { psi: 19,  temp:   5 },
      { psi: 26,  temp:  10 }, { psi: 34,  temp:  15 }, { psi: 43,  temp:  20 },
      { psi: 53,  temp:  25 }, { psi: 65,  temp:  30 }, { psi: 93,  temp:  40 },
      { psi: 128, temp:  50 }, { psi: 170, temp:  60 }
    ],
    R404A: [
      { psi:  22, temp: -40 }, { psi:  42, temp: -30 }, { psi:  69, temp: -20 },
      { psi: 103, temp: -10 }, { psi: 146, temp:   0 }, { psi: 199, temp:  10 },
      { psi: 262, temp:  20 }, { psi: 337, temp:  30 }, { psi: 425, temp:  40 },
      { psi: 527, temp:  50 }
    ]
  },

  // Rangos normales por tipo de equipo
  rangos: {
    SH: {
      split:     { min: 6,  max: 12, ideal: 8  },
      heladera:  { min: 5,  max: 15, ideal: 10 },
      comercial: { min: 4,  max: 12, ideal: 8  }
    },
    SC: {
      split:     { min: 4,  max: 10, ideal: 6  },
      heladera:  { min: 3,  max: 10, ideal: 6  },
      comercial: { min: 3,  max: 12, ideal: 7  }
    }
  },

  // ═══════════════════════════════════════════════
  // INTERPOLACIÓN PSI → TEMP SATURACIÓN
  // ═══════════════════════════════════════════════

  psiATemp(gas, psi) {
    const tabla = this.tablas[gas];
    if (!tabla) return null;

    // Fuera de rango
    if (psi <= tabla[0].psi) return tabla[0].temp;
    if (psi >= tabla[tabla.length-1].psi) return tabla[tabla.length-1].temp;

    // Interpolación lineal entre los dos puntos más cercanos
    for (let i = 0; i < tabla.length - 1; i++) {
      const p1 = tabla[i], p2 = tabla[i+1];
      if (psi >= p1.psi && psi <= p2.psi) {
        const fraccion = (psi - p1.psi) / (p2.psi - p1.psi);
        return p1.temp + fraccion * (p2.temp - p1.temp);
      }
    }
    return null;
  },

  // ═══════════════════════════════════════════════
  // CALCULAR SH
  // SH = Temp succión medida − Temp saturación a PSI de baja
  // ═══════════════════════════════════════════════

  calcularSH(gas, psiBaja, tempSuccion) {
    const tempSat = this.psiATemp(gas, psiBaja);
    if (tempSat === null) return null;
    return {
      tempSaturacion: Math.round(tempSat * 10) / 10,
      sh: Math.round((tempSuccion - tempSat) * 10) / 10
    };
  },

  // ═══════════════════════════════════════════════
  // CALCULAR SC
  // SC = Temp saturación a PSI de alta − Temp línea de líquido medida
  // ═══════════════════════════════════════════════

  calcularSC(gas, psiAlta, tempLiquido) {
    const tempSat = this.psiATemp(gas, psiAlta);
    if (tempSat === null) return null;
    return {
      tempSaturacion: Math.round(tempSat * 10) / 10,
      sc: Math.round((tempSat - tempLiquido) * 10) / 10
    };
  },

  // ═══════════════════════════════════════════════
  // DIAGNÓSTICO SH
  // ═══════════════════════════════════════════════

  diagnosticarSH(sh, tipoEquipo = "split") {
    const rango = this.rangos.SH[tipoEquipo] || this.rangos.SH.split;

    if (sh < 2) return {
      estado: "CRÍTICO BAJO",
      color:  "#ff5252",
      icono:  "🔴",
      desc:   "Retorno de líquido al compresor. Riesgo inmediato de golpe de líquido.",
      accion: "Apagá el equipo. El líquido en el compresor puede destruirlo. Verificá fuga masiva o válvula de expansión abierta de más.",
      mentor: "Esto es lo más grave que podés ver en un compresor. Líquido en la succión = golpe hidráulico = compresor muerto. Apagalo ya."
    };
    if (sh < rango.min) return {
      estado: "BAJO",
      color:  "#ff9b42",
      icono:  "🟠",
      desc:   `SH de ${sh}°C — por debajo del mínimo de ${rango.min}°C. El evaporador está inundado de líquido.`,
      accion: "Reducir la carga de refrigerante o cerrar levemente la válvula de expansión. Verificar que no sea exceso de gas.",
      mentor: "SH bajo con gas normal → la válvula de expansión está abriendo de más. SH bajo con gas cargado recientemente → cargaste de más."
    };
    if (sh <= rango.max) return {
      estado: "NORMAL",
      color:  "#00d9ff",
      icono:  "✅",
      desc:   `SH de ${sh}°C — dentro del rango normal de ${rango.min}°C a ${rango.max}°C.`,
      accion: "El evaporador está trabajando correctamente. Continuá con el diagnóstico de otros parámetros.",
      mentor: "SH en rango. El evaporador absorbe calor como debe. Chequeá el SC también para tener el cuadro completo."
    };
    if (sh <= 20) return {
      estado: "ALTO",
      color:  "#ff9b42",
      icono:  "🟠",
      desc:   `SH de ${sh}°C — por encima del máximo de ${rango.max}°C. El gas llega muy seco al compresor.`,
      accion: "Verificar falta de gas (fuga), restricción en la línea o válvula de expansión muy cerrada.",
      mentor: "SH alto casi siempre es gas insuficiente. Antes de cargar: buscá la fuga. Si no hay fuga, el sistema perdió gas por algún lado."
    };
    return {
      estado: "MUY ALTO",
      color:  "#ff5252",
      icono:  "🔴",
      desc:   `SH de ${sh}°C — excesivamente alto. El gas llega al compresor muy recalentado.`,
      accion: "Fuga severa o restricción crítica. El compresor está trabajando en condiciones extremas de temperatura.",
      mentor: "SH mayor a 20°C: el compresor está recalentándose. La temperatura de descarga va a estar por las nubes. Atendé esto urgente."
    };
  },

  // ═══════════════════════════════════════════════
  // DIAGNÓSTICO SC
  // ═══════════════════════════════════════════════

  diagnosticarSC(sc, tipoEquipo = "split") {
    const rango = this.rangos.SC[tipoEquipo] || this.rangos.SC.split;

    if (sc < 0) return {
      estado: "NEGATIVO — VAPOR EN LÍNEA",
      color:  "#ff5252",
      icono:  "🔴",
      desc:   `SC negativo (${sc}°C) — hay vapor en la línea de líquido. El líquido no terminó de condensarse.`,
      accion: "No hay suficiente líquido llegando a la expansión. Verificar gas insuficiente o condensador no enfría bien.",
      mentor: "SC negativo es vapor en la línea de líquido. Eso significa que al capilar llega mezcla en vez de líquido puro — la expansión va a ser errática y el equipo no va a enfriar bien."
    };
    if (sc < rango.min) return {
      estado: "BAJO",
      color:  "#ff9b42",
      icono:  "🟠",
      desc:   `SC de ${sc}°C — por debajo del mínimo de ${rango.min}°C.`,
      accion: "Posible gas insuficiente o condensador con problemas de disipación. Verificar carga de gas y condensador limpio.",
      mentor: "SC bajo: el condensador no está terminando de condensar el gas. Revisá si está sucio o si hay muy poco gas."
    };
    if (sc <= rango.max) return {
      estado: "NORMAL",
      color:  "#00d9ff",
      icono:  "✅",
      desc:   `SC de ${sc}°C — dentro del rango normal de ${rango.min}°C a ${rango.max}°C.`,
      accion: "El condensador está trabajando bien. El líquido llega en buen estado al dispositivo de expansión.",
      mentor: "SC en rango. El condensador hace bien su trabajo. Junto con el SH normal, el sistema está cargado correctamente."
    };
    if (sc <= 15) return {
      estado: "ALTO",
      color:  "#ff9b42",
      icono:  "🟠",
      desc:   `SC de ${sc}°C — por encima del máximo de ${rango.max}°C.`,
      accion: "Posible exceso de gas o condensador con temperatura ambiente muy baja. Verificar antes de purgar.",
      mentor: "SC alto: el condensador enfría de más el líquido. Puede ser gas de más o temperatura ambiente muy baja. No purgues sin confirmar."
    };
    return {
      estado: "MUY ALTO",
      color:  "#ff5252",
      icono:  "🔴",
      desc:   `SC de ${sc}°C — excesivamente alto. Posible obstrucción después del condensador.`,
      accion: "Verificar restricción en la línea de líquido (filtro deshidratador tapado). SC tan alto no es solo exceso de gas.",
      mentor: "SC mayor a 15°C: antes de pensar en exceso de gas, verificá el filtro deshidratador. Un filtro tapado acumula líquido en el condensador y sube el SC."
    };
  },

  // ═══════════════════════════════════════════════
  // ANÁLISIS COMBINADO SH + SC
  // ═══════════════════════════════════════════════

  analizarCombinado(sh, sc, tipoEquipo = "split") {
    const dxSH = this.diagnosticarSH(sh, tipoEquipo);
    const dxSC = this.diagnosticarSC(sc, tipoEquipo);
    const rSH  = this.rangos.SH[tipoEquipo];
    const rSC  = this.rangos.SC[tipoEquipo];

    const shOk = sh >= rSH.min && sh <= rSH.max;
    const scOk = sc >= rSC.min && sc <= rSC.max;

    let conclusion = "";
    let certeza    = 0;

    if (shOk && scOk) {
      conclusion = "✅ Sistema cargado correctamente. SH y SC en rango. El diagnóstico de carga de gas es normal.";
      certeza    = 95;
    } else if (!shOk && sh > rSH.max && !scOk && sc < rSC.min) {
      conclusion = "⚠️ SH alto + SC bajo = gas insuficiente. Hay fuga o el sistema perdió gas. Buscar fuga antes de cargar.";
      certeza    = 92;
    } else if (!shOk && sh < rSH.min && !scOk && sc > rSC.max) {
      conclusion = "⚠️ SH bajo + SC alto = exceso de gas o válvula de expansión cerrada de más. Verificar antes de purgar.";
      certeza    = 88;
    } else if (!shOk && sh < rSH.min && scOk) {
      conclusion = "🟠 SH bajo con SC normal: válvula de expansión abriendo de más. Sistema con gas correcto pero expansión mal regulada.";
      certeza    = 82;
    } else if (!shOk && sh > rSH.max && scOk) {
      conclusion = "🟠 SH alto con SC normal: posible restricción en la línea de succión o evaporador con airflow reducido.";
      certeza    = 80;
    } else if (shOk && !scOk && sc < rSC.min) {
      conclusion = "🟠 SC bajo con SH normal: condensador con problemas de disipación. Limpiar condensador y verificar ventilación.";
      certeza    = 82;
    } else if (shOk && !scOk && sc > rSC.max) {
      conclusion = "🟠 SC alto con SH normal: posible exceso leve de gas o temperatura ambiente baja. Monitorear.";
      certeza    = 75;
    } else {
      conclusion = "Condición mixta — evaluá cada parámetro por separado y considerá el contexto del equipo.";
      certeza    = 65;
    }

    return { dxSH, dxSC, conclusion, certeza };
  }
};
