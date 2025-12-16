import Joi from "joi";

export const crearVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .required()
    .pattern(/^[a-zA-Z0-9]+$/),
  nombreVisitante: Joi.string().min(10).max(100).required(),
  tipoDocumentoId: Joi.number().integer().min(1).required(),
});

export const actualizarVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/)
    .optional(),
  nombreVisitante: Joi.string().min(10).max(100).optional(),
  tipoDocumentoId: Joi.number().integer().min(1).optional(),
}).min(1);

export const obtenerVisitantesSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/),
});

export const borrarVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required(),
});
