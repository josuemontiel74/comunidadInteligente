import Joi from "joi";

export const crearSolicitanteSchema = Joi.object({
  documentoSolicitante: Joi.string().max(20).required(),
  nombreSolicitante: Joi.string().max(100).required(),
  telefonoSolicitante: Joi.string().max(20).required(),
  correoSolicitante: Joi.string().email().required(),
  tipoDocumentoId: Joi.number().integer().required(),
});

export const actualizarSolicitanteSchema = Joi.object({
  nombreSolicitante: Joi.string().max(100).optional(),
  telefonoSolicitante: Joi.string().max(20).optional(),
  correoSolicitante: Joi.string().email().optional(),
  tipoDocumentoId: Joi.number().integer().optional(),
});

export const obtenerSolicitantePorIdSchema = Joi.object({
  documentoSolicitante: Joi.string().max(20).required(),
});

export const eliminarSolicitanteSchema = Joi.object({
  documentoSolicitante: Joi.string().max(20).required(),
});
