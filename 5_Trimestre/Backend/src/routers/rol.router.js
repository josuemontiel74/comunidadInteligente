import { Router } from "express";
import * as rolController from "../controller/rol.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as rolSchema from "../schemas/rol.schema.js";

const router = Router();

router.post(
  "/rol",
  validarJWT,
  validarRol(1),
  validate(rolSchema.createRolSchema, "body", true),
  rolController.crearRol
);
router.get(
  "/rol",
  validarJWT,
  validarRol(1),
  validate(rolSchema.getRolByIdSchema),
  rolController.mostrarRol
);
router.get(
  "/rol/:idRol",
  validarJWT,
  validarRol(1),
  validate(rolSchema.getRolByIdSchema, "params", true),
  rolController.mostrarIdRol
);

router.put(
  "/rol/:idRol",
  validarJWT,
  validarRol(1),
  validate(rolSchema.updateRolSchema, "body", true),
  rolController.actualizarRol
);

router.delete(
  "/rol/:idRol",
  validarJWT,
  validarRol(1),
  validate(rolSchema.deleteRolSchema, "params", true),
  rolController.borrarRol
);

export default router;
