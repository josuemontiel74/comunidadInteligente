import { Router } from "express";
import * as tipodocumentosController from "../controller/tipodocumento.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as tipodocumentosSchema from "../schemas/tipoDocumentos.schema.js";
const router = Router();

router.get(
  "/documento",
  validate(tipodocumentosSchema.getTipoDocumentosSchema),
  validarJWT,
  validarRol(1),
  tipodocumentosController.mostraDocumentos
);
router.get(
  "/documento/:idTipoDocumento",
  validate(tipodocumentosSchema.getTipoDocumentosSchema, "params", true),
  validarJWT,
  validarRol(1),
  tipodocumentosController.mostraDocumentosporId
);
export default router;
