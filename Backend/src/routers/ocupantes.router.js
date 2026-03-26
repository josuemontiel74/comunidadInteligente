import { Router } from "express";
import * as ocupantesController from "../controller/ocupantes.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as OcupanteSchema from "../schemas/ocupantes.schema.js";

const router = Router();

router.get(
  "/ocupante/verificar-documentos",
  ocupantesController.verificarDocumentos,
);

router.get(
  "/ocupante",
  validarJWT,
  validarRol(1, 2),
  ocupantesController.listarOcupantes,
);

// Crear ocupante
router.post(
  "/ocupante",
  validate(OcupanteSchema.createOcupanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.crearOcupante,
);

// Obtener ocupante por ID
router.get(
  "/ocupante/:idOcupante",
  validate(OcupanteSchema.getOcupanteSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.obtenerOcupantePorId,
);

// Actualizar ocupante
router.patch(
  "/ocupante/:idOcupante",
  validate(OcupanteSchema.updateOcupanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.actualizarOcupante,
);

// Finalizar ocupante
router.delete(
  "/ocupante/:idOcupante",
  validate(OcupanteSchema.deleteOcupanteSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.finalizarOcupante,
);

export default router;
