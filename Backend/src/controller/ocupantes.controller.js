import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { Op } from "sequelize";

dayjs.extend(utc);
dayjs.extend(timezone);
import Ocupante from "../models/ocupante.model.js";
import Persona from "../models/personas.model.js";
import { sequelize } from "../config/connect.db.js";
import { registrarAuditoria } from "../services/auditorias.service.js";
import { registrarFallo } from "../services/logger.service.js";
import {
  validarCamposNombre,
  validarTelefono,
  validarNumeroDocumento,
} from "../utils/validaciones.js";
import { ESTADO_OCUPANTE, TIMEZONE_COLOMBIA } from "../utils/constantes.js";

export const crearOcupante = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const dataOcupante = req.body;

    // Si se envía numeroDocumento intentamos encontrar o crear; si no, creamos la persona
    let persona;
    let created = false;
    const personaDefaults = {
      numeroDocumento: dataOcupante.numeroDocumento,
      tipoDocumentoId: dataOcupante.tipoDocumentoId,
      primerNombre: dataOcupante.primerNombre,
      segundoNombre: dataOcupante.segundoNombre,
      primerApellido: dataOcupante.primerApellido,
      segundoApellido: dataOcupante.segundoApellido,
      telefono: dataOcupante.telefono,
      correoElectronico: dataOcupante.correoElectronico,
    };

    // Validar documento
    const errorDoc = validarNumeroDocumento(
      dataOcupante.tipoDocumentoId,
      dataOcupante.numeroDocumento,
    );
    if (errorDoc) {
      await t.rollback();
      return res.status(400).json({ message: errorDoc, status: 400 });
    }

    // Validar teléfono 
    const errorTel = validarTelefono(dataOcupante.telefono);
    if (errorTel) {
      await t.rollback();
      return res.status(400).json({ message: errorTel, status: 400 });
    }

    // Validar nombres antes de guardar
    const errorNombre = validarCamposNombre({
      "Primer nombre": dataOcupante.primerNombre,
      "Segundo nombre": dataOcupante.segundoNombre,
      "Primer apellido": dataOcupante.primerApellido,
      "Segundo apellido": dataOcupante.segundoApellido,
    });
    if (errorNombre) {
      await t.rollback();
      return res.status(400).json({ message: errorNombre, status: 400 });
    }

    // Verificar que el apartamento no tenga ya un ocupante activo del mismo tipo
    if (dataOcupante.apartamentosId && dataOcupante.tipoOcupacion) {
      const ocupanteExistente = await Ocupante.findOne({
        where: {
          apartamentosId: dataOcupante.apartamentosId,
          tipoOcupacion: dataOcupante.tipoOcupacion,
          estadoId: { [Op.notIn]: ESTADO_OCUPANTE.INACTIVOS }, // excluir inactivos/finalizados
        },
        transaction: t,
      });
      if (ocupanteExistente) {
        await t.rollback();
        const tipo =
          dataOcupante.tipoOcupacion === "propietario"
            ? "propietario"
            : "arrendatario";
        return res.status(409).json({
          message: `El apartamento ya tiene un ${tipo} activo. Finalice el proceso actual antes de registrar uno nuevo.`,
          status: 409,
        });
      }
    }

    if (dataOcupante.numeroDocumento) {
      [persona, created] = await Persona.findOrCreate({
        where: { numeroDocumento: dataOcupante.numeroDocumento },
        defaults: personaDefaults,
        transaction: t,
      });
    } else {
      // Si no llegó numeroDocumento, creamos la persona para que el modelo pueda generar el valor (si aplica)
      persona = await Persona.create(personaDefaults, { transaction: t });
      created = true;
    }

    const createOcupante = await Ocupante.create(
      {
        apartamentosId: dataOcupante.apartamentosId,
        numeroDocumento: persona.numeroDocumento,
        tipoOcupacion: dataOcupante.tipoOcupacion,
        personasACargo: dataOcupante.personasACargo,
        fechaInicio: dataOcupante.fechaInicio
          ? dayjs(dataOcupante.fechaInicio).format("YYYY-MM-DD")
          : null,
        fechaFin: dataOcupante.fechaFin
          ? dayjs(dataOcupante.fechaFin).format("YYYY-MM-DD")
          : null,
        tieneNinos: dataOcupante.tieneNinos,
        tieneAdultoMayor: dataOcupante.tieneAdultoMayor,
        tieneDiscapacidad: dataOcupante.tieneDiscapacidad,
        estadoId: ESTADO_OCUPANTE.ACTIVO,
      },
      { transaction: t },
    );

    await t.commit();

    // Registrar en auditoría
    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(
      usuarioActual,
      "ocupantes",
      "INSERT",
      createOcupante.idOcupante,
    );

    res.status(201).json({
      message: "Ocupante creado correctamente",
      ocupante: createOcupante,
      persona: persona,
      personaNueva: created,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "POST /ocupantes";

    await t.rollback();

    // Registrar el error en el logger
    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      message: "Lo siento, no se pudo registrar el ocupante",
      status: 500,
      error: error.message,
    });
  }
};

