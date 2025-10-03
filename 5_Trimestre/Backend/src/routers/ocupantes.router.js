import { Router } from "express";
import * as ocupantesController from "../controller/ocupantes.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as OcupanteSchema from "../schemas/ocupantes.schema.js";

const router = Router();

router.post(
  "/ocupante",
  validate(OcupanteSchema.createOcupanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.crearOcupante
);
router.get(
  "/ocupante",
  validate(OcupanteSchema.getOcupanteSchema),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.obtenerOcupante
);

router.get("/ocupantes", ocupantesController.listarOcupantes);

router.get(
  "/ocupante/:idOcupante",
  validate(OcupanteSchema.getOcupanteSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.obtenerOcupantePorId
);
router.patch(
  "/ocupante/:idOcupante",
  validate(OcupanteSchema.updateOcupanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.actualizarOcupante
);

router.delete(
  "/ocupante/:idOcupante",
  validate(OcupanteSchema.deleteOcupanteSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  ocupantesController.finalizarOcupante
);

export default router;
