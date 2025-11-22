import reservasAreasModel from "../models/reservasAreas.model.js";
import areasModel from "../models/areaComun.model.js";
import solicitantesModel from "../models/solicitante.model.js";
import dayjs from "dayjs";
import Apartamento from "../models/apartamentos.model.js";
import Estado from "../models/estados.model.js";
import { sequelize } from "../config/connect.db.js";

export const CrearReservaArea = async (req, res) => {
  try {
    await reservasAreasModel.sync();
    await solicitantesModel.sync();

    const dataReserva = req.body;

    const hoy = dayjs().startOf("day");
    const fechaReserva = dayjs(dataReserva.fechaReserva).startOf("day");

    if (fechaReserva.isBefore(hoy)) {
      return res.status(400).json({
        message: "No se puede crear una reserva en el pasado",
        status: 400,
      });
    }

    const [solicitante, created] = await solicitantesModel.findOrCreate({
      where: { documentoSolicitante: dataReserva.documentoSolicitante },
      defaults: {
        documentoSolicitante: dataReserva.documentoSolicitante,
        nombreSolicitante: dataReserva.nombreSolicitante,
        telefonoSolicitante: dataReserva.telefonoSolicitante,
        correoSolicitante: dataReserva.correoSolicitante,
        tipoDocumentoId: dataReserva.tipoDocumentoId,
      },
    });

    const nuevaReservaArea = await reservasAreasModel.create({
      apartamentoId: dataReserva.apartamentoId,
      areaComunId: dataReserva.areaComunId,
      fechaReserva: fechaReserva.format("YYYY-MM-DD"),
      horaInicio: dataReserva.horaInicio || null,
      horaFin: dataReserva.horaFin || null,
      motivoReserva: dataReserva.motivoReserva,
      cantidadAsistentes: dataReserva.cantidadAsistentes,
      invitadosExternos: dataReserva.invitadosExternos,
      aceptaReglamento: dataReserva.aceptaReglamento,
      estadoId: dataReserva.estadoId ?? 7,
      documentoSolicitante: solicitante.documentoSolicitante,
    });

    res.status(201).json({
      message: "Reserva creada exitosamente",
      reserva: nuevaReservaArea,
      solicitante: solicitante,
      solicitanteNuevo: created,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear la reserva",
      status: 500,
      error: error.message,
    });
  }
};

export const listarReservasAreas = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
    r.idReservas,
    r.fechaReserva,
    r.horaInicio,
    r.horaFin,
    r.motivoReserva,
    r.cantidadAsistentes,
    r.invitadosExternos,
    r.aceptaReglamento,
    r.apartamentoId,
    ap.numeroApartamento,
    ap.torresId,
    t.nombreTorre,
    r.areaComunId,
    ac.nombreArea,
    r.estadoId,
    es.nombreEstado,
    r.documentoSolicitante,
    s.nombreSolicitante,
    s.telefonoSolicitante,
    s.correoSolicitante,
    s.tipoDocumentoId,
    td.nombreDocumento
FROM reservasareas AS r
JOIN apartamentos AS ap 
    ON r.apartamentoId = ap.idApartamento
JOIN torres AS t 
    ON ap.torresId = t.idTorre
JOIN areacomun AS ac 
    ON r.areaComunId = ac.idAreaComun
JOIN estados AS es 
    ON r.estadoId = es.idEstado
JOIN solicitante AS s 
    ON r.documentoSolicitante = s.documentoSolicitante
LEFT JOIN tipodocumentos AS td 
    ON s.tipoDocumentoId = td.idTipoDocumento
ORDER BY r.fechaReserva DESC, r.horaInicio ASC;
    `);

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Listado de reservas de áreas comunes",
      body: results,
    });
  } catch (error) {
    console.error("Error al listar reservas de áreas:", error);
    res.status(500).json({
      error: "Error interno al listar reservas",
      status: 500,
      details: error.message,
    });
  }
};

export const ObtenerReservasAreas = async (req, res) => {
  try {
    await reservasAreasModel.sync();
    const reservasAreas = await reservasAreasModel.findAll({
      include: [
        { model: areasModel, as: "areaComun" },
        { model: solicitantesModel, as: "Solicitante" },
      ],
    });
    res.json(reservasAreas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const ObtenerReservaAreaPorId = async (req, res) => {
  try {
    const { idReservas } = req.params;
    await reservasAreasModel.sync();
    const reservaArea = await reservasAreasModel.findByPk(idReservas, {
      include: [
        { model: areasModel, as: "areaComun" },
        { model: solicitantesModel, as: "Solicitante" },
      ],
    });
    if (reservaArea) {
      res.json(reservaArea);
    } else {
      res.status(404).json({ message: "Reserva de área no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const ActualizarReservaArea = async (req, res) => {
  try {
    const { idReservas } = req.params;
    const dataActualizada = req.body;
    await reservasAreasModel.sync();
    const reservaArea = await reservasAreasModel.findByPk(idReservas);
    if (!reservaArea) {
      return res.status(404).json({ message: "Reserva de área no encontrada" });
    }
    await reservaArea.update(dataActualizada);
    res.json({
      message: "Reserva de área actualizada exitosamente",
      reservaArea,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};

export const eliminarReservaArea = async (req, res) => {
  try {
    const { idReservas } = req.params;

    const reserva = await reservasAreasModel.findByPk(idReservas);

    if (!reserva) {
      return res.status(404).json({
        message: "Reserva de área no encontrada",
        status: 404,
      });
    }

    await reserva.update({
      estadoId: 9,
      horaFin: dayjs().format("HH:mm:ss"),
    });

    res.status(200).json({
      message: "Reserva de área eliminada exitosamente",
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};
// trae datos de mejor manera version movil 
export const mostrarAreasComunesVersionMovil = async (req, res) => {
  try {
    const mmostraareascomunes = await reservasAreasModel.findAll({
      attributes: [
        ['idReservas', 'idReservas'],
        ['fechaReserva', 'fechaReserva'],
        ['horaInicio', 'horaInicio'],
        ['horaFin', 'horaFin'],
        ['motivoReserva', 'motivoReserva'],
        ['cantidadAsistentes', 'cantidadAsistentes'],
        ['invitadosExternos', 'invitadosExternos'],
      ],
      include: [
        {
          model: Estado,
          attributes: [
            ['nombreEstado', 'nombreEstado']
          ]
        },
        {
          model: Apartamento,
          attributes: [
            ['numeroApartamento', 'numeroApartamento']
          ]
        }, {
          model: solicitantesModel,
          attributes: [
            ['documentoSolicitante', 'documentoSolicitante'],
            ['nombreSolicitante', 'nombreSolicitante'],
            ['correoSolicitante', 'correoSolicitante'],
            ['telefonoSolicitante', 'telefonoSolicitante']

          ]
        }
      ]
    });
  res.status(200).json({
    ok: true,
    mmostraareascomunes
  })
} catch (error) {
  console.log("erro", error.message);
}
};