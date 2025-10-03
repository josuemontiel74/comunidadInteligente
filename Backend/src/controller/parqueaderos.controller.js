import ParqueaderoModel from "../models/parqueaderos.model.js";
import TipoVehiculoModel from "../models/tiposVehiculo.model.js";
import EstadoModel from "../models/estados.model.js";

export const createParqueadero = async (req, res) => {
  try {
    const { codigoParqueadero, tipoVehiculoId, estadoId } = req.body;

    if (!codigoParqueadero || !tipoVehiculoId || !estadoId) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
        status: 400,
      });
    }

    const tipoVehiculo = await TipoVehiculoModel.findOne({
      where: { idTipoVehiculo: tipoVehiculoId }, // Ajuste aquí
    });

    if (!tipoVehiculo) {
      return res.status(404).json({
        message: "Tipo de vehículo no encontrado",
        status: 404,
      });
    }

    const estado = await EstadoModel.findOne({
      where: { idEstado: estadoId },
    });

    if (!estado) {
      return res.status(404).json({
        message: "Estado no encontrado",
        status: 404,
      });
    }

    const parqueaderoExistente = await ParqueaderoModel.findOne({
      where: { codigoParqueadero },
    });
    if (parqueaderoExistente) {
      return res.status(409).json({
        message: "El parqueadero ya existe",
        status: 409,
      });
    }

    const newParqueadero = await ParqueaderoModel.create({
      codigoParqueadero,
      tipoVehiculoId,
      estadoId,
    });

    return res.status(201).json({
      message: "Parqueadero creado correctamente",
      status: 201,
      data: newParqueadero,
    });
  } catch (error) {
    console.error("Error creando parqueadero:", error);
    return res.status(500).json({
      message: "Algo salió mal, no se pudo crear el parqueadero",
      status: 500,
      error: error.message,
    });
  }
};

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
  const { codigoParqueadero } = req.params;
  try {
    await ParqueaderoModel.sync();
    const mostraParqueaderos = await ParqueaderoModel.findOne({
      where: { codigoParqueadero: codigoParqueadero },
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

export const actualizarParqueadero = async (req, res) => {
  const { codigoParqueadero } = req.params;
  const { nuevoCodigoParqueadero, tipoVehiculoId, estadoId } = req.body;

  try {
    const parqueadero = await ParqueaderoModel.findOne({
      where: { codigoParqueadero },
    });

    if (!parqueadero) {
      return res.status(404).json({
        message: "Parqueadero no encontrado",
        status: 404,
      });
    }

    if (nuevoCodigoParqueadero && nuevoCodigoParqueadero !== codigoParqueadero) {
      const existente = await ParqueaderoModel.findOne({
        where: { codigoParqueadero: nuevoCodigoParqueadero },
      });
      if (existente) {
        return res.status(409).json({
          message: "El nuevo código de parqueadero ya existe",
          status: 409,
        });
      }
      parqueadero.codigoParqueadero = nuevoCodigoParqueadero;
    }

    if (tipoVehiculoId) {
      const tipoVehiculo = await TipoVehiculoModel.findOne({
        where: { idTipoVehiculo: tipoVehiculoId },
      });

      if (!tipoVehiculo) {
        return res.status(404).json({
          message: "Tipo de vehículo no encontrado",
          status: 404,
        });
      }

      parqueadero.tipoVehiculoId = tipoVehiculoId;
    }

    if (estadoId) {
      const estado = await EstadoModel.findOne({
        where: { idEstado: estadoId },
      });

      if (!estado) {
        return res.status(404).json({
          message: "Estado no encontrado",
          status: 404,
        });
      }

      parqueadero.estadoId = estadoId;
    }

    await parqueadero.save();

    return res.status(200).json({
      message: "Parqueadero actualizado correctamente",
      status: 200,
      data: parqueadero,
    });
  } catch (error) {
    console.error("Error actualizando parqueadero:", error);
    return res.status(500).json({
      message: "Algo salió mal, no se pudo actualizar el parqueadero",
      status: 500,
      error: error.message,
    });
  }
};

export const eliminarParqueadero = async (req, res) => {
  const { codigoParqueadero } = req.params;
  try {
    await ParqueaderoModel.sync();
    const parqueadero = await ParqueaderoModel.findOne({
      where: { codigoParqueadero: codigoParqueadero },
    });
    if (!parqueadero) {
      return res.status(404).json({
        message: "Parqueadero no encontrado",
        status: 404,
        body: null,
      });
    }
    await parqueadero.destroy();
    res.status(200).json({
      message: "Parqueadero eliminado",
      status: 200,
      body: parqueadero,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede eliminar el parqueadero",
      status: 500,
      body: error.message,
    });
  }
};
