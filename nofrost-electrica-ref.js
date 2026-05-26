// =====================================================
// HVAC PRO ARGENTINA
// NO FROST ELECTRICA REF
// =====================================================

const NoFrostElectricaRef={

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
⚡ No Frost Eléctrica
</h1>

<p class="hvac-subtitle">
Deshielo y airflow eléctrico
</p>

</div>

</header>

<section class="references-card">

<img
src="nofrost-electrica.png"
alt="No Frost Eléctrica"
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

El sistema controla
deshielo,
ventiladores
y compresor
automáticamente.

</p>

</section>

<section class="modules-grid">

<!-- ===================================================== -->
<!-- TIMER -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
1️⃣ Timer / Placa
</h2>

<p class="module-description">

✅ Qué hace:

Controla compresor,
deshielo
y ventiladores.

⚠️ Si falla:

• no deshiela
• no arranca
• ciclos erráticos

💡 HVAC Mentor:

Muchos No Frost
que congelan evaporador
terminan siendo timer.

</p>

</div>

<!-- ===================================================== -->
<!-- RESISTENCIA -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
2️⃣ Resistencia
</h2>

<p class="module-description">

✅ Qué hace:

Derrite hielo
del evaporador.

⚠️ Si falla:

• evaporador congelado
• abajo no enfría
• airflow bloqueado

💡 HVAC Mentor:

Si el evaporador
parece un bloque hielo,
medí resistencia.

</p>

</div>

<!-- ===================================================== -->
<!-- BIMETAL -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
3️⃣ Bimetal
</h2>

<p class="module-description">

✅ Qué hace:

Protege deshielo
contra sobretemperatura.

⚠️ Si falla:

• no deshiela
• resistencia no activa
• deshielo incorrecto

💡 HVAC Mentor:

Muchos bimetales
abren antes de tiempo.

</p>

</div>

<!-- ===================================================== -->
<!-- VENTILADOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
4️⃣ Ventilador
</h2>

<p class="module-description">

✅ Qué hace:

Distribuye aire frío
por todo el sistema.

⚠️ Si falla:

• freezer enfría
• abajo no enfría
• evaporador congelado

💡 HVAC Mentor:

No condenes gas
sin revisar airflow.

</p>

</div>

</section>

<section class="mentor-card">

<div class="mentor-label">
HVAC MENTOR
</div>

<p class="mentor-text">

“En No Frost:
deshielo
y airflow
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