import { Router } from "express";
import { sequelize } from "../config/connect.db.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";

const router = Router();

// ============================================================================
// REPORTE DE PARQUEADEROS
// ============================================================================
router.get(
  "/parqueaderos",
  validarJWT,
  validarRol(1, 2, 3),
  async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: "Se requieren fechaInicio y fechaFin",
        });
      }

      // Total de parqueaderos por tipo de vehículo
      const [porTipo] = await sequelize.query(`
        SELECT 
          tv.nombreVehiculo,
          COUNT(p.codigoParqueadero) as cantidad
        FROM parqueaderos p
        INNER JOIN tiposVehiculo tv ON p.tipoVehiculoId = tv.idTipoVehiculo
        GROUP BY tv.nombreVehiculo, tv.idTipoVehiculo
        ORDER BY tv.idTipoVehiculo
      `);

      // Ocupación actual por estado
      const [ocupacion] = await sequelize.query(`
        SELECT 
          e.nombreEstado,
          COUNT(p.codigoParqueadero) as cantidad
        FROM parqueaderos p
        INNER JOIN estados e ON p.estadoId = e.IdEstado
        WHERE p.estadoId IN (3, 4)
        GROUP BY e.nombreEstado, p.estadoId
        ORDER BY p.estadoId
      `);

      res.json({
        success: true,
        data: {
          porTipo: porTipo,
          ocupacion: ocupacion,
        },
      });
    } catch (error) {
      console.error("Error en reporte de parqueaderos:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar reporte de parqueaderos",
        error: error.message,
      });
    }
  }
);

