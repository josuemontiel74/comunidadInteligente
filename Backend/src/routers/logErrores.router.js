import { Router } from "express";
import {
  obtenerLogErrores,
  obtenerResumenLogErrores,
  limpiarLogErrores,
} from "../controller/logErrores.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";

const router = Router();

// Solo superAdministrador (rolesId = 1)
router.get("/log-errores", validarJWT, validarRol(1), obtenerLogErrores);

router.get(
  "/log-errores/resumen",
  validarJWT,
  validarRol(1),
  obtenerResumenLogErrores,
);

router.delete(
  "/log-errores/limpiar",
  validarJWT,
  validarRol(1),
  limpiarLogErrores,
);

export default router;
