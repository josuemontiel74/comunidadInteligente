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

export const crearSolicitanteSchema = Joi.object({
  documentoSolicitante: Joi.string()
    .max(20)
    .required()
    .custom(validarDocSegunTipo),
  nombreSolicitante: Joi.string()
    .max(100)
    .required()
    .pattern(NOMBRE_PATTERN)
    .messages({
      "string.pattern.base":
        "El nombre solo puede contener letras, espacios y guiones.",
    }),
  telefonoSolicitante: Joi.string().max(20).required(),
  correoSolicitante: Joi.string().email().required(),
  tipoDocumentoId: Joi.number().integer().required(),
});

export const actualizarSolicitanteSchema = Joi.object({
  nombreSolicitante: Joi.string().max(100).optional().pattern(NOMBRE_PATTERN),
  telefonoSolicitante: Joi.string().max(20).optional(),
  correoSolicitante: Joi.string().email().optional(),
  tipoDocumentoId: Joi.number().integer().optional(),
});

export const obtenerSolicitantePorIdSchema = Joi.object({
  documentoSolicitante: Joi.string().max(20).required(),
});

export const eliminarSolicitanteSchema = Joi.object({
  documentoSolicitante: Joi.string().max(20).required(),
});
