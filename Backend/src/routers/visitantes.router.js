import { Router } from "express";
import * as visitantesController from "../controller/visitantes.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as visitantesSchema from "../schemas/visitantes.schema.js";

const router = Router();
router.post(
  "/visitante",
  validarJWT,
  validarRol(1, 2, 3),
  validate(visitantesSchema.crearVisitanteSchema),
  visitantesController.crearVisitante
);
router.get(
  "/visitante",
  validate(visitantesSchema.obtenerVisitantesSchema),
  validarJWT,
  validarRol(1, 2, 3),
  visitantesController.obtenerVisitantes
);
router.get(
  "/visitante/:numeroDocumento",
  validate(visitantesSchema.obtenerVisitantesSchema),
  validarJWT,
  validarRol(1, 2, 3),
  visitantesController.obtenerVisitantePorId
);
router.patch(
  "/visitante/:numeroDocumento",
  validate(visitantesSchema.actualizarVisitanteSchema),
  validarJWT,
  validarRol(1, 2, 3),
  visitantesController.actualizarVisitante
);
router.delete(
  "/visitante/:numeroDocumento",
  validate(visitantesSchema.borrarVisitanteSchema),
  validarJWT,
  validarRol(1, 2, 3),
  visitantesController.eliminarVisitante
);

export default router;
