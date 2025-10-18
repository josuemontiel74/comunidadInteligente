import Visita from "../models/visitas.model.js";
import Visitante from "../models/visitantes.model.js";
import Vehiculo from "../models/vehiculo.model.js";
import Parqueadero from "../models/parqueaderos.model.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import tiposVehiculoModel from "../models/tiposVehiculo.model.js";
import { sequelize } from "../config/connect.db.js";

dayjs.extend(utc);
dayjs.extend(timezone);

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
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
    } = req.body;

    console.log(" Datos recibidos:", req.body);

    const fechaActual = dayjs().tz("America/Bogota");

    const fechaIngreso = fechaHoraIngreso
      ? dayjs(fechaHoraIngreso, "YYYY-MM-DD HH:mm", true).tz("America/Bogota")
      : fechaActual;

    // Validaciones de fecha
    if (!fechaIngreso.isValid()) {
      return res.status(400).json({ error: "La fecha de ingreso no es válida" });
    }

    if (fechaIngreso.isBefore(fechaActual.subtract(1, "minute"))) {
      return res.status(400).json({
        error: "La fecha y hora de ingreso no puede ser anterior a la actual",
      });
    }

    if (fechaIngreso.year() > 2100) {
      return res.status(400).json({
        error: "El año de la fecha de ingreso no puede ser mayor a 2100",
      });
    }

    //  Crear o actualizar visitante
    let visitante = await Visitante.findByPk(numeroDocumento);
    if (!visitante) {
      visitante = await Visitante.create({
        numeroDocumento,
        ...(nombreVisitante && { nombreVisitante }),
        ...(tipoDocumentoId && { tipoDocumentoId }),
      });
      console.log(" Nuevo visitante creado:", visitante.numeroDocumento);
    } else if (nombreVisitante || tipoDocumentoId) {
      await visitante.update({
        ...(nombreVisitante && { nombreVisitante }),
        ...(tipoDocumentoId && { tipoDocumentoId }),
      });
      console.log(" Visitante actualizado:", visitante.numeroDocumento);
    }

    let vehiculoMatricula = null;
    let parqueadero = null;

    // Procesar vehículo solo si se envía matrícula
    if (matricula && matricula.trim() !== "") {
      if (
        !tipoVehiculoId ||
        !codigoParqueadero ||
        codigoParqueadero.trim() === ""
      ) {
        return res.status(400).json({
          error: "Debe proporcionar tipo de vehículo y código de parqueadero",
        });
      }

      parqueadero = await Parqueadero.findByPk(codigoParqueadero);
      if (!parqueadero) {
        return res.status(400).json({ error: "El parqueadero no existe" });
      }

      if (Number(parqueadero.estadoId) !== 4) {
        return res
          .status(400)
          .json({ error: "El parqueadero no está disponible" });
      }

      let vehiculo = await Vehiculo.findByPk(matricula);
      if (!vehiculo) {
        vehiculo = await Vehiculo.create({
          matricula,
          tipoVehiculoId,
          codigoParqueadero,
        });
        console.log(" Nuevo vehículo creado:", matricula);
      } else {
        // Si tenía parqueadero distinto → liberarlo
        if (
          vehiculo.codigoParqueadero &&
          vehiculo.codigoParqueadero !== codigoParqueadero
        ) {
          await Parqueadero.update(
            { estadoId: 4 },
            { where: { codigoParqueadero: vehiculo.codigoParqueadero } }
          );
          console.log(`Parqueadero ${vehiculo.codigoParqueadero} liberado`);
        }

        await vehiculo.update({
          tipoVehiculoId,
          codigoParqueadero,
        });
        console.log(" Vehículo actualizado:", matricula);
      }

      vehiculoMatricula = matricula;
    }

    //  Crear la visita
    const visita = await Visita.create({
      numeroDocumento,
      apartamentoId,
      fechaHoraIngreso: fechaIngreso.format("YYYY-MM-DD HH:mm"),
      estadoId: estadoId || 8, // Por defecto "En curso" o "Activa"
      vehiculoMatricula,
      observaciones: observaciones || null,
    });

    console.log(" Visita creada exitosamente:", visita.toJSON());

    // 🚧 Ocupar parqueadero SOLO si la visita fue creada correctamente
    if (parqueadero && vehiculoMatricula) {
      await parqueadero.update({ estadoId: 3 });
      console.log(`🅿Parqueadero ${codigoParqueadero} ocupado`);
    }

    res.status(201).json({
      mensaje: "Visita creada correctamente",
      visita,
    });
  } catch (error) {
    console.error(" Error al crear visita:", error);
    return res.status(400).json({ error: error.message });
  }
};



