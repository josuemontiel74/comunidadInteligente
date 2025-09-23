import Vehiculo from "../models/vehiculo.model";

export const mostraVehiculos = async (req, res) => {
  try {
    await Vehiculo.sync();
    const mostraVehiculos = await Vehiculo.findAll();
    res.status(200).json({
      message: "Vehiculos",
      status: 200,
      body: mostraVehiculos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar los vehiculos",
      status: 500,
      body: error.message,
    });
  }
};

export const mostraVehiculosporId = async (req, res) => {
  const { id } = req.params;
  try {
    await Vehiculo.sync();
    const mostraVehiculos = await Vehiculo.findOne({
      where: { idVehiculo: id },
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
      body: error.message,
    });
  }
};
