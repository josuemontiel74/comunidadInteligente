import { sequelize } from "../config/connect.db.js";

// ============================================================================
// REPORTE DE PARQUEADEROS
// ============================================================================
export const obtenerReporteParqueaderos = async (req, res) => {
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
        COUNT(p.codigoParqueadero) as totalParqueaderos,
        SUM(CASE WHEN p.estadoId = 3 THEN 1 ELSE 0 END) as ocupados,
        SUM(CASE WHEN p.estadoId = 4 THEN 1 ELSE 0 END) as disponibles
      FROM parqueaderos p
      INNER JOIN tiposVehiculo tv ON p.tipoVehiculoId = tv.idTipoVehiculo
      GROUP BY tv.nombreVehiculo, tv.idTipoVehiculo
      ORDER BY tv.idTipoVehiculo
    `);

    // Ocupación diaria en el período
    const [ocupacionDiaria] = await sequelize.query(
      `
      SELECT 
        DATE(v.fechaHoraIngreso) as fecha,
        COUNT(DISTINCT v.vehiculoMatricula) as vehiculosIngresados,
        SUM(CASE WHEN ve.tipoVehiculoId = 1 THEN 1 ELSE 0 END) as carros,
        SUM(CASE WHEN ve.tipoVehiculoId = 2 THEN 1 ELSE 0 END) as motos
      FROM visitas v
      INNER JOIN vehiculo ve ON v.vehiculoMatricula = ve.matricula
      WHERE DATE(v.fechaHoraIngreso) >= ? AND DATE(v.fechaHoraIngreso) <= ?
        AND v.vehiculoMatricula IS NOT NULL
      GROUP BY DATE(v.fechaHoraIngreso)
      ORDER BY fecha DESC
    `,
      { replacements: [fechaInicio, fechaFin] }
    );

    // Pico de ocupación por hora del día
    const [picoOcupacion] = await sequelize.query(
      `
      SELECT 
        HOUR(v.fechaHoraIngreso) as hora,
        COUNT(*) as cantidadVisitas,
        SUM(CASE WHEN ve.tipoVehiculoId = 1 THEN 1 ELSE 0 END) as carros,
        SUM(CASE WHEN ve.tipoVehiculoId = 2 THEN 1 ELSE 0 END) as motos
      FROM visitas v
      LEFT JOIN vehiculo ve ON v.vehiculoMatricula = ve.matricula
      WHERE DATE(v.fechaHoraIngreso) >= ? AND DATE(v.fechaHoraIngreso) <= ?
      GROUP BY HOUR(v.fechaHoraIngreso)
      ORDER BY cantidadVisitas DESC
    `,
      { replacements: [fechaInicio, fechaFin] }
    );

    res.json({
      success: true,
      data: {
        resumenActual: porTipo,
        ocupacionDiaria: ocupacionDiaria,
        picoOcupacion: picoOcupacion,
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
};

// ============================================================================
// REPORTE DE VISITAS
// ============================================================================
export const obtenerReporteVisitas = async (req, res) => {
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
      `SELECT COUNT(*) as total FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?`,
      { replacements: [fechaInicio, fechaFin] }
    );

    // Visitas por día
    const [porDia] = await sequelize.query(
      `
      SELECT DATE(fechaHoraIngreso) as fecha, COUNT(*) as cantidad
      FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
      GROUP BY DATE(fechaHoraIngreso) ORDER BY fecha DESC
    `,
      { replacements: [fechaInicio, fechaFin] }
    );

    // Visitas con vehículo vs sin vehículo
    const [porVehiculo] = await sequelize.query(
      `
      SELECT 
        CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END as tipo,
        COUNT(*) as cantidad
      FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
      GROUP BY CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END
    `,
      { replacements: [fechaInicio, fechaFin] }
    );

    const diaConMasVisitas =
      porDia.length > 0
        ? { fecha: porDia[0].fecha, cantidad: porDia[0].cantidad }
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
};

// ============================================================================
// REPORTE DE PAQUETES
// ============================================================================
export const obtenerReportePaquetes = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    const [totalPaquetes] = await sequelize.query(
      `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ?`,
      { replacements: [fechaInicio, fechaFin] }
    );

    const [entregados] = await sequelize.query(
      `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NOT NULL`,
      { replacements: [fechaInicio, fechaFin] }
    );

    const [pendientes] = await sequelize.query(
      `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NULL`,
      { replacements: [fechaInicio, fechaFin] }
    );

    const [porDia] = await sequelize.query(
      `SELECT DATE(fechaRecepcion) as fecha, COUNT(*) as cantidad FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? GROUP BY DATE(fechaRecepcion) ORDER BY fecha DESC`,
      { replacements: [fechaInicio, fechaFin] }
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
};

// ============================================================================
// REPORTE DE RESERVAS
// ============================================================================
export const obtenerReporteReservas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    const [totalReservas] = await sequelize.query(
      `SELECT COUNT(*) as total FROM reservasareas WHERE fechaReserva >= ? AND fechaReserva <= ?`,
      { replacements: [fechaInicio, fechaFin] }
    );

    const [porArea] = await sequelize.query(
      `
      SELECT ac.nombreArea, COUNT(r.idReservas) as cantidad
      FROM reservasareas r
      INNER JOIN areacomun ac ON r.areaComunId = ac.idAreaComun
      WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
      GROUP BY ac.nombreArea, ac.idAreaComun ORDER BY cantidad DESC
    `,
      { replacements: [fechaInicio, fechaFin] }
    );

    const [porEstado] = await sequelize.query(
      `
      SELECT e.nombreEstado, COUNT(r.idReservas) as cantidad
      FROM reservasareas r
      INNER JOIN estados e ON r.estadoId = e.IdEstado
      WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
      GROUP BY e.nombreEstado, r.estadoId ORDER BY cantidad DESC
    `,
      { replacements: [fechaInicio, fechaFin] }
    );

    const [promedioAsistentes] = await sequelize.query(
      `SELECT ROUND(AVG(cantidadAsistentes), 2) as promedio FROM reservasareas WHERE fechaReserva >= ? AND fechaReserva <= ?`,
      { replacements: [fechaInicio, fechaFin] }
    );

    const [reservasPorDia] = await sequelize.query(
      `SELECT DATE(fechaReserva) as fecha, COUNT(*) as cantidad FROM reservasareas WHERE fechaReserva >= ? AND fechaReserva <= ? GROUP BY DATE(fechaReserva) ORDER BY cantidad DESC LIMIT 1`,
      { replacements: [fechaInicio, fechaFin] }
    );

    res.json({
      success: true,
      data: {
        totalReservas: totalReservas[0].total,
        porArea: porArea,
        porEstado: porEstado,
        promedioAsistentes: promedioAsistentes[0].promedio || 0,
        diaConMasReservas: reservasPorDia.length > 0 ? reservasPorDia[0] : null,
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
};

// ============================================================================
// REPORTE CONSOLIDADO
// ============================================================================
export const obtenerReporteConsolidado = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

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
      sequelize.query(
        `SELECT tv.nombreVehiculo, COUNT(p.codigoParqueadero) as cantidad FROM parqueaderos p INNER JOIN tiposVehiculo tv ON p.tipoVehiculoId = tv.idTipoVehiculo GROUP BY tv.nombreVehiculo, tv.idTipoVehiculo ORDER BY tv.idTipoVehiculo`
      ),
      sequelize.query(
        `SELECT e.nombreEstado, COUNT(p.codigoParqueadero) as cantidad FROM parqueaderos p INNER JOIN estados e ON p.estadoId = e.IdEstado WHERE p.estadoId IN (3, 4) GROUP BY e.nombreEstado, p.estadoId ORDER BY p.estadoId`
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?`,
        { replacements: [fechaInicio, fechaFin] }
      ),
      sequelize.query(
        `SELECT CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END as tipo, COUNT(*) as cantidad FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ? GROUP BY CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END`,
        { replacements: [fechaInicio, fechaFin] }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ?`,
        { replacements: [fechaInicio, fechaFin] }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NOT NULL`,
        { replacements: [fechaInicio, fechaFin] }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NULL`,
        { replacements: [fechaInicio, fechaFin] }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM reservasareas WHERE fechaReserva >= ? AND fechaReserva <= ?`,
        { replacements: [fechaInicio, fechaFin] }
      ),
      sequelize.query(
        `SELECT ac.nombreArea, COUNT(r.idReservas) as cantidad FROM reservasareas r INNER JOIN areacomun ac ON r.areaComunId = ac.idAreaComun WHERE r.fechaReserva >= ? AND r.fechaReserva <= ? GROUP BY ac.nombreArea, ac.idAreaComun ORDER BY cantidad DESC`,
        { replacements: [fechaInicio, fechaFin] }
      ),
      sequelize.query(
        `SELECT e.nombreEstado, COUNT(r.idReservas) as cantidad FROM reservasareas r INNER JOIN estados e ON r.estadoId = e.IdEstado WHERE r.fechaReserva >= ? AND r.fechaReserva <= ? GROUP BY e.nombreEstado, r.estadoId ORDER BY cantidad DESC`,
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
};

