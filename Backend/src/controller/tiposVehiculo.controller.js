import tipoVehiculoModel from "../models/tiposVehiculo.model.js";

export const mostrarVehiculos = async (req, res) => {
  try {
    await tipoVehiculoModel.sync();
    const mostrarVehiculos = await tipoVehiculoModel.findAll();
    res.status(200).json({
      message: "Vehiculos",
      status: 200,
      body: mostrarVehiculos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar los tipos de datos",
      status: 500,
      error: error.message,
    });
  }
};

export const mostrarVehiculosporId = async (req, res) => {
  const { idTipoVehiculo } = req.params;
  try {
    await tipoVehiculoModel.sync();
    const mostrarVehiculos = await tipoVehiculoModel.findOne({
      where: { idTipoVehiculo: idTipoVehiculo },
    });
    res.status(200).json({
      message: "Vehiculo encontrado",
      status: 200,
      body: mostrarVehiculos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar el vehiculo",
      status: 500,
      error: error.message,
    });
  }
};
