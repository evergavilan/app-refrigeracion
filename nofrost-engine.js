// =====================================================
// HVAC PRO ARGENTINA
// NOFROST-ENGINE.JS — Diagnóstico clínico v2
// =====================================================

const NoFrostEngine = {

  rangos: {
    R134a: { psiMin: 0, psiMax: 5,  psiVacio: -5 },
    R600a: { psiMin: -3, psiMax: 2, psiVacio: -8 }
  },

  analyze(d) {

    const rango = this.rangos[d.gas] || this.rangos.R134a;
    const psi   = Number(d.psi);
    const a     = Number(d.amp) || 0;
    const ampMin = 1.0, ampMax = 2.5;

    // Temperaturas reales
    const tFreezer  = d.tempFreezer  !== "" && d.tempFreezer  !== undefined ? Number(d.tempFreezer)  : null;
    const tHeladera = d.tempHeladera !== "" && d.tempHeladera !== undefined ? Number(d.tempHeladera) : null;

    const freezerBien   = tFreezer  !== null && tFreezer  < -5;
    const freezerMal    = tFreezer  !== null && tFreezer  >= -5;
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

    if (d.arranca === "no") return this.dx({
      icono: "⚡",
      titulo: "Compresor no arranca",
      certeza: 75,
      causa: "En No Frost el compresor puede no arrancar por PTC, Klixon, placa o protección del sistema de deshielo.",
      pasos: [
        "Medí tensión en la toma: debe ser 220V. Baja tensión impide el arranque.",
        "Revisá el PTC y Klixon: mismo procedimiento que heladera cíclica.",
        "Verificá si la placa electrónica tiene algún LED de error o fusible quemado.",
        "En algunos modelos el sistema de deshielo en falla bloquea el compresor — revisá el timer o placa.",
        "Si hay tensión y el PTC/Klixon están ok → medí devanados del compresor."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // ═══════════════════════════════════════════════
    // FREEZER BIEN — ABAJO NO ENFRÍA
    // La falla más común de No Frost en Argentina
    // ═══════════════════════════════════════════════

    if (d.freezerFrio && !d.abajoFrio) return this.dx({
      icono: "🌬️❄️",
      titulo: "Freezer frío — heladera sin frío (falla de deshielo)",
      certeza: 92,
      causa: "Este es EL síntoma más común en No Frost. El freezer enfría bien pero el frío no llega abajo. En el 85% de los casos es una falla en el sistema de deshielo que congela el evaporador y bloquea la circulación de aire.",
      pasos: [
        "PRIMERO: hacé un deshielo manual forzado — desconectá 24-48 horas con puertas abiertas.",
        "Si al reconectar enfría abajo normalmente por unas horas y luego vuelve a fallar → el sistema de deshielo está fallando.",
        "Revisá en orden: resistencia de deshielo (debe tener continuidad y resistencia correcta).",
        "Luego revisá el bimetal (termostato de deshielo): si está abierto en frío → está quemado.",
        "Después revisá el timer de deshielo o la placa (según el modelo).",
        "Por último verificá el ventilador del evaporador: si no gira, el frío no circula."
      ],
      alerta: "💡 Antes de condenar compresor o hablar de gas: hace el deshielo manual. Si resuelve aunque sea por 2 días, confirmás que es el sistema de deshielo.",
      datos: { psi, a, rango }
    });

    // EVAPORADOR CONGELADO VISIBLE
    if (d.chkEvapCongelado) return this.dx({
      icono: "🧊🔴",
      titulo: "Evaporador congelado — sistema de deshielo",
      certeza: 90,
      causa: "El evaporador visible está congelado completamente. Esto confirma que el ciclo de deshielo automático no está funcionando. El hielo bloquea el paso de aire.",
      pasos: [
        "Desconectá el equipo inmediatamente para evitar que el compresor trabaje en falso.",
        "Realizá deshielo manual completo: 24-48 horas sin corriente, puertas abiertas.",
        "Una vez descongelado, probá la resistencia de deshielo: mide entre 20-60Ω normalmente.",
        "Si la resistencia está abierta (∞) → reemplazala.",
        "Si la resistencia está bien, probá el bimetal: con calor debe abrir, en frío debe cerrar.",
        "Si ambos están ok → el timer o placa de control no está iniciando el ciclo de deshielo."
      ],
      alerta: "⚠️ NO uses soplete ni pistola de calor directamente sobre el evaporador — podés romper los tubos.",
      datos: { psi, a, rango }
    });

    // VENTILADOR DETENIDO
    if (d.chkVentDetenido) return this.dx({
      icono: "🌬️❌",
      titulo: "Ventilador de evaporador detenido",
      certeza: 88,
      causa: "Sin el ventilador del evaporador, el frío generado no circula. El freezer puede enfriar un poco pero la heladera no recibe aire frío.",
      pasos: [
        "Verificá que el ventilador gire cuando el compresor está corriendo.",
        "Si no gira: comprobá si recibe tensión (normalmente 12V DC o 220V AC según modelo).",
        "Si tiene tensión y no gira → motor del ventilador quemado.",
        "Si no tiene tensión → revisá la placa de control o el interruptor de puerta.",
        "En muchos modelos el ventilador se detiene cuando abrís la puerta — probalo con puerta cerrada.",
        "Un ventilador trabado por hielo también puede aparecer así — deshielo manual primero."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // SIN FRÍO EN NINGÚN LADO + PSI VACÍO = FUGA
    if (!d.freezerFrio && !d.abajoFrio && psiVacio) return this.dx({
      icono: "💨",
      titulo: "Sin enfriamiento — fuga severa",
      certeza: 88,
      causa: `PSI de ${psi} con ${d.gas} indica sistema prácticamente sin gas. Ni freezer ni heladera enfrían.`,
      pasos: [
        "Buscá la fuga antes de cargar gas.",
        "En No Frost la fuga más común es en el evaporador (por corrosión o daño mecánico).",
        "Pressurizá con nitrógeno y buscá con agua jabonosa.",
        "Si el evaporador está pinchado puede ser necesario reemplazarlo.",
        `Carga de ${d.gas} por peso según plaqueta del equipo.`
      ],
      alerta: d.gas === "R600a" ? "🔴 R600a es INFLAMABLE. No trabajés con llama cerca ni en espacios cerrados." : null,
      datos: { psi, a, rango }
    });

    // PSI ALTO + CONDENSADOR
    if (psiAlto && ampAlto) return this.dx({
      icono: "🔥",
      titulo: "Alta presión — condensador sobrecargado",
      certeza: 84,
      causa: `PSI de ${psi} elevado y amperaje de ${a}A alto. El condensador no está disipando calor.`,
      pasos: [
        "Limpiá el condensador (parte inferior o trasera) con aspiradora.",
        "Verificá espacio libre alrededor del equipo.",
        "Comprobá el ventilador del condensador si el modelo lo tiene.",
        "La temperatura ambiente muy alta también sube la presión — normal en verano extremo.",
        "Si con el condensador limpio sigue alto → posible exceso de gas."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // TRABAJA CONTINUO + PSI OK = TERMOSTATO / SELLADO
    if (d.chkContinuo && psiOk) return this.dx({
      icono: "🔄",
      titulo: "Compresor continuo — verificar control y sellado",
      certeza: 72,
      causa: "Con presión en rango pero compresor que nunca para, el problema suele ser externo al sistema refrigerante.",
      pasos: [
        "Revisá el sellado de puertas: pasá un papel por el burlete con puerta cerrada — no debe salir fácil.",
        "Verificá que el sensor de temperatura (NTC) esté bien colocado y no esté dañado.",
        "Revisá la placa de control: algunos modelos tienen modos especiales que hacen trabajar continuo.",
        "Verificá la temperatura interior real con termómetro: si no baja de setpoint, el control sigue pidiendo frío.",
        "Si el sellado y sensor están ok → posible placa o termostato fuera de calibración."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // ═══════════════════════════════════════════════
    // DIAGNÓSTICO POR TEMPERATURA REAL
    // ═══════════════════════════════════════════════

    // PATRÓN CLÁSICO NO FROST: freezer frío, heladera caliente — por temperatura
    if (ambosTemps && freezerBien && heladeraMal && !d.chkEvapCongelado && !psi) return this.dx({
      icono: "🌬️❄️",
      titulo: `Freezer ${tFreezer}°C ✅ — Heladera ${tHeladera}°C ❌`,
      certeza: 92,
      causa: `El freezer está a ${tFreezer}°C (correcto), pero la heladera está a ${tHeladera}°C — mucho más caliente de lo normal (3-8°C). Este es el síntoma más clásico de falla en el sistema de deshielo del No Frost: el evaporador está congelado y bloquea la circulación de aire hacia la heladera.`,
      pasos: [
        "PRIMERO: deshielo manual forzado — desconectá 24-48 horas con puertas abiertas.",
        "Si después del deshielo la heladera enfría bien aunque sea por unas horas: confirmás falla de deshielo.",
        "Verificá en orden: resistencia de deshielo (medir en Ω), bimetal (continuidad en frío), timer o placa.",
        "También verificá que el ventilador del evaporador gire con el compresor corriendo."
      ],
      alerta: "💡 Antes de abrir cualquier componente: hacé el deshielo manual. Te confirma el diagnóstico y muchas veces 'resetea' el sistema temporalmente.",
      datos: { psi, a, rango }
    });

    // AMBOS FRÍOS — sistema ok por temperatura
    if (ambosTemps && freezerBien && heladeraBien && !psi) return this.dx({
      icono: "✅",
      titulo: `Temperatures normales — Freezer ${tFreezer}°C, Heladera ${tHeladera}°C`,
      certeza: 88,
      causa: `Freezer a ${tFreezer}°C y heladera a ${tHeladera}°C — ambos dentro del rango normal. El sistema refrigerante y el ciclo de deshielo están funcionando correctamente.`,
      pasos: [
        "Si el cliente reporta problema intermitente: dejá un termómetro adentro y revisá en 24 horas.",
        "Verificá que el ciclo de deshielo ocurra regularmente (cada 8-12 horas).",
        "Revisá burlete de puertas como mantenimiento preventivo.",
        "Anotá las temperaturas como baseline para futuras visitas."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // AMBOS MAL — fuga o compresor
    if (ambosTemps && freezerMal && heladeraMal && !psi) return this.dx({
      icono: "❌❌",
      titulo: `Sin frío — Freezer ${tFreezer}°C, Heladera ${tHeladera}°C`,
      certeza: 84,
      causa: `Ni el freezer (${tFreezer}°C) ni la heladera (${tHeladera}°C) están fríos. Cuando ambos fallan en No Frost, el problema está antes del evaporador: fuga de gas, compresor o problema eléctrico.`,
      pasos: [
        "Verificá que el compresor esté arrancando y corriendo.",
        "Si corre: conectá manómetro para ver si hay gas en el sistema.",
        "Si el PSI es muy bajo: buscar fuga antes de cargar gas.",
        "Si el compresor no arranca: diagnóstico eléctrico (PTC, Klixon, tensión, placa)."
      ],
      alerta: d.gas === "R600a" ? "🔴 R600a es INFLAMABLE. Ventilá bien antes de trabajar." : null,
      datos: { psi, a, rango }
    });

    // ESCARCHA EN PAREDES + FREEZER FRÍO — normal vs exceso humedad
    if (d.chkEscarcha && freezerBien && heladeraBien && !psi) return this.dx({
      icono: "❄️🚪",
      titulo: `Escarcha con temperaturas normales — posible burlete o humedad`,
      certeza: 76,
      causa: `El sistema enfría bien (Freezer ${tFreezer}°C, Heladera ${tHeladera}°C) pero hay escarcha visible. Con temperaturas normales, la escarcha indica entrada de humedad por burlete deteriorado o apertura frecuente de puerta.`,
      pasos: [
        "Revisá el burlete de puertas en todo el perímetro — debe adherirse completamente.",
        "Verificá que las puertas cierren bien y no queden entreabiertos por sobrestock.",
        "En climas húmedos (costa, NEA) la escarcha es más frecuente — es normal.",
        "Si la escarcha crece rápido y los ciclos de deshielo no la eliminan: revisar sistema de deshielo."
      ],
      alerta: null,
      datos: { psi, a, rango }
    });

    // TODO OK
    return this.dx({
      icono: "✅",
      titulo: "Sistema en rango normal",
      certeza: 87,
      causa: `PSI de ${psi} y amperaje de ${a}A están en valores normales para ${d.gas} en No Frost.`,
      pasos: [
        "Verificá que el ciclo de deshielo funcione: el equipo debería hacer deshielo cada 8-12 horas.",
        "Comprobá temperatura real: freezer -12°C a -18°C, heladera 3°C a 8°C.",
        "Verificá que el ventilador del evaporador gire normalmente.",
        "Revisá el sellado de puertas como mantenimiento preventivo.",
        "Anotá los valores como baseline para futuras revisiones."
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
        ${a ? `<div class="dx-dato ${a < 1.0 ? 'dx-bajo' : a > 2.5 ? 'dx-alto' : 'dx-ok'}">
          <span class="dx-dato-label">AMP medido</span>
          <span class="dx-dato-val">${a}A</span>
          <span class="dx-dato-ref">1.0-2.5A</span>
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
