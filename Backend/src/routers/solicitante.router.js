import { Router } from "express";
import * as solicitanteController from "../controllers/solicitante.controller.js";

const router = Router();

router.post("/solicitantes", solicitanteController.crearSolicitante);
router.get("/solicitantes", solicitanteController.obtenerSolicitantes);
router.get(
  "/solicitantes/:documentoSolicitante",
  solicitanteController.obtenerSolicitantePorId
);
router.patch(
  "/solicitantes/:documentoSolicitante",
  solicitanteController.actualizarSolicitante
);
router.delete(
  "/solicitantes/:documentoSolicitante",
  solicitanteController.eliminarSolicitante
);
export default router;
