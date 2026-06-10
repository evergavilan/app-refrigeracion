
const DevTools = {

  getTests() {
    return [

      { n:"Capacitor",
        d:{ arranca:"no", chkCapacitor:true },
        e:"Capacitor sospechoso" },

      { n:"Térmico",
        d:{ arranca:"no", chkTermico:true },
        e:"Protector térmico abierto" },

      { n:"No arranca",
        d:{ arranca:"no" },
        e:"Compresor no arranca" },

      { n:"Sin datos",
        d:{ arranca:"si" },
        e:"Necesitás datos medidos" },

      { n:"Fuga severa",
        d:{ gas:"R410A", frigorias:4500, psi:20, amp:1 },
        e:"Fuga severa" },

      { n:"Fuga lenta",
        d:{ gas:"R410A", frigorias:4500, psi:90, amp:2, chkFrozen:true },
        e:"Fuga lenta" },

      { n:"Baja presión",
        d:{ gas:"R410A", frigorias:4500, psi:90, amp:2 },
        e:"Baja presión y amperaje" },

      { n:"Condensador",
        d:{ gas:"R410A", frigorias:4500, psi:160, amp:9 },
        e:"Condensador sobrecargado" },

      { n:"Exceso gas",
        d:{ gas:"R410A", frigorias:4500, psi:160, amp:9, chkGasExceso:true },
        e:"Posible exceso de refrigerante" },

      { n:"Airflow",
        d:{ gas:"R410A", frigorias:4500, psi:120, amp:6, chkFrozen:true, chkPocofrio:true },
        e:"Problema de airflow" },

      { n:"DeltaT bajo",
        d:{ gas:"R410A", frigorias:4500, psi:120, amp:6, tempIn:24, tempOut:18 },
        e:"Delta T bajo" },

      { n:"DeltaT alto",
        d:{ gas:"R410A", frigorias:4500, psi:120, amp:6, tempIn:30, tempOut:10 },
        e:"Delta T alto" },

      { n:"Amp alto",
        d:{ gas:"R410A", frigorias:4500, psi:120, amp:9 },
        e:"Amperaje alto" },

      { n:"Amp bajo",
        d:{ gas:"R410A", frigorias:4500, psi:120, amp:3 },
        e:"Amperaje bajo" },

      { n:"Poco frío",
        d:{ gas:"R410A", frigorias:4500, psi:120, amp:6, chkPocofrio:true },
        e:"Sistema en rango" },

      { n:"Normal",
        d:{ gas:"R410A", frigorias:4500, psi:120, amp:6 },
        e:"Sistema operando" }

    ];
  },

  render() {

    const app = document.getElementById("app");

    app.innerHTML = `
      <div class="dx-card">
        <h2>🧪 Laboratorio Ever Real</h2>
        <button id="runAll">Ejecutar</button>
        <div id="devResults"></div>
      </div>
    `;

    document.getElementById("runAll").onclick = () => {

      let ok = 0;
      let html = "";

      this.getTests().forEach(t => {

        const r = SplitEngine.analyze(t.d);

        const pass =
          (r.html || "")
            .toLowerCase()
            .includes(t.e.toLowerCase());

        if (pass) ok++;

        html += `
          <div style="margin-bottom:8px;">
            ${pass ? "✅" : "❌"} ${t.n}<br>
            Esperado: ${t.e}
          </div>
        `;
      });

      document.getElementById("devResults").innerHTML =
        `<h3>${ok}/${this.getTests().length}</h3>` + html;
    };
  }
};