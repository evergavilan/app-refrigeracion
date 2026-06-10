// =====================================================
// HVAC PRO ARGENTINA
// VACIO-CARGA.JS — Calculadora de vacío y carga v1
// Procedimiento paso a paso con timers integrados
// =====================================================

const VacioCarga = {

  // Estado del procedimiento activo
  estado: {
    fase:       "config",   // config | vacio | nitrógeno | carga | verificacion
    tipoTrabajo: null,      // nuevo | recarga | reparacion
    gas:        null,
    frigorias:  null,
    pesoKg:     null,
    psiObjetivo: null,
    pasoActual: 0,
    checksPaso: {}
  },

  // Peso de carga por gas y frigorías (kg)
  cargas: {
    R410A: { 2250: 0.55, 3000: 0.70, 4500: 0.95, 5500: 1.10, 6000: 1.20, 7500: 1.40, 9000: 1.80 },
    R32:   { 2250: 0.40, 3000: 0.55, 4500: 0.75, 5500: 0.85, 6000: 0.95, 7500: 1.10, 9000: 1.40 },
    R22:   { 2250: 0.60, 3000: 0.80, 4500: 1.05, 5500: 1.20, 6000: 1.35, 7500: 1.55, 9000: 2.00 }
  },

  // PSI objetivo de baja por gas (temp trabajo ~25°C)
  psiObjetivo: {
    R410A: { min: 115, max: 140, label: "115-140 PSI" },
    R32:   { min: 120, max: 145, label: "120-145 PSI" },
    R22:   { min: 55,  max: 75,  label: "55-75 PSI"  }
  },

  render() {
    const app = document.getElementById("app");
    if (!app) return;
    this.estado = { fase: "config", pasoActual: 0, checksPaso: {} };

    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="vacioBack">←</div>
  <div>
    <h1 class="hvac-title">🔬 Vacío y Carga</h1>
    <p class="hvac-subtitle">Procedimiento paso a paso</p>
  </div>
</header>

<div id="vacioContent">
  ${this.renderConfig()}
</div>`;

    this.bindEvents();
  },

  // ═══════════════════════════════════════════════
  // PANTALLA 1 — CONFIGURACIÓN
  // ═══════════════════════════════════════════════
  renderConfig() {
    return `
<div class="vc-intro-card">
  <div class="vc-intro-ico">🔬</div>
  <div class="vc-intro-txt">
    <div class="vc-intro-title">Procedimiento profesional</div>
    <div class="vc-intro-sub">Vacío → verificación → carga → confirmación. Cada paso con su criterio de aceptación.</div>
  </div>
</div>

<div class="dx-etapa-label">DATOS DEL TRABAJO</div>
<div class="dx-card">

  <div class="dx-field">
    <label class="dx-label">Tipo de trabajo</label>
    <select class="hvac-select" id="vcTipoTrabajo">
      <option value="reparacion">🔧 Reparación con apertura del sistema</option>
      <option value="nuevo">🆕 Instalación nueva / equipo nuevo</option>
      <option value="recarga">⛽ Solo recarga (sin apertura)</option>
    </select>
  </div>

  <div class="dx-field">
    <label class="dx-label">Gas refrigerante</label>
    <select class="hvac-select" id="vcGas">
      <option value="R410A">R410A</option>
      <option value="R32">R32</option>
      <option value="R22">R22</option>
    </select>
  </div>

  <div class="dx-field">
    <label class="dx-label">Frigorías del equipo</label>
    <select class="hvac-select" id="vcFrigorias">
      <option value="2250">2250 FG (pequeño)</option>
      <option value="3000">3000 FG</option>
      <option value="4500" selected>4500 FG (estándar)</option>
      <option value="5500">5500 FG</option>
      <option value="6000">6000 FG</option>
      <option value="7500">7500 FG</option>
      <option value="9000">9000 FG (grande)</option>
    </select>
  </div>

  <div class="dx-field">
    <label class="dx-label">📏 Longitud de cañería (metros)</label>
    <input type="number" class="hvac-input" id="vcLongCañeria" placeholder="ej: 4" min="1" max="30" value="4"/>
    <span style="font-size:11px;color:#445566;margin-top:4px;display:block;">La longitud afecta el peso de carga necesario</span>
  </div>

</div>

<div class="dx-btn-row">
  <button class="hvac-btn btn-primary" id="vcIniciar" style="width:100%">
    🚀 Iniciar procedimiento
  </button>
</div>`;
  },

  // ═══════════════════════════════════════════════
  // PANTALLA 2 — PROCEDIMIENTO POR PASOS
  // ═══════════════════════════════════════════════
  renderProcedimiento() {
    const e     = this.estado;
    const carga = this.calcularCarga(e.gas, e.frigorias, e.longCañeria);
    const pasos = this.getPasos(e.tipoTrabajo, e.gas, carga);
    const paso  = pasos[e.pasoActual];
    const total = pasos.length;
    const prog  = Math.round(((e.pasoActual) / total) * 100);

    return `
<!-- Resumen del trabajo -->
<div class="vc-resumen-bar">
  <span class="vc-resumen-item">⚗️ <strong>${e.gas}</strong></span>
  <span class="vc-resumen-item">❄️ <strong>${e.frigorias} FG</strong></span>
  <span class="vc-resumen-item">⚖️ <strong>${carga.pesoFinal} kg</strong></span>
  <span class="vc-resumen-item">🎯 <strong>${this.psiObjetivo[e.gas]?.label || "—"}</strong></span>
</div>

<!-- Progreso -->
<div class="vc-progreso-wrap">
  <div class="vc-progreso-bar">
    <div class="vc-progreso-fill" style="width:${prog}%"></div>
  </div>
  <div class="vc-progreso-txt">Paso ${e.pasoActual + 1} de ${total}</div>
</div>

<!-- Paso actual -->
<div class="vc-paso-card vc-fase-${paso.fase}">

  <div class="vc-paso-header">
    <span class="vc-paso-ico">${paso.icono}</span>
    <div>
      <div class="vc-paso-fase">${this.labelFase(paso.fase)}</div>
      <div class="vc-paso-titulo">${paso.titulo}</div>
    </div>
  </div>

  <div class="vc-paso-desc">${paso.descripcion}</div>

  ${paso.advertencia ? `<div class="vc-advertencia">${paso.advertencia}</div>` : ""}

  ${paso.timer ? `
  <div class="vc-timer-bloque" id="vcTimerBloque">
    <div class="vc-timer-display" id="vcTimerDisplay">${this.formatTime(paso.timer)}</div>
    <div class="vc-timer-label">${paso.timerLabel || "Tiempo recomendado"}</div>
    <div class="vc-timer-btns">
      <button class="hvac-btn btn-primary" id="vcTimerStart" style="flex:1">▶ Iniciar timer</button>
      <button class="hvac-btn btn-secondary" id="vcTimerReset" style="width:52px">↺</button>
    </div>
  </div>` : ""}

  ${paso.checks?.length ? `
  <div class="vc-checks-bloque">
    <div class="vc-checks-titulo">✅ Confirmar antes de continuar:</div>
    ${paso.checks.map((c, i) => `
    <label class="vc-check-item">
      <input type="checkbox" class="vc-check-input" data-check="${i}" ${e.checksPaso[`${e.pasoActual}-${i}`] ? "checked" : ""}>
      <span class="vc-check-txt">${c}</span>
    </label>`).join("")}
  </div>` : ""}

  ${paso.valor ? `
  <div class="vc-valor-bloque">
    <div class="vc-valor-label">${paso.valor.label}</div>
    <div class="vc-valor-target">${paso.valor.target}</div>
    ${paso.valor.input ? `
    <input type="number" class="hvac-input" id="vcValorInput"
      placeholder="${paso.valor.placeholder || ""}"
      step="${paso.valor.step || "1"}"/>
    <div class="vc-valor-hint" id="vcValorHint"></div>` : ""}
  </div>` : ""}

</div>

<!-- Navegación -->
<div class="vc-nav-row">
  ${e.pasoActual > 0 ? `<button class="hvac-btn btn-secondary" id="vcAnterior">← Anterior</button>` : `<div></div>`}
  ${e.pasoActual < total - 1
    ? `<button class="hvac-btn btn-primary" id="vcSiguiente">Siguiente →</button>`
    : `<button class="hvac-btn btn-primary" id="vcFinalizar" style="background:#00cc66">✅ Finalizar trabajo</button>`
  }
</div>

<!-- Resumen de pasos (mapa visual) -->
<div class="vc-mapa-pasos">
  ${pasos.map((p, i) => `
  <div class="vc-mapa-item ${i < e.pasoActual ? "vc-mapa-ok" : i === e.pasoActual ? "vc-mapa-actual" : "vc-mapa-pending"}"
       title="${p.titulo}">
    <span>${p.icono}</span>
  </div>`).join("")}
</div>`;
  },

  // ═══════════════════════════════════════════════
  // PANTALLA FINAL — RESUMEN
  // ═══════════════════════════════════════════════
  renderFinalizado() {
    const e     = this.estado;
    const carga = this.calcularCarga(e.gas, e.frigorias, e.longCañeria);
    const psi   = this.psiObjetivo[e.gas];
    const ahora = new Date().toLocaleString("es-AR");

    return `
<div class="vc-final-card">
  <div class="vc-final-ico">✅</div>
  <div class="vc-final-titulo">Trabajo completado</div>
  <div class="vc-final-sub">${ahora}</div>
</div>

<div class="dx-etapa-label">RESUMEN DEL TRABAJO</div>
<div class="dx-card">
  <div class="vc-resumen-grid">
    <div class="vc-res-item"><span class="vc-res-label">Tipo</span><span class="vc-res-val">${this.labelTipoTrabajo(e.tipoTrabajo)}</span></div>
    <div class="vc-res-item"><span class="vc-res-label">Gas</span><span class="vc-res-val">${e.gas}</span></div>
    <div class="vc-res-item"><span class="vc-res-label">Frigorías</span><span class="vc-res-val">${e.frigorias} FG</span></div>
    <div class="vc-res-item"><span class="vc-res-label">Longitud</span><span class="vc-res-val">${e.longCañeria} m</span></div>
    <div class="vc-res-item"><span class="vc-res-label">Carga base</span><span class="vc-res-val">${carga.pesoBase} kg</span></div>
    <div class="vc-res-item"><span class="vc-res-label">Ajuste cañería</span><span class="vc-res-val">+${carga.ajusteCañeria} kg</span></div>
    <div class="vc-res-item vc-res-highlight"><span class="vc-res-label">Carga total</span><span class="vc-res-val">${carga.pesoFinal} kg</span></div>
    <div class="vc-res-item vc-res-highlight"><span class="vc-res-label">PSI objetivo</span><span class="vc-res-val">${psi?.label || "—"}</span></div>
  </div>
</div>

<div class="dx-etapa-label">VALORES DE VERIFICACIÓN</div>
<div class="dx-card" style="padding:14px 16px;">
  <div style="font-size:12.5px;color:#8899bb;line-height:1.7;">
    Después de 15 minutos en régimen verificar:<br>
    • PSI baja: <strong style="color:#00d9ff">${psi?.label || "—"}</strong><br>
    • Amperaje: dentro del rango para las frigorías<br>
    • SH: <strong style="color:#00d9ff">5-12°C</strong> (con instrumentos)<br>
    • SC: <strong style="color:#00d9ff">4-8°C</strong> (con instrumentos)<br>
    • Retorno: sin congelamiento después de 20 min
  </div>
</div>

<div class="dx-btn-row" style="margin-top:16px;">
  <button class="hvac-btn btn-secondary" id="vcNuevoTrabajo" style="width:100%">🔄 Nuevo trabajo</button>
</div>`;
  },

  // ═══════════════════════════════════════════════
  // CÁLCULO DE CARGA
  // ═══════════════════════════════════════════════
  calcularCarga(gas, frigorias, longCañeria) {
    const base      = this.cargas[gas]?.[frigorias] || 0.95;
    const longitud  = Number(longCañeria) || 4;
    // Ajuste: +0.015 kg por metro sobre los 4m de referencia
    const ajuste    = Math.max(0, (longitud - 4) * 0.015);
    const ajusteStr = ajuste > 0 ? ajuste.toFixed(3) : "0";
    const total     = +(base + ajuste).toFixed(3);
    return {
      pesoBase: base,
      ajusteCañeria: ajusteStr,
      pesoFinal: total
    };
  },

  // ═══════════════════════════════════════════════
  // PASOS DEL PROCEDIMIENTO
  // ═══════════════════════════════════════════════
  getPasos(tipoTrabajo, gas, carga) {
    const psiObj = this.psiObjetivo[gas];
    const pasos  = [];

    // ─── PASO 0: PREPARACIÓN (siempre) ───
    pasos.push({
      fase: "prep",
      icono: "🛠️",
      titulo: "Preparación y herramientas",
      descripcion: "Antes de conectar nada, verificar que tenés todo lo necesario. Un trabajo mal preparado obliga a repetirlo.",
      checks: [
        "Bomba de vacío con aceite en buen estado (>500 micrones de capacidad)",
        "Manifold de dos vías limpio y sin pérdidas",
        "Balanza digital para cargar gas por peso",
        "Tubos flexibles sin humedad ni contaminación",
        tipoTrabajo === "reparacion" ? "Nitrógeno seco disponible (para prueba de hermeticidad)" : null,
        "Gas del tipo correcto según la plaqueta del equipo",
        "Pinza amperimétrica y termómetro de contacto"
      ].filter(Boolean)
    });

    // ─── PASO 1: PURGA CON NITRÓGENO (solo en reparación) ───
    if (tipoTrabajo === "reparacion") {
      pasos.push({
        fase: "nitrogeno",
        icono: "💨",
        titulo: "Prueba de hermeticidad con nitrógeno",
        descripcion: "Antes de hacer vacío, pressurizá con nitrógeno seco a 150 PSI y verificá que el sistema no tenga fugas. Si hacés vacío sobre una fuga, la humedad del ambiente entra al sistema y forma ácido.",
        advertencia: "⚠️ Usar SOLO nitrógeno seco. Nunca oxígeno ni aire comprimido de compresor de pistón — el aceite del compresor puede causar explosión.",
        timer: 15 * 60,
        timerLabel: "Mínimo 15 min con presión — verificar manómetro",
        checks: [
          "Nitrógeno conectado y presurizado a 150 PSI",
          "Sistema verificado con agua jabonosa en TODAS las conexiones",
          "Presión estable durante 15 minutos (sin caída)",
          "Fuga reparada (si había) y verificada nuevamente"
        ]
      });
    }

    // ─── PASO 2: CONEXIÓN DE MANIFOLD Y BOMBA ───
    pasos.push({
      fase: "vacio",
      icono: "🔌",
      titulo: "Conexión del manifold y la bomba de vacío",
      descripcion: "La conexión correcta del manifold es clave. Un manifold conectado mal puede dejar aire adentro del sistema aunque la bomba trabaje bien.",
      advertencia: "⚠️ Antes de conectar la bomba, asegurate de que las válvulas del manifold estén CERRADAS. Si las abrís sin bomba corriendo, el sistema presurizado va a expulsar gas.",
      checks: [
        "Manifold conectado en el puerto de baja (línea gruesa) y alta (línea fina)",
        "Tubo amarillo del manifold conectado a la bomba de vacío",
        "Válvulas del manifold cerradas",
        "Bomba de vacío con aceite correcto (color claro, sin contaminación)"
      ]
    });

    // ─── PASO 3: VACÍO PRIMARIO ───
    pasos.push({
      fase: "vacio",
      icono: "🌀",
      titulo: "Vacío primario — 15 minutos",
      descripcion: `Abrí las dos válvulas del manifold y arrancá la bomba. El manómetro debe bajar rápidamente. Si después de 5 minutos el manómetro no baja de 0 PSI, hay una fuga. Si baja lento, la bomba puede tener el aceite sucio.`,
      timer: 15 * 60,
      timerLabel: "15 minutos de vacío primario",
      checks: [
        "Ambas válvulas del manifold abiertas",
        "Bomba corriendo correctamente (escuchás el vacío)",
        "Manómetro bajando continuamente",
        "Sin burbujas ni movimiento en el aceite de la bomba (indicaría humedad)"
      ]
    });

    // ─── PASO 4: VACÍO PROFUNDO ───
    pasos.push({
      fase: "vacio",
      icono: "⬇️",
      titulo: "Vacío profundo — hasta 500 micrones",
      descripcion: "Este es el paso más crítico y el que más se saltea. El vacío profundo elimina la humedad del sistema. Con humedad, el refrigerante forma ácido que destruye el compresor desde adentro. 30 minutos mínimo, 60 si el sistema estuvo abierto mucho tiempo.",
      advertencia: "⚠️ Sin vacuómetro: como mínimo 30 minutos de bomba corriendo con los valores del manifold estables. Con vacuómetro: no parar hasta 500 micrones o menos.",
      timer: 30 * 60,
      timerLabel: "30 minutos MÍNIMO — 60 min si estuvo abierto",
      checks: [
        "Bomba corriendo sin interrupciones",
        tipoTrabajo !== "recarga" ? "Sistema estuvo abierto: mínimo 45 minutos de vacío" : "Mínimo 30 minutos",
        "Si tiene vacuómetro: valor por debajo de 500 micrones",
        "Si no tiene vacuómetro: manómetro estable en el valor mínimo durante los últimos 5 minutos"
      ]
    });

    // ─── PASO 5: PRUEBA DE VACÍO ───
    pasos.push({
      fase: "vacio",
      icono: "🔒",
      titulo: "Prueba de sostenimiento de vacío",
      descripcion: "Cerrá las válvulas del manifold SIN apagar la bomba, luego apagá la bomba. Esperá 5 minutos. Si el vacío se sostiene (el manómetro no sube), el sistema es hermético. Si sube, hay fuga.",
      advertencia: "⚠️ Si el vacío no se sostiene: no cargues gas. Hay fuga. Pressurizá con nitrógeno nuevamente y buscala.",
      timer: 5 * 60,
      timerLabel: "5 minutos de espera con válvulas cerradas y bomba apagada",
      checks: [
        "Válvulas del manifold CERRADAS",
        "Bomba de vacío APAGADA",
        "Después de 5 minutos: el manómetro NO subió (sistema hermético)",
        "Si el manómetro subió: buscar fuga antes de continuar"
      ]
    });

    // ─── PASO 6: PREPARAR LA BALANZA ───
    pasos.push({
      fase: "carga",
      icono: "⚖️",
      titulo: `Preparar la carga: ${carga.pesoFinal} kg de ${gas}`,
      descripcion: `El peso correcto es ${carga.pesoFinal} kg (${carga.pesoBase} kg base para ${this.estado.frigorias} FG + ${carga.ajusteCañeria} kg por longitud de cañería). Cargar por peso es el único método preciso. La carga por presión es orientativa — el PSI cambia con la temperatura ambiente.`,
      advertencia: gas === "R32" ? "⚠️ R32 es levemente inflamable — no trabajar cerca de llama. Cargar SIEMPRE en fase líquida (cilindro invertido)." : gas === "R410A" ? "💡 R410A debe cargarse en fase líquida (cilindro invertido o con tubo de picaje) — si cargás gas directamente puede haber fraccionamiento del refrigerante." : null,
      valor: {
        label: `Peso objetivo a cargar`,
        target: `${carga.pesoFinal} kg de ${gas}`,
        input: false
      },
      checks: [
        "Balanza digital encendida y en cero (tara)",
        `Cilindro de ${gas} en la balanza`,
        `Peso inicial registrado — objetivo: restar ${carga.pesoFinal} kg`,
        gas === "R410A" || gas === "R32" ? "Cilindro INVERTIDO para carga en fase líquida" : "Cilindro en posición correcta según el gas"
      ]
    });

    // ─── PASO 7: CARGA DE GAS ───
    pasos.push({
      fase: "carga",
      icono: "⛽",
      titulo: "Carga de gas por peso",
      descripcion: `Abrí la válvula del manifold de BAJA lentamente. El gas va a entrar por diferencia de presión (el sistema está en vacío). Controlá el peso en la balanza. No abrir la válvula de alta mientras el compresor no está corriendo.`,
      advertencia: "⚠️ NO abrir la válvula de ALTA con el compresor parado — el gas entraría al compresor en líquido.",
      timer: null,
      valor: {
        label: "Peso cargado (diferencia en balanza)",
        target: `${carga.pesoFinal} kg`,
        input: true,
        placeholder: "ej: 0.95",
        step: "0.01"
      },
      checks: [
        "Válvula de BAJA del manifold abierta lentamente",
        "Gas entrando (escuchás el flujo)",
        `Balanza llegando a ${carga.pesoFinal} kg`,
        "Válvula del cilindro cerrada cuando se alcanza el peso",
        "Válvulas del manifold cerradas"
      ]
    });

    // ─── PASO 8: ARRANQUE Y VERIFICACIÓN ───
    pasos.push({
      fase: "verificacion",
      icono: "🔌",
      titulo: "Arranque del compresor",
      descripcion: "Desconectá la bomba completamente y conectá el equipo a la corriente. Encendelo en modo FRÍO con el setpoint a la temperatura mínima para que el compresor arranque.",
      checks: [
        "Bomba de vacío desconectada del manifold",
        "Tapas de servicio colocadas (sin el manifold conectado si no vas a medir)",
        "Equipo encendido en modo FRÍO",
        "Compresor arrancando normalmente"
      ]
    });

    // ─── PASO 9: VERIFICACIÓN EN RÉGIMEN ───
    pasos.push({
      fase: "verificacion",
      icono: "📊",
      titulo: "Verificación en régimen — 15 minutos",
      descripcion: `Dejá el equipo funcionar 15 minutos antes de tomar medidas. En los primeros minutos las presiones fluctúan mientras el sistema se estabiliza. El manómetro de baja debe estabilizarse en ${psiObj?.label || "el rango del gas"}.`,
      timer: 15 * 60,
      timerLabel: "15 minutos hasta régimen estable",
      valor: {
        label: "PSI de baja en régimen",
        target: psiObj?.label || "—",
        input: true,
        placeholder: `ej: ${psiObj?.min || 120}`,
        step: "1"
      },
      checks: [
        `PSI baja estabilizado en ${psiObj?.label || "rango del gas"}`,
        "Amperaje dentro del rango para las frigorías del equipo",
        "Retorno SIN congelamiento después de 15 min",
        "Sin ruidos extraños del compresor",
        "Temperatura del evaporador bajando"
      ]
    });

    // ─── PASO 10: CIERRE Y DESCONEXIÓN ───
    pasos.push({
      fase: "cierre",
      icono: "🔒",
      titulo: "Cierre y desconexión del manifold",
      descripcion: "Para desconectar el manifold correctamente hay que hacerlo mientras el compresor está corriendo para evitar que entre aire. Cerrar las válvulas del manifold, luego aflojar los acoples rápidamente.",
      advertencia: "💡 En R32 y R410A: la presión del sistema es alta — aflojar los acoples con cuidado apuntando lejos de la cara.",
      checks: [
        "Válvulas del manifold cerradas antes de desconectar",
        "Acoples retirados con compresor corriendo (minimiza el escape de gas)",
        "Tapas de servicio colocadas y ajustadas",
        "Válvulas de la unidad exterior completamente abiertas (si estaban cerradas)"
      ]
    });

    // ─── PASO FINAL: CONTROL A LAS 24 HORAS ───
    pasos.push({
      fase: "cierre",
      icono: "📋",
      titulo: "Registrar y controlar a las 24 horas",
      descripcion: "Anotá los valores finales. Un trabajo profesional incluye el seguimiento a las 24 horas — una pequeña fuga que no se detectó en el momento puede aparecer recién cuando el sistema lleva un día cargado a presión.",
      valor: {
        label: "Valores finales",
        target: `PSI ${psiObj?.label || "—"} | AMP en rango | Sin congelamiento`,
        input: false
      },
      checks: [
        "Temperatura de setpoint alcanzada o en camino",
        "Valores de PSI y amperaje registrados",
        "Cliente informado de los valores normales de trabajo",
        "Acordar control a las 24-48 horas"
      ]
    });

    return pasos;
  },

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  labelFase(fase) {
    return { prep: "🛠️ PREPARACIÓN", nitrogeno: "💨 NITRÓGENO", vacio: "🌀 VACÍO", carga: "⛽ CARGA", verificacion: "📊 VERIFICACIÓN", cierre: "🔒 CIERRE" }[fase] || fase.toUpperCase();
  },

  labelTipoTrabajo(t) {
    return { reparacion: "Reparación con apertura", nuevo: "Instalación nueva", recarga: "Recarga" }[t] || t;
  },

  formatTime(segundos) {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  },

  // ═══════════════════════════════════════════════
  // TIMER
  // ═══════════════════════════════════════════════
  timerInterval: null,
  timerRestante: 0,

  iniciarTimer(segundos) {
    this.detenerTimer();
    this.timerRestante = segundos;
    const display = document.getElementById("vcTimerDisplay");
    const btnStart = document.getElementById("vcTimerStart");
    if (!display) return;

    if (btnStart) {
      btnStart.textContent = "⏸ Pausar";
      btnStart.onclick = () => this.pausarTimer();
    }

    this.timerInterval = setInterval(() => {
      this.timerRestante--;
      if (display) display.textContent = this.formatTime(Math.max(0, this.timerRestante));
      if (this.timerRestante <= 0) {
        this.detenerTimer();
        if (display) display.textContent = "✅ Listo";
        if (display) display.style.color = "#00cc66";
        if (btnStart) { btnStart.textContent = "✅ Completado"; btnStart.disabled = true; }
      }
    }, 1000);
  },

  pausarTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    const btnStart = document.getElementById("vcTimerStart");
    if (btnStart) {
      btnStart.textContent = "▶ Continuar";
      btnStart.onclick = () => this.iniciarTimer(this.timerRestante);
    }
  },

  detenerTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  },

  resetTimer(segundos) {
    this.detenerTimer();
    this.timerRestante = segundos;
    const display = document.getElementById("vcTimerDisplay");
    const btnStart = document.getElementById("vcTimerStart");
    if (display) { display.textContent = this.formatTime(segundos); display.style.color = ""; }
    if (btnStart) { btnStart.textContent = "▶ Iniciar timer"; btnStart.disabled = false; btnStart.onclick = () => this.iniciarTimer(segundos); }
  },

  // ═══════════════════════════════════════════════
  // BIND EVENTS
  // ═══════════════════════════════════════════════
  bindEvents() {
    document.getElementById("vacioBack")?.addEventListener("click", () => {
      this.detenerTimer();
      Router.back();
    });

    document.getElementById("vcIniciar")?.addEventListener("click", () => {
      const tipo  = document.getElementById("vcTipoTrabajo").value;
      const gas   = document.getElementById("vcGas").value;
      const frig  = document.getElementById("vcFrigorias").value;
      const longC = document.getElementById("vcLongCañeria").value || "4";
      this.estado = { fase: "proc", tipoTrabajo: tipo, gas, frigorias: Number(frig), longCañeria: Number(longC), pasoActual: 0, checksPaso: {} };
      this.actualizarVista();
    });

    this.bindProcedimientoEvents();
  },

  bindProcedimientoEvents() {
    const cont = document.getElementById("vacioContent");
    if (!cont) return;

    cont.addEventListener("click", (e) => {

      if (e.target.id === "vcSiguiente" || e.target.closest("#vcSiguiente")) {
        this.detenerTimer();
        this.estado.pasoActual++;
        this.actualizarVista();
      }

      if (e.target.id === "vcAnterior" || e.target.closest("#vcAnterior")) {
        this.detenerTimer();
        this.estado.pasoActual--;
        this.actualizarVista();
      }

      if (e.target.id === "vcFinalizar") {
        this.detenerTimer();
        this.estado.fase = "finalizado";
        this.actualizarVista();
      }

      if (e.target.id === "vcNuevoTrabajo") {
        this.render();
      }

      if (e.target.id === "vcTimerStart") {
        const pasos = this.getPasos(this.estado.tipoTrabajo, this.estado.gas, this.calcularCarga(this.estado.gas, this.estado.frigorias, this.estado.longCañeria));
        const paso  = pasos[this.estado.pasoActual];
        this.iniciarTimer(this.timerRestante || paso?.timer || 0);
      }

      if (e.target.id === "vcTimerReset") {
        const pasos = this.getPasos(this.estado.tipoTrabajo, this.estado.gas, this.calcularCarga(this.estado.gas, this.estado.frigorias, this.estado.longCañeria));
        const paso  = pasos[this.estado.pasoActual];
        this.resetTimer(paso?.timer || 0);
      }
    });

    // Guardar estado de checks
    cont.addEventListener("change", (e) => {
      if (e.target.classList.contains("vc-check-input")) {
        const idx = e.target.dataset.check;
        this.estado.checksPaso[`${this.estado.pasoActual}-${idx}`] = e.target.checked;
      }

      // Validar valor ingresado en tiempo real
      if (e.target.id === "vcValorInput") {
        this.validarValorInput(e.target.value);
      }
    });
  },

  validarValorInput(valor) {
    const hint = document.getElementById("vcValorHint");
    if (!hint || !valor) return;
    const num = Number(valor);
    const psi = this.psiObjetivo[this.estado.gas];
    if (!psi) return;

    if (num >= psi.min && num <= psi.max) {
      hint.textContent = `✅ ${valor} PSI — dentro del rango ${psi.label}`;
      hint.style.color = "#00cc66";
    } else if (num < psi.min) {
      hint.textContent = `⚠️ ${valor} PSI — bajo (mín ${psi.min}). Posible fuga lenta o carga insuficiente.`;
      hint.style.color = "#ff9b42";
    } else {
      hint.textContent = `⚠️ ${valor} PSI — alto (máx ${psi.max}). Posible exceso de gas o condensador sucio.`;
      hint.style.color = "#ff9b42";
    }
  },

  actualizarVista() {
    const cont = document.getElementById("vacioContent");
    if (!cont) return;

    if (this.estado.fase === "finalizado") {
      cont.innerHTML = this.renderFinalizado();
    } else {
      cont.innerHTML = this.renderProcedimiento();
    }

    // Inicializar timer si el paso tiene uno
    const pasos = this.getPasos(this.estado.tipoTrabajo, this.estado.gas, this.calcularCarga(this.estado.gas, this.estado.frigorias, this.estado.longCañeria));
    const paso  = pasos[this.estado.pasoActual];
    if (paso?.timer) {
      this.timerRestante = paso.timer;
    }

    this.bindProcedimientoEvents();
    cont.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