export const listarOcupantes = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
     SELECT 
    oc.idOcupante,
    oc.apartamentosId,
    oc.numeroDocumento,
    oc.tipoOcupacion,
    oc.personasACargo,
    oc.fechaInicio,
    oc.fechaFin,
    oc.tieneNinos,
    oc.tieneAdultoMayor,
    oc.tieneDiscapacidad,
    oc.estadoId,
    es.nombreEstado,
    ap.idApartamento,
    ap.numeroApartamento,
    ap.torresId,
    pe.tipoDocumentoId,
    pe.primerNombre,
    pe.segundoNombre,
    pe.primerApellido,
    pe.segundoApellido,
    pe.telefono,
    pe.correoElectronico
FROM ocupante AS oc
JOIN apartamentos AS ap 
    ON oc.apartamentosId = ap.idApartamento
JOIN personas AS pe 
    ON oc.numeroDocumento = pe.numeroDocumento
JOIN estados AS es
    ON oc.estadoId = es.idEstado;
    `);
    
    console.log('Total resultados:', results.length);
    if (results.length > 0) {
      console.log('Primer resultado:', JSON.stringify(results[0], null, 2));
      const conPersona = results.filter(r => r.primerNombre !== null).length;
      const sinPersona = results.filter(r => r.primerNombre === null).length;
      console.log(`Con persona: ${conPersona}, Sin persona: ${sinPersona}`);
    }
    
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Listado de ocupantes",
      body: results,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /ocupantes";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      error: "Error interno al listar ocupantes",
      status: 500,
      details: error.message,
    });
  }
};

export const obtenerOcupante = async (req, res) => {
  try {
    const ocupantes = await Ocupante.findAll({
      include: [
        {
          model: Persona,
          as: "persona",
        },
      ],
    });
    res.status(200).json(ocupantes);
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /ocupantes";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      message: "Lo siento, no se pudo obtener la lista de ocupantes",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerOcupantePorId = async (req, res) => {
  try {
    const id = req.params.idOcupante;
    const ocupante = await Ocupante.findOne({
      where: { idOcupante: id },
      include: [
        {
          model: Persona,
          as: "persona",
        },
      ],
    });

    if (ocupante) {
      res.status(200).json(ocupante);
    } else {
      res.status(404).json({
        message: "Ocupante no encontrado",
        status: 404,
      });
    }
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /ocupantes/:id";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      message: "Lo siento, no se pudo obtener el ocupante",
      status: 500,
      error: error.message,
    });
  }
};

export const actualizarOcupante = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.idOcupante;
    const dataOcupante = req.body;
    const [updated] = await Ocupante.update(
      {
        apartamentosId: dataOcupante.apartamentosId,
        tipoOcupacion: dataOcupante.tipoOcupacion,
        personasACargo: dataOcupante.personasACargo,
        fechaInicio: dataOcupante.fechaInicio,
        fechaFin: dataOcupante.fechaFin,
        tieneNinos: dataOcupante.tieneNinos,
        tieneAdultoMayor: dataOcupante.tieneAdultoMayor,
        tieneDiscapacidad: dataOcupante.tieneDiscapacidad,
        estadoId: dataOcupante.estadoId,
      },
      { where: { idOcupante: id }, transaction: t },
    );

    if (!updated) {
      await t.rollback();
      return res.status(404).json({
        message: "Ocupante no encontrado",
        status: 404,
      });
    }

    if (dataOcupante.numeroDocumento) {
      await Persona.update(
        {
          tipoDocumentoId: dataOcupante.tipoDocumentoId,
          primerNombre: dataOcupante.primerNombre,
          segundoNombre: dataOcupante.segundoNombre,
          primerApellido: dataOcupante.primerApellido,
          segundoApellido: dataOcupante.segundoApellido,
          telefono: dataOcupante.telefono,
          correoElectronico: dataOcupante.correoElectronico,
        },
        {
          where: { numeroDocumento: dataOcupante.numeroDocumento },
          transaction: t,
        },
      );
    }

    const updatedOcupante = await Ocupante.findOne({
      where: { idOcupante: id },
      include: [{ model: Persona, as: "persona" }],
      transaction: t,
    });

    await t.commit();

    // Registrar en auditoría
    const usuarioActual = req.user?.username || "desconocido";
    await registrarAuditoria(usuarioActual, "ocupantes", "UPDATE", id);

    res.status(200).json(updatedOcupante);
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "PATCH /ocupantes/:id";

    await t.rollback();

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      message: "Lo siento, no se pudo actualizar el ocupante",
      status: 500,
      error: error.message,
    });
  }
};

export const finalizarOcupante = async (req, res) => {
  try {
    const id = req.params.idOcupante;
    const [updated] = await Ocupante.update(
      {
        estadoId: 6,
        fechaFin: dayjs().tz(TIMEZONE_COLOMBIA).format("YYYY-MM-DD"),
      },
      { where: { idOcupante: id } },
    );
    if (updated) {
      // Registrar en auditoría
      const usuarioActual = req.user?.username || "desconocido";
      await registrarAuditoria(usuarioActual, "ocupantes", "DELETE", id);

      res
        .status(200)
        .json({ message: "Ocupante se ha finalizado correctamente" });
    } else {
      res.status(404).json({
        message: "Ocupante no encontrado",
        status: 404,
      });
    }
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "DELETE /ocupantes/:id";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      message: "Lo siento, no se pudo finalizar el ocupante",
      status: 500,
      error: error.message,
    });
  }
};

// FUNCIÓN ADICIONAL PARA DIAGNÓSTICO
export const verificarDocumentos = async (req, res) => {
  try {
    // Ocupantes sin persona
    const [ocupantesSinPersona] = await sequelize.query(`
      SELECT 
        oc.idOcupante,
        oc.numeroDocumento as doc_ocupante,
        oc.tipoOcupacion,
        pe.numeroDocumento as doc_persona
      FROM ocupante AS oc 
      LEFT JOIN personas AS pe ON TRIM(oc.numeroDocumento) = TRIM(pe.numeroDocumento)
      WHERE pe.numeroDocumento IS NULL
    `);

    // Personas sin ocupante
    const [personasSinOcupante] = await sequelize.query(`
      SELECT 
        pe.numeroDocumento,
        pe.primerNombre,
        pe.primerApellido
      FROM personas AS pe
      LEFT JOIN ocupante AS oc ON TRIM(pe.numeroDocumento) = TRIM(oc.numeroDocumento)
      WHERE oc.numeroDocumento IS NULL
    `);

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Verificación de documentos",
      ocupantesSinPersona: {
        cantidad: ocupantesSinPersona.length,
        datos: ocupantesSinPersona
      },
      personasSinOcupante: {
        cantidad: personasSinOcupante.length,
        datos: personasSinOcupante
      }
    });
  } catch (error) {
    console.error("Error al verificar documentos:", error);
    res.status(500).json({
      error: "Error interno",
      status: 500,
      details: error.message
    });
  }
};