import Ocupante from "../models/ocupante.model.js";

export const crearOcupante = async (req, res) => {
  try {
    await Ocupante.sync();
    const dataOcupante = req.body;
    const createOcupante = await Ocupante.create({
      apartamentosId: dataOcupante.apartamentosId,
      numeroDocumento: dataOcupante.numeroDocumento,
      tipoOcupacion: dataOcupante.tipoOcupacion,
      personasACargo: dataOcupante.personasACargo,
      fechaInicio: dataOcupante.fechaInicio,
      fechaFin: dataOcupante.fechaFin,
    });
    res.status(201).json(createOcupante);
  } catch (error) {
    res.status(500).json({
      message: "Lo siento, no se pudo registrar el ocupante",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerOcupante = async (req, res) => {
  try {
    const ocupantes = await Ocupante.findAll();
    res.status(200).json(ocupantes);
  } catch (error) {
    res.status(500).json({
      message: "Lo siento, no se pudo obtener la lista de ocupantes",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerOcupantePorId = async (req, res) => {
  try {
    const id = req.params.id;
    const ocupante = await Ocupante.findOne({ where: { IdOcupante: id } });
    if (ocupante) {
      res.status(200).json(ocupante);
    } else {
      res.status(404).json({
        message: "Ocupante no encontrado",
        status: 404,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lo siento, no se pudo obtener el ocupante",
      status: 500,
      error: error.message,
    });
  }
};
export const actualizarOcupante = async (req, res) => {
  try {
    const id = req.params.id;
    const dataOcupante = req.body;
    const [updated] = await Ocupante.update(dataOcupante, {
      where: { IdOcupante: id },
    });
    if (updated) {
      const updatedOcupante = await Ocupante.findOne({
        where: { IdOcupante: id },
      });
      res.status(200).json(updatedOcupante);
    } else {
      res.status(404).json({
        message: "Ocupante no encontrado",
        status: 404,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lo siento, no se pudo actualizar el ocupante",
      status: 500,
      error: error.message,
    });
  }
};
export const eliminarOcupante = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Ocupante.destroy({
      where: { IdOcupante: id },
    });
    if (deleted) {
      res.status(200).json({ message: "Ocupante eliminado", status: 200 });
    } else {
      res.status(404).json({ message: "Ocupante no encontrado", status: 404 });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lo siento, no se pudo eliminar el ocupante",
      status: 500,
      error: error.message,
    });
  }
};
