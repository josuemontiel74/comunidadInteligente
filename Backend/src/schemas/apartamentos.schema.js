import Joi from "joi";

export const createApartamentoSchema = Joi.object({
  numeroApartamento: Joi.string().required(),
  torresId: Joi.number().integer().required(),
  estadoId: Joi.number().integer().required(),
});

export const updateApartamentoSchema = Joi.object({
  numeroApartamento: Joi.string(),
  torresId: Joi.number().integer(),
  estadoId: Joi.number().integer(),
}).min(1);

export const getApartamentoSchema = Joi.object({
  id: Joi.number().integer().required(),
});
