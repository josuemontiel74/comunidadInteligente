import { Router } from "express";
import * as estadosController from "../controller/estados.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as estadoSchema from "../schemas/estados.schema.js";

const router = Router();

router.post(
  "/estado",
  validarJWT,
  validarRol(1),
  validate(estadoSchema.createEstadoSchema, "body", true),
  estadosController.createEstado
);
router.get(
  "/estado",
  validarJWT,
  validarRol(1),
  validate(estadoSchema.getEstadoSchema),
  estadosController.getAllEstados
);
router.get(
  "/estado/:idEstado",
  validarJWT,
  validarRol(1),
  validate(estadoSchema.getEstadoSchema, "params", true),
  estadosController.getAllEstadosID
);
router.patch(
  "/estado/:idEstado",
  validarJWT,
  validarRol(1),
  validate(estadoSchema.updateEstadoSchema, "body", true),
  estadosController.UpdateEstado
);
router.delete(
  "/estado/:idEstado",
  validarJWT,
  validarRol(1),
  validate(estadoSchema.deleteEstadoSchema, "params", true),
  estadosController.EliminarEstado
);

export default router;
