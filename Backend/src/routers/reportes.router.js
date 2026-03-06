import { Router } from "express";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import {
  obtenerReporteParqueaderos,
  obtenerReporteVisitas,
  obtenerReportePaquetes,
  obtenerReporteReservas,
  obtenerReporteConsolidado,
  obtenerReporteOcupacion,
  obtenerReporteNinos,
  obtenerReportePoblacionEspecial,
  obtenerReporteUsuarios,
} from "../controller/reportes.controller.js";

const router = Router();

router.get(
  "/parqueaderos",
  validarJWT,
  validarRol(1, 2, 3),
  obtenerReporteParqueaderos,
);
router.get("/visitas", validarJWT, validarRol(1, 2, 3), obtenerReporteVisitas);
router.get(
  "/paquetes",
  validarJWT,
  validarRol(1, 2, 3),
  obtenerReportePaquetes,
);
router.get(
  "/reservas",
  validarJWT,
  validarRol(1, 2, 3),
  obtenerReporteReservas,
);
router.get(
  "/consolidado",
  validarJWT,
  validarRol(1, 2, 3),
  obtenerReporteConsolidado,
);

router.get(
  "/residentes/ocupacion",
  validarJWT,
  validarRol(1, 2, 3),
  obtenerReporteOcupacion,
);
router.get(
  "/residentes/ninos",
  validarJWT,
  validarRol(1, 2, 3),
  obtenerReporteNinos,
);
router.get(
  "/residentes/poblacion-especial",
  validarJWT,
  validarRol(1, 2, 3),
  obtenerReportePoblacionEspecial,
);

router.get("/usuarios", validarJWT, validarRol(1), obtenerReporteUsuarios);

router.get("/usuarios", validarJWT, validarRol(1), obtenerReporteUsuarios);

export default router;
