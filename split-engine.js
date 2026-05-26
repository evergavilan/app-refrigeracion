// =====================================================
// HVAC PRO ARGENTINA
// SPLIT-ENGINE.JS — Diagnóstico clínico v2
// =====================================================

const SplitEngine = {

  // Rangos por gas (baja presión normal de trabajo)
  rangos: {
    R22:   { psiMin: 55,  psiMax: 75,  psiVacio: 30  },
    R410A: { psiMin: 115, psiMax: 140, psiVacio: 80  },
    R32:   { psiMin: 120, psiMax: 145, psiVacio: 85  }
  },

  // Amperaje por frigorías (trabajo normal)
  amperajes: {
    2250: { min: 2.5, max: 4.5 },
    3000: { min: 3.5, max: 5.5 },
    4500: { min: 5.0, max: 8.0 },
    5500: { min: 7.0, max: 9.5 },
    6000: { min: 8.0, max: 11.0 },
    7500: { min: 10.0, max: 13.5 },
    9000: { min: 13.0, max: 17.0 }
  },

  analyze(d) {

    const rango = this.rangos[d.gas] || this.rangos.R410A;
    const amp   = this.amperajes[d.frigorias] || this.amperajes[4500];

    const psi = Number(d.psi) || 0;
    const a   = Number(d.amp) || 0;

    const deltaT       = (d.tempIn && d.tempOut) ? (Number(d.tempIn) - Number(d.tempOut)) : null;
    const deltaTOk     = deltaT !== null && deltaT >= 8 && deltaT <= 14;
    const deltaTBajo   = deltaT !== null && deltaT < 8;
    const deltaTAlto   = deltaT !== null && deltaT > 14;

    const psiAlto  = psi > rango.psiMax;
    const psiBajo  = psi > 0 && psi < rango.psiMin;
    const psiVacio = psi > 0 && psi < rango.psiVacio;
    const psiOk    = psi >= rango.psiMin && psi <= rango.psiMax;

    const ampAlto  = a > amp.max;
    const ampBajo  = a > 0 && a < amp.min;
    const ampOk    = a >= amp.min && a <= amp.max;

    // ═══════════════════════════════════════════════
    // ETAPA 1 — COMPRESOR NO ARRANCA
    // ═══════════════════════════════════════════════

    if (d.arranca === "no") {
      if (d.chkCapacitor) return this.dx({
        icono: "🔋",
        titulo: "Capacitor sospechoso",
        certeza: 85,
        causa: "El compresor no arranca y el capacitor está indicado como sospechoso. Es la falla más común en Argentina — el calor lo fatiga.",
        pasos: [
          "Medí el capacitor con capacímetro. Tolerancia ±10% del valor nominal.",
          "Si el dual mide menos de lo nominal en cualquiera de los dos valores → reemplazalo.",
          "Con el capacitor nuevo probá arranque. Si sigue sin arrancar pasá al punto siguiente.",
          "Revisá tensión de alimentación al compresor. Debe ser 220V ±10%.",
          "Si hay tensión y no arranca → compresor bloqueado o protector térmico abierto."
        ],
        alerta: null,
        datos: { psi, a, rango, amp }
      });

      if (d.chkTermico) return this.dx({
        icono: "🌡️",
        titulo: "Protector térmico abierto",
        certeza: 80,
        causa: "El protector térmico (Klixon) se disparó. Puede ser por sobrecalentamiento real del compresor o por protector fatigado.",
        pasos: [
          "Apagá el equipo y dejalo enfriar 30 minutos mínimo.",
          "Medí resistencia del Klixon: debe ser continuidad (0Ω). Si está abierto y frío → Klixon fatigado.",
          "Si cierra en frío pero se vuelve a abrir → el compresor está trabajando caliente.",
          "Revisá que el condensador no esté tapado y que el ventilador del condensador gire bien.",
          "Si todo está bien y sigue abriendo → posible problema de compresión."
        ],
        alerta: null,
        datos: { psi, a, rango, amp }
      });

      return this.dx({
        icono: "⚡",
        titulo: "Compresor no arranca — revisión eléctrica",
        certeza: 70,
        causa: "El compresor no intenta arrancar. Antes de pensar en el compresor revisá la parte eléctrica — el 70% de los casos tienen solución ahí.",
        pasos: [
          "Verificá tensión en bornera del compresor: debe haber 220V.",
          "Medí capacitor con capacímetro (falla #1 en Argentina).",
          "Revisá protector térmico (Klixon): debe tener continuidad en frío.",
          "Verificá relay de arranque si el equipo tiene.",
          "Si hay tensión, capacitor ok y Klixon ok → compresor trabado o devanado abierto. Medí devanados."
        ],
        alerta: "⚠️ No arranques el compresor más de 3 veces seguidas. Si no parte en 3 intentos, esperá que enfríe.",
        datos: { psi, a, rango, amp }
      });
    }

    // ═══════════════════════════════════════════════
    // ETAPA 2 — COMPRESOR ARRANCA, SIN DATOS MEDIDOS
    // ═══════════════════════════════════════════════

    if (!psi && !a) {
      return this.dx({
        icono: "📊",
        titulo: "Necesitás datos medidos",
        certeza: 0,
        causa: "El compresor arranca pero sin PSI y amperaje medidos no puedo darte un diagnóstico preciso. Necesitás manómetro y pinza amperimétrica.",
        pasos: [
          "Conectá manómetro en el lado de baja presión (línea gruesa).",
          "Medí amperaje en la línea del compresor con pinza.",
          "Dejá el equipo trabajar 10 minutos antes de tomar medidas.",
          "Anotá también temperatura de entrada y salida de aire del evaporador.",
          "Con esos datos volvé a correr el diagnóstico."
        ],
        alerta: null,
        datos: { psi, a, rango, amp }
      });
    }

    // ═══════════════════════════════════════════════
    // ETAPA 3 — DIAGNÓSTICO POR CRUCE DE SÍNTOMAS
    // ═══════════════════════════════════════════════

    // --- CASO: PSI VACÍO + AMP BAJO = FUGA SEVERA ---
    if (psiVacio && ampBajo) return this.dx({
      icono: "💨",
      titulo: "Fuga severa — gas casi agotado",
      certeza: 92,
      causa: `PSI de ${psi} en ${d.gas} indica que el sistema tiene muy poco gas. El amperaje bajo (${a}A) confirma que el compresor está trabajando casi en vacío.`,
      pasos: [
        "NO cargues gas sin antes encontrar la fuga. El gas se va a escapar igual.",
        "Pressurizá el sistema con nitrógeno a 150 PSI y buscá la fuga con agua jabonosa.",
        "Revisá especialmente: flarings, válvulas, unión entre cañerías y conexiones de servicio.",
        "Una vez reparada la fuga, hacé vacío mínimo 30 minutos hasta 500 micrones.",
        "Cargá el gas por peso (nunca a ojo) según la plaqueta del equipo."
      ],
      alerta: "🔴 No uses el equipo — el compresor puede quemarse por falta de lubricación con gas.",
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI BAJO + AMP BAJO + RETORNO CONGELADO = FUGA LENTA ---
    if (psiBajo && ampBajo && d.chkFrozen) return this.dx({
      icono: "❄️💨",
      titulo: "Fuga lenta con retorno congelado",
      certeza: 88,
      causa: `PSI bajo (${psi} vs esperado ${rango.psiMin}-${rango.psiMax}), amperaje bajo (${a}A) y retorno congelado. El sistema tiene menos gas del necesario — el refrigerante se expande antes en la línea de succión.`,
      pasos: [
        "Apagá el equipo y dejalo descongelar el retorno completamente (1-2 horas).",
        "Mientras tanto buscá la fuga: revisá flarings y conexiones con agua jabonosa.",
        "Reparada la fuga, verificá el vacío del sistema.",
        "Cargá gas observando PSI y amperaje simultáneamente hasta entrar en rango.",
        `Para ${d.gas}: PSI objetivo ${rango.psiMin}-${rango.psiMax}, amperaje ${amp.min}-${amp.max}A.`
      ],
      alerta: "⚠️ El retorno congelado con baja presión ES fuga, no es airflow. No confundirlos.",
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI BAJO + AMP BAJO + SIN SÍNTOMAS VISUALES = FUGA O COMPRESOR ---
    if (psiBajo && ampBajo && !d.chkFrozen && !d.chkAirflow) return this.dx({
      icono: "🔍",
      titulo: "Baja presión y amperaje — dos posibles causas",
      certeza: 75,
      causa: `PSI de ${psi} (bajo para ${d.gas}) y amperaje de ${a}A (bajo para ${d.frigorias} FG). Sin más síntomas hay dos caminos: fuga lenta o compresor con baja compresión.`,
      pasos: [
        "Primero descartá fuga: revisá flarings y conexiones con agua jabonosa.",
        "Si no encontrás fuga, hacé una prueba de compresión: apagá, equilibrá presiones, arrancá y medí cuánto tarda en subir la presión de alta.",
        "Un compresor sano sube la presión rápido. Si sube lento o no sube → compresión baja.",
        "Si la compresión está bien → fuga no visible (interna o en lugar difícil).",
        "En ese caso pressurizá con nitrógeno para encontrar la fuga."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI ALTO + AMP ALTO + CONDENSADOR ---
    if (psiAlto && ampAlto) return this.dx({
      icono: "🔥",
      titulo: "Condensador sobrecargado",
      certeza: 90,
      causa: `PSI de ${psi} (alto, esperado max ${rango.psiMax}) y amperaje de ${a}A (alto, esperado max ${amp.max}A). El condensador no está disipando calor correctamente — el compresor trabaja forzado.`,
      pasos: [
        "Apagá el equipo. Revisá el condensador exterior — ¿está tapado con pelusa, hojas, grasa?",
        "Limpiá las aletas del condensador con agua a presión moderada (nunca a alta presión directa).",
        "Verificá que el ventilador del condensador gire y tenga buen caudal.",
        "Revisá que el equipo tenga espacio libre alrededor para ventilar (mínimo 30cm).",
        "Si es verano y temperatura ambiente supera 38°C, es normal que suba un poco — pero no tanto."
      ],
      alerta: "⚠️ Si el compresor tiene más de 3 años sin limpieza de condensador, puede estar al límite. Limpiá antes de evaluar el gas.",
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI ALTO + AMP ALTO + GAS EN EXCESO ---
    if (psiAlto && ampAlto && d.chkGasExceso) return this.dx({
      icono: "⛽",
      titulo: "Posible exceso de refrigerante",
      certeza: 80,
      causa: `PSI muy alto con amperaje elevado y el técnico anterior puede haber cargado de más. El exceso de gas sube la presión de alta y fuerza el compresor.`,
      pasos: [
        "Primero limpiá el condensador — descartá esa causa antes de tocar el gas.",
        "Si el condensador está limpio y el PSI sigue alto → purgá gas lentamente por la válvula de baja.",
        "Purgá de a poco: 5 PSI, esperá 5 minutos, medí amperaje.",
        `Objetivo: PSI ${rango.psiMin}-${rango.psiMax} con amperaje ${amp.min}-${amp.max}A.`,
        "Hacé el ajuste fino con el equipo en régimen (mínimo 15 minutos funcionando)."
      ],
      alerta: "⚠️ Nunca purgues gas a la atmósfera sin recuperadora. Es contaminante y en Argentina está penado.",
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI NORMAL + AMP NORMAL + POCO FRÍO + RETORNO CONGELADO = AIRFLOW ---
    if (psiOk && ampOk && d.chkFrozen && d.chkPocofrio) return this.dx({
      icono: "🌬️",
      titulo: "Problema de airflow — no es el gas",
      certeza: 93,
      causa: `PSI de ${psi} y amperaje de ${a}A están en rango normal. El retorno congelado CON presión y amperaje normales es airflow, no falta de gas. El evaporador no tiene circulación suficiente de aire.`,
      pasos: [
        "Revisá el filtro de aire del evaporador interior — en Argentina se tapa mucho por pelusa.",
        "Limpiá el filtro y también las aletas del evaporador si están sucias.",
        "Verificá que la turbina interior gire bien y no tenga pelusa acumulada.",
        "Con el equipo apagado descongelá el evaporador completamente (puede tomar 2 horas).",
        "Volvé a encender. Si el retorno ya no congela y enfría bien → era solo mantenimiento."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI NORMAL + AMP NORMAL + DELTA T BAJO = AIRFLOW / EVAPORADOR ---
    if (psiOk && ampOk && deltaTBajo) return this.dx({
      icono: "🌡️",
      titulo: `Delta T bajo (${deltaT}°C) — transferencia de calor deficiente`,
      certeza: 85,
      causa: `El equipo está en presión y amperaje normales pero la diferencia de temperatura entrada/salida es solo ${deltaT}°C (normal: 8-14°C). El sistema refrigera pero no transfiere bien el calor al aire.`,
      pasos: [
        "Revisá y limpiá el filtro de aire — es el primer paso siempre.",
        "Verificá que la turbina interior gire a la velocidad correcta en modo frío.",
        "Limpiá el evaporador con espuma limpiadora de serpentines.",
        "Verificá que las persianas de distribución de aire funcionen bien.",
        "Si con todo limpio el delta T sigue bajo → el gas puede estar al límite inferior."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI NORMAL + AMP NORMAL + DELTA T ALTO = EXCESO GAS / EXPANSIÓN ---
    if (psiOk && ampOk && deltaTAlto) return this.dx({
      icono: "❄️",
      titulo: `Delta T alto (${deltaT}°C) — posible exceso de gas`,
      certeza: 72,
      causa: `Delta T de ${deltaT}°C (sobre 14°C). El evaporador está absorbiendo demasiado calor del aire — puede ser exceso de refrigerante o válvula de expansión.`,
      pasos: [
        "Revisá que el caudal de aire sea normal (filtros limpios, turbina funcionando).",
        "Si el caudal está bien, monitoreá la presión de alta (no solo baja).",
        "Un delta T muy alto con PSI bajo en alta suele ser exceso de refrigerante.",
        "Verificá si el equipo fue cargado recientemente por otro técnico.",
        "Si tiene válvula de expansión termostática (TXV) → puede estar mal calibrada."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI NORMAL + AMP ALTO = COMPRESOR FORZADO ---
    if (psiOk && ampAlto) return this.dx({
      icono: "⚡🔥",
      titulo: "Amperaje alto con presión normal",
      certeza: 78,
      causa: `El PSI está en rango (${psi}) pero el amperaje de ${a}A supera el máximo esperado de ${amp.max}A para ${d.frigorias} FG. El compresor está trabajando forzado eléctricamente.`,
      pasos: [
        "Verificá tensión de red: si hay baja tensión el compresor consume más amperaje.",
        "Revisá el capacitor — un capacitor caído hace trabajar más el motor.",
        "Verificá que el ventilador del condensador esté girando bien (si para, sube el amperaje).",
        "Medí la temperatura de la carcasa del compresor: si quema a la mano → sobrecalentamiento.",
        "Si todo está ok y el amperaje sigue alto → devanado del motor con falla incipiente."
      ],
      alerta: "⚠️ Amperaje sostenido por encima del máximo quema el compresor. Resolvé esto antes de dejarlo funcionar.",
      datos: { psi, a, rango, amp }
    });

    // --- CASO: PSI NORMAL + AMP BAJO = GAS AL LÍMITE INFERIOR ---
    if (psiOk && ampBajo) return this.dx({
      icono: "📉",
      titulo: "Amperaje bajo con presión aceptable",
      certeza: 70,
      causa: `PSI de ${psi} está dentro del rango pero el amperaje de ${a}A está por debajo del mínimo esperado (${amp.min}A). El compresor no está absorbiendo suficiente carga.`,
      pasos: [
        "Es posible que el sistema esté en el límite inferior de carga de gas.",
        "Verificá delta T: si es menor a 8°C confirma baja absorción de calor.",
        "Revisá que el equipo haya estado funcionando al menos 15 minutos antes de medir.",
        "Si el delta T también está bajo, podés agregar gas de a poco monitoreando PSI y amperaje.",
        `Objetivo: PSI ${rango.psiMin}-${rango.psiMax} con amperaje ${amp.min}-${amp.max}A.`
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // --- CASO: TODO EN RANGO + POCO FRÍO ---
    if (psiOk && ampOk && d.chkPocofrio) return this.dx({
      icono: "✅❓",
      titulo: "Sistema en rango — problema no es el gas",
      certeza: 88,
      causa: `PSI (${psi}) y amperaje (${a}A) están perfectamente en rango para ${d.frigorias} FG con ${d.gas}. El problema de poco frío está en otro lado.`,
      pasos: [
        "Limpiá filtros y evaporador — el 40% de los 'poco frío' se resuelven así.",
        "Verificá el delta T (diferencia temp entrada/salida): debe ser 8-14°C.",
        "Revisá que el modo esté en FRÍO y no en ventilación o dry.",
        "Verificá que el set point esté por debajo de la temperatura ambiente.",
        "Si todo está bien → posible problema de control electrónico o sensor de temperatura."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // --- CASO: TODO NORMAL ---
    return this.dx({
      icono: "✅",
      titulo: "Sistema operando en parámetros normales",
      certeza: 90,
      causa: `PSI de ${psi} y amperaje de ${a}A están dentro del rango esperado para ${d.frigorias} FG con ${d.gas}. El sistema parece estar funcionando correctamente.`,
      pasos: [
        "Verificá el delta T de temperatura (entrada/salida evaporador): debe ser 8-14°C.",
        "Revisá que los filtros estén limpios para máxima eficiencia.",
        "Verificá que el condensador tenga buena ventilación.",
        "Si hay alguna queja de poco frío, evaluá el tamaño del equipo vs el ambiente.",
        "Registrá los valores actuales como baseline para futuras comparaciones."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

  },

  // ═══════════════════════════════════════════════
  // FORMATEADOR DE RESULTADO
  // ═══════════════════════════════════════════════

  dx({ icono, titulo, certeza, causa, pasos, alerta, datos }) {

    const barColor = certeza >= 85 ? "#00d9ff" : certeza >= 70 ? "#ff9b42" : "#8899aa";
    const { psi, a, rango, amp } = datos;

    const pasosHTML = pasos.map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i + 1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");

    const alertaHTML = alerta ? `
      <div class="dx-alerta">${alerta}</div>` : "";

    const datosHTML = (psi || a) ? `
      <div class="dx-datos-grid">
        ${psi ? `<div class="dx-dato ${psi < rango.psiMin ? 'dx-bajo' : psi > rango.psiMax ? 'dx-alto' : 'dx-ok'}">
          <span class="dx-dato-label">PSI medido</span>
          <span class="dx-dato-val">${psi}</span>
          <span class="dx-dato-ref">${rango.psiMin}-${rango.psiMax}</span>
        </div>` : ""}
        ${a ? `<div class="dx-dato ${a < amp.min ? 'dx-bajo' : a > amp.max ? 'dx-alto' : 'dx-ok'}">
          <span class="dx-dato-label">AMP medido</span>
          <span class="dx-dato-val">${a}A</span>
          <span class="dx-dato-ref">${amp.min}-${amp.max}A</span>
        </div>` : ""}
      </div>` : "";

    return { html: `
      <div class="dx-result-card">

        <div class="dx-header">
          <span class="dx-icono">${icono}</span>
          <div class="dx-title-block">
            <div class="dx-titulo">${titulo}</div>
            ${certeza > 0 ? `<div class="dx-certeza-bar">
              <div class="dx-certeza-fill" style="width:${certeza}%;background:${barColor}"></div>
            </div>
            <div class="dx-certeza-txt" style="color:${barColor}">${certeza}% probabilidad</div>` : ""}
          </div>
        </div>

        <div class="dx-causa">${causa}</div>

        ${datosHTML}

        ${alertaHTML}

        <div class="dx-pasos-titulo">📋 Pasos de intervención:</div>
        ${pasosHTML}

      </div>
    `};
  }

};
