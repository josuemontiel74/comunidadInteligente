import logErrores from "../models/logErrores.model.js";
import { Op } from "sequelize";

export const obtenerLogErrores = async (req, res) => {
  try {
    const { nivel, desde, hasta, modulo, limite = 200 } = req.query;

    const where = {};

    if (nivel && nivel !== "todos") {
      where.nivel = nivel.toUpperCase();
    }

    if (modulo) {
      where.rutaAfectada = { [Op.like]: `%${modulo}%` };
    }

    if (desde || hasta) {
      where.fechaHora = {};
      if (desde) where.fechaHora[Op.gte] = new Date(desde);
      if (hasta) {
        const hastaFin = new Date(hasta);
        hastaFin.setHours(23, 59, 59, 999);
        where.fechaHora[Op.lte] = hastaFin;
      }
    }

    const registros = await logErrores.findAll({
      where,
      order: [["fechaHora", "DESC"]],
      limit: Number.parseInt(limite, 10),
    });

    return res.status(200).json({
      success: true,
      total: registros.length,
      data: registros,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener el log de errores: " + error.message,
    });
  }
};

export const obtenerResumenLogErrores = async (req, res) => {
  try {
    const { sequelize } = await import("../config/connect.db.js");

    const [resumen] = await sequelize.query(`
      SELECT 
        nivel,
        COUNT(*) AS total,
        MAX(fechaHora) AS ultimoRegistro
      FROM logErrores
      GROUP BY nivel
      ORDER BY total DESC
    `);

    const [ultimos7dias] = await sequelize.query(`
      SELECT 
        DATE(CONVERT_TZ(fechaHora, '+00:00', '-05:00')) AS fecha,
        COUNT(*) AS total
      FROM logErrores
      WHERE fechaHora >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(CONVERT_TZ(fechaHora, '+00:00', '-05:00'))
      ORDER BY fecha ASC
    `);

    return res.status(200).json({
      success: true,
      resumenNivel: resumen,
      ultimos7dias,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al obtener el resumen: " + error.message,
    });
  }
};

export const limpiarLogErrores = async (req, res) => {
  try {
    const { diasAntiguedad = 30 } = req.body;
    const limite = new Date();
    limite.setDate(limite.getDate() - Number.parseInt(diasAntiguedad, 10));

    const eliminados = await logErrores.destroy({
      where: { fechaHora: { [Op.lt]: limite } },
    });

    return res.status(200).json({
      success: true,
      mensaje: `Se eliminaron ${eliminados} registros anteriores a ${diasAntiguedad} días.`,
      eliminados,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error al limpiar el log: " + error.message,
    });
  }
};
