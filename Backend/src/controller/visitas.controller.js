import Visita from "../models/visitas.model.js";
import Visitante from "../models/visitantes.model.js";
import Vehiculo from "../models/vehiculo.model.js";
import Parqueadero from "../models/parqueaderos.model.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import tiposVehiculoModel from "../models/tiposVehiculo.model.js";
import { sequelize } from "../config/connect.db.js";
import { registrarAuditoria } from "../services/auditorias.service.js";
import {
  ESTADO_PARQUEADERO,
  ESTADO_VISITA,
  TIMEZONE_COLOMBIA,
} from "../utils/constantes.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Regex de placa colombiana
const PLACA_REGEX = /^[A-Z]{3}\d{2,3}[A-Z]?$/;
const HORAS_VENCIMIENTO_PARQUEADERO = 24;

// Helpers privados

/** Construye el objeto de campos a actualizar para un Visitante */
function buildVisitanteData(nombreVisitante, tipoDocumentoId) {
  const data = {};
  if (nombreVisitante) data.nombreVisitante = nombreVisitante;
  if (tipoDocumentoId) data.tipoDocumentoId = tipoDocumentoId;
  return data;
}

/** Libera el parqueadero asignado a un vehículo por matrícula */
async function liberarParqueaderoDeVehiculo(matricula) {
  if (!matricula) return;
  const vehiculo = await Vehiculo.findByPk(matricula);
  if (vehiculo?.codigoParqueadero) {
    await Parqueadero.update(
      { estadoId: ESTADO_PARQUEADERO.DISPONIBLE },
      { where: { codigoParqueadero: vehiculo.codigoParqueadero } },
    );
  }
}

/**
 * Procesa la asignación de vehículo al crear una visita.
 * @returns {Promise<{ vehiculoMatricula: string, parqueadero: object }>}
 */
async function procesarVehiculoNuevo(
  matricula,
  tipoVehiculoId,
  codigoParqueadero,
) {
  const placaLimpia = matricula.trim().toUpperCase();
  if (!PLACA_REGEX.test(placaLimpia)) {
    throw Object.assign(
      new Error(
        "La matrícula no tiene un formato válido. Use el formato colombiano: ABC123 (carro) o ABC12D / ABC12 (moto). Sin caracteres especiales ni secuencias inválidas.",
      ),
      { status: 400 },
    );
  }

  if (
    !tipoVehiculoId ||
    !codigoParqueadero ||
    codigoParqueadero.trim() === ""
  ) {
    throw Object.assign(
      new Error("Debe proporcionar tipo de vehículo y código de parqueadero"),
      { status: 400 },
    );
  }

  const parqueadero = await Parqueadero.findByPk(codigoParqueadero);
  if (!parqueadero)
    throw Object.assign(new Error("El parqueadero no existe"), { status: 400 });
  if (Number(parqueadero.estadoId) !== ESTADO_PARQUEADERO.DISPONIBLE) {
    throw Object.assign(new Error("El parqueadero no está disponible"), {
      status: 400,
    });
  }

  const vehiculo = await Vehiculo.findByPk(matricula);
  if (vehiculo) {
    if (
      vehiculo.codigoParqueadero &&
      vehiculo.codigoParqueadero !== codigoParqueadero
    ) {
      await Parqueadero.update(
        { estadoId: ESTADO_PARQUEADERO.DISPONIBLE },
        { where: { codigoParqueadero: vehiculo.codigoParqueadero } },
      );
    }
    await vehiculo.update({ tipoVehiculoId, codigoParqueadero });
  } else {
    await Vehiculo.create({
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
    });
  }
  return { vehiculoMatricula: matricula, parqueadero };
}

/**
 * Analiza y valida la fecha de ingreso para una visita.
 * @returns {import("dayjs").Dayjs} fecha válida en zona Colombia
 */
function parseFechaIngreso(fechaHoraIngreso, fechaActual) {
  if (!fechaHoraIngreso) return fechaActual;
  let fecha = dayjs(fechaHoraIngreso, "YYYY-MM-DD HH:mm", true);
  if (!fecha.isValid())
    fecha = dayjs(fechaHoraIngreso, "YYYY-MM-DD hh:mm A", true);
  if (fecha.isValid()) fecha = fecha.tz(TIMEZONE_COLOMBIA, true);
  return fecha;
}

