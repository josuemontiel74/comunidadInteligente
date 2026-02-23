import { Router } from "express";
import * as reservasAreasController from "../controller/reservasAreas.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";

const router = Router();

// ========== RUTAS UNIFICADAS DE RESERVAS DE ÁREAS COMUNES ==========

// Listar todas las reservas
router.get(
  "/reservas-areas",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.listarReservasAreas,
);

// Obtener reserva por ID
router.get(
  "/reservas-areas/:idReservas",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.obtenerReservaPorId,
);

// Crear nueva reserva
router.post(
  "/reservas-areas",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.crearReserva,
);

// Actualizar reserva
router.patch(
  "/reservas-areas/:idReservas",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.actualizarReserva,
);

// Eliminar (finalizar) reserva
router.delete(
  "/reservas-areas/:idReservas",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.eliminarReservaArea,
);

// Reportes de áreas comunes
router.post(
  "/reportes/:por",
  validarJWT,
  validarRol(1),
  reservasAreasController.reportes,
);

// Calendario de reservas
router.get(
  "/calendariodereservas",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.calendariosReservas,
);

export default router;
