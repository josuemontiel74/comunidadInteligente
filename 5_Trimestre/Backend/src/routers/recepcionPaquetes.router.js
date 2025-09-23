import { Router } from "express";
import * as recepcionPaquetesController from "../controller/recepcionPaquetes.controller.js";

const router = Router();

router.post(
  "/recepcionPaquetes",
  recepcionPaquetesController.createRecepcionPaquete
);
router.get(
  "/recepcionPaquetes",
  recepcionPaquetesController.getAllRecepcionPaquetes
);
router.get(
  "/recepcionPaquetes/:id",
  recepcionPaquetesController.getRecepcionPaqueteById
);
router.patch(
  "/recepcionPaquetes/:id",
  recepcionPaquetesController.updateRecepcionPaquete
);

router.delete(
  "/recepcionPaquetes/:id",
  recepcionPaquetesController.deleteRecepcionPaquete
);