/** Agrega metadatos operativos para identificar visitas que requieren renovación */
function enriquecerVisitaConVencimiento(visita) {
  const ahora = dayjs().tz(TIMEZONE_COLOMBIA);
  const fechaIngreso = dayjs(visita.fechaHoraIngreso).tz(TIMEZONE_COLOMBIA);
  const horasTranscurridas = fechaIngreso.isValid()
    ? Math.floor(ahora.diff(fechaIngreso, "minute") / 60)
    : null;
  const visitaActiva =
    Number(visita.estadoId) === ESTADO_VISITA.ACTIVA ||
    String(visita.estadoVisita || "")
      .toLowerCase()
      .includes("activ");
  const tieneParqueaderoAsignado = Boolean(
    visita.codigoParqueadero || visita.vehiculoMatricula || visita.matricula,
  );

  return {
    ...visita,
    horasTranscurridas,
    fechaLimiteParqueadero: fechaIngreso.isValid()
      ? fechaIngreso.add(HORAS_VENCIMIENTO_PARQUEADERO, "hour").toISOString()
      : null,
    requiereRenovacion:
      fechaIngreso.isValid() &&
      visitaActiva &&
      tieneParqueaderoAsignado &&
      horasTranscurridas >= HORAS_VENCIMIENTO_PARQUEADERO,
  };
}

/**
 * Procesa el cambio de vehículo al actualizar una visita.
 * @returns {Promise<string|null>} vehiculoMatricula resultante
 */
async function procesarActualizacionVehiculo(
  visita,
  matricula,
  tipoVehiculoId,
  codigoParqueadero,
) {
  // Quitar vehículo
  if (!matricula || matricula.trim() === "") {
    await liberarParqueaderoDeVehiculo(visita.vehiculoMatricula);
    return null;
  }

  // Faltan datos obligatorios
  if (
    !tipoVehiculoId ||
    !codigoParqueadero ||
    codigoParqueadero.trim() === ""
  ) {
    throw Object.assign(
      new Error(
        "Debe proporcionar tipo de vehículo y código de parqueadero para asignar un vehículo",
      ),
      { status: 400 },
    );
  }

  const parqueadero = await Parqueadero.findByPk(codigoParqueadero);
  if (!parqueadero)
    throw Object.assign(new Error("El parqueadero no existe"), { status: 400 });

  const vehiculoActual = visita.vehiculoMatricula
    ? await Vehiculo.findByPk(visita.vehiculoMatricula)
    : null;
  const esElMismoParqueadero =
    vehiculoActual?.codigoParqueadero === codigoParqueadero;

  if (
    !esElMismoParqueadero &&
    parqueadero.estadoId !== ESTADO_PARQUEADERO.DISPONIBLE
  ) {
    throw Object.assign(new Error("El parqueadero no está disponible"), {
      status: 400,
    });
  }

  // Liberar parqueadero anterior si el vehículo de la visita cambia
  if (visita.vehiculoMatricula && visita.vehiculoMatricula !== matricula) {
    await liberarParqueaderoDeVehiculo(visita.vehiculoMatricula);
  }

  // Crear o actualizar el vehículo
  const vehiculo = await Vehiculo.findByPk(matricula);
  if (vehiculo) {
    if (
      vehiculo.codigoParqueadero &&
      vehiculo.codigoParqueadero !== codigoParqueadero
    ) {
      await Parqueadero.update(
        { estadoId: ESTADO_PARQUEADERO.DISPONIBLE },
        { where: { codigoParqueadero: vehiculo.codigoParqueadero } },
      );
    }
    await vehiculo.update({ tipoVehiculoId, codigoParqueadero });
  } else {
    await Vehiculo.create({
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
    });
  }

  if (!esElMismoParqueadero) {
    await Parqueadero.update(
      { estadoId: ESTADO_PARQUEADERO.OCUPADO },
      { where: { codigoParqueadero } },
    );
  }

  return vehiculo.matricula;
}

