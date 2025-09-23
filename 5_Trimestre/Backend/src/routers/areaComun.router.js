import { Router } from "express";
import * as areaComunController from "../controller/areaComun.controller.js";

const router = Router();

router.get("/areaComunes", areaComunController.ObtenerAreasComunes);
router.get("/areaComunes/:id", areaComunController.ObtenerAreasComunesPorId);
router.patch("/areaComunes/:id", areaComunController.ActualizarAreaComun);
