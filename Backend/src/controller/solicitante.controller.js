import SolicitanteModel from "../models/solicitante.model.js";
import tipodocumento from "../models/tipodocumento.model.js";

export const crearSolicitante = async (req, res) => {
  try {
    await SolicitanteModel.sync();
    const nuevoSolicitante = await SolicitanteModel.create(req.body);
    res.status(201).json({
      ok: true,
      status: 201,
      message: "Solicitante creado exitosamente",
      body: nuevoSolicitante,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerSolicitantes = async (req, res) => {
  try {
    await SolicitanteModel.sync();
    const solicitantes = await SolicitanteModel.findAll({
      include: [{ model: tipodocumento, as: "TipoDocumento" }],
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Solicitantes",
      body: solicitantes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerSolicitantePorId = async (req, res) => {
  try {
    await SolicitanteModel.sync();
    const { documentoSolicitante } = req.params;
    const solicitante = await SolicitanteModel.findByPk(documentoSolicitante, {
      include: [{ model: tipodocumento, as: "TipoDocumento" }],
    });
    if (solicitante) {
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Mostrando Solicitante",
        body: solicitante,
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Solicitante no encontrado",
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

export const actualizarSolicitante = async (req, res) => {
  try {
    await SolicitanteModel.sync();
    const { documentoSolicitante } = req.params;
    const datosActualizados = req.body;
    const [filasActualizadas] = await SolicitanteModel.update(
      datosActualizados,
      {
        where: { documentoSolicitante: documentoSolicitante },
      },
    );
    if (filasActualizadas === 0) {
      return res.status(404).json({
        message: "Solicitante no encontrado",
        status: 404,
      });
    }
    res.status(200).json({
      message: "Solicitante actualizado exitosamente",
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const eliminarSolicitante = async (req, res) => {
  try {
    await SolicitanteModel.sync();
    const { documentoSolicitante } = req.params;
    const filasEliminadas = await SolicitanteModel.destroy({
      where: { documentoSolicitante: documentoSolicitante },
    });
    if (filasEliminadas === 0) {
      return res.status(404).json({
        message: "Solicitante no encontrado",
        status: 404,
      });
    }
    res.status(200).json({
      message: "Solicitante eliminado exitosamente",
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
