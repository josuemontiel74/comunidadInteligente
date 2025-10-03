import Joi from "joi";

export const getTipoDocumentosSchema = Joi.object({
  idTipoDocumento: Joi.number().integer().min(1),
});
