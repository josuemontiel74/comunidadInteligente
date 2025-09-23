import { Router } from "express";
import * as torresController from "../controller/torres.controller.js";

const router = Router();
router.post("/torre", torresController.crearTorre);
router.get("/torre", torresController.mostrarTorre);
router.get("/torre/:id", torresController.mostrarIdTorre);
router.put("/torre/:id", torresController.actualizarTorre);
router.delete("/torre/:id", torresController.borrarTorre);

export default router;