// ============================================================================
// REPORTE DE RESIDENTES - APARTAMENTOS Y TORRES MÁS HABITADAS
// ============================================================================
export const obtenerReporteOcupacion = async (req, res) => {
  try {
    // Resumen general de ocupación
    const [resumenGeneral] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT a.idApartamento) as totalApartamentos,
        COUNT(DISTINCT CASE WHEN o.estadoId = 5 THEN a.idApartamento END) as apartamentosOcupados,
        COUNT(DISTINCT a.idApartamento) - COUNT(DISTINCT CASE WHEN o.estadoId = 5 THEN a.idApartamento END) as apartamentosVacios,
        COUNT(CASE WHEN o.estadoId = 5 THEN o.idOcupante END) as totalOcupantes,
        COALESCE(SUM(CASE WHEN o.estadoId = 5 THEN o.personasACargo ELSE 0 END), 0) as totalPersonasACargo,
        (COUNT(CASE WHEN o.estadoId = 5 THEN o.idOcupante END) + COALESCE(SUM(CASE WHEN o.estadoId = 5 THEN o.personasACargo ELSE 0 END), 0)) as totalResidentes,
        ROUND(
          (COUNT(DISTINCT CASE WHEN o.estadoId = 5 THEN a.idApartamento END) * 100.0) / 
          NULLIF(COUNT(DISTINCT a.idApartamento), 0), 2
        ) as porcentajeOcupacion
      FROM apartamentos a
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
    `);

    // Apartamentos más habitados
    const [apartamentosMasHabitados] = await sequelize.query(`
      SELECT 
        t.nombreTorre,
        a.numeroApartamento,
        COUNT(o.idOcupante) as totalOcupantes,
        COALESCE(SUM(o.personasACargo), 0) as totalPersonasACargo,
        (COUNT(o.idOcupante) + COALESCE(SUM(o.personasACargo), 0)) as totalPersonas
      FROM ocupante o
      INNER JOIN apartamentos a ON o.apartamentosId = a.idApartamento
      INNER JOIN torres t ON a.torresId = t.idTorre
      WHERE o.estadoId = 5
      GROUP BY a.idApartamento, t.nombreTorre, a.numeroApartamento
      HAVING totalPersonas > 0
      ORDER BY totalPersonas DESC
      LIMIT 10
    `);

    // Torres más habitadas
    const [torresMasHabitadas] = await sequelize.query(`
      SELECT 
        t.idTorre,
        t.nombreTorre,
        COUNT(DISTINCT a.idApartamento) as totalApartamentos,
        COUNT(DISTINCT CASE WHEN o.estadoId = 5 THEN a.idApartamento END) as apartamentosOcupados,
        COUNT(CASE WHEN o.estadoId = 5 THEN o.idOcupante END) as totalOcupantes,
        COALESCE(SUM(CASE WHEN o.estadoId = 5 THEN o.personasACargo ELSE 0 END), 0) as totalPersonasACargo,
        (COUNT(CASE WHEN o.estadoId = 5 THEN o.idOcupante END) + COALESCE(SUM(CASE WHEN o.estadoId = 5 THEN o.personasACargo ELSE 0 END), 0)) as totalPersonas,
        ROUND(
          (COUNT(CASE WHEN o.estadoId = 5 THEN o.idOcupante END) + COALESCE(SUM(CASE WHEN o.estadoId = 5 THEN o.personasACargo ELSE 0 END), 0)) / 
          NULLIF(COUNT(DISTINCT a.idApartamento), 0), 2
        ) as promedioPersonasPorApto
      FROM torres t
      INNER JOIN apartamentos a ON t.idTorre = a.torresId
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
      GROUP BY t.idTorre, t.nombreTorre
      ORDER BY totalPersonas DESC
    `);

    res.json({
      success: true,
      data: {
        // Resumen principal para las tarjetas
        totalApartamentos: parseInt(resumenGeneral[0]?.totalApartamentos) || 0,
        apartamentosOcupados:
          parseInt(resumenGeneral[0]?.apartamentosOcupados) || 0,
        apartamentosVacios:
          parseInt(resumenGeneral[0]?.apartamentosVacios) || 0,
        totalResidentes: parseInt(resumenGeneral[0]?.totalResidentes) || 0,
        porcentajeOcupacion:
          parseFloat(resumenGeneral[0]?.porcentajeOcupacion) || 0,
        // Detalle por torre
        detallePorTorre: torresMasHabitadas.map((t) => ({
          ...t,
          totalApartamentos: parseInt(t.totalApartamentos) || 0,
          apartamentosOcupados: parseInt(t.apartamentosOcupados) || 0,
          totalOcupantes: parseInt(t.totalOcupantes) || 0,
          totalPersonas: parseInt(t.totalPersonas) || 0,
          promedioPersonasPorApto: parseFloat(t.promedioPersonasPorApto) || 0,
        })),
        apartamentosMasHabitados: apartamentosMasHabitados.map((a) => ({
          ...a,
          totalOcupantes: parseInt(a.totalOcupantes) || 0,
          totalPersonas: parseInt(a.totalPersonas) || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error en reporte de ocupación:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de ocupación",
      error: error.message,
    });
  }
};

// ============================================================================
// REPORTE DE RESIDENTES - TORRES CON MÁS NIÑOS
// ============================================================================
export const obtenerReporteNinos = async (req, res) => {
  try {
    // Resumen total de niños
    const [resumenNinos] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN o.tieneNinos = 1 AND o.estadoId = 5 THEN a.idApartamento END) as totalApartamentosConNinos,
        COUNT(CASE WHEN o.tieneNinos = 1 AND o.estadoId = 5 THEN o.idOcupante END) as totalOcupantesConNinos
      FROM apartamentos a
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
    `);

    const [torresConNinos] = await sequelize.query(`
      SELECT 
        t.idTorre,
        t.nombreTorre,
        COUNT(DISTINCT a.idApartamento) as totalApartamentos,
        COUNT(DISTINCT CASE WHEN o.tieneNinos = 1 AND o.estadoId = 5 THEN a.idApartamento END) as apartamentosConNinos,
        ROUND(
          (COUNT(DISTINCT CASE WHEN o.tieneNinos = 1 AND o.estadoId = 5 THEN a.idApartamento END) * 100.0) / 
          NULLIF(COUNT(DISTINCT a.idApartamento), 0), 2
        ) as porcentajeConNinos
      FROM torres t
      INNER JOIN apartamentos a ON t.idTorre = a.torresId
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
      GROUP BY t.idTorre, t.nombreTorre
      ORDER BY apartamentosConNinos DESC
    `);

    // Detalle de apartamentos con niños por torre
    const [detalleApartamentos] = await sequelize.query(`
      SELECT 
        t.nombreTorre,
        a.numeroApartamento,
        COUNT(o.idOcupante) as ocupantesConNinos,
        GROUP_CONCAT(CONCAT(p.primerNombre, ' ', p.primerApellido) SEPARATOR ', ') as nombreOcupantes
      FROM ocupante o
      INNER JOIN apartamentos a ON o.apartamentosId = a.idApartamento
      INNER JOIN torres t ON a.torresId = t.idTorre
      INNER JOIN personas p ON o.numeroDocumento = p.numeroDocumento
      WHERE o.estadoId = 5 AND o.tieneNinos = 1
      GROUP BY t.nombreTorre, a.numeroApartamento
      ORDER BY t.nombreTorre, a.numeroApartamento
    `);

    res.json({
      success: true,
      data: {
        totalNinos: parseInt(resumenNinos[0]?.totalOcupantesConNinos) || 0,
        totalApartamentosConNinos:
          parseInt(resumenNinos[0]?.totalApartamentosConNinos) || 0,
        resumenPorTorre: torresConNinos.map((t) => ({
          ...t,
          totalApartamentos: parseInt(t.totalApartamentos) || 0,
          apartamentosConNinos: parseInt(t.apartamentosConNinos) || 0,
          porcentajeConNinos: parseFloat(t.porcentajeConNinos) || 0,
        })),
        detalleApartamentos: detalleApartamentos,
      },
    });
  } catch (error) {
    console.error("Error en reporte de niños:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de niños",
      error: error.message,
    });
  }
};

