import Joi from "joi";

export const crearVehiculoSchema = Joi.object({
  matricula: Joi.string().alphanum().min(6).max(10).required(),
  tipoVehiculoId: Joi.number().integer().required(),
  codigoParqueadero: Joi.string().alphanum().min(3).max(10).required(),
});

export const actualizarVehiculoSchema = Joi.object({
  matricula: Joi.string().alphanum().min(6).max(10),
  tipoVehiculoId: Joi.number().integer(),
  codigoParqueadero: Joi.string().alphanum().min(3).max(10),
}).min(1);

export const obtenerVehiculoSchema = Joi.object({
  matricula: Joi.string().alphanum().min(6).max(10).required(),
});

export const eliminarVehiculoSchema = Joi.object({
  matricula: Joi.string().alphanum().min(6).max(10).required(),
});
