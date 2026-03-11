/**
 * Script para verificar y diagnosticar inconsistencias en los datos de parqueaderos
 * Ejecutar: node scripts/diagnosticar-parqueaderos.js
 */

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import Parqueadero from "../src/models/parqueaderos.model.js";
import Estado from "../src/models/estados.model.js";
import TipoVehiculo from "../src/models/tiposVehiculo.model.js";

// Cargar variables de entorno
dotenv.config({ path: ".env" });

// Crear conexión a la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    timezone: "-05:00",
    logging: false,
  },
);

// Inicializar modelos
Parqueadero.initModel(sequelize);
Estado.initModel(sequelize);
TipoVehiculo.initModel(sequelize);

const diagnosticarParqueaderos = async () => {
  try {
    console.log("\n========================================");
    console.log("🔍 DIAGNÓSTICO DE PARQUEADEROS");
    console.log("========================================\n");

    // 1. Total de parqueaderos
    const totalParqueaderos = await Parqueadero.count();
    console.log(`📊 Total de parqueaderos: ${totalParqueaderos}`);

    // 2. Estados disponibles
    console.log("\n📋 Estados en la base de datos:");
    const estados = await Estado.findAll();
    estados.forEach((estado) => {
      console.log(
        `   - ID: ${estado.IdEstado}, Nombre: ${estado.nombreEstado}`,
      );
    });

    // 3. Tipos de vehículo disponibles
    console.log("\n🚗 Tipos de vehículo en la base de datos:");
    const tiposVehiculo = await TipoVehiculo.findAll();
    tiposVehiculo.forEach((tipo) => {
      console.log(
        `   - ID: ${tipo.idTipoVehiculo}, Nombre: ${tipo.nombreVehiculo}`,
      );
    });

    // 4. Distribución por estado
    console.log("\n📈 Distribución por estado:");
    const porEstado = await Parqueadero.findAll({
      attributes: [
        "estadoId",
        [Sequelize.fn("COUNT", Sequelize.col("codigoParqueadero")), "cantidad"],
      ],
      group: ["estadoId"],
      raw: true,
    });

    for (const item of porEstado) {
      const estado = await Estado.findByPk(item.estadoId);
      console.log(
        `   - Estado ${item.estadoId} (${
          estado ? estado.nombreEstado : "Desconocido"
        }): ${item.cantidad}`,
      );
    }

    // 5. Distribución por tipo de vehículo
    console.log("\n🚙 Distribución por tipo de vehículo:");
    const porTipo = await Parqueadero.findAll({
      attributes: [
        "tipoVehiculoId",
        [Sequelize.fn("COUNT", Sequelize.col("codigoParqueadero")), "cantidad"],
      ],
      group: ["tipoVehiculoId"],
      raw: true,
    });

    for (const item of porTipo) {
      const tipo = await TipoVehiculo.findByPk(item.tipoVehiculoId);
      console.log(
        `   - Tipo ${item.tipoVehiculoId} (${
          tipo ? tipo.nombreVehiculo : "Desconocido"
        }): ${item.cantidad}`,
      );
    }

    // 6. Datos para el dashboard (con los nuevos cálculos)
    console.log("\n📱 Datos calculados para el dashboard:");
    const ocupadosCarros = await Parqueadero.count({
      where: { estadoId: 3, tipoVehiculoId: 1 },
    });
    const ocupadosMotos = await Parqueadero.count({
      where: { estadoId: 3, tipoVehiculoId: 2 },
    });
    const disponibles = await Parqueadero.count({
      where: { estadoId: 4 },
    });
    const totalOcupados = ocupadosCarros + ocupadosMotos;

    console.log(`   ✓ Total: ${totalParqueaderos}`);
    console.log(`   ✓ Ocupados (Carros): ${ocupadosCarros}`);
    console.log(`   ✓ Ocupados (Motos): ${ocupadosMotos}`);
    console.log(`   ✓ Total Ocupados: ${totalOcupados}`);
    console.log(`   ✓ Disponibles: ${disponibles}`);

    // 7. Verificar inconsistencias
    console.log("\n⚠️  Verificación de inconsistencias:");

    const sumaTotal = totalOcupados + disponibles;
    if (sumaTotal === totalParqueaderos) {
      console.log(`   ✓ OK: Los números coinciden correctamente`);
    } else {
      console.log(
        `   ❌ ERROR: La suma no coincide (${sumaTotal} vs ${totalParqueaderos})`,
      );
      console.log(
        `      Diferencia: ${Math.abs(sumaTotal - totalParqueaderos)}`,
      );

      // Buscar estados diferentes a 3 y 4
      const estadosInvalidos = await Parqueadero.findAll({
        where: {
          estadoId: {
            [Sequelize.Op.notIn]: [3, 4],
          },
        },
      });

      if (estadosInvalidos.length > 0) {
        console.log(
          `\n   ⚠️  Encontrados ${estadosInvalidos.length} parqueaderos con estadoId inválido:`,
        );
        estadosInvalidos.forEach((p) => {
          console.log(
            `      - ${p.codigoParqueadero}: estadoId=${p.estadoId}, tipoVehiculoId=${p.tipoVehiculoId}`,
          );
        });
      }
    }

    // 8. Verificar si hay parqueaderos ocupados que exceden el total
    if (totalOcupados > totalParqueaderos) {
      console.log(
        `\n   ❌ PROBLEMA GRAVE: Hay más parqueaderos ocupados (${totalOcupados}) que el total (${totalParqueaderos})`,
      );
    }

    // 9. Verificar disponibles negativos
    if (disponibles < 0) {
      console.log(
        `\n   ❌ ERROR: Parqueaderos disponibles es negativo (${disponibles})`,
      );
    }

    // 10. Matriz de ocupación
    console.log("\n📊 Matriz de ocupación (Estado x Tipo):");
    console.log("   ┌─────────────┬────────┬────────┐");
    console.log("   │   Estado    │ Carros │ Motos  │");
    console.log("   ├─────────────┼────────┼────────┤");

    for (const estado of estados) {
      const carros = await Parqueadero.count({
        where: { estadoId: estado.IdEstado, tipoVehiculoId: 1 },
      });
      const motos = await Parqueadero.count({
        where: { estadoId: estado.IdEstado, tipoVehiculoId: 2 },
      });
      const nombreEstado = estado.nombreEstado.padEnd(11);
      console.log(`   │ ${nombreEstado} │   ${carros}    │   ${motos}   │`);
    }
    console.log("   └─────────────┴────────┴────────┘");

    console.log("\n========================================");
    console.log("✅ Diagnóstico completado");
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante el diagnóstico:", error);
    process.exit(1);
  }
};

// Ejecutar diagnóstico
diagnosticarParqueaderos();
