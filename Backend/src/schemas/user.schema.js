import Joi from "joi";

export const createUserSchema = Joi.object({
  tipoDocumentoId: Joi.number().integer().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  numeroDocumento: Joi.string().required(),
  rolesId: Joi.number().integer().required(),
  password: Joi.string().min(6).required(),
  estadoId: Joi.number().default(1),
  primerNombre: Joi.string().min(1).max(20),
  segundoNombre: Joi.string().min(1).max(45).required(),
  primerApellido: Joi.string().min(1).max(30),
  segundoApellido: Joi.string().min(1).max(30).required(),
  telefono: Joi.string().min(7).max(10).required(),
  correoElectronico: Joi.string().email().max(45).required(),
});

export const updateUserSchema = Joi.object({
  tipoDocumentoId: Joi.number().integer().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  numeroDocumento: Joi.string(),
  rolesId: Joi.number().integer(),
  password: Joi.string().min(6),
  estadoId: Joi.number().integer(),
  primerNombre: Joi.string().min(1).max(50),
  segundoNombre: Joi.string().min(1).max(50).allow(null, ""),
  primerApellido: Joi.string().min(1).max(50),
  segundoApellido: Joi.string().min(1).max(50).allow(null, ""),
  telefono: Joi.string().min(7).max(15).allow(null, ""),
  correoElectronico: Joi.string().email().max(100).allow(null, ""),
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

export const deleteUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
});
