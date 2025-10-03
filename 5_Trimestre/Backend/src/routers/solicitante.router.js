import { Router } from "express";
import * as solicitanteController from "../controller/solicitante.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as solicitanteSchema from "../schemas/solicitante.schema.js";

const router = Router();

router.post(
  "/solicitantes",
  validate(solicitanteSchema.crearSolicitanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  solicitanteController.crearSolicitante
);
router.get(
  "/solicitantes",
  validate(solicitanteSchema.obtenerSolicitantePorIdSchema),
  solicitanteController.obtenerSolicitantes
);
router.get(
  "/solicitantes/:documentoSolicitante",
  validate(solicitanteSchema.obtenerSolicitantePorIdSchema, "params", true),
  solicitanteController.obtenerSolicitantePorId
);
router.patch(
  "/solicitantes/:documentoSolicitante",
  validate(solicitanteSchema.actualizarSolicitanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  solicitanteController.actualizarSolicitante
);
router.delete(
  "/solicitantes/:documentoSolicitante",
  validate(solicitanteSchema.eliminarSolicitanteSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  solicitanteController.eliminarSolicitante
);
export default router;
