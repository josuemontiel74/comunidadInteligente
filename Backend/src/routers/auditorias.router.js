import { Router } from "express";
import { obtenerRegistrosAuditoria } from "../controller/auditorias.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";

const router = Router();

// Ruta protegida: solo superAdministrador (rolesId = 1) puede acceder
router.get(
  "/auditoria",
  validarJWT,
  validarRol(1), // 1 = superAdministrador
  obtenerRegistrosAuditoria
);

export default router;
