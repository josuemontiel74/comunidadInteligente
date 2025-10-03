import Joi from "joi";

export const crearAreaComunSchema = Joi.object({
  nombreArea: Joi.string().max(45).required(),
  descripcion: Joi.string().allow(null, "").optional(),
  capacidad: Joi.number().integer().required(),
  estadoId: Joi.number().integer().required(),
});

export const getAreaComunSchema = Joi.object({
  idAreaComun: Joi.number().integer().required(),
});

export const updateAreaComunSchema = Joi.object({
  nombreArea: Joi.string().max(45),
  descripcion: Joi.string().allow(null, ""),
  capacidad: Joi.number().integer(),
  estadoId: Joi.number().integer(),
}).min(1);

export const deleteAreaComunSchema = Joi.object({
  idAreaComun: Joi.number().integer().required(),
});
