// =====================================================
// HVAC PRO ARGENTINA
// COMERCIAL-ENGINE.JS — Diagnóstico clínico v2
// =====================================================

const ComercialEngine = {

  rangos: {
    R404A: { psiMin: 18, psiMax: 28, psiVacio: 8  },
    R134a: { psiMin: 0,  psiMax: 5,  psiVacio: -5 },
    R22:   { psiMin: 55, psiMax: 75, psiVacio: 30 },
    R448A: { psiMin: 22, psiMax: 35, psiVacio: 12 }
  },

  // Amperajes orientativos por HP
  amperajes: {
    "1/3": { min: 2.0, max: 3.5 },
    "1/2": { min: 2.5, max: 4.5 },
    "3/4": { min: 3.5, max: 6.0 },
    "1":   { min: 5.0, max: 8.0 },
    "1.5": { min: 7.0, max: 11.0 },
    "2":   { min: 9.0, max: 14.0 }
  },

  analyze(d) {

    const rango = this.rangos[d.gas] || this.rangos.R404A;
    const amp   = this.amperajes[d.hp] || this.amperajes["1/2"];
    const psi   = Number(d.psi) || 0;
    const a     = Number(d.amp) || 0;
    const tempAmbiente = Number(d.tempAmbiente) || 0;

    const psiAlto  = psi > rango.psiMax;
    const psiBajo  = psi > 0 && psi < rango.psiMin;
    const psiVacio = psi > 0 && psi < rango.psiVacio;
    const psiOk    = psi >= rango.psiMin && psi <= rango.psiMax;
    const ampAlto  = a > amp.max;
    const ampBajo  = a > 0 && a < amp.min;
    const ampOk    = a >= amp.min && a <= amp.max;

    // ═══════════════════════════════════════════════
    // COMPRESOR NO ARRANCA
    // ═══════════════════════════════════════════════

    if (d.arranca === "no") {
      if (d.chkCapacitor) return this.dx({
        icono: "🔋",
        titulo: "Capacitor — falla más frecuente en comercial",
        certeza: 87,
        causa: "En refrigeración comercial el capacitor es la falla de arranque más común. El calor del local y el trabajo intensivo lo fatigán rápido.",
        pasos: [
          "Medí el capacitor con capacímetro. En comercial suelen ser 25-55 µF según el HP.",
          "Tolerancia máxima ±10% del valor nominal — si está por debajo reemplazalo.",
          "Si el capacitor está ok, medí tensión en la bornera del compresor.",
          "Revisá el contactor (en unidades con control): deben cerrarse los contactos al pedir frío.",
          "Si hay tensión y capacitor ok → protector térmico o devanado del compresor."
        ],
        alerta: null,
        datos: { psi, a, rango, amp }
      });

      if (d.chkPresostato) return this.dx({
        icono: "🔴",
        titulo: "Presostato de alta presión disparado",
        certeza: 85,
        causa: "El presostato de alta se disparó como protección. El compresor no va a arrancar hasta que se resetee. Hay que encontrar por qué se disparó.",
        pasos: [
          "Resetear el presostato (si es manual) — generalmente un botón rojo en el presostato.",
          "Antes de resetear: revisá el condensador. Si está sucio, la alta presión sube hasta disparar.",
          "Limpiá el condensador completamente y luego resetea.",
          "Verificá que el ventilador del condensador esté girando.",
          "Si se vuelve a disparar después de limpiar → posible exceso de gas o problema en el condensador."
        ],
        alerta: "⚠️ No resetees sin revisar la causa — si el presostato se dispara seguido se quema.",
        datos: { psi, a, rango, amp }
      });

      return this.dx({
        icono: "⚡",
        titulo: "Compresor no arranca — revisión completa",
        certeza: 70,
        causa: "En refrigeración comercial hay más componentes de control que en doméstico. El diagnóstico eléctrico tiene más pasos.",
        pasos: [
          "Verificá tensión trifásica o monofásica según el equipo (220V mono o 380V tri).",
          "Revisá el contactor o relay: los contactos deben cerrar cuando el termostato pide frío.",
          "Medí el capacitor de arranque y de marcha si el equipo los tiene.",
          "Revisá el protector térmico del compresor (Klixon): continuidad en frío.",
          "Verificá el presostato de alta y baja: ambos deben tener continuidad en condiciones normales.",
          "Si todo está ok eléctricamente → compresor bloqueado o devanados quemados."
        ],
        alerta: null,
        datos: { psi, a, rango, amp }
      });
    }

    // ═══════════════════════════════════════════════
    // SIN DATOS MEDIDOS
    // ═══════════════════════════════════════════════

    if (!psi && !a) return this.dx({
      icono: "📊",
      titulo: "Necesitás mediciones para diagnóstico preciso",
      certeza: 0,
      causa: "El compresor arranca pero sin PSI y amperaje no hay diagnóstico confiable.",
      pasos: [
        "Conectá manifold en las válvulas de servicio (alta y baja).",
        "Medí amperaje con pinza en la línea del compresor.",
        "Anotá temperatura del local y temperatura objetivo (set point).",
        "Dejá el equipo en régimen 20 minutos antes de tomar medidas.",
        "Con esos datos volvé a correr el diagnóstico."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // ═══════════════════════════════════════════════
    // DIAGNÓSTICO POR CRUCES
    // ═══════════════════════════════════════════════

    // ALTA PRESIÓN + AMP ALTO + CONDENSADOR SUCIO
    if (psiAlto && ampAlto && d.chkCondSucio) return this.dx({
      icono: "🔥💨",
      titulo: "Condensador sucio — causa confirmada",
      certeza: 94,
      causa: `PSI de ${psi} (sobre el límite de ${rango.psiMax}) y amperaje de ${a}A elevado. Con condensador confirmado como sucio, esta es la causa directa.`,
      pasos: [
        "Apagá el equipo antes de limpiar.",
        "Limpiá el condensador con agua a presión moderada desde adentro hacia afuera (no aplastes las aletas).",
        "Si tiene mucha grasa (cocina, panadería) usá desengrasante específico para serpentines.",
        "Verificá que el ventilador del condensador gire a la velocidad correcta.",
        "Revisá que haya espacio libre alrededor para ventilación.",
        "Después de limpiar, encendé y esperá 20 minutos para que la presión se estabilice."
      ],
      alerta: "💡 En locales con cocina o mucho polvo, limpieza de condensador debe ser cada 2-3 meses.",
      datos: { psi, a, rango, amp }
    });

    // ALTA PRESIÓN + AMP ALTO SIN CONDENSADOR SUCIO = EXCESO GAS / VENTILACIÓN
    if (psiAlto && ampAlto && !d.chkCondSucio) return this.dx({
      icono: "⛽🔥",
      titulo: "Alta presión sin condensador sucio",
      certeza: 78,
      causa: `PSI de ${psi} elevado y amperaje de ${a}A alto pero el condensador está limpio. Hay que buscar otras causas.`,
      pasos: [
        "Verificá la ventilación del local donde está el condensador — temperatura ambiente alta sube la presión.",
        "Comprobá que el ventilador del condensador gire a la velocidad correcta y no esté trabado.",
        "Verificá si el equipo fue cargado de gas recientemente — posible exceso.",
        "Si hay presostato de alta: ¿se ha disparado últimamente? Eso confirma presión excesiva.",
        "Si el ventilador está ok y no hay exceso de gas → posible falla en válvula de expansión.",
        `Para ${d.gas}: presión normal de alta debería ser ${rango.psiMax + 30} a ${rango.psiMax + 60} PSI aproximadamente.`
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // BAJA PRESIÓN + AMP BAJO + EVAPORADOR CONGELADO = RESTRICCIÓN
    if (psiBajo && ampBajo && d.chkEvapCongelado) return this.dx({
      icono: "🧊🔒",
      titulo: "Evaporador congelado — restricción o deshielo",
      certeza: 88,
      causa: `PSI bajo (${psi} vs normal ${rango.psiMin}-${rango.psiMax}) y amperaje bajo con evaporador congelado. El flujo de refrigerante está restringido o el deshielo no funciona.`,
      pasos: [
        "Hacé deshielo manual del evaporador — apagá 12-24 horas con puertas abiertas.",
        "Si el equipo tiene deshielo automático: verificá que funcione (timer o placa).",
        "Con el evaporador descongelado: medí PSI y amperaje nuevamente.",
        "Si vuelve a congelarse rápido → restricción en capilar o filtro deshidratador tapado.",
        "Filtro deshidratador tapado: cae mucho frío antes del filtro, temperatura ambiente después.",
        "Si el deshielo automático no funciona → revisá resistencia de deshielo y termostato."
      ],
      alerta: "⚠️ Un evaporador congelado que no se trata termina dañando el compresor por retorno de líquido.",
      datos: { psi, a, rango, amp }
    });

    // BAJA PRESIÓN + AMP BAJO SIN OTROS SÍNTOMAS = FUGA
    if (psiBajo && ampBajo) return this.dx({
      icono: "💨",
      titulo: "Baja presión y amperaje — probable fuga",
      certeza: 82,
      causa: `PSI de ${psi} bajo el rango normal (${rango.psiMin}-${rango.psiMax}) con amperaje de ${a}A bajo. El sistema no tiene suficiente refrigerante para trabajar bien.`,
      pasos: [
        "Buscá la fuga antes de cargar gas: agua jabonosa en conexiones, válvulas y evaporador.",
        "En comercial revisar especialmente las válvulas de servicio — se aflojan con el tiempo.",
        "Reparada la fuga: vacío mínimo 30 minutos.",
        `Cargá ${d.gas} observando PSI y amperaje simultáneamente.`,
        `Objetivo: PSI ${rango.psiMin}-${rango.psiMax} con amperaje ${amp.min}-${amp.max}A.`
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // PSI OK + AMP ALTO = ELÉCTRICO
    if (psiOk && ampAlto) return this.dx({
      icono: "⚡🔥",
      titulo: "Amperaje alto con presión normal",
      certeza: 76,
      causa: `Presión en rango (${psi} PSI) pero amperaje de ${a}A supera el máximo esperado de ${amp.max}A para equipo de ${d.hp} HP.`,
      pasos: [
        "Verificá tensión de red: si cae de los 220V el amperaje sube.",
        "Medí las tres fases si es trifásico: desequilibrio causa amperaje elevado en alguna fase.",
        "Revisá el capacitor: en comercial suele haber capacitor de marcha y de arranque.",
        "Verificá que el condensador esté limpio — calor extra fuerza al compresor.",
        "Si todo está bien → devanado del compresor con falla incipiente."
      ],
      alerta: "⚠️ Amperaje sostenido por encima del máximo puede quemar el compresor o saltar el diferencial.",
      datos: { psi, a, rango, amp }
    });

    // NO LLEGA A TEMPERATURA + TODO OK
    if (d.chkNoTemp && psiOk && ampOk) return this.dx({
      icono: "🌡️❓",
      titulo: "No alcanza temperatura — sistema en rango",
      certeza: 75,
      causa: `PSI y amperaje están bien pero el equipo no llega a la temperatura objetivo. El problema es externo al sistema refrigerante.`,
      pasos: [
        "Verificá el sellado de puertas y cortinas de aire — las pérdidas de frío son muy comunes en comercial.",
        "Revisá la temperatura ambiente del local: si es muy alta, el equipo necesita más tiempo.",
        "Verificá que el evaporador esté limpio y el ventilador esté funcionando.",
        "Comprobá que el termostato esté bien calibrado y bien ubicado (no cerca de calor).",
        "Si el local tiene mucho tráfico o puertas abiertas frecuentes — puede ser subdimensionado.",
        "Calculá si la capacidad del equipo es suficiente para el volumen del local."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // TRABAJA CONTINUO + TODO OK
    if (d.chkContinuo && psiOk) return this.dx({
      icono: "🔄",
      titulo: "Compresor continuo — revisión de control y sellado",
      certeza: 72,
      causa: "El sistema trabaja continuamente con presión en rango. En comercial esto puede ser normal en días de calor extremo, pero si es permanente hay que revisar.",
      pasos: [
        "Verificá el termostato o controlador digital: puede estar mal calibrado o en modo continuo.",
        "Revisá el sellado de puertas, tapas y juntas del mueble.",
        "Verificá que las cortinas de aire (en exhibidoras abiertas) estén funcionando.",
        "Comprobá la temperatura real interior con termómetro calibrado.",
        "Si la temperatura no baja del setpoint → el equipo puede estar subdimensionado o la carga térmica es muy alta."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });

    // TODO NORMAL
    return this.dx({
      icono: "✅",
      titulo: "Sistema operando correctamente",
      certeza: 89,
      causa: `PSI de ${psi} y amperaje de ${a}A están dentro de los rangos normales para ${d.gas} con compresor de ${d.hp} HP.`,
      pasos: [
        "Verificá que el equipo alcance la temperatura objetivo.",
        "Registrá los valores como baseline para futuras visitas.",
        "Limpiá el condensador como mantenimiento preventivo.",
        "Verificá el sellado de puertas y juntas.",
        "En comercial con R404A: recordá que este gas está en etapa de reemplazo — evaluar reconversión a R448A en próximo servicio mayor."
      ],
      alerta: null,
      datos: { psi, a, rango, amp }
    });
  },

  dx({ icono, titulo, certeza, causa, pasos, alerta, datos }) {
    const barColor = certeza >= 85 ? "#00d9ff" : certeza >= 70 ? "#ff9b42" : "#8899aa";
    const { psi, a, rango, amp } = datos;
    const pasosHTML = pasos.map((p, i) => `
      <div class="dx-paso">
        <span class="dx-paso-num">${i + 1}</span>
        <span class="dx-paso-txt">${p}</span>
      </div>`).join("");
    const alertaHTML = alerta ? `<div class="dx-alerta">${alerta}</div>` : "";
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
      </div>`};
  }
};
