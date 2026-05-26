// =====================================================
// HVAC PRO ARGENTINA V3
// REFERENCIAS.JS
// =====================================================

const References={

render(){

const app=
document.getElementById("app");

if(!app) return;

const splitCards=
HVAC_REFERENCES.split.map(item=>`

<div class="module-card">

<div>

<h2 class="module-title">
${item.frigorias} FG
</h2>

<p class="module-description">

Capacitor: ${item.capacitor}<br>
AMP: ${item.amp}<br>
${item.refrigerante}<br>
${item.psi}

</p>

</div>

</div>

`).join("");

const quickCards=
HVAC_REFERENCES.quickStart.map(item=>`

<div class="module-card">

<div>

<h2 class="module-title">
${item.motor}
</h2>

<p class="module-description">
${item.modelo}
</p>

</div>

</div>

`).join("");

const ptCards=
HVAC_REFERENCES.pt.map(item=>`

<div class="module-card">

<div>

<h2 class="module-title">
${item.gas}
</h2>

<p class="module-description">

${item.temp}
→ ${item.psi}

</p>

</div>

</div>

`).join("");

const failures=
HVAC_REFERENCES.commonFailures.map(item=>`

<div class="module-card">

<div>

<h2 class="module-title">
⚠️ ${item}
</h2>

</div>

</div>

`).join("");

app.innerHTML=`

<header class="hvac-header">

<div
class="module-back"
id="backHome"
>
←
</div>

<div>

<h1 class="hvac-title">
📚 Referencias
</h1>

<p class="hvac-subtitle">
Biblioteca HVAC Argentina
</p>

</div>

</header>

<section class="references-card">

<h2 class="references-title">
❄️ Split Capacitores
</h2>

<p class="references-description">

Valores comunes en Argentina.

</p>

</section>

<section class="modules-grid">
${splitCards}
</section>

<section class="references-card">

<h2 class="references-title">
⚡ Quick Arranque
</h2>

<p class="references-description">

Motores y modelos rápidos.

</p>

</section>

<section class="modules-grid">
${quickCards}
</section>

<section class="references-card">

<h2 class="references-title">
🌡️ Tabla PT
</h2>

<p class="references-description">

Presión por temperatura.

</p>

</section>

<section class="modules-grid">
${ptCards}
</section>

<section class="references-card">

<h2 class="references-title">
🛠️ Fallas Comunes
</h2>

<p class="references-description">

Muy vistas en Argentina.

</p>

</section>

<section class="modules-grid">
${failures}
</section>

`;

this.bindEvents();

},

bindEvents(){

document
.getElementById("backHome")
?.addEventListener(
"click",
()=>{

HVACApp.renderHome();

}
);

}

};