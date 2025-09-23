import Visita from "../models/visitas.model.js";
import Visitante from "../models/visitantes.model.js";

export const crearVisita = async (req, res) => {
  try {
    const { numeroDocumento, ...resto } = req.body;

    const visitante = await Visitante.findByPk(numeroDocumento);
    if (!visitante) {
      return res.status(404).json({ error: "Visitante no encontrado" });
    }

    const visita = await Visita.create({ numeroDocumento, ...resto });
    res.status(201).json(visita);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerVisitas = async (req, res) => {
  try {
    await Visita.sync();
    const visitas = await Visita.findAll({ include: Visitante });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Visitas",
      body: visitas,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerVisitaPorId = async (req, res) => {
  try {
    await Visita.sync();
    const idVisita = req.params.id;
    const visita = await Visita.findOne({
      where: { idVisita },
      include: Visitante,
    });
    if (!visita) {
      return res.status(404).json({
        message: "Visita no encontrada",
        status: 404,
      });
    }
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Visita por ID",
      body: visita,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findByPk(id);
    if (!visita) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }
    await visita.update(req.body);
    res.json(visita);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const finalizarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const visita = await Visita.findByPk(id);
    if (!visita) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }
    await visita.update({ estadoId: 9 });
    res.json({ message: "Visita finalizada correctamente", visita });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
