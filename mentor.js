// =====================================================
// HVAC PRO ARGENTINA
// CORE/MENTOR.JS — Mentor contextual
// =====================================================

const Mentor = {

  data: null,

  async init() {
    if (this.data) return;
    try {
      const res  = await fetch(`./mentor.json`);
      this.data  = await res.json();
    } catch(e) {
      console.warn("Mentor: no se pudo cargar mentor.json", e);
    }
  },

  // ═══════════════════════════════════════════════
  // OBTENER FRASE CONTEXTUAL
  // Busca por módulo + título del diagnóstico
  // ═══════════════════════════════════════════════

  getFrase(modulo, titulo, certeza) {
    if (!this.data) return null;

    const frases = this.data.frases;

    // 1. Buscar por módulo y título exacto
    if (frases[modulo]?.[titulo]) {
      return frases[modulo][titulo];
    }

    // 2. Buscar por título aproximado (el título puede tener datos variables)
    if (frases[modulo]) {
      const keys = Object.keys(frases[modulo]);
      const match = keys.find(k =>
        titulo.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(titulo.toLowerCase().split("—")[0].trim())
      );
      if (match) return frases[modulo][match];
    }

    // 3. Si la certeza es baja, usar frase genérica de certeza baja
    if (certeza > 0 && certeza < 70) {
      return frases.certeza_baja;
    }

    // 4. Fallback: frase genérica aleatoria
    const genericas = frases.generico;
    if (genericas?.length) {
      return genericas[Math.floor(Math.random() * genericas.length)];
    }

    return null;
  },

  // ═══════════════════════════════════════════════
  // RENDER — bloque de mentor para insertar en dx
  // ═══════════════════════════════════════════════

  renderBloque(modulo, titulo, certeza) {
    const f = this.getFrase(modulo, titulo, certeza);
    if (!f) return "";

    return `
<div class="mentor-dx-card">
  <div class="mentor-dx-header">
    <span class="mentor-dx-avatar">👨‍🔧</span>
    <div>
      <div class="mentor-dx-nombre">El Mentor</div>
      <div class="mentor-dx-subtitulo">25 años en el rubro</div>
    </div>
  </div>

  <div class="mentor-dx-frase">"${f.frase}"</div>

  <div class="mentor-dx-footer">
    <div class="mentor-dx-consejo">
      <span class="mentor-dx-consejo-label">💡 Clave:</span>
      <span class="mentor-dx-consejo-txt">${f.consejo_rapido}</span>
    </div>
    <div class="mentor-dx-error">
      <span class="mentor-dx-error-label">⚠️ Error común:</span>
      <span class="mentor-dx-error-txt">${f.error_comun}</span>
    </div>
  </div>
</div>`;
  },

  // ═══════════════════════════════════════════════
  // INYECTAR en resultado existente del DOM
  // Llamado desde DxActions.showResult
  // ═══════════════════════════════════════════════

  inyectarEnResultado(modulo, titulo, certeza) {
    const resultEl = document.getElementById("dxResult");
    if (!resultEl) return;

    // Remover mentor previo si existe
    const previo = resultEl.querySelector(".mentor-dx-card");
    if (previo) previo.remove();

    const bloque = this.renderBloque(modulo, titulo, certeza);
    if (!bloque) return;

    // Insertar al final del resultado
    const card = resultEl.querySelector(".dx-result-card");
    if (card) card.insertAdjacentHTML("beforeend", bloque);
  }

};
