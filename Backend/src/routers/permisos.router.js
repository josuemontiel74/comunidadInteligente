import { Router } from "express";
import * as permisosController from "../controller/permisos.controller.js";

const router = Router();

router.post("/permiso", permisosController.crearPermiso);
router.get("/permiso", permisosController.mostrarPermiso);
router.get("/permiso/:id", permisosController.mostrarIdPermiso);
router.put("/permiso/:id", permisosController.actualizarPermiso);
router.delete("/permiso/:id", permisosController.borrarPermiso);

export default router;
