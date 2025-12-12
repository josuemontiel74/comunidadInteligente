import dayjs from "dayjs";
import Ocupante from "../models/ocupante.model.js";
import Persona from "../models/personas.model.js";
import { sequelize } from "../config/connect.db.js";

export const crearOcupante = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const dataOcupante = req.body;

    const [persona, created] = await Persona.findOrCreate({
      where: { numeroDocumento: dataOcupante.numeroDocumento },
      defaults: {
        numeroDocumento: dataOcupante.numeroDocumento,
        tipoDocumentoId: dataOcupante.tipoDocumentoId,
        primerNombre: dataOcupante.primerNombre,
        segundoNombre: dataOcupante.segundoNombre,
        primerApellido: dataOcupante.primerApellido,
        segundoApellido: dataOcupante.segundoApellido,
        telefono: dataOcupante.telefono,
        correoElectronico: dataOcupante.correoElectronico,
      },
      transaction: t,
    });

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
        estadoId: 5,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      message: "Ocupante creado correctamente",
      ocupante: createOcupante,
      persona: persona,
      personaNueva: created,
    });
  } catch (error) {
    await t.rollback();
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
      LEFT JOIN apartamentos AS ap ON oc.apartamentosId = ap.idApartamento 
      LEFT JOIN personas AS pe ON TRIM(oc.numeroDocumento) = TRIM(pe.numeroDocumento)
      LEFT JOIN estados AS es ON oc.estadoId = es.idEstado
      ORDER BY oc.idOcupante
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
    console.error("Error al listar ocupantes:", error);
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
        estadoId: dataOcupante.estadoId,
      },
      { where: { idOcupante: id }, transaction: t }
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
        }
      );
    }

    const updatedOcupante = await Ocupante.findOne({
      where: { idOcupante: id },
      include: [{ model: Persona, as: "persona" }],
      transaction: t,
    });

    await t.commit();
    res.status(200).json(updatedOcupante);
  } catch (error) {
    await t.rollback();
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
        fechaFin: dayjs().format("YYYY-MM-DD"),
      },
      { where: { idOcupante: id } }
    );
    if (updated) {
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