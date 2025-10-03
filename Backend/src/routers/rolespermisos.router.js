import { Router } from "express";
import * as rolespermisosController from "../controller/rolespermisos.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as rolespermisosSchema from "../schemas/rolespermisos.schema.js";

const router = Router();

router.post(
  "/asignar",
  validate(rolespermisosSchema.crearRolesPermisosSchema, "body", true),
  validarJWT,
  validarRol(1),
  rolespermisosController.asignarPermiso
);
router.get(
  "/rol/:idRol",
  validate(rolespermisosSchema.obtenerPermisosPorRolSchema, "params", true),
  validarJWT,
  validarRol(1),
  rolespermisosController.permisosPorRol
);
router.get(
  "/permiso/:idPermiso",
  validate(rolespermisosSchema.obtenerPermisosPorRolSchema, "params", true),
  validarJWT,
  validarRol(1),
  rolespermisosController.rolesPorPermiso
);
router.delete(
  "/eliminar",
  validate(rolespermisosSchema.eliminarRolesPermisosSchema, "body", true),
  validarJWT,
  validarRol(1),
  rolespermisosController.eliminarPermisoDeRol
);

export default router;
