import RecepcionPaquetes from "../models/recepcionPaquetes.model";
import Estado from "../models/estados.model.js";
import Apartamento from "../models/apartamentos.model.js";

export const crearRecepcionPaquete = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const nuevoPaquete = await RecepcionPaquetes.create(req.body);
    res.status(201).json({
      ok: true,
      status: 201,
      message: "Paquete creado exitosamente",
      body: nuevoPaquete,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerRecepcionesPaquetes = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const recepcionesPaquetes = await RecepcionPaquetes.findAll({
      include: [Estado, Apartamento],
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Recepciones de Paquetes",
      body: recepcionesPaquetes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerRecepcionPaquetePorId = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const { id } = req.params;
    const recepcionPaquete = await RecepcionPaquetes.findByPk(id, {
      include: [Estado, Apartamento],
    });
    if (recepcionPaquete) {
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Mostrando Recepcion de Paquete",
        body: recepcionPaquete,
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Recepcion de Paquete no encontrado",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarRecepcionPaquete = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const { id } = req.params;
    const [updated] = await RecepcionPaquetes.update(req.body, {
      where: { id: id },
    });
    if (updated) {
      const recepcionPaqueteActualizado = await RecepcionPaquetes.findByPk(id);
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Recepcion de Paquete actualizado exitosamente",
        body: recepcionPaqueteActualizado,
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Recepcion de Paquete no encontrado",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const eliminarRecepcionPaquete = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const { id } = req.params;
    const deleted = await RecepcionPaquetes.destroy({
      where: { id: id },
    });
    if (deleted) {
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Recepcion de Paquete eliminado exitosamente",
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Recepcion de Paquete no encontrado",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
