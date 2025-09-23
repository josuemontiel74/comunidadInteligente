import reservasAreasModel from "../models/reservasAreas.model.js";
import areasModel from "../models/areas.model.js";
import solicitantesModel from "../models/solicitantes.model.js";

export const CrearReservaArea = async (req, res) => {
  try {
    await reservasAreasModel.sync();
    const nuevaReservaArea = await reservasAreasModel.create(req.body);
    res.status(201).json(nuevaReservaArea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const ObtenerReservasAreas = async (req, res) => {
  try {
    await reservasAreasModel.sync();
    const reservasAreas = await reservasAreasModel.findAll({
      include: [
        { model: areasModel, as: "area" },
        { model: solicitantesModel, as: "solicitante" },
      ],
    });
    res.json(reservasAreas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const ObtenerReservaAreaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    await reservasAreasModel.sync();
    const reservaArea = await reservasAreasModel.findByPk(id, {
      include: [
        { model: areasModel, as: "area" },
        { model: solicitantesModel, as: "solicitante" },
      ],
    });
    if (reservaArea) {
      res.json(reservaArea);
    } else {
      res.status(404).json({ message: "Reserva de área no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const ActualizarReservaArea = async (req, res) => {
  try {
    const { id } = req.params;
    await reservasAreasModel.sync();
    const [updated] = await reservasAreasModel.update(req.body, {
      where: { id },
    });
    if (updated) {
      const updatedReservaArea = await reservasAreasModel.findByPk(id);
      res.json(updatedReservaArea);
    } else {
      res.status(404).json({ message: "Reserva de área no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const EliminarReservaArea = async (req, res) => {
  try {
    const { id } = req.params;
    await reservasAreasModel.sync();
    const deleted = await reservasAreasModel.destroy({
      where: { id },
    });
    if (deleted) {
      res.json({ message: "Reserva de área eliminada" });
    } else {
      res.status(404).json({ message: "Reserva de área no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
