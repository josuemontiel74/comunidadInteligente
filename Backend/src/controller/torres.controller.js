import torresModel from "../models/torres.model.js";

export const crearTorre = async (req, res) => {
  try {
    await torresModel.sync();
    const dataTorre = req.body;
    const createTorre = await torresModel.create({
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
    await torresModel.sync();
    const idTorre = (Torre = await torresModel.findOne({
      where: {
        idTorre: idTorre,
      },
    }));

    res.status(200).json({
      ok: true,
      status: 200,
      message: " Mostrando Id de Torres",
      body: mostrarIdPTorres,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarTorre = async (req, res) => {
  try {
    await torresModel.sync();
    const dataTorre = req.body;
    const idTorre = req.params.id;

    await torresModel.update(
      { nombreTorre: dataTorre.nombreTorre },
      { where: { idTorre: idTorre } }
    );

    const torreActualizada = await torresModel.findOne({
      where: { idTorre: idTorre },
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Torres Actualizadas",
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
    const idTorre = req.params.id;
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
