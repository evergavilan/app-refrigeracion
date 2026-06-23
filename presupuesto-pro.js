// =====================================================
// HVAC PRO ARGENTINA
// PRESUPUESTO-PRO.JS — Generador de presupuestos v1
// PDF con logo, diagnóstico, cliente, ítems y totales
// =====================================================

const PresupuestoPRO = {

  // Storage key
  KEY_ITEMS:    "hvac_presup_items",
  KEY_CLIENTE:  "hvac_presup_cliente",
  KEY_EMPRESA:  "hvac_empresa_config",

  // Ítems por defecto (materiales frecuentes)
  itemsDefault: [
    { cat: "gas",       desc: "Gas R410A (por kg)",          precio: 0 },
    { cat: "gas",       desc: "Gas R32 (por kg)",            precio: 0 },
    { cat: "gas",       desc: "Gas R22 (por kg)",            precio: 0 },
    { cat: "electrico", desc: "Capacitor dual",              precio: 0 },
    { cat: "electrico", desc: "PTC / relay de arranque",     precio: 0 },
    { cat: "electrico", desc: "Protector térmico (Klixon)",  precio: 0 },
    { cat: "filtro",    desc: "Filtro deshidratador",        precio: 0 },
    { cat: "filtro",    desc: "Válvula solenoide (bobina)",  precio: 0 },
    { cat: "mano_obra", desc: "Visita diagnóstico",          precio: 0 },
    { cat: "mano_obra", desc: "Carga de gas (vacío + carga)",precio: 0 },
    { cat: "mano_obra", desc: "Limpieza completa",           precio: 0 },
    { cat: "mano_obra", desc: "Reparación eléctrica",        precio: 0 }
  ],

  // Estado activo del presupuesto
  estado: {
    cliente:     { nombre: "", direccion: "", telefono: "" },
    equipo:      { tipo: "", marca: "", gas: "", frigorias: "" },
    diagnostico: "",
    items:       [],
    notas:       "",
    nro:         1
  },

  // ─────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────
  render() {
    const app = document.getElementById("app");
    if (!app) return;

    this.cargarEstado();

    app.innerHTML = `
<header class="hvac-header">
  <div class="module-back" id="presupBack">←</div>
  <div>
    <h1 class="hvac-title">📄 Presupuesto PRO</h1>
    <p class="hvac-subtitle">Generá y enviá en PDF</p>
  </div>
</header>

<!-- TABS -->
<div class="presup-tabs">
  <button class="presup-tab presup-tab-active" data-tab="datos">📋 Datos</button>
  <button class="presup-tab" data-tab="items">🛒 Ítems</button>
  <button class="presup-tab" data-tab="preview">👁️ Vista previa</button>
</div>

<div id="presupContent">
  ${this.renderTabDatos()}
</div>`;

    this.bindEvents();
  },

  // ─────────────────────────────────────────────
  // TAB 1 — DATOS DEL CLIENTE Y EQUIPO
  // ─────────────────────────────────────────────
  renderTabDatos() {
    const e = this.estado;
    const emp = this.getEmpresa();

    return `
<!-- Datos de la empresa (configuración) -->
<div class="dx-etapa-label">
  TU EMPRESA
  <button class="presup-config-btn" id="btnConfigEmpresa">⚙️ Configurar</button>
</div>
<div class="dx-card">
  ${emp.nombre
    ? `<div class="presup-empresa-preview">
        <div class="presup-empresa-nombre">${emp.nombre}</div>
        <div class="presup-empresa-datos">${[emp.telefono, emp.email, emp.direccion].filter(Boolean).join(" · ")}</div>
       </div>`
    : `<div class="presup-aviso">⚠️ Configurá los datos de tu empresa para que aparezcan en el PDF</div>`
  }
</div>

<!-- Cliente -->
<div class="dx-etapa-label">DATOS DEL CLIENTE</div>
<div class="dx-card">
  <div class="dx-field">
    <label class="dx-label">Nombre / Razón social</label>
    <input class="hvac-input" id="pNombre" placeholder="ej: Juan García" value="${e.cliente.nombre}"/>
  </div>
  <div class="dx-field" style="margin-top:8px">
    <label class="dx-label">Dirección</label>
    <input class="hvac-input" id="pDireccion" placeholder="ej: Av. Corrientes 1234, CABA" value="${e.cliente.direccion}"/>
  </div>
  <div class="dx-field" style="margin-top:8px">
    <label class="dx-label">Teléfono</label>
    <input class="hvac-input" id="pTelefono" placeholder="ej: 11 1234-5678" value="${e.cliente.telefono}"/>
  </div>
</div>

<!-- Equipo -->
<div class="dx-etapa-label">EQUIPO INTERVENIDO</div>
<div class="dx-card">
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">Tipo</label>
      <select class="hvac-select" id="pTipoEquipo">
        <option value="Split" ${e.equipo.tipo==="Split"?"selected":""}>Split</option>
        <option value="No Frost" ${e.equipo.tipo==="No Frost"?"selected":""}>No Frost</option>
        <option value="Heladera cíclica" ${e.equipo.tipo==="Heladera cíclica"?"selected":""}>Heladera cíclica</option>
        <option value="Equipo comercial" ${e.equipo.tipo==="Equipo comercial"?"selected":""}>Equipo comercial</option>
        <option value="Otro" ${e.equipo.tipo==="Otro"?"selected":""}>Otro</option>
      </select>
    </div>
    <div class="dx-field">
      <label class="dx-label">Gas</label>
      <select class="hvac-select" id="pGas">
        <option value="R410A" ${e.equipo.gas==="R410A"?"selected":""}>R410A</option>
        <option value="R32" ${e.equipo.gas==="R32"?"selected":""}>R32</option>
        <option value="R22" ${e.equipo.gas==="R22"?"selected":""}>R22</option>
        <option value="R404A" ${e.equipo.gas==="R404A"?"selected":""}>R404A</option>
        <option value="R134a" ${e.equipo.gas==="R134a"?"selected":""}>R134a</option>
        <option value="R600a" ${e.equipo.gas==="R600a"?"selected":""}>R600a</option>
        <option value="N/A" ${e.equipo.gas==="N/A"?"selected":""}>N/A</option>
      </select>
    </div>
  </div>
  <div class="dx-field" style="margin-top:8px">
    <label class="dx-label">Marca / Modelo</label>
    <input class="hvac-input" id="pMarca" placeholder="ej: Samsung WindFree 5500 FG" value="${e.equipo.marca}"/>
  </div>
</div>


<!-- Mediciones -->
<div class="dx-etapa-label">MEDICIONES <span style="color:#334455;font-weight:400;font-size:10px;">— opcionales, aparecen en el PDF</span></div>
<div class="dx-card">
  <div class="dx-field-row">
    <div class="dx-field">
      <label class="dx-label">📉 PSI Baja</label>
      <input class="hvac-input" id="pPsiBaja" placeholder="ej: 120" value="${e.mediciones?.psi || ''}"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">📈 PSI Alta</label>
      <input class="hvac-input" id="pPsiAlta" placeholder="ej: 330" value="${e.mediciones?.psiAlta || ''}"/>
    </div>
  </div>
  <div class="dx-field-row" style="margin-top:8px">
    <div class="dx-field">
      <label class="dx-label">⚡ Amperaje (A)</label>
      <input class="hvac-input" id="pAmp" placeholder="ej: 6.5" value="${e.mediciones?.amp || ''}"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">🌡️ Temp. succión (°C)</label>
      <input class="hvac-input" id="pTempSuc" placeholder="ej: 15" value="${e.mediciones?.tempSuccion || ''}"/>
    </div>
  </div>
  <div class="dx-field-row" style="margin-top:8px">
    <div class="dx-field">
      <label class="dx-label">🔥 SH (°C)</label>
      <input class="hvac-input" id="pSH" placeholder="ej: 7.5" value="${e.mediciones?.sh || ''}"/>
    </div>
    <div class="dx-field">
      <label class="dx-label">❄️ SC (°C)</label>
      <input class="hvac-input" id="pSC" placeholder="ej: 5.2" value="${e.mediciones?.sc || ''}"/>
    </div>
  </div>
  <div class="dx-field" style="margin-top:8px">
    <label class="dx-label">📊 Frigorías del equipo</label>
    <select class="hvac-select" id="pFrigorias">
      <option value="">— Seleccionar —</option>
      <option value="2250" ${e.equipo?.frigorias==="2250"?"selected":""}>2250 FG</option>
      <option value="3000" ${e.equipo?.frigorias==="3000"?"selected":""}>3000 FG</option>
      <option value="4500" ${e.equipo?.frigorias==="4500"?"selected":""}>4500 FG</option>
      <option value="5500" ${e.equipo?.frigorias==="5500"?"selected":""}>5500 FG</option>
      <option value="6000" ${e.equipo?.frigorias==="6000"?"selected":""}>6000 FG</option>
      <option value="7500" ${e.equipo?.frigorias==="7500"?"selected":""}>7500 FG</option>
      <option value="9000" ${e.equipo?.frigorias==="9000"?"selected":""}>9000 FG</option>
    </select>
  </div>
</div>

<!-- Diagnóstico -->
<div class="dx-etapa-label">
  DIAGNÓSTICO
  ${this.getDxHistorial() ? `<button class="presup-config-btn" id="btnImportDx">📥 Importar último dx</button>` : ""}
</div>
<div class="dx-card">
  <textarea class="hvac-input presup-textarea" id="pDiagnostico"
    placeholder="Describe el diagnóstico realizado. Podés importarlo del último diagnóstico de la app."
    rows="5">${e.diagnostico}</textarea>
</div>

<!-- Notas -->
<div class="dx-etapa-label">NOTAS / GARANTÍA</div>
<div class="dx-card">
  <textarea class="hvac-input presup-textarea" id="pNotas"
    placeholder="ej: Garantía 90 días sobre mano de obra. Repuestos sujetos a garantía del fabricante."
    rows="3">${e.notas}</textarea>
</div>

<div class="dx-btn-row">
  <button class="hvac-btn btn-primary" id="btnIrItems" style="width:100%">
    Continuar → Agregar ítems
  </button>
</div>`;
  },

  // ─────────────────────────────────────────────
  // TAB 2 — ÍTEMS DEL PRESUPUESTO
  // ─────────────────────────────────────────────
  renderTabItems() {
    const items = this.estado.items;
    const total = items.reduce((a, b) => a + (Number(b.precio) || 0), 0);
    const fmt   = (n) => new Intl.NumberFormat("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 }).format(n);

    const catLabels = {
      mano_obra: "🔧 Mano de obra",
      gas:       "⛽ Gas / Refrigerante",
      electrico: "⚡ Eléctrico",
      filtro:    "🔒 Filtros / Válvulas",
      otro:      "📦 Otros"
    };

    return `
<div class="dx-etapa-label">
  ÍTEMS DEL TRABAJO
  <button class="presup-config-btn" id="btnAgregarItem">+ Agregar</button>
</div>

<div class="presup-catalogo-link" id="btnAbrirCatalogo">
  <span class="presup-catalogo-ico">🛒</span>
  <div class="presup-catalogo-txt">
    <div class="presup-catalogo-titulo">Catálogo A&P Refrigeración</div>
    <div class="presup-catalogo-sub">Consultar precios de repuestos y kits de instalación</div>
  </div>
  <span class="presup-catalogo-arrow">↗</span>
</div>

${items.length === 0
  ? `<div class="presup-empty">
      <div style="font-size:32px;margin-bottom:8px">📋</div>
      <div style="color:#445566;font-size:13px">Tocá "+ Agregar" para sumar materiales o mano de obra</div>
     </div>`
  : `<div class="presup-items-list" id="presupItemsList">
      ${items.map((item, i) => `
      <div class="presup-item-row" data-idx="${i}">
        <div class="presup-item-left">
          <span class="presup-item-cat">${catLabels[item.cat] || "📦 Otro"}</span>
          <span class="presup-item-desc">${item.desc || "Sin descripción"}</span>
        </div>
        <div class="presup-item-right">
          <span class="presup-item-precio">${fmt(item.precio)}</span>
          <button class="presup-item-del" data-idx="${i}">✕</button>
        </div>
      </div>`).join("")}
    </div>`
}

<!-- Total -->
<div class="presup-total-bloque">
  <span class="presup-total-label">TOTAL</span>
  <span class="presup-total-val">${fmt(total)}</span>
</div>

<!-- Modal agregar ítem (oculto) -->
<div class="presup-modal" id="presupModal" style="display:none">
  <div class="presup-modal-card">
    <div class="presup-modal-titulo">➕ Agregar ítem</div>

    <div class="dx-field" style="margin-bottom:10px">
      <label class="dx-label">Categoría</label>
      <select class="hvac-select" id="newItemCat">
        <option value="mano_obra">🔧 Mano de obra</option>
        <option value="gas">⛽ Gas / Refrigerante</option>
        <option value="electrico">⚡ Eléctrico</option>
        <option value="filtro">🔒 Filtros / Válvulas</option>
        <option value="otro">📦 Otro</option>
      </select>
    </div>

    <div class="dx-field" style="margin-bottom:10px">
      <label class="dx-label">Descripción</label>
      <input class="hvac-input" id="newItemDesc" placeholder="ej: Gas R410A 0.95 kg" list="itemsSugeridos"/>
      <datalist id="itemsSugeridos">
        ${this.itemsDefault.map(i => `<option value="${i.desc}">`).join("")}
      </datalist>
    </div>

    <div class="dx-field" style="margin-bottom:16px">
      <label class="dx-label">Precio ($ ARS)</label>
      <input class="hvac-input" id="newItemPrecio" type="number" placeholder="ej: 15000" min="0"/>
    </div>

    <div class="dx-btn-row">
      <button class="hvac-btn btn-secondary" id="btnCancelarItem">Cancelar</button>
      <button class="hvac-btn btn-primary" id="btnConfirmarItem">Agregar</button>
    </div>
  </div>
</div>

<div class="dx-btn-row" style="margin-top:12px">
  <button class="hvac-btn btn-primary" id="btnIrPreview" style="width:100%">
    👁️ Ver vista previa
  </button>
</div>`;
  },

  // ─────────────────────────────────────────────
  // TAB 3 — VISTA PREVIA + BOTÓN PDF
  // ─────────────────────────────────────────────
  renderTabPreview() {
    const e    = this.estado;
    const emp  = this.getEmpresa();
    const fmt  = (n) => new Intl.NumberFormat("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 }).format(n);
    const total = e.items.reduce((a, b) => a + (Number(b.precio) || 0), 0);
    const fecha = new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" });
    const nro   = String(e.nro).padStart(4, "0");

    const catLabels = {
      mano_obra: "Mano de obra", gas: "Gas / Refrigerante",
      electrico: "Eléctrico", filtro: "Filtros / Válvulas", otro: "Otros"
    };

    return `
<div class="presup-preview-card">

  <!-- Header empresa -->
  <div class="prev-header">
    <div class="prev-logo-bloque">
      <div class="prev-logo-ico">❄️</div>
      <div>
        <div class="prev-empresa-nombre">${emp.nombre || "HVAC PRO"}</div>
        ${emp.matricula ? `<div class="prev-empresa-mat">Mat. ${emp.matricula}</div>` : ""}
      </div>
    </div>
    <div class="prev-nro-bloque">
      <div class="prev-nro-label">PRESUPUESTO</div>
      <div class="prev-nro">#${nro}</div>
      <div class="prev-fecha">${fecha}</div>
    </div>
  </div>

  <!-- Empresa -->
  ${emp.nombre ? `<div class="prev-empresa-datos">${[emp.telefono, emp.email, emp.direccion].filter(Boolean).join(" · ")}</div>` : ""}

  <div class="prev-divider"></div>

  <!-- Cliente -->
  <div class="prev-section">
    <div class="prev-section-label">CLIENTE</div>
    <div class="prev-cliente-nombre">${e.cliente.nombre || "—"}</div>
    ${e.cliente.direccion ? `<div class="prev-cliente-dato">${e.cliente.direccion}</div>` : ""}
    ${e.cliente.telefono  ? `<div class="prev-cliente-dato">📞 ${e.cliente.telefono}</div>` : ""}
  </div>

  <!-- Equipo -->
  <div class="prev-section">
    <div class="prev-section-label">EQUIPO</div>
    <div class="prev-equipo-row">
      ${e.equipo.tipo  ? `<span class="prev-equipo-tag">${e.equipo.tipo}</span>` : ""}
      ${e.equipo.gas   ? `<span class="prev-equipo-tag">${e.equipo.gas}</span>` : ""}
      ${e.equipo.marca ? `<span class="prev-equipo-marca">${e.equipo.marca}</span>` : ""}
    </div>
  </div>

  <!-- Diagnóstico -->
  ${e.diagnostico ? `
  <div class="prev-section">
    <div class="prev-section-label">DIAGNÓSTICO</div>
    <div class="prev-diagnostico">${e.diagnostico}</div>
  </div>` : ""}

  <div class="prev-divider"></div>

  <!-- Ítems -->
  <div class="prev-section">
    <div class="prev-section-label">DETALLE DE TRABAJOS Y MATERIALES</div>
    ${e.items.length === 0
      ? `<div style="color:#445566;font-size:12px;padding:8px 0">Sin ítems cargados</div>`
      : `<table class="prev-tabla">
          <thead>
            <tr>
              <th style="width:50%">Descripción</th>
              <th>Categoría</th>
              <th style="text-align:right">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${e.items.map(item => `
            <tr>
              <td>${item.desc}</td>
              <td style="color:#556677">${catLabels[item.cat] || item.cat}</td>
              <td style="text-align:right;font-weight:600;color:#ccd6ee">${fmt(item.precio)}</td>
            </tr>`).join("")}
          </tbody>
        </table>`
    }
  </div>

  <!-- Total -->
  <div class="prev-total-row">
    <span class="prev-total-label">TOTAL</span>
    <span class="prev-total-val">${fmt(total)}</span>
  </div>

  <!-- Notas -->
  ${e.notas ? `
  <div class="prev-divider"></div>
  <div class="prev-notas">${e.notas}</div>` : ""}

  <!-- Footer app -->
  <div class="prev-footer">
    Presupuesto generado con <strong>HVAC PRO Argentina</strong> · Diagnóstico profesional en campo
  </div>

</div>

<!-- Botones de acción -->
<div class="presup-acciones">
  <button class="hvac-btn btn-primary presup-pdf-btn" id="btnGenerarPDF">
    📄 Generar PDF
  </button>
  <button class="hvac-btn btn-secondary" id="btnCompartirText">
    📱 Compartir texto
  </button>
</div>`;
  },

  // ─────────────────────────────────────────────
  // MODAL CONFIGURACIÓN EMPRESA
  // ─────────────────────────────────────────────
  renderModalEmpresa() {
    const emp = this.getEmpresa();
    return `
<div class="presup-modal" id="presupModalEmpresa" style="display:flex">
  <div class="presup-modal-card">
    <div class="presup-modal-titulo">⚙️ Datos de tu empresa</div>
    <div class="presup-modal-sub">Se guardan en el dispositivo y aparecen en todos los presupuestos</div>

    <div class="dx-field" style="margin-bottom:10px">
      <label class="dx-label">Nombre / Empresa</label>
      <input class="hvac-input" id="empNombre" placeholder="ej: Ever Refrigeración" value="${emp.nombre || ""}"/>
    </div>
    <div class="dx-field" style="margin-bottom:10px">
      <label class="dx-label">Teléfono</label>
      <input class="hvac-input" id="empTelefono" placeholder="ej: 11 5555-1234" value="${emp.telefono || ""}"/>
    </div>
    <div class="dx-field" style="margin-bottom:10px">
      <label class="dx-label">Email</label>
      <input class="hvac-input" id="empEmail" placeholder="ej: ever@mail.com" value="${emp.email || ""}"/>
    </div>
    <div class="dx-field" style="margin-bottom:10px">
      <label class="dx-label">Dirección</label>
      <input class="hvac-input" id="empDireccion" placeholder="ej: Buenos Aires, Argentina" value="${emp.direccion || ""}"/>
    </div>
    <div class="dx-field" style="margin-bottom:16px">
      <label class="dx-label">Matrícula (opcional)</label>
      <input class="hvac-input" id="empMatricula" placeholder="ej: MAT-12345" value="${emp.matricula || ""}"/>
    </div>

    <div class="dx-btn-row">
      <button class="hvac-btn btn-secondary" id="btnCancelarEmpresa">Cancelar</button>
      <button class="hvac-btn btn-primary" id="btnGuardarEmpresa">Guardar</button>
    </div>
  </div>
</div>`;
  },

  // ─────────────────────────────────────────────
  // GENERACIÓN DE PDF con jsPDF — Diseño profesional v2
  // ─────────────────────────────────────────────
  async generarPDF() {
    if (!window.jspdf) {
      await this.cargarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    }

    const { jsPDF } = window.jspdf;
    const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const e     = this.estado;
    const emp   = this.getEmpresa();
    const fmt   = (n) => `$ ${new Intl.NumberFormat("es-AR").format(Math.round(n))}`;
    const total = e.items.reduce((a, b) => a + (Number(b.precio) || 0), 0);
    const fecha = new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" });
    const nro   = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(e.nro).padStart(3,"0")}`;
    const W = 210, M = 14;

    // Paleta — fondo blanco profesional como los ejemplos
    const DARK_BG  = [10,  25,  55];   // header oscuro
    const CYAN_C   = [0,   160, 210];  // cyan acento
    const CYAN_L   = [0,   180, 230];  // cyan claro
    const MID_BG   = [20,  45,  90];   // bloques medios
    const CARD_BG  = [230, 240, 255];  // fondo tarjetas claras
    const TXT_DARK = [15,  30,  60];   // texto oscuro sobre claro
    const TXT_MID  = [70,  90, 130];   // texto gris
    const WHITE    = [255, 255, 255];
    const ORANGE   = [255, 120,  30];
    const GREEN    = [0,   180,  80];
    const RED      = [220,  50,  50];

    let y = 0;

    // ══════════════════════════════════════════
    // HEADER — oscuro con logo empresa
    // ══════════════════════════════════════════
    doc.setFillColor(...DARK_BG);
    doc.rect(0, 0, W, 52, "F");

    // Franja cyan izquierda
    doc.setFillColor(...CYAN_C);
    doc.rect(0, 0, 4, 52, "F");

    // Título izquierda
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("PRESUPUESTO", M + 3, 18);
    doc.setFontSize(26);
    doc.setTextColor(...CYAN_L);
    doc.text("PRO", M + 3 + doc.getTextWidth("PRESUPUESTO "), 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...CYAN_L);
    doc.text("DIAGNOSTICO CLINICO HVAC", M + 3, 25);

    // Línea separadora horizontal
    doc.setDrawColor(...CYAN_C);
    doc.setLineWidth(0.4);
    doc.line(M + 3, 28, 115, 28);

    // Fecha y número
    doc.setFontSize(8);
    doc.setTextColor(160, 185, 220);
    doc.text(`Fecha: ${fecha}`, M + 3, 35);
    doc.text(`N° Presupuesto: ${nro}`, M + 3, 41);

    // Logo empresa — lado derecho del header
    const empNombre = emp.nombre || "HVAC PRO";
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(empNombre, W - M, 18, { align: "right" });

    if (emp.matricula) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...CYAN_L);
      doc.text(`Mat. Prof. HVAC: ${emp.matricula}`, W - M, 24, { align: "right" });
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 185, 220);
    const empContacto = [emp.telefono, emp.email].filter(Boolean);
    empContacto.forEach((c, i) => doc.text(c, W - M, 31 + i * 6, { align: "right" }));

    // Línea roja decorativa bajo empresa (como el ejemplo)
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.5);
    doc.line(W - M - 45, 45, W - M, 45);

    y = 58;

    // ══════════════════════════════════════════
    // BLOQUE CLIENTE
    // ══════════════════════════════════════════
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(200, 215, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, W - M * 2, 28, 3, 3, "FD");

    // Icono usuario (círculo)
    doc.setFillColor(...CYAN_C);
    doc.circle(M + 8, y + 10, 6, "F");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text("U", M + 5.5, y + 13);

    // Label CLIENTE
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN_C);
    doc.text("CLIENTE", M + 18, y + 5);

    // Nombre cliente
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TXT_DARK);
    doc.text(e.cliente.nombre || "Sin nombre", M + 18, y + 14);

    // Tel + dir
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TXT_MID);
    if (e.cliente.telefono) doc.text(`Tel: ${e.cliente.telefono}`, M + 18, y + 21);

    // Separador vertical
    doc.setDrawColor(190, 210, 240);
    doc.setLineWidth(0.4);
    doc.line(W / 2, y + 4, W / 2, y + 24);

    // Dirección (derecha)
    if (e.cliente.direccion) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...CYAN_C);
      doc.text("DIRECCION", W / 2 + 5, y + 5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TXT_MID);
      const dirLines = doc.splitTextToSize(e.cliente.direccion, W / 2 - M - 5);
      doc.text(dirLines, W / 2 + 5, y + 12);
    }

    y += 34;

    // ══════════════════════════════════════════
    // BLOQUE DIAGNÓSTICO PRINCIPAL
    // ══════════════════════════════════════════
    doc.setFillColor(...DARK_BG);
    doc.setDrawColor(...CYAN_C);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, W - M * 2, e.diagnostico ? 52 : 28, 3, 3, "FD");

    // Icono diagnóstico (círculo cyan)
    doc.setFillColor(...CYAN_C);
    doc.circle(M + 9, y + 9, 6.5, "F");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text("+", M + 7, y + 12);

    // Label
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN_L);
    doc.text("DIAGNOSTICO PRINCIPAL", M + 20, y + 7);

    // Título diagnóstico + ícono certeza
    const dxTitulo = e.dxTitulo || (e.diagnostico ? e.diagnostico.split("\n")[0].slice(0, 55) : "Sin diagnóstico cargado");
    const certeza  = Number(e.dxCerteza) || 0;
    const certColor = certeza >= 85 ? GREEN : certeza >= 70 ? [255, 160, 0] : RED;

    // Círculo de certeza
    if (certeza > 0) {
      doc.setFillColor(...certColor);
      doc.circle(M + 20, y + 18, 4, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(certeza >= 85 ? "✓" : "!", M + 18.5, y + 20);
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(dxTitulo, certeza > 0 ? M + 28 : M + 20, y + 19);

    // Descripción del diagnóstico
    if (e.diagnostico) {
      const dxTexto = e.diagnostico.split("\n").slice(1).join(" ").trim() || e.diagnostico;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 185, 220);
      const dxLines = doc.splitTextToSize(dxTexto.slice(0, 280), W - M * 2 - 10);
      doc.text(dxLines.slice(0, 3), M + 6, y + 29);
    }

    // Certeza en texto
    if (certeza > 0) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...certColor);
      doc.text(`Certeza del diagnostico: ${certeza}%`, M + 6, y + (e.diagnostico ? 47 : 23));
    }

    y += e.diagnostico ? 58 : 34;

    // ══════════════════════════════════════════
    // TABLA DE MEDICIONES (si hay datos)
    // ══════════════════════════════════════════
    const med = e.mediciones || {};
    const teneMediciones = med.psi || med.amp || med.psiAlta || med.sh || med.sc || med.tempSuccion;

    if (teneMediciones) {
      // Título sección
      doc.setFillColor(...MID_BG);
      doc.setDrawColor(...CYAN_C);
      doc.setLineWidth(0.2);
      doc.roundedRect(M, y, W - M * 2, 30, 2, 2, "FD");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...CYAN_L);
      doc.text("RESUMEN DE MEDICIONES", M + 4, y + 6);

      // Celdas de medición
      const campos = [
        { label: "Refrig.", val: e.equipo.gas || "—" },
        { label: "Potencia", val: e.equipo.frigorias ? `${e.equipo.frigorias} FG` : "—" },
        { label: "PSI Baja", val: med.psi ? `${med.psi} PSI` : "—" },
        { label: "PSI Alta", val: med.psiAlta ? `${med.psiAlta} PSI` : "—" },
        { label: "Temp. Suc.", val: med.tempSuccion ? `${med.tempSuccion} °C` : "—" },
        { label: "SH", val: med.sh ? `${med.sh} °C` : "—" },
        { label: "SC", val: med.sc ? `${med.sc} °C` : "—" },
        { label: "Amperaje", val: med.amp ? `${med.amp} A` : "—" },
      ].filter(c => c.val !== "—");

      const cellW = (W - M * 2 - 8) / Math.min(campos.length, 4);
      campos.forEach((c, i) => {
        const col    = i % 4;
        const row    = Math.floor(i / 4);
        const cx     = M + 4 + col * cellW;
        const cy     = y + 10 + row * 10;

        doc.setFillColor(15, 35, 75);
        doc.roundedRect(cx, cy, cellW - 2, 9, 1, 1, "F");

        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TXT_MID);
        doc.text(c.label, cx + (cellW - 2) / 2, cy + 3.5, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...WHITE);
        doc.text(c.val, cx + (cellW - 2) / 2, cy + 8, { align: "center" });
      });

      y += 36;
    }

    // ══════════════════════════════════════════
    // TABLA DE ÍTEMS — PROPUESTA DE SERVICIO
    // ══════════════════════════════════════════
    // Header sección
    doc.setFillColor(...DARK_BG);
    doc.roundedRect(M, y, W - M * 2, 9, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN_L);
    doc.text("  PROPUESTA DE SERVICIO", M + 4, y + 6);
    y += 13;

    // Header columnas
    doc.setFillColor(...CYAN_C);
    doc.rect(M, y, W - M * 2, 7, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TXT_DARK);
    doc.text("DESCRIPCION", M + 3, y + 5);
    doc.text("DETALLE / CATEGORIA", 110, y + 5);
    doc.text("COSTO (ARS)", W - M - 2, y + 5, { align: "right" });
    y += 9;

    const catLabels = {
      mano_obra: "Mano de obra especializada",
      gas:       "Gas / Refrigerante",
      electrico: "Componente electrico",
      filtro:    "Filtros / Valvulas",
      otro:      "Otros"
    };

    if (e.items.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(...TXT_MID);
      doc.text("Sin items cargados", M + 4, y + 5);
      y += 10;
    } else {
      e.items.forEach((item, i) => {
        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFillColor(i % 2 === 0 ? 245 : 252, i % 2 === 0 ? 248 : 254, 255);
        doc.rect(M, y, W - M * 2, 8, "F");
        doc.setDrawColor(210, 225, 245);
        doc.setLineWidth(0.1);
        doc.line(M, y + 8, W - M, y + 8);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TXT_DARK);
        doc.text(item.desc || "—", M + 3, y + 5.5);

        doc.setFontSize(7.5);
        doc.setTextColor(...TXT_MID);
        doc.text(catLabels[item.cat] || item.cat, 110, y + 5.5);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(10, 80, 160);
        doc.text(fmt(item.precio), W - M - 2, y + 5.5, { align: "right" });

        y += 8;
      });
    }

    // ── TOTAL DEL SERVICIO ──
    y += 3;
    doc.setFillColor(...DARK_BG);
    doc.roundedRect(M, y, W - M * 2, 14, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN_L);
    doc.text("TOTAL DEL SERVICIO", M + 4, y + 6);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 150, 190);
    doc.text("Precios expresados en Pesos Argentinos", M + 4, y + 11);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN_L);
    doc.text(`${fmt(total)} ARS`, W - M - 2, y + 10, { align: "right" });

    y += 20;

    // ── NOTAS / GARANTÍA ──
    if (e.notas) {
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(190, 220, 245);
      doc.setLineWidth(0.3);
      doc.roundedRect(M, y, W - M * 2, 16, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...CYAN_C);
      doc.text("GARANTIA / CONDICIONES", M + 4, y + 5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TXT_MID);
      const notaLines = doc.splitTextToSize(e.notas, W - M * 2 - 8);
      doc.text(notaLines.slice(0, 2), M + 4, y + 11);
      y += 22;
    }

    // ══════════════════════════════════════════
    // FOOTER — técnico + contacto
    // ══════════════════════════════════════════
    const footerY = 277;
    doc.setFillColor(...DARK_BG);
    doc.rect(0, footerY, W, 20, "F");
    doc.setFillColor(...CYAN_C);
    doc.rect(0, footerY, 4, 20, "F");

    // Logo empresa (footer izquierda)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(empNombre, M + 3, footerY + 8);
    if (emp.matricula) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...CYAN_L);
      doc.text(`Mat. HVAC: ${emp.matricula}`, M + 3, footerY + 13);
    }

    // Contacto (footer centro)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 185, 220);
    const footContacts = [emp.telefono, emp.email, emp.direccion].filter(Boolean);
    footContacts.slice(0, 2).forEach((c, i) =>
      doc.text(c, W / 2, footerY + 7 + i * 6, { align: "center" })
    );

    // Garantía (footer derecha)
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN_L);
    doc.text("GARANTIA DEL SERVICIO: 30 DIAS", W - M, footerY + 8, { align: "right" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 185, 220);
    doc.text("Gracias por confiar en " + empNombre, W - M, footerY + 14, { align: "right" });

    // Barra cyan inferior (como el ejemplo)
    doc.setFillColor(...CYAN_C);
    doc.rect(0, 295, W, 2, "F");

    // ── GUARDAR ──
    const nombreArchivo = `presupuesto_${nro}_${(e.cliente.nombre || "cliente").replace(/\s+/g, "_")}.pdf`;
    doc.save(nombreArchivo);

    this.estado.nro++;
    this.guardarEstado();
    if (typeof Historial !== "undefined") Historial?.showToast?.("PDF generado correctamente");
  },
  // ─────────────────────────────────────────────
  // COMPARTIR COMO TEXTO (WhatsApp / SMS)
  // ─────────────────────────────────────────────
  compartirTexto() {
    const e   = this.estado;
    const emp = this.getEmpresa();
    const fmt = (n) => `$${new Intl.NumberFormat("es-AR").format(Math.round(n))}`;
    const total = e.items.reduce((a, b) => a + (Number(b.precio) || 0), 0);
    const fecha = new Date().toLocaleDateString("es-AR");
    const nro   = String(e.nro).padStart(4, "0");

    let txt = `*${emp.nombre || "HVAC PRO"}* — Presupuesto #${nro}\n`;
    txt += `📅 ${fecha}\n\n`;
    txt += `👤 *Cliente:* ${e.cliente.nombre || "—"}\n`;
    if (e.cliente.direccion) txt += `📍 ${e.cliente.direccion}\n`;
    if (e.equipo.tipo) txt += `\n🔧 *Equipo:* ${[e.equipo.tipo, e.equipo.gas, e.equipo.marca].filter(Boolean).join(" · ")}\n`;
    if (e.diagnostico) txt += `\n📋 *Diagnóstico:*\n${e.diagnostico}\n`;
    txt += `\n💰 *Detalle:*\n`;
    e.items.forEach(item => {
      txt += `• ${item.desc}: ${fmt(item.precio)}\n`;
    });
    txt += `\n*TOTAL: ${fmt(total)}*\n`;
    if (e.notas) txt += `\n_${e.notas}_\n`;

    if (navigator.share) {
      navigator.share({ title: `Presupuesto #${nro}`, text: txt });
    } else {
      navigator.clipboard?.writeText(txt);
      Historial?.showToast?.("✅ Texto copiado al portapapeles");
    }
  },

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  getEmpresa() {
    try { return JSON.parse(localStorage.getItem(this.KEY_EMPRESA) || "{}"); }
    catch { return {}; }
  },

  guardarEmpresa(data) {
    localStorage.setItem(this.KEY_EMPRESA, JSON.stringify(data));
  },

  cargarEstado() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY_ITEMS) || "null");
      if (saved) this.estado = { ...this.estado, ...saved };
    } catch {}
    if (!this.estado.nro) this.estado.nro = 1;
    if (!this.estado.items) this.estado.items = [];
  },

  guardarEstado() {
    localStorage.setItem(this.KEY_ITEMS, JSON.stringify(this.estado));
  },

  getDxHistorial() {
    try {
      const h = JSON.parse(localStorage.getItem("hvac_dx_historial") || "[]");
      return h[0] || null;
    } catch { return null; }
  },

  importarDx() {
    const dx = this.getDxHistorial();
    if (!dx) return;
    const div = document.createElement("div");
    div.innerHTML = dx.resultado || "";
    const texto = (div.innerText || div.textContent || "").trim();
    const titulo = dx.titulo || texto.split("\n")[0].slice(0, 60);
    // Extraer certeza si viene en el texto
    const certMatch = texto.match(/(\d+)%\s*probabilidad/i);
    this.estado.dxTitulo  = titulo;
    this.estado.dxCerteza = certMatch ? Number(certMatch[1]) : 0;
    this.estado.diagnostico = titulo + (texto ? "\n" + texto.slice(0, 350) : "");
    this.guardarEstado();
    const el = document.getElementById("pDiagnostico");
    if (el) el.value = this.estado.diagnostico;
    Historial?.showToast?.("✅ Diagnóstico importado");
  },

  cargarScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  },

  setTab(tab) {
    document.querySelectorAll(".presup-tab").forEach(t =>
      t.classList.toggle("presup-tab-active", t.dataset.tab === tab)
    );
    const cont = document.getElementById("presupContent");
    if (!cont) return;
    if (tab === "datos")   cont.innerHTML = this.renderTabDatos();
    if (tab === "items")   cont.innerHTML = this.renderTabItems();
    if (tab === "preview") cont.innerHTML = this.renderTabPreview();
    this.bindTabEvents(tab);
  },

  // ─────────────────────────────────────────────
  // EVENTOS
  // ─────────────────────────────────────────────
  bindEvents() {
    document.getElementById("presupBack")?.addEventListener("click", () => Router.back());

    document.querySelectorAll(".presup-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        this.guardarFormulario();
        this.setTab(tab.dataset.tab);
      });
    });

    this.bindTabEvents("datos");
  },

  bindTabEvents(tab) {
    if (tab === "datos") {
      document.getElementById("btnIrItems")?.addEventListener("click", () => {
        this.guardarFormulario();
        this.setTab("items");
      });

      document.getElementById("btnImportDx")?.addEventListener("click", () => this.importarDx());

      document.getElementById("btnConfigEmpresa")?.addEventListener("click", () => {
        const modal = document.createElement("div");
        modal.innerHTML = this.renderModalEmpresa();
        document.body.appendChild(modal.firstElementChild);

        document.getElementById("btnGuardarEmpresa")?.addEventListener("click", () => {
          this.guardarEmpresa({
            nombre:    document.getElementById("empNombre").value,
            telefono:  document.getElementById("empTelefono").value,
            email:     document.getElementById("empEmail").value,
            direccion: document.getElementById("empDireccion").value,
            matricula: document.getElementById("empMatricula").value
          });
          document.getElementById("presupModalEmpresa")?.remove();
          this.setTab("datos");
          Historial?.showToast?.("✅ Datos guardados");
        });

        document.getElementById("btnCancelarEmpresa")?.addEventListener("click", () =>
          document.getElementById("presupModalEmpresa")?.remove()
        );
      });
    }

    if (tab === "items") {
      document.getElementById("btnIrPreview")?.addEventListener("click", () => {
        this.setTab("preview");
      });

      document.getElementById("btnAgregarItem")?.addEventListener("click", () => {
        document.getElementById("presupModal").style.display = "flex";
      });

      document.getElementById("btnAbrirCatalogo")?.addEventListener("click", () => {
        window.open("https://catalogoayp.vercel.app", "_blank");
      });

      document.getElementById("btnCancelarItem")?.addEventListener("click", () => {
        document.getElementById("presupModal").style.display = "none";
      });

      document.getElementById("btnConfirmarItem")?.addEventListener("click", () => {
        const cat   = document.getElementById("newItemCat").value;
        const desc  = document.getElementById("newItemDesc").value.trim();
        const precio= Number(document.getElementById("newItemPrecio").value) || 0;
        if (!desc) return;
        this.estado.items.push({ cat, desc, precio });
        this.guardarEstado();
        document.getElementById("presupModal").style.display = "none";
        this.setTab("items");
      });

      // Eliminar ítems
      document.querySelectorAll(".presup-item-del").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const idx = Number(btn.dataset.idx);
          this.estado.items.splice(idx, 1);
          this.guardarEstado();
          this.setTab("items");
        });
      });
    }

    if (tab === "preview") {
      document.getElementById("btnGenerarPDF")?.addEventListener("click", () => this.generarPDF());
      document.getElementById("btnCompartirText")?.addEventListener("click", () => this.compartirTexto());
    }
  },

  guardarFormulario() {
    const g  = (id) => document.getElementById(id)?.value || "";
    const gn = (id) => document.getElementById(id)?.value || "";
    this.estado.cliente = {
      nombre:    g("pNombre"),
      direccion: g("pDireccion"),
      telefono:  g("pTelefono")
    };
    this.estado.equipo = {
      tipo:      g("pTipoEquipo"),
      gas:       g("pGas"),
      marca:     g("pMarca"),
      frigorias: g("pFrigorias")
    };
    this.estado.mediciones = {
      psi:        gn("pPsiBaja"),
      psiAlta:    gn("pPsiAlta"),
      amp:        gn("pAmp"),
      tempSuccion:gn("pTempSuc"),
      sh:         gn("pSH"),
      sc:         gn("pSC")
    };
    this.estado.diagnostico = g("pDiagnostico");
    this.estado.notas       = g("pNotas");
    this.guardarEstado();
  }
};
