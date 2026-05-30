// =====================================================
// HVAC PRO ARGENTINA
// BTU-CALC.JS — Calculadora de dimensionamiento
// =====================================================

const BTUCalc = {

  // Factores de carga térmica adaptados al contexto argentino
  // Fuente: normas ASHRAE adaptadas al clima local
  factores: {
    // W/m² según orientación y tipo de cerramiento
    paredes: {
      norte:  30,  // menos sol en AR (hemisferio sur)
      sur:    15,
      este:   45,  // sol de mañana
      oeste:  60,  // sol de tarde — el más crítico en AR
      techo:  80   // radiación directa
    },
    // Personas: calor sensible + latente
    personas: {
      reposo:    120,  // W/persona (dormitorio, sala)
      oficina:   150,
      actividad: 200   // local comercial, gym
    },
    // Equipos/iluminación
    equipos: {
      residencial:  15,  // W/m²
      oficina:      25,
      comercial:    40
    },
    // Renovación de aire (según tipo de local)
    ventilacion: {
      residencial: 0.5,   // renovaciones/hora
      oficina:     1.5,
      comercial:   2.0,
      gastronomia: 3.0
    },
    // Conversión
    WATT_TO_FG:  0.8598,   // 1W = 0.8598 kcal/h
    WATT_TO_BTU: 3.412,    // 1W = 3.412 BTU/h
    FG_TO_BTU:   3.968,    // 1 FG = 3.968 BTU/h
    FG_TO_WATT:  1.163     // 1 FG = 1.163 W
  },

  // Zonas climáticas Argentina (temperatura de diseño verano)
  zonas: {
    nea:       { nombre: "NEA (Corrientes, Formosa, Chaco, Misiones)", tExtVer: 38, tExtInv: 10 },
    noa:       { nombre: "NOA (Salta, Jujuy, Tucumán, Santiago)", tExtVer: 36, tExtInv: 8  },
    cuyo:      { nombre: "Cuyo (Mendoza, San Juan, San Luis)", tExtVer: 38, tExtInv: 2   },
    pampeana:  { nombre: "Región pampeana (Buenos Aires, Córdoba, Santa Fe)", tExtVer: 34, tExtInv: 5   },
    amba:      { nombre: "AMBA (Gran Buenos Aires)", tExtVer: 33, tExtInv: 6   },
    patagonia: { nombre: "Patagonia (Neuquén, Río Negro, Santa Cruz, Chubut)", tExtVer: 28, tExtInv: -5  }
  },

  async render() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="btuBack">←</div>
  <div>
    <h1 class="hvac-title">📐 Calculadora BTU</h1>
    <p class="hvac-subtitle">Dimensionamiento de equipos</p>
  </div>
</header>

<div class="ft-info-badge" style="margin:12px 16px 4px;">
  📐 Calculá la capacidad de enfriamiento necesaria para cualquier ambiente. Resultado en FG, BTU y recomendación de equipo.
</div>

<!-- DATOS DEL AMBIENTE -->
<div class="dx-etapa-label">Datos del ambiente</div>
<div class="dx-card">

  <div class="dx-field">
    <label class="dx-label">📍 Zona climática</label>
    <select class="hvac-select" id="btuZona">
      <option value="amba">AMBA (Gran Buenos Aires)</option>
      <option value="pampeana">Región pampeana (Bs.As., Córdoba, Santa Fe)</option>
      <option value="nea">NEA (Corrientes, Formosa, Chaco, Misiones)</option>
      <option value="noa">NOA (Salta, Jujuy, Tucumán, Santiago)</option>
      <option value="cuyo">Cuyo (Mendoza, San Juan, San Luis)</option>
      <option value="patagonia">Patagonia (Neuquén, Río Negro, Santa Cruz)</option>
    </select>
  </div>

  <div class="dx-field">
    <label class="dx-label">🏠 Tipo de uso</label>
    <select class="hvac-select" id="btuUso">
      <option value="residencial">Residencial (dormitorio, sala, comedor)</option>
      <option value="oficina">Oficina o consultorio</option>
      <option value="comercial">Local comercial</option>
      <option value="gastronomia">Gastronomía (con cocina)</option>
    </select>
  </div>

  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">📏 Largo del ambiente (m)</label>
      <input type="number" class="hvac-input" id="btuLargo" placeholder="ej: 5" step="0.5" min="1"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">📏 Ancho del ambiente (m)</label>
      <input type="number" class="hvac-input" id="btuAncho" placeholder="ej: 4" step="0.5" min="1"/>
    </div>
  </div>

  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">📏 Altura del techo (m)</label>
      <input type="number" class="hvac-input" id="btuAltura" placeholder="ej: 2.7" step="0.1" min="2"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">👥 Cantidad de personas habituales</label>
      <input type="number" class="hvac-input" id="btuPersonas" placeholder="ej: 2" step="1" min="0" value="2"/>
    </div>
  </div>

</div>

<!-- CARACTERÍSTICAS -->
<div class="dx-etapa-label">Características del ambiente</div>
<div class="dx-card">

  <div class="dx-field">
    <label class="dx-label">☀️ Orientación de la pared o ventana con más sol</label>
    <select class="hvac-select" id="btuOrientacion">
      <option value="norte">Norte (poco sol en Argentina)</option>
      <option value="este">Este (sol de mañana)</option>
      <option value="oeste">Oeste (sol de tarde — el más caluroso)</option>
      <option value="sur">Sur (sin sol directo)</option>
    </select>
  </div>

  <div class="dx-field">
    <label class="dx-label">🏠 ¿Hay piso/techo expuesto al sol o exterior?</label>
    <select class="hvac-select" id="btuTecho">
      <option value="si">Sí — piso de arriba desocupado o techo a la intemperie</option>
      <option value="no">No — hay piso habitado arriba</option>
    </select>
  </div>

  <div class="dx-field">
    <label class="dx-label">🪟 Superficie de ventanas expuestas al sol (m²)</label>
    <input type="number" class="hvac-input" id="btuVentanas"
      placeholder="ej: 2 (ventana 1m x 2m)" step="0.5" min="0" value="2"/>
    <span style="font-size:11px;color:#445566;margin-top:4px;display:block;">
      Solo las ventanas que reciben sol directo
    </span>
  </div>

  <div class="dx-field">
    <label class="dx-label">💡 Cantidad de equipos eléctricos importantes</label>
    <select class="hvac-select" id="btuEquipos">
      <option value="pocos">Pocos (TV, algunas luces)</option>
      <option value="medio">Medio (PC, varias luces, electrodomésticos)</option>
      <option value="muchos">Muchos (servidores, múltiples PCs, cocina)</option>
    </select>
  </div>

</div>

<button class="calc-btn" style="margin:4px 16px;width:calc(100% - 32px);" id="calcBTU">
  📐 Calcular dimensionamiento
</button>

<div id="btuResult"></div>
`;

    this.bindEvents();
  },

  bindEvents() {
    document.getElementById("btuBack")?.addEventListener("click", () => Router.back());
    document.getElementById("calcBTU")?.addEventListener("click", () => this.calcular());
  },

  calcular() {
    const zona        = document.getElementById("btuZona").value;
    const uso         = document.getElementById("btuUso").value;
    const largo       = parseFloat(document.getElementById("btuLargo").value);
    const ancho       = parseFloat(document.getElementById("btuAncho").value);
    const altura      = parseFloat(document.getElementById("btuAltura").value);
    const personas    = parseInt(document.getElementById("btuPersonas").value) || 0;
    const orientacion = document.getElementById("btuOrientacion").value;
    const techo       = document.getElementById("btuTecho").value;
    const ventanas    = parseFloat(document.getElementById("btuVentanas").value) || 0;
    const equipos_nivel = document.getElementById("btuEquipos").value;

    const el = document.getElementById("btuResult");
    if (!el) return;

    if (!largo || !ancho || !altura) {
      el.innerHTML = `<div class="calc-error">⚠️ Ingresá las dimensiones del ambiente.</div>`;
      return;
    }

    const z   = this.zonas[zona];
    const sup = largo * ancho;
    const vol = sup * altura;

    // ── CARGAS TÉRMICAS ──────────────────────────────

    // 1. Carga por paredes y ventanas (transmisión + radiación solar)
    const cargaParedes  = sup * this.factores.paredes[orientacion];
    const cargaVentanas = ventanas * 200; // W/m² ventana con sol (vidrio simple)

    // 2. Carga por techo
    const cargaTecho = techo === "si" ? sup * this.factores.paredes.techo : sup * 20;

    // 3. Carga por personas
    const wPersona   = uso === "residencial" ? this.factores.personas.reposo
                     : uso === "oficina"     ? this.factores.personas.oficina
                     : this.factores.personas.actividad;
    const cargaPersonas = personas * wPersona;

    // 4. Carga por equipos e iluminación
    const wEquipos  = uso === "residencial"  ? this.factores.equipos.residencial
                    : uso === "oficina"      ? this.factores.equipos.oficina
                    : this.factores.equipos.comercial;
    const factorEquipos = equipos_nivel === "pocos" ? 0.7
                        : equipos_nivel === "medio" ? 1.0 : 1.8;
    const cargaEquipos  = sup * wEquipos * factorEquipos;

    // 5. Ventilación / infiltración
    const renov    = this.factores.ventilacion[uso] || 0.5;
    const deltaT   = z.tExtVer - 24; // diferencia temp exterior - interior deseado
    const cargaVent = vol * renov * 0.34 * deltaT; // W

    // 6. Factor corrección por zona climática
    const factorZona = uso === "gastronomia" ? 1.3 : 1.0;

    // ── TOTAL ────────────────────────────────────────
    const totalW = (cargaParedes + cargaVentanas + cargaTecho +
                    cargaPersonas + cargaEquipos + cargaVent) * factorZona;

    // Factor de seguridad del 15%
    const totalConSeguridad = totalW * 1.15;

    const totalFG  = totalConSeguridad * this.factores.WATT_TO_FG;
    const totalBTU = totalConSeguridad * this.factores.WATT_TO_BTU;

    // ── RECOMENDACIÓN DE EQUIPO ──────────────────────
    const equipo = this.recomendarEquipo(totalFG);

    // ── DESGLOSE ────────────────────────────────────
    const desglose = [
      { label: "Paredes/radiación solar",  valor: cargaParedes,  pct: Math.round(cargaParedes / totalW * 100) },
      { label: "Ventanas con sol",         valor: cargaVentanas, pct: Math.round(cargaVentanas / totalW * 100) },
      { label: "Techo/piso expuesto",      valor: cargaTecho,    pct: Math.round(cargaTecho / totalW * 100) },
      { label: `${personas} persona/s`,    valor: cargaPersonas, pct: Math.round(cargaPersonas / totalW * 100) },
      { label: "Equipos e iluminación",    valor: cargaEquipos,  pct: Math.round(cargaEquipos / totalW * 100) },
      { label: "Ventilación/infiltración", valor: cargaVent,     pct: Math.round(cargaVent / totalW * 100) }
    ];

    el.innerHTML = `
<div class="btu-result-card">

  <!-- RESULTADO PRINCIPAL -->
  <div class="btu-main">
    <div class="btu-val-row">
      <div class="btu-val-block">
        <div class="btu-val">${Math.round(totalFG)}</div>
        <div class="btu-val-label">Frigorías</div>
      </div>
      <div class="btu-val-sep">/</div>
      <div class="btu-val-block">
        <div class="btu-val" style="font-size:24px;">${Math.round(totalBTU)}</div>
        <div class="btu-val-label">BTU/h</div>
      </div>
      <div class="btu-val-sep">/</div>
      <div class="btu-val-block">
        <div class="btu-val" style="font-size:24px;">${(totalConSeguridad / 1000).toFixed(1)}</div>
        <div class="btu-val-label">kW</div>
      </div>
    </div>
    <div class="btu-zona-txt">Para ${sup.toFixed(0)} m² en ${z.nombre}</div>
  </div>

  <!-- RECOMENDACIÓN DE EQUIPO -->
  <div class="btu-equipo-card">
    <div class="btu-equipo-titulo">✅ Equipo recomendado</div>
    <div class="btu-equipo-nombre">${equipo.nombre}</div>
    <div class="btu-equipo-desc">${equipo.descripcion}</div>
    ${equipo.alternativa ? `<div class="btu-equipo-alt">💡 Alternativa: ${equipo.alternativa}</div>` : ""}
  </div>

  <!-- DESGLOSE -->
  <div class="btu-desglose-titulo">📊 Desglose de cargas</div>
  ${desglose.filter(d => d.valor > 0).map(d => `
  <div class="btu-desglose-row">
    <span class="btu-desglose-label">${d.label}</span>
    <div class="btu-desglose-bar-wrap">
      <div class="btu-desglose-bar" style="width:${d.pct}%"></div>
    </div>
    <span class="btu-desglose-pct">${d.pct}%</span>
    <span class="btu-desglose-w">${Math.round(d.valor)}W</span>
  </div>`).join("")}

  <!-- NOTAS -->
  <div class="btu-notas">
    <div class="btu-nota-titulo">📋 Consideraciones para Argentina</div>
    <div class="btu-nota-item">• Temperatura de diseño exterior en ${z.nombre}: ${z.tExtVer}°C verano</div>
    <div class="btu-nota-item">• Temperatura interior objetivo: 24°C</div>
    <div class="btu-nota-item">• Factor de seguridad aplicado: 15%</div>
    ${uso === "gastronomia" ? '<div class="btu-nota-item">• Factor gastronomía aplicado: +30% por cargas de cocina</div>' : ""}
    <div class="btu-nota-item">• Este cálculo es orientativo — para proyectos grandes consultá un profesional</div>
  </div>

</div>`;
  },

  recomendarEquipo(fg) {
    if (fg <= 2500) return {
      nombre: "Split 2250 FG (1/4 HP)",
      descripcion: "Ideal para dormitorios y espacios pequeños hasta 15 m². Bajo consumo.",
      alternativa: "Si el ambiente tiene mucha exposición solar, considerá 3000 FG."
    };
    if (fg <= 3500) return {
      nombre: "Split 3000 FG (1/3 HP)",
      descripcion: "Para ambientes de 15-20 m². El más vendido en Argentina para dormitorios.",
      alternativa: null
    };
    if (fg <= 5000) return {
      nombre: "Split 4500 FG (1/2 HP)",
      descripcion: "Para ambientes de 20-30 m². El más común en livingrooms y oficinas chicas.",
      alternativa: "Considerá Inverter para uso prolongado — recuperás el costo en 2-3 temporadas."
    };
    if (fg <= 6000) return {
      nombre: "Split 5500-6000 FG (3/4 HP)",
      descripcion: "Para ambientes de 30-40 m² o con alta carga térmica (mucho sol, equipos).",
      alternativa: null
    };
    if (fg <= 8000) return {
      nombre: "Split 7500 FG (1 HP)",
      descripcion: "Ambientes grandes de 40-55 m². Considerá Inverter obligatoriamente en este tamaño.",
      alternativa: "Multi-split si hay varios ambientes relacionados."
    };
    if (fg <= 10000) return {
      nombre: "Split 9000 FG (1.5 HP)",
      descripcion: "Para 55-70 m² o locales comerciales medianos. Generalmente requiere 220V dedicado.",
      alternativa: "Cassette si el ambiente no tiene pared libre para el evaporador."
    };
    if (fg <= 14000) return {
      nombre: "Split 12000 FG (2 HP) o Cassette",
      descripcion: "Locales comerciales grandes de 70-90 m². Evaluar cassette para distribución uniforme.",
      alternativa: "Considerar sistema multi-split o central si hay múltiples zonas."
    };
    return {
      nombre: `Sistema central o multi-split — ${Math.round(fg)} FG requeridas`,
      descripcion: "La capacidad requerida excede lo que un split convencional puede cubrir. Evaluar sistema central, multi-split o unidades de techo (piso-techo).",
      alternativa: "Consultar con un profesional HVAC para el diseño del sistema."
    };
  }

};
