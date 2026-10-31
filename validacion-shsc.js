// =====================================================
// HVAC PRO ARGENTINA
// VALIDACION-SHSC.JS — Validación de entradas SH/SC
// =====================================================

const ValidacionSHSC = {

  // Límites válidos para cada parámetro
  limites: {
    psi_baja_min: -5,
    psi_baja_max: 250,
    psi_alta_min: 50,
    psi_alta_max: 1000,
    temp_succion_min: -50,
    temp_succion_max: 80,
    temp_liquido_min: -40,
    temp_liquido_max: 70,
    delta_psi_minimo: 20  // PSI alta debe ser > PSI baja + esto
  },

  // ═══════════════════════════════════════════════
  // VALIDAR ENTRADAS ANTES DE CALCULAR
  // ═══════════════════════════════════════════════

  validarEntradas(gas, psiBaja, psiAlta, tempSuccion, tempLiquido) {
    const L = this.limites;
    const errores = [];
    const advertencias = [];

    // Conversión a números
    const pb = Number(psiBaja);
    const pa = Number(psiAlta);
    const ts = Number(tempSuccion);
    const tl = Number(tempLiquido);

    // 1. PSI BAJA vs PSI ALTA
    if (pb >= pa) {
      errores.push(`PSI baja (${pb}) debe ser menor a PSI alta (${pa})`);
    }
    if ((pa - pb) < L.delta_psi_minimo) {
      advertencias.push(`La diferencia de presión es muy pequeña (${pa - pb} psi). Verificá las mediciones.`);
    }

    // 2. RANGOS PSI BAJA
    if (pb < L.psi_baja_min || pb > L.psi_baja_max) {
      advertencias.push(`PSI baja (${pb}) fuera del rango típico [${L.psi_baja_min}, ${L.psi_baja_max}]`);
    }

    // 3. RANGOS PSI ALTA
    if (pa < L.psi_alta_min || pa > L.psi_alta_max) {
      advertencias.push(`PSI alta (${pa}) fuera del rango típico [${L.psi_alta_min}, ${L.psi_alta_max}]`);
    }

    // 4. RANGOS TEMPERATURA SUCCIÓN
    if (ts < L.temp_succion_min || ts > L.temp_succion_max) {
      advertencias.push(`Temp succión (${ts}°C) fuera del rango válido [${L.temp_succion_min}, ${L.temp_succion_max}]`);
    }

    // 5. RANGOS TEMPERATURA LÍQUIDO
    if (tl < L.temp_liquido_min || tl > L.temp_liquido_max) {
      advertencias.push(`Temp líquido (${tl}°C) fuera del rango válido [${L.temp_liquido_min}, ${L.temp_liquido_max}]`);
    }

    // 6. COHERENCIA: Temperatura de succión vs PSI baja
    if (SHSCEngine && SHSCEngine.psiATemp) {
      const tsatBaja = SHSCEngine.psiATemp(gas, pb);
      if (tsatBaja !== null) {
        if (ts < tsatBaja - 10) {
          advertencias.push(
            `Temp succión (${ts}°C) está muy por debajo de Tsat baja (${tsatBaja.toFixed(1)}°C). ` +
            `¿El medidor está en mal lugar o hay una fuga grave?`
          );
        }
      }
    }

    // 7. COHERENCIA: Temperatura de líquido vs PSI alta
    if (SHSCEngine && SHSCEngine.psiATemp) {
      const tsatAlta = SHSCEngine.psiATemp(gas, pa);
      if (tsatAlta !== null) {
        if (tl > tsatAlta) {
          errores.push(
            `Temp líquido (${tl}°C) no puede ser mayor a Tsat alta (${tsatAlta.toFixed(1)}°C). ` +
            `Esto es físicamente imposible. Revisá el medidor.`
          );
        }
        if (tl > tsatAlta - 2) {
          advertencias.push(
            `Temp líquido muy cercana a Tsat alta. Podría haber vapor en la línea de líquido.`
          );
        }
      }
    }

    // 8. VALIDACIÓN DE GAS
    const gasesValidos = ['r410a', 'r32', 'r22', 'r134a', 'r404a'];
    const gasNorm = gas.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!gasesValidos.includes(gasNorm)) {
      errores.push(`Gas "${gas}" no reconocido. Válidos: R410A, R32, R22, R134A, R404A`);
    }

    return {
      valido: errores.length === 0,
      errores,
      advertencias,
      datos_normalizados: {
        gas: gasNorm,
        psiBaja: pb,
        psiAlta: pa,
        tempSuccion: ts,
        tempLiquido: tl
      }
    };
  },

  // ═══════════════════════════════════════════════
  // MOSTRAR RESULTADOS DE VALIDACIÓN EN UI
  // ═══════════════════════════════════════════════

  mostrarValidacion(validacion, contenedorId = null) {
    const container = contenedorId ? document.getElementById(contenedorId) : null;

    // ERRORES CRÍTICOS — Bloquear operación
    if (validacion.errores.length > 0) {
      const msgErrores = validacion.errores
        .map((e, i) => `${i + 1}. ${e}`)
        .join('\n');

      const mensaje = `❌ ERRORES CRÍTICOS:\n\n${msgErrores}\n\nVerificá los valores ingresados.`;

      if (container) {
        container.innerHTML = `
          <div class="validacion-error" style="
            background: #ff5252;
            color: white;
            padding: 16px;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
          ">
            ❌ ${validacion.errores[0]}
          </div>
        `;
      } else {
        alert(mensaje);
      }

      console.error('ValidacionSHSC errores:', validacion.errores);
      return false;
    }

    // ADVERTENCIAS — Avisar pero permitir
    if (validacion.advertencias.length > 0) {
      const msgAdvertencias = validacion.advertencias
        .map((w, i) => `⚠️ ${w}`)
        .join('\n\n');

      console.warn('ValidacionSHSC advertencias:', msgAdvertencias);

      if (container) {
        container.innerHTML = `
          <div class="validacion-advertencia" style="
            background: #fff3cd;
            color: #856404;
            padding: 12px;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
            margin-bottom: 16px;
          ">
            <strong>⚠️ Advertencias:</strong><br/>
            ${validacion.advertencias.map(w => `• ${w}`).join('<br/>')}
          </div>
        `;
      }
    }

    return true;
  },

  // ═══════════════════════════════════════════════
  // VALIDACIÓN SIMPLIFICADA PARA INTEGRACIÓN
  // ═══════════════════════════════════════════════

  validarYCalcular(gas, psiBaja, psiAlta, tempSuccion, tempLiquido) {
    const validacion = this.validarEntradas(gas, psiBaja, psiAlta, tempSuccion, tempLiquido);

    if (!validacion.valido) {
      return {
        exito: false,
        errores: validacion.errores,
        advertencias: validacion.advertencias
      };
    }

    // Si es válido, calcular
    const datos = validacion.datos_normalizados;
    let resultado = { exito: true, advertencias: validacion.advertencias };

    if (psiBaja && tempSuccion) {
      const shResult = SHSCEngine.calcularSH(datos.gas, datos.psiBaja, datos.tempSuccion);
      if (shResult) {
        resultado.sh = shResult.sh;
        resultado.tempSatBaja = shResult.tempSaturacion;
        resultado.diagSH = SHSCEngine.diagnosticarSH(shResult.sh, 'split');
      }
    }

    if (psiAlta && tempLiquido) {
      const scResult = SHSCEngine.calcularSC(datos.gas, datos.psiAlta, datos.tempLiquido);
      if (scResult) {
        resultado.sc = scResult.sc;
        resultado.tempSatAlta = scResult.tempSaturacion;
        resultado.diagSC = SHSCEngine.diagnosticarSC(scResult.sc, 'split');
      }
    }

    return resultado;
  },

  // ═══════════════════════════════════════════════
  // CALIBRACIÓN — Verificar que las tablas sean precisas
  // ═══════════════════════════════════════════════

  calibrarTablas() {
    // Puntos de tabla de campo clásicos (40 °F = 4.4 °C y 100 °F = 37.8 °C, psig).
    // R32 y R404A: valores ESTIMADOS (ver saturacion_meta en funciones-tecnicas.json).
    const calibraciones = [
      { gas: 'r410a', psi: 118.0, tsat_ashrae: 4.4 },
      { gas: 'r410a', psi: 317.4, tsat_ashrae: 37.8 },
      { gas: 'r22',   psi: 68.5,  tsat_ashrae: 4.4 },
      { gas: 'r22',   psi: 195.9, tsat_ashrae: 37.8 },
      { gas: 'r134a', psi: 34.7,  tsat_ashrae: 4.4 },
      { gas: 'r134a', psi: 124.1, tsat_ashrae: 37.8 },
      { gas: 'r32',   psi: 103.4, tsat_ashrae: 0 },
      { gas: 'r404a', psi: 72.6,  tsat_ashrae: 0 }
    ];

    console.log('\n📊 CALIBRACIÓN DE TABLAS DE SATURACIÓN\n' + '='.repeat(60));

    let erroresDetectados = false;

    calibraciones.forEach(cal => {
      const tsatCalculada = SHSCEngine.psiATemp(cal.gas, cal.psi);
      const error = Math.abs(tsatCalculada - cal.tsat_ashrae);
      const errorPct = (error / Math.abs(cal.tsat_ashrae)) * 100;

      const estado = errorPct < 2 ? '✓ OK' : errorPct < 5 ? '⚠ REVISAR' : '✗ ERROR';

      console.log(
        `${cal.gas.toUpperCase()} @ ${cal.psi} psi:\n` +
        `  ASHRAE:     ${cal.tsat_ashrae}°C\n` +
        `  Calculada:  ${tsatCalculada.toFixed(2)}°C\n` +
        `  Error:      ${error.toFixed(2)}°C (${errorPct.toFixed(1)}%) ${estado}\n`
      );

      if (errorPct >= 5) erroresDetectados = true;
    });

    console.log('='.repeat(60));
    if (erroresDetectados) {
      console.warn('⚠️ Se encontraron desviaciones. Revisar tablas de saturación.');
    } else {
      console.log('✓ Todas las tablas están bien calibradas.');
    }

    return !erroresDetectados;
  }
};

// Exponer globalmente
window.ValidacionSHSC = ValidacionSHSC;
