// =====================================================
// HVAC PRO ARGENTINA
// CICLICA-ENGINE.JS — Diagnóstico clínico v2
// =====================================================

const CiclicaEngine = {

  rangos: {
    R134a: { psiMin: 0,  psiMax: 5,  psiVacio: -5  },
    R600a: { psiMin: -3, psiMax: 2,  psiVacio: -8  }
  },

  analyze(d) {

    const rango = this.rangos[d.gas] || this.rangos.R134a;
    const psi   = Number(d.psi);
    const a     = Number(d.amp) || 0;

    // Amperajes normales heladera doméstica
    const ampMin = 0.8, ampMax = 2.2;

    // Temperaturas reales medidas con termómetro
    const tFreezer  = d.tempFreezer  !== "" && d.tempFreezer  !== undefined ? Number(d.tempFreezer)  : null;
    const tHeladera = d.tempHeladera !== "" && d.tempHeladera !== undefined ? Number(d.tempHeladera) : null;

    // Rangos normales
    const freezerNormal = tFreezer  !== null && tFreezer  >= -18 && tFreezer  <= -5;
    const freezerBien   = tFreezer  !== null && tFreezer  < -5;
    const freezerMal    = tFreezer  !== null && tFreezer  >= -5;
    const heladeraNormal= tHeladera !== null && tHeladera >= 3   && tHeladera <= 8;
    const heladeraBien  = tHeladera !== null && tHeladera < 12;
    const heladeraMal   = tHeladera !== null && tHeladera >= 12;
    const ambosTemps    = tFreezer !== null && tHeladera !== null;

    const psiAlto  = psi > rango.psiMax + 3;
    const psiBajo  = psi < rango.psiMin - 2;
    const psiVacio = psi < rango.psiVacio;
    const psiOk    = psi >= rango.psiMin - 1 && psi <= rango.psiMax + 1;

    const ampAlto  = a > ampMax;
    const ampBajo  = a > 0 && a < ampMin;
    const ampOk    = a >= ampMin && a <= ampMax;

    // ═══════════════════════════════════════════════
    // COMPRESOR NO ARRANCA
    // ═══════════════════════════════════════════════

    if (d.arranca === "no") {
      if (d.chkPTC) return this.dx({
        icono: "🔌",
        titulo: "PTC / Relay de arranque",
        certeza: 88,
        causa: "El compresor no arranca y el PTC está indicado como sospechoso. En heladeras domésticas argentinas el PTC es la falla de arranque más frecuente.",
        pasos: [
          "Retirá el PTC del compresor (es el componente que se encaja en los pines).",
          "Dejalo enfriar 5 minutos fuera del equipo.",
          "Un PTC funcional mide alta resistencia en frío (cientos a miles de Ω) y vuelve a baja resistencia al enfriarse.",
          "Si está partido, quemado o mide 0Ω siempre → reemplazalo.",
          "También revisá el Klixon (protector térmico) que va junto al PTC: debe tener continuidad."
        ],
        alerta: null,
        datos: { psi, a, rango }
      });

      return this.dx({
        icono: "⚡",
        titulo: "Compresor no arranca — revisión eléctrica",
        certeza: 72,
        causa: "El compresor no intenta arrancar. En heladeras el 80% de los arranques fallidos son PTC, Klixon o tensión de red.",
        pasos: [
          "Medí tensión en la toma: debe ser 220V ±10%. Baja tensión impide el arranque.",
          "Revisá el PTC (relay de arranque): retiralo, dejalo enfriar, medí resistencia.",
          "Revisá el Klixon (protector térmico): debe tener continuidad cuando está frío.",
          "Si todo está ok eléctricamente, medí los devanados del compresor con multímetro.",
          "Compresor sano: continuidad entre cada par de pines, sin continuidad a masa."
        ],
        alerta: "⚠️ No intentes arrancar más de 3 veces seguidas — el Klixon se dispara y tarda en resetear.",
        datos: { psi, a, rango }
      });
    }

    // ═══════════════════════════════════════════════
    // ARRANCA PERO SIN DATOS
    // ═══════════════════════════════════════════════

    if (!d.psi && !d.amp) {
      return this.dx({
        icono: "📊",
        titulo: "Necesitás datos medidos para diagnóstico preciso",
        certeza: 0,
        causa: "El compresor arranca pero sin PSI y amperaje no puedo diferenciar entre fuga, restricción o falla de compresor.",
        pasos: [
          "Conectá manómetro en el proceso del compresor (lado de baja).",
          "Medí amperaje del compresor con pinza amperimétrica.",
          "Dejá el equipo funcionar 15 minutos antes de tomar medidas.",
          "Anotá si enfría arriba (freezer), abajo (heladera), o ninguno.",
          "Con esos datos volvé a correr el diagnóstico."
        ],
        alerta: null,
        datos: { psi, a, rango }
      });
    }

    // ═══════════════════════════════════════════════
    // CRUCES DE SÍNTOMAS
    // ═══════════════════════════════════════════════

    // ENFRÍA ARRIBA PERO NO ABAJO — restricción / capilar
    if (d.arribaFrio && !d.abajoFrio) return this.dx({
      icono: "🧊❌",
      titulo: "Enfría arriba pero no abajo — restricción",
      certeza: 85,
      causa: "Este síntoma es muy específico: el sistema tiene suficiente gas para enfriar el freezer pero no llega refrigerante al evaporador de la heladera. Indica restricción parcial.",
      pasos: [
        "Antes de tocar el gas: hacé un deshielo manual completo (desconectá 24h con puerta abierta).",
        "Si después del deshielo enfría abajo → era solo acumulación de hielo tapando el capilar.",
        "Si sigue sin enfriar abajo → revisá el capilar (tubo fino que va del separador al evaporador).",
        "Un capilar restringido se detecta: el compresor trabaja continuo, alta presión en alta, baja presión muy baja.",
        "También puede ser filtro/deshidratador tapado — está entre condensador y capilar."
      ],
      alerta: "⚠️ Nunca aceleres el deshielo con fuego o agua caliente — podés romper el evaporador.",
      datos: { psi, a, rango }
    });

    // NO ENFRÍA EN NINGÚN LADO + PSI VACÍO = FUGA
    if (!d.arribaFrio && !d.abajoFrio && psiVacio) return this.dx({
      icono: "💨",
      titulo: "Sin enfriamiento — fuga severa",
      certeza: 90,
      causa: `PSI de ${psi} indica sistema casi sin gas. El compresor arranca pero no puede comprimir suficiente refrigerante para enfriar.`,
      pasos: [
        "NO cargues gas antes de encontrar la fuga — es tirar dinero.",
        "Pressurizá con nitrógeno seco y buscá la fuga con agua jabonosa.",
        "En heladeras revisar especialmente: unión compresor-cañería, filtro/deshidratador y evaporador.",
        "Reparada la fuga: vacío mínimo 30 minutos hasta 500 micrones.",
        `Carga de gas ${d.gas} por peso según la plaqueta del equipo (en heladeras suele ser 80-150g).`
      ],
      alerta: "🔴 R600a (isobutano) es INFLAMABLE. No trabajés con llama cerca ni en espacios cerrados sin ventilación.",
      datos: { psi, a, rango }
    });

    // PSI ALTO + AMP ALTO + CALIENTE = CONDENSADOR
    if (psiAlto && ampAlto) return this.dx({
      icono: "🔥",
      titulo: "Condensador sobrecargado",
      certeza: 87,
      causa: `PSI de ${psi} (sobre el rango normal ${rango.psiMin}-${rango.psiMax}) y amperaje de ${a}A elevado. El condensador no está disipando el calor correctamente.`,
      pasos: [
        "Revisá la grilla trasera / inferior de la heladera — ¿está cubierta de polvo y pelusa?",
        "Limpiá el condensador (serpentín negro en la parte trasera o inferior) con aspiradora y cepillo.",
        "Verificá que haya espacio libre atrás y arriba de la heladera para ventilar.",
        "Si tiene ventilador de condensador (algunos modelos) verificá que gire.",
        "Después de limpiar dejá funcionar 2 horas y re-medí — en muchos casos se resuelve solo."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // PSI NORMAL + AMP ALTO = COMPRESOR / CAPACITOR
    if (psiOk && ampAlto) return this.dx({
      icono: "⚡",
      titulo: "Amperaje alto con presión normal",
      certeza: 78,
      causa: `Presión en rango (${psi} PSI) pero amperaje de ${a}A supera el normal. El compresor está trabajando eléctricamente forzado.`,
      pasos: [
        "Verificá tensión de red: baja tensión = mayor amperaje.",
        "Revisá el PTC: si está deteriorado el arranque consume más.",
        "Verificá que el condensador esté limpio (calor extra fuerza el compresor).",
        "Si lleva capacitor de marcha (algunos modelos comerciales) medilo con capacímetro.",
        "Amperaje persistentemente alto = devanado del compresor con falla incipiente."
      ],
      alerta: "⚠️ Dejá el equipo sin funcionar si el amperaje supera mucho el máximo — puede quemar el compresor.",
      datos: { psi, a, rango }
    });

    // PSI NORMAL + TRABAJA CONTINUO = MÚLTIPLES CAUSAS
    if (psiOk && d.chkContinuo) return this.dx({
      icono: "🔄",
      titulo: "Compresor trabajando continuo",
      certeza: 70,
      causa: "La presión está en rango pero el compresor nunca para. Esto puede ser normal en verano extremo o indicar varias fallas.",
      pasos: [
        "Verificá la temperatura ambiente: con más de 35°C en días de calor extremo puede ser normal.",
        "Revisá el termostato o sensor de temperatura: si está mal calibrado nunca da la señal de corte.",
        "Verificá el sellado de puertas (burlete): si pierde frío el compresor nunca alcanza la temperatura.",
        "Revisá que la heladera no esté sobrecargada o con comida caliente adentro.",
        "Si el termostato es mecánico (perilla): probá girarlo hacia menos frío y ver si corta."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // ═══════════════════════════════════════════════
    // DIAGNÓSTICO POR TEMPERATURA REAL (sin manómetro)
    // ═══════════════════════════════════════════════

    // FREEZER BIEN, HELADERA MAL — con temperatura real
    if (ambosTemps && freezerBien && heladeraMal && !psi && !a) return this.dx({
      icono: "🧊❌",
      titulo: `Freezer ${tFreezer}°C ✅ — Heladera ${tHeladera}°C ❌`,
      certeza: 88,
      causa: `El freezer está a ${tFreezer}°C (bien), pero la heladera está a ${tHeladera}°C — sobre los 8°C normales. Con el compresor funcionando, esto indica restricción: el gas llega al freezer pero no al evaporador de abajo.`,
      pasos: [
        "Hacé deshielo manual completo: desconectá 24 horas con puertas abiertas.",
        "Si después del deshielo la heladera vuelve a enfriar bien por unos días → era hielo tapando el capilar.",
        "Si no mejora: revisá el capilar y el filtro deshidratador.",
        "El capilar tapado es más frecuente en heladeras de más de 10 años."
      ],
      alerta: "⚠️ Hacé el deshielo manual antes de tocar el gas — ahorra trabajo y confirma el diagnóstico.",
      datos: { psi, a, rango }
    });

    // AMBOS MAL — con temperatura real
    if (ambosTemps && freezerMal && heladeraMal && !psi && !a) return this.dx({
      icono: "❌❌",
      titulo: `Sin frío — Freezer ${tFreezer}°C, Heladera ${tHeladera}°C`,
      certeza: 82,
      causa: `Ni el freezer ni la heladera están fríos. El freezer a ${tFreezer}°C y la heladera a ${tHeladera}°C — ambos sobre la temperatura normal. Esto indica problema del compresor, fuga total de gas, o falla eléctrica.`,
      pasos: [
        "Verificá que el compresor esté arrancando y funcionando.",
        "Si el compresor funciona: conectá manómetro para determinar si hay gas.",
        "Si el PSI es casi 0: fuga total — buscar fuga antes de cargar gas.",
        "Si el compresor no funciona: seguir el diagnóstico eléctrico (PTC, Klixon, tensión)."
      ],
      alerta: d.gas === "R600a" ? "🔴 R600a es INFLAMABLE. Ventilá antes de trabajar." : null,
      datos: { psi, a, rango }
    });

    // FREEZER DEMASIADO FRÍO / HELADERA BIEN — termostato
    if (ambosTemps && tFreezer < -20 && heladeraNormal && !psi && !a) return this.dx({
      icono: "🌡️",
      titulo: `Freezer demasiado frío (${tFreezer}°C) — Termostato`,
      certeza: 78,
      causa: `El freezer está a ${tFreezer}°C — más frío de lo necesario. El termostato no está cortando el compresor a tiempo. Puede ser termostato descalibrado o con contactos pegados.`,
      pasos: [
        "Girá el termostato hacia una posición menos fría y verificá si el compresor corta.",
        "Si el compresor nunca para aunque el termostato esté en mínimo: termostato con contactos pegados.",
        "Un freezer demasiado frío también puede congelar la parte de heladera en algunas cíclicas.",
        "Reemplazar el termostato mecánico si no responde al ajuste."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // BURLETE + TEMPERATURA ALTA EN HELADERA
    if (d.chkBurleteRoto && tHeladera !== null && tHeladera > 8 && !psi) return this.dx({
      icono: "🚪🌡️",
      titulo: `Burlete deteriorado — Heladera a ${tHeladera}°C`,
      certeza: 85,
      causa: `La heladera está a ${tHeladera}°C con burlete deteriorado. El burlete que no sella permite la entrada constante de aire caliente — el compresor trabaja continuo sin poder bajar la temperatura.`,
      pasos: [
        "Verificá el burlete en todo el perímetro: debe adherirse a la heladera cuando cerrás la puerta.",
        "Prueba del papel: cerrá la puerta sobre un papel — si sale fácil, el burlete no sella.",
        "Si el burlete está duro, agrietado o deformado: reemplazarlo.",
        "Un burlete deteriorado puede aumentar el consumo eléctrico hasta un 30%."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // TODO OK
    return this.dx({
      icono: "✅",
      titulo: "Sistema operando en rango normal",
      certeza: 88,
      causa: `PSI de ${psi} y amperaje de ${a}A están dentro de los valores normales para ${d.gas} en heladera cíclica.`,
      pasos: [
        "Verificá que enfríe arriba (freezer -12°C a -18°C) y abajo (heladera 3°C a 8°C).",
        "Revisá el sellado de las puertas: el burlete debe adherir bien en todo el perímetro.",
        "Limpiá el condensador trasero como mantenimiento preventivo.",
        "Si hay quejas de poco frío con valores normales → revisar termostato y sellado.",
        "Anotá los valores como referencia para futuras revisiones."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

  },

  dx({ icono, titulo, certeza, causa, pasos, alerta, datos }) {
    const barColor = certeza >= 85 ? "#00d9ff" : certeza >= 70 ? "#ff9b42" : "#8899aa";
    const { psi, a, rango } = datos;
    const pasosHTML = pasos.map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i + 1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");
    const alertaHTML = alerta ? `<div class="dx-alerta">${alerta}</div>` : "";
    const datosHTML = (psi || a) ? `
      <div class="dx-datos-grid">
        ${psi !== undefined ? `<div class="dx-dato ${psi < rango.psiMin ? 'dx-bajo' : psi > rango.psiMax ? 'dx-alto' : 'dx-ok'}">
          <span class="dx-dato-label">PSI medido</span>
          <span class="dx-dato-val">${psi}</span>
          <span class="dx-dato-ref">${rango.psiMin} a ${rango.psiMax}</span>
        </div>` : ""}
        ${a ? `<div class="dx-dato ${a < 0.8 ? 'dx-bajo' : a > 2.2 ? 'dx-alto' : 'dx-ok'}">
          <span class="dx-dato-label">AMP medido</span>
          <span class="dx-dato-val">${a}A</span>
          <span class="dx-dato-ref">0.8-2.2A</span>
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
      </div>`};
  }
};
