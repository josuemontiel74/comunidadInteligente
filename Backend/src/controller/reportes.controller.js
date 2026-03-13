import { sequelize } from "../config/connect.db.js";

export const obtenerReporteParqueaderos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    // Capacidad total de parqueaderos por tipo de vehÃ­culo (dato estÃ¡tico)
    const [capacidad] = await sequelize.query(`
      SELECT 
        tv.nombreVehiculo,
        COUNT(p.codigoParqueadero) as totalCupos
      FROM parqueaderos p
      INNER JOIN tiposvehiculo tv ON p.tipoVehiculoId = tv.idTipoVehiculo
      GROUP BY tv.nombreVehiculo, tv.idTipoVehiculo
      ORDER BY tv.idTipoVehiculo
    `);

    // Resumen de vehÃ­culos que ingresaron en el perÃ­odo (datos histÃ³ricos)
    const [resumenPeriodoRaw] = await sequelize.query(
      `
      SELECT 
        COUNT(DISTINCT v.vehiculoMatricula) as totalVehiculos,
        SUM(CASE WHEN ve.tipoVehiculoId = 1 THEN 1 ELSE 0 END) as carros,
        SUM(CASE WHEN ve.tipoVehiculoId = 2 THEN 1 ELSE 0 END) as motos
      FROM visitas v
      INNER JOIN vehiculo ve ON v.vehiculoMatricula = ve.matricula
      WHERE DATE(v.fechaHoraIngreso) >= ? AND DATE(v.fechaHoraIngreso) <= ?
        AND v.vehiculoMatricula IS NOT NULL
    `,
      { replacements: [fechaInicio, fechaFin] },
    );

    // DÃ­a pico: fecha con mÃ¡s vehÃ­culos ingresados en el perÃ­odo
    const [diaPicoRaw] = await sequelize.query(
      `
      SELECT 
        DATE(v.fechaHoraIngreso) as fecha,
        COUNT(DISTINCT v.vehiculoMatricula) as totalVehiculos,
        SUM(CASE WHEN ve.tipoVehiculoId = 1 THEN 1 ELSE 0 END) as carros,
        SUM(CASE WHEN ve.tipoVehiculoId = 2 THEN 1 ELSE 0 END) as motos
      FROM visitas v
      INNER JOIN vehiculo ve ON v.vehiculoMatricula = ve.matricula
      WHERE DATE(v.fechaHoraIngreso) >= ? AND DATE(v.fechaHoraIngreso) <= ?
        AND v.vehiculoMatricula IS NOT NULL
      GROUP BY DATE(v.fechaHoraIngreso)
      ORDER BY totalVehiculos DESC
      LIMIT 1
    `,
      { replacements: [fechaInicio, fechaFin] },
    );

    // Uso diario en el perÃ­odo (para grÃ¡fica de lÃ­nea/barra)
    const [usoDiario] = await sequelize.query(
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
      ORDER BY fecha ASC
    `,
      { replacements: [fechaInicio, fechaFin] },
    );

    // Pico de ocupaciÃ³n por hora del dÃ­a
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
      { replacements: [fechaInicio, fechaFin] },
    );

    res.json({
      success: true,
      data: {
        capacidad: capacidad,
        resumenPeriodo: resumenPeriodoRaw[0] || {
          totalVehiculos: 0,
          carros: 0,
          motos: 0,
        },
        diaPico: diaPicoRaw[0] || null,
        usoDiario: usoDiario,
        picoOcupacion: picoOcupacion,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de parqueaderos",
      error: error.message,
    });
  }
};

export const obtenerReporteVisitas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    // Total de visitas en el perÃ­odo
    const [totalVisitas] = await sequelize.query(
      `SELECT COUNT(*) as total FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?`,
      { replacements: [fechaInicio, fechaFin] },
    );

    // Visitas por dÃ­a
    const [porDia] = await sequelize.query(
      `
      SELECT DATE(fechaHoraIngreso) as fecha, COUNT(*) as cantidad
      FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?
      GROUP BY DATE(fechaHoraIngreso) ORDER BY fecha DESC
    `,
      { replacements: [fechaInicio, fechaFin] },
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
      { replacements: [fechaInicio, fechaFin] },
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
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de visitas",
      error: error.message,
    });
  }
};

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
      { replacements: [fechaInicio, fechaFin] },
    );

    const [entregados] = await sequelize.query(
      `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NOT NULL`,
      { replacements: [fechaInicio, fechaFin] },
    );

    const [pendientes] = await sequelize.query(
      `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NULL`,
      { replacements: [fechaInicio, fechaFin] },
    );

    const [porDia] = await sequelize.query(
      `SELECT DATE(fechaRecepcion) as fecha, COUNT(*) as cantidad FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? GROUP BY DATE(fechaRecepcion) ORDER BY fecha DESC`,
      { replacements: [fechaInicio, fechaFin] },
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
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de paquetes",
      error: error.message,
    });
  }
};

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
      { replacements: [fechaInicio, fechaFin] },
    );

    const [porArea] = await sequelize.query(
      `
      SELECT ac.nombreArea, COUNT(r.idReservas) as cantidad
      FROM reservasareas r
      INNER JOIN areacomun ac ON r.areacomunId = ac.idAreaComun
      WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
      GROUP BY ac.nombreArea, ac.idAreaComun ORDER BY cantidad DESC
    `,
      { replacements: [fechaInicio, fechaFin] },
    );

    const [porEstado] = await sequelize.query(
      `
      SELECT e.nombreEstado, COUNT(r.idReservas) as cantidad
      FROM reservasareas r
      INNER JOIN estados e ON r.estadoId = e.IdEstado
      WHERE r.fechaReserva >= ? AND r.fechaReserva <= ?
      GROUP BY e.nombreEstado, r.estadoId ORDER BY cantidad DESC
    `,
      { replacements: [fechaInicio, fechaFin] },
    );

    const [promedioAsistentes] = await sequelize.query(
      `SELECT ROUND(AVG(cantidadAsistentes), 2) as promedio FROM reservasareas WHERE fechaReserva >= ? AND fechaReserva <= ?`,
      { replacements: [fechaInicio, fechaFin] },
    );

    const [reservasPorDia] = await sequelize.query(
      `SELECT DATE(fechaReserva) as fecha, COUNT(*) as cantidad FROM reservasareas WHERE fechaReserva >= ? AND fechaReserva <= ? GROUP BY DATE(fechaReserva) ORDER BY cantidad DESC LIMIT 1`,
      { replacements: [fechaInicio, fechaFin] },
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
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de reservas",
      error: error.message,
    });
  }
};

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
        `SELECT tv.nombreVehiculo, COUNT(p.codigoParqueadero) as cantidad FROM parqueaderos p INNER JOIN tiposvehiculo tv ON p.tipoVehiculoId = tv.idTipoVehiculo GROUP BY tv.nombreVehiculo, tv.idTipoVehiculo ORDER BY tv.idTipoVehiculo`,
      ),
      sequelize.query(
        `SELECT e.nombreEstado, COUNT(p.codigoParqueadero) as cantidad FROM parqueaderos p INNER JOIN estados e ON p.estadoId = e.IdEstado WHERE p.estadoId IN (3, 4) GROUP BY e.nombreEstado, p.estadoId ORDER BY p.estadoId`,
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ?`,
        { replacements: [fechaInicio, fechaFin] },
      ),
      sequelize.query(
        `SELECT CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END as tipo, COUNT(*) as cantidad FROM visitas WHERE DATE(fechaHoraIngreso) >= ? AND DATE(fechaHoraIngreso) <= ? GROUP BY CASE WHEN vehiculoMatricula IS NOT NULL THEN 'Con vehículo' ELSE 'Sin vehículo' END`,
        { replacements: [fechaInicio, fechaFin] },
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ?`,
        { replacements: [fechaInicio, fechaFin] },
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NOT NULL`,
        { replacements: [fechaInicio, fechaFin] },
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM recepcionpaquetes WHERE DATE(fechaRecepcion) >= ? AND DATE(fechaRecepcion) <= ? AND fechaEntrega IS NULL`,
        { replacements: [fechaInicio, fechaFin] },
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM reservasareas WHERE fechaReserva >= ? AND fechaReserva <= ?`,
        { replacements: [fechaInicio, fechaFin] },
      ),
      sequelize.query(
        `SELECT ac.nombreArea, COUNT(r.idReservas) as cantidad FROM reservasareas r INNER JOIN areacomun ac ON r.areacomunId = ac.idAreaComun WHERE r.fechaReserva >= ? AND r.fechaReserva <= ? GROUP BY ac.nombreArea, ac.idAreaComun ORDER BY cantidad DESC`,
        { replacements: [fechaInicio, fechaFin] },
      ),
      sequelize.query(
        `SELECT e.nombreEstado, COUNT(r.idReservas) as cantidad FROM reservasareas r INNER JOIN estados e ON r.estadoId = e.IdEstado WHERE r.fechaReserva >= ? AND r.fechaReserva <= ? GROUP BY e.nombreEstado, r.estadoId ORDER BY cantidad DESC`,
        { replacements: [fechaInicio, fechaFin] },
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
    res.status(500).json({
      success: false,
      message: "Error al generar reporte consolidado",
      error: error.message,
    });
  }
};

