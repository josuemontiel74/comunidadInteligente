import Joi from "joi";

export const createRolSchema = Joi.object({
  nombreRol: Joi.string().min(3).max(45).required(),
});

export const updateRolSchema = Joi.object({
  nombreRol: Joi.string().min(3).max(45),
}).min(1);

export const getRolByIdSchema = Joi.object({
  idRol: Joi.number().integer().positive().required(),
});

export const deleteRolSchema = Joi.object({
  idRol: Joi.number().integer().positive().required(),
});
