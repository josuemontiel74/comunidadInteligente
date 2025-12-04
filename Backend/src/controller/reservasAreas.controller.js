import reservasAreasModel from "../models/reservasAreas.model.js";
import areasModel from "../models/areaComun.model.js";
import solicitantesModel from "../models/solicitante.model.js";
import dayjs from "dayjs";
import Apartamento from "../models/apartamentos.model.js";
import Estado from "../models/estados.model.js";
import { sequelize } from "../config/connect.db.js";
import Tipodocumentos from "../models/tipoDocumento.model.js";
import Torre from "../models/torres.model.js";

/**
 * Función auxiliar para actualizar automáticamente los estados de las reservas
 * según la fecha y hora actual
 * Estados:
 * - 7: Pendiente/Programada (antes de la fecha/hora de inicio)
 * - 8: En curso (entre hora inicio y hora fin del día de la reserva)
 * - 9: Finalizada (después de la hora fin)
 */
const actualizarEstadosReservas = async () => {
  try {
    const ahora = dayjs();
    const fechaHoy = ahora.format("YYYY-MM-DD");
    const horaActual = ahora.format("HH:mm:ss");

    console.log(
      "🔄 Actualizando estados - Fecha hoy:",
      fechaHoy,
      "Hora actual:",
      horaActual
    );

    // Buscar reservas que no estén finalizadas
    const reservas = await reservasAreasModel.findAll({
      where: {
        estadoId: [7, 8], // Solo pendientes o en curso
      },
    });

    console.log(`📋 Encontradas ${reservas.length} reservas para revisar`);

    for (const reserva of reservas) {
      // Extraer solo la parte de la fecha sin conversión de zona horaria
      let fechaReservaStr;
      if (typeof reserva.fechaReserva === "string") {
        // Si ya es string, tomar solo la parte de la fecha
        fechaReservaStr = reserva.fechaReserva.split("T")[0];
      } else if (reserva.fechaReserva instanceof Date) {
        // Si es objeto Date, convertir a ISO y tomar la parte de fecha
        fechaReservaStr = reserva.fechaReserva.toISOString().split("T")[0];
      } else {
        // Si no es ninguno de los dos, usar dayjs para parsear
        fechaReservaStr = dayjs(reserva.fechaReserva).format("YYYY-MM-DD");
      }

      const horaInicio = reserva.horaInicio;
      const horaFin = reserva.horaFin;

      console.log(`\n📌 Reserva ID ${reserva.idReservas}:`);
      console.log(`   Fecha reserva (raw):`, reserva.fechaReserva);
      console.log(`   Fecha reserva (tipo):`, typeof reserva.fechaReserva);
      console.log(`   Fecha reserva (procesada): ${fechaReservaStr}`);
      console.log(`   Hora inicio: ${horaInicio}, Hora fin: ${horaFin}`);
      console.log(`   Estado actual: ${reserva.estadoId}`);

      // Comparar fechas usando dayjs para mejor precisión
      const fechaReservaDayjs = dayjs(fechaReservaStr, "YYYY-MM-DD");
      const hoyDayjs = dayjs(fechaHoy, "YYYY-MM-DD");

      if (fechaReservaDayjs.isBefore(hoyDayjs, "day")) {
        // La fecha ya pasó (días anteriores) -> Finalizada
        console.log(`   ❌ Fecha pasada - Cambiando a Finalizada`);
        if (reserva.estadoId !== 9) {
          await reserva.update({ estadoId: 9 });
        }
      } else if (fechaReservaDayjs.isSame(hoyDayjs, "day")) {
        // Es hoy, verificar la hora
        console.log(`   ✅ Es hoy - Verificando horas`);
        if (horaFin && horaActual > horaFin) {
          // Ya pasó la hora de fin -> Finalizada
          console.log(`   ⏰ Hora fin pasada - Cambiando a Finalizada`);
          if (reserva.estadoId !== 9) {
            await reserva.update({ estadoId: 9 });
          }
        } else if (
          horaInicio &&
          horaActual >= horaInicio &&
          (!horaFin || horaActual <= horaFin)
        ) {
          // Está entre hora inicio y hora fin -> En curso
          console.log(`   ⏰ Dentro del horario - Cambiando a En curso`);
          if (reserva.estadoId !== 8) {
            await reserva.update({ estadoId: 8 });
          }
        } else {
          console.log(`   ⏰ Aún no inicia - Mantiene Pendiente`);
        }
        // Si aún no llega la hora de inicio, se mantiene en estado 7
      } else {
        console.log(`   📅 Fecha futura - Mantiene Pendiente`);
      }
      // Si la fecha es futura (después de hoy), se mantiene en estado 7 (Pendiente)
    }
  } catch (error) {
    console.error("Error al actualizar estados de reservas:", error.message);
  }
};

