import { Router } from "express";
import * as visitantesController from "../controller/visitantes.controller.js";

const router = Router();
router.post("/visitante", visitantesController.crearVisitante);
router.get("/visitante", visitantesController.obtenerVisitantes);
router.get("/visitante/:id", visitantesController.obtenerVisitantePorId);
router.patch("/visitante/:id", visitantesController.actualizarVisitante);
router.delete("/visitante/:id", visitantesController.eliminarVisitante);

export default router;
