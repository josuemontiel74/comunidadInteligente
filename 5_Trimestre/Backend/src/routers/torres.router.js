import { Router } from "express";
import * as torresController from "../controller/torres.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as torresSchema from "../schemas/torres.schema.js";

const router = Router();
router.post(
  "/torre",
  validate(torresSchema.crearTorreSchema, "body", true),
  validarJWT,
  validarRol(1),
  torresController.crearTorre
);
router.get(
  "/torre",
  validate(torresSchema.obtenerTorreSchema),
  validarJWT,
  validarRol(1),
  torresController.mostrarTorre
);
router.get(
  "/torre/:idTorre",
  validate(torresSchema.obtenerTorreSchema, "params", true),
  validarJWT,
  validarRol(1),
  torresController.mostrarIdTorre
);
router.put(
  "/torre/:idTorre",
  validate(torresSchema.actualizarTorreSchema, "body", true),
  validarJWT,
  validarRol(1),
  torresController.actualizarTorre
);

router.delete(
  "/torre/:idTorre",
  validate(torresSchema.borrarTorreSchema, "params", true),
  validarJWT,
  validarRol(1),
  torresController.borrarTorre
);

export default router;
