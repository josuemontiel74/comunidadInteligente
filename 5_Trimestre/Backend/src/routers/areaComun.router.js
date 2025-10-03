import { Router } from "express";
import * as areaComunController from "../controller/areaComun.controller.js";
import { validarJWT, validarRol } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/user.middleware.js";
import * as areaComun from "../schemas/areaComun.schema.js";

const router = Router();

router.get(
  "/areaComunes",
  validarJWT,
  validarRol(1),
  validate(areaComun.getAreaComunSchema),
  areaComunController.ObtenerAreasComunes
);
router.get(
  "/areaComunes/:idAreaComun",
  validarJWT,
  validarRol(1),
  validate(areaComun.getAreaComunSchema, "params", true),
  areaComunController.ObtenerAreasComunesPorId
);
router.patch(
  "/areaComunes/:idAreaComun",
  validarJWT,
  validarRol(1),
  validate(areaComun.updateAreaComunSchema, "body", true),
  areaComunController.ActualizarAreaComun
);

router.delete(
  "/areaComunes/:idAreaComun",
  validarJWT,
  validarRol(1),
  validate(areaComun.deleteAreaComunSchema, "params", true),
  areaComunController.EliminarAreaComun
);

export default router;
