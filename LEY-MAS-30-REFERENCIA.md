# 📊 LEY DEL +30 — Cálculo de Presiones de Carga

## 📖 QUÉ ES

La "Ley del +30" es una **regla técnica rápida** para estimar la presión de alta correcta basada en la **temperatura ambiente**.

Se usa para verificar si un sistema está bien cargado sin necesidad de tablas de saturación complejas.

---

## 🎯 FÓRMULAS POR GAS

### R22 (CFC — Fase out)
```
PSI alta = Temperatura ambiente + 30
```

**Ejemplo:**
- Temperatura = 25°C
- PSI esperada = 25 + 30 = 55 psi

| T°C | PSI |
|-----|-----|
| 15° | 45 psi |
| 20° | 50 psi |
| 25° | 55 psi |
| 30° | 60 psi |
| 35° | 65 psi |
| 40° | 70 psi |

---

### R410A (HFC Blend — Moderno)
```
PSI alta = (Temperatura ambiente + 30) × 2
```

**Ejemplo:**
- Temperatura = 25°C
- Cálculo = (25 + 30) × 2 = 55 × 2 = 110 psi

| T°C | PSI |
|-----|------|
| 15° | 90 psi |
| 20° | 100 psi |
| 25° | 110 psi |
| 30° | 120 psi |
| 35° | 130 psi |
| 40° | 140 psi |

---

### R32 (Puro — Muy moderno)
```
PSI alta ≈ (Temperatura ambiente + 28) × 2
```

**Ejemplo:**
- Temperatura = 25°C
- Cálculo = (25 + 28) × 2 = 53 × 2 = 106 psi

| T°C | PSI |
|-----|------|
| 15° | 86 psi |
| 20° | 96 psi |
| 25° | 106 psi |
| 30° | 116 psi |
| 35° | 126 psi |
| 40° | 136 psi |

---

### R404A (HFC Blend — Baja temperatura)
```
PSI alta = (Temperatura ambiente + 35) × 1.8
```

**Ejemplo:**
- Temperatura = 25°C
- Cálculo = (25 + 35) × 1.8 = 60 × 1.8 = 108 psi

| T°C | PSI |
|-----|------|
| 10° | 81 psi |
| 15° | 90 psi |
| 20° | 99 psi |
| 25° | 108 psi |
| 30° | 117 psi |
| 35° | 126 psi |

---

### R134A (HFC — Auto/Comercial)
```
PSI alta ≈ (Temperatura ambiente + 32) × 1.5
```

**Ejemplo:**
- Temperatura = 25°C
- Cálculo = (25 + 32) × 1.5 = 57 × 1.5 = 85.5 psi

| T°C | PSI |
|-----|------|
| 15° | 70.5 psi |
| 20° | 78 psi |
| 25° | 85.5 psi |
| 30° | 93 psi |
| 35° | 100.5 psi |
| 40° | 108 psi |

---

## ⚡ RANGO DE TOLERANCIA

La presión medida debe estar dentro de **±5%** de la esperada.

### Ejemplo: R410A a 25°C
```
PSI esperada = 110 psi
Tolerancia = 110 × 0.05 = 5.5 psi
Rango válido = 104.5 a 115.5 psi
```

---

## 🔍 CÓMO USAR EN LA APP

### Método 1: Función de diagnóstico rápido

```javascript
const diagnostico = LeyMas30.diagnosticar('R410A', 25, 108);

// Resultado:
{
  valido: true,
  gas: "R410A",
  tempAmbiente: 25,
  psiMedida: 108,
  psiEsperada: 110,
  diferencia: -2,
  porcentaje: -1.82,
  estado: "CORRECTA",
  diagnostico: "PSI dentro de rango (108 psi)",
  accion: "Sistema bien cargado"
}
```

### Método 2: Calcular PSI esperada

```javascript
const psi = LeyMas30.calcularPSIAlta('R410A', 25);
console.log(psi); // 110
```

### Método 3: Obtener rango

```javascript
const rango = LeyMas30.calcularRango('R410A', 25);

// Resultado:
{
  minimo: 104.5,
  esperado: 110,
  maximo: 115.5,
  tolerancia: 5.5
}
```

### Método 4: Ver tabla en consola

```javascript
LeyMas30.mostrarTabla('R410A');
// Muestra tabla temperatura vs PSI
```

### Método 5: Comparar todos los gases

```javascript
LeyMas30.compararGases(25);
// Muestra tabla comparativa de todos los gases a 25°C
```

---

## 📋 TABLA COMPARATIVA RÁPIDA (25°C Ambiente)

| Gas | Fórmula | PSI @ 25°C | Rango ±5% |
|-----|---------|-----------|-----------|
| R22 | T+30 | 55 psi | 52-58 |
| R134A | (T+32)×1.5 | 85.5 psi | 81-90 |
| R32 | (T+28)×2 | 106 psi | 101-111 |
| **R410A** | **(T+30)×2** | **110 psi** | **104.5-115.5** |
| R404A | (T+35)×1.8 | 108 psi | 103-113 |

---

## 🎯 DIAGNÓSTICO RÁPIDO

### Si medís PSI alta menor a lo esperado:

