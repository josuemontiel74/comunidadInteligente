import Joi from "joi";

export const crearReservarAreasSchema = Joi.object({
  apartamentoId: Joi.number().integer().required(),
  areaComunId: Joi.number().integer().required(),
  fechaReserva: Joi.date().required(),
  horaInicio: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .required(),
  horaFin: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .required(),
  motivoReserva: Joi.string().max(100).required(),
  cantidadAsistentes: Joi.number().integer().required(),
  invitadosExternos: Joi.boolean().required(),
  aceptaReglamento: Joi.boolean().required(),
  estadoId: Joi.number().integer().optional(),
  documentoSolicitante: Joi.string()
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required(),
  nombreSolicitante: Joi.string().max(100).optional(),
  telefonoSolicitante: Joi.string().max(20).optional(),
  correoSolicitante: Joi.string().email().max(100).optional(),
  tipoDocumentoId: Joi.number().integer().optional(),
});

export const actualizarReservarAreasSchema = Joi.object({
  apartamentoId: Joi.number().integer().optional(),
  areaComunId: Joi.number().integer().optional(),
  fechaReserva: Joi.date().optional(),
  horaInicio: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .optional(),
  horaFin: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .optional(),
  motivoReserva: Joi.string().max(100).optional(),
  cantidadAsistentes: Joi.number().integer().optional(),
  invitadosExternos: Joi.boolean().optional(),
  aceptaReglamento: Joi.boolean().optional(),
  estadoId: Joi.number().integer().optional(),
  documentoSolicitante: Joi.string()
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/)
    .optional(),
  nombreSolicitante: Joi.string().max(100).optional(),
  telefonoSolicitante: Joi.string().max(20).optional(),
  correoSolicitante: Joi.string().email().max(100).optional(),
  tipoDocumentoId: Joi.number().integer().optional(),
});

export const obtenerReservarAreasSchema = Joi.object({
  idReservas: Joi.number().integer().required(),
});

export const eliminarReservarAreasSchema = Joi.object({
  idReservas: Joi.number().integer().required(),
});
