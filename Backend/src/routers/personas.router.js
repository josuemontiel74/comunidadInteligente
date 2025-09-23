import { Router } from "express";
import * as personasController from "../controller/personas.controller.js";
const router = Router();
router.post("/persona", personasController.createPersona);
router.get("/persona", personasController.getAllPersonas);
router.get("/persona/:id", personasController.getAllPersonasID);
router.patch("/persona/:id", personasController.UpdatePersona);
router.delete("/persona/:id", personasController.EliminarPersona);

export default router;
