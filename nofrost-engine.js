// =====================================================
// HVAC PRO ARGENTINA
// NOFROST-ENGINE.JS — Diagnóstico clínico v3
// Mejoras: timer deshielo, NTC/sensor, placa con
// flujo propio, inverter vs mecánico, rangos
// estrictos, ventilador con diagnóstico completo
// =====================================================

const NoFrostEngine = {

  rangos: {
    R134a: { psiMin: 0,  psiMax: 5,  psiVacio: -5 },
    R600a: { psiMin: -3, psiMax: 2,  psiVacio: -8 }
  },

  // Rangos de temperatura ESTRICTOS
  // (antes eran demasiado permisivos)
  tempRangos: {
    freezer:      { ok: -18, limite: -12, mal: -5  }, // ok < -18, problema > -12, grave > -5
    heladera:     { ok: 8,   limite: 10,  mal: 14  }, // ok < 8, problema > 10, grave > 14
    evaporador:   { ok: -20, limite: -10, mal: 0   }  // evaporador debe estar MUY frío
  },

  // ═══════════════════════════════════════════════
  // EVALUATE TEMPERATURES con rangos estrictos
  // ═══════════════════════════════════════════════
  evalTemp(d) {
    const tF = d.tempFreezer  !== "" && d.tempFreezer  !== undefined ? Number(d.tempFreezer)  : null;
    const tH = d.tempHeladera !== "" && d.tempHeladera !== undefined ? Number(d.tempHeladera) : null;
    const tE = d.tempEvap     !== "" && d.tempEvap     !== undefined ? Number(d.tempEvap)     : null;

    const r = this.tempRangos;

    return {
      tF, tH, tE,
      ambos: tF !== null && tH !== null,
      // Freezer
      freezerExcelente: tF !== null && tF <= r.freezer.ok,
      freezerBien:      tF !== null && tF < r.freezer.limite,
      freezerLimite:    tF !== null && tF >= r.freezer.limite && tF < r.freezer.mal,
      freezerMal:       tF !== null && tF >= r.freezer.mal,
      // Heladera
      heladeraBien:     tH !== null && tH <= r.heladera.ok,
      heladeraLimite:   tH !== null && tH > r.heladera.ok && tH <= r.heladera.limite,
      heladeraMal:      tH !== null && tH > r.heladera.limite,
      heladeraGrave:    tH !== null && tH > r.heladera.mal,
      // Evaporador
      evapBien:         tE !== null && tE < r.evaporador.limite,
      evapCaliente:     tE !== null && tE >= r.evaporador.mal
    };
  },

  // ═══════════════════════════════════════════════
  // ANALYZE PRINCIPAL
  // ═══════════════════════════════════════════════
  analyze(d) {

    const rango  = this.rangos[d.gas] || this.rangos.R134a;
    const psi    = d.psi  !== "" && d.psi  !== undefined ? Number(d.psi)  : null;
    const a      = d.amp  !== "" && d.amp  !== undefined ? Number(d.amp)  : null;
    const ampMin = 0.9, ampMax = 2.5;

    const T = this.evalTemp(d);

    const psiAlto  = psi !== null && psi > rango.psiMax + 3;
    const psiBajo  = psi !== null && psi < rango.psiMin - 2;
    const psiVacio = psi !== null && psi < rango.psiVacio;
    const psiOk    = psi !== null && psi >= rango.psiMin - 1 && psi <= rango.psiMax + 1;

    const ampAlto  = a !== null && a > ampMax;
    const ampBajo  = a !== null && a > 0 && a < ampMin;
    const ampOk    = a !== null && a >= ampMin && a <= ampMax;

    // Contexto de síntomas
    const sint = [];
    if (d.chkEvapCongelado) sint.push("evaporador congelado");
    if (d.chkVentDetenido)  sint.push("ventilador detenido");
    if (d.chkContinuo)      sint.push("trabaja continuo");
    if (d.chkResistencia)   sint.push("resistencia sospechosa");
    if (d.chkBimetal)       sint.push("bimetal sospechoso");
    if (d.chkTimer)         sint.push("timer sospechoso");
    if (d.chkNTC)           sint.push("sensor NTC sospechoso");
    if (d.chkPlaca)         sint.push("placa con error");
    if (d.chkBurlete)       sint.push("burlete deteriorado");
    if (d.chkEscarcha)      sint.push("escarcha visible");
    if (d.chkInverter)      sint.push("equipo inverter");
    const ctx = sint.length ? ` Síntomas: ${sint.join(", ")}.` : "";

    // ═══════════════════════════════════════════════
    // 1. COMPRESOR NO ARRANCA
    // ═══════════════════════════════════════════════
    if (d.arranca === "no") {

      // Placa bloquea el compresor — en No Frost es muy frecuente
      if (d.chkPlaca) return this.dx({
        icono: "💻❌",
        titulo: "Placa electrónica — posible bloqueo del compresor",
        certeza: 78,
        causa: `En No Frost la placa controla el arranque del compresor. Una placa con falla puede bloquear el arranque aunque el compresor esté sano. Antes de condenar la placa, verificá que todos los sensores y el circuito de deshielo estén ok — una placa "muerta" muchas veces responde a sensores en falla.${ctx}`,
        pasos: [
          "Verificá si la placa tiene LED de error — anotá el patrón de parpadeo (X parpadeos = código específico).",
          "Revisá el fusible de la placa: un fusible quemado es mucho más barato que la placa.",
          "Medí tensión en la alimentación de la placa: debe ser 220V estables.",
          "Desconectá los sensores NTC uno por uno — una placa puede bloquearse por sensor cortocircuitado.",
          "Si la placa tiene modo de prueba (en algunos modelos: combinación de botones) — activalo para forzar el arranque y verificar si el compresor responde.",
          "Si con tensión correcta, fusible ok y sensores ok el compresor sigue sin arrancar → placa averiada."
        ],
        alerta: "⚠️ Antes de cambiar la placa: asegurate de que el compresor arranque con tensión directa. Una placa cara no sirve si el compresor está muerto.",
        datos: { psi, a, rango, T }
      });

      return this.dx({
        icono: "⚡",
        titulo: "Compresor no arranca — diagnóstico eléctrico",
        certeza: 72,
        causa: `En No Frost el compresor puede no arrancar por PTC, Klixon, placa o falla en el sistema de deshielo que activa una protección. El 70% de los no-arranques tienen solución antes del compresor.${ctx}`,
        pasos: [
          "Medí tensión en la toma: debe ser 220V ±10%. Baja tensión impide el arranque.",
          "Revisá el PTC (relay de arranque): retiralo, dejalo enfriar 5 min, medí resistencia — en frío debe ser baja.",
          "Revisá el Klixon (protector térmico): debe tener continuidad con el compresor frío.",
          "Verificá si la placa tiene LED de error o fusible quemado.",
          d.chkInverter
            ? "Equipo INVERTER: el módulo de potencia (IPM) controla el arranque — no confundir con el capacitor de arranque de los ON/OFF. Un IPM dañado impide el arranque completamente."
            : "Si PTC, Klixon y placa están ok → medí devanados del compresor con óhmetro.",
          "Compresor sano: continuidad entre todos los pares de bornes, sin continuidad a masa."
        ],
        alerta: d.chkInverter
          ? "⚡ Inverter: NO tiene capacitor externo de arranque. No lo busques — el módulo IPM maneja el arranque internamente."
          : null,
        datos: { psi, a, rango, T }
      });
    }

    // ═══════════════════════════════════════════════
    // 2. PATRÓN CLÁSICO POR TEMPERATURA
    //    Freezer bien, heladera mal
    //    (con distintos niveles de gravedad)
    // ═══════════════════════════════════════════════

    if (T.ambos && T.freezerBien && T.heladeraMal) {
      const gravedad = T.heladeraGrave ? "grave" : "moderado";
      const certeza  = T.heladeraGrave ? 95 : 90;

      // Cruzar con síntomas para afinar sub-causa
      const subCausa = d.chkEvapCongelado
        ? "evaporador congelado confirmado — es el bloqueo directo del aire"
        : d.chkVentDetenido
          ? "ventilador del evaporador detenido — el frío no circula"
          : d.chkResistencia || d.chkBimetal || d.chkTimer
            ? "falla en el sistema de deshielo — el evaporador se congela gradualmente"
            : "sistema de deshielo sospechoso — el evaporador probablemente esté congelado";

      return this.dx({
        icono: "🌬️❄️",
        titulo: `Freezer ${T.tF}°C ✅ — Heladera ${T.tH}°C ❌ (${gravedad})`,
        certeza,
        causa: `Patrón clásico de No Frost: el freezer enfría correctamente (${T.tF}°C) pero la heladera está a ${T.tH}°C (normal: 3-8°C). El frío se genera en el evaporador del freezer y debe circular hacia la heladera. Si no llega, hay bloqueo de aire. Sub-causa más probable: ${subCausa}.${ctx}`,
        pasos: [
          "PASO 1 — Deshielo manual forzado: desconectá el equipo 24-48 horas con puertas abiertas.",
          "Si después del deshielo la heladera enfría aunque sea 6-12 horas → CONFIRMADO: sistema de deshielo fallado.",
          d.chkResistencia
            ? "PASO 2 — Medí la resistencia de deshielo con óhmetro (desconectada): debe medir entre 20-80Ω según modelo. Si mide infinito (∞) → resistencia quemada."
            : "PASO 2 — Revisá la resistencia de deshielo: medí con óhmetro, debe tener continuidad (20-80Ω).",
          d.chkBimetal
            ? "PASO 3 — Bimetal sospechoso: debe tener continuidad cuando está frío. Si está abierto en frío → quemado."
            : "PASO 3 — Revisá el bimetal (termostato de deshielo): debe cerrar en frío y abrir cuando se calienta.",
          d.chkTimer
            ? "PASO 4 — Timer de deshielo sospechoso: giralo manualmente hasta que el compresor se detenga y la resistencia encienda. Si no ocurre → timer fallado."
            : "PASO 4 — Verificá el timer o placa de deshielo: debe iniciar el ciclo de deshielo cada 8-12 horas.",
          d.chkVentDetenido
            ? "PASO 5 — Ventilador detenido: verificar si recibe tensión. Sin tensión → placa o interruptor de puerta. Con tensión → motor quemado."
            : "PASO 5 — Verificá que el ventilador del evaporador gire cuando el compresor está corriendo."
        ],
        alerta: T.heladeraGrave
          ? `⚠️ Heladera a ${T.tH}°C — temperatura de riesgo para alimentos. Evacuá lo perecedero antes de hacer el deshielo de 24-48hs.`
          : null,
        datos: { psi, a, rango, T }
      });
    }

    // ═══════════════════════════════════════════════
    // 3. FREEZER EN LÍMITE (no tan frío como debería)
    //    Problema incipiente — hay que detectarlo temprano
    // ═══════════════════════════════════════════════
    if (T.ambos && T.freezerLimite && T.heladeraBien) return this.dx({
      icono: "🌡️⚠️",
      titulo: `Freezer al límite (${T.tF}°C) — problema incipiente`,
      certeza: 80,
      causa: `El freezer a ${T.tF}°C está por encima del rango ideal (-18°C a -12°C) pero la heladera todavía enfría bien (${T.tH}°C). Es un problema incipiente — si no se trata, progresa al patrón clásico de heladera caliente. En No Frost, el freezer al límite con heladera bien suele ser falta de gas lenta o condensador sucio.${ctx}`,
      pasos: [
        "Revisá el condensador (parte trasera o inferior) — si está cubierto de polvo, limpialo con aspiradora.",
        "Verificá que el compresor funcione sin ruidos extraños y que el ciclo de encendido/apagado sea normal.",
        psi !== null ? `PSI de ${psi} — ${psiOk ? "en rango, el gas está bien" : psiBajo ? "bajo, posible fuga lenta" : "revisar"}.` : "Si tenés manómetro: conectá y verificá el PSI de proceso.",
        "Revisá el burlete de la puerta del freezer: si entra aire caliente, el freezer pierde temperatura.",
        "Si el condensador está limpio y el PSI está bien → puede ser inicio de falla en el ciclo de deshielo. Hacé el deshielo manual y monitoreá."
      ],
      alerta: null,
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 4. AMBOS MAL — fuga o compresor
    // ═══════════════════════════════════════════════
    if (T.ambos && T.freezerMal && T.heladeraMal) return this.dx({
      icono: "❌❌",
      titulo: `Sin frío en ningún lado — Freezer ${T.tF}°C, Heladera ${T.tH}°C`,
      certeza: psiVacio ? 93 : 82,
      causa: `Ni el freezer (${T.tF}°C) ni la heladera (${T.tH}°C) están en temperatura. Cuando AMBAS zonas fallan en No Frost, el problema está antes del evaporador: sistema refrigerante (fuga), compresor, o parte eléctrica.${psiVacio ? ` PSI de ${psi} confirma sistema casi sin gas.` : ""}${ctx}`,
      pasos: [
        "Primero verificá que el compresor esté corriendo — palpá la cañería de descarga, debe estar caliente.",
        psiVacio
          ? `PSI de ${psi} indica fuga severa. Buscá la fuga con nitrógeno antes de cargar gas.`
          : "Si corre: conectá manómetro en el proceso del compresor para verificar presión.",
        "En No Frost la fuga más frecuente es en el evaporador (tubitos finos de aluminio — corrosión o golpe).",
        "Si el compresor no corre: diagnóstico eléctrico — PTC, Klixon, placa.",
        d.gas === "R600a"
          ? "🔴 R600a es INFLAMABLE — ventilá el área antes de trabajar. No enciendas nada eléctrico cerca."
          : `Una vez reparada la fuga: vacío mínimo 30 minutos. Cargá ${d.gas} por peso según plaqueta.`
      ],
      alerta: d.gas === "R600a" ? "🔴 R600a (isobutano) es ALTAMENTE INFLAMABLE. Ventilación obligatoria antes de trabajar." : null,
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 5. EVAPORADOR CONGELADO VISIBLE
    // ═══════════════════════════════════════════════
    if (d.chkEvapCongelado) return this.dx({
      icono: "🧊🔴",
      titulo: "Evaporador congelado — sistema de deshielo fallado",
      certeza: 93,
      causa: `El evaporador está congelado como bloque de hielo. Esto confirma que el ciclo de deshielo automático no está funcionando. El hielo bloquea completamente el paso de aire — por eso la heladera no enfría aunque el freezer esté frío.${ctx}`,
      pasos: [
        "Desconectá el equipo INMEDIATAMENTE — el compresor trabajando con el evaporador congelado no sirve.",
        "Deshielo manual: 24-48 horas sin corriente con puertas abiertas. NO usar soplete ni secador caliente.",
        "Una vez descongelado, con el equipo apagado: medí la resistencia de deshielo (debe ser 20-80Ω).",
        d.chkResistencia
          ? "Resistencia sospechosa marcada — si mide infinito (∞) o tiene quemaduras visibles → reemplazarla."
          : "Si la resistencia está ok → revisá el bimetal y el timer de deshielo.",
        d.chkBimetal
          ? "Bimetal marcado como sospechoso: debe tener continuidad cuando está frío. Si está abierto → quemado."
          : "Bimetal: verificar continuidad en frío. Si falla → el ciclo de deshielo no puede completarse.",
        d.chkTimer
          ? "Timer sospechoso: giralo manualmente para forzar el ciclo de deshielo. Si la resistencia no enciende → timer muerto."
          : "Revisá el timer de deshielo: giralo hasta que corte el compresor. Si no ocurre → timer fallado.",
        "Reconectá y monitoreá — si en 48 horas vuelve a congelarse: el sistema de deshielo sigue fallando."
      ],
      alerta: "⚠️ NO acelerés el deshielo con soplete, agua caliente ni secador sobre el evaporador — podés pinchar los tubos de aluminio y arruinar el equipo.",
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 6. SENSOR NTC FALLADO
    //    NTC incorrecto → temperatura equivocada →
    //    el equipo enfría de más o de menos
    // ═══════════════════════════════════════════════
    if (d.chkNTC) return this.dx({
      icono: "🌡️💻",
      titulo: "Sensor NTC sospechoso — temperatura mal leída",
      certeza: 82,
      causa: `El sensor NTC (termistor) es el termómetro que usa la placa para saber cuánto frío hay dentro. Si falla, la placa puede: (a) creer que está más frío de lo real → cortar el compresor antes de tiempo → heladera no enfría. O (b) creer que está más caliente → no cortar nunca → enfriamiento excesivo o compresor continuo.${ctx}`,
      pasos: [
        "Localizá el NTC — suele ser un pequeño componente encapsulado en plástico o metal, con dos cables, pegado a la pared del interior o en el evaporador.",
        "Medí su resistencia con óhmetro a temperatura ambiente (~20°C): los valores típicos son 5kΩ-15kΩ según modelo.",
        "Para confirmar: metelo en agua con hielo (0°C) — la resistencia debe SUBIR significativamente (puede llegar a 30-50kΩ). Si no cambia → NTC muerto.",
        "También podés comparar con el valor que muestra la placa (si tiene display de temperatura) vs el termómetro real — si difieren más de 5°C → NTC fuera de calibración o fallado.",
        "Si el NTC está bien eléctricamente pero el equipo no controla la temperatura correctamente → placa o termostato.",
        "Reemplazá el NTC con uno del mismo valor nominal — un NTC incorrecto da temperaturas erróneas."
      ],
      alerta: "💡 En No Frost suele haber 2-3 NTC: uno en la heladera, uno en el freezer y uno en el evaporador. Si sospechás falla, verificá todos.",
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 7. TIMER DE DESHIELO — caso propio
    //    Falla frecuente, enterrada en otros casos
    // ═══════════════════════════════════════════════
    if (d.chkTimer && !d.chkEvapCongelado) return this.dx({
      icono: "⏱️❄️",
      titulo: "Timer de deshielo sospechoso",
      certeza: 85,
      causa: `El timer de deshielo es el componente que inicia el ciclo de deshielo automático cada 8-12 horas. Cuando falla, el ciclo de deshielo nunca ocurre y el evaporador se congela progresivamente hasta bloquear el paso de aire. Es una falla frecuente en No Frost con más de 5 años de uso.${ctx}`,
      pasos: [
        "Para probar el timer: giralo manualmente en sentido horario con una moneda hasta que escuchés un clic — el compresor debe detenerse y la resistencia de deshielo debe encender.",
        "Si el compresor para pero la resistencia no enciende → la resistencia o el bimetal están fallados (no el timer).",
        "Si el compresor NO para al girar el timer → el timer está trabado o muerto.",
        "Para confirmar: medí continuidad entre los bornes del timer en la posición de deshielo — debe tener continuidad entre los bornes de la resistencia.",
        "En modelos modernos el timer es reemplazado por la placa electrónica — si es así, revisá la programación de deshielo de la placa.",
        "Timer nuevo: reemplazalo por uno con el mismo tiempo de ciclo (en horas) y el mismo tiempo de deshielo (en minutos)."
      ],
      alerta: "💡 Girar el timer manualmente no daña el equipo — es el procedimiento estándar de diagnóstico de deshielo.",
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 8. PLACA ELECTRÓNICA — flujo diagnóstico propio
    //    No acusar a la placa sin verificar primero
    // ═══════════════════════════════════════════════
    if (d.chkPlaca) return this.dx({
      icono: "💻⚠️",
      titulo: "Placa electrónica — diagnóstico antes de reemplazar",
      certeza: 70,
      causa: `La placa es el cerebro del No Frost — controla el compresor, el ventilador, el ciclo de deshielo y la temperatura. Pero también es lo más caro. Antes de reemplazarla hay que verificar que no sea un componente externo que la está haciendo fallar.${ctx}`,
      pasos: [
        "PASO 1 — Revisá el fusible de la placa: es el componente más barato (1-5$) y el más frecuente. Si está quemado → reemplazalo.",
        "PASO 2 — Verificá la tensión de alimentación: la placa necesita 220V estables. Con tensión por debajo de 190V puede comportarse erraticamente.",
        "PASO 3 — Revisá los sensores NTC: un NTC cortocircuitado puede 'quemar' la placa o hacer que se comporte extraño. Desconectalos uno por uno y observá si el comportamiento cambia.",
        "PASO 4 — Anotá el código de error si lo hay: buscar ese código específico en la documentación de la marca.",
        "PASO 5 — Si la placa tiene visibles componentes quemados (manchas negras, capacitores inflados) → reemplazo necesario.",
        "PASO 6 — Si nada de lo anterior → probar con placa equivalente (de un equipo similar en desuso o placa genérica compatible) antes de comprar la original."
      ],
      alerta: d.chkInverter
        ? "⚡ Inverter: la placa inverter incluye el módulo de potencia (IPM). Verificar el IPM con el procedimiento específico del fabricante antes de reemplazar toda la placa."
        : "💡 Una placa nueva para No Frost puede costar entre $30.000-$150.000. Agotá todas las opciones antes de reemplazarla.",
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 9. VENTILADOR DETENIDO — diagnóstico completo
    // ═══════════════════════════════════════════════
    if (d.chkVentDetenido) return this.dx({
      icono: "🌬️❌",
      titulo: "Ventilador del evaporador detenido",
      certeza: 88,
      causa: `Sin el ventilador del evaporador, el frío generado no circula. El freezer puede enfriar un poco (por convección natural) pero la heladera no recibe aire frío. Tres causas posibles: motor muerto, sin tensión (placa o interruptor de puerta), o trabado por hielo.${ctx}`,
      pasos: [
        "PRIMERO: verificá si el evaporador tiene hielo acumulado alrededor del motor — si está congelado, el motor puede estar trabado por el hielo (no muerto). Hacé el deshielo manual primero.",
        "Una vez descongelado: con el equipo funcionando, verificá si el ventilador recibe tensión (normalmente 12V DC o 220V AC según modelo).",
        "Sin tensión → placa o interruptor de puerta fallado. En muchos modelos el interruptor de puerta corta el ventilador cuando la puerta está abierta — probá con puerta CERRADA.",
        "Con tensión y ventilador que no gira → motor quemado. Medí la resistencia del bobinado: si es infinito (∞) o está en cortocircuito → reemplazo.",
        "Motor que gira lento o con ruido → rodamiento desgastado o alabes del ventilador rozando el hielo.",
        "Reemplazá el motor con uno de las mismas especificaciones (voltaje, potencia y sentido de giro)."
      ],
      alerta: "⚠️ No encendas el equipo con el ventilador del evaporador desmontado — el evaporador se congela muy rápido sin circulación de aire.",
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 10. FUGA — PSI VACÍO
    // ═══════════════════════════════════════════════
    if (psiVacio) return this.dx({
      icono: "💨",
      titulo: "Fuga severa — sistema sin gas",
      certeza: 90,
      causa: `PSI de ${psi} indica sistema prácticamente sin gas. El compresor corre pero no puede enfriar nada.${a !== null ? ` Amperaje de ${a}A ${a < ampMin ? "bajo — confirma poco trabajo del compresor sin gas que comprimir" : "en rango"}.` : ""}${ctx}`,
      pasos: [
        "Buscá la fuga antes de cargar gas — el gas se va a volver a escapar.",
        "En No Frost la fuga más frecuente es en el evaporador de aluminio — revisar visualmente si hay manchas de aceite.",
        "Pressurizá con nitrógeno seco y buscá con agua jabonosa en todas las uniones.",
        "Si el evaporador está pinchado puede ser necesario reemplazarlo.",
        `Vacío mínimo 30 minutos a 500 micrones antes de cargar ${d.gas} por peso según plaqueta.`,
        d.gas === "R600a" ? "🔴 R600a INFLAMABLE — ventilación obligatoria. Sin llamas ni chispas." : ""
      ].filter(Boolean),
      alerta: d.gas === "R600a" ? "🔴 R600a (isobutano) es INFLAMABLE. No trabajés con llama ni en espacios cerrados." : null,
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 11. CONDENSADOR ALTO + AMP ALTO
    // ═══════════════════════════════════════════════
    if (psiAlto && ampAlto) return this.dx({
      icono: "🔥",
      titulo: "Alta presión — condensador sobrecargado",
      certeza: 85,
      causa: `PSI de ${psi} elevado y amperaje de ${a}A alto. El condensador (la grilla negra en la parte trasera o inferior) no está disipando calor correctamente.${ctx}`,
      pasos: [
        "Apagá el equipo y revisá el condensador — ¿está cubierto de pelusa y polvo?",
        "Limpiá con aspiradora con cepillo fino — no doblés las aletas.",
        "Verificá que haya espacio libre detrás y arriba de la heladera (mínimo 5cm).",
        "Si tiene ventilador de condensador (algunos modelos) verificá que gire.",
        "Después de limpiar dejá funcionar 2 horas y volvé a medir."
      ],
      alerta: null,
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 12. COMPRESOR CONTINUO + PSI OK
    // ═══════════════════════════════════════════════
    if (d.chkContinuo && psiOk) return this.dx({
      icono: "🔄",
      titulo: "Compresor continuo — revisar control y sellado",
      certeza: 72,
      causa: `Compresor que nunca para con PSI en rango. El sistema refrigerante está bien — el problema es que el equipo no llega al punto de corte.${T.tH !== null ? ` Heladera a ${T.tH}°C — ${T.heladeraMal ? "por encima del setpoint, el equipo sigue pidiendo frío" : "en rango, el control puede estar mal calibrado"}.` : ""}${T.tF !== null ? ` Freezer a ${T.tF}°C.` : ""}${ctx}`,
      pasos: [
        "Revisá el burlete de la puerta — pasá un papel con la puerta cerrada, no debe salir fácil.",
        "Verificá los sensores NTC: si el sensor cree que la temperatura es mayor de lo real, sigue pidiendo frío.",
        d.chkInverter
          ? "Equipo INVERTER: el modo continuo puede ser intencional en días de mucho calor. Verificá que la temperatura interior real esté dentro del rango — si está bien, puede ser comportamiento normal."
          : "Revisá el termostato o placa: puede estar en modo continuo por error de programación.",
        "Medí la temperatura real interior con termómetro calibrado y compará con el display del equipo.",
        "Si la temperatura real es correcta pero el equipo sigue corriendo → sensor NTC o placa fuera de calibración."
      ],
      alerta: d.chkInverter
        ? "💡 Los equipos inverter modulan la velocidad del compresor — trabajar 'continuo' en baja velocidad es normal. Verificá que la temperatura interior esté bien antes de diagnosticar falla."
        : null,
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 13. ESCARCHA CON TEMPERATURAS NORMALES
    //     Burlete o humedad ambiental
    // ═══════════════════════════════════════════════
    if (d.chkEscarcha && T.ambos && T.freezerBien && T.heladeraBien) return this.dx({
      icono: "❄️🚪",
      titulo: "Escarcha con temperaturas normales — burlete o humedad",
      certeza: 78,
      causa: `El sistema enfría bien (Freezer ${T.tF}°C, Heladera ${T.tH}°C) pero hay escarcha visible. Con temperaturas normales, la escarcha indica entrada de humedad — generalmente por burlete deteriorado o apertura muy frecuente de la puerta.${ctx}`,
      pasos: [
        "Revisá el burlete en todo el perímetro de ambas puertas — debe adherirse completamente sin huecos.",
        "Hacé la prueba del papel: introducí una hoja con la puerta cerrada y tirá. Si sale fácil → el burlete no sella.",
        "Verificá que las puertas no queden entrabiertas por sobrestock o bandejas mal colocadas.",
        "En climas costeros o muy húmedos la escarcha es más frecuente — puede ser normal.",
        "Si la escarcha crece rápido y los ciclos de deshielo no la eliminan completamente → revisar sistema de deshielo.",
        d.chkBurlete ? "Burlete deteriorado confirmado — reemplazalo. El burlete es económico y hace una gran diferencia." : ""
      ].filter(Boolean),
      alerta: null,
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 14. RESISTENCIA + BIMETAL SOSPECHOSOS
    //     Sin otras evidencias → test guiado
    // ═══════════════════════════════════════════════
    if ((d.chkResistencia || d.chkBimetal) && !d.chkEvapCongelado) return this.dx({
      icono: "🔌🌡️",
      titulo: "Circuito de deshielo — test de componentes",
      certeza: 80,
      causa: `La resistencia de deshielo y el bimetal (termostato de deshielo) son los componentes activos del ciclo de deshielo. ${d.chkResistencia && d.chkBimetal ? "Ambos están marcados como sospechosos — están en serie, así que si uno falla el ciclo no ocurre." : d.chkResistencia ? "La resistencia es el elemento que genera el calor para descongelar." : "El bimetal corta el calor cuando el evaporador alcanza temperatura — si falla abierto, el deshielo nunca ocurre."}${ctx}`,
      pasos: [
        "Con el equipo DESCONECTADO de la corriente:",
        d.chkResistencia
          ? "Resistencia de deshielo: medí con óhmetro entre sus dos terminales. Normal: 20-80Ω según modelo. Si mide infinito (∞) → quemada."
          : "Verificá la resistencia de deshielo: 20-80Ω es el rango normal.",
        d.chkBimetal
          ? "Bimetal: medí continuidad cuando está frío — DEBE tener continuidad (0Ω). Si está abierto en frío → quemado."
          : "Verificá el bimetal: debe cerrar en frío y abrir cuando alcanza ~70°C.",
        "Si la resistencia está ok y el bimetal está ok → el timer o la placa no están iniciando el ciclo.",
        "Para forzar el ciclo: girá el timer hasta que el compresor se detenga y verificá que la resistencia encienda (debe calentar en 1-2 minutos).",
        "Si el deshielo forzado funciona → el timer no inicia el ciclo automáticamente → timer o placa fallados."
      ],
      alerta: null,
      datos: { psi, a, rango, T }
    });

    // ═══════════════════════════════════════════════
    // 15. TODO OK — sin síntomas ni datos anormales
    // ═══════════════════════════════════════════════
    return this.dx({
      icono: "✅",
      titulo: T.ambos
        ? `Sistema normal — Freezer ${T.tF}°C, Heladera ${T.tH}°C`
        : "Sistema operando correctamente",
      certeza: T.ambos ? 90 : 75,
      causa: `${T.ambos ? `Freezer a ${T.tF}°C y heladera a ${T.tH}°C — ambas en rango normal.` : "Los parámetros disponibles están dentro de los rangos normales."} El sistema refrigerante y el ciclo de deshielo parecen estar funcionando correctamente.${psi !== null ? ` PSI de ${psi} en rango para ${d.gas}.` : ""}${ctx}`,
      pasos: [
        "Verificá el ciclo de deshielo: el equipo debe hacer deshielo automático cada 8-12 horas.",
        "Revisá el burlete de puertas como mantenimiento preventivo.",
        "Limpiá el condensador (parte trasera/inferior) con aspiradora.",
        "Si el cliente reporta problema intermitente: dejá un termómetro adentro y revisá en 24 horas.",
        "Anotá las temperaturas actuales como baseline para futuras visitas."
      ],
      alerta: null,
      datos: { psi, a, rango, T }
    });

  },

  // ═══════════════════════════════════════════════
  // FORMATEADOR
  // ═══════════════════════════════════════════════
  dx({ icono, titulo, certeza, causa, pasos, alerta, datos }) {
    const barColor = certeza >= 88 ? "#00d9ff" : certeza >= 72 ? "#ff9b42" : "#8899aa";
    const { psi, a, rango, T } = datos;

    const pasosHTML = pasos.map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i + 1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");

    const alertaHTML = alerta ? `<div class="dx-alerta">${alerta}</div>` : "";

    const tempHTML = (T.tF !== null || T.tH !== null) ? `
      <div class="dx-datos-grid">
        ${T.tF !== null ? `<div class="dx-dato ${T.freezerMal ? "dx-alto" : T.freezerLimite ? "dx-bajo" : "dx-ok"}">
          <span class="dx-dato-label">Freezer</span>
          <span class="dx-dato-val">${T.tF}°C</span>
          <span class="dx-dato-ref">-18 a -12°C</span>
        </div>` : ""}
        ${T.tH !== null ? `<div class="dx-dato ${T.heladeraGrave ? "dx-alto" : T.heladeraMal ? "dx-bajo" : "dx-ok"}">
          <span class="dx-dato-label">Heladera</span>
          <span class="dx-dato-val">${T.tH}°C</span>
          <span class="dx-dato-ref">3 a 8°C</span>
        </div>` : ""}
        ${psi !== null ? `<div class="dx-dato ${psi < rango.psiMin ? "dx-bajo" : psi > rango.psiMax ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">PSI</span>
          <span class="dx-dato-val">${psi}</span>
          <span class="dx-dato-ref">${rango.psiMin} a ${rango.psiMax}</span>
        </div>` : ""}
        ${a !== null ? `<div class="dx-dato ${a < 0.9 ? "dx-bajo" : a > 2.5 ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">AMP</span>
          <span class="dx-dato-val">${a}A</span>
          <span class="dx-dato-ref">0.9–2.5A</span>
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
        ${tempHTML}
        ${alertaHTML}
        <div class="dx-pasos-titulo">📋 Pasos de intervención:</div>
        ${pasosHTML}
      </div>`};
  }
};
