// =====================================================
// HVAC PRO ARGENTINA
// CORE/TIMER.JS — Motor de timers integrados
// =====================================================

const TimerEngine = {

  timers: {},   // { id: { interval, segundos, restantes, estado, callbacks } }

  // ═══════════════════════════════════════════════
  // CREAR / INICIAR TIMER
  // ═══════════════════════════════════════════════

  crear(id, segundos, onTick, onComplete, onAlert) {
    // Si ya existe, lo destruye primero
    if (this.timers[id]) this.destruir(id);

    this.timers[id] = {
      segundos,
      restantes: segundos,
      estado: "detenido",   // detenido | corriendo | pausado | completado
      onTick,
      onComplete,
      onAlert,
      interval: null
    };
  },

  iniciar(id) {
    const t = this.timers[id];
    if (!t || t.estado === "completado") return;

    t.estado = "corriendo";
    t.interval = setInterval(() => {
      t.restantes--;

      if (typeof t.onTick === "function") t.onTick(t.restantes, t.segundos);

      // Alertas a mitad y al 20%
      if (t.restantes === Math.floor(t.segundos * 0.5) && typeof t.onAlert === "function") {
        t.onAlert("mitad", t.restantes);
      }
      if (t.restantes === Math.floor(t.segundos * 0.2) && typeof t.onAlert === "function") {
        t.onAlert("casi", t.restantes);
      }

      if (t.restantes <= 0) {
        clearInterval(t.interval);
        t.estado = "completado";
        t.restantes = 0;
        if (typeof t.onComplete === "function") t.onComplete();
        if (typeof t.onAlert === "function") t.onAlert("completo", 0);
      }
    }, 1000);
  },

  pausar(id) {
    const t = this.timers[id];
    if (!t || t.estado !== "corriendo") return;
    clearInterval(t.interval);
    t.interval = null;
    t.estado = "pausado";
  },

  reanudar(id) {
    const t = this.timers[id];
    if (!t || t.estado !== "pausado") return;
    t.estado = "corriendo";
    this.iniciar(id);
  },

  resetear(id) {
    const t = this.timers[id];
    if (!t) return;
    clearInterval(t.interval);
    t.restantes = t.segundos;
    t.estado = "detenido";
    t.interval = null;
    if (typeof t.onTick === "function") t.onTick(t.restantes, t.segundos);
  },

  destruir(id) {
    const t = this.timers[id];
    if (!t) return;
    clearInterval(t.interval);
    delete this.timers[id];
  },

  destruirTodos() {
    Object.keys(this.timers).forEach(id => this.destruir(id));
  },

  getEstado(id) {
    return this.timers[id]?.estado || null;
  },

  // ═══════════════════════════════════════════════
  // FORMATEAR TIEMPO
  // ═══════════════════════════════════════════════

  formatear(segundos) {
    if (segundos >= 3600) {
      const h = Math.floor(segundos / 3600);
      const m = Math.floor((segundos % 3600) / 60);
      const s = segundos % 60;
      return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  },

  // ═══════════════════════════════════════════════
  // RENDER — Componente de timer para un paso
  // ═══════════════════════════════════════════════

  renderWidget(paso) {
    if (!paso.timer_segundos) return "";
    const id = `timer_${paso.n}`;
    const tiempo = this.formatear(paso.timer_segundos);

    return `
<div class="timer-widget" id="tw_${id}">
  <div class="timer-label">⏱ ${paso.timer_label || "Esperar"}</div>
  <div class="timer-display" id="td_${id}">${tiempo}</div>
  <div class="timer-progress-wrap">
    <div class="timer-progress-bar" id="tp_${id}" style="width:100%"></div>
  </div>
  <div class="timer-btns">
    <button class="timer-btn timer-start" id="ts_${id}" data-timer="${id}" data-segundos="${paso.timer_segundos}">
      ▶ Iniciar
    </button>
    <button class="timer-btn timer-pause" id="tpause_${id}" data-timer="${id}" style="display:none;">
      ⏸ Pausar
    </button>
    <button class="timer-btn timer-reset" id="tr_${id}" data-timer="${id}" style="display:none;">
      ↺ Reiniciar
    </button>
  </div>
  ${paso.timer_alerta ? `<div class="timer-alerta" id="ta_${id}" style="display:none;">⚠️ ${paso.timer_alerta}</div>` : ""}
</div>`;
  },

  // ═══════════════════════════════════════════════
  // BIND — Conectar todos los timers del DOM
  // ═══════════════════════════════════════════════

  bindAll() {
    document.querySelectorAll(".timer-start").forEach(btn => {
      btn.addEventListener("click", () => {
        const id  = btn.dataset.timer;
        const seg = parseInt(btn.dataset.segundos);
        this._iniciarDesdeUI(id, seg);
      });
    });

    document.querySelectorAll(".timer-pause").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.timer;
        const estado = this.getEstado(id);
        if (estado === "corriendo") {
          this.pausar(id);
          this._updateBtns(id, "pausado");
        } else if (estado === "pausado") {
          this.reanudar(id);
          this._updateBtns(id, "corriendo");
        }
      });
    });

    document.querySelectorAll(".timer-reset").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.timer;
        this.resetear(id);
        this._updateBtns(id, "detenido");
        const seg = this.timers[id]?.segundos || 0;
        const display = document.getElementById(`td_${id}`);
        if (display) display.textContent = this.formatear(seg);
        const bar = document.getElementById(`tp_${id}`);
        if (bar) { bar.style.width = "100%"; bar.style.background = ""; }
        const alerta = document.getElementById(`ta_${id}`);
        if (alerta) alerta.style.display = "none";
      });
    });
  },

  _iniciarDesdeUI(id, segundos) {
    this.crear(id, segundos,
      // onTick
      (restantes, total) => {
        const pct     = (restantes / total) * 100;
        const display = document.getElementById(`td_${id}`);
        const bar     = document.getElementById(`tp_${id}`);
        const widget  = document.getElementById(`tw_${id}`);
        if (display) display.textContent = this.formatear(restantes);
        if (bar) {
          bar.style.width = pct + "%";
          bar.style.background = pct > 50 ? "#00d9ff"
                               : pct > 20 ? "#ff9b42"
                               : "#ff5252";
        }
        if (widget) widget.classList.toggle("timer-urgente", pct < 20);
      },
      // onComplete
      () => {
        this._updateBtns(id, "completado");
        const widget  = document.getElementById(`tw_${id}`);
        const display = document.getElementById(`td_${id}`);
        if (widget)  { widget.classList.remove("timer-urgente"); widget.classList.add("timer-done"); }
        if (display) { display.textContent = "✅ Listo"; }
        // Vibrar si está disponible
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
        // Notificación si está permitida
        if (Notification?.permission === "granted") {
          new Notification("⏱ Timer HVAC PRO", {
            body: `¡Tiempo completo! Podés continuar al siguiente paso.`,
            icon: "./icon-192.png"
          });
        }
      },
      // onAlert
      (tipo, restantes) => {
        const alerta = document.getElementById(`ta_${id}`);
        if (alerta && tipo !== "completo") alerta.style.display = "block";
      }
    );
    this.iniciar(id);
    this._updateBtns(id, "corriendo");

    // Solicitar permiso de notificaciones la primera vez
    if (Notification?.permission === "default") {
      Notification.requestPermission();
    }
  },

  _updateBtns(id, estado) {
    const start  = document.getElementById(`ts_${id}`);
    const pause  = document.getElementById(`tpause_${id}`);
    const reset  = document.getElementById(`tr_${id}`);

    if (!start) return;

    switch(estado) {
      case "corriendo":
        start.style.display  = "none";
        pause.style.display  = "block";
        pause.textContent    = "⏸ Pausar";
        reset.style.display  = "none";
        break;
      case "pausado":
        start.style.display  = "none";
        pause.style.display  = "block";
        pause.textContent    = "▶ Reanudar";
        reset.style.display  = "block";
        break;
      case "completado":
        start.style.display  = "none";
        pause.style.display  = "none";
        reset.style.display  = "block";
        reset.textContent    = "↺ Usar de nuevo";
        break;
      case "detenido":
        start.style.display  = "block";
        pause.style.display  = "none";
        reset.style.display  = "none";
        break;
    }
  }

};

// Limpiar timers al salir de la pantalla (pushState)
window.addEventListener("popstate", () => TimerEngine.destruirTodos());
