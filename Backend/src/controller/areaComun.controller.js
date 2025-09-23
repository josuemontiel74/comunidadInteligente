import areaComun from "../models/areaComun.model.js";
import Estado from "../models/estados.model.js";

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
    const idAreaComun = req.params.id;
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
    res.status(500).json({
      message: "Error al obtener el área común",
      status: 500,
      error: error.message,
    });
  }
};

export const ActualizarAreaComun = async (req, res) => {
  try {
    await areaComun.sync();
    const idAreaComun = req.params.id;
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
    res.status(200).json({
      message: "Área común actualizada exitosamente",
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el área común",
      status: 500,
      error: error.message,
    });
  }
};
