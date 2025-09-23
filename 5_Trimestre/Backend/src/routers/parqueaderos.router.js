import { Router } from "express";
import * as parqueaderosController from "../controller/parqueaderos.controller.js";

const router = Router();

router.get("/parqueadero", parqueaderosController.mostraParqueaderos);
router.get("/parqueadero/:id", parqueaderosController.mostraParqueaderosporId);
export default router;
