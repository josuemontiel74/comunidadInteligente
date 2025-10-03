import Joi from "joi";

export const createParqueaderoSchema = Joi.object({
  codigoParqueadero: Joi.string().max(10).required(),
  tipoVehiculoId: Joi.number().integer().min(1).required(),
  estadoId: Joi.number().integer().min(1).required(),
});

export const updateParqueaderoSchema = Joi.object({
  codigoParqueadero: Joi.string().max(10).optional(),
  tipoVehiculoId: Joi.number().integer().min(1).optional(),
  estadoId: Joi.number().integer().min(1).optional(),
});

export const getParqueaderoSchema = Joi.object({
  codigoParqueadero: Joi.string().max(10).required(),
});

export const deleteParqueaderoSchema = Joi.object({
  codigoParqueadero: Joi.string().max(10).required(),
});
