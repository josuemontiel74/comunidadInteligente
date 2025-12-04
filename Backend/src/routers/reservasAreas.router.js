import { Router } from "express";
import * as reservasAreasController from "../controller/reservasAreas.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as reservarAreasSchema from "../schemas/reservarAreas.schema.js";

const router = Router();
// Versión móvil traer usuarios
router.get(
  "/ReservasAreasComunesMovil",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.mostrarAreasComunesVersionMovil
);
router.post(
  "/reservarAreas",
  validate(reservarAreasSchema.crearReservarAreasSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.CrearReservaArea
);
router.post(
  "/ReservarAreaMovil",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.crearReservasParaMovil
);
router.get(
  "/BuscarReserva/:idReservas",
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.buscar
);
router.get(
  "/reservarAreas",
  validate(reservarAreasSchema.obtenerReservarAreasSchema),
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.ObtenerReservasAreas
);
router.patch(
  "/ActualizarReserva/:idReservas",
  validarJWT,
  validarRol(1, 2),
  validate(reservarAreasSchema.actualizarReservarAreasSchema, true),
  reservasAreasController.ActualizarReservaAreaParaMovil
);
router.get("/reservas-areas", reservasAreasController.listarReservasAreas);

router.get(
  "/reservarAreas/:idReservas",
  validate(reservarAreasSchema.obtenerReservarAreasSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.ObtenerReservaAreaPorId
);
router.patch(
  "/reservarAreas/:idReservas",
  validate(reservarAreasSchema.actualizarReservarAreasSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.ActualizarReservaArea
);
router.delete(
  "/reservarAreas/:idReservas",
  validate(reservarAreasSchema.eliminarReservarAreasSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  reservasAreasController.eliminarReservaArea
);

export default router;
