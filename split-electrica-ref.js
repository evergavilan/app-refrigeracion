// =====================================================
// HVAC PRO ARGENTINA
// SPLIT ELECTRICA REF
// =====================================================

const SplitElectricaRef={

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
⚡ Split Eléctrica ON/OFF
</h1>

<p class="hvac-subtitle">
Conexión eléctrica simplificada
</p>

</div>

</header>

<section class="references-card">

<img
src="split-electrica.png"
alt="Split Eléctrica"
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

La unidad interior
envía alimentación
y señales eléctricas
hacia unidad exterior.

El compresor
y ventilador exterior
trabajan mediante capacitor.

</p>

</section>

<section class="modules-grid">

<!-- ===================================================== -->
<!-- COMPRESOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
1️⃣ Compresor
</h2>

<p class="module-description">

✅ Qué hace:

Comprime refrigerante
y genera circulación.

⚠️ Si falla:

• no enfría
• zumba
• no arranca
• protector dispara

💡 HVAC Mentor:

El común (C)
siempre va directo
a neutro/bornes.

</p>

</div>

<!-- ===================================================== -->
<!-- CAPACITOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
2️⃣ Capacitor
</h2>

<p class="module-description">

✅ Qué hace:

Ayuda arranque
de compresor
y ventilador.

⚠️ Si falla:

• compresor zumba
• fan no gira
• bajo rendimiento

💡 HVAC Mentor:

El capacitor
trabaja entre:

R ↔ S

</p>

</div>

<!-- ===================================================== -->
<!-- FAN -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
3️⃣ Ventilador Exterior
</h2>

<p class="module-description">

✅ Qué hace:

Expulsa calor
del condensador.

⚠️ Si falla:

• alta presión
• poco frío
• equipo caliente

💡 HVAC Mentor:

Muchos splits
parecen falta gas
y terminan siendo fan.

</p>

</div>

<!-- ===================================================== -->
<!-- PLACA -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
4️⃣ Placa Electrónica
</h2>

<p class="module-description">

✅ Qué hace:

Controla señales
y funcionamiento general.

⚠️ Si falla:

• no responde
• errores display
• no arranca

💡 HVAC Mentor:

Antes de condenar placa,
revisá alimentación
y borneras.

</p>

</div>

</section>

<section class="mentor-card">

<div class="mentor-label">
HVAC MENTOR
</div>

<p class="mentor-text">

“En Split ON/OFF:
muchísimas fallas
terminan siendo
capacitor,
fan
o conexiones.”

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