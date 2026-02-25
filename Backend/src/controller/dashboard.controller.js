import { Sequelize, Op } from "sequelize";
import Parqueadero from "../models/parqueaderos.model.js";
import Vehiculo from "../models/vehiculo.model.js";
import RecepcionPaquetes from "../models/recepcionPaquetes.model.js";
import ReservarAreas from "../models/reservasAreas.model.js";
import Visitas from "../models/visitas.model.js";
import Usuario from "../models/user.model.js";
import Ocupante from "../models/ocupante.model.js";

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
          residentes: Number.parseFloat(porcentajeResidentes),
          visitantes: Number.parseFloat(porcentajeVisitantes),
          disponibles: Number.parseFloat(porcentajeDisponibles),
        },
      },
    });
  } catch (error) {
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

    // Contar paquetes entregados hoy (entregados hoy, sin importar cuándo se recibieron)
    const paquetesEntregados = await RecepcionPaquetes.count({
      where: {
        fechaEntrega: {
          [Op.between]: [inicioDelDia, finDelDia],
        },
      },
    });

    // Paquetes pendientes: todos los que no han sido entregados
    const paquetesPendientes = await RecepcionPaquetes.count({
      where: {
        fechaEntrega: null,
      },
    });

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
          cantidad: Number.parseInt(r.dataValues.cantidad, 10),
        })),
      },
    });
  } catch (error) {
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

    // Contar parqueaderos ocupados por tipo de vehículo
    // estadoId: 3 = Ocupado, 4 = Disponible
    // tipoVehiculoId: 1 = Carro, 2 = Moto
    const parqueaderosCarros = await Parqueadero.count({
      where: {
        tipoVehiculoId: 1,
        estadoId: 3,
      },
    });

    const parqueaderosMotos = await Parqueadero.count({
      where: {
        tipoVehiculoId: 2,
        estadoId: 3,
      },
    });

    const parqueaderosDisponibles = await Parqueadero.count({
      where: {
        estadoId: 4,
      },
    });

    // Estadísticas de paquetes
    // Pendientes: todos los paquetes sin entregar (cualquier fecha de recepción)
    const paquetesPendientes = await RecepcionPaquetes.count({
      where: {
        fechaEntrega: null,
      },
    });

    // Entregados hoy: paquetes cuya fecha de entrega es hoy
    const paquetesEntregados = await RecepcionPaquetes.count({
      where: {
        fechaEntrega: { [Op.between]: [inicioDelDia, finDelDia] },
      },
    });

    // Estadísticas de reservas
    const reservasHoy = await ReservarAreas.count({
      where: {
        fechaReserva: { [Op.between]: [inicioDelDia, finDelDia] },
      },
    });

    // Estadísticas de visitas
    const visitasHoy = await Visitas.count({
      where: {
        fechaHoraIngreso: { [Op.between]: [inicioDelDia, finDelDia] },
      },
    });

    // estadoId 8 = Activa/En curso, estadoId 9 = Finalizada
    const visitasActivas = await Visitas.count({
      where: {
        estadoId: 8,
      },
    });

    // Estadísticas de usuarios
    const usuariosActivos = await Usuario.count({
      where: { estadoId: 1 },
    });

    const usuariosInactivos = await Usuario.count({
      where: { estadoId: 2 },
    });

    // Estadísticas de residentes (ocupantes activos)
    const residentesActivos = await Ocupante.count({
      where: { estadoId: 1 },
    });

    res.status(200).json({
      success: true,
      data: {
        parqueaderos: {
          ocupadosCarros: parqueaderosCarros,
          ocupadosMotos: parqueaderosMotos,
          disponibles: parqueaderosDisponibles,
        },
        paquetes: {
          entregados: paquetesEntregados,
          pendientes: paquetesPendientes,
        },
        reservas: {
          hoy: reservasHoy,
        },
        visitas: {
          hoy: visitasHoy,
          activas: visitasActivas,
        },
        usuarios: {
          activos: usuariosActivos,
          inactivos: usuariosInactivos,
          total: usuariosActivos + usuariosInactivos,
        },
        residentes: {
          activos: residentesActivos,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener resumen del dashboard",
      error: error.message,
    });
  }
};