export const CrearReservaArea = async (req, res) => {
  try {
    await reservasAreasModel.sync();
    await solicitantesModel.sync();

    const dataReserva = req.body;

    const hoy = dayjs().startOf("day");
    // Parsear la fecha sin conversión de zona horaria
    const fechaReserva = dayjs(dataReserva.fechaReserva, "YYYY-MM-DD", true);

    if (!fechaReserva.isValid()) {
      return res.status(400).json({
        message: "Formato de fecha inválido. Use YYYY-MM-DD",
        status: 400,
      });
    }

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
    // Actualizar estados automáticamente antes de consultar
    await actualizarEstadosReservas();

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
    // Actualizar estados automáticamente antes de consultar
    await actualizarEstadosReservas();

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
// Trae datos de mejor manera versión móvil
export const mostrarAreasComunesVersionMovil = async (req, res) => {
  try {
    // Actualizar estados automáticamente antes de consultar
    await actualizarEstadosReservas();

    const mostrarAreasComunes = await reservasAreasModel.findAll({
      attributes: [
        ["idReservas", "idReservas"],
        ["apartamentoId", "apartamentoId"],
        ["fechaReserva", "fechaReserva"],
        ["horaInicio", "horaInicio"],
        ["horaFin", "horaFin"],
        ["motivoReserva", "motivoReserva"],
        ["cantidadAsistentes", "cantidadAsistentes"],
        ["invitadosExternos", "invitadosExternos"],
      ],
      include: [
        {
          model: areasModel,
          attributes: [
            ["idAreaComun", "areaComunId"],
            ["nombreArea", "nombreArea"],
          ],
        },
        {
          model: Estado,
          attributes: [["nombreEstado", "nombreEstado"]],
        },
        {
          model: Apartamento,
          attributes: [
            ["idApartamento", "idApartamento"],
            ["numeroApartamento", "numeroApartamento"],
          ],
          include: [
            {
              model: Torre,
              attributes: [
                ["idTorre", "idTorre"],
                ["nombreTorre", "nombreTorre"],
              ],
            },
          ],
        },
        {
          model: solicitantesModel,
          attributes: [
            ["documentoSolicitante", "documentoSolicitante"],
            ["nombreSolicitante", "nombreSolicitante"],
            ["correoSolicitante", "correoSolicitante"],
            ["telefonoSolicitante", "telefonoSolicitante"],
          ],
        },
      ],
    });
    res.status(200).json({
      ok: true,
      mostrarAreasComunes,
    });
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
};
export const buscar = async (req, res) => {
  try {
    const mostrarAreasComunes = await reservasAreasModel.findOne({
      where: { idReservas: req.params.idReservas },
      attributes: [
        ["idReservas", "idReservas"],
        ["fechaReserva", "fechaReserva"],
        ["horaInicio", "horaInicio"],
        ["horaFin", "horaFin"],
        ["motivoReserva", "motivoReserva"],
        ["cantidadAsistentes", "cantidadAsistentes"],
        ["invitadosExternos", "invitadosExternos"],
      ],
      include: [
        {
          model: areasModel,
          attributes: [
            ["idAreaComun", "areaComunId"],
            ["nombreArea", "nombreArea"],
          ],
        },
        {
          model: Estado,
          attributes: [["nombreEstado", "nombreEstado"]],
        },
        {
          model: Apartamento,
          attributes: [["numeroApartamento", "numeroApartamento"]],
        },
        {
          model: solicitantesModel,
          attributes: [
            ["documentoSolicitante", "documentoSolicitante"],
            ["nombreSolicitante", "nombreSolicitante"],
            ["correoSolicitante", "correoSolicitante"],
            ["telefonoSolicitante", "telefonoSolicitante"],
          ],
          include: [
            {
              model: Tipodocumentos,
              attributes: [["nombreDocumento", "nombreDocumento"]],
            },
          ],
        },
      ],
    });
    res.status(200).json({
      ok: true,
      mostrarAreasComunes,
    });
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
};
export const crearReservasParaMovil = async (req, res) => {
  try {
    let solicitante = null;
    let created = false;
    let nuevaReservaArea = null;

    const apartamento = await Apartamento.findOne({
      attributes: [
        ["idApartamento", "idApartamento"],
        ["torresId", "torresId"],
      ],
      where: { numeroApartamento: req.body.numeroApartamento },
    });

    if (!apartamento) {
      return res.status(400).json({
        ok: false,
        message: `No se encuentra el apartamento con número ${req.body.numeroApartamento}`,
      });
    }

    const json = apartamento.toJSON();
    const id = json.idApartamento;

    console.log(id);
    const dataReserva = req.body;
    const hoy = dayjs().startOf("day");
    // Parsear la fecha sin conversión de zona horaria
    const fechaReserva = dayjs(dataReserva.fechaReserva, "YYYY-MM-DD", true);

    if (!fechaReserva.isValid()) {
      return res.status(400).json({
        ok: false,
        message: "Formato de fecha inválido. Use YYYY-MM-DD",
      });
    }

    if (fechaReserva.isBefore(hoy)) {
      return res.status(400).json({
        message: "No se puede crear una reserva en el pasado",
        status: 400,
      });
    }

    console.log("Body recibido:", req.body);
    console.log("📅 Fecha recibida:", dataReserva.fechaReserva);
    console.log("📅 Fecha parseada:", fechaReserva.format("YYYY-MM-DD"));
    console.log("📅 Fecha de hoy:", hoy.format("YYYY-MM-DD"));

    [solicitante, created] = await solicitantesModel.findOrCreate({
      where: { documentoSolicitante: dataReserva.documentoSolicitante },
      defaults: {
        documentoSolicitante: dataReserva.documentoSolicitante,
        nombreSolicitante: dataReserva.nombreSolicitante,
        telefonoSolicitante: dataReserva.telefonoSolicitante,
        correoSolicitante: dataReserva.correoSolicitante,
        tipoDocumentoId: dataReserva.tipoDocumentoId,
      },
    });

    nuevaReservaArea = await reservasAreasModel.create({
      apartamentoId: id,
      areaComunId: dataReserva.areaComunId,
      fechaReserva: fechaReserva.format("YYYY-MM-DD"),
      horaInicio: dataReserva.horaInicio || null,
      horaFin: dataReserva.horaFin || null,
      motivoReserva: dataReserva.motivoReserva,
      cantidadAsistentes: dataReserva.cantidadAsistentes,
      invitadosExternos: dataReserva.invitadosExternos,
      aceptaReglamento: dataReserva.aceptaReglamento ?? 1,
      estadoId: dataReserva.estadoId ?? 7,
      documentoSolicitante: solicitante.documentoSolicitante,
    });

    console.log("✅ Reserva creada con fecha:", nuevaReservaArea.fechaReserva);
    console.log("✅ Estado inicial:", nuevaReservaArea.estadoId);

    return res.status(200).json({
      ok: true,
      message: "Reserva creada exitosamente",
      reserva: nuevaReservaArea,
      solicitante: solicitante,
      solicitanteNuevo: created,
    });
  } catch (error) {
    console.log(error.message);
    console.log("Body recibido:", req.body);
    return res.status(500).json({ ok: false, error: error.message });
  }
};

export const ActualizarReservaAreaParaMovil = async (req, res) => {
  try {
    const data = req.body;
    const idReservas = req.params.idReservas;
    console.log("Datos recibidos:", data, "idReserva:", idReservas);

    if (!idReservas) {
      return res
        .status(400)
        .json({ ok: false, message: "Falta idReserva en la URL" });
    }

    const reservaExistente = await reservasAreasModel.findOne({
      where: { idReservas: idReservas },
    });

    if (!reservaExistente) {
      return res
        .status(404)
        .json({ ok: false, message: "La reserva no existe" });
    }

    let apartamentoId = reservaExistente.apartamentoId;
    if (data.numeroApartamento) {
      const apartamento = await Apartamento.findOne({
        where: { numeroApartamento: data.numeroApartamento },
        attributes: ["idApartamento"],
      });
      if (!apartamento) {
        return res.status(400).json({
          ok: false,
          message: `No se encuentra el apartamento con número ${data.numeroApartamento}`,
        });
      }
      apartamentoId = apartamento.idApartamento;
    }

    const fechaReserva = data.fechaReserva
      ? dayjs(data.fechaReserva).startOf("day")
      : null;
    if (fechaReserva && fechaReserva.isBefore(dayjs().startOf("day"))) {
      return res.status(400).json({
        ok: false,
        message: "No se puede actualizar una reserva al pasado",
      });
    }
    const documentoSolicitanteFinal =
      data.documentoSolicitante ?? reservaExistente.documentoSolicitante;
    const [solicitante, created] = await solicitantesModel.findOrCreate({
      where: { documentoSolicitante: documentoSolicitanteFinal },
      defaults: {
        documentoSolicitante: data.documentoSolicitante,
        nombreSolicitante: data.nombreSolicitante,
        telefonoSolicitante: data.telefonoSolicitante,
        correoSolicitante: data.correoSolicitante,
        tipoDocumentoId: data.tipoDocumentoId,
      },
    });

    if (!created) {
      await solicitante.update({
        nombreSolicitante:
          data.nombreSolicitante || solicitante.nombreSolicitante,
        telefonoSolicitante:
          data.telefonoSolicitante || solicitante.telefonoSolicitante,
        correoSolicitante:
          data.correoSolicitante || solicitante.correoSolicitante,
        tipoDocumentoId: data.tipoDocumentoId || solicitante.tipoDocumentoId,
      });
    }

    const updateData = {
      apartamentoId,
      areaComunId: data.areaComunId ?? reservaExistente.areaComunId,
      fechaReserva: fechaReserva
        ? fechaReserva.format("YYYY-MM-DD")
        : reservaExistente.fechaReserva,
      horaInicio: data.horaInicio ?? reservaExistente.horaInicio,
      horaFin: data.horaFin ?? reservaExistente.horaFin,
      motivoReserva: data.motivoReserva ?? reservaExistente.motivoReserva,
      cantidadAsistentes:
        data.cantidadAsistentes ?? reservaExistente.cantidadAsistentes,
      invitadosExternos:
        data.invitadosExternos ?? reservaExistente.invitadosExternos,
      aceptaReglamento:
        data.aceptaReglamento ?? reservaExistente.aceptaReglamento,
      estadoId: data.estadoId ?? reservaExistente.estadoId,
      documentoSolicitante:
        data.documentoSolicitante ?? reservaExistente.documentoSolicitante,
    };

    await reservaExistente.update(updateData);

    return res.status(200).json({
      ok: true,
      message: "Reserva actualizada correctamente",
      solicitante,
      solicitanteNuevo: created,
      reservaActualizada: updateData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};
