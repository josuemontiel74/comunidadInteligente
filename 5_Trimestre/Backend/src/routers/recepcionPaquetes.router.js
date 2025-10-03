import { Router } from "express";
import * as recepcionPaquetesController from "../controller/recepcionPaquetes.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as RecepcionPaquetesSchema from "../schemas/recepcionPaquetes.schema.js";

const router = Router();

router.post(
  "/recepcionPaquetes",
  validate(RecepcionPaquetesSchema.crearRecepcionPaquete, "body", true),
  validarJWT,
  validarRol(1, 2, 3),
  recepcionPaquetesController.crearRecepcionPaquete
);
router.get(
  "/recepcionPaquetes",
  validate(RecepcionPaquetesSchema.obtenerRecepcionPaquetePorId),
  validarJWT,
  validarRol(1, 2, 3),
  recepcionPaquetesController.obtenerRecepcionesPaquetes
);

router.get(
  "/recepcion-paquetes",
  recepcionPaquetesController.obtenerRecepcionPaquetesSQL
);

router.get(
  "/recepcionPaquetes/:idPaquete",
  validate(
    RecepcionPaquetesSchema.obtenerRecepcionPaquetePorId,
    "params",
    true
  ),
  validarJWT,
  validarRol(1, 2, 3),
  recepcionPaquetesController.obtenerRecepcionPaquetePorId
);
router.patch(
  "/recepcionPaquetes/:idPaquete",
  validate(RecepcionPaquetesSchema.actualizarRecepcionPaquete, "body", true),
  validarJWT,
  validarRol(1, 2, 3),
  recepcionPaquetesController.actualizarRecepcionPaquete
);

router.delete(
  "/recepcionPaquetes/:idPaquete",
  validate(RecepcionPaquetesSchema.eliminarRecepcionPaquete, "params", true),
  validarJWT,
  validarRol(1, 2, 3),
  recepcionPaquetesController.FinalizarRecepcionPaquete
);

export default router;
