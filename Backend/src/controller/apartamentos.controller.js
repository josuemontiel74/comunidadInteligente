import apartamentosModel from "../models/apartamentos.model.js";
import torresModel from "../models/torres.model.js";
import estadosModel from "../models/estados.model.js";

export const crearApartamento = async (req, res) => {
  try {
    await apartamentosModel.sync();
    const dataApartamento = req.body;
    const createApartamento = await apartamentosModel.create({
      numeroApartamento: dataApartamento.numeroApartamento,
      torresId: dataApartamento.torresId,
      estadoId: dataApartamento.estadoId,
    });
    res.status(201).json({
      ok: true,
      status: 201,
      Message: "Apartamento creado",
      id: createApartamento.idApartamento,
    });
  } catch (error) {
    return res.status(500).json({
      Message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarApartamento = async (req, res) => {
  try {
    await apartamentosModel.sync();
    const mostrarApartamento = await apartamentosModel.findAll({
      include: [
        { model: torresModel, attributes: ["idTorre", "nombreTorre"] },
        { model: estadosModel, attributes: ["IdEstado", "nombreEstado"] },
      ],
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Apartamentos",
      body: mostrarApartamento,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarIdApartamento = async (req, res) => {
  try {
    await apartamentosModel.sync();
    const idApartamento = req.params.idApartamento;
    const mostrarIdApartamento = await apartamentosModel.findOne({
      where: {
        idApartamento: idApartamento,
      },
      include: [
        { model: torresModel, attributes: ["idTorre", "nombreTorre"] },
        { model: estadosModel, attributes: ["IdEstado", "nombreEstado"] },
      ],
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: " Mostrando Id de Apartamento",
      body: mostrarIdApartamento,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarApartamento = async (req, res) => {
  try {
    await apartamentosModel.sync();
    const dataApartamento = req.body;
    const idApartamento = req.params.idApartamento;
    await apartamentosModel.update(
      {
        numeroApartamento: dataApartamento.numeroApartamento,
        torresId: dataApartamento.torresId,
        estadoId: dataApartamento.estadoId,
      },
      { where: { idApartamento: idApartamento } }
    );
    const apartamentoActualizado = await apartamentosModel.findOne({
      where: { idApartamento: idApartamento },
      include: [
        { model: torresModel, attributes: ["idTorre", "nombreTorre"] },
        { model: estadosModel, attributes: ["IdEstado", "nombreEstado"] },
      ],
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Apartamento actualizado",
      body: apartamentoActualizado,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const eliminarApartamento = async (req, res) => {
  try {
    await apartamentosModel.sync();
    const idApartamento = req.params.idApartamento;
    await apartamentosModel.destroy({
      where: { idApartamento: idApartamento },
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Apartamento eliminado",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
