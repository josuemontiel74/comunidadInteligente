import Joi from "joi";


export const crearRecepcionPaquete = Joi.object({
  apartamentoId: Joi.number().integer().required(),
  nombreDestinatario: Joi.string().max(100).required(),
  empresaMensajeria: Joi.string().max(45).required(),
  fechaRecepcion: Joi.date().required(),
  fechaEntrega: Joi.date().optional().allow(null),
  observaciones: Joi.string().optional().allow(null),
  estadoId: Joi.number().integer().optional(),
});

export const actualizarRecepcionPaquete = Joi.object({
  idPaquete: Joi.number().integer().optional(),
  apartamentoId: Joi.number().integer().optional(),
  nombreDestinatario: Joi.string().max(100).optional(),
  empresaMensajeria: Joi.string().max(45).optional(),
  fechaRecepcion: Joi.date().optional(),
  fechaEntrega: Joi.date().optional().allow(null),
  observaciones: Joi.string().optional().allow(null),
  estadoId: Joi.number().integer().optional(),
});

export const obtenerRecepcionPaquetePorId = Joi.object({
  idPaquete: Joi.number().integer().required(),
});

export const eliminarRecepcionPaquete = Joi.object({
  idPaquete: Joi.number().integer().required(),
});
