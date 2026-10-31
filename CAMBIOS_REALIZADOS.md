# Cambios

## v1.9.3 (31/10/2026) — SH / SC unificados
- **Error corregido:** `SHSCEngine.calcularSH is not a function` (SH, SC y Combinado no calculaban).
- **Un solo cálculo** para todas las pantallas: `sh-sc.js` es la única fuente de la tabla P/T y de SH/SC.
  - Pantalla SH, SC y Combinado, diagnóstico de Split (`split-engine.js`) y bloque SH/SC del resultado usan la misma cuenta. Verificado: mismo número en todas las rutas.
  - `split-engine.js` ya no tiene tabla propia (tenía valores incorrectos).
- Si la presión está fuera de la tabla (-40 a 60 °C) ahora avisa "fuera de rango" en vez de inventar un valor.
- El diagnóstico usa el gas elegido (antes caía siempre en R410A) y los rangos de un gas ya no quedan "pegados" al calcular otro.
- Se quitó un manejador duplicado del botón "Calcular SC".
- Los rangos de referencia escritos en pantalla coinciden con los del diagnóstico: SH split 5–12 °C, SC split 4–8 °C.
- Se eliminaron `sh-sc-engine.js` y `test-mejoras-shsc.js` (motor duplicado con tablas viejas).

## v1.9.2 (31/10/2026)
- Tablas P/T corregidas (`funciones-tecnicas.json`): R22, R134a, R410A por ecuación ajustada a NIST (≤0,4 %); R32 y R404A **estimados** (±1 % sobre 0 °C, hasta ±4 % a -40 °C; ver `saturacion_meta`).
- Ley del +30 integrada como tab y botón en el inicio.
