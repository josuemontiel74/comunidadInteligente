import Vehiculo from "../models/vehiculo.model.js";
import TipoVehiculo from "../models/tiposVehiculo.model.js";
import Parqueaderos from "../models/parqueaderos.model.js";

export const crearVehiculo = async (req, res) => {
  try {
    const { matricula, tipoVehiculoId, codigoParqueadero } = req.body;

    const tipo = await TipoVehiculo.findByPk(tipoVehiculoId);
    if (!tipo) {
      return res.status(400).json({ error: "Tipo de vehiculo no existe" });
    }

    const parqueadero = await Parqueaderos.findByPk(codigoParqueadero);
    if (!parqueadero) {
      return res.status(400).json({ error: "Parqueadero no existe" });
    }

    const vehiculo = await Vehiculo.create({
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
    });

    res.status(201).json(vehiculo);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al crear vehiculo", detalle: error.message });
  }
};

export const obtenerVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({
      include: [
        { model: TipoVehiculo, as: "tiposVehiculo" },
        { model: Parqueaderos, as: "Parqueadero" },
      ],
    });

    res.json(vehiculos);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener vehiculos", detalle: error.message });
  }
};

export const obtenerVehiculo = async (req, res) => {
  try {
    const { matricula } = req.params;

    const vehiculo = await Vehiculo.findByPk(matricula, {
      include: [
        { model: TipoVehiculo, as: "tiposVehiculo" },
        { model: Parqueaderos, as: "Parqueadero" },
      ],
    });

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehiculo no encontrado" });
    }

    res.json(vehiculo);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener vehiculo", detalle: error.message });
  }
};

export const actualizarVehiculo = async (req, res) => {
  try {
    const { matricula } = req.params;
    const { tipoVehiculoId, codigoParqueadero } = req.body;

    const vehiculo = await Vehiculo.findByPk(matricula);
    if (!vehiculo) {
      return res.status(404).json({ error: "Vehiculo no encontrado" });
    }

    if (tipoVehiculoId) {
      const tipo = await TipoVehiculo.findByPk(tipoVehiculoId);
      if (!tipo) {
        return res.status(400).json({ error: "Tipo de vehiculo no existe" });
      }
    }

    if (codigoParqueadero) {
      const parqueadero = await Parqueaderos.findByPk(codigoParqueadero);
      if (!parqueadero) {
        return res.status(400).json({ error: "Parqueadero no existe" });
      }
    }

    await vehiculo.update({ tipoVehiculoId, codigoParqueadero });

    res.json(vehiculo);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al actualizar vehiculo", detalle: error.message });
  }
};

export const eliminarVehiculo = async (req, res) => {
  try {
    const { matricula } = req.params;

    const vehiculo = await Vehiculo.findByPk(matricula);
    if (!vehiculo) {
      return res.status(404).json({ error: "Vehiculo no encontrado" });
    }

    await vehiculo.destroy();

    res.json({ mensaje: "Vehiculo eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al eliminar vehiculo", detalle: error.message });
  }
};
