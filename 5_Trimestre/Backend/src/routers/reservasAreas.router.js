import { Router } from "express";
import * as reservasAreasController from "../controllers/reservasAreas.controller.js";

const router = Router();

router.post("/reservarAreas", reservasAreasController.CrearReservaArea);
router.get("/reservarAreas", reservasAreasController.ObtenerReservasAreas);
router.get(
  "/reservarAreas/:id",
  reservasAreasController.ObtenerReservaAreaPorId
);
router.patch(
  "/reservarAreas/:id",
  reservasAreasController.ActualizarReservaArea
);
router.delete(
  "/reservarAreas/:id",
  reservasAreasController.EliminarReservaArea
);

export default router;
