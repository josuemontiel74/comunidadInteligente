import ParqueaderoModel from "../models/parqueaderos.model.js";

export const mostraParqueaderos = async (req, res) => {
  try {
    await ParqueaderoModel.sync();
    const mostraParqueaderos = await ParqueaderoModel.findAll();
    res.status(200).json({
      message: "Parqueaderos",
      status: 200,
      body: mostraParqueaderos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar los parqueaderos",
      status: 500,
      body: error.message,
    });
  }
};
export const mostraParqueaderosporId = async (req, res) => {
  const { id } = req.params;
  try {
    await ParqueaderoModel.sync();
    const mostraParqueaderos = await ParqueaderoModel.findOne({
      where: { idParqueadero: id },
    });
    res.status(200).json({
      message: "Parqueadero encontrado",
      status: 200,
      body: mostraParqueaderos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar el parqueadero",
      status: 500,
      body: error.message,
    });
  }
};
