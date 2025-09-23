import { Router } from "express";
import * as visitasController from "../controller/visitas.controller.js";

const router = Router();

router.post("/visita", visitasController.crearVisita);
router.get("/visita", visitasController.obtenerVisitas);
router.get("/visita/:id", visitasController.obtenerVisitaPorId);
router.patch("/visita/:id", visitasController.actualizarVisita);
router.patch("/visita/finalizar/:id", visitasController.finalizarVisita);

export default router;
