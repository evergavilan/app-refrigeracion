// =====================================================
// LEY DEL MÁS 30
// Cálculo de presiones de carga esperadas por temperatura ambiente
// =====================================================

const LeyMas30 = {

  // ═══════════════════════════════════════════════
  // REFERENCIA: Fórmulas por gas
  // ═══════════════════════════════════════════════

  formulas: {
    r22: {
      nombre: "R22 (CFC — Fase out)",
      formula: "PSI alta = T° ambiente + 30",
      descripcion: "Suma directa. Ejemplo: 25°C → 55 psi"
    },
    r410a: {
      nombre: "R410A (HFC Blend — Moderno)",
      formula: "PSI alta = (T° ambiente + 30) × 2",
      descripcion: "Suma 30 y multiplica por 2. Ejemplo: 25°C → 110 psi"
    },
    r32: {
      nombre: "R32 (Puro — Muy moderno)",
      formula: "PSI alta ≈ (T° ambiente + 28) × 2",
      descripcion: "Similar a R410A pero levemente más bajo"
    },
    r404a: {
      nombre: "R404A (HFC Blend — Baja temp)",
      formula: "PSI alta = (T° ambiente + 35) × 1.8",
      descripcion: "Usar para heladeras y cámaras frías"
    },
    r134a: {
      nombre: "R134A (HFC — Auto/Comercial)",
      formula: "PSI alta ≈ (T° ambiente + 32) × 1.5",
      descripcion: "Medio entre R22 y R410A"
    }
  },

  // ═══════════════════════════════════════════════
  // CALCULAR PSI ESPERADA DE CARGA
  // ═══════════════════════════════════════════════

  calcularPSIAlta(gas, tempAmbiente) {
    const tAmb = Number(tempAmbiente);
    
    if (isNaN(tAmb)) {
      return null;
    }

    const gasNorm = gas.toLowerCase().replace(/[^a-z0-9]/g, '');
    let psiAlta = null;

    switch (gasNorm) {
      case 'r22':
        psiAlta = tAmb + 30;
        break;
      
      case 'r410a':
        psiAlta = (tAmb + 30) * 2;
        break;
      
      case 'r32':
        psiAlta = (tAmb + 28) * 2;
        break;
      
      case 'r404a':
        psiAlta = (tAmb + 35) * 1.8;
        break;
      
      case 'r134a':
        psiAlta = (tAmb + 32) * 1.5;
        break;
      
      default:
        return null;
    }

    return Math.round(psiAlta * 10) / 10;
  },

  // ═══════════════════════════════════════════════
  // RANGO DE TOLERANCIA
  // ═══════════════════════════════════════════════

  calcularRango(gas, tempAmbiente) {
    const psiCentral = this.calcularPSIAlta(gas, tempAmbiente);
    
    if (psiCentral === null) {
      return null;
    }

    // Tolerancia: ±5% de la presión esperada (regla técnica estándar)
    const tolerancia = psiCentral * 0.05;

    return {
      minimo: Math.round((psiCentral - tolerancia) * 10) / 10,
      esperado: psiCentral,
      maximo: Math.round((psiCentral + tolerancia) * 10) / 10,
      tolerancia: Math.round(tolerancia * 10) / 10
    };
  },

  // ═══════════════════════════════════════════════
  // DIAGNÓSTICO RÁPIDO
  // ═══════════════════════════════════════════════

  diagnosticar(gas, tempAmbiente, psiAltaMedida) {
    const gasNorm = gas.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rango = this.calcularRango(gas, tempAmbiente);

    if (!rango) {
      return {
        valido: false,
        error: `Gas "${gas}" no reconocido`
      };
    }

    const psi = Number(psiAltaMedida);
    if (isNaN(psi)) {
      return {
        valido: false,
        error: "PSI medida no es un número válido"
      };
    }

    let estado = null;
    let diagnostico = null;
    let accion = null;

    const diferencia = psi - rango.esperado;
    const porcentaje = (diferencia / rango.esperado) * 100;

    if (psi < rango.minimo - 5) {
      estado = "BAJA";
      diagnostico = `PSI muy baja (${psi} < ${rango.minimo})`;
      accion = "Agregar refrigerante";
    } else if (psi < rango.minimo) {
      estado = "LEVEMENTE BAJA";
      diagnostico = `PSI levemente baja (${psi} vs ${rango.esperado})`;
      accion = "Monitorear, posible fuga lenta";
    } else if (psi <= rango.maximo) {
      estado = "CORRECTA";
      diagnostico = `PSI dentro de rango (${psi} psi)`;
      accion = "Sistema bien cargado";
    } else if (psi <= rango.maximo + 5) {
      estado = "LEVEMENTE ALTA";
      diagnostico = `PSI levemente alta (${psi} vs ${rango.esperado})`;
      accion = "Monitorear, posible sobrecarga";
    } else {
      estado = "ALTA";
      diagnostico = `PSI muy alta (${psi} > ${rango.maximo})`;
      accion = "Purgar refrigerante";
    }

    return {
      valido: true,
      gas: gasNorm.toUpperCase(),
      tempAmbiente: Number(tempAmbiente),
      psiMedida: psi,
      psiEsperada: rango.esperado,
      rango: rango,
      diferencia: Math.round(diferencia * 10) / 10,
      porcentaje: Math.round(porcentaje * 10) / 10,
      estado: estado,
      diagnostico: diagnostico,
      accion: accion
    };
  },

  // ═══════════════════════════════════════════════
  // TABLA DE REFERENCIA RÁPIDA
  // ═══════════════════════════════════════════════

  generarTablaReferencia(gas, tempDesde = 15, tempHasta = 40, paso = 5) {
    const tabla = [];

    for (let t = tempDesde; t <= tempHasta; t += paso) {
      const psi = this.calcularPSIAlta(gas, t);
      
      if (psi !== null) {
        tabla.push({
          temperatura: t,
          psi_esperada: psi,
          minimo: Math.round((psi - psi * 0.05) * 10) / 10,
          maximo: Math.round((psi + psi * 0.05) * 10) / 10
        });
      }
    }

    return tabla;
  },

  // ═══════════════════════════════════════════════
  // MOSTRAR TABLA EN CONSOLA (DEBUG)
  // ═══════════════════════════════════════════════

  mostrarTabla(gas) {
    console.clear();
    console.log(`\n📊 LEY DEL +30 — Tabla de Referencia ${gas.toUpperCase()}\n`);
    console.log('Temp°C | PSI Esperada | Mín-Máx (±5%)');
    console.log('───────┼──────────────┼──────────────');

    const tabla = this.generarTablaReferencia(gas);
    tabla.forEach(row => {
      console.log(
        `${row.temperatura.toString().padStart(6)}° | ` +
        `${row.psi_esperada.toString().padStart(12)} | ` +
        `${row.minimo}-${row.maximo}`
      );
    });

    console.log('\n');
  },

  // ═══════════════════════════════════════════════
  // COMPARADOR DE GASES
  // ═══════════════════════════════════════════════

  compararGases(tempAmbiente) {
    console.clear();
    console.log(`\n📊 COMPARACIÓN DE GASES — Temperatura Ambiente: ${tempAmbiente}°C\n`);
    console.log('Gas      | Fórmula                    | PSI Alta Esperada');
    console.log('─────────┼────────────────────────────┼──────────────────');

    const gases = ['r22', 'r134a', 'r32', 'r410a', 'r404a'];
    
    gases.forEach(gas => {
      const psi = this.calcularPSIAlta(gas, tempAmbiente);
      const formula = this.formulas[gas].formula;
      
      if (psi !== null) {
        console.log(
          `${gas.toUpperCase().padEnd(8)} | ` +
          `${formula.padEnd(28)} | ` +
          `${psi.toString().padStart(10)} psi`
        );
      }
    });

    console.log('\n');
  }
};

// Exponer globalmente
window.LeyMas30 = LeyMas30;

// Alias cortos para uso rápido
window.Mas30 = LeyMas30;
