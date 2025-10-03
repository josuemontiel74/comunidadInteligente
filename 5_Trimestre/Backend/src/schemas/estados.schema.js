import Joi from "joi";

export const createEstadoSchema = Joi.object({
  nombreEstado: Joi.string().max(20).required(),
});

export const getEstadoSchema = Joi.object({
  idEstado: Joi.number().integer().required(),
});

export const updateEstadoSchema = Joi.object({
  nombreEstado: Joi.string().max(20).optional(),
});

export const deleteEstadoSchema = Joi.object({
  idEstado: Joi.number().integer().required(),
});
