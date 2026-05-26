// =====================================================
// HVAC PRO ARGENTINA
// CICLICA REFRIGERACION REF
// =====================================================

const CiclicaRefrigeracionRef={

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
🧊 Cíclica Refrigeración
</h1>

<p class="hvac-subtitle">
Así viaja el refrigerante
</p>

</div>

</header>

<section class="references-card">

<img
src="ciclica-circuito.png"
alt="Circuito Cíclica"
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

El refrigerante cambia
de presión y temperatura
en cada componente.

Entender eso permite
diagnosticar mejor.

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
gas frío baja presión.

✅ Sale:
gas caliente alta presión.

✅ Qué hace:

Impulsa refrigerante
por todo el sistema.

⚠️ Si falla:

• no enfría
• baja presión
• no bombea
• evaporador sin escarcha

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
gas caliente alta presión.

✅ Sale:
líquido caliente alta presión.

✅ Qué hace:

Libera calor
hacia el ambiente.

⚠️ Si falla:

• alta presión
• mucho calor
• trabajo forzado
• amperaje elevado
<br><br>

💡 HVAC Mentor:

Si el condensador no libera calor,
el sistema trabaja forzado
y aumenta el amperaje.

</p>

</div>

<!-- ===================================================== -->
<!-- CAPILAR -->
<!-- ===================================================== -->

<div class="module-card">

<h2 class="module-title">
3️⃣ Capilar
</h2>

<p class="module-description">

✅ Entra:
líquido alta presión.

✅ Sale:
refrigerante expandido
baja presión.

✅ Qué hace:

Reduce presión
y alimenta evaporador.

⚠️ Si falla:

• escarcha parcial
• poco frío
• evaporador desalimentado
<br><br>

💡 HVAC Mentor:

Antes de cambiar compresor,
revisá capilar y filtro.

Muchísimas cíclicas con
escarcha parcial terminan
siendo restricción.
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
refrigerante frío baja presión.

✅ Sale:
gas frío baja presión.

✅ Qué hace:

Absorbe calor interior.

⚠️ Si falla:

• poco frío
• escarcha total
• serpentín sucio
• mala absorción de calor
<br><br>

💡 HVAC Mentor:

El evaporador debe escarchar
parejo.

La escarcha parcial muchas veces
indica restricción o fuga.

</p>

</div>

</section>

<section class="mentor-card">

<div class="mentor-label">
HVAC MENTOR
</div>

<p class="mentor-text">

“Antes de condenar compresor,
interpretá evaporador,
retorno y escarcha.”

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