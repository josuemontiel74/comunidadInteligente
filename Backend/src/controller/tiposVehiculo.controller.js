import tipoVehiculoModel from "../models/tiposVehiculo.model.js";

export const mostraVehiculos = async (req, res) => {
  try {
    await tipoVehiculoModel.sync();
    const mostraVehiculos = await tipoVehiculoModel.findAll();
    res.status(200).json({
      message: "Vehiculos",
      status: 200,
      body: mostraVehiculos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar los tipos de datos",
      status: 500,
      error: error.message,
    });
  }
};

export const mostraVehiculosporId = async (req, res) => {
  const { id } = req.params;
  try {
    await tipoVehiculoModel.sync();
    const mostraVehiculos = await tipoVehiculoModel.findOne({
      where: { idTipoVehiculo: id },
    });
    res.status(200).json({
      message: "Vehiculo encontrado",
      status: 200,
      body: mostraVehiculos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar el vehiculo",
      status: 500,
      error: error.message,
    });
  }
};
