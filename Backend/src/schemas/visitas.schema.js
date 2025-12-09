import Joi from "joi";

export const crearVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .required()
    .pattern(/^[a-zA-Z0-9]+$/),
  nombreVisitante: Joi.string().min(10).max(100).optional(),
  tipoDocumentoId: Joi.number().integer().min(1).optional(),
  apartamentoId: Joi.number().integer().min(1).required(),
  fechaHoraIngreso: Joi.date().required(),
  fechaHoraSalida: Joi.date().optional(),
  estadoId: Joi.number().integer().min(1).optional(),
  observaciones: Joi.string().max(255).allow("", null).optional(),
  tipoVehiculoId: Joi.number().integer().min(1).allow(null, "").optional(),
  matricula: Joi.string().alphanum().min(6).max(10).allow("", null).optional(),
  codigoParqueadero: Joi.string()
    .alphanum()
    .min(3)
    .max(10)
    .allow("", null)
    .optional(),
});

export const obtenerVisitasSchema = Joi.object({
  idVisita: Joi.number().integer().min(1).optional(),
});

export const actualizarVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/),
  nombreVisitante: Joi.string().min(10).max(100).optional(),
  tipoDocumentoId: Joi.number().integer().min(1).optional(),
  apartamentoId: Joi.number().integer().min(1).optional(),
  fechaHoraIngreso: Joi.date().optional(),
  fechaHoraSalida: Joi.date().optional(),
  estadoId: Joi.number().integer().min(1).optional(),
  tipoVehiculoId: Joi.number().integer().min(1).allow(null, "").optional(),
  codigoParqueadero: Joi.string()
    .alphanum()
    .min(3)
    .max(10)
    .allow("", null)
    .optional(),
  observaciones: Joi.string().max(255).allow("", null).optional(),
  matricula: Joi.string().alphanum().min(6).max(10).allow("", null).optional(),
});

export const finalizarVisitaSchema = Joi.object({
  idVisita: Joi.number().integer().min(1).required(),
});