export const obtenerReporteOcupacion = async (req, res) => {
  try {
    // Resumen general de ocupaciÃ³n
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

    // Apartamentos mÃ¡s habitados
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

    // Torres mÃ¡s habitadas
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
        totalApartamentos:
          Number.parseInt(resumenGeneral[0]?.totalApartamentos, 10) || 0,
        apartamentosOcupados:
          Number.parseInt(resumenGeneral[0]?.apartamentosOcupados, 10) || 0,
        apartamentosVacios:
          Number.parseInt(resumenGeneral[0]?.apartamentosVacios, 10) || 0,
        totalResidentes:
          Number.parseInt(resumenGeneral[0]?.totalResidentes, 10) || 0,
        porcentajeOcupacion:
          Number.parseFloat(resumenGeneral[0]?.porcentajeOcupacion) || 0,
        // Detalle por torre
        detallePorTorre: torresMasHabitadas.map((t) => ({
          ...t,
          totalApartamentos: Number.parseInt(t.totalApartamentos, 10) || 0,
          apartamentosOcupados:
            Number.parseInt(t.apartamentosOcupados, 10) || 0,
          totalOcupantes: Number.parseInt(t.totalOcupantes, 10) || 0,
          totalPersonas: Number.parseInt(t.totalPersonas, 10) || 0,
          promedioPersonasPorApto:
            Number.parseFloat(t.promedioPersonasPorApto) || 0,
        })),
        apartamentosMasHabitados: apartamentosMasHabitados.map((a) => ({
          ...a,
          totalOcupantes: Number.parseInt(a.totalOcupantes, 10) || 0,
          totalPersonas: Number.parseInt(a.totalPersonas, 10) || 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de ocupación",
      error: error.message,
    });
  }
};

export const obtenerReporteNinos = async (req, res) => {
  try {
    // Resumen total de niÃ±os
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

    // Detalle de apartamentos con niÃ±os por torre
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
        totalNinos:
          Number.parseInt(resumenNinos[0]?.totalOcupantesConNinos, 10) || 0,
        totalApartamentosConNinos:
          Number.parseInt(resumenNinos[0]?.totalApartamentosConNinos, 10) || 0,
        resumenPorTorre: torresConNinos.map((t) => ({
          ...t,
          totalApartamentos: Number.parseInt(t.totalApartamentos, 10) || 0,
          apartamentosConNinos:
            Number.parseInt(t.apartamentosConNinos, 10) || 0,
          porcentajeConNinos: Number.parseFloat(t.porcentajeConNinos) || 0,
        })),
        detalleApartamentos: detalleApartamentos,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de niños",
      error: error.message,
    });
  }
};

