import personasModel from "../models/personas.model.js";
import User from "../models/user.model.js";
import {
  validarCamposNombre,
  validarTelefono,
  validarNumeroDocumento,
} from "../utils/validaciones.js";

export const createPersona = async (req, res) => {
  try {
    await personasModel.sync();
    const dataPersona = req.body;

    // Validar número de documento
    const errorDoc = validarNumeroDocumento(
      dataPersona.tipoDocumentoId,
      dataPersona.numeroDocumento,
    );
    if (errorDoc)
      return res.status(400).json({ message: errorDoc, status: 400 });

    // Validar teléfono
    const errorTel = validarTelefono(dataPersona.telefono);
    if (errorTel)
      return res.status(400).json({ message: errorTel, status: 400 });

    // Validar que los nombres no contengan números
    const errorNombre = validarCamposNombre({
      "Primer nombre": dataPersona.primerNombre,
      "Segundo nombre": dataPersona.segundoNombre,
      "Primer apellido": dataPersona.primerApellido,
      "Segundo apellido": dataPersona.segundoApellido,
    });
    if (errorNombre) {
      return res.status(400).json({ message: errorNombre, status: 400 });
    }

    const createPersona = await personasModel.create({
      numeroDocumento: dataPersona.numeroDocumento,
      tipoDocumentoId: dataPersona.tipoDocumentoId,
      primerNombre: dataPersona.primerNombre,
      segundoNombre: dataPersona.segundoNombre,
      primerApellido: dataPersona.primerApellido,
      segundoApellido: dataPersona.segundoApellido,
      telefono: dataPersona.telefono,
      correoElectronico: dataPersona.correoElectronico,
    });
    res.status(201).json({
      message: "La persona fue registrada exitosamente",
      estatus: 201,
      data: createPersona.numeroDocumento,
    });
  } catch (error) {
    res.status(500).json({
      message: "lo siento no se pude registrar la persona",
      status: 500,
      error: error.message,
    });
  }
};
export const getAllPersonas = async (req, res) => {
  try {
    await personasModel.sync();
    const listPersonas = await personasModel.findAll();
    res.status(200).json({
      message: "Lista de personas",
      estatus: 200,
      body: listPersonas,
    });
  } catch (error) {
    res.status(500).json({
      message: "lo siento no se pude obtener la lista de personas",
      status: 500,
      error: error.message,
    });
  }
};
export const getAllPersonasID = async (req, res) => {
  try {
    await personasModel.sync();

    const numeroDocumento = req.params.numeroDocumento;

    if (!numeroDocumento) {
      return res.status(400).json({
        message: "El numeroDocumento es obligatorio",
        status: 400,
      });
    }

    const listPersonas = await personasModel.findOne({
      where: { numeroDocumento: numeroDocumento },
    });

    if (!listPersonas) {
      return res.status(404).json({
        message: "No se encontró ninguna persona con ese número de documento",
        status: 404,
      });
    }

    res.status(200).json({
      message: "Lista de personas",
      status: 200,
      body: listPersonas,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lo siento no se pudo obtener la lista de personas",
      status: 500,
      error: error.message,
    });
  }
};

export const UpdatePersona = async (req, res) => {
  try {
    const numeroDocumento = req.params.numeroDocumento; // la ruta debe ser /personas/:numeroDocumento
    const data = req.body;

    if (!numeroDocumento) {
      return res
        .status(400)
        .json({ message: "El numeroDocumento es obligatorio" });
    }

    // Validar que los nombres no contengan números
    const errorNombre = validarCamposNombre({
      "Primer nombre": data.primerNombre,
      "Segundo nombre": data.segundoNombre,
      "Primer apellido": data.primerApellido,
      "Segundo apellido": data.segundoApellido,
    });
    if (errorNombre) {
      return res.status(400).json({ message: errorNombre, status: 400 });
    }

    // Validar teléfono
    const errorTelUpd = validarTelefono(data.telefono);
    if (errorTelUpd)
      return res.status(400).json({ message: errorTelUpd, status: 400 });

    // Actualizar solo los campos editables (numeroDocumento no se toca)
    const [updated] = await personasModel.update(
      {
        tipoDocumentoId: data.tipoDocumentoId,
        primerNombre: data.primerNombre,
        segundoNombre: data.segundoNombre,
        primerApellido: data.primerApellido,
        segundoApellido: data.segundoApellido,
        telefono: data.telefono,
        correoElectronico: data.correoElectronico,
        estadoId: data.estadoId ?? null,
      },
      { where: { numeroDocumento } },
    );

    if (updated === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró la persona para actualizar" });
    }

    // Consultar la persona ya actualizada
    const personaActualizada = await personasModel.findOne({
      where: { numeroDocumento },
    });

    // Si se mandó estadoId, sincronizar en usuarios
    if (data.estadoId) {
      await User.update(
        { estadoId: data.estadoId },
        { where: { personaId: personaActualizada.id } },
      );
    }

    res.status(200).json({
      message: "Actualización exitosa",
      data: personaActualizada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar persona",
      error: error.errors ? error.errors.map((e) => e.message) : error.message,
    });
  }
};

export const deletePersona = async (req, res) => {
  try {
    const numeroDocumento = req.params.numeroDocumento;

    if (!numeroDocumento) {
      return res
        .status(400)
        .json({ message: "El numeroDocumento es obligatorio" });
    }

    const deleted = await personasModel.destroy({
      where: { numeroDocumento },
    });

    if (deleted === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró la persona para eliminar" });
    }

    res
      .status(200)
      .json({ message: "Persona y usuarios eliminados exitosamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar persona",
      error: error.message,
    });
  }
};
