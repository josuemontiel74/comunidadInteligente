import { Router } from "express";
import * as tiposVehiculoController from "../controller/tiposVehiculo.controller.js";

const router = Router();

router.get("/vehiculo", tiposVehiculoController.mostraVehiculos);
router.get("/vehiculo/:id", tiposVehiculoController.mostraVehiculosporId);
export default router;
