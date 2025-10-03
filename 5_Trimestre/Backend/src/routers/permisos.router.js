import { Router } from "express";
import * as permisosController from "../controller/permisos.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as PermisoSchema from "../schemas/permisos.schema.js";

const router = Router();

router.post(
  "/permiso",
  validate(PermisoSchema.createPermisoSchema, "body", true),
  validarJWT,
  validarRol(1),
  permisosController.crearPermiso
);
router.get(
  "/permiso",
  validate(PermisoSchema.getPermisoSchema),
  validarJWT,
  validarRol(1),
  permisosController.mostrarPermiso
);

router.get(
  "/permiso/:idPermiso",
  validate(PermisoSchema.getPermisoSchema, "params", true),
  validarJWT,
  validarRol(1),
  permisosController.mostrarIdPermiso
);

router.put(
  "/permiso/:idPermiso",
  validate(PermisoSchema.updatePermisoSchema, "body", true),
  validarJWT,
  validarRol(1),
  permisosController.actualizarPermiso
);

router.delete(
  "/permiso/:idPermiso",
  validate(PermisoSchema.deletePermisoSchema, "params", true),
  validarJWT,
  validarRol(1),
  permisosController.borrarPermiso
);

export default router;