export const obtenerReportePoblacionEspecial = async (req, res) => {
  try {
    // Resumen total de poblaciÃ³n especial
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

    // Detalle de apartamentos con poblaciÃ³n especial
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
          Number.parseInt(resumenTotal[0]?.totalAdultosMayores, 10) || 0,
        totalDiscapacidad:
          Number.parseInt(resumenTotal[0]?.totalDiscapacidad, 10) || 0,
        adultosMayores: torresConAdultosMayores.map((t) => ({
          ...t,
          totalApartamentos: Number.parseInt(t.totalApartamentos, 10) || 0,
          apartamentosConAdultosMayores:
            Number.parseInt(t.apartamentosConAdultosMayores, 10) || 0,
          porcentajeConAdultosMayores:
            Number.parseFloat(t.porcentajeConAdultosMayores) || 0,
        })),
        discapacidad: torresConDiscapacidad.map((t) => ({
          ...t,
          totalApartamentos: Number.parseInt(t.totalApartamentos, 10) || 0,
          apartamentosConDiscapacidad:
            Number.parseInt(t.apartamentosConDiscapacidad, 10) || 0,
          porcentajeConDiscapacidad:
            Number.parseFloat(t.porcentajeConDiscapacidad) || 0,
        })),
        resumenCombinado: resumenCombinado.map((t) => ({
          ...t,
          totalApartamentos: Number.parseInt(t.totalApartamentos, 10) || 0,
          conAdultosMayores: Number.parseInt(t.conAdultosMayores, 10) || 0,
          conDiscapacidad: Number.parseInt(t.conDiscapacidad, 10) || 0,
          conPoblacionEspecial:
            Number.parseInt(t.conPoblacionEspecial, 10) || 0,
          porcentajePoblacionEspecial:
            Number.parseFloat(t.porcentajePoblacionEspecial) || 0,
        })),
        detalleApartamentos: detalleApartamentos,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de población especial",
      error: error.message,
    });
  }
};

