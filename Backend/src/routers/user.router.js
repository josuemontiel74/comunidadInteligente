import { Router } from "express";
import * as userController from "../controller/user.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import { limiterLogin } from "../middlewares/rateLimiters.js";
import * as userSchema from "../schemas/user.schema.js";
const router = Router();

router.post(
  "/usuario",
  validarJWT,
  validarRol(1),
  validate(userSchema.createUserSchema, "body", true),
  userController.crearUsuario,
);
router.get(
  "/usuario",
  validarJWT,
  validarRol(1),
  validate(userSchema.getUserSchema),
  userController.obtenerUsuario,
);
router.post("/usuario/logout", validarJWT, userController.logoutUsuario);
router.get(
  "/usuario/en-linea",
  validarJWT,
  validarRol(1, 2),
  userController.obtenerUsuariosEnLinea,
);
router.get(
  "/usuario/:username",
  validarJWT,
  validarRol(1),
  validate(userSchema.getUserSchema, "params", true),
  userController.obtenerUsuarioPorId,
);
router.post(
  "/login",
  limiterLogin,
  validate(userSchema.loginSchema),
  userController.loginUsuario,
);
router.get(
  "/usuario/buscar/:estadoId",
  validarJWT,
  validarRol(1),
  validate(userSchema.searchByEstadoSchema, "params", true),
  userController.buscarUsuarios,
);
router.patch(
  "/usuario/:username",
  validarJWT,
  validarRol(1),

  userController.actualizarUsuario,
);
/**router.patch(
  "/usuario/reactivar/:usernameAtivar",
  validarJWT,
  validarRol(1),
  userController.reactivarUsuario
);
**/
router.delete(
  "/usuario/:username",
  validarJWT,
  validarRol(1),
  validate(userSchema.deleteUserSchema, "params", true),
  userController.inactivarUsuario,
);
router.put(
  "/usuario/:username/foto",
  validarJWT,
  validarRol(1),
  userController.actualizarFotoPerfil,
);
export default router;
