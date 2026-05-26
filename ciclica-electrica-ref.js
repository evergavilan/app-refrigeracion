// =====================================================
// HVAC PRO ARGENTINA
// CICLICA ELECTRICA REF
// =====================================================

const CiclicaElectricaRef={

render(){

const app=
document.getElementById("app");

if(!app) return;

app.innerHTML=`

<header class="hvac-header">

<div
class="module-back"
id="backRefs"
>
←
</div>

<div>

<h1 class="hvac-title">
⚡ Cíclica Eléctrica
</h1>

<p class="hvac-subtitle">
Conexión eléctrica doméstica
</p>

</div>

</header>

<section class="references-card">

<img
src="ciclica-electrica.png"
alt="Cíclica Eléctrica"
style="
width:100%;
border-radius:18px;
margin-bottom:20px;
"
/>

<h2 class="references-title">
🧠 ¿Cómo funciona?
</h2>

<p class="references-description">

La corriente atraviesa
termostato,
protector y compresor
para poner en marcha
el sistema.

</p>

</section>

<section class="modules-grid">

<!-- ===================================================== -->
<!-- TERMOSTATO -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
1️⃣ Termostato
</h2>

<p class="module-description">

✅ Qué hace:

Abre y cierra
el circuito según
la temperatura.

⚠️ Si falla:

• no arranca
• no corta
• enfría demasiado

💡 HVAC Mentor:

Muchísimas heladeras
que no cortan
terminan siendo termostato.

</p>

</div>

<!-- ===================================================== -->
<!-- PROTECTOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
2️⃣ Protector Térmico
</h2>

<p class="module-description">

✅ Qué hace:

Protege compresor
contra temperatura excesiva.

⚠️ Si falla:

• corta continuamente
• arranca y se apaga
• no mantiene marcha

💡 HVAC Mentor:

Si el protector quema,
medí consumo antes
de condenar compresor.

</p>

</div>

<!-- ===================================================== -->
<!-- COMPRESOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
3️⃣ Compresor
</h2>

<p class="module-description">

✅ Qué hace:

Comprime refrigerante
y mueve el sistema.

⚠️ Si falla:

• no enfría
• zumba
• no arranca
• alto consumo

💡 HVAC Mentor:

No todo compresor que zumba
está quemado.

Revisá protector y PTC.

</p>

</div>

<!-- ===================================================== -->
<!-- LUZ -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
4️⃣ Luz Interior
</h2>

<p class="module-description">

✅ Qué hace:

Ilumina interior
al abrir puerta.

⚠️ Si falla:

• no enciende
• queda prendida
• falso contacto

💡 HVAC Mentor:

Muchos pulsadores
quedan trabados
por humedad.

</p>

</div>

</section>

<section class="mentor-card">

<div class="mentor-label">
HVAC MENTOR
</div>

<p class="mentor-text">

“Si zumba y no arranca:
PTC,
protector
o consumo elevado.”

</p>

</section>

`;

this.bindEvents();

},

bindEvents(){

document
.getElementById("backRefs")
?.addEventListener(
"click",
()=>{

ReferenciasHVAC.render();

}
);

}

};