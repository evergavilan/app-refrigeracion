// =====================================================
// HVAC PRO ARGENTINA
// SPLIT REFRIGERACION REF
// =====================================================

const SplitRefrigeracionRef={

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
❄️ Split Refrigeración
</h1>

<p class="hvac-subtitle">
Alta y baja presión HVAC
</p>

</div>

</header>

<section class="references-card">

<img
src="split-circuito.png"
alt="Circuito Split"
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

El refrigerante transporta calor
entre unidad interior
y unidad exterior.

La presión y temperatura
cambian en cada etapa.

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

✅ Entra:

Gas frío baja presión.

✅ Sale:

Gas caliente alta presión.

✅ Qué hace:

Impulsa refrigerante
por todo el sistema.

⚠️ Si falla:

• baja presión
• poco frío
• no bombea
• bajo rendimiento

💡 HVAC Mentor:

Muchos compresores condenados
terminan siendo capacitor
o condensación elevada.

</p>

</div>

<!-- ===================================================== -->
<!-- CONDENSADOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
2️⃣ Condensador
</h2>

<p class="module-description">

✅ Entra:

Gas caliente alta presión.

✅ Sale:

Líquido caliente alta presión.

✅ Qué hace:

Libera calor
hacia el exterior.

⚠️ Si falla:

• presión alta
• amperaje elevado
• poco rendimiento
• trabajo forzado

💡 HVAC Mentor:

Condensador sucio
puede elevar muchísimo
la presión y el consumo.

</p>

</div>

<!-- ===================================================== -->
<!-- EXPANSION -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
3️⃣ Expansión
</h2>

<p class="module-description">

✅ Entra:

Líquido alta presión.

✅ Sale:

Refrigerante expandido
baja presión.

✅ Qué hace:

Reduce presión
y alimenta evaporador.

⚠️ Si falla:

• escarcha parcial
• evaporador desalimentado
• poco frío

💡 HVAC Mentor:

Muchas fallas de alimentación
parecen gas,
pero terminan siendo restricción.

</p>

</div>

<!-- ===================================================== -->
<!-- EVAPORADOR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
4️⃣ Evaporador
</h2>

<p class="module-description">

✅ Entra:

Refrigerante frío baja presión.

✅ Sale:

Gas frío baja presión.

✅ Qué hace:

Absorbe calor interior.

⚠️ Si falla:

• poco frío
• airflow deficiente
• evaporador congelado

💡 HVAC Mentor:

Si el evaporador no absorbe calor,
el retorno cambia completamente.

</p>

</div>

</section>

<section class="mentor-card">

<div class="mentor-label">
HVAC MENTOR
</div>

<p class="mentor-text">

“Alta presión,
baja presión
y temperatura ambiente
siempre van juntas.”

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