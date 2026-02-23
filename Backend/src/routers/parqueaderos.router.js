import { Router } from "express";
import * as parqueaderosController from "../controller/parqueaderos.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as ParqueaderoSchema from "../schemas/parqueaderos.schema.js";

const router = Router();

router.post(
  "/parqueadero",
  validate(ParqueaderoSchema.createParqueaderoSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  parqueaderosController.createParqueadero,
);

router.get(
  "/parqueadero",
  validate(ParqueaderoSchema.getParqueaderoSchema),
  validarJWT,
  validarRol(1, 2, 3),
  parqueaderosController.mostraParqueaderos,
);

// Solo SuperAdmin (rol 1) puede cambiar el estado de un parqueadero
// DEBE ir ANTES de /parqueadero/:codigoParqueadero para evitar conflicto de rutas
router.patch(
  "/parqueadero/cambiarEstado/:codigoParqueadero",
  validarJWT,
  validarRol(1),
  parqueaderosController.cambiarEstadoParqueadero,
);

router.get(
  "/parqueadero/:codigoParqueadero",
  validate(ParqueaderoSchema.getParqueaderoSchema, "params", true),
  validarJWT,
  validarRol(1, 2, 3),
  parqueaderosController.mostraParqueaderosporId,
);

router.patch(
  "/parqueadero/:codigoParqueadero",
  validate(ParqueaderoSchema.updateParqueaderoSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  parqueaderosController.actualizarParqueadero,
);

router.delete(
  "/parqueadero/:codigoParqueadero",
  validate(ParqueaderoSchema.getParqueaderoSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  parqueaderosController.eliminarParqueadero,
);

export default router;
