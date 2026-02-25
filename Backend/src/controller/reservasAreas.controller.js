import reservasAreasModel from "../models/reservasAreas.model.js";
import areasModel from "../models/areaComun.model.js";
import solicitantesModel from "../models/solicitante.model.js";
import dayjs from "dayjs";
import Apartamento from "../models/apartamentos.model.js";
import Estado from "../models/estados.model.js";
import { Op, fn, col, literal, where } from "sequelize";
import Tipodocumentos from "../models/tipoDocumento.model.js";
import Torre from "../models/torres.model.js";
import { registrarAuditoria } from "../services/auditorias.service.js";
import { registrarFallo } from "../services/logger.service.js";
import { ESTADO_RESERVA } from "../utils/constantes.js";

// ── Helpers para calcular estados de reservas ─────────────────────────────────

/** Extrae la parte de fecha (YYYY-MM-DD) desde distintos formatos */
const resolverFechaReservaStr = (fechaReserva) => {
  if (typeof fechaReserva === "string") return fechaReserva.split("T")[0];
  if (fechaReserva instanceof Date)
    return fechaReserva.toISOString().split("T")[0];
  return dayjs(fechaReserva).format("YYYY-MM-DD");
};

/** Determina el nuevo estadoId para una reserva dado el contexto horario actual */
const calcularNuevoEstado = (reserva, fechaHoy, horaActual) => {
  const { horaInicio, horaFin, estadoId } = reserva;
  const fechaReservaStr = resolverFechaReservaStr(reserva.fechaReserva);
  const fechaReservaDayjs = dayjs(fechaReservaStr, "YYYY-MM-DD");
  const hoyDayjs = dayjs(fechaHoy, "YYYY-MM-DD");

  if (fechaReservaDayjs.isBefore(hoyDayjs, "day")) {
    return estadoId === ESTADO_RESERVA.FINALIZADA
      ? null
      : ESTADO_RESERVA.FINALIZADA;
  }

  if (!fechaReservaDayjs.isSame(hoyDayjs, "day")) return null;

  if (horaFin && horaActual > horaFin) {
    return estadoId === ESTADO_RESERVA.FINALIZADA
      ? null
      : ESTADO_RESERVA.FINALIZADA;
  }

  const enCurso =
    horaInicio &&
    horaActual >= horaInicio &&
    (!horaFin || horaActual <= horaFin);
  if (enCurso) {
    return estadoId === ESTADO_RESERVA.EN_CURSO
      ? null
      : ESTADO_RESERVA.EN_CURSO;
  }

  return null;
};

// ============================================================
// Función auxiliar: actualizar estados de reservas automáticamente
// Estados: 7=Pendiente, 8=En curso, 9=Finalizada
// ============================================================
const actualizarEstadosReservas = async () => {
  try {
    const ahora = dayjs();
    const fechaHoy = ahora.format("YYYY-MM-DD");
    const horaActual = ahora.format("HH:mm:ss");

    const reservas = await reservasAreasModel.findAll({
      where: { estadoId: [ESTADO_RESERVA.PENDIENTE, ESTADO_RESERVA.EN_CURSO] },
    });

    for (const reserva of reservas) {
      const nuevoEstado = calcularNuevoEstado(reserva, fechaHoy, horaActual);
      if (nuevoEstado !== null) {
        await reserva.update({ estadoId: nuevoEstado });
      }
    }
  } catch {
    // Error silenciado intencionalmente: no debe interrumpir el flujo principal
  }
};

