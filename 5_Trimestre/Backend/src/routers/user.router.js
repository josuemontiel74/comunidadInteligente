import { Router } from "express";
import * as userController from "../controller/user.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as userSchema from "../schemas/user.schema.js";
const router = Router();

router.post(
  "/usuario",
  validarJWT,
  validarRol(1),
  validate(userSchema.createUserSchema),
  userController.crearUsuario
);
router.get(
  "/usuario",
  validarJWT,
  validarRol(1),
  userController.obtenerUsuario
);
router.get(
  "/usuario/:username",
  validarJWT,
  validarRol(1),
  validate(userSchema.getUserSchema, "params"),
  userController.obtenerUsuarioPorId
);
router.post(
  "/login",
  validate(userSchema.loginSchema),
  userController.loginUsuario
);

router.get(
  "/usuario/buscar/:estadoId",
  validarJWT,
  validarRol(1),
  validate(userSchema.searchByEstadoSchema, "params"),
  userController.buscarUsuarios
);
router.patch(
  "/usuario/:username",
  validarJWT,
  validarRol(1),
  validate(userSchema.updateUserSchema, "body"),
  validate(userSchema.getUserSchema, "params"),
  userController.actualizarUsuario
);
export default router;
