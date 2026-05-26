// =====================================================
// HVAC PRO ARGENTINA
// CORE/MARCA-DX.JS — Diagnóstico personalizado por marca
// =====================================================

const MarcaDx = {

  configData:  null,
  erroresData: null,

  async init() {
    if (this.configData && this.erroresData) return;
    try {
      const [cfg, err] = await Promise.all([
        fetch(`./marcas-config.json`).then(r => r.json()),
        fetch(`./codigos-error.json`).then(r => r.json())
      ]);
      this.configData  = cfg;
      this.erroresData = err;
    } catch(e) { console.warn("MarcaDx.init:", e); }
  },

  // ═══════════════════════════════════════════════
  // OBTENER CONFIG DE MARCA
  // ═══════════════════════════════════════════════

  getConfig(modulo, marca) {
    if (!this.configData || !marca) return null;
    const seccion = modulo === "split" ? "splits"
                  : modulo === "ciclica" || modulo === "nofrost" ? "heladeras"
                  : "comercial";
    return this.configData[seccion]?.[marca] || this.configData[seccion]?.["otra"] || null;
  },

  // ═══════════════════════════════════════════════
  // OBTENER CÓDIGOS DE ERROR RELEVANTES POR MARCA Y DIAGNÓSTICO
  // ═══════════════════════════════════════════════

  getCodigosRelevantes(marca, titulo) {
    if (!this.erroresData || !marca) return [];

    // Buscar la sección de códigos de esa marca
    const seccionMarca = this.erroresData.marcas?.find(m =>
      m.marca.toLowerCase().includes(marca.toLowerCase()) ||
      marca.toLowerCase().includes(m.marca.toLowerCase().split("/")[0].trim())
    );
    if (!seccionMarca) return [];

    // Mapear diagnósticos a códigos relevantes
    const tituloLower = titulo.toLowerCase();
    const relevantes  = [];

    seccionMarca.codigos.forEach(c => {
      const descLower = c.descripcion.toLowerCase();
      const match =
        (tituloLower.includes("sensor") && descLower.includes("sensor"))           ||
        (tituloLower.includes("presión") && (descLower.includes("presión") || descLower.includes("presostato"))) ||
        (tituloLower.includes("compresor") && descLower.includes("compresor"))     ||
        (tituloLower.includes("comunicación") && descLower.includes("comunicación")) ||
        (tituloLower.includes("condensador") && descLower.includes("condensad"))   ||
        (tituloLower.includes("amperaje") && descLower.includes("corriente"))      ||
        (tituloLower.includes("fuga") && descLower.includes("presión"))            ||
        (tituloLower.includes("ventilador") && descLower.includes("ventilador"))   ||
        (tituloLower.includes("inverter") && descLower.includes("inverter"))       ||
        (tituloLower.includes("alta presión") && (c.codigo === "E3" || c.codigo === "E1")) ||
        (tituloLower.includes("baja presión") && (c.codigo === "E4" || c.codigo === "E9"));

      if (match) relevantes.push(c);
    });

    // Máximo 3 códigos para no sobrecargar
    return relevantes.slice(0, 3);
  },

  // ═══════════════════════════════════════════════
  // RENDER — bloque de marca en el resultado dx
  // ═══════════════════════════════════════════════

  renderBloque(modulo, datos, titulo) {
    if (!datos.marca) return "";
    const cfg     = this.getConfig(modulo, datos.marca);
    const codigos = modulo === "split" ? this.getCodigosRelevantes(datos.marca, titulo) : [];

    if (!cfg && !codigos.length) return "";

    const modelo  = datos.modelo ? ` — ${datos.modelo}` : "";
    const tipoTag = cfg?.tipo === "inverter" ? "⚡ Inverter"
                  : cfg?.tipo === "on-off"   ? "🔌 ON/OFF"
                  : cfg?.tipo === "mixto"    ? "🔀 Inverter / ON/OFF"
                  : "";

    const capacitorAviso = cfg?.tipo === "inverter"
      ? `<div class="mdx-inverter-aviso">⚡ <strong>${datos.marca} Inverter:</strong> NO lleva capacitor externo. Si buscás el capacitor en este equipo, no lo vas a encontrar — el módulo IPM maneja el arranque internamente. No confundas con ON/OFF.</div>`
      : "";

    const codigosHTML = codigos.length ? `
<div class="mdx-codigos-wrap">
  <div class="mdx-codigos-titulo">⚠️ Códigos de error relacionados — ${datos.marca}:</div>
  ${codigos.map(c => `
  <div class="mdx-codigo-item">
    <span class="mdx-codigo-tag">${c.codigo}</span>
    <div class="mdx-codigo-info">
      <div class="mdx-codigo-desc">${c.descripcion}</div>
      <div class="mdx-codigo-accion">${c.accion}</div>
    </div>
  </div>`).join("")}
</div>` : "";

    return `
<div class="mdx-card">
  <div class="mdx-header">
    <div class="mdx-marca-nombre">${datos.marca}${modelo}</div>
    ${tipoTag ? `<div class="mdx-tipo-tag">${tipoTag}</div>` : ""}
  </div>

  ${cfg?.nota ? `<div class="mdx-nota">💡 ${cfg.nota}</div>` : ""}

  ${capacitorAviso}

  ${codigosHTML}
</div>`;
  },

  // ═══════════════════════════════════════════════
  // INYECTAR en resultado del DOM
  // ═══════════════════════════════════════════════

  async inyectarEnResultado(modulo, datos, titulo) {
    await this.init();
    if (!datos?.marca) return;

    const resultEl = document.getElementById("dxResult");
    if (!resultEl) return;

    // Remover bloque previo si existe
    resultEl.querySelector(".mdx-card")?.remove();

    const bloque = this.renderBloque(modulo, datos, titulo);
    if (!bloque) return;

    // Insertar ANTES del bloque del Mentor (si existe), o al final de dx-result-card
    const mentorCard = resultEl.querySelector(".mentor-dx-card");
    const dxCard     = resultEl.querySelector(".dx-result-card");

    if (mentorCard) {
      mentorCard.insertAdjacentHTML("beforebegin", bloque);
    } else if (dxCard) {
      // Insertar antes de los pasos
      const pasosTitle = dxCard.querySelector(".dx-pasos-titulo");
      if (pasosTitle) {
        pasosTitle.insertAdjacentHTML("beforebegin", bloque);
      } else {
        dxCard.insertAdjacentHTML("beforeend", bloque);
      }
    }
  }

};