export const obtenerReporteUsuarios = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaInicio y fechaFin",
      });
    }

    // Usuarios mÃ¡s activos en el perÃ­odo con su rol y estado real
    // estadoId = 1 â†’ Activo | estadoId = 2 â†’ Inactivo
    const [masActivos] = await sequelize.query(
      `
      SELECT
        u.username,
        r.nombreRol,
        e.nombreEstado,
        u.ultimaActividad,
        COUNT(a.idAuditoria) as totalRegistros,
        MAX(a.fechaHoraAuditoria) as ultimoRegistro
      FROM usuarios u
      LEFT JOIN auditorias a ON u.username = a.username
        AND DATE(a.fechaHoraAuditoria) >= ? AND DATE(a.fechaHoraAuditoria) <= ?
      LEFT JOIN roles r ON u.rolesId = r.idRol
      LEFT JOIN estados e ON u.estadoId = e.IdEstado
      GROUP BY u.username, r.nombreRol, e.nombreEstado, u.ultimaActividad
      ORDER BY totalRegistros DESC
      LIMIT 10
      `,
      { replacements: [fechaInicio, fechaFin] },
    );

    // Usuarios con mayor tiempo sin ingresar al sistema
    const [masInactivos] = await sequelize.query(
      `
      SELECT
        u.username,
        r.nombreRol,
        e.nombreEstado,
        u.ultimaActividad,
        CASE
          WHEN u.ultimaActividad IS NULL THEN 9999
          ELSE DATEDIFF(NOW(), u.ultimaActividad)
        END as diasSinActividad
      FROM usuarios u
      LEFT JOIN roles r ON u.rolesId = r.idRol
      LEFT JOIN estados e ON u.estadoId = e.IdEstado
      ORDER BY diasSinActividad DESC
      LIMIT 10
      `,
    );

    // MÃ³dulos mÃ¡s utilizados en el perÃ­odo (agrupado por tabla â†’ nombre amigable)
    const [modulosMasUsados] = await sequelize.query(
      `
      SELECT tablaAfectada, COUNT(*) as cantidad
      FROM auditorias
      WHERE DATE(fechaHoraAuditoria) >= ? AND DATE(fechaHoraAuditoria) <= ?
      GROUP BY tablaAfectada
      ORDER BY cantidad DESC
      LIMIT 8
      `,
      { replacements: [fechaInicio, fechaFin] },
    );

    // Actividad diaria en el perÃ­odo (para grÃ¡fica)
    const [actividadDiaria] = await sequelize.query(
      `
      SELECT
        DATE(fechaHoraAuditoria) as fecha,
        COUNT(*) as registros,
        COUNT(DISTINCT username) as usuariosActivos
      FROM auditorias
      WHERE DATE(fechaHoraAuditoria) >= ? AND DATE(fechaHoraAuditoria) <= ?
      GROUP BY DATE(fechaHoraAuditoria)
      ORDER BY fecha ASC
      `,
      { replacements: [fechaInicio, fechaFin] },
    );

    // Usuarios que ingresaron hoy al sistema
    const [hoy] = await sequelize.query(
      `
      SELECT COUNT(*) as registros, COUNT(DISTINCT username) as usuarios
      FROM auditorias
      WHERE DATE(fechaHoraAuditoria) = CURDATE()
      `,
    );

    // Total registros en el perÃ­odo
    const [totalPeriodo] = await sequelize.query(
      `SELECT COUNT(*) as total FROM auditorias WHERE DATE(fechaHoraAuditoria) >= ? AND DATE(fechaHoraAuditoria) <= ?`,
      { replacements: [fechaInicio, fechaFin] },
    );

    // Mapa de nombres amigables para los mÃ³dulos
    const nombreModulo = {
      visitas: "Visitas",
      recepcionpaquetes: "Paquetería",
      reservasareas: "Reservas Áreas",
      parqueaderos: "Parqueaderos",
      usuarios: "Gestión Usuarios",
      apartamentos: "Apartamentos",
      ocupante: "Residentes",
      areacomun: "Áreas Comunes",
      vehiculo: "Vehículos",
      personas: "Personas",
      torres: "Torres",
    };

    res.json({
      success: true,
      data: {
        masActivos: masActivos.map((u) => ({
          ...u,
          totalRegistros: Number.parseInt(u.totalRegistros, 10) || 0,
        })),
        masInactivos: masInactivos.map((u) => ({
          ...u,
          diasSinActividad:
            Number.parseInt(u.diasSinActividad, 10) === 9999
              ? null
              : Number.parseInt(u.diasSinActividad, 10),
        })),
        modulosMasUsados: modulosMasUsados.map((m) => ({
          tabla: m.tablaAfectada,
          nombre:
            nombreModulo[(m.tablaAfectada || "").toLowerCase()] ||
            m.tablaAfectada,
          cantidad: Number.parseInt(m.cantidad, 10) || 0,
        })),
        actividadDiaria: actividadDiaria.map((d) => ({
          ...d,
          registros: Number.parseInt(d.registros, 10) || 0,
          usuariosActivos: Number.parseInt(d.usuariosActivos, 10) || 0,
        })),
        registrosHoy: Number.parseInt(hoy[0]?.registros, 10) || 0,
        usuariosActivosHoy: Number.parseInt(hoy[0]?.usuarios, 10) || 0,
        totalRegistrosPeriodo: Number.parseInt(totalPeriodo[0]?.total, 10) || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar reporte de usuarios",
      error: error.message,
    });
  }
};
