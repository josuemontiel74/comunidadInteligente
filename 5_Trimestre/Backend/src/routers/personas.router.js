import { Router } from "express";
import * as personasController from "../controller/personas.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as PersonaSchema from "../schemas/personas.schema.js";

const router = Router();
router.post(
  "/persona",
  validate(PersonaSchema.createPersonaSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  personasController.createPersona
);
router.get(
  "/persona",
  validate(PersonaSchema.getPersonaByIdSchema),
  validarJWT,
  validarRol(1, 2),
  personasController.getAllPersonas
);
router.get(
  "/persona/:numeroDocumento",
  validate(PersonaSchema.getPersonaByIdSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  personasController.getAllPersonasID
);
router.patch(
  "/persona/:numeroDocumento",
  validate(PersonaSchema.updatePersonaSchema, "body", true),
  validarJWT,
  validarRol(1, 2),
  personasController.UpdatePersona
);

router.delete(
  "/persona/:numeroDocumento",
  validate(PersonaSchema.deletePersonaSchema, "params", true),
  validarJWT,
  validarRol(1, 2),
  personasController.deletePersona
);

export default router;
