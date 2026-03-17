import { Router } from "express";
import * as apartamentosController from "../controller/apartamentos.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as ApartamentoSchema from "../schemas/apartamentos.schema.js";

const router = Router();

router.post(
  "/apartamento",
  validarJWT,
  validarRol(1),
  validate(ApartamentoSchema.createApartamentoSchema, "body", true),
  apartamentosController.crearApartamento,
);
router.get(
  "/apartamento",
  validarJWT,
  validarRol(1, 2, 3),
  validate(ApartamentoSchema.getApartamentoSchema),
  apartamentosController.mostrarApartamento,
);
router.get(
  "/apartamento/:idApartamento",
  validarJWT,
  validarRol(1),
  validate(ApartamentoSchema.getApartamentoSchema, "params", true),
  apartamentosController.mostrarIdApartamento,
);
router.patch(
  "/apartamento/:idApartamento",
  validarJWT,
  validarRol(1),
  validate(ApartamentoSchema.updateApartamentoSchema, "body", true),
  apartamentosController.actualizarApartamento,
);

router.delete(
  "/apartamento/:idApartamento",
  validarJWT,
  validarRol(1),
  validate(ApartamentoSchema.deleteApartamentoSchema, "params", true),
  apartamentosController.eliminarApartamento,
);

export default router;
