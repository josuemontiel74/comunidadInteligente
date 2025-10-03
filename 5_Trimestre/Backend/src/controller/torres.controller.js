import torresModel from "../models/torres.model.js";

export const crearTorre = async (req, res) => {
  try {
    await torresModel.sync();
    const dataTorre = req.body;
    const createTorre = await torresModel.create({
      idTorre: dataTorre.idTorre,
      nombreTorre: dataTorre.nombreTorre,
    });
    res.status(201).json({
      ok: true,
      status: 201,
      Message: "Torre creada",
      id: createTorre.idTorre,
    });
  } catch (error) {
    return res.status(500).json({
      Message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarTorre = async (req, res) => {
  try {
    await torresModel.sync();
    const mostrarTorre = await torresModel.findAll();
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Torres",
      body: mostrarTorre,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarIdTorre = async (req, res) => {
  try {
    const { idTorre } = req.params;
    await torresModel.sync();

    const torre = await torresModel.findOne({
      where: { idTorre: idTorre },
    });

    if (!torre) {
      return res.status(404).json({
        message: "Torre no encontrada",
        status: 404,
      });
    }

    res.status(200).json({
      message: "Torre encontrada",
      status: 200,
      body: torre,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarTorre = async (req, res) => {
  try {
    await torresModel.sync();

    const { idTorre } = req.params;
    const { nombreTorre } = req.body;

    const torre = await torresModel.findOne({ where: { idTorre } });
    if (!torre) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Torre no encontrada",
      });
    }

    await torresModel.update({ nombreTorre }, { where: { idTorre } });

    const torreActualizada = await torresModel.findOne({ where: { idTorre } });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Torre actualizada exitosamente",
      body: torreActualizada,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const borrarTorre = async (req, res) => {
  try {
    await torresModel.sync();
    const idTorre = req.params.idTorre;
    const borrarTorre = await torresModel.destroy({
      where: {
        idTorre: idTorre,
      },
    });
    res.status(200).json({
      ok: true,
      status: 204,
      message: "Torre eliminada",
      body: borrarTorre,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
