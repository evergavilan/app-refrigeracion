// =====================================================
// HVAC PRO ARGENTINA
// SPLIT-ENGINE.JS — Diagnóstico clínico v5
// Mejoras: retorno líquido, TXV, temp ambiente,
// compresión baja, gas incorrecto, rangos dinámicos
// =====================================================

const SplitEngine = {

  // ─────────────────────────────────────────────
  // RANGOS BASE por gas (PSI baja a temp ambiente ~25°C)
  // ─────────────────────────────────────────────
  rangos: {
    R22:   { psiMin: 55,  psiMax: 75,  psiVacio: 30,  psiAltaNormal: [200,260] },
    R410A: { psiMin: 115, psiMax: 140, psiVacio: 80,  psiAltaNormal: [380,440] },
    R32:   { psiMin: 120, psiMax: 145, psiVacio: 85,  psiAltaNormal: [400,460] }
  },

  // Corrección por temperatura ambiente
  // Cada 5°C sobre 25°C → PSI baja sube ~5-8 PSI
  corregirRangoPorTemp(rango, tempAmb) {
    if (!tempAmb || tempAmb <= 25) return rango;
    const delta = Math.max(0, (tempAmb - 25) / 5);
    const corr  = Math.round(delta * 6);
    return {
      ...rango,
      psiMin: rango.psiMin + corr,
      psiMax: rango.psiMax + corr,
      psiVacio: rango.psiVacio + corr,
      _correccionAplicada: corr,
      _tempAmb: tempAmb
    };
  },

  amperajes: {
    2250: { min: 2.5, max: 4.5 },
    3000: { min: 3.5, max: 5.5 },
    4500: { min: 5.0, max: 8.0 },
    5500: { min: 7.0, max: 9.5 },
    6000: { min: 8.0, max: 11.0 },
    7500: { min: 10.0, max: 13.5 },
    9000: { min: 13.0, max: 17.0 }
  },

  // ─────────────────────────────────────────────
  // TABLAS DE SATURACIÓN [temp°C, PSI]
  // ─────────────────────────────────────────────
  satTablas: {
    r410a: [[-40,25],[-35,32],[-30,40],[-25,50],[-20,62],[-15,76],[-10,92],[-5,111],[0,132],[2,140],[4,148],[6,157],[8,166],[10,176],[12,186],[14,197],[16,208],[18,219],[20,231],[22,244],[24,257],[25,264],[26,270],[28,284],[30,298],[32,313],[34,328],[35,336],[36,344],[38,360],[40,377],[42,394],[44,412],[46,430],[48,449],[50,469],[52,489],[54,510],[55,521],[56,531],[58,553],[60,575]],
    r32:   [[-40,21],[-35,27],[-30,34],[-25,43],[-20,53],[-15,65],[-10,79],[-5,95],[0,113],[2,120],[4,128],[6,136],[8,144],[10,153],[12,162],[14,172],[16,182],[18,193],[20,204],[22,215],[24,227],[25,233],[26,240],[28,252],[30,265],[32,279],[34,293],[35,300],[36,307],[38,322],[40,337],[42,353],[44,370],[46,387],[48,405],[50,423],[52,442],[54,462],[55,472],[56,483],[58,504],[60,526]],
    r22:   [[-40,7],[-35,10],[-30,13],[-25,17],[-20,22],[-15,27],[-10,33],[-5,40],[0,48],[2,51],[4,54],[5,56],[6,58],[8,63],[10,68],[12,73],[14,78],[16,84],[18,90],[20,96],[22,103],[24,110],[25,114],[26,117],[28,125],[30,132],[32,140],[34,149],[35,153],[36,157],[38,166],[40,175],[42,185],[44,195],[46,206],[48,217],[50,228],[52,240],[54,253],[55,259],[56,266],[58,280],[60,294]]
  },

  shRango: { min: 5,  max: 12 },
  scRango: { min: 4,  max: 8  },

  psiToTsat(psi, gas) {
    const key   = gas.toLowerCase().replace(/[^a-z0-9]/g, "");
    const tabla = this.satTablas[key];
    if (!tabla) return null;
    const psiN  = Number(psi);
    if (isNaN(psiN)) return null;
    if (psiN <= tabla[0][1])                return tabla[0][0];
    if (psiN >= tabla[tabla.length-1][1])   return tabla[tabla.length-1][0];
    for (let i = 0; i < tabla.length - 1; i++) {
      const [t1,p1] = tabla[i], [t2,p2] = tabla[i+1];
      if (psiN >= p1 && psiN <= p2) return t1 + (psiN-p1)/(p2-p1)*(t2-t1);
    }
    return null;
  },

  calcSH(d) {
    if (!d.tempSuccion || !d.psi) return null;
    const tsat = this.psiToTsat(d.psi, d.gas);
    if (tsat === null) return null;
    return Math.round((Number(d.tempSuccion) - tsat) * 10) / 10;
  },

  calcSC(d) {
    if (!d.psiAlta || !d.tempLiquido) return null;
    const tsat = this.psiToTsat(d.psiAlta, d.gas);
    if (tsat === null) return null;
    return Math.round((tsat - Number(d.tempLiquido)) * 10) / 10;
  },

  clasifSH(sh) {
    if (sh === null)                    return null;
    if (sh < 0)                         return "LIQUIDO";    // retorno de líquido — emergencia
    if (sh < this.shRango.min)          return "BAJO";
    if (sh <= this.shRango.max)         return "OK";
    if (sh <= this.shRango.max + 5)     return "ALTO";
    return "MUY_ALTO";
  },

  clasifSC(sc) {
    if (sc === null)                    return null;
    if (sc < 0)                         return "NEGATIVO";   // vapor en línea
    if (sc < this.scRango.min)          return "BAJO";
    if (sc <= this.scRango.max)         return "OK";
    if (sc <= 15)                       return "ALTO";
    return "MUY_ALTO";
  },

  // ═══════════════════════════════════════════════
  // ANALYZE — DIAGNÓSTICO INTEGRADO v5
  // ═══════════════════════════════════════════════
  analyze(d) {

    const rangoBase = this.rangos[d.gas] || this.rangos.R410A;
    const tempAmb   = Number(d.tempAmbiente) || 0;
    const rango     = this.corregirRangoPorTemp(rangoBase, tempAmb);
    const amp       = this.amperajes[d.frigorias] || this.amperajes[4500];

    const psi = Number(d.psi) || 0;
    const a   = Number(d.amp) || 0;

    const deltaT      = (d.tempIn && d.tempOut) ? (Number(d.tempIn) - Number(d.tempOut)) : null;
    const deltaTOk    = deltaT !== null && deltaT >= 8 && deltaT <= 14;
    const deltaTBajo  = deltaT !== null && deltaT < 8;
    const deltaTAlto  = deltaT !== null && deltaT > 14;

    const psiAlto  = psi > rango.psiMax;
    const psiBajo  = psi > 0 && psi < rango.psiMin;
    const psiVacio = psi > 0 && psi < rango.psiVacio;
    const psiOk    = psi >= rango.psiMin && psi <= rango.psiMax;

    const ampAlto  = a > amp.max;
    const ampBajo  = a > 0 && a < amp.min;
    const ampOk    = a >= amp.min && a <= amp.max;

    // ─────────────────────────────────────────────
    // SH / SC
    // ─────────────────────────────────────────────
    const sh       = this.calcSH(d);
    const sc       = this.calcSC(d);
    const shClasif = this.clasifSH(sh);
    const scClasif = this.clasifSC(sc);

    const shLiquido  = shClasif === "LIQUIDO";
    const shBajo     = shClasif === "BAJO" || shLiquido;
    const shAlto     = shClasif === "ALTO" || shClasif === "MUY_ALTO";
    const shMuyAlto  = shClasif === "MUY_ALTO";
    const shOk       = shClasif === "OK";

    const scNeg      = scClasif === "NEGATIVO";
    const scBajo     = scClasif === "BAJO" || scNeg;
    const scAlto     = scClasif === "ALTO" || scClasif === "MUY_ALTO";
    const scOk       = scClasif === "OK";

    // Patrones diagnósticos SH/SC
    const shscFaltaGas  = sh !== null && sc !== null && shAlto && scBajo;
    const shscExceso    = sh !== null && sc !== null && shBajo && scAlto && !shLiquido;
    const shscLiquido   = shLiquido;          // SH < 0 = retorno de líquido al compresor
    const shscTXV       = sh !== null && sc !== null
                          && shAlto && scAlto; // SH alto + SC alto = TXV o restricción parcial
    const shIndicaFaltaGas  = sh !== null && shAlto;
    const scIndicaFaltaGas  = sc !== null && scNeg;

    // Texto SH/SC resumido para incluir en causas
    const shscTexto = () => {
      const p = [];
      if (sh !== null) p.push(`SH ${sh}°C (${shLiquido ? "🔴 LÍQUIDO" : shMuyAlto ? "🔴 muy alto" : shAlto ? "🟠 alto" : shOk ? "✅ ok" : "🟡 bajo"})`);
      if (sc !== null) p.push(`SC ${sc}°C (${scNeg ? "🔴 vapor" : scBajo ? "🟡 bajo" : scOk ? "✅ ok" : "🟠 alto"})`);
      return p.length ? ` [${p.join(" | ")}]` : "";
    };

    // Síntomas acumulados para el contexto
    const sint = [];
    if (deltaT !== null)  sint.push(`ΔT ${deltaT}°C`);
    if (d.chkFrozen)      sint.push("retorno congelado");
    if (d.chkPocofrio)    sint.push("poco frío");
    if (d.chkAirflow)     sint.push("poco caudal");
    if (d.chkCondSucio)   sint.push("condensador sucio");
    if (d.chkGasExceso)   sint.push("posible exceso de gas");
    if (d.chkCapacitor)   sint.push("capacitor sospechoso");
    if (d.chkTermico)     sint.push("protector térmico disparado");
    if (d.chkContinuo)    sint.push("trabaja continuo");
    if (d.chkTXV)         sint.push("TXV sospechosa");
    if (d.chkCompBaja)    sint.push("compresión baja sospechada");
    if (tempAmb > 35)     sint.push(`temp ambiente ${tempAmb}°C`);
    const ctx = sint.length ? ` Síntomas: ${sint.join(", ")}.` : "";

    // Nota de corrección por temperatura ambiente
    const notaTemp = rango._correccionAplicada
      ? ` ⚠️ Rangos ajustados por temp ambiente de ${tempAmb}°C (+${rango._correccionAplicada} PSI sobre base).`
      : "";

    // ═══════════════════════════════════════════════
    // PRIORIDAD 0 — EMERGENCIA: RETORNO DE LÍQUIDO
    // SH < 0 = líquido entrando al compresor
    // Destruye el compresor en minutos — override total
    // ═══════════════════════════════════════════════
    if (shscLiquido) return this.dx({
      icono: "🔴💧",
      titulo: `EMERGENCIA — Retorno de líquido (SH ${sh}°C)`,
      certeza: 97,
      urgencia: "CRITICO",
      causa: `SH de ${sh}°C es negativo — hay refrigerante en estado LÍQUIDO llegando al compresor. El compresor está diseñado para comprimir gas, no líquido. El líquido destruye las válvulas y los pistones en minutos. APAGAR EL EQUIPO INMEDIATAMENTE.${sc !== null ? ` SC de ${sc}°C.` : ""}${ctx}`,
      pasos: [
        "🔴 APAGAR EL EQUIPO AHORA — no dejarlo funcionar ni un minuto más.",
        "Esperá 30 minutos para que el refrigerante líquido se evapore del compresor.",
        "Antes de volver a encender: encontrá la CAUSA del retorno de líquido.",
        d.chkAirflow ? "Poco caudal de aire reportado — el evaporador sin airflow se inunda de líquido. Limpiar filtro y revisar turbina." : "Revisá el airflow primero: filtro tapado o turbina detenida es la causa más frecuente.",
        "Si el airflow está bien: la válvula de expansión (TXV o capilar) puede estar abierta de más, inundando el evaporador.",
        `Verificá el SH después del arranque. Debe estar entre 5-12°C. Si vuelve a ${sh}°C o menos → hay un problema de expansión o airflow severo.`
      ],
      alerta: `🔴 PELIGRO INMEDIATO: El compresor puede tener daño mecánico ya. Antes de volver a encender, girar el compresor a mano (si tiene acceso) para verificar que no está hidrobloqueado.`,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ═══════════════════════════════════════════════
    // ETAPA 1 — COMPRESOR NO ARRANCA
    // ═══════════════════════════════════════════════
    if (d.arranca === "no") {

      if (d.chkCapacitor) return this.dx({
        icono: "🔋",
        titulo: "Capacitor sospechoso",
        certeza: 85,
        causa: `El compresor no arranca y el capacitor está indicado. Es la falla #1 en Argentina — el calor lo destruye.${d.chkTermico ? " Protector térmico también disparado — puede haberse abierto POR el motor esforzado con el capacitor caído. Revisá el capacitor primero." : ""}${ctx}`,
        pasos: [
          "Descargá el capacitor antes de tocarlo: cortocircuitá los bornes con una resistencia 10kΩ.",
          "Medí con capacímetro. Tolerancia ±10% del valor nominal de la etiqueta.",
          "Si el dual mide menos en cualquiera de los dos valores → reemplazalo con el mismo valor exacto.",
          "Con capacitor nuevo probá arranque. Si sigue sin arrancar → medí tensión en bornera: debe ser 220V ±10%.",
          "Si hay tensión y capacitor ok → Klixon o devanados del compresor."
        ],
        alerta: null,
        datos: { psi, a, rango, amp, sh, sc }
      });

      if (d.chkTermico) return this.dx({
        icono: "🌡️",
        titulo: "Protector térmico abierto (Klixon)",
        certeza: 80,
        causa: `El Klixon se disparó. Puede ser por sobrecalentamiento real o por protector fatigado.${d.chkCondSucio ? " Condensador sucio reportado — el calor del condensador puede ser la causa del disparo." : ""}${ctx}`,
        pasos: [
          "Apagá el equipo y dejalo enfriar 30 minutos mínimo.",
          "Medí el Klixon con óhmetro: debe ser continuidad (0Ω) cuando está frío.",
          "Si está abierto en frío → Klixon fatigado, reemplazalo.",
          "Si cierra en frío pero vuelve a abrir → causa externa. Revisá condensador, tensión y temperatura del compresor.",
          "Si la carcasa del compresor quema a la mano → hay sobrecalentamiento real. Buscar causa antes de reemplazar Klixon."
        ],
        alerta: null,
        datos: { psi, a, rango, amp, sh, sc }
      });

      return this.dx({
        icono: "⚡",
        titulo: "Compresor no arranca — revisión eléctrica",
        certeza: 70,
        causa: `El compresor no intenta arrancar. El 70% de los casos tienen solución eléctrica antes de llegar al compresor.${ctx}`,
        pasos: [
          "Medí tensión en bornera del compresor con voltímetro: debe ser 220V ±10%.",
          "Medí capacitor con capacímetro (falla más frecuente en Argentina).",
          "Medí Klixon: debe tener continuidad en frío.",
          "Verificá relay de arranque o contactor si el equipo tiene.",
          "Si hay tensión, capacitor ok y Klixon ok → medí devanados: C-S, C-R, S-R deben tener continuidad entre sí y no tener continuidad a masa."
        ],
        alerta: "⚠️ No arranques el compresor más de 3 veces seguidas sin que enfríe.",
        datos: { psi, a, rango, amp, sh, sc }
      });
    }

    // ═══════════════════════════════════════════════
    // ETAPA 2 — SIN MEDICIONES
    // ═══════════════════════════════════════════════
    if (!psi && !a) {
      const orient = [];
      if (shLiquido)          orient.push(`🔴 SH ${sh}°C NEGATIVO — retorno de líquido, apagar ya`);
      else if (shIndicaFaltaGas) orient.push(`SH alto (${sh}°C) indica falta de gas`);
      if (scNeg)              orient.push(`SC negativo (${sc}°C) confirma vapor en línea`);
      if (d.chkFrozen && d.chkPocofrio) orient.push("retorno congelado + poco frío → fuga o airflow");
      if (d.chkCondSucio)     orient.push("condensador sucio → limpiar antes de medir");

      return this.dx({
        icono: "📊",
        titulo: "Necesitás datos medidos",
        certeza: 0,
        causa: `Compresor arranca pero sin PSI y amperaje no hay diagnóstico confiable.${orient.length ? " Indicios: " + orient.join("; ") + "." : ""}`,
        pasos: [
          shLiquido ? "🔴 SH negativo detectado — APAGAR el equipo urgente." : "Conectá manómetro en la línea de baja (válvula de servicio, línea gruesa).",
          "Medí amperaje en la línea del compresor con pinza.",
          "Dejá el equipo trabajar 10-15 minutos antes de tomar medidas finales.",
          "Anotá temperatura de entrada y salida de aire del evaporador para calcular delta T.",
          "Con esos datos volvé a correr el diagnóstico."
        ],
        alerta: shLiquido ? `🔴 SH ${sh}°C — retorno de líquido detectado. Apagar el equipo AHORA.` : shMuyAlto ? `⚠️ SH muy alto (${sh}°C) — el compresor está trabajando recalentado. Medí PSI urgente.` : null,
        datos: { psi, a, rango, amp, sh, sc }
      });
    }

    // ═══════════════════════════════════════════════
    // ETAPA 3 — DIAGNÓSTICO INTEGRADO CON TODOS LOS DATOS
    // ═══════════════════════════════════════════════

    // ─────────────────────────────────────────────
    // PATRÓN 1: EXCESO DE GAS CON TXV DUDOSA
    // SH alto + SC alto = la expansión no controla
    // No es falta de gas ni exceso — es TXV o capilar
    // ─────────────────────────────────────────────
    if (shscTXV && !shLiquido) return this.dx({
      icono: "🔧⚗️",
      titulo: `TXV o restricción — SH ${sh}°C y SC ${sc}°C ambos altos`,
      certeza: 82,
      causa: `Patrón inusual: SH alto (${sh}°C) Y SC alto (${sc}°C) juntos. Esto NO es falta de gas ni exceso — cuando ambos son altos, la válvula de expansión (TXV) no está controlando bien o hay una restricción parcial en el circuito. Con falta de gas el SC sería bajo; con exceso el SH sería bajo. Ambos altos juntos apuntan a la TXV.${ctx}`,
      pasos: [
        "Verificá que no haya filtro deshidratador tapado — un filtro tapado da exactamente este patrón.",
        "Revisá la TXV: el bulbo sensor debe estar bien apoyado sobre la línea de succión y con buen contacto térmico.",
        "Si la TXV tiene ajuste manual: podés abrirla levemente (1/4 vuelta por vez) y esperar 10 minutos para ver si el SH baja.",
        "Verificá que no haya restricción en la línea de líquido — un punto frío/escarcha localizado indica restricción.",
        "Si el equipo tiene capilar (no TXV): el capilar puede estar parcialmente tapado — requiere reemplazo.",
        "Verificá también que no haya mezcla de gases — un gas incorrecto puede dar este patrón."
      ],
      alerta: `⚠️ Este patrón es fácil de confundir con falta de gas. NO cargues gas — el SC alto indica que el condensador ya tiene suficiente masa. Cargar gas empeora el problema.`,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 2: GAS INCORRECTO
    // PSI totalmente fuera de cualquier rango conocido
    // ─────────────────────────────────────────────
    const gasIncorrecto = psi > 0 && (
      (d.gas === "R410A" && psi < 50) ||
      (d.gas === "R32"   && psi < 50) ||
      (d.gas === "R22"   && psi > 200 && a > 0 && ampOk) ||
      (d.gas === "R410A" && psi > 50 && psi < 80 && a > 0)
    );

    if (gasIncorrecto) return this.dx({
      icono: "⚠️🔄",
      titulo: "Posible gas incorrecto — PSI no coincide con el gas seleccionado",
      certeza: 78,
      causa: `El PSI de ${psi} no es consistente con el rango esperado para ${d.gas} (${rango.psiMin}-${rango.psiMax} PSI). Esto puede indicar que el equipo fue cargado con un gas diferente al especificado, o que la plaqueta no coincide con la carga actual.${ctx}`,
      pasos: [
        "Verificá la plaqueta del equipo — confirmá el gas especificado por el fabricante.",
        "Preguntá si el equipo fue cargado recientemente por otro técnico — pueden haber cargado el gas incorrecto.",
        `Para ${d.gas}: PSI de baja normal es ${rango.psiMin}-${rango.psiMax}. El PSI de ${psi} sugiere otro gas.`,
        "Si sospechás gas incorrecto: recuperá todo el gas con recuperadora, hacé vacío, y cargá el gas correcto.",
        "NUNCA mezcles gases sin recuperar — la mezcla contamina todo el sistema y puede dañar el compresor."
      ],
      alerta: `⚠️ Cargar más gas sin verificar qué gas hay adentro puede agravar el problema y contaminar el sistema.`,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 3: COMPRESIÓN BAJA
    // PSI bajo + amp bajo + sin síntomas de fuga
    // + el técnico lo marcó como sospecha
    // ─────────────────────────────────────────────
    const sospechaCompBaja = d.chkCompBaja ||
      (psiBajo && ampBajo && !d.chkFrozen && !d.chkAirflow && psi > rango.psiVacio + 10);

    if (sospechaCompBaja && !shIndicaFaltaGas) return this.dx({
      icono: "📉🔧",
      titulo: "Compresión baja sospechada — prueba necesaria",
      certeza: d.chkCompBaja ? 78 : 65,
      causa: `PSI de ${psi} y amperaje de ${a}A bajos con valores que no muestran síntomas claros de fuga. Cuando la compresión está baja el compresor no genera diferencial de presión suficiente — PSI baja en baja y PSI baja en alta, amperaje bajo porque no comprime bien.${shscTexto()}${ctx}`,
      pasos: [
        "PRUEBA DE COMPRESIÓN: apagá el equipo, esperá 5 minutos para que las presiones se igualen.",
        "Arrancá y observá cuánto tarda la presión de alta en subir en los primeros 30 segundos.",
        "Compresor sano: la presión de alta sube rápido y firme (más de 50 PSI en 10 segundos en R410A).",
        "Compresor con baja compresión: sube lento, o no llega al valor que debería, o tarda más de 2 minutos.",
        "Si la compresión está baja pero el compresor no hace ruidos extraños → válvulas del compresor desgastadas.",
        "Si hay ruido metálico o golpeteo → daño mecánico. El compresor necesita reemplazo."
      ],
      alerta: `⚠️ Antes de dar el diagnóstico de compresión baja: descartá fuga con nitrógeno. Un compresor bueno con fuga da exactamente los mismos valores.`,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 4: FUGA CONFIRMADA POR SH/SC
    // (aunque PSI parezca normal)
    // ─────────────────────────────────────────────
    if (shscFaltaGas && !psiVacio) return this.dx({
      icono: "🔍⚗️",
      titulo: `Gas insuficiente — confirmado por SH/SC`,
      certeza: shMuyAlto && scNeg ? 93 : 87,
      causa: `Datos termodinámicos confirman falta de gas: SH de ${sh}°C (normal 5-12°C) indica que el refrigerante llega muy seco y recalentado al compresor. SC de ${sc}°C ${scNeg ? "— hay vapor en la línea de líquido, el gas no termina de condensarse correctamente" : "— bajo, confirma carga insuficiente"}. El PSI de ${psi} puede parecer aceptable pero el ciclo termodinámico real muestra deficiencia de carga.${ctx}`,
      pasos: [
        "Buscá la fuga ANTES de cargar gas — con este SH/SC el sistema perdió refrigerante.",
        "Inspeccioná con agua jabonosa: flarings, válvulas de servicio y uniones de cañería.",
        "Si no encontrás fuga visible → pressurizá con nitrógeno a 150 PSI.",
        `Reparada la fuga: hacé vacío a 500 micrones y cargá ${d.gas} por peso según plaqueta.`,
        `Verificá que el SH vuelva a 5-12°C y el SC a 4-8°C (ahora SH ${sh}°C${sc !== null ? ", SC "+sc+"°C" : ""}).`
      ],
      alerta: shMuyAlto ? `🔴 SH de ${sh}°C — el compresor está trabajando muy recalentado. La temperatura de descarga puede superar 130°C. Resolvé urgente.` : `⚠️ No cargues gas sin sellar la fuga primero.`,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 5: FUGA SEVERA (PSI VACÍO)
    // ─────────────────────────────────────────────
    if (psiVacio && ampBajo) return this.dx({
      icono: "💨",
      titulo: "Fuga severa — gas casi agotado",
      certeza: 92,
      causa: `PSI de ${psi} en ${d.gas} indica sistema casi sin gas (normal ${rango.psiMin}-${rango.psiMax} PSI). Amperaje de ${a}A bajo confirma que el compresor trabaja casi en vacío.${notaTemp}${shscTexto()}${ctx}`,
      pasos: [
        "🔴 No uses el equipo — el compresor puede quemarse por falta de lubricación.",
        "NO cargues gas sin antes encontrar la fuga.",
        "Pressurizá con nitrógeno a 150 PSI y buscá con agua jabonosa.",
        "Revisá especialmente: flarings, válvulas de servicio, y uniones en el paso por la pared.",
        `Reparada la fuga: vacío mínimo 30 minutos a 500 micrones. Cargá ${d.gas} por peso.`
      ],
      alerta: "🔴 Sin gas el aceite del compresor no circula. Daño posible si siguió funcionando.",
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 6: FUGA LENTA (PSI BAJO + AMP BAJO + FROZEN)
    // ─────────────────────────────────────────────
    if (psiBajo && ampBajo && d.chkFrozen) return this.dx({
      icono: "❄️💨",
      titulo: "Fuga lenta con retorno congelado",
      certeza: shIndicaFaltaGas ? 93 : 88,
      causa: `PSI bajo (${psi} vs normal ${rango.psiMin}-${rango.psiMax}), amperaje bajo (${a}A) y retorno congelado. El retorno congela porque hay poco gas — el refrigerante que queda se expande antes de llegar al evaporador.${notaTemp}${shscTexto()}${ctx}`,
      pasos: [
        "Descongelá el retorno antes de continuar — con hielo no podés medir bien.",
        "Buscá la fuga con agua jabonosa: flarings, válvulas y empalmes.",
        "Reparala y hacé vacío a 500 micrones.",
        `Cargá ${d.gas} por peso según plaqueta.`,
        shIndicaFaltaGas ? `Verificá que el SH baje a 5-12°C (ahora ${sh}°C).` : "Verificá PSI y amperaje después de 15 minutos en régimen."
      ],
      alerta: "⚠️ El retorno congelado NO es señal de frío intenso — es señal de problema.",
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 7: PSI BAJO + AMP BAJO SIN SÍNTOMAS VISUALES
    // ─────────────────────────────────────────────
    if (psiBajo && ampBajo && !d.chkFrozen && !d.chkAirflow) return this.dx({
      icono: "🔍",
      titulo: "Baja presión y amperaje — fuga vs compresión baja",
      certeza: shIndicaFaltaGas ? 84 : 72,
      causa: `PSI de ${psi} (bajo para ${d.gas}) y amperaje de ${a}A (bajo para ${d.frigorias} FG) sin síntomas visuales claros. ${shIndicaFaltaGas ? `SH alto (${sh}°C) inclina el diagnóstico hacia fuga.` : "Hay dos posibles causas: fuga lenta o compresión baja. La prueba de compresión las diferencia."}${notaTemp}${shscTexto()}${ctx}`,
      pasos: [
        "PASO 1 — Prueba de compresión: apagá, esperá 5 min, arrancá y mirá cuánto sube la presión de alta en 30 segundos.",
        "Compresor sano: sube rápido y firme. Compresor con baja compresión: sube lento o no llega.",
        shIndicaFaltaGas ? `PASO 2 — SH alto (${sh}°C) indica falta de gas. Si la compresión está bien → buscá fuga.` : "PASO 2 — Si la compresión está bien → buscá fuga con nitrógeno a 150 PSI.",
        "Revisá especialmente: flarings, soldaduras de cobre y válvulas de servicio.",
        `Objetivo final: PSI ${rango.psiMin}-${rango.psiMax}, amperaje ${amp.min}-${amp.max}A.`
      ],
      alerta: null,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 8: PSI ALTO + AMP ALTO + EXCESO
    // ─────────────────────────────────────────────
    if (psiAlto && ampAlto && d.chkGasExceso) return this.dx({
      icono: "⛽",
      titulo: "Posible exceso de refrigerante",
      certeza: shscExceso ? 90 : 80,
      causa: `PSI alto con amperaje elevado.${shscExceso ? ` SH bajo (${sh}°C) + SC alto (${sc}°C) CONFIRMAN exceso de gas.` : ""}${notaTemp}${shscTexto()}${ctx}`,
      pasos: [
        d.chkCondSucio ? "PRIMERO limpiá el condensador — condensador sucio da síntomas idénticos al exceso." : "Verificá que el condensador esté limpio antes de tocar el gas.",
        "Si el condensador está limpio y el PSI sigue alto → purgá gas de a poco.",
        "Purgar de a 5 PSI, esperar 5 minutos, verificar SH/SC.",
        shscExceso ? `SH ${sh}°C y SC ${sc}°C — buscá que el SH llegue a 5-12°C y el SC a 4-8°C.` : `Objetivo: PSI ${rango.psiMin}-${rango.psiMax} con amperaje ${amp.min}-${amp.max}A.`,
        "⚠️ No purgues con recuperadora no homologada — el gas es costoso y contaminante."
      ],
      alerta: "⚠️ Nunca purgues gas a la atmósfera — usá recuperadora.",
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 9: PSI ALTO + AMP ALTO (CONDENSADOR)
    // ─────────────────────────────────────────────
    if (psiAlto && ampAlto) {
      const altoPorTemp = tempAmb > 38 && !rango._correccionAplicada;
      return this.dx({
        icono: "🔥",
        titulo: "Condensador sobrecargado",
        certeza: d.chkCondSucio ? 95 : 90,
        causa: `PSI de ${psi} (alto, max ${rango.psiMax}) y amperaje de ${a}A (alto, max ${amp.max}A). El condensador no disipa calor correctamente.${d.chkCondSucio ? " Condensador sucio CONFIRMADO." : ""}${altoPorTemp ? ` Temperatura ambiente de ${tempAmb}°C puede estar contribuyendo.` : ""}${notaTemp}${shscTexto()}${ctx}`,
        pasos: [
          "Apagá el equipo. Revisá el condensador exterior — ¿está tapado con pelusa o grasa?",
          "Limpiá las aletas con agua a presión moderada (desde adentro hacia afuera).",
          "Verificá que el ventilador del condensador gire libre y con buen caudal.",
          "Revisá espacio libre alrededor del equipo (mínimo 30cm en todos los lados).",
          tempAmb > 38 ? `Temperatura ambiente de ${tempAmb}°C — con más de 38°C el PSI sube naturalmente. Si después de limpiar el PSI sigue alto pero el amperaje baja, puede ser que el equipo trabaje al límite por la temperatura.` : "Si con condensador limpio el PSI sigue alto → posible exceso de gas."
        ],
        alerta: "⚠️ PSI y amperaje altos sostenidos dañan el compresor. Limpiá el condensador antes de volver a encender.",
        datos: { psi, a, rango, amp, sh, sc }
      });
    }

    // ─────────────────────────────────────────────
    // PATRÓN 10: PSI OK PERO SH INDICA FALTA DE GAS
    // (el caso clásico que confunde: PSI "bien" pero SH/SC mal)
    // ─────────────────────────────────────────────
    if (psiOk && shIndicaFaltaGas) return this.dx({
      icono: "⚗️⚠️",
      titulo: `Gas insuficiente oculto — SH ${sh}°C ${sc !== null ? "/ SC "+sc+"°C" : ""}`,
      certeza: shMuyAlto && scNeg ? 90 : 82,
      causa: `El PSI de ${psi} parece normal pero el análisis termodinámico revela falta de gas: SH de ${sh}°C (normal 5-12°C) indica que el refrigerante llega seco y recalentado al compresor.${sc !== null ? ` SC de ${sc}°C ${scNeg ? "— vapor en la línea de líquido" : "— subcooling insuficiente"}.` : ""} El amperaje de ${a}A ${ampAlto ? `está alto (max ${amp.max}A) — el compresor trabaja forzado` : "está en rango pero el ciclo termodinámico está comprometido"}.${notaTemp}${ctx}`,
      pasos: [
        "Buscá fuga antes de cualquier otra intervención.",
        "Inspeccioná flarings, válvulas de servicio y empalmes de cañería.",
        "Sin fuga visible → pressurizá con nitrógeno a 150 PSI.",
        `Reparada la fuga: hacé vacío a 500 micrones y cargá ${d.gas} por peso.`,
        `Meta: SH 5-12°C y SC 4-8°C (ahora SH ${sh}°C${sc !== null ? ", SC "+sc+"°C" : ""}).`
      ],
      alerta: `⚠️ SH alto con amperaje alto puede indicar temperatura de descarga elevada — el compresor se recalienta internamente.`,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 11: AIRFLOW (PSI OK + AMP OK + FROZEN)
    // ─────────────────────────────────────────────
    if (psiOk && ampOk && d.chkFrozen && d.chkPocofrio && !shIndicaFaltaGas) return this.dx({
      icono: "🌬️",
      titulo: "Problema de airflow — no es el gas",
      certeza: 93,
      causa: `PSI (${psi}) y amperaje (${a}A) en rango normal.${sh !== null ? ` SH de ${sh}°C ${shOk ? "— confirma que el gas está bien" : ""}.` : ""} Retorno congelado con sistema en rango es airflow, no falta de gas.${ctx}`,
      pasos: [
        "Revisá y lavá el filtro de aire del evaporador.",
        "Con el equipo apagado descongelá el evaporador completamente (2 horas mínimo).",
        "Limpiá las aletas del evaporador con espuma limpiadora.",
        "Verificá que la turbina interior gire libre y sin ruidos.",
        "Encendé. Si no vuelve a congelar y enfría bien → era mantenimiento. Si vuelve a congelar → revisá TXV o capilar."
      ],
      alerta: d.chkCondSucio ? "🔥 Condensador sucio también reportado — limpialo también para máxima eficiencia." : null,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 12: RETORNO CONGELADO SIN POCO FRÍO
    // ─────────────────────────────────────────────
    if (psiOk && ampOk && d.chkFrozen && !d.chkPocofrio && !shIndicaFaltaGas) return this.dx({
      icono: "🧊",
      titulo: "Retorno congelado con sistema en rango",
      certeza: 80,
      causa: `PSI y amperaje en rango pero retorno congelado. Sin queja de poco frío, el congelamiento es incipiente — probablemente airflow reducido.${ctx}`,
      pasos: [
        "Revisá el filtro — el retorno congela cuando el aire no pasa bien.",
        "Verificá velocidad del ventilador interior en modo máximo.",
        "Descongelá el evaporador completamente antes de volver a encender.",
        "Si el retorno vuelve a congelar con filtro limpio → puede haber límite de gas o TXV desregulada.",
        sh !== null ? `SH de ${sh}°C — ${shOk ? "gas ok, el problema es airflow" : "revisar carga de gas también"}.` : "Sin datos SH/SC: priorizar airflow primero."
      ],
      alerta: null,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 13: DELTA T BAJO
    // ─────────────────────────────────────────────
    if (psiOk && ampOk && deltaTBajo) return this.dx({
      icono: "🌡️",
      titulo: `Delta T bajo (${deltaT}°C) — transferencia de calor deficiente`,
      certeza: 85,
      causa: `PSI y amperaje en rango pero delta T de ${deltaT}°C (normal: 8-14°C). El evaporador no está transfiriendo bien el calor al aire.${sh !== null ? ` SH de ${sh}°C — ${shOk ? "gas ok, el problema es airflow o evaporador sucio" : "además puede haber déficit leve de gas"}.` : ""}${ctx}`,
      pasos: [
        "Limpiar filtro de aire — paso 1 siempre.",
        "Verificar velocidad de la turbina interior.",
        "Limpiar el evaporador con espuma limpiadora de serpentines.",
        "Verificar que las persianas de distribución de aire funcionen.",
        sh !== null && shIndicaFaltaGas ? `SH alto (${sh}°C) sugiere que además del airflow puede haber un déficit leve de gas.` : "Si con todo limpio el delta T sigue bajo → revisar carga de gas con manómetro y SH/SC."
      ],
      alerta: null,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 14: DELTA T ALTO
    // ─────────────────────────────────────────────
    if (psiOk && ampOk && deltaTAlto) return this.dx({
      icono: "❄️",
      titulo: `Delta T alto (${deltaT}°C) — evaluar exceso o TXV`,
      certeza: shscExceso ? 82 : 70,
      causa: `Delta T de ${deltaT}°C (sobre 14°C). El evaporador absorbe demasiado calor del aire.${shscExceso ? ` SH bajo (${sh}°C) + SC alto (${sc}°C) confirman exceso de gas.` : shscTXV ? ` SH alto (${sh}°C) + SC alto (${sc}°C) apuntan a TXV o restricción.` : ""}${ctx}`,
      pasos: [
        "Verificá que el caudal de aire sea normal (filtros limpios, turbina funcionando).",
        shscExceso ? `SH bajo (${sh}°C) y SC alto (${sc}°C) confirman exceso — purgá gas de a poco monitoreando SH/SC.` : "Medí PSI de alta — si está elevado con PSI de baja normal: posible exceso de gas.",
        shscTXV ? "SH y SC ambos altos — evaluar TXV antes de purgar gas." : "Si el equipo fue cargado recientemente: probable exceso.",
        "Si tiene TXV: verificar calibración del bulbo sensor.",
        "Si tiene capilar: verificar que no haya restricción parcial."
      ],
      alerta: null,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 15: PSI OK + AMP ALTO
    // ─────────────────────────────────────────────
    if (psiOk && ampAlto) return this.dx({
      icono: "⚡🔥",
      titulo: "Amperaje alto con presión normal",
      certeza: 78,
      causa: `PSI en rango (${psi}) pero amperaje de ${a}A supera el máximo (${amp.max}A) para ${d.frigorias} FG.${sh !== null ? ` SH de ${sh}°C — ${shIndicaFaltaGas ? "también hay falta de gas contribuyendo" : "en rango, el problema es eléctrico o mecánico"}.` : ""}${notaTemp}${ctx}`,
      pasos: [
        "Medí tensión en la bornera del compresor: baja tensión = amperaje alto.",
        d.chkCapacitor ? "Capacitor sospechoso — medilo con capacímetro antes que nada." : "Medí el capacitor — un capacitor caído aumenta el consumo del motor.",
        d.chkCondSucio ? "Condensador sucio — limpiarlo reduce el trabajo del compresor." : "Verificá que el ventilador del condensador gire bien.",
        "Tocá la carcasa del compresor: si quema a la mano hay sobrecalentamiento real.",
        "Si todo está ok y sigue alto → devanado del motor con falla incipiente. Medí resistencia de devanados."
      ],
      alerta: "⚠️ Amperaje sostenido sobre el máximo quema el compresor. No dejarlo funcionar hasta resolver.",
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 16: PSI OK + AMP BAJO
    // ─────────────────────────────────────────────
    if (psiOk && ampBajo) return this.dx({
      icono: "📉",
      titulo: "Amperaje bajo con presión aceptable",
      certeza: shIndicaFaltaGas ? 80 : 70,
      causa: `PSI de ${psi} en rango pero amperaje de ${a}A por debajo del mínimo (${amp.min}A).${shIndicaFaltaGas ? ` SH alto (${sh}°C) confirma carga insuficiente — el PSI puede estar en rango pero el ciclo termodinámico está al límite inferior.` : ""}${notaTemp}${shscTexto()}${ctx}`,
      pasos: [
        shIndicaFaltaGas ? "SH alto indica falta de gas — buscá fuga antes de cargar." : "Posible sistema al límite inferior de carga.",
        deltaT !== null ? `Delta T actual: ${deltaT}°C — ${deltaTBajo ? "bajo, confirma baja absorción de calor" : "en rango"}.` : "Verificá delta T: si es menor a 8°C confirma baja absorción.",
        "Verificá que el equipo haya estado 15 minutos en régimen antes de medir.",
        "Si todo indica gas al límite: sellá la fuga, hacé vacío y cargá por peso.",
        `Meta: PSI ${rango.psiMin}-${rango.psiMax}, amp ${amp.min}-${amp.max}A${sh !== null ? `, SH 5-12°C` : ""}.`
      ],
      alerta: null,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // PATRÓN 17: TODO EN RANGO + POCO FRÍO
    // ─────────────────────────────────────────────
    if (psiOk && ampOk && d.chkPocofrio) return this.dx({
      icono: "✅❓",
      titulo: "Sistema en rango — problema no es el gas",
      certeza: 88,
      causa: `PSI (${psi}) y amperaje (${a}A) perfectamente en rango para ${d.frigorias} FG con ${d.gas}.${sh !== null ? ` SH de ${sh}°C${shOk ? " — gas confirmado correcto" : " — revisar"}.` : ""}${notaTemp}${ctx}`,
      pasos: [
        "Limpiar filtros y evaporador — el 40% de los 'poco frío' se resuelven con mantenimiento.",
        deltaT !== null ? `Delta T actual: ${deltaT}°C — ${deltaTBajo ? "bajo, revisá airflow" : deltaTAlto ? "alto, revisá exceso o TXV" : "en rango"}.` : "Medir delta T: debe ser 8-14°C.",
        "Verificar que el modo sea FRÍO (no ventilación o dry) y el setpoint sea menor que la temp ambiente.",
        tempAmb > 35 ? `Temperatura ambiente de ${tempAmb}°C — con tanto calor el equipo puede tardar más en alcanzar el setpoint. Puede ser normal si está subdimensionado para esa carga.` : "Si todo está bien → posible sensor de temperatura o control electrónico.",
        "Si el cliente solo dice 'parece que no enfría tanto' → verificar tamaño del equipo vs m² del ambiente."
      ],
      alerta: d.chkContinuo ? "⚠️ Trabaja continuo — evaluá el dimensionamiento del equipo para ese ambiente." : null,
      datos: { psi, a, rango, amp, sh, sc }
    });

    // ─────────────────────────────────────────────
    // DEFAULT: TODO NORMAL
    // ─────────────────────────────────────────────
    return this.dx({
      icono: "✅",
      titulo: "Sistema operando en parámetros normales",
      certeza: 90,
      causa: `PSI de ${psi} y amperaje de ${a}A dentro del rango para ${d.frigorias} FG con ${d.gas}.${sh !== null ? ` SH de ${sh}°C${sc !== null ? ", SC de "+sc+"°C" : ""} — ${shOk && scOk ? "carga de gas confirmada correcta ✅" : "revisar valores SH/SC"}.` : ""}${notaTemp}${ctx}`,
      pasos: [
        deltaT !== null ? `Delta T medido: ${deltaT}°C — ${deltaTOk ? "correcto ✅" : deltaTBajo ? "bajo, revisá airflow" : "alto, revisá exceso o TXV"}.` : "Medí el delta T (temp entrada − salida del evaporador): debe ser 8-14°C.",
        "Revisá que los filtros estén limpios para máxima eficiencia.",
        "Verificá que el condensador tenga buena ventilación.",
        "Si hay alguna queja de rendimiento → evaluá dimensionamiento del equipo para el ambiente.",
        "Registrá los valores como baseline para futuras visitas."
      ],
      alerta: null,
      datos: { psi, a, rango, amp, sh, sc }
    });

  },

  // ═══════════════════════════════════════════════
  // FORMATEADOR DE RESULTADO
  // ═══════════════════════════════════════════════
  dx({ icono, titulo, certeza, urgencia, causa, pasos, alerta, datos }) {

    const barColor = urgencia === "CRITICO" ? "#ff3333"
      : certeza >= 85 ? "#00d9ff"
      : certeza >= 70 ? "#ff9b42"
      : "#8899aa";

    const { psi, a, rango, amp } = datos;

    const pasosHTML = pasos.map((p, i) => `
      <div class="dx-paso${urgencia === "CRITICO" ? " dx-paso-critico" : ""}">
        <span class="dx-paso-num">${i + 1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");

    const alertaHTML = alerta
      ? `<div class="dx-alerta${urgencia === "CRITICO" ? " dx-alerta-critico" : ""}">${alerta}</div>`
      : "";

    const datosHTML = (psi || a) ? `
      <div class="dx-datos-grid">
        ${psi ? `<div class="dx-dato ${psi < rango.psiMin ? "dx-bajo" : psi > rango.psiMax ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">PSI medido</span>
          <span class="dx-dato-val">${psi}</span>
          <span class="dx-dato-ref">${rango.psiMin}–${rango.psiMax}</span>
        </div>` : ""}
        ${a ? `<div class="dx-dato ${a < amp.min ? "dx-bajo" : a > amp.max ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">AMP medido</span>
          <span class="dx-dato-val">${a}A</span>
          <span class="dx-dato-ref">${amp.min}–${amp.max}A</span>
        </div>` : ""}
        ${datos.sh !== null && datos.sh !== undefined ? `<div class="dx-dato ${datos.sh < 0 ? "dx-alto" : datos.sh < 5 ? "dx-bajo" : datos.sh > 12 ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">SH</span>
          <span class="dx-dato-val">${datos.sh}°C</span>
          <span class="dx-dato-ref">5–12°C</span>
        </div>` : ""}
        ${datos.sc !== null && datos.sc !== undefined ? `<div class="dx-dato ${datos.sc < 0 ? "dx-alto" : datos.sc < 4 ? "dx-bajo" : datos.sc > 8 ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">SC</span>
          <span class="dx-dato-val">${datos.sc}°C</span>
          <span class="dx-dato-ref">4–8°C</span>
        </div>` : ""}
      </div>` : "";

    return { html: `
      <div class="dx-result-card${urgencia === "CRITICO" ? " dx-card-critico" : ""}">

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
