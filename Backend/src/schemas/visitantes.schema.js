import Joi from "joi";

/**
 * Validación condicional de documento según tipo:
 *   - tipoDocumentoId 3 (Pasaporte): alfanumérico, máx 2 letras.
 *   - Resto: solo dígitos.
 */
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

export const crearVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required().custom(validarDocSegunTipo),
  nombreVisitante: Joi.string()
    .min(2)
    .max(100)
    .required()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/)
    .messages({
      "string.pattern.base":
        "El nombre del visitante solo puede contener letras y espacios, sin n\u00fameros ni caracteres especiales.",
    }),
  tipoDocumentoId: Joi.number().integer().min(1).required(),
});

export const actualizarVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .custom(validarDocSegunTipo)
    .optional(),
  nombreVisitante: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  tipoDocumentoId: Joi.number().integer().min(1).optional(),
}).min(1);

export const obtenerVisitantesSchema = Joi.object({
  numeroDocumento: Joi.string()
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/),
});

export const borrarVisitanteSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required(),
});
