import Joi from "joi";

export const crearRolesPermisosSchema = Joi.object({
  idRol: Joi.number().integer().required(),
  idPermiso: Joi.number().integer().required(),
}).required();

export const eliminarRolesPermisosSchema = Joi.object({
  idRol: Joi.number().integer().required(),
  idPermiso: Joi.number().integer().required(),
}).required();

export const obtenerPermisosPorRolSchema = Joi.object({
  idRol: Joi.number().integer().required(),
}).required();

export const actualizarRolesPermisosSchema = Joi.object({
  idRol: Joi.number().integer().required(),
  idPermiso: Joi.number().integer().required(),
}).required();
