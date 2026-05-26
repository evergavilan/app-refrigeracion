// =====================================================
// HVAC PRO ARGENTINA
// NO FROST REFRIGERACION REF
// =====================================================

const NoFrostRefrigeracionRef={

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
🌬️ No Frost Refrigeración
</h1>

<p class="hvac-subtitle">
Airflow y deshielo inteligente
</p>

</div>

</header>

<section class="references-card">

<img
src="nofrost-circuito.png"
alt="Circuito No Frost"
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

El evaporador genera frío
y el ventilador distribuye
el aire por todo el sistema.

El deshielo evita
acumulación de hielo.

</p>

</section>

<section class="modules-grid">

<!-- ===================================================== -->
<!-- EVAPORADOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
1️⃣ Evaporador
</h2>

<p class="module-description">

✅ Qué hace:

Absorbe calor interior
y genera aire frío.

✅ Qué entra:

Refrigerante baja presión.

✅ Qué sale:

Gas frío baja presión.

⚠️ Si falla:

• poco frío
• escarcha parcial
• mala absorción calor

💡 HVAC Mentor:

El evaporador debe escarchar
parejo.

</p>

</div>

<!-- ===================================================== -->
<!-- VENTILADOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
2️⃣ Ventilador
</h2>

<p class="module-description">

✅ Qué hace:

Distribuye aire frío
desde evaporador.

⚠️ Si falla:

• freezer enfría
• abajo pierde frío
• evaporador congelado
• airflow deficiente

💡 HVAC Mentor:

Muchísimas No Frost
pierden frío abajo
por ventilador detenido.

</p>

</div>

<!-- ===================================================== -->
<!-- RESISTENCIA -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
3️⃣ Resistencia
</h2>

<p class="module-description">

✅ Qué hace:

Derrite hielo acumulado
en evaporador.

⚠️ Si falla:

• evaporador congelado
• airflow bloqueado
• abajo no enfría

💡 HVAC Mentor:

Muchos evaporadores congelados
terminan siendo deshielo.

</p>

</div>

<!-- ===================================================== -->
<!-- SENSOR / BIMETAL -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
4️⃣ Sensor / Bimetal
</h2>

<p class="module-description">

✅ Qué hace:

Controla ciclo deshielo.

⚠️ Si falla:

• exceso hielo
• mal deshielo
• airflow deficiente

💡 HVAC Mentor:

No condenes refrigerante
sin revisar deshielo.

</p>

</div>

</section>

<section class="mentor-card">

<div class="mentor-label">
HVAC MENTOR
</div>

<p class="mentor-text">

“En No Frost,
airflow y deshielo
mandan muchísimo.”

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