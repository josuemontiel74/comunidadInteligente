import estadosModel from "../models/estados.model.js";
export const createEstado = async (req, res) => {
  try {
    await estadosModel.sync();
    const dataEstado = req.body;
    const createEstado = await estadosModel.create({
      IdEstado: dataEstado.IdEstado,
      nombreEstado: dataEstado.nombreEstado,
    });
    res.status(201).json({
      message: "El estado fue registrado exitisamnete",
      estatus: 201,
      data: createEstado.IdEstado,
    });
  } catch (error) {
    res.status(500).json({
      message: "lo siento no se pude registrar el estado",
      status: 500,
      error: error.message,
    });
  }
};
export const getAllEstados = async (req, res) => {
  try {
    await estadosModel.sync();
    const listEstados = await estadosModel.findAll();
    res.status(200).json({
      message: "Lista de personas",
      estatus: 200,
      body: listEstados,
    });
  } catch (error) {
    res.status(500).json({
      message: "lo siento no se pude obtener la lista de estados",
      status: 500,
      error: error.message,
    });
  }
};
export const getAllEstadosID = async (req, res) => {
  try {
    await estadosModel.sync();
    const IdEstado = req.params.idEstado;
    const listEstados = await estadosModel.findAll({
      where: { idEstado: IdEstado },
    });
    res.status(200).json({
      message: "Lista de estados",
      estatus: 200,
      body: listEstados,
    });
  } catch (error) {
    res.status(500).json({
      message: "lo siento no se pude obtener la lista de estados",
      status: 500,
      error: error.message,
    });
  }
};
export const UpdateEstado = async (req, res) => {
  try {
    const IDestado = req.params.idEstado;
    const dataEstado = req.body;

    await estadosModel.update(
      {
        idEstado: dataEstado.idEstado,
        nombreEstado: dataEstado.nombreEstado,
      },
      { where: { idEstado: IDestado } },
    );

    const estadoActualizado = await estadosModel.findOne({
      where: { idEstado: IDestado },
    });

    res.status(200).json({
      message: "El estado fue actualizado exitosamente",
      status: 200,
      body: estadoActualizado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar", error: error.message });
  }
};

export const EliminarEstado = async (req, res) => {
  try {
    const IdEstado = req.params.idEstado;

    const eliminar = await estadosModel.destroy({
      where: { idEstado: IdEstado },
    });

    if (eliminar === 0) {
      return res.status(404).json({
        message: "No se encontró el estado con ese ID",
        status: 404,
      });
    }

    res.status(200).json({
      message: "La eliminación del estado fue exitosa",
      status: 200,
      body: eliminar,
    });
  } catch (error) {
    res.status(500).json({
      message: "No se pudo hacer la eliminación",
      status: 500,
      error: error.message,
    });
  }
};