// ============================================================================
// REPORTE DE RESIDENTES - TORRES CON ADULTOS MAYORES Y DISCAPACIDAD
// ============================================================================
export const obtenerReportePoblacionEspecial = async (req, res) => {
  try {
    // Resumen total de población especial
    const [resumenTotal] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN o.tieneAdultoMayor = 1 AND o.estadoId = 5 THEN a.idApartamento END) as totalApartamentosAdultosMayores,
        COUNT(CASE WHEN o.tieneAdultoMayor = 1 AND o.estadoId = 5 THEN o.idOcupante END) as totalAdultosMayores,
        COUNT(DISTINCT CASE WHEN o.tieneDiscapacidad = 1 AND o.estadoId = 5 THEN a.idApartamento END) as totalApartamentosDiscapacidad,
        COUNT(CASE WHEN o.tieneDiscapacidad = 1 AND o.estadoId = 5 THEN o.idOcupante END) as totalDiscapacidad
      FROM apartamentos a
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
    `);

    // Torres con adultos mayores
    const [torresConAdultosMayores] = await sequelize.query(`
      SELECT 
        t.idTorre,
        t.nombreTorre,
        COUNT(DISTINCT a.idApartamento) as totalApartamentos,
        COUNT(DISTINCT CASE WHEN o.tieneAdultoMayor = 1 AND o.estadoId = 5 THEN a.idApartamento END) as apartamentosConAdultosMayores,
        ROUND(
          (COUNT(DISTINCT CASE WHEN o.tieneAdultoMayor = 1 AND o.estadoId = 5 THEN a.idApartamento END) * 100.0) / 
          NULLIF(COUNT(DISTINCT a.idApartamento), 0), 2
        ) as porcentajeConAdultosMayores
      FROM torres t
      INNER JOIN apartamentos a ON t.idTorre = a.torresId
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
      GROUP BY t.idTorre, t.nombreTorre
      ORDER BY apartamentosConAdultosMayores DESC
    `);

    // Torres con personas con discapacidad
    const [torresConDiscapacidad] = await sequelize.query(`
      SELECT 
        t.idTorre,
        t.nombreTorre,
        COUNT(DISTINCT a.idApartamento) as totalApartamentos,
        COUNT(DISTINCT CASE WHEN o.tieneDiscapacidad = 1 AND o.estadoId = 5 THEN a.idApartamento END) as apartamentosConDiscapacidad,
        ROUND(
          (COUNT(DISTINCT CASE WHEN o.tieneDiscapacidad = 1 AND o.estadoId = 5 THEN a.idApartamento END) * 100.0) / 
          NULLIF(COUNT(DISTINCT a.idApartamento), 0), 2
        ) as porcentajeConDiscapacidad
      FROM torres t
      INNER JOIN apartamentos a ON t.idTorre = a.torresId
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
      GROUP BY t.idTorre, t.nombreTorre
      ORDER BY apartamentosConDiscapacidad DESC
    `);

    // Resumen combinado
    const [resumenCombinado] = await sequelize.query(`
      SELECT 
        t.idTorre,
        t.nombreTorre,
        COUNT(DISTINCT a.idApartamento) as totalApartamentos,
        COUNT(DISTINCT CASE WHEN o.tieneAdultoMayor = 1 AND o.estadoId = 5 THEN a.idApartamento END) as conAdultosMayores,
        COUNT(DISTINCT CASE WHEN o.tieneDiscapacidad = 1 AND o.estadoId = 5 THEN a.idApartamento END) as conDiscapacidad,
        COUNT(DISTINCT CASE WHEN (o.tieneAdultoMayor = 1 OR o.tieneDiscapacidad = 1) AND o.estadoId = 5 THEN a.idApartamento END) as conPoblacionEspecial,
        ROUND(
          (COUNT(DISTINCT CASE WHEN (o.tieneAdultoMayor = 1 OR o.tieneDiscapacidad = 1) AND o.estadoId = 5 THEN a.idApartamento END) * 100.0) / 
          NULLIF(COUNT(DISTINCT a.idApartamento), 0), 2
        ) as porcentajePoblacionEspecial
      FROM torres t
      INNER JOIN apartamentos a ON t.idTorre = a.torresId
      LEFT JOIN ocupante o ON a.idApartamento = o.apartamentosId
      GROUP BY t.idTorre, t.nombreTorre
      ORDER BY conPoblacionEspecial DESC
    `);

    // Detalle de apartamentos con población especial
    const [detalleApartamentos] = await sequelize.query(`
      SELECT 
        t.nombreTorre,
        a.numeroApartamento,
        CASE 
          WHEN o.tieneAdultoMayor = 1 AND o.tieneDiscapacidad = 1 THEN 'Adulto Mayor y Discapacidad'
          WHEN o.tieneAdultoMayor = 1 THEN 'Adulto Mayor'
          WHEN o.tieneDiscapacidad = 1 THEN 'Discapacidad'
          ELSE 'Ninguno'
        END as tipoPoblacion,
        GROUP_CONCAT(CONCAT(p.primerNombre, ' ', p.primerApellido) SEPARATOR ', ') as nombreOcupantes
      FROM ocupante o
      INNER JOIN apartamentos a ON o.apartamentosId = a.idApartamento
      INNER JOIN torres t ON a.torresId = t.idTorre
      INNER JOIN personas p ON o.numeroDocumento = p.numeroDocumento
      WHERE o.estadoId = 5 AND (o.tieneAdultoMayor = 1 OR o.tieneDiscapacidad = 1)
      GROUP BY t.nombreTorre, a.numeroApartamento, o.tieneAdultoMayor, o.tieneDiscapacidad
      ORDER BY t.nombreTorre, a.numeroApartamento
    `);

    res.json({
      success: true,
      data: {
        totalAdultosMayores:
          parseInt(resumenTotal[0]?.totalAdultosMayores) || 0,
        totalDiscapacidad: parseInt(resumenTotal[0]?.totalDiscapacidad) || 0,
        adultosMayores: torresConAdultosMayores.map((t) => ({
          ...t,
          totalApartamentos: parseInt(t.totalApartamentos) || 0,
          apartamentosConAdultosMayores:
            parseInt(t.apartamentosConAdultosMayores) || 0,
          porcentajeConAdultosMayores:
            parseFloat(t.porcentajeConAdultosMayores) || 0,
        })),
        discapacidad: torresConDiscapacidad.map((t) => ({
          ...t,
          totalApartamentos: parseInt(t.totalApartamentos) || 0,
          apartamentosConDiscapacidad:
            parseInt(t.apartamentosConDiscapacidad) || 0,
          porcentajeConDiscapacidad:
            parseFloat(t.porcentajeConDiscapacidad) || 0,
        })),
        resumenCombinado: resumenCombinado.map((t) => ({
          ...t,
          totalApartamentos: parseInt(t.totalApartamentos) || 0,
          conAdultosMayores: parseInt(t.conAdultosMayores) || 0,
          conDiscapacidad: parseInt(t.conDiscapacidad) || 0,
          conPoblacionEspecial: parseInt(t.conPoblacionEspecial) || 0,
          porcentajePoblacionEspecial:
            parseFloat(t.porcentajePoblacionEspecial) || 0,
        })),
        detalleApartamentos: detalleApartamentos,
      },
    });
  } catch (error) {
    console.error("Error en reporte de población especial:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de población especial",
      error: error.message,
    });
  }
};
