import Joi from "joi";

export const crearTorreSchema = Joi.object({
  nombreTorre: Joi.string().max(15).required(),
});

export const actualizarTorreSchema = Joi.object({
  nombreTorre: Joi.string().max(15).optional(),
});

export const obtenerTorreSchema = Joi.object({
  idTorre: Joi.number().integer().required(),
});

export const borrarTorreSchema = Joi.object({
  idTorre: Joi.number().integer().required(),
});
