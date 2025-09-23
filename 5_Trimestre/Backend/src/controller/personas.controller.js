import personasModel from "../models/personas.model.js";
import User from "../models/user.model.js";
export const createPersona = async (req, res) => {
  try {
    await personasModel.sync();
    const dataPersona = req.body;
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
    const IDpersonas = req.params.id;

    const listPersonas = await personasModel.findAll({
      where: { numeroDocumento: IDpersonas },
    });

    if (listPersonas.length === 0) {
      return res.status(404).json({
        message: "No se encontró ninguna persona con ese número de documento",
        status: 404,
      });
    }

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

export const UpdatePersona = async (req, res) => {
  try {
    const IDpersonas = req.params.id;
    const data = req.body;

    const updated = await personasModel.update(
      {
        numeroDocumento: data.numeroDocumento,
        tipoDocumentoId: data.tipoDocumentoId,
        primerNombre: data.primerNombre,
        segundoNombre: data.segundoNombre,
        primerApellido: data.primerApellido,
        segundoApellido: data.segundoApellido,
        telefono: data.telefono,
        correoElectronico: data.correoElectronico,
        estadoId: data.estadoId ?? undefined,
      },
      { where: { numeroDocumento: IDpersonas } }
    );

    if (updated[0] === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró la persona para actualizar" });
    }

    const personaActualizada = await personasModel.findOne({
      where: { numeroDocumento: data.numeroDocumento },
    });

    if (data.estadoId) {
      await User.update(
        { estadoId: data.estadoId },
        { where: { personaId: personaActualizada.id } }
      );
    }

    res.status(200).json({
      message: "Actualización exitosa",
      data: personaActualizada,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar", error: error.message });
  }
};

export const EliminarPersona = async (req, res) => {
  try {
    await personasModel.sync();
    const numeroDocumento = req.params.id;
    const EliminarPersona = await personasModel.destroy({
      where: { numeroDocumento: numeroDocumento },
    });

    res.status(200).json({
      message: "La eliminacion de  la persona fue exitosa",
      status: 200,
      body: EliminarPersona,
    });
  } catch (error) {
    res.status(500).json({
      message: "No se pudo hacer la eliminacion de la persona",
      status: 500,
      error: error.meessage,
    });
  }
};
