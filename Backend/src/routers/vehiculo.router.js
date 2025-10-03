import { Router } from "express";
import * as tiposVehiculoController from "../controller/vehiculo.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as vehiculoSchema from "../schemas/vehiculo.schema.js";

const router = Router();

router.post(
  "/vehiculos",
  validarJWT,
  validarRol(1, 2, 3),
  validate(vehiculoSchema.crearVehiculoSchema, "body", true),
  tiposVehiculoController.crearVehiculo
);
router.get(
  "/vehiculos",
  validarJWT,
  validarRol(1, 2, 3),
  validate(vehiculoSchema.obtenerVehiculoSchema),
  tiposVehiculoController.obtenerVehiculos
);

router.get(
  "/vehiculos/:matricula",
  validarJWT,
  validarRol(1, 2, 3),
  validate(vehiculoSchema.obtenerVehiculoSchema, "params", true),
  tiposVehiculoController.obtenerVehiculo
);
router.patch(
  "/vehiculos/:matricula",
  validarJWT,
  validarRol(1, 2, 3),
  validate(vehiculoSchema.actualizarVehiculoSchema, "body", true),
  tiposVehiculoController.actualizarVehiculo
);
router.delete(
  "/vehiculos/:matricula",
  validarJWT,
  validarRol(1, 2, 3),
  validate(vehiculoSchema.eliminarVehiculoSchema, "params", true),
  tiposVehiculoController.eliminarVehiculo
);

export default router;
