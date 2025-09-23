import { Router } from "express";
import * as ocupantesController from "../controller/ocupantes.controller.js";

const router = Router();

router.post("/ocupante", ocupantesController.crearOcupante);
router.get("/ocupante", ocupantesController.obtenerOcupante);
router.get("/ocupante/:id", ocupantesController.obtenerOcupantePorId);
router.patch("/ocupante/:id", ocupantesController.actualizarOcupante);
router.delete("/ocupante/:id", ocupantesController.eliminarOcupante);

export default router;
