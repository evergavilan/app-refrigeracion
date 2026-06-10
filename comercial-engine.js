// =====================================================
// HVAC PRO ARGENTINA
// COMERCIAL-ENGINE.JS — Diagnóstico clínico v3
// Mejoras: válvula solenoide, filtro deshidratador,
// presostato calibrado, tipo de equipo, temp evap,
// temp ambiente como factor, gas incorrecto,
// Klixon diferenciado, R404A reconversión
// =====================================================

const ComercialEngine = {

  rangos: {
    R404A: { psiMin: 18, psiMax: 28, psiVacio: 8,  psiAltaMin: 200, psiAltaMax: 280 },
    R134a: { psiMin: 0,  psiMax: 5,  psiVacio: -5, psiAltaMin: 100, psiAltaMax: 140 },
    R22:   { psiMin: 55, psiMax: 75, psiVacio: 30, psiAltaMin: 200, psiAltaMax: 260 },
    R448A: { psiMin: 22, psiMax: 35, psiVacio: 12, psiAltaMin: 220, psiAltaMax: 300 }
  },

  amperajes: {
    "1/3": { min: 2.0, max: 3.5 },
    "1/2": { min: 2.5, max: 4.5 },
    "3/4": { min: 3.5, max: 6.0 },
    "1":   { min: 5.0, max: 8.0 },
    "1.5": { min: 7.0, max: 11.0 },
    "2":   { min: 9.0, max: 14.0 }
  },

  // Temperatura objetivo por tipo de equipo
  tempObjetivo: {
    "exhibidora_abierta": { min: 2,  max: 8,  label: "2°C a 8°C" },
    "exhibidora_cerrada": { min: 2,  max: 8,  label: "2°C a 8°C" },
    "camara_positiva":    { min: 0,  max: 6,  label: "0°C a 6°C" },
    "camara_negativa":    { min: -20, max: -15, label: "-20°C a -15°C" },
    "bajo_mesada":        { min: 2,  max: 8,  label: "2°C a 8°C" },
    "heladera_comercial": { min: 3,  max: 8,  label: "3°C a 8°C" }
  },

  // Corrección de rango por temperatura ambiente
  // En comercial cada 5°C sobre 25°C → +3-5 PSI en baja
  corregirRangoPorTemp(rango, tempAmb) {
    if (!tempAmb || tempAmb <= 25) return rango;
    const delta = Math.max(0, (tempAmb - 25) / 5);
    const corr  = Math.round(delta * 4);
    return {
      ...rango,
      psiMin: rango.psiMin + corr,
      psiMax: rango.psiMax + corr,
      _corr: corr,
      _tempAmb: tempAmb
    };
  },

  analyze(d) {

    const rangoBase  = this.rangos[d.gas] || this.rangos.R404A;
    const tempAmb    = Number(d.tempAmbiente) || 0;
    const rango      = this.corregirRangoPorTemp(rangoBase, tempAmb);
    const amp        = this.amperajes[d.hp] || this.amperajes["1/2"];
    const psi        = Number(d.psi) || 0;
    const psiAlta    = Number(d.psiAlta) || 0;
    const a          = Number(d.amp) || 0;
    const tempEvap   = d.tempEvap !== "" && d.tempEvap !== undefined ? Number(d.tempEvap) : null;
    const tempLocal  = d.tempLocal !== "" && d.tempLocal !== undefined ? Number(d.tempLocal) : null;
    const tipoEquipo = d.tipoEquipo || "exhibidora_cerrada";
    const objTemp    = this.tempObjetivo[tipoEquipo] || this.tempObjetivo["exhibidora_cerrada"];

    const psiAltoB  = psi > rango.psiMax;
    const psiBajoB  = psi > 0 && psi < rango.psiMin;
    const psiVacioB = psi > 0 && psi < rango.psiVacio;
    const psiOkB    = psi >= rango.psiMin && psi <= rango.psiMax;

    const ampAlto = a > amp.max;
    const ampBajo = a > 0 && a < amp.min;
    const ampOk   = a >= amp.min && a <= amp.max;

    // Temperatura evaporador — en cámara negativa debe estar muy baja
    const esCamaraNeg = tipoEquipo === "camara_negativa";
    const evapTempOk  = tempEvap !== null && (
      esCamaraNeg ? tempEvap < -25 : tempEvap < -5
    );
    const evapCaliente = tempEvap !== null && (
      esCamaraNeg ? tempEvap > -15 : tempEvap > 5
    );

    // Nota de corrección por temperatura ambiente
    const notaTemp = rango._corr
      ? ` ⚙️ Rangos ajustados por temperatura ambiente ${tempAmb}°C (+${rango._corr} PSI).`
      : "";

    // Contexto de síntomas
    const sint = [];
    if (d.chkCondSucio)     sint.push("condensador sucio");
    if (d.chkEvapCongelado) sint.push("evaporador congelado");
    if (d.chkNoTemp)        sint.push("no alcanza temperatura");
    if (d.chkContinuo)      sint.push("trabaja continuo");
    if (d.chkCapacitor)     sint.push("capacitor sospechoso");
    if (d.chkPresostato)    sint.push("presostato disparado");
    if (d.chkVentCond)      sint.push("ventilador condensador detenido");
    if (d.chkSolenoide)     sint.push("válvula solenoide sospechosa");
    if (d.chkFiltro)        sint.push("filtro deshidratador sospechoso");
    if (d.chkDeshielo)      sint.push("sistema deshielo sospechoso");
    if (d.chkTermico)       sint.push("protector térmico disparado");
    if (tempAmb > 35)       sint.push(`temperatura ambiente ${tempAmb}°C`);
    if (tempEvap !== null)  sint.push(`evaporador ${tempEvap}°C`);
    if (tempLocal !== null) sint.push(`local ${tempLocal}°C`);
    const ctx = sint.length ? ` Síntomas: ${sint.join(", ")}.` : "";

    // ═══════════════════════════════════════════════
    // 1. COMPRESOR NO ARRANCA
    // ═══════════════════════════════════════════════
    if (d.arranca === "no") {

      if (d.chkPresostato) return this.dx({
        icono: "🔴",
        titulo: "Presostato de alta disparado — equipo bloqueado",
        certeza: 90,
        causa: `El presostato de alta se disparó como protección. El compresor está bloqueado hasta que se resetee. Hay que encontrar la causa del disparo ANTES de resetear — si no, el presostato se vuelve a disparar y se daña.${ctx}`,
        pasos: [
          "NO resetees todavía. Primero revisá el condensador — si está tapado, esa es la causa.",
          d.chkCondSucio ? "Condensador sucio CONFIRMADO — limpiarlo primero, luego resetear." : "Limpiá el condensador completamente (agua a presión moderada desde adentro hacia afuera).",
          "Verificá que el ventilador del condensador gire libre y a buena velocidad.",
          "Revisá temperatura ambiente del local donde está el condensador — si supera 40°C puede dispararse aunque esté limpio.",
          "Con condensador limpio y ventilador ok: resetear el presostato (botón rojo).",
          "Si se vuelve a disparar después de limpiar → medí el PSI de alta con manifold. Si sigue alto con condensador limpio → posible exceso de gas o presostato descalibrado.",
          "Para verificar calibración del presostato: comparar el PSI real de corte vs el PSI de ajuste del presostato (está en la tapa)."
        ],
        alerta: "⚠️ Resetear sin resolver la causa va a quemar el presostato. En Argentina los presostatos de alta se descalibran con los años — si el PSI real está normal y el presostato sigue disparándose, puede necesitar ajuste o reemplazo.",
        datos: { psi, a, rango, amp, tempEvap, tempLocal }
      });

      if (d.chkCapacitor) return this.dx({
        icono: "🔋",
        titulo: "Capacitor — falla más frecuente en arranque",
        certeza: 87,
        causa: `En refrigeración comercial el capacitor es la falla de arranque más común. El trabajo intensivo (ciclos continuos) y el calor lo fatigan rápido.${d.chkTermico ? " Protector térmico también disparado — puede haberse abierto POR el motor esforzado con capacitor caído." : ""}${ctx}`,
        pasos: [
          "Descargá el capacitor antes de tocarlo (resistencia 10kΩ entre bornes).",
          "Medí con capacímetro — en comercial suelen ser 25-55 µF según HP. Tolerancia ±10%.",
          "Si está por debajo del nominal → reemplazar con valor EXACTO.",
          "Con capacitor nuevo probá el arranque.",
          "Si sigue sin arrancar: medí tensión en la bornera del compresor. Debe ser 220V (mono) o 380V (tri) ±10%.",
          "Revisá el contactor o relay — los contactos deben cerrar cuando el termostato pide frío.",
          "Si hay tensión, capacitor ok y contactos cierran → Klixon o devanados del compresor."
        ],
        alerta: null,
        datos: { psi, a, rango, amp, tempEvap, tempLocal }
      });

      if (d.chkTermico) return this.dx({
        icono: "🌡️🔴",
        titulo: "Protector térmico (Klixon) disparado",
        certeza: 83,
        causa: `El Klixon se disparó. En comercial puede ser por: sobrecalentamiento real del compresor (condensador sucio, tensión baja), falla del capacitor que hace trabajar forzado al motor, o Klixon fatigado después de años de trabajo.${ctx}`,
        pasos: [
          "Apagá el equipo y dejalo enfriar 30-45 minutos (los compresores comerciales tardan más en enfriar).",
          "Medí el Klixon con óhmetro en frío: debe tener continuidad (0Ω). Si está abierto → fatigado.",
          "Si cierra en frío pero vuelve a abrirse: buscá la causa de sobrecalentamiento.",
          d.chkCondSucio ? "Condensador sucio reportado — limpiar antes de volver a encender." : "Revisá condensador y ventilador del condensador.",
          "Medí tensión de red: baja tensión = amperaje alto = sobrecalentamiento.",
          "Si el capacitor está caído el motor trabaja con más corriente y se calienta → medí el capacitor también.",
          "Compresor caliente incluso con todo lo anterior bien → falla mecánica interna o válvulas desgastadas."
        ],
        alerta: "⚠️ No reemplaces el Klixon sin resolver la causa del sobrecalentamiento. El nuevo también se va a disparar.",
        datos: { psi, a, rango, amp, tempEvap, tempLocal }
      });

      // VÁLVULA SOLENOIDE BLOQUEANDO EL ARRANQUE
      if (d.chkSolenoide) return this.dx({
        icono: "🔌🔒",
        titulo: "Válvula solenoide sospechosa — posible bloqueo",
        certeza: 78,
        causa: `En refrigeración comercial la válvula solenoide controla el ingreso de refrigerante al evaporador. Si queda cerrada cuando el compresor quiere arrancar, la presión de alta puede subir muy rápido y disparar el presostato o impedir el arranque.${ctx}`,
        pasos: [
          "Verificá si la válvula solenoide recibe tensión cuando el termostato pide frío (debes escuchar un clic al energizarla).",
          "Sin tensión en la solenoide → problema en el circuito de control (termostato, placa, relay).",
          "Con tensión pero sin clic → bobina de la solenoide quemada. Medí resistencia de la bobina: debe ser 20-60Ω según modelo.",
          "Solenoide que no abre → el compresor trabaja contra presión cerrada → disparo del presostato o no arranca.",
          "Para confirmar: con el equipo desconectado, abrí la solenoide manualmente (si tiene override) y verificá si hay flujo.",
          "Si la bobina está ok pero la solenoide no abre → obstrucción interna o solenoide agarrotada → reemplazo."
        ],
        alerta: "💡 En muchos equipos comerciales la solenoide abre solo cuando el termostato pide frío. Si el local ya está en temperatura, la solenoide está cerrada — esto es normal.",
        datos: { psi, a, rango, amp, tempEvap, tempLocal }
      });

      return this.dx({
        icono: "⚡",
        titulo: "Compresor no arranca — diagnóstico eléctrico completo",
        certeza: 68,
        causa: `En refrigeración comercial hay más componentes de control que en doméstico: contactor, presostatos, solenoide, termostato digital. El diagnóstico va de la fuente hacia el compresor.${ctx}`,
        pasos: [
          `Verificá tensión de red: ${d.trifasico ? "380V entre fases (trifásico)" : "220V (monofásico)"} ±10%.`,
          "Revisá el contactor/relay: los contactos deben cerrar cuando el termostato pide frío.",
          "Verificá presostatos de alta y baja: ambos deben tener continuidad en condiciones normales.",
          "Medí el capacitor de arranque y marcha si el equipo los tiene.",
          "Revisá el Klixon: continuidad en frío.",
          "Verificá si la válvula solenoide recibe tensión y abre cuando debe.",
          "Si todo está ok → medí devanados del compresor. Sin continuidad entre pares o continuidad a masa → compresor quemado."
        ],
        alerta: d.trifasico ? "⚠️ Trifásico: verificar que el orden de fases sea correcto — un orden incorrecto puede hacer girar el compresor al revés y no enfriar." : null,
        datos: { psi, a, rango, amp, tempEvap, tempLocal }
      });
    }

    // ═══════════════════════════════════════════════
    // 2. SIN MEDICIONES
    // ═══════════════════════════════════════════════
    if (!psi && !a) {
      const orient = [];
      if (d.chkEvapCongelado) orient.push("evaporador congelado → deshielo antes de medir");
      if (d.chkFiltro)        orient.push("filtro deshidratador sospechoso → buscar punto frío en línea de líquido");
      if (d.chkSolenoide)     orient.push("solenoide sospechosa → verificar que abra cuando corresponde");
      if (d.chkNoTemp && tempLocal !== null) orient.push(`local a ${tempLocal}°C — objetivo ${objTemp.label}`);

      return this.dx({
        icono: "📊",
        titulo: "Necesitás mediciones para diagnóstico preciso",
        certeza: 0,
        causa: `El compresor arranca pero sin PSI y amperaje no hay diagnóstico confiable en refrigeración comercial.${orient.length ? " Indicios: " + orient.join("; ") + "." : ""}`,
        pasos: [
          "Conectá manifold en las válvulas de servicio de alta y baja.",
          "Medí amperaje con pinza en la línea del compresor (no en la línea general).",
          "Anotá también la temperatura real del local con termómetro calibrado.",
          tempEvap !== null ? `Temperatura del evaporador ya registrada: ${tempEvap}°C.` : "Si podés acceder: anotá temperatura del evaporador.",
          "Dejá el equipo en régimen mínimo 20 minutos antes de tomar medidas finales.",
          "Con esos datos volvé a correr el diagnóstico."
        ],
        alerta: d.chkEvapCongelado ? "⚠️ Evaporador congelado — hacé el deshielo manual antes de medir. Con el evaporador tapado los valores no son reales." : null,
        datos: { psi, a, rango, amp, tempEvap, tempLocal }
      });
    }

    // ═══════════════════════════════════════════════
    // 3. FILTRO DESHIDRATADOR TAPADO
    // Patrón: punto helado/escarcha localizada en la
    // línea de líquido antes del capilar
    // ═══════════════════════════════════════════════
    if (d.chkFiltro || (psiBajoB && ampBajo && d.chkEvapCongelado)) {
      const psiPatron = psi > 0 && psi < rango.psiMin && psiAlta > rangoBase.psiAltaMin;
      return this.dx({
        icono: "🔒❄️",
        titulo: "Filtro deshidratador tapado — restricción en línea de líquido",
        certeza: d.chkFiltro ? 88 : 75,
        causa: `El filtro deshidratador (ubicado en la línea de líquido antes del dispositivo de expansión) puede taparse con humedad cristalizada o partículas de aceite. Cuando se tapa parcialmente, actúa como una válvula de expansión adicional: PSI de baja baja, PSI de alta sube, y el punto de restricción se pone muy frío o con escarcha.${psiPatron ? ` PSI de baja de ${psi} con alta de ${psiAlta} confirma la restricción.` : ""}${ctx}`,
        pasos: [
          "Localizá el filtro deshidratador en la línea de líquido (generalmente un cilindro metálico pequeño).",
          "Tocalo con la mano — si está significativamente más frío que la línea de líquido que llega → está restringido.",
          "Buscá escarcha o condensación en el filtro o inmediatamente después — es el síntoma visual más claro.",
          "Con el equipo funcionando: medí temperatura antes y después del filtro con termómetro de contacto. Diferencia mayor a 5°C indica restricción.",
          "Para confirmar: apagá el equipo y desconectá el filtro. Soplá nitrógeno — si hay resistencia al paso → tapado.",
          "Reemplazá el filtro deshidratador. En comercial usar siempre filtro del mismo tamaño o mayor.",
          "Después del reemplazo: vacío mínimo 30 minutos y verificar que las presiones se normalicen."
        ],
        alerta: "⚠️ Si el filtro se tapó, hay humedad en el sistema. Después del reemplazo del filtro, hacé un vacío prolongado (60 minutos mínimo) para eliminar la humedad residual.",
        datos: { psi, a, rango, amp, tempEvap, tempLocal }
      });
    }

    // ═══════════════════════════════════════════════
    // 4. VÁLVULA SOLENOIDE — CON COMPRESOR CORRIENDO
    // ═══════════════════════════════════════════════
    if (d.chkSolenoide && d.arranca === "si") return this.dx({
      icono: "🔌⚠️",
      titulo: "Válvula solenoide — diagnóstico con equipo funcionando",
      certeza: 83,
      causa: `La válvula solenoide regula el flujo de refrigerante al evaporador. Si queda cerrada: el evaporador no recibe refrigerante, el local no baja de temperatura, el PSI de baja puede bajar mucho o entrar en vacío. Si queda abierta permanentemente: el compresor trabaja continuo, puede haber retorno de líquido al compresor al apagar.${ctx}`,
      pasos: [
        "Con el equipo funcionando y el termostato pidiendo frío: verificá que la solenoide esté energizada (escuchar clic o sentir el electroimán con la mano).",
        "Medí tensión en la bobina de la solenoide: debe haber tensión cuando el termostato pide frío.",
        "Si no hay tensión → revisar el termostato, la placa de control o el relay.",
        "Con tensión pero sin clic → bobina quemada. Medí resistencia de la bobina: 20-60Ω según modelo.",
        "Para verificar si la solenoide abre: al energizarla el PSI de baja debe subir levemente (el refrigerante empieza a fluir).",
        "Si la bobina está ok pero no hay cambio de PSI al energizar → solenoide agarrotada o con obstrucción interna.",
        "Reemplazá solo la bobina si el cuerpo está ok — es mucho más barato que la solenoide completa."
      ],
      alerta: "💡 En cámaras con deshielo por hot gas: la solenoide de hot gas debe abrirse durante el deshielo. Si no abre, el deshielo no ocurre aunque el timer funcione.",
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 5. PRESOSTATO DISPARADO CON EQUIPO ANDANDO
    // (presostato que se dispara durante el ciclo)
    // ═══════════════════════════════════════════════
    if (d.chkPresostato && d.arranca === "si") return this.dx({
      icono: "🔴📊",
      titulo: "Presostato que se dispara durante el ciclo",
      certeza: 82,
      causa: `El presostato se dispara mientras el equipo está funcionando. Puede ser alta presión real (condensador sucio, exceso de gas, ventilador parado) o presostato descalibrado (se dispara a un PSI menor al nominal).${ctx}`,
      pasos: [
        "Medí el PSI de alta con manifold MIENTRAS el equipo funciona — querés saber a qué PSI se dispara.",
        `Para ${d.gas}: el presostato de alta debe cortar entre ${rangoBase.psiAltaMax + 20} y ${rangoBase.psiAltaMax + 60} PSI aproximadamente. Si corta antes, está descalibrado.`,
        d.chkCondSucio ? "Condensador sucio reportado — limpiar primero. Si el PSI de alta baja a rango después de limpiar, ese era el problema." : "Limpiá el condensador aunque parezca limpio — en comercial la suciedad no siempre es visible.",
        "Verificá que el ventilador del condensador gire a plena velocidad.",
        "Si el PSI de alta está dentro del rango normal cuando el presostato corta → presostato descalibrado. Ajustar o reemplazar.",
        "Si el PSI de alta sube de manera anormal incluso con condensador limpio → posible exceso de gas o problema en la válvula de expansión."
      ],
      alerta: "⚠️ Un presostato que corta a presión normal está protegiendo al compresor innecesariamente — pero uno que se ignora y no funciona puede dejar que el compresor explote. No lo bypasses.",
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 6. CONDENSADOR SUCIO — CAUSA CONFIRMADA
    // ═══════════════════════════════════════════════
    if (psiAltoB && ampAlto && d.chkCondSucio) return this.dx({
      icono: "🔥💨",
      titulo: "Condensador sucio — causa confirmada",
      certeza: 95,
      causa: `PSI de ${psi} (sobre el límite ${rango.psiMax}) y amperaje de ${a}A alto, con condensador sucio confirmado. En refrigeración comercial el condensador se ensucia rápido — especialmente en panaderías, carnicerías y cocinas.${notaTemp}${ctx}`,
      pasos: [
        "Apagá el equipo antes de limpiar.",
        "Limpiá el condensador con agua a presión moderada de adentro hacia afuera.",
        d.gas === "R404A" || d.gas === "R448A" ? "En carnicerías y cocinas: usar desengrasante específico para serpentines — la grasa no la saca el agua sola." : "Si hay mucho polvo acumulado: aspiradora primero, luego agua.",
        "Verificá que el ventilador del condensador gire libremente y a buena velocidad.",
        "Revisá que haya espacio libre alrededor del condensador para ventilación (mínimo 15cm).",
        "Encendé, esperá 20 minutos en régimen y medí nuevamente.",
        "Recomendá al cliente limpieza preventiva cada 2-3 meses en entornos sucios."
      ],
      alerta: "⚠️ No uses agua a alta presión — dobla las aletas del condensador y reduce la disipación.",
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 7. ALTA PRESIÓN SIN CONDENSADOR SUCIO
    // ═══════════════════════════════════════════════
    if (psiAltoB && ampAlto) return this.dx({
      icono: "⛽🔥",
      titulo: "Alta presión — condensador ok, buscar otra causa",
      certeza: 76,
      causa: `PSI de ${psi} elevado y amperaje de ${a}A alto pero el condensador está limpio. ${tempAmb > 35 ? `Temperatura ambiente de ${tempAmb}°C es un factor — por encima de 35°C la presión sube naturalmente. ` : ""}Hay que descartar exceso de gas, ventilador, o presostato descalibrado.${notaTemp}${ctx}`,
      pasos: [
        d.chkVentCond ? "Ventilador del condensador detenido reportado — verificar que gire y tenga buen caudal. Sin ventilador la presión no puede bajar." : "Verificá el ventilador del condensador: velocidad y caudal.",
        tempAmb > 35 ? `Temperatura ambiente de ${tempAmb}°C — si el condensador está en un espacio cerrado, la ventilación del cuarto puede ser el problema.` : "Verificá la temperatura del ambiente donde está el condensador.",
        "Si el ventilador está bien y el ambiente es razonable → posible exceso de gas.",
        "Conectá manifold de alta: si el PSI de alta está sobre el rango normal para ese gas → exceso.",
        "Purgá gas de a poco monitoreando el PSI de alta hasta que baje al rango.",
        d.gas === "R404A" ? "⚠️ R404A: si hay que purgar, recuperar con recuperadora. Este gas no se puede purgar a la atmósfera." : ""
      ].filter(Boolean),
      alerta: null,
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 8. BAJA PRESIÓN + AMP BAJO + EVAP CONGELADO
    // Puede ser falla de deshielo O filtro tapado
    // ═══════════════════════════════════════════════
    if (psiBajoB && ampBajo && d.chkEvapCongelado) return this.dx({
      icono: "🧊🔒",
      titulo: "Evaporador congelado — deshielo o restricción",
      certeza: 87,
      causa: `PSI bajo (${psi} vs normal ${rango.psiMin}-${rango.psiMax}) con amperaje bajo y evaporador congelado. Hay dos causas posibles: falla del sistema de deshielo (el hielo se acumula hasta bloquear el flujo) o filtro deshidratador tapado (restricción antes del expansor).${notaTemp}${ctx}`,
      pasos: [
        "PASO 1 — Deshielo manual forzado: apagá 12-24 horas. Con el evaporador congelado los valores no son reales.",
        "Después del deshielo: medí PSI y amperaje nuevamente. Si vuelven al rango → el problema es el sistema de deshielo.",
        d.chkDeshielo ? "Sistema de deshielo sospechoso: verificá timer, resistencia y termostato de deshielo." : "Verificá que el ciclo de deshielo automático esté funcionando.",
        "Si el PSI sigue bajo después del deshielo → restricción real. Buscá el filtro deshidratador.",
        "Filtro tapado: punto frío o escarcha localizada en la línea de líquido antes del expansor.",
        "Si hay restricción: reemplazá el filtro, hacé vacío y verificá que el PSI suba al rango."
      ],
      alerta: "⚠️ Un evaporador congelado que se ignora termina con retorno de líquido al compresor. Resolver urgente.",
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 9. FUGA — PSI VACÍO
    // ═══════════════════════════════════════════════
    if (psiVacioB && ampBajo) return this.dx({
      icono: "💨",
      titulo: "Fuga severa — sistema casi sin gas",
      certeza: 92,
      causa: `PSI de ${psi} indica sistema con muy poco gas para ${d.gas} (normal ${rango.psiMin}-${rango.psiMax} PSI). Amperaje de ${a}A bajo confirma que el compresor trabaja casi en vacío.${notaTemp}${ctx}`,
      pasos: [
        "Apagá el equipo — el compresor sin gas trabaja en seco y puede quemarse.",
        "Buscá la fuga con agua jabonosa: válvulas de servicio, flarings, soldaduras, y el evaporador.",
        "En cámaras frigoríficas: revisar también las líneas de cobre en los pasos por la pared.",
        "Pressurizá con nitrógeno a 150 PSI si no encontrás la fuga a simple vista.",
        "Reparada la fuga: vacío mínimo 30-45 minutos a 500 micrones.",
        `Cargá ${d.gas} por peso según especificación del equipo.`,
        d.gas === "R404A" ? "⚠️ R404A en extinción — evaluar con el cliente la reconversión a R448A en este servicio." : ""
      ].filter(Boolean),
      alerta: "🔴 Sin gas el aceite del compresor no circula. Si el equipo estuvo funcionando con fuga durante días, verificar que el compresor no tenga daño.",
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 10. FUGA LENTA — PSI BAJO + AMP BAJO
    // ═══════════════════════════════════════════════
    if (psiBajoB && ampBajo && !d.chkEvapCongelado) return this.dx({
      icono: "💨🔍",
      titulo: `Baja presión — fuga o compresión baja`,
      certeza: 80,
      causa: `PSI de ${psi} por debajo del rango normal (${rango.psiMin}-${rango.psiMax}) y amperaje de ${a}A bajo. Sin síntomas visuales claros hay dos causas posibles: fuga lenta o compresión baja del compresor.${notaTemp}${ctx}`,
      pasos: [
        "PASO 1 — Prueba de compresión: apagá el equipo, esperá 5 min para igualar presiones, arrancá y mirá cuánto sube la presión de alta en 30 segundos.",
        "Compresor sano: sube rápido y firme. Compresión baja: sube lento o no llega al valor esperado.",
        "Si la compresión está bien → es fuga. Buscá con agua jabonosa en todas las conexiones.",
        "En comercial revisar especialmente las válvulas de servicio — se aflojan con el tiempo y pueden tener fuga lenta.",
        "Reparada la fuga: vacío mínimo 30 minutos y cargar por peso.",
        `Objetivo: PSI ${rango.psiMin}-${rango.psiMax} y amperaje ${amp.min}-${amp.max}A.`
      ],
      alerta: null,
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 11. SISTEMA DE DESHIELO
    //     Temperatura evap muy alta o síntoma de deshielo
    // ═══════════════════════════════════════════════
    if (d.chkDeshielo || (tempEvap !== null && evapCaliente && psiOkB)) return this.dx({
      icono: "⏱️🔥",
      titulo: "Sistema de deshielo — falla confirmada o sospechada",
      certeza: d.chkDeshielo ? 87 : 78,
      causa: `En refrigeración comercial el deshielo es crítico — sin él el evaporador se congela y el local pierde temperatura. ${tempEvap !== null ? `Temperatura del evaporador de ${tempEvap}°C ${evapCaliente ? "— más caliente de lo esperado" : "— en rango"}.` : ""}${ctx}`,
      pasos: [
        "Verificá qué tipo de deshielo tiene el equipo: eléctrico (resistencia), por hot gas (válvula solenoide), o por tiempo (solo apaga el compresor).",
        "Deshielo eléctrico: medí resistencia con óhmetro — si mide infinito está quemada.",
        "Deshielo por hot gas: la solenoide de hot gas debe abrirse durante el ciclo — verificar que recibe tensión y abre.",
        "Verificá el timer de deshielo: girarlo manualmente para forzar el ciclo. El compresor debe parar.",
        "Revisá el termostato de deshielo (fin de ciclo): debe abrir cuando el evaporador alcanza ~10-15°C. Si está siempre abierto → quemado.",
        "En equipos con placa electrónica: verificá que el ciclo de deshielo esté habilitado en la programación."
      ],
      alerta: "⚠️ Un equipo sin deshielo funcional en Argentina en verano puede congelarse completamente en 2-3 días.",
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 12. PSI OK + AMP ALTO
    // ═══════════════════════════════════════════════
    if (psiOkB && ampAlto) return this.dx({
      icono: "⚡🔥",
      titulo: "Amperaje alto con presión normal",
      certeza: 76,
      causa: `PSI en rango (${psi}) pero amperaje de ${a}A supera el máximo esperado (${amp.max}A) para ${d.hp} HP. El compresor está trabajando eléctricamente forzado.${ctx}`,
      pasos: [
        `Verificá tensión de red: ${d.trifasico ? "desequilibrio de fases puede causar amperaje alto en alguna fase" : "tensión baja = amperaje alto"}.`,
        d.chkCapacitor ? "Capacitor sospechoso marcado — medirlo con capacímetro primero." : "Medí el capacitor — un capacitor caído hace trabajar más el motor.",
        d.chkCondSucio ? "Condensador sucio — limpiar reduce la carga del compresor." : "Verificá que el condensador esté limpio.",
        "Medí temperatura de la carcasa del compresor — si quema a la mano hay sobrecalentamiento.",
        "Si todo está ok → devanado del compresor con falla incipiente. Medí resistencia de devanados.",
        d.trifasico ? "Trifásico: medí las tres fases por separado — una fase con amperaje alto indica desequilibrio." : ""
      ].filter(Boolean),
      alerta: "⚠️ Amperaje sostenido sobre el máximo puede saltar el diferencial o quemar el compresor.",
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 13. NO ALCANZA TEMPERATURA + TODO EN RANGO
    // ═══════════════════════════════════════════════
    if (d.chkNoTemp && psiOkB && ampOk) return this.dx({
      icono: "🌡️❓",
      titulo: "No alcanza temperatura — sistema en rango",
      certeza: 75,
      causa: `PSI (${psi}) y amperaje (${a}A) en rango correcto para ${d.hp} HP con ${d.gas}. El problema es externo al sistema refrigerante.${tempLocal !== null ? ` Temperatura real del local: ${tempLocal}°C (objetivo: ${objTemp.label}).` : ""}${tempEvap !== null ? ` Evaporador a ${tempEvap}°C.` : ""}${ctx}`,
      pasos: [
        tipoEquipo === "exhibidora_abierta"
          ? "Exhibidora abierta: verificar que las cortinas de aire estén funcionando — sin ellas se pierde el 40% de la capacidad."
          : "Verificar sellado de puertas y juntas — las pérdidas de frío son la causa más frecuente.",
        "Revisá que el evaporador esté limpio y el ventilador del evaporador funcione correctamente.",
        tempAmb > 32 ? `Temperatura ambiente de ${tempAmb}°C — en días de calor extremo el equipo puede necesitar más tiempo para alcanzar el setpoint.` : "Verificá la temperatura ambiente del local.",
        "Comprobá que el termostato esté bien calibrado y ubicado lejos de fuentes de calor.",
        "Si el local tiene mucho tráfico o puertas muy frecuentes → puede ser subdimensionado.",
        `Objetivo de temperatura para ${tipoEquipo.replace(/_/g," ")}: ${objTemp.label}.`
      ],
      alerta: null,
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 14. TRABAJA CONTINUO + PSI OK
    // ═══════════════════════════════════════════════
    if (d.chkContinuo && psiOkB) return this.dx({
      icono: "🔄",
      titulo: "Compresor continuo — carga térmica o control",
      certeza: 72,
      causa: `Compresor que no para con PSI en rango. El sistema refrigerante está bien — el equipo no llega al punto de corte.${tempLocal !== null ? ` Temperatura del local: ${tempLocal}°C, objetivo: ${objTemp.label}.` : ""}${ctx}`,
      pasos: [
        "Verificar temperatura real del local con termómetro calibrado — si no baja del setpoint, el equipo está trabajando bien pero sin alcanzar.",
        tipoEquipo === "exhibidora_abierta"
          ? "Cortinas de aire: su correcto funcionamiento puede ser la diferencia para alcanzar temperatura en días calurosos."
          : "Revisá el sellado de puertas — una junta deteriorada hace que el equipo trabaje continuo.",
        "Verificar que el termostato esté bien calibrado (comparar lectura vs termómetro real).",
        "Si el local tiene alta carga térmica (mucha apertura de puertas, mucho producto caliente) → puede ser dimensionamiento insuficiente.",
        d.chkDeshielo ? "Sistema de deshielo sospechoso: si el evaporador está parcialmente congelado por falta de deshielo, el equipo trabaja continuo sin llegar a temperatura." : "Verificar que el ciclo de deshielo funcione — un evaporador con escasa escarcha indica que el deshielo puede estar ocurriendo mal."
      ],
      alerta: null,
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });

    // ═══════════════════════════════════════════════
    // 15. R404A — NOTA DE RECONVERSIÓN
    //     Siempre incluirla en diagnóstico normal
    // ═══════════════════════════════════════════════
    const notaR404A = d.gas === "R404A"
      ? " ⚠️ R404A está en fase de eliminación — evaluar reconversión a R448A en próximo servicio mayor."
      : "";

    // DEFAULT — TODO NORMAL
    return this.dx({
      icono: "✅",
      titulo: "Sistema operando correctamente",
      certeza: 89,
      causa: `PSI de ${psi} y amperaje de ${a}A dentro de los rangos normales para ${d.gas} con compresor de ${d.hp} HP.${notaTemp}${notaR404A}${ctx}`,
      pasos: [
        tempLocal !== null ? `Temperatura real del local: ${tempLocal}°C. Objetivo para ${tipoEquipo.replace(/_/g," ")}: ${objTemp.label}.` : `Verificar que el local alcance la temperatura objetivo: ${objTemp.label}.`,
        "Registrar valores actuales como baseline para futuras visitas.",
        "Limpiar condensador como mantenimiento preventivo (cada 2-3 meses en ambientes sucios).",
        "Verificar sellado de puertas y juntas.",
        d.gas === "R404A" ? "Informar al cliente sobre el reemplazo del R404A y evaluar reconversión a R448A." : "Verificar el ciclo de deshielo automático si el equipo lo tiene."
      ],
      alerta: notaR404A ? "⚠️ R404A en extinción — informar al cliente sobre la reconversión." : null,
      datos: { psi, a, rango, amp, tempEvap, tempLocal }
    });
  },

  dx({ icono, titulo, certeza, causa, pasos, alerta, datos }) {
    const barColor = certeza >= 88 ? "#00d9ff" : certeza >= 72 ? "#ff9b42" : "#8899aa";
    const { psi, a, rango, amp, tempEvap, tempLocal } = datos;

    const pasosHTML = pasos.map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i + 1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");

    const alertaHTML = alerta ? `<div class="dx-alerta">${alerta}</div>` : "";

    const medHTML = (psi || a || tempEvap !== null || tempLocal !== null) ? `
      <div class="dx-datos-grid">
        ${psi ? `<div class="dx-dato ${psi < rango.psiMin ? "dx-bajo" : psi > rango.psiMax ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">PSI baja</span>
          <span class="dx-dato-val">${psi}</span>
          <span class="dx-dato-ref">${rango.psiMin}–${rango.psiMax}</span>
        </div>` : ""}
        ${a ? `<div class="dx-dato ${a < amp.min ? "dx-bajo" : a > amp.max ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">AMP</span>
          <span class="dx-dato-val">${a}A</span>
          <span class="dx-dato-ref">${amp.min}–${amp.max}A</span>
        </div>` : ""}
        ${tempEvap !== null ? `<div class="dx-dato ${tempEvap > 0 ? "dx-alto" : tempEvap > -5 ? "dx-bajo" : "dx-ok"}">
          <span class="dx-dato-label">T° evap</span>
          <span class="dx-dato-val">${tempEvap}°C</span>
          <span class="dx-dato-ref">&lt; -5°C</span>
        </div>` : ""}
        ${tempLocal !== null ? `<div class="dx-dato ${tempLocal > 10 ? "dx-alto" : "dx-ok"}">
          <span class="dx-dato-label">T° local</span>
          <span class="dx-dato-val">${tempLocal}°C</span>
          <span class="dx-dato-ref">objetivo</span>
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
        ${medHTML}
        ${alertaHTML}
        <div class="dx-pasos-titulo">📋 Pasos de intervención:</div>
        ${pasosHTML}
      </div>`};
  }
};