export const listarVisitas = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
SELECT 
    vi.idVisita,
    vi.numeroDocumento,
    ve.nombreVisitante,
    ve.tipoDocumentoId,
    vi.apartamentoId,
    ap.numeroApartamento,
    t.nombreTorre,
    vi.fechaHoraIngreso,
    vi.fechaHoraSalida,
    vi.observaciones,
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

    res.json(results);
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
          .tz("America/Bogota")
          .format("YYYY-MM-DD hh:mm A"),
        fechaHoraSalida: visita.fechaHoraSalida
          ? dayjs(visita.fechaHoraSalida)
              .tz("America/Bogota")
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
          .tz("America/Bogota")
          .format("YYYY-MM-DD hh:mm A"),
        fechaHoraSalida: visita.fechaHoraSalida
          ? dayjs(visita.fechaHoraSalida)
              .tz("America/Bogota")
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
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
    } = req.body;

    console.log("📝 Datos de actualización recibidos:", req.body);

    const visita = await Visita.findByPk(idVisita);
    if (!visita) {
      return res.status(404).json({
        error: "Visita no encontrada",
        status: 404,
      });
    }

    const updateData = {};

    // Validar fecha solo si se proporciona
    if (fechaHoraIngreso) {
      const fechaIngreso = dayjs(fechaHoraIngreso, "YYYY-MM-DD HH:mm", true).tz(
        "America/Bogota"
      );

      if (!fechaIngreso.isValid()) {
        return res.status(400).json({
          error: "La fecha de ingreso no es válida",
        });
      }

      if (fechaIngreso.year() > 2100) {
        return res.status(400).json({
          error: "El año de la fecha de ingreso no puede ser mayor a 2100",
        });
      }

      updateData.fechaHoraIngreso = fechaIngreso.format("YYYY-MM-DD HH:mm");
    }

    // Actualizar campos básicos
    if (apartamentoId !== undefined) updateData.apartamentoId = apartamentoId;
    if (estadoId !== undefined) updateData.estadoId = estadoId;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    // Actualizar visitante si cambió
    if (numeroDocumento && numeroDocumento !== visita.numeroDocumento) {
      let visitante = await Visitante.findByPk(numeroDocumento);
      if (!visitante) {
        const visitanteData = {
          numeroDocumento,
          ...(nombreVisitante && { nombreVisitante }),
          ...(tipoDocumentoId && { tipoDocumentoId }),
        };
        visitante = await Visitante.create(visitanteData);
        console.log("✅ Nuevo visitante creado:", numeroDocumento);
      } else if (nombreVisitante || tipoDocumentoId) {
        const visitanteUpdateData = {};
        if (nombreVisitante)
          visitanteUpdateData.nombreVisitante = nombreVisitante;
        if (tipoDocumentoId)
          visitanteUpdateData.tipoDocumentoId = tipoDocumentoId;

        await visitante.update(visitanteUpdateData);
        console.log("✅ Visitante actualizado:", numeroDocumento);
      }
      updateData.numeroDocumento = numeroDocumento;
    } else if (nombreVisitante || tipoDocumentoId) {
      // Actualizar visitante actual
      const visitanteActual = await Visitante.findByPk(visita.numeroDocumento);
      if (visitanteActual) {
        const visitanteUpdateData = {};
        if (nombreVisitante)
          visitanteUpdateData.nombreVisitante = nombreVisitante;
        if (tipoDocumentoId)
          visitanteUpdateData.tipoDocumentoId = tipoDocumentoId;

        await visitanteActual.update(visitanteUpdateData);
        console.log("✅ Visitante actual actualizado:", visita.numeroDocumento);
      }
    }

    // Manejar actualización de vehículo
    if (
      matricula !== undefined ||
      tipoVehiculoId !== undefined ||
      codigoParqueadero !== undefined
    ) {
      // Si se está removiendo el vehículo
      if (!matricula || matricula.trim() === "") {
        // Liberar parqueadero anterior si existía
        if (visita.vehiculoMatricula) {
          const vehiculoAnterior = await Vehiculo.findByPk(
            visita.vehiculoMatricula
          );
          if (vehiculoAnterior && vehiculoAnterior.codigoParqueadero) {
            await Parqueadero.update(
              { estadoId: 4 },
              {
                where: {
                  codigoParqueadero: vehiculoAnterior.codigoParqueadero,
                },
              }
            );
            console.log(
              `Parqueadero ${vehiculoAnterior.codigoParqueadero} liberado al remover vehículo`
            );
          }
        }
        updateData.vehiculoMatricula = null;
      }
      // Si se está asignando o cambiando un vehículo
      else if (
        matricula &&
        tipoVehiculoId &&
        codigoParqueadero &&
        codigoParqueadero.trim() !== ""
      ) {
        const parqueadero = await Parqueadero.findByPk(codigoParqueadero);
        if (!parqueadero) {
          return res.status(400).json({ error: "El parqueadero no existe" });
        }

        // Verificar disponibilidad del parqueadero
        const vehiculoActual = visita.vehiculoMatricula
          ? await Vehiculo.findByPk(visita.vehiculoMatricula)
          : null;

        const esElMismoVehiculo = visita.vehiculoMatricula === matricula;
        const esElMismoParqueadero =
          vehiculoActual &&
          vehiculoActual.codigoParqueadero === codigoParqueadero;

        if (!esElMismoParqueadero && parqueadero.estadoId !== 4) {
          return res
            .status(400)
            .json({ error: "El parqueadero no está disponible" });
        }

        // Liberar parqueadero anterior si la visita tenía un vehículo diferente
        if (
          visita.vehiculoMatricula &&
          visita.vehiculoMatricula !== matricula
        ) {
          const vehiculoAnterior = await Vehiculo.findByPk(
            visita.vehiculoMatricula
          );
          if (vehiculoAnterior && vehiculoAnterior.codigoParqueadero) {
            await Parqueadero.update(
              { estadoId: 4 },
              {
                where: {
                  codigoParqueadero: vehiculoAnterior.codigoParqueadero,
                },
              }
            );
            console.log(
              `Parqueadero anterior ${vehiculoAnterior.codigoParqueadero} liberado`
            );
          }
        }

        // Manejar el vehículo
        let vehiculo = await Vehiculo.findByPk(matricula);
        if (!vehiculo) {
          vehiculo = await Vehiculo.create({
            matricula,
            tipoVehiculoId,
            codigoParqueadero,
          });
          console.log(`✅ Nuevo vehículo creado: ${matricula}`);
        } else {
          // Liberar parqueadero anterior del vehículo si es diferente
          if (
            vehiculo.codigoParqueadero &&
            vehiculo.codigoParqueadero !== codigoParqueadero
          ) {
            await Parqueadero.update(
              { estadoId: 4 },
              { where: { codigoParqueadero: vehiculo.codigoParqueadero } }
            );
            console.log(
              `Parqueadero anterior del vehículo ${vehiculo.codigoParqueadero} liberado`
            );
          }

          await vehiculo.update({
            tipoVehiculoId,
            codigoParqueadero,
          });
          console.log(`✅ Vehículo actualizado: ${matricula}`);
        }

        // Ocupar el nuevo parqueadero
        if (!esElMismoParqueadero) {
          await Parqueadero.update(
            { estadoId: 3 },
            { where: { codigoParqueadero } }
          );
          console.log(`Parqueadero ${codigoParqueadero} ocupado`);
        }

        updateData.vehiculoMatricula = vehiculo.matricula;
      }
      // Si faltan datos del vehículo
      else if (
        matricula &&
        matricula.trim() !== "" &&
        (!tipoVehiculoId ||
          !codigoParqueadero ||
          codigoParqueadero.trim() === "")
      ) {
        return res.status(400).json({
          error:
            "Debe proporcionar tipo de vehículo y código de parqueadero para asignar un vehículo",
        });
      }
    }

    // Actualizar la visita
    await visita.update(updateData);

    console.log("✅ Visita actualizada exitosamente:", updateData);

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Visita actualizada correctamente",
      body: visita,
    });
  } catch (error) {
    console.error("❌ Error al actualizar visita:", error);
    res.status(500).json({
      error: error.message,
      message: "Error al actualizar la visita",
    });
  }
};

export const finalizarVisita = async (req, res) => {
  try {
    const { idVisita } = req.params;

    const visita = await Visita.findByPk(idVisita);
    if (!visita) {
      return res.status(404).json({
        error: "Visita no encontrada",
        status: 404,
      });
    }

    if (visita.estadoId === 9) {
      return res.status(400).json({
        error: "La visita ya está finalizada",
        status: 400,
      });
    }

    // Liberar parqueadero si el vehículo lo tiene asignado
    if (visita.vehiculoMatricula) {
      const vehiculo = await Vehiculo.findByPk(visita.vehiculoMatricula);
      if (vehiculo && vehiculo.codigoParqueadero) {
        await Parqueadero.update(
          { estadoId: 4 }, // Disponible
          { where: { codigoParqueadero: vehiculo.codigoParqueadero } }
        );
      }
    }

    // Guardar fecha salida
    const fechaHoraSalida = dayjs().tz("America/Bogota").toDate();

    await visita.update({
      estadoId: 9,
      fechaHoraSalida,
    });

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
    console.error("❌ Error al finalizar visita:", error);
    res.status(500).json({
      error: "Error interno al finalizar visita",
      status: 500,
      details: error.message,
    });
  }
};
