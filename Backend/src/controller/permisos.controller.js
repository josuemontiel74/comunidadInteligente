import permisosModel from "../models/permisos.model.js";

export const crearPermiso = async (req, res) => {
  try {
    await permisosModel.sync();
    const dataPermiso = req.body;
    const createPermiso = await permisosModel.create({
      nombrePermiso: dataPermiso.nombrePermiso,
    });
    res.status(201).json({
      ok: true,
      status: 201,
      Message: "Permiso creado",
      id: createPermiso.idPermiso,
    });
  } catch (error) {
    return res.status(500).json({
      Message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarPermiso = async (req, res) => {
  try {
    await permisosModel.sync();
    const mostrarPermiso = await permisosModel.findAll();
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Permisos",
      body: mostrarPermiso,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarIdPermiso = async (req, res) => {
  try {
    await permisosModel.sync();
    const idPermiso = req.params.idPermiso;
    const mostrarIdPermiso = await permisosModel.findOne({
      where: {
        idPermiso: idPermiso,
      },
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: " Mostrando Id de Permiso",
      body: mostrarIdPermiso,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarPermiso = async (req, res) => {
  try {
    await permisosModel.sync();
    const dataPermiso = req.body;
    const idPermiso = req.params.idPermiso;

    await permisosModel.update(
      { nombrePermiso: dataPermiso.nombrePermiso },
      { where: { idPermiso: idPermiso } }
    );

    const permisoActualizado = await permisosModel.findOne({
      where: { idPermiso: idPermiso },
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Permiso Actualizado",
      body: permisoActualizado,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const borrarPermiso = async (req, res) => {
  try {
    await permisosModel.sync();
    const idPermiso = req.params.idPermiso;
    const borrarPermiso = await permisosModel.destroy({
      where: {
        idPermiso: idPermiso,
      },
    });
    res.status(200).json({
      ok: true,
      status: 204,
      message: "Permiso eliminado",
      body: borrarPermiso,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
