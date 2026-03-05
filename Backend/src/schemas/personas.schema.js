import Joi from "joi";

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

export const createPersonaSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required().custom(validarDocSegunTipo),
  tipoDocumentoId: Joi.number().integer().required(),
  primerNombre: Joi.string()
    .max(20)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/)
    .required(),
  segundoNombre: Joi.string()
    .max(45)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  primerApellido: Joi.string()
    .max(30)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/)
    .required(),
  segundoApellido: Joi.string()
    .max(30)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  correoElectronico: Joi.string().email().required(),
  telefono: Joi.string()
    .pattern(/^3\d{9}$/)
    .required(),
});

export const updatePersonaSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).custom(validarDocSegunTipo),
  tipoDocumentoId: Joi.number().integer(),
  primerNombre: Joi.string()
    .max(20)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  segundoNombre: Joi.string()
    .max(45)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  primerApellido: Joi.string()
    .max(30)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  segundoApellido: Joi.string()
    .max(30)
    .pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/),
  correoElectronico: Joi.string().email(),
  telefono: Joi.string().pattern(/^3\d{9}$/),
}).min(1);

export const getPersonaByIdSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required(),
});

export const deletePersonaSchema = Joi.object({
  numeroDocumento: Joi.string().max(20).required(),
});
