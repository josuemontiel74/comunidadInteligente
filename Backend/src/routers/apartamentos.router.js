import { Router } from "express";
import * as apartamentosController from "../controller/apartamentos.controller.js";

const router = Router();

router.post("/apartamento", apartamentosController.crearApartamento);
router.get("/apartamento", apartamentosController.mostrarApartamento);
router.get("/apartamento/:id", apartamentosController.mostrarIdApartamento);
router.patch("/apartamento/:id", apartamentosController.actualizarApartamento);

export default router;
