import Joi from "joi";

export const crearRecepcionPaquete = Joi.object({
  apartamentoId: Joi.number().integer().required(),
  nombreDestinatario: Joi.string()
    .max(100)
    .required()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/)
    .messages({
      "string.pattern.base": "El nombre del destinatario solo puede contener letras y espacios.",
    }),
  empresaMensajeria: Joi.string()
    .max(45)
    .required()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s'.,-]+$/)
    .messages({
      "string.pattern.base": "El nombre de la transportadora no puede contener caracteres especiales.",
    }),
  fechaRecepcion: Joi.date().required(),
  fechaEntrega: Joi.date().optional().allow(null),
  observaciones: Joi.string().optional().allow(null, ""),
  estadoId: Joi.number().integer().optional(),
});

export const actualizarRecepcionPaquete = Joi.object({
  idPaquete: Joi.number().integer().optional(),
  apartamentoId: Joi.number().integer().optional(),
  nombreDestinatario: Joi.string()
    .max(100)
    .optional()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  empresaMensajeria: Joi.string()
    .max(45)
    .optional()
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s'.,-]+$/),
  fechaRecepcion: Joi.date().optional(),
  fechaEntrega: Joi.date().optional().allow(null),
  observaciones: Joi.string().optional().allow(null, ""),
  estadoId: Joi.number().integer().optional(),
});

export const obtenerRecepcionPaquetePorId = Joi.object({
  idPaquete: Joi.number().integer().required(),
});

export const eliminarRecepcionPaquete = Joi.object({
  idPaquete: Joi.number().integer().required(),
});
