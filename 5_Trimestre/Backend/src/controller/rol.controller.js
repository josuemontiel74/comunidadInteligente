import rolModel from "../models/rol.model.js";

export const crearRol = async (req, res) => {
  try {
    await rolModel.sync();
    const dataRole = req.body;
    const createRole = await rolModel.create({
      nombreRol: dataRole.nombreRol,
    });
    res.status(201).json({
      ok: true,
      status: 201,
      Message: "Rol creado",
      id: createRole.idRol,
    });
  } catch (error) {
    return res.status(500).json({
      Message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarRol = async (req, res) => {
  try {
    await rolModel.sync();
    const mostrarRol = await rolModel.findAll();
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrar Rol",
      body: mostrarRol,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarIdRol = async (req, res) => {
  try {
    await rolModel.sync();
    const idRol = req.params.id;
    const mostrarIdRol = await rolModel.findOne({
      where: {
        idRol: idRol,
      },
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: " Mostrando Id Rol",
      body: mostrarIdRol,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarRol = async (req, res) => {
  try {
    await rolModel.sync();
    const dataRol = req.body;
    const idRol = req.params.id;

    await rolModel.update(
      { nombreRol: dataRol.nombreRol },
      { where: { idRol: idRol } }
    );

    const rolActualizado = await rolModel.findOne({ where: { idRol: idRol } });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Rol Actualizado",
      body: rolActualizado,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const borrarRol = async (req, res) => {
  try {
    await rolModel.sync();
    const idRol = req.params.id;
    const borrarRol = await rolModel.destroy({
      where: {
        idRol: idRol,
      },
    });
    res.status(200).json({
      ok: true,
      status: 204,
      message: "Rol eliminado",
      body: borrarRol,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
