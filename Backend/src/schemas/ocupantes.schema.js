import Joi from "joi";

const NOMBRE_PATTERN = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/;

const validarDocSegunTipo = (value, helpers) => {
  const tipoId = helpers.state.ancestors[0]?.tipoDocumentoId;
  if (Number(tipoId) === 3) {
    if (!/^[A-Za-z]{0,2}\d+$/.test(value))
      return helpers.message(
        "El pasaporte debe tener máximo 2 letras seguidas de dígitos.",
      );
  } else if (!/^\d+$/.test(value)) {
    return helpers.message(
      "El número de documento debe contener solo dígitos.",
    );
  }
  return value;
};

export const createOcupanteSchema = Joi.object({
  apartamentosId: Joi.number().integer().required(),
  numeroDocumento: Joi.string().max(20).required().custom(validarDocSegunTipo),
  tipoOcupacion: Joi.string().valid("propietario", "arrendatario").required(),
  personasACargo: Joi.number().integer().max(4).optional().allow(null),
  fechaInicio: Joi.date().required(),
  fechaFin: Joi.date().optional().allow(null),
  estadoId: Joi.number().integer().optional().allow(null),
  tieneNinos: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneAdultoMayor: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneDiscapacidad: Joi.number().integer().valid(0, 1).optional().allow(null),
  tipoDocumentoId: Joi.number().integer().optional().allow(null),
  primerNombre: Joi.string()
    .max(20)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  segundoNombre: Joi.string()
    .max(45)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  primerApellido: Joi.string()
    .max(30)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  segundoApellido: Joi.string()
    .max(30)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  correoElectronico: Joi.string().email().optional().allow(null),
  telefono: Joi.string().max(10).optional().allow(null),
});

export const updateOcupanteSchema = Joi.object({
  apartamentosId: Joi.number().integer().optional(),
  numeroDocumento: Joi.string().max(20).optional().custom(validarDocSegunTipo),
  tipoOcupacion: Joi.string().valid("propietario", "arrendatario").optional(),
  personasACargo: Joi.number().integer().optional().allow(null),
  fechaInicio: Joi.date().optional(),
  fechaFin: Joi.date().optional().allow(null),
  estadoId: Joi.number().integer().optional().allow(null),
  tieneNinos: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneAdultoMayor: Joi.number().integer().valid(0, 1).optional().allow(null),
  tieneDiscapacidad: Joi.number().integer().valid(0, 1).optional().allow(null),
  tipoDocumentoId: Joi.number().integer().optional().allow(null),
  primerNombre: Joi.string()
    .max(20)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  segundoNombre: Joi.string()
    .max(45)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  primerApellido: Joi.string()
    .max(30)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  segundoApellido: Joi.string()
    .max(30)
    .optional()
    .allow(null)
    .pattern(NOMBRE_PATTERN),
  correoElectronico: Joi.string().email().optional().allow(null),
  telefono: Joi.string().max(10).optional().allow(null),
}).min(1);

export const getOcupanteSchema = Joi.object({
  idOcupante: Joi.number().integer().required(),
});

export const deleteOcupanteSchema = Joi.object({
  idOcupante: Joi.number().integer().required(),
});
