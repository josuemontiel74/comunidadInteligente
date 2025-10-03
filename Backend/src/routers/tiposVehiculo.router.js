import { Router } from "express";
import * as tiposVehiculoController from "../controller/tiposVehiculo.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as tiposVehiculoSchema from "../schemas/tipoVehiculo.schema.js";
const router = Router();

router.get(
  "/tipoVehiculo",
  validate(tiposVehiculoSchema.getTipoVehiculoSchema),
  validarJWT,
  validarRol(1),
  tiposVehiculoController.mostrarVehiculos
);
router.get(
  "/tipoVehiculo/:idTipoVehiculo",
  validate(tiposVehiculoSchema.getTipoVehiculoSchema, "params", true),
  validarJWT,
  validarRol(1),
  tiposVehiculoController.mostrarVehiculosporId
);
export default router;
