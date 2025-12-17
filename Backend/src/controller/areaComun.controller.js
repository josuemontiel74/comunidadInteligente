import areaComun from "../models/areaComun.model.js";
import Estado from "../models/estados.model.js";
import { registrarAuditoria } from "../services/auditorias.service.js";
import { registrarFallo } from "../services/logger.service.js";

export const CrearAreaComun = async (req, res) => {
  const usuarioActual = req.user?.username || "desconocido";

  try {
    await areaComun.sync();
    const nuevosDatos = req.body;
    const nuevaAreaComun = await areaComun.create(nuevosDatos, {
      include: [Estado],
    });

    // Registrar en auditoría
    await registrarAuditoria(
      usuarioActual,
      "areascomunes",
      "INSERT",
      nuevaAreaComun.idAreaComun
    );

    res.status(201).json({
      message: "Área común creada exitosamente",
      status: 201,
      data: nuevaAreaComun,
    });
  } catch (error) {
    const ruta = "POST /areascomunes";
    await registrarFallo(
      "ERROR",
      usuarioActual,
      ruta,
      error.message,
      error.stack
    );

    res.status(500).json({
      message: "Error al crear el área común",
      status: 500,
      error: error.message,
    });
  }
};

export const ObtenerAreasComunes = async (req, res) => {
  try {
    await areaComun.sync();
    const listaAreasComunes = await areaComun.findAll({
      include: [Estado],
    });
    res.status(200).json({
      message: "Lista de áreas comunes",
      status: 200,
      data: listaAreasComunes,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /areascomunes";
    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      message: "Error al obtener la lista de áreas comunes",
      status: 500,
      error: error.message,
    });
  }
};

export const ObtenerAreasComunesPorId = async (req, res) => {
  try {
    await areaComun.sync();
    const idAreaComun = req.params.idAreaComun;
    const areaComunEncontrada = await areaComun.findByPk(idAreaComun, {
      include: [Estado],
    });
    if (!areaComunEncontrada) {
      return res.status(404).json({
        message: "Área común no encontrada",
        status: 404,
      });
    }
    res.status(200).json({
      message: "Área común encontrada",
      status: 200,
      data: areaComunEncontrada,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /areascomunes/:id";
    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      message: "Error al obtener el área común",
      status: 500,
      error: error.message,
    });
  }
};

export const ActualizarAreaComun = async (req, res) => {
  const idAreaComun = req.params.idAreaComun;
  const usuarioActual = req.user?.username || "desconocido";

  try {
    await areaComun.sync();
    const datosActualizados = req.body;
    const [filasActualizadas] = await areaComun.update(datosActualizados, {
      where: { idAreaComun: idAreaComun },
    });
    if (filasActualizadas === 0) {
      return res.status(404).json({
        message: "Área común no encontrada",
        status: 404,
      });
    }

    // Registrar en auditoría
    await registrarAuditoria(
      usuarioActual,
      "areascomunes",
      "UPDATE",
      idAreaComun
    );

    res.status(200).json({
      message: "Área común actualizada exitosamente",
      status: 200,
    });
  } catch (error) {
    const ruta = "PATCH /areascomunes/:id";
    await registrarFallo(
      "ERROR",
      usuarioActual,
      ruta,
      error.message,
      error.stack
    );

    res.status(500).json({
      message: "Error al actualizar el área común",
      status: 500,
      error: error.message,
    });
  }
};

export const EliminarAreaComun = async (req, res) => {
  const idAreaComun = req.params.idAreaComun;
  const usuarioActual = req.user?.username || "desconocido";

  try {
    await areaComun.sync();
    const filasEliminadas = await areaComun.destroy({
      where: { idAreaComun: idAreaComun },
    });
    if (filasEliminadas === 0) {
      return res.status(404).json({
        message: "Área común no encontrada",
        status: 404,
      });
    }

    // Registrar en auditoría
    await registrarAuditoria(
      usuarioActual,
      "areascomunes",
      "DELETE",
      idAreaComun
    );

    res.status(200).json({
      message: "Área común eliminada exitosamente",
      status: 200,
    });
  } catch (error) {
    const ruta = "DELETE /areascomunes/:id";
    await registrarFallo(
      "ERROR",
      usuarioActual,
      ruta,
      error.message,
      error.stack
    );

    res.status(500).json({
      message: "Error al eliminar el área común",
      status: 500,
      error: error.message,
    });
  }
};
