import { Sequelize, Op } from "sequelize";
import Parqueadero from "../models/parqueaderos.model.js";
import Vehiculo from "../models/vehiculo.model.js";
import RecepcionPaquetes from "../models/recepcionPaquetes.model.js";
import ReservarAreas from "../models/reservasAreas.model.js";
import Visitas from "../models/visitas.model.js";

/**
 * Obtiene estadísticas de ocupación de parqueaderos
 * Calcula el porcentaje de parqueaderos ocupados por residentes y visitantes
 */
export const getEstadisticasParqueaderos = async (req, res) => {
  try {
    // Total de parqueaderos
    const totalParqueaderos = await Parqueadero.count();

    // Parqueaderos ocupados por residentes (tienen vehículo asignado)
    const parqueaderosConVehiculo = await Vehiculo.count();

    // Parqueaderos ocupados por visitantes (visitas activas con vehículo)
    const parqueaderosVisitantes = await Visitas.count({
      where: {
        vehiculoMatricula: {
          [Op.ne]: null,
        },
        fechaHoraSalida: null, // Solo visitas activas (no han salido)
      },
    });

    // Parqueaderos disponibles
    const parqueaderosDisponibles =
      totalParqueaderos - parqueaderosConVehiculo - parqueaderosVisitantes;

    // Calcular porcentajes
    const porcentajeResidentes =
      totalParqueaderos > 0
        ? ((parqueaderosConVehiculo / totalParqueaderos) * 100).toFixed(2)
        : 0;

    const porcentajeVisitantes =
      totalParqueaderos > 0
        ? ((parqueaderosVisitantes / totalParqueaderos) * 100).toFixed(2)
        : 0;

    const porcentajeDisponibles =
      totalParqueaderos > 0
        ? ((parqueaderosDisponibles / totalParqueaderos) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalParqueaderos,
        ocupadosResidentes: parqueaderosConVehiculo,
        ocupadosVisitantes: parqueaderosVisitantes,
        disponibles: parqueaderosDisponibles,
        porcentajes: {
          residentes: parseFloat(porcentajeResidentes),
          visitantes: parseFloat(porcentajeVisitantes),
          disponibles: parseFloat(porcentajeDisponibles),
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de parqueaderos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de parqueaderos",
      error: error.message,
    });
  }
};

/**
 * Obtiene la cantidad de paquetes recibidos en el día actual
 */
export const getPaquetesRecibidosHoy = async (req, res) => {
  try {
    // Obtener fecha actual (inicio y fin del día)
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);

    const finDelDia = new Date();
    finDelDia.setHours(23, 59, 59, 999);

    // Contar paquetes recibidos hoy
    const paquetesRecibidos = await RecepcionPaquetes.count({
      where: {
        fechaRecepcion: {
          [Op.between]: [inicioDelDia, finDelDia],
        },
      },
    });

    // Contar paquetes entregados hoy
    const paquetesEntregados = await RecepcionPaquetes.count({
      where: {
        fechaRecepcion: {
          [Op.between]: [inicioDelDia, finDelDia],
        },
        fechaEntrega: {
          [Op.ne]: null,
        },
      },
    });

    // Paquetes pendientes de entrega (recibidos hoy)
    const paquetesPendientes = paquetesRecibidos - paquetesEntregados;

    res.status(200).json({
      success: true,
      data: {
        fecha: new Date().toISOString().split("T")[0],
        recibidos: paquetesRecibidos,
        entregados: paquetesEntregados,
        pendientes: paquetesPendientes,
      },
    });
  } catch (error) {
    console.error("Error al obtener paquetes recibidos hoy:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener paquetes recibidos hoy",
      error: error.message,
    });
  }
};

/**
 * Obtiene la cantidad de reservas de áreas comunes hechas para el día actual
 */
export const getReservasHoy = async (req, res) => {
  try {
    // Obtener fecha actual (inicio y fin del día)
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);

    const finDelDia = new Date();
    finDelDia.setHours(23, 59, 59, 999);

    // Contar reservas para hoy
    const reservasHoy = await ReservarAreas.count({
      where: {
        fechaReserva: {
          [Op.between]: [inicioDelDia, finDelDia],
        },
      },
    });

    // Obtener detalle por área común si es necesario
    const reservasPorArea = await ReservarAreas.findAll({
      attributes: [
        "areaComunId",
        [Sequelize.fn("COUNT", Sequelize.col("idReservas")), "cantidad"],
      ],
      where: {
        fechaReserva: {
          [Op.between]: [inicioDelDia, finDelDia],
        },
      },
      group: ["areaComunId"],
    });

    res.status(200).json({
      success: true,
      data: {
        fecha: new Date().toISOString().split("T")[0],
        totalReservas: reservasHoy,
        reservasPorArea: reservasPorArea.map((r) => ({
          areaComunId: r.areaComunId,
          cantidad: parseInt(r.dataValues.cantidad),
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener reservas de hoy:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reservas de hoy",
      error: error.message,
    });
  }
};

/**
 * Obtiene un resumen general del dashboard con todas las estadísticas
 */
export const getResumenDashboard = async (req, res) => {
  try {
    // Fecha actual
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date();
    finDelDia.setHours(23, 59, 59, 999);

    // Estadísticas de parqueaderos
    const totalParqueaderos = await Parqueadero.count();
    const parqueaderosConVehiculo = await Vehiculo.count();
    const parqueaderosVisitantes = await Visitas.count({
      where: {
        vehiculoMatricula: { [Op.ne]: null },
        fechaHoraSalida: null, // Solo visitas activas
      },
    });
    const parqueaderosDisponibles =
      totalParqueaderos - parqueaderosConVehiculo - parqueaderosVisitantes;

    // Estadísticas de paquetes
    const paquetesRecibidos = await RecepcionPaquetes.count({
      where: {
        fechaRecepcion: { [Op.between]: [inicioDelDia, finDelDia] },
      },
    });

    const paquetesEntregados = await RecepcionPaquetes.count({
      where: {
        fechaRecepcion: { [Op.between]: [inicioDelDia, finDelDia] },
        fechaEntrega: { [Op.ne]: null },
      },
    });

    // Estadísticas de reservas
    const reservasHoy = await ReservarAreas.count({
      where: {
        fechaReserva: { [Op.between]: [inicioDelDia, finDelDia] },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        fecha: new Date().toISOString().split("T")[0],
        parqueaderos: {
          total: totalParqueaderos,
          ocupadosResidentes: parqueaderosConVehiculo,
          ocupadosVisitantes: parqueaderosVisitantes,
          disponibles: parqueaderosDisponibles,
          porcentajes: {
            residentes:
              totalParqueaderos > 0
                ? parseFloat(
                    (
                      (parqueaderosConVehiculo / totalParqueaderos) *
                      100
                    ).toFixed(2)
                  )
                : 0,
            visitantes:
              totalParqueaderos > 0
                ? parseFloat(
                    (
                      (parqueaderosVisitantes / totalParqueaderos) *
                      100
                    ).toFixed(2)
                  )
                : 0,
            disponibles:
              totalParqueaderos > 0
                ? parseFloat(
                    (
                      (parqueaderosDisponibles / totalParqueaderos) *
                      100
                    ).toFixed(2)
                  )
                : 0,
          },
        },
        paquetes: {
          recibidos: paquetesRecibidos,
          entregados: paquetesEntregados,
          pendientes: paquetesRecibidos - paquetesEntregados,
        },
        reservas: {
          total: reservasHoy,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener resumen del dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener resumen del dashboard",
      error: error.message,
    });
  }
};
