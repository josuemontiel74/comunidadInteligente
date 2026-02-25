import personasModel from "../models/personas.model.js";
import User from "../models/user.model.js";

// ── Validación de nombres: solo letras, espacios, guiones y apóstrofes ──────
const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-']+$/;
const validarCamposNombre = (campos) => {
  for (const [campo, valor] of Object.entries(campos)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      if (!NOMBRE_REGEX.test(String(valor).trim())) {
        return `El campo "${campo}" no puede contener números ni caracteres especiales`;
      }
    }
  }
  return null;
};

// ── Validación de número de documento por tipo ───────────────────────────────
const contarDigitos = (str) => (str.match(/\d/g) || []).length;
const validarNumeroDocumento = (tipoDocumentoId, numeroDocumento) => {
  if (!numeroDocumento || !numeroDocumento.toString().trim()) return null;
  const doc = numeroDocumento.toString().trim();
  const tipo = parseInt(tipoDocumentoId) || 1;

  // Solo alfanumérico con posibles guiones, sin espacios ni símbolos especiales
  if (!/^[a-zA-Z0-9\-]+$/.test(doc)) {
    return "El número de documento solo puede contener letras, números o guiones";
  }

  const digitos = contarDigitos(doc);

  if (tipo === 1) {
    // CC: solo dígitos, entre 5 y 10
    if (!/^\d+$/.test(doc)) return "La Cédula de Ciudadanía (CC) debe contener solo dígitos";
    if (doc.length < 5 || doc.length > 10) return "La CC debe tener entre 5 y 10 dígitos";
  } else if (tipo === 2) {
    // CE: puede tener letras, mínimo 3 dígitos, 4-15 chars
    if (digitos < 3) return "La Cédula de Extranjería debe contener al menos 3 dígitos";
    if (doc.length < 4 || doc.length > 15) return "La CE debe tener entre 4 y 15 caracteres";
  } else if (tipo === 3) {
    // PP Pasaporte: alfanumérico, mínimo 2 dígitos, 5-12 chars
    if (digitos < 2) return "El Pasaporte debe contener al menos 2 dígitos";
    if (doc.length < 5 || doc.length > 12) return "El Pasaporte debe tener entre 5 y 12 caracteres";
  } else if (tipo === 4 || tipo === 5) {
    // PEP / PPT: alfanumérico, mínimo 2 dígitos
    const nombre = tipo === 4 ? "PEP" : "PPT";
    if (digitos < 2) return `El documento ${nombre} debe contener al menos 2 dígitos`;
    if (doc.length < 4 || doc.length > 20) return `El documento ${nombre} debe tener entre 4 y 20 caracteres`;
  } else {
    // Cualquier otro tipo: al menos un dígito
    if (digitos === 0) return "El número de documento no puede estar compuesto únicamente de letras";
  }

  return null;
};

export const createPersona = async (req, res) => {
  try {
    await personasModel.sync();
    const dataPersona = req.body;

    // Validar número de documento
    const errorDoc = validarNumeroDocumento(dataPersona.tipoDocumentoId, dataPersona.numeroDocumento);
    if (errorDoc) return res.status(400).json({ message: errorDoc, status: 400 });

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
