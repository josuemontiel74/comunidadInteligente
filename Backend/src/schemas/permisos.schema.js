import Joi from "joi";

export const createPermisoSchema = Joi.object({
  nombrePermiso: Joi.string().min(3).max(30).required(),
});

export const updatePermisoSchema = Joi.object({
  nombrePermiso: Joi.string().min(3).max(30).optional(),
});

export const getPermisoSchema = Joi.object({
  idPermiso: Joi.number().integer().optional(),
  nombrePermiso: Joi.string().min(3).max(30).optional(),
});

export const deletePermisoSchema = Joi.object({
  idPermiso: Joi.number().integer().required(),
});
