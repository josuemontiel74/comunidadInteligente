import dayjs from "dayjs";
import RecepcionPaquetes from "../models/recepcionPaquetes.model.js";
import Estado from "../models/estados.model.js";
import Apartamento from "../models/apartamentos.model.js";
import { sequelize } from "../config/connect.db.js";
import { fn, col, where } from "sequelize";
export const crearRecepcionPaquete = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const ahora = dayjs();

    let fechaRecepcion = req.body.fechaRecepcion
      ? dayjs(req.body.fechaRecepcion, "YYYY-MM-DD HH:mm", true)
      : ahora;

    if (!fechaRecepcion.isValid()) {
      return res
        .status(400)
        .json({ error: "La fecha de recepción no es válida" });
    }

    // Permitir fechas con diferencia de hasta 5 minutos hacia atrás (por latencia de red)
    const cincoMinutosAtras = ahora.subtract(5, "minute");
    if (fechaRecepcion.isBefore(cincoMinutosAtras)) {
      return res.status(400).json({
        error: "La fecha de recepción no puede ser anterior a la actual",
      });
    }

    if (fechaRecepcion.year() > 2100) {
      return res.status(400).json({
        error: "El año de la fecha de recepción no puede ser mayor a 2100",
      });
    }

    const dataPaquete = {
      ...req.body,
      estadoId: 14,
      fechaRecepcion: fechaRecepcion.format("YYYY-MM-DD HH:mm"),
    };

    const nuevoPaquete = await RecepcionPaquetes.create(dataPaquete);

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Paquete creado exitosamente",
      body: nuevoPaquete,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerRecepcionPaquetesSQL = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        r.idPaquete,
        r.nombreDestinatario,
        a.numeroApartamento,
        t.nombreTorre,
        r.empresaMensajeria,
        r.fechaRecepcion,
        r.fechaEntrega,
        r.observaciones,
        e.nombreEstado
      FROM recepcionpaquetes r
      JOIN apartamentos a ON r.apartamentoId = a.idApartamento
      JOIN torres t ON a.torresId = t.idTorre
      JOIN estados e ON r.estadoId = e.idEstado
    `);

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los paquetes" });
  }
};

export const obtenerRecepcionesPaquetes = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const recepcionesPaquetes = await RecepcionPaquetes.findAll({
      include: [Estado, Apartamento],
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Recepciones de Paquetes",
      body: recepcionesPaquetes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerRecepcionPaquetePorId = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const { idPaquete } = req.params;
    const recepcionPaquete = await RecepcionPaquetes.findByPk(idPaquete, {
      include: [Estado, Apartamento],
    });
    if (recepcionPaquete) {
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Mostrando Recepcion de Paquete",
        body: recepcionPaquete,
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Recepcion de Paquete no encontrado",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarRecepcionPaquete = async (req, res) => {
  try {
    await RecepcionPaquetes.sync();
    const { idPaquete } = req.params;
    const datosActualizacion = {};

    // Validar y agregar apartamentoId si se proporciona
    if (req.body.apartamentoId !== undefined) {
      const apartamentoExiste = await Apartamento.findByPk(
        req.body.apartamentoId
      );
      if (!apartamentoExiste) {
        return res.status(400).json({
          error: "El apartamento especificado no existe",
        });
      }
      datosActualizacion.apartamentoId = req.body.apartamentoId;
    }

    // Validar y agregar fechaRecepcion si se proporciona
    if (req.body.fechaRecepcion) {
      const fecha = dayjs(req.body.fechaRecepcion, "YYYY-MM-DD HH:mm", true);

      if (!fecha.isValid()) {
        return res
          .status(400)
          .json({ error: "La fecha de recepción no es válida" });
      }

      if (fecha.year() > 2100) {
        return res.status(400).json({
          error: "El año de la fecha de recepción no puede ser mayor a 2100",
        });
      }

      datosActualizacion.fechaRecepcion = fecha.format("YYYY-MM-DD HH:mm");
    }

    // Agregar los demás campos opcionales
    if (req.body.nombreDestinatario !== undefined) {
      datosActualizacion.nombreDestinatario = req.body.nombreDestinatario;
    }
    if (req.body.empresaMensajeria !== undefined) {
      datosActualizacion.empresaMensajeria = req.body.empresaMensajeria;
    }
    if (req.body.fechaEntrega !== undefined) {
      datosActualizacion.fechaEntrega = req.body.fechaEntrega;
    }
    if (req.body.observaciones !== undefined) {
      datosActualizacion.observaciones = req.body.observaciones;
    }
    if (req.body.estadoId !== undefined) {
      datosActualizacion.estadoId = req.body.estadoId;
    }

    const [updated] = await RecepcionPaquetes.update(datosActualizacion, {
      where: { idPaquete },
    });

    if (updated) {
      const recepcionPaqueteActualizado = await RecepcionPaquetes.findOne({
        where: { idPaquete },
      });

      res.status(200).json({
        ok: true,
        status: 200,
        message: "Recepción de Paquete actualizado exitosamente",
        body: recepcionPaqueteActualizado,
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Recepción de Paquete no encontrado",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};

export const FinalizarRecepcionPaquete = async (req, res) => {
  try {
    const { idPaquete } = req.params;
    const paquete = await RecepcionPaquetes.findByPk(idPaquete);

    if (!paquete) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Recepcion de Paquete no encontrado",
      });
    }
    await paquete.update({ estadoId: 15 });

    await paquete.update({
      fechaEntrega: dayjs().format("YYYY-MM-DD HH:mm"),
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Recepcion de Paquete finalizado exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      status: 500,
      message: "Algo salió mal en la petición :(",
      error: error.message,
    });
  }
};
// informacion
export const paqueteDelDia = async(req,res)=>{
  try {
     const paqueteDia = await RecepcionPaquetes.count({
      where: where(fn("Date",col("fechaRecepcion")),"=",fn("CURDATE"))
     })
     res.status(200).json({
      ok:true,
      paqueteDia
     })
  } catch (error) {
    console.log("Ocurrio un erro a la hora de trea la informacion",error.message);
  }
}