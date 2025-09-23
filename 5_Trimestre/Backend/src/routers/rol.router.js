import { Router } from "express";
import * as rolController from "../controller/rol.controller.js";

const router = Router();

router.post("/rol", rolController.crearRol);
router.get("/rol", rolController.mostrarRol);
router.get("/rol/:id", rolController.mostrarIdRol);
router.put("/rol/:id", rolController.actualizarRol);
router.delete("/rol/:id", rolController.borrarRol);

export default router;