```
✓ 10% menor    → Levemente baja (normal después de una operación)
✗ 15-20% menor → Baja (posible fuga)
✗ 25%+ menor   → Muy baja (carga insuficiente)
```

**Acción:** Agregar refrigerante según peso

### Si medís PSI alta mayor a lo esperado:

```
✓ 10% mayor    → Levemente alta (normal en días calurosos)
✗ 15-20% mayor → Alta (posible sobrecarga)
✗ 25%+ mayor   → Muy alta (carga excesiva)
```

**Acción:** Purgar refrigerante con vacuómetro

---

## 💡 CASOS DE USO PRÁCTICOS

### Caso 1: Split R410A en verano porteño

```
Temperatura ambiente: 35°C (día de 35°C en Buenos Aires)
PSI esperada = (35 + 30) × 2 = 130 psi
Rango válido = 123.5 a 136.5 psi

Medición del técnico: 128 psi
Estado: CORRECTA ✅
Diferencia: -2 psi (-1.5%)
```

### Caso 2: Heladera R404A en comercio

```
Temperatura ambiente: 20°C (interior fresco)
PSI esperada = (20 + 35) × 1.8 = 99 psi
Rango válido = 94 a 104 psi

Medición del técnico: 92 psi
Estado: LEVEMENTE BAJA ⚠️
Diferencia: -7 psi (-7%)
Acción: Monitorear, posible fuga lenta
```

### Caso 3: Auto R134A con A/C

```
Temperatura ambiente: 30°C
PSI esperada = (30 + 32) × 1.5 = 93 psi
Rango válido = 88 a 98 psi

Medición del técnico: 95 psi
Estado: CORRECTA ✅
Diferencia: +2 psi (+2.1%)
```

---

## ⚠️ LIMITACIONES Y NOTAS IMPORTANTES

### Esto NO es una medida precisa

La Ley del +30 es una **regla de dedo** rápida. No reemplaza:
- Tablas de saturación precisas (ASHRAE)
- Cálculo de SH/SC
- Medición con equipos calibrados

### Cuándo usar:

✅ **Diagnóstico rápido en el campo**  
✅ **Referencia aproximada sin tablas**  
✅ **Verificación preliminar de carga**  
✅ **Entrenamiento de técnicos nuevos**  

### Cuándo NO usar:

❌ **Cuando necesites precisión (usar ASHRAE)**  
❌ **Para sistemas con sobrecalentamiento variable**  
❌ **En ambientes con temperatura extrema**  
❌ **Para certificación de carga**  

---

## 📱 CÓMO USAR EN LA APP

### Por consola (debugging):

```javascript
// Ver tabla de referencia
LeyMas30.mostrarTabla('R410A');

// Comparar gases
LeyMas30.compararGases(25);

// Diagnóstico rápido
LeyMas30.diagnosticar('R410A', 25, 108);
```

### En tu código:

```javascript
const resultado = LeyMas30.diagnosticar(
  'R410A',        // Gas
  28,             // Temperatura ambiente medida
  110             // PSI alta medida
);

if (resultado.valido) {
  console.log(`✅ ${resultado.accion}`);
} else {
  console.log(`❌ ${resultado.error}`);
}
```

---

## 🔧 INTEGRACIÓN EN UI

Para agregar a tu formulario de carga:

```html
<div class="ley-mas-30">
  <h3>Verificación Rápida +30</h3>
  
  <select id="gas-carga">
    <option value="r22">R22</option>
    <option value="r134a">R134A</option>
    <option value="r32">R32</option>
    <option value="r410a">R410A</option>
    <option value="r404a">R404A</option>
  </select>
  
  <input type="number" id="temp-ambiente" placeholder="Temp ambiente (°C)">
  <input type="number" id="psi-medida" placeholder="PSI medida">
  
  <button onclick="verificarCarga()">Verificar Carga</button>
  
  <div id="resultado-carga"></div>
</div>

<script>
function verificarCarga() {
  const gas = document.getElementById('gas-carga').value;
  const temp = document.getElementById('temp-ambiente').value;
  const psi = document.getElementById('psi-medida').value;
  
  const resultado = LeyMas30.diagnosticar(gas, temp, psi);
  
  const html = `
    <strong>${resultado.estado}</strong><br>
    ${resultado.diagnostico}<br>
    <em>${resultado.accion}</em>
  `;
  
  document.getElementById('resultado-carga').innerHTML = html;
}
</script>
```

---

## 📞 REFERENCIAS

**Fuentes técnicas:**
- EPA Refrigerant Management Guidelines
- HVAC Industry Standards (ASH RAE)
- Field Service Technician Training Manuals
- Manufacturer Charging Charts

---

## ✅ RESUMEN

La Ley del +30 es una **herramienta de diagnóstico rápido** que te permite:

1. ✓ Estimar PSI esperada en 10 segundos
2. ✓ Verificar si está en rango
3. ✓ Decidir si agregar o purgar refrigerante
4. ✓ Capacitar técnicos sin tablas complejas

**Pero recuerda:** Para precisión, usa tablas ASHRAE + SH/SC (que la app ahora tiene correctas).

---

**Implementado en:** `ley-mas-30.js`  
**Acceso:** `LeyMas30` o alias `Mas30` en consola  
**Fecha:** Octubre 2026
