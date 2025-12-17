import Joi from "joi";

export const createOcupanteSchema = Joi.object({
  apartamentosId: Joi.number().integer().required(),
  numeroDocumento: Joi.string().max(20).required(),
  tipoOcupacion: Joi.string().valid("propietario", "arrendatario").required(),
  personasACargo: Joi.number().integer().max(4).optional().allow(null),
  fechaInicio: Joi.date().required(),
  fechaFin: Joi.date().optional().allow(null),
  estadoId: Joi.number().integer().optional().allow(null),
  tieneNinos: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneAdultoMayor: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneDiscapacidad: Joi.number().integer().valid(0, 1).optional().allow(null),
  tipoDocumentoId: Joi.number().integer().optional().allow(null),
  primerNombre: Joi.string().max(20).optional().allow(null),
  segundoNombre: Joi.string().max(45).optional().allow(null),
  primerApellido: Joi.string().max(30).optional().allow(null),
  segundoApellido: Joi.string().max(30).optional().allow(null),
  correoElectronico: Joi.string().email().optional().allow(null),
  telefono: Joi.string().max(10).optional().allow(null),
});

export const updateOcupanteSchema = Joi.object({
  apartamentosId: Joi.number().integer().optional(),
  numeroDocumento: Joi.string().max(20).optional(),
  tipoOcupacion: Joi.string().valid("propietario", "arrendatario").optional(),
  personasACargo: Joi.number().integer().optional().allow(null),
  fechaInicio: Joi.date().optional(),
  fechaFin: Joi.date().optional().allow(null),
  estadoId: Joi.number().integer().optional().allow(null),
  tieneNinos: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneAdultoMayor: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneDiscapacidad: Joi.number().integer().valid(0, 1).optional().allow(null),
  tipoDocumentoId: Joi.number().integer().optional().allow(null),
  primerNombre: Joi.string().max(20).optional().allow(null),
  segundoNombre: Joi.string().max(45).optional().allow(null),
  primerApellido: Joi.string().max(30).optional().allow(null),
  segundoApellido: Joi.string().max(30).optional().allow(null),
  correoElectronico: Joi.string().email().optional().allow(null),
  telefono: Joi.string().max(10).optional().allow(null),
}).min(1);

export const getOcupanteSchema = Joi.object({
  idOcupante: Joi.number().integer().required(),
});

export const deleteOcupanteSchema = Joi.object({
  idOcupante: Joi.number().integer().required(),
});
