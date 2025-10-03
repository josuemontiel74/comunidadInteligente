import { Router } from "express";
import * as visitasController from "../controller/visitas.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as visitasSchema from "../schemas/visitas.schema.js";

const router = Router();

router.post(
  "/visita",
  validate(visitasSchema.crearVisitanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2, 3),
  visitasController.crearVisita
);

router.get("/visitaJoin", visitasController.listarVisitas);

router.get(
  "/visita",
  validate(visitasSchema.obtenerVisitasSchema),
  validarJWT,
  validarRol(1, 2, 3),
  visitasController.obtenerVisitas
);

router.get(
  "/visita/:idVisita",
  validate(visitasSchema.obtenerVisitasSchema, "params", true),
  validarJWT,
  validarRol(1, 2, 3),
  visitasController.obtenerVisitaPorId
);

router.patch(
  "/visita/:idVisita",
  validate(visitasSchema.actualizarVisitanteSchema, "body", true),
  validarJWT,
  validarRol(1, 2, 3),
  visitasController.actualizarVisita
);

router.delete(
  "/visita/:idVisita",
  validate(visitasSchema.finalizarVisitaSchema, "params", true),
  validarJWT,
  validarRol(1, 2, 3),
  visitasController.finalizarVisita
);

export default router;
