import Joi from "joi";

export const getTipoVehiculoSchema = Joi.object({
  idTipoVehiculo: Joi.number().integer().min(1),
});
