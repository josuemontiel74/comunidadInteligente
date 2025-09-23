import { Router } from "express";
import * as rolespermisosController from "../controller/rolespermisos.controller.js";

const router = Router();

router.post("/asignar", rolespermisosController.asignarPermiso);
router.get("/rol/:idRol", rolespermisosController.permisosPorRol);
router.get("/permiso/:idPermiso", rolespermisosController.rolesPorPermiso);
router.delete("/eliminar", rolespermisosController.eliminarPermisoDeRol);

export default router;