export const crearVisita = async (req, res) => {
  try {
    const {
      numeroDocumento,
      nombreVisitante,
      tipoDocumentoId,
      apartamentoId,
      fechaHoraIngreso,
      estadoId,
      observaciones,
      telefono,
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
    } = req.body;

    const fechaActual = dayjs().tz(TIMEZONE_COLOMBIA);
    const fechaIngreso = parseFechaIngreso(fechaHoraIngreso, fechaActual);

    if (!fechaIngreso.isValid()) {
      return res
        .status(400)
        .json({ error: "La fecha de ingreso no es válida" });
    }
    if (fechaIngreso.isBefore(fechaActual.subtract(2, "hour"))) {
      return res.status(400).json({
        error:
          "La fecha y hora de ingreso no puede ser anterior a 2 horas de la actual",
      });
    }
    if (fechaIngreso.year() > 2100) {
      return res.status(400).json({
        error: "El año de la fecha de ingreso no puede ser mayor a 2100",
      });
    }

    // Crear o actualizar visitante
    const visitante = await Visitante.findByPk(numeroDocumento);
    const camposVisitante = buildVisitanteData(
      nombreVisitante,
      tipoDocumentoId,
    );
    if (!visitante) {
      await Visitante.create({
        numeroDocumento,
        ...camposVisitante,
      });
    } else if (Object.keys(camposVisitante).length > 0) {
      await visitante.update(camposVisitante);
    }

    // Verificar visita activa duplicada
    const visitaActiva = await Visita.findOne({
      where: { numeroDocumento, estadoId: ESTADO_VISITA.ACTIVA },
    });
    if (visitaActiva) {
      return res.status(409).json({
        error: `Ya hay una persona con el número de documento ${numeroDocumento} en visita. Todavía no ha salido.`,
        codigo: "VISITA_DUPLICADA",
      });
    }

    let vehiculoMatricula = null;
    let parqueadero = null;

    if (matricula && matricula.trim() !== "") {
      ({ vehiculoMatricula, parqueadero } = await procesarVehiculoNuevo(
        matricula,
        tipoVehiculoId,
        codigoParqueadero,
      ));
    }

    const visita = await Visita.create({
      numeroDocumento,
      apartamentoId,
      fechaHoraIngreso: fechaIngreso.toDate(),
      estadoId: estadoId || ESTADO_VISITA.ACTIVA,
      vehiculoMatricula,
      observaciones: observaciones || null,
      telefono: telefono || null,
    });

    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(
      usuarioActual,
      "visitas",
      "INSERT",
      visita.idVisita,
    );

    if (parqueadero && vehiculoMatricula) {
      await parqueadero.update({ estadoId: ESTADO_PARQUEADERO.OCUPADO });
    }

    res.status(201).json({ mensaje: "Visita creada correctamente", visita });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const listarVisitas = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
SELECT 
    vi.idVisita,
    vi.estadoId,
    vi.numeroDocumento,
    ve.nombreVisitante,
    ve.tipoDocumentoId,
    vi.apartamentoId,
    ap.numeroApartamento,
    t.nombreTorre,
    vi.fechaHoraIngreso,
    vi.fechaHoraSalida,
    vi.observaciones,
    vi.telefono,
    veh.matricula,
    veh.tipoVehiculoId,
    et.nombreEstado AS estadoVisita,
    ti.nombreVehiculo,
    cod.codigoParqueadero,
    etp.nombreEstado AS estadoParqueadero
FROM visitas AS vi
JOIN visitantes AS ve 
    ON vi.numeroDocumento = ve.numeroDocumento
JOIN apartamentos AS ap 
    ON vi.apartamentoId = ap.idApartamento
JOIN torres AS t 
    ON ap.torresId = t.idTorre
JOIN estados AS et 
    ON vi.estadoId = et.idEstado
LEFT JOIN vehiculo AS veh 
    ON vi.vehiculoMatricula = veh.matricula
LEFT JOIN parqueaderos AS cod 
    ON veh.codigoParqueadero = cod.codigoParqueadero
LEFT JOIN estados AS etp 
    ON cod.estadoId = etp.idEstado  
LEFT JOIN tiposvehiculo AS ti 
    ON veh.tipoVehiculoId = ti.idTipoVehiculo
ORDER BY vi.fechaHoraIngreso DESC;
    `);

    res.json(results.map(enriquecerVisitaConVencimiento));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar visitas" });
  }
};

export const obtenerVisitas = async (req, res) => {
  try {
    await Visita.sync();
    const visita = await Visita.findAll({ include: Visitante });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Visitas",
      body: visita.map((visita) => ({
        ...visita.toJSON(),
        fechaHoraIngreso: dayjs(visita.fechaHoraIngreso)
          .tz(TIMEZONE_COLOMBIA)
          .format("YYYY-MM-DD hh:mm A"),
        fechaHoraSalida: visita.fechaHoraSalida
          ? dayjs(visita.fechaHoraSalida)
              .tz(TIMEZONE_COLOMBIA)
              .format("YYYY-MM-DD hh:mm A")
          : null,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerVisitaPorId = async (req, res) => {
  try {
    await Visita.sync();
    const idVisita = req.params.idVisita;
    const visita = await Visita.findOne({
      where: { idVisita },
      include: Visitante,
    });
    if (!visita) {
      return res.status(404).json({
        message: "Visita no encontrada",
        status: 404,
      });
    }
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Visita por ID",
      body: {
        ...visita.toJSON(),
        fechaHoraIngreso: dayjs(visita.fechaHoraIngreso)
          .tz(TIMEZONE_COLOMBIA)
          .format("YYYY-MM-DD hh:mm A"),
        fechaHoraSalida: visita.fechaHoraSalida
          ? dayjs(visita.fechaHoraSalida)
              .tz(TIMEZONE_COLOMBIA)
              .format("YYYY-MM-DD hh:mm A")
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

/**
 * Valida y formatea la fecha de ingreso.
 * @param {string} fechaHoraIngreso
 * @returns {{ error: string }|{ formatted: string }} error o valor formateado
 */
function validarFechaIngreso(fechaHoraIngreso) {
  const fechaIngreso = dayjs(fechaHoraIngreso, "YYYY-MM-DD HH:mm", true).tz(
    TIMEZONE_COLOMBIA,
    true,
  );
  if (!fechaIngreso.isValid()) {
    return { error: "La fecha de ingreso no es válida" };
  }
  if (fechaIngreso.year() > 2100) {
    return { error: "El año de la fecha de ingreso no puede ser mayor a 2100" };
  }
  return { formatted: fechaIngreso.toDate() };
}

/**
 * Actualiza o crea el visitante asociado a una visita.
 * @returns {Promise<string|undefined>} nuevo numeroDocumento si cambió
 */
async function actualizarVisitanteAsociado(
  visita,
  numeroDocumento,
  camposVisitante,
) {
  if (numeroDocumento && numeroDocumento !== visita.numeroDocumento) {
    const visitante = await Visitante.findByPk(numeroDocumento);
    if (!visitante) {
      await Visitante.create({ numeroDocumento, ...camposVisitante });
    } else if (Object.keys(camposVisitante).length > 0) {
      await visitante.update(camposVisitante);
    }
    return numeroDocumento;
  }
  if (Object.keys(camposVisitante).length > 0) {
    const visitanteActual = await Visitante.findByPk(visita.numeroDocumento);
    if (visitanteActual) await visitanteActual.update(camposVisitante);
  }
  return undefined;
}

export const actualizarVisita = async (req, res) => {
  try {
    const { idVisita } = req.params;
    const {
      numeroDocumento,
      nombreVisitante,
      tipoDocumentoId,
      apartamentoId,
      fechaHoraIngreso,
      estadoId,
      observaciones,
      telefono,
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
    } = req.body;

    const visita = await Visita.findByPk(idVisita);
    if (!visita) {
      return res
        .status(404)
        .json({ error: "Visita no encontrada", status: 404 });
    }

    const updateData = {};

    // Validar fecha
    if (fechaHoraIngreso) {
      const resultado = validarFechaIngreso(fechaHoraIngreso);
      if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
      }
      updateData.fechaHoraIngreso = resultado.formatted;
    }

    if (apartamentoId !== undefined) updateData.apartamentoId = apartamentoId;
    if (estadoId !== undefined) updateData.estadoId = estadoId;
    if (observaciones !== undefined) updateData.observaciones = observaciones;
    if (telefono !== undefined) updateData.telefono = telefono;

    // Actualizar visitante
    const camposVisitante = buildVisitanteData(
      nombreVisitante,
      tipoDocumentoId,
    );
    const nuevoDoc = await actualizarVisitanteAsociado(
      visita,
      numeroDocumento,
      camposVisitante,
    );
    if (nuevoDoc) updateData.numeroDocumento = nuevoDoc;

    // Actualizar vehículo
    if (
      matricula !== undefined ||
      tipoVehiculoId !== undefined ||
      codigoParqueadero !== undefined
    ) {
      updateData.vehiculoMatricula = await procesarActualizacionVehiculo(
        visita,
        matricula,
        tipoVehiculoId,
        codigoParqueadero,
      );
    }

    await visita.update(updateData);

    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(usuarioActual, "visitas", "UPDATE", idVisita);

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Visita actualizada correctamente",
      body: visita,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Error al actualizar la visita" });
  }
};

export const finalizarVisita = async (req, res) => {
  try {
    const { idVisita } = req.params;
    let fechaHoraSalida = dayjs().tz(TIMEZONE_COLOMBIA).toDate();

    const visita = await Visita.findByPk(idVisita);
    if (!visita) {
      return res.status(404).json({
        error: "Visita no encontrada",
        status: 404,
      });
    }

    if (visita.estadoId === ESTADO_VISITA.FINALIZADA) {
      return res.status(400).json({
        error: "La visita ya está finalizada",
        status: 400,
      });
    }

    // Liberar parqueadero si el vehículo lo tiene asignado
    if (visita.vehiculoMatricula) {
      const vehiculo = await Vehiculo.findByPk(visita.vehiculoMatricula);
      if (vehiculo?.codigoParqueadero) {
        await Parqueadero.update(
          { estadoId: ESTADO_PARQUEADERO.DISPONIBLE }, // Disponible
          { where: { codigoParqueadero: vehiculo.codigoParqueadero } },
        );
      }
    }
    await visita.update({
      estadoId: ESTADO_VISITA.FINALIZADA,
      fechaHoraSalida,
    });

    // Registrar en auditoría
    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(usuarioActual, "visitas", "DELETE", idVisita);

    // Recargar la visita con sus relaciones
    const visitaActualizada = await Visita.findByPk(idVisita, {
      include: [
        {
          model: Vehiculo,
          include: [tiposVehiculoModel], // opcional, solo si quieres traer también el tipo
        },
      ],
    });

    res.status(200).json({
      ok: true,
      message: "Visita finalizada correctamente",
      status: 200,
      body: visitaActualizada.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Error interno al finalizar visita",
      status: 500,
      details: error.message,
    });
  }
};

export const visitasDelDia = async (req, res) => {
  try {
    const visitasDia = await Visita.count({
      where: where(fn("DATE", col("fechaHoraIngreso")), "=", fn("CURDATE")),
    });
    res.status(200).json({
      ok: true,
      visitasDia,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener visitas del día" });
  }
};
function corregirFecha(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;

  // Normaliza a formato YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export const informeVisintante = async (req, res) => {
  try {
    const { por } = req.params;
    const tipoFiltro = Number.parseInt(por, 10);

    let { fechaInicio, fechaFin } = req.body.rango || req.body;

    fechaInicio = corregirFecha(fechaInicio);
    fechaFin = corregirFecha(fechaFin);

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ ok: false, msg: "Fechas inválidas" });
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      [fechaInicio, fechaFin] = [fechaFin, fechaInicio];
    }

    let informevisitante;
    const commonWhere = {
      fechaHoraIngreso: {
        [Op.between]: [fechaInicio, fechaFin],
      },
    };

    if (tipoFiltro === 1) {
      informevisitante = await Visita.findAll({
        attributes: [
          [literal("YEAR(fechaHoraIngreso)"), "anio"],
          [fn("COUNT", col("idVisita")), "numeroVisitas"],
        ],
        where: commonWhere,
        group: [literal("anio")],
        order: [[literal("anio"), "ASC"]],
      });
    }

    if (tipoFiltro === 2) {
      informevisitante = await Visita.findAll({
        attributes: [
          [literal("YEAR(fechaHoraIngreso)"), "anio"],
          [literal("MONTH(fechaHoraIngreso)"), "mes"],
          [fn("COUNT", col("idVisita")), "numeroVisitas"],
        ],
        where: commonWhere,
        group: [literal("anio"), literal("mes")],
        order: [
          [literal("anio"), "ASC"],
          [literal("mes"), "ASC"],
        ],
      });
    }

    if (tipoFiltro === 3) {
      informevisitante = await Visita.findAll({
        attributes: [
          [literal("YEAR(fechaHoraIngreso)"), "anio"],
          [literal("MONTH(fechaHoraIngreso)"), "mes"],
          [literal("FLOOR((DAY(fechaHoraIngreso)-1)/7)+1"), "semanaMes"],
          [fn("COUNT", col("idVisita")), "numeroVisitas"],
        ],
        where: commonWhere,
        group: [literal("anio"), literal("mes"), literal("semanaMes")],
        order: [
          [literal("anio"), "ASC"],
          [literal("mes"), "ASC"],
          [literal("semanaMes"), "ASC"],
        ],
      });
    }
    return res.json(informevisitante);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Error interno" });
  }
};
