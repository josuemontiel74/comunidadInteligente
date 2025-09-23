import Joi from "joi";

export const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  numeroDocumento: Joi.string().required(),
  rolesId: Joi.number().integer().required(),
  password: Joi.string().min(6).required(), 
  estadoId: Joi.number().integer().required(),
});

export const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  numeroDocumento: Joi.string(),
  rolesId: Joi.number().integer(),
  password: Joi.string().min(6),
  estadoId: Joi.number().integer(),
}).min(1);

export const getUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
});

export const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
});

export const searchByEstadoSchema = Joi.object({
  estadoId: Joi.number().integer().required(),
});