// ============================================================================
// REPORTE DE VISITAS
// ============================================================================
router.get("/visitas", validarJWT, validarRol(1, 2, 3), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    // Total de visitas en el período
    const [totalVisitas] = await sequelize.query(
      `
      SELECT COUNT(*) as total
      FROM visitas
      WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Visitas por día
    const [porDia] = await sequelize.query(
      `
      SELECT 
        DATE(fechaHoraIngreso) as fecha,
        COUNT(*) as cantidad
      FROM visitas
      WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
      GROUP BY DATE(fechaHoraIngreso)
      ORDER BY fecha DESC
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Visitas con vehículo vs sin vehículo
    const [porVehiculo] = await sequelize.query(
      `
      SELECT 
        CASE 
          WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo'
          ELSE 'Sin vehículo'
        END as tipo,
        COUNT(*) as cantidad
      FROM visitas
      WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
      GROUP BY CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Día con más visitas
    const diaConMasVisitas =
      porDia.length > 0
        ? {
            fecha: porDia[0].fecha,
            cantidad: porDia[0].cantidad,
          }
        : null;

    res.json({
      success: true,
      data: {
        totalVisitas: totalVisitas[0].total,
        porDia: porDia,
        porVehiculo: porVehiculo,
        diaConMasVisitas: diaConMasVisitas,
      },
    });
  } catch (error) {
    console.error("Error en reporte de visitas:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de visitas",
      error: error.message,
    });
  }
});

// ============================================================================
// REPORTE DE PAQUETES
// ============================================================================
router.get("/paquetes", validarJWT, validarRol(1, 2, 3), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    // Total de paquetes en el período
    const [totalPaquetes] = await sequelize.query(
      `
      SELECT COUNT(*) as total
      FROM recepcionpaquetes
      WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ?
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Paquetes entregados (estadoId = 15 "entregado")
    const [entregados] = await sequelize.query(
      `
      SELECT COUNT(*) as total
      FROM recepcionpaquetes
      WHERE DATE(fechaRecepcion) >= ? 
        AND DATE(fechaRecepcion) <= ?
        AND fechaEntrega IS NOT NULL
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Paquetes pendientes (estadoId = 14 "recibido" o fechaEntrega NULL)
    const [pendientes] = await sequelize.query(
      `
      SELECT COUNT(*) as total
      FROM recepcionpaquetes
      WHERE DATE(fechaRecepcion) >= ? 
        AND DATE(fechaRecepcion) <= ?
        AND fechaEntrega IS NULL
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Paquetes por día
    const [porDia] = await sequelize.query(
      `
      SELECT 
        DATE(fechaRecepcion) as fecha,
        COUNT(*) as cantidad
      FROM recepcionpaquetes
      WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ?
      GROUP BY DATE(fechaRecepcion)
      ORDER BY fecha DESC
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    res.json({
      success: true,
      data: {
        totalPaquetes: totalPaquetes[0].total,
        entregados: entregados[0].total,
        pendientes: pendientes[0].total,
        porDia: porDia,
      },
    });
  } catch (error) {
    console.error("Error en reporte de paquetes:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de paquetes",
      error: error.message,
    });
  }
});

// ============================================================================
// REPORTE DE RESERVAS
// ============================================================================
router.get("/reservas", validarJWT, validarRol(1, 2, 3), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    // Total de reservas en el período
    const [totalReservas] = await sequelize.query(
      `
      SELECT COUNT(*) as total
      FROM reservasareas
      WHERE fechaReserva >= ? AND fechaReserva <= ?
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Reservas por área común
    const [porArea] = await sequelize.query(
      `
      SELECT 
        ac.nombreArea,
        COUNT(r.idReservas) as cantidad
      FROM reservasareas r
      INNER JOIN areacomun ac ON r.areaComunId = ac.idAreaComun
      WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
      GROUP BY ac.nombreArea, ac.idAreaComun
      ORDER BY cantidad DESC
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Reservas por estado
    const [porEstado] = await sequelize.query(
      `
      SELECT 
        e.nombreEstado,
        COUNT(r.idReservas) as cantidad
      FROM reservasareas r
      INNER JOIN estados e ON r.estadoId = e.IdEstado
      WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
      GROUP BY e.nombreEstado, r.estadoId
      ORDER BY cantidad DESC
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    // Promedio de asistentes por reserva
    const [promedioAsistentes] = await sequelize.query(
      `
      SELECT 
        ROUND(AVG(cantidadAsistentes), 2) as promedio
      FROM reservasareas
      WHERE fechaReserva >= ? AND fechaReserva <= ?
    `,
      {
        replacements: [fechaInicio, fechaFin],
      }
    );

    res.json({
      success: true,
      data: {
        totalReservas: totalReservas[0].total,
        porArea: porArea,
        porEstado: porEstado,
        promedioAsistentes: promedioAsistentes[0].promedio || 0,
      },
    });
  } catch (error) {
    console.error("Error en reporte de reservas:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de reservas",
      error: error.message,
    });
  }
});

// ============================================================================
// REPORTE CONSOLIDADO (Todos los datos en una sola petición)
// ============================================================================
router.get(
  "/consolidado",
  validarJWT,
  validarRol(1, 2, 3),
  async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: "Se requieren fechaInicio y fechaFin",
        });
      }

      // Ejecutar todas las consultas en paralelo
      const [
        [parqueaderosPorTipo],
        [parqueaderosOcupacion],
        [totalVisitas],
        [visitasPorVehiculo],
        [totalPaquetes],
        [paquetesEntregados],
        [paquetesPendientes],
        [totalReservas],
        [reservasPorArea],
        [reservasPorEstado],
      ] = await Promise.all([
        // Parqueaderos por tipo
        sequelize.query(`
          SELECT 
            tv.nombreVehiculo,
            COUNT(p.codigoParqueadero) as cantidad
          FROM parqueaderos p
          INNER JOIN tiposVehiculo tv ON p.tipoVehiculoId = tv.idTipoVehiculo
          GROUP BY tv.nombreVehiculo, tv.idTipoVehiculo
          ORDER BY tv.idTipoVehiculo
        `),
        // Parqueaderos ocupación
        sequelize.query(`
          SELECT 
            e.nombreEstado,
            COUNT(p.codigoParqueadero) as cantidad
          FROM parqueaderos p
          INNER JOIN estados e ON p.estadoId = e.IdEstado
          WHERE p.estadoId IN (3, 4)
          GROUP BY e.nombreEstado, p.estadoId
          ORDER BY p.estadoId
        `),
        // Total visitas
        sequelize.query(
          `
          SELECT COUNT(*) as total
          FROM visitas
          WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
        // Visitas por vehículo
        sequelize.query(
          `
          SELECT 
            CASE 
              WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo'
              ELSE 'Sin vehículo'
            END as tipo,
            COUNT(*) as cantidad
          FROM visitas
          WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
          GROUP BY CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
        // Total paquetes
        sequelize.query(
          `
          SELECT COUNT(*) as total
          FROM recepcionpaquetes
          WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ?
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
        // Paquetes entregados
        sequelize.query(
          `
          SELECT COUNT(*) as total
          FROM recepcionpaquetes
          WHERE DATE(fechaRecepcion) >= ? 
            AND DATE(fechaRecepcion) <= ?
            AND fechaEntrega IS NOT NULL
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
        // Paquetes pendientes
        sequelize.query(
          `
          SELECT COUNT(*) as total
          FROM recepcionpaquetes
          WHERE DATE(fechaRecepcion) >= ? 
            AND DATE(fechaRecepcion) <= ?
            AND fechaEntrega IS NULL
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
        // Total reservas
        sequelize.query(
          `
          SELECT COUNT(*) as total
          FROM reservasareas
          WHERE fechaReserva >= ? AND fechaReserva <= ?
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
        // Reservas por área
        sequelize.query(
          `
          SELECT 
            ac.nombreArea,
            COUNT(r.idReservas) as cantidad
          FROM reservasareas r
          INNER JOIN areacomun ac ON r.areaComunId = ac.idAreaComun
          WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
          GROUP BY ac.nombreArea, ac.idAreaComun
          ORDER BY cantidad DESC
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
        // Reservas por estado
        sequelize.query(
          `
          SELECT 
            e.nombreEstado,
            COUNT(r.idReservas) as cantidad
          FROM reservasareas r
          INNER JOIN estados e ON r.estadoId = e.IdEstado
          WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
          GROUP BY e.nombreEstado, r.estadoId
          ORDER BY cantidad DESC
        `,
          { replacements: [fechaInicio, fechaFin] }
        ),
      ]);

      res.json({
        success: true,
        data: {
          parqueaderos: {
            porTipo: parqueaderosPorTipo,
            ocupacion: parqueaderosOcupacion,
          },
          visitas: {
            total: totalVisitas[0].total,
            porVehiculo: visitasPorVehiculo,
          },
          paquetes: {
            total: totalPaquetes[0].total,
            entregados: paquetesEntregados[0].total,
            pendientes: paquetesPendientes[0].total,
          },
          reservas: {
            total: totalReservas[0].total,
            porArea: reservasPorArea,
            porEstado: reservasPorEstado,
          },
        },
      });
    } catch (error) {
      console.error("Error en reporte consolidado:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar reporte consolidado",
        error: error.message,
      });
    }
  }
);

export default router;
