import Joi from "joi";

export const createUserSchema = Joi.object({
  tipoDocumentoId: Joi.number().integer().required(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  numeroDocumento: Joi.string().required(),
  rolesId: Joi.number().integer().required(),
  password: Joi.string().min(6).required(),
  estadoId: Joi.number().default(1),
  primerNombre: Joi.string().min(1).max(20).pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  segundoNombre: Joi.string().max(45).allow(null, "").optional()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  primerApellido: Joi.string().min(1).max(30).pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  segundoApellido: Joi.string().max(30).allow(null, "").optional()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  telefono: Joi.string().pattern(/^3\d{9}$/).required(),
  correoElectronico: Joi.string().email().max(45).required(),
});

export const updateUserSchema = Joi.object({
  tipoDocumentoId: Joi.number().integer().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  numeroDocumento: Joi.string(),
  rolesId: Joi.number().integer(),
  password: Joi.string().min(6),
  estadoId: Joi.number().integer(),
  primerNombre: Joi.string().min(1).max(50).pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  segundoNombre: Joi.string().min(1).max(50).allow(null, "").pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  primerApellido: Joi.string().min(1).max(50).pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  segundoApellido: Joi.string().min(1).max(50).allow(null, "").pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  telefono: Joi.string().pattern(/^3\d{9}$/).allow(null, ""),
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
