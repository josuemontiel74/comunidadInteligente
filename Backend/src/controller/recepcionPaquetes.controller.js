import dayjs from "dayjs";
import { fn, col, literal, where, Op } from "sequelize";
import RecepcionPaquetes from "../models/recepcionPaquetes.model.js";
import Estado from "../models/estados.model.js";
import Apartamento from "../models/apartamentos.model.js";
import { sequelize } from "../config/connect.db.js";
import { registrarAuditoria } from "../services/auditorias.service.js";
import { registrarFallo } from "../services/logger.service.js";
import {
  ESTADO_PAQUETE,
  USUARIO_DESCONOCIDO,
  AÑO_MAXIMO,
} from "../utils/constantes.js";

/** Columnas que se copian directamente de req.body si están presentes */
const CAMPOS_OPCIONALES_PAQUETE = [
  "nombreDestinatario",
  "empresaMensajeria",
  "fechaEntrega",
  "observaciones",
  "estadoId",
];

/** Atributos compartidos por todos los grupos del informe */
const atributosBaseInforme = () => [
  [fn("YEAR", col("fechaRecepcion")), "anio"],
  [fn("COUNT", col("idPaquete")), "recibidos"],
  [
    literal(
      `SUM(CASE WHEN estadoId = ${ESTADO_PAQUETE.RECIBIDO} THEN 1 ELSE 0 END)`,
    ),
    "pendientes",
  ],
  [
    literal(
      `SUM(CASE WHEN estadoId = ${ESTADO_PAQUETE.ENTREGADO} THEN 1 ELSE 0 END)`,
    ),
    "entregados",
  ],
];

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

    if (fechaRecepcion.year() > AÑO_MAXIMO) {
      return res.status(400).json({
        error: `El año de la fecha de recepción no puede ser mayor a ${AÑO_MAXIMO}`,
      });
    }

    const dataPaquete = {
      ...req.body,
      estadoId: ESTADO_PAQUETE.RECIBIDO,
      fechaRecepcion: fechaRecepcion.format("YYYY-MM-DD HH:mm"),
    };

    const nuevoPaquete = await RecepcionPaquetes.create(dataPaquete);

    // Registrar en auditoría
    const usuarioActual = req.user?.username || USUARIO_DESCONOCIDO;
    await registrarAuditoria(
      usuarioActual,
      "recepcionpaquetes",
      "INSERT",
      nuevoPaquete.idPaquete,
    );

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Paquete creado exitosamente",
      body: nuevoPaquete,
    });
  } catch (error) {
    const username = req.user?.username || USUARIO_DESCONOCIDO;
    const ruta = "POST /recepcionpaquetes";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

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
    const username = req.user?.username || USUARIO_DESCONOCIDO;
    const ruta = "GET /recepcionpaquetes";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

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
    const username = req.user?.username || USUARIO_DESCONOCIDO;
    const ruta = "GET /recepcionpaquetes";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

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
    if (!recepcionPaquete) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Recepcion de Paquete no encontrado",
      });
    }
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Recepcion de Paquete",
      body: recepcionPaquete,
    });
  } catch (error) {
    const username = req.user?.username || USUARIO_DESCONOCIDO;
    const ruta = "GET /recepcionpaquetes/:id";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

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
        req.body.apartamentoId,
      );
      if (!apartamentoExiste) {
        return res.status(400).json({
          error: "El apartamento especificado no existe",
        });
      }
      datosActualizacion.apartamentoId = req.body.apartamentoId;
    }

    if (req.body.fechaRecepcion) {
      const fecha = dayjs(req.body.fechaRecepcion, "YYYY-MM-DD HH:mm", true);

      if (!fecha.isValid()) {
        return res
          .status(400)
          .json({ error: "La fecha de recepción no es válida" });
      }

      if (fecha.year() > AÑO_MAXIMO) {
        return res.status(400).json({
          error: `El año de la fecha de recepción no puede ser mayor a ${AÑO_MAXIMO}`,
        });
      }

      datosActualizacion.fechaRecepcion = fecha.format("YYYY-MM-DD HH:mm");
    }

    // Agregar campos opcionales presentes en el body
    for (const campo of CAMPOS_OPCIONALES_PAQUETE) {
      if (req.body[campo] !== undefined)
        datosActualizacion[campo] = req.body[campo];
    }

    const [updated] = await RecepcionPaquetes.update(datosActualizacion, {
      where: { idPaquete },
    });

    if (updated) {
      const recepcionPaqueteActualizado = await RecepcionPaquetes.findOne({
        where: { idPaquete },
      });

      // Registrar en auditoría
      const usuarioActual = req.user?.username || USUARIO_DESCONOCIDO;
      await registrarAuditoria(
        usuarioActual,
        "recepcionpaquetes",
        "UPDATE",
        idPaquete,
      );

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
    const username = req.user?.username || USUARIO_DESCONOCIDO;
    const ruta = "PATCH /recepcionpaquetes/:id";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

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
    await paquete.update({
      estadoId: ESTADO_PAQUETE.ENTREGADO,
      fechaEntrega: dayjs().format("YYYY-MM-DD HH:mm"),
    });

    // Registrar en auditoría
    const usuarioActual = req.user?.username || USUARIO_DESCONOCIDO;
    await registrarAuditoria(
      usuarioActual,
      "recepcionpaquetes",
      "DELETE",
      idPaquete,
    );

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Recepcion de Paquete finalizado exitosamente",
    });
  } catch (error) {
    const username = req.user?.username || USUARIO_DESCONOCIDO;
    const ruta = "DELETE /recepcionpaquetes/:id";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    return res.status(500).json({
      ok: false,
      status: 500,
      message: "Algo salió mal en la petición :(",
      error: error.message,
    });
  }
};
// informacion
export const paqueteDelDia = async (req, res) => {
  try {
    const paqueteDia = await RecepcionPaquetes.count({
      where: where(fn("Date", col("fechaRecepcion")), "=", fn("CURDATE")),
    });
    res.status(200).json({
      ok: true,
      paqueteDia,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener visitas del día" });
  }
};

export const informePaqueteria = async (req, res) => {
  try {
    const reportPor = Number.parseInt(req.params.por, 10);
    const rango = req.body.rango || req.body;
    let { fechaInicio, fechaFin } = rango;

    if (!fechaInicio || !fechaFin) {
      return res
        .status(400)
        .json({ msg: "Las fechas de inicio y fin son obligatorias." });
    }
    const dateInicio = new Date(fechaInicio);
    const dateFin = new Date(fechaFin);

    if (Number.isNaN(dateInicio.getTime()) || Number.isNaN(dateFin.getTime())) {
      return res.status(400).json({ msg: "Formato de fecha inválido." });
    }

    // Corregir orden de fechas si están invertidas
    if (dateInicio > dateFin) {
      [fechaInicio, fechaFin] = [fechaFin, fechaInicio];
    } else {
      fechaInicio = dateInicio.toISOString().split("T")[0];
      fechaFin = dateFin.toISOString().split("T")[0];
    }

    const queryConfig = {
      where: {
        fechaRecepcion: {
          [Op.between]: [fechaInicio, fechaFin],
        },
      },

      raw: true,
    };

    let informepaqueteria;
    switch (reportPor) {
      case 1:
        informepaqueteria = await RecepcionPaquetes.findAll({
          attributes: atributosBaseInforme(),
          ...queryConfig,
          group: [fn("YEAR", col("fechaRecepcion"))],
          order: [[fn("YEAR", col("fechaRecepcion")), "ASC"]],
        });
        break;

      case 2:
        informepaqueteria = await RecepcionPaquetes.findAll({
          attributes: [
            ...atributosBaseInforme(),
            [fn("MONTH", col("fechaRecepcion")), "mes"],
          ],
          ...queryConfig,
          group: [
            fn("YEAR", col("fechaRecepcion")),
            fn("MONTH", col("fechaRecepcion")),
          ],
          order: [
            [fn("YEAR", col("fechaRecepcion")), "ASC"],
            [fn("MONTH", col("fechaRecepcion")), "ASC"],
          ],
        });
        break;

      case 3:
        informepaqueteria = await RecepcionPaquetes.findAll({
          attributes: [
            ...atributosBaseInforme(),
            [fn("MONTH", col("fechaRecepcion")), "mes"],
            [
              literal(`FLOOR((DAYOFMONTH(fechaRecepcion) - 1) / 7) + 1`),
              "semana",
            ],
          ],
          ...queryConfig,
          group: [
            fn("YEAR", col("fechaRecepcion")),
            fn("MONTH", col("fechaRecepcion")),
            "semana",
          ],
          order: [
            [fn("YEAR", col("fechaRecepcion")), "ASC"],
            [fn("MONTH", col("fechaRecepcion")), "ASC"],
            ["semana", "ASC"],
          ],
        });
        break;

      default:
        return res
          .status(400)
          .json({ msg: `El parámetro 'por' (${reportPor}) no es válido.` });
    }

    return res.status(200).json({
      ok: true,
      informe: informepaqueteria,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      msg: "Lo siento, ocurrió un error al procesar el informe.",
      error: error.message,
    });
  }
};