// ============================================================
// GET /api/reservas-areas
// Listar todas las reservas (versión unificada - antes "mostrarAreasComunesVersionMovil")
// ============================================================
export const listarReservasAreas = async (req, res) => {
  try {
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
    const username = req.user?.username || "desconocido";
    await registrarFallo(
      "ERROR",
      username,
      "GET /reservas-areas",
      error.message,
      error.stack,
    );
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ============================================================
// GET /api/reservas-areas/:idReservas
// Buscar reserva por ID (versión unificada - antes "buscar")
// ============================================================
export const obtenerReservaPorId = async (req, res) => {
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
              as: "TipoDocumento",
              attributes: [["nombreDocumento", "nombreDocumento"]],
            },
          ],
        },
      ],
    });

    if (!mostrarAreasComunes) {
      return res
        .status(404)
        .json({ ok: false, message: "Reserva no encontrada" });
    }

    res.status(200).json({
      ok: true,
      mostrarAreasComunes,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    await registrarFallo(
      "ERROR",
      username,
      "GET /reservas-areas/:id",
      error.message,
      error.stack,
    );
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ============================================================
// POST /api/reservas-areas
// Crear reserva (versión unificada - antes "crearReservasParaMovil")
// Soporta tanto apartamentoId como numeroApartamento
// ============================================================
export const crearReserva = async (req, res) => {
  try {
    const dataReserva = req.body;

    // Resolver apartamentoId: soporta ambos formatos
    let apartamentoId = dataReserva.apartamentoId;

    if (!apartamentoId && dataReserva.numeroApartamento) {
      const apartamento = await Apartamento.findOne({
        attributes: [["idApartamento", "idApartamento"]],
        where: { numeroApartamento: dataReserva.numeroApartamento },
      });

      if (!apartamento) {
        return res.status(400).json({
          ok: false,
          message: `No se encuentra el apartamento con número ${dataReserva.numeroApartamento}`,
        });
      }
      apartamentoId = apartamento.toJSON().idApartamento;
    }

    if (!apartamentoId) {
      return res.status(400).json({
        ok: false,
        message:
          "Debe enviar apartamentoId o numeroApartamento para crear la reserva",
      });
    }

    const hoy = dayjs().startOf("day");
    const fechaReserva = dayjs(dataReserva.fechaReserva, "YYYY-MM-DD", true);

    if (!fechaReserva.isValid()) {
      return res.status(400).json({
        ok: false,
        message: "Formato de fecha inválido. Use YYYY-MM-DD",
      });
    }

    if (fechaReserva.isBefore(hoy)) {
      return res.status(400).json({
        ok: false,
        message: "No se puede crear una reserva en el pasado",
      });
    }

    // Verificar conflicto de horario
    const verificarReserva = await reservasAreasModel.findOne({
      where: {
        areaComunId: dataReserva.areaComunId,
        fechaReserva: fechaReserva.format("YYYY-MM-DD"),
        [Op.and]: [
          { horaInicio: { [Op.lt]: dataReserva.horaFin } },
          { horaFin: { [Op.gt]: dataReserva.horaInicio } },
        ],
      },
    });

    if (verificarReserva != null) {
      return res.status(409).json({
        ok: false,
        message:
          "Lo sentimos, el área ya está reservada en la fecha y horario indicados.",
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
      apartamentoId,
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

    // Registrar en auditoría
    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(
      usuarioActual,
      "reservasareas",
      "INSERT",
      nuevaReservaArea.idReservas,
    );

    return res.status(201).json({
      ok: true,
      message: "Reserva creada exitosamente",
      reserva: nuevaReservaArea,
      solicitante: solicitante,
      solicitanteNuevo: created,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    await registrarFallo(
      "ERROR",
      username,
      "POST /reservas-areas",
      error.message,
      error.stack,
    );
    return res.status(500).json({ ok: false, error: error.message });
  }
};

// ============================================================
// PATCH /api/reservas-areas/:idReservas
// Actualizar reserva (versión unificada - antes "ActualizarReservaAreaParaMovil")
// Incluye: validación de conflictos, resolución de apartamento, manejo de solicitante
// ============================================================
export const actualizarReserva = async (req, res) => {
  try {
    const data = req.body;
    const idReservas = req.params.idReservas;

    if (!idReservas) {
      return res
        .status(400)
        .json({ ok: false, message: "Falta idReservas en la URL" });
    }

    // Verificar conflicto de horario (excluyendo la reserva actual)
    const verificarReserva = await reservasAreasModel.findOne({
      where: {
        areaComunId: data.areaComunId,
        fechaReserva: data.fechaReserva,
        idReservas: { [Op.ne]: idReservas },
        [Op.and]: [
          { horaInicio: { [Op.lt]: data.horaFin } },
          { horaFin: { [Op.gt]: data.horaInicio } },
        ],
      },
    });

    if (verificarReserva != null) {
      return res.status(409).json({
        ok: false,
        message:
          "Lo sentimos, el área ya está reservada en la fecha y horario indicados.",
      });
    }

    const reservaExistente = await reservasAreasModel.findOne({
      where: { idReservas },
    });

    if (!reservaExistente) {
      return res
        .status(404)
        .json({ ok: false, message: "La reserva no existe" });
    }

    // Resolver apartamentoId: soporta ambos formatos
    let apartamentoId = reservaExistente.apartamentoId;

    if (data.apartamentoId) {
      apartamentoId = data.apartamentoId;
    } else if (data.numeroApartamento) {
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

    // Validar fecha
    const fechaReserva = data.fechaReserva
      ? dayjs(data.fechaReserva).startOf("day")
      : null;
    if (fechaReserva?.isBefore(dayjs().startOf("day"))) {
      return res.status(400).json({
        ok: false,
        message: "No se puede actualizar una reserva al pasado",
      });
    }

    // Manejar solicitante
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

    // Registrar en auditoría
    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(
      usuarioActual,
      "reservasareas",
      "UPDATE",
      idReservas,
    );

    return res.status(200).json({
      ok: true,
      message: "Reserva actualizada correctamente",
      solicitante,
      solicitanteNuevo: created,
      reservaActualizada: updateData,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    await registrarFallo(
      "ERROR",
      username,
      "PATCH /reservas-areas/:id",
      error.message,
      error.stack,
    );
    return res.status(500).json({ ok: false, error: error.message });
  }
};

// ============================================================
// DELETE /api/reservas-areas/:idReservas
// Eliminar (finalizar) reserva
// ============================================================
export const eliminarReservaArea = async (req, res) => {
  try {
    const { idReservas } = req.params;

    const reserva = await reservasAreasModel.findByPk(idReservas);

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        message: "Reserva de área no encontrada",
      });
    }

    await reserva.update({
      estadoId: 9,
      horaFin: dayjs().format("HH:mm:ss"),
    });

    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(
      usuarioActual,
      "reservasareas",
      "DELETE",
      idReservas,
    );

    res.status(200).json({
      ok: true,
      message: "Reserva de área eliminada exitosamente",
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    await registrarFallo(
      "ERROR",
      username,
      "DELETE /reservas-areas/:id",
      error.message,
      error.stack,
    );
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ============================================================
// POST /api/reportes/:por
// Reportes de áreas comunes
// ============================================================
export const reportes = async (req, res) => {
  try {
    const reportPor = Number.parseInt(req.params.por, 10);
    const rango = req.body.rango || req.body;
    let { fechaInicio, fechaFin } = rango;

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      [fechaInicio, fechaFin] = [fechaFin, fechaInicio];
    }

    const queryConfig = {
      where: {
        fechaReserva: {
          [Op.between]: [fechaInicio, fechaFin],
        },
      },
    };

    let areascomunesReporte = [];

    switch (reportPor) {
      case 1:
        areascomunesReporte = await reservasAreasModel.findAll({
          attributes: [
            "areaComunId",
            [fn("YEAR", col("fechaReserva")), "anio"],
            [fn("COUNT", col("idReservas")), "totalVisitas"],
          ],
          ...queryConfig,
          group: ["areaComunId", "anio"],
          order: [["anio", "ASC"]],
        });
        break;
      case 2:
        areascomunesReporte = await reservasAreasModel.findAll({
          attributes: [
            "areaComunId",
            [fn("YEAR", col("fechaReserva")), "anio"],
            [fn("MONTH", col("fechaReserva")), "mes"],
            [fn("COUNT", col("idReservas")), "totalVisitas"],
          ],
          ...queryConfig,
          group: ["areaComunId", "anio", "mes"],
          order: [
            ["anio", "ASC"],
            ["mes", "ASC"],
          ],
        });
        break;
      case 3:
        areascomunesReporte = await reservasAreasModel.findAll({
          attributes: [
            "areaComunId",
            [fn("YEAR", col("fechaReserva")), "anio"],
            [literal("FLOOR((DAY(fechaReserva)-1)/7)+1"), "semanaMes"],
            [fn("COUNT", col("idReservas")), "totalVisitas"],
          ],
          ...queryConfig,
          group: ["areaComunId", "anio", "semanaMes"],
          order: [
            ["anio", "ASC"],
            ["semanaMes", "ASC"],
          ],
        });
        break;
    }

    res.status(200).json({ ok: true, areascomunesReporte });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
};

// ============================================================
// GET /api/calendariodereservas
// Calendario de reservas del mes actual
// ============================================================
export const calendariosReservas = async (req, res) => {
  try {
    const caledarioreservas = await reservasAreasModel.findAll({
      attributes: ["areaComunId", "fechaReserva", "horaInicio", "horaFin"],
      include: [
        {
          model: solicitantesModel,
          attributes: [
            ["documentoSolicitante", "documentoSolicitante"],
            ["nombreSolicitante", "nombreSolicitante"],
          ],
        },
      ],
      where: {
        estadoId: {
          [Op.in]: [7, 8],
        },
        [Op.and]: [
          where(fn("MONTH", col("fechaReserva")), fn("MONTH", fn("CURDATE"))),
          where(fn("YEAR", col("fechaReserva")), fn("YEAR", fn("CURDATE"))),
        ],
      },
    });

    return res.status(200).json({ ok: true, caledarioreservas });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, message: "Error interno del servidor" });
  }
};
