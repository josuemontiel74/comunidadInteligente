import Joi from "joi";

export const createPersonaSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .required()
    .pattern(/^[a-zA-Z0-9]+$/),
  tipoDocumentoId: Joi.number().integer().required(),
  primerNombre: Joi.string().max(20).required(),
  segundoNombre: Joi.string().max(45),
  primerApellido: Joi.string().max(30).required(),
  segundoApellido: Joi.string().max(30),
  correoElectronico: Joi.string().email().required(),
  telefono: Joi.string().max(10).required(),
});

export const updatePersonaSchema = Joi.object({
  numeroDocumento: Joi.string().max(20),
  tipoDocumentoId: Joi.number().integer(),
  primerNombre: Joi.string().max(20),
  segundoNombre: Joi.string().max(45),
  primerApellido: Joi.string().max(30),
  segundoApellido: Joi.string().max(30),
  correoElectronico: Joi.string().email(),
  telefono: Joi.string().max(10),
}).min(1);

export const getPersonaByIdSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required(),
});

export const deletePersonaSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required(),
});

