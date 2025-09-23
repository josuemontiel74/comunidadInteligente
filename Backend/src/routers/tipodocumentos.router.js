import { Router } from "express";
import * as tipodocumentosController from "../controller/tipodocumento.controller.js";
const router = Router();

router.get("/documento", tipodocumentosController.mostraDocumentos);
router.get("/documento/:id", tipodocumentosController.mostraDocumentosporId);
export default router;
