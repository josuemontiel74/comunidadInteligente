import VisitanteModel from "../models/visitantes.model.js";

export const crearVisitante = async (req, res) => {
  const { numeroDocumento, tipoDocumentoId, nombreVisitante } = req.body;

  try {
    await VisitanteModel.sync();
    const nuevoVisitante = await VisitanteModel.create({
      numeroDocumento,
      tipoDocumentoId,
      nombreVisitante,
    });
    res.status(201).json(nuevoVisitante);
  } catch (error) {
    res.status(500).json({ error: "Error al crear visitante" });
  }
};

export const obtenerVisitantes = async (req, res) => {
  try {
    await VisitanteModel.sync();
    const visitantes = await VisitanteModel.findAll();
    res.status(200).json(visitantes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener visitantes" });
  }
};

export const obtenerVisitantePorId = async (req, res) => {
  const { numeroDocumento } = req.params;
  try {
    await VisitanteModel.sync();
    const visitante = await VisitanteModel.findOne({
      where: { numeroDocumento: numeroDocumento },
    });
    if (visitante) {
      res.status(200).json(visitante);
    } else {
      res.status(404).json({ error: "Visitante no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener visitante" });
  }
};

export const actualizarVisitante = async (req, res) => {
  const { numeroDocumento } = req.params;
  const { tipoDocumentoId, nombreVisitante } = req.body;
  try {
    await VisitanteModel.sync();
    const visitante = await VisitanteModel.findOne({
      where: { numeroDocumento: numeroDocumento },
    });
    if (visitante) {
      visitante.numeroDocumento = numeroDocumento;
      if (tipoDocumentoId !== undefined) {
        visitante.tipoDocumentoId = tipoDocumentoId;
      }
      visitante.nombreVisitante = nombreVisitante;
      await visitante.save();
      res.status(200).json(visitante);
    } else {
      res.status(404).json({ error: "Visitante no encontrado" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al actualizar visitante", error: error.message });
  }
};

export const eliminarVisitante = async (req, res) => {
  const { numeroDocumento } = req.params;
  try {
    await VisitanteModel.sync();
    const visitante = await VisitanteModel.findOne({
      where: { numeroDocumento: numeroDocumento },
    });
    if (visitante) {
      await visitante.destroy();
      res.status(200).json({ message: "Visitante eliminado" });
    } else {
      res.status(404).json({ error: "Visitante no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar visitante" });
  }
};
