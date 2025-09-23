import { Router } from "express";
import * as estadosController from "../controller/estados.controller.js";

const router = Router();

router.post("/estado", estadosController.createEstado);
router.get("/estado", estadosController.getAllEstados);
router.patch("/estado/:id", estadosController.UpdateEstado);
router.delete("/estado/:id", estadosController.EliminarEstado);
router.get("/estado/:id", estadosController.getAllEstadosID);
export default router;
