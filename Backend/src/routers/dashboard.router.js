import { Router } from "express";
import {
  getEstadisticasParqueaderos,
  getPaquetesRecibidosHoy,
  getReservasHoy,
  getResumenDashboard,
} from "../controller/dashboard.controller.js";

const router = Router();

/**
 * @route GET /api/dashboard/resumen
 * @desc Obtiene un resumen completo con todas las estadísticas del dashboard
 * @access Public (puedes agregar middleware de autenticación si lo necesitas)
 */
router.get("/dashboard/resumen", getResumenDashboard);

/**
 * @route GET /api/dashboard/parqueaderos
 * @desc Obtiene estadísticas de ocupación de parqueaderos
 * @access Public
 */
router.get("/dashboard/parqueaderos", getEstadisticasParqueaderos);

/**
 * @route GET /api/dashboard/paquetes-hoy
 * @desc Obtiene la cantidad de paquetes recibidos en el día
 * @access Public
 */
router.get("/dashboard/paquetes-hoy", getPaquetesRecibidosHoy);

/**
 * @route GET /api/dashboard/reservas-hoy
 * @desc Obtiene la cantidad de reservas de áreas comunes del día
 * @access Public
 */
router.get("/dashboard/reservas-hoy", getReservasHoy);

export default router;
