import { sequelize } from "../config/connect.db.js";

export const obtenerRegistrosAuditoria = async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.idAuditoria,
        a.username,
        a.fechaHoraAuditoria,
        a.operacionRealizada,
        a.tablaAfectada,
        a.idRegistroAfectado,
        CASE
          WHEN a.tablaAfectada = 'usuarios' THEN u.username
          WHEN a.tablaAfectada = 'ocupantes' THEN (
            SELECT CONCAT(p.primerNombre, ' ', p.primerApellido)
            FROM ocupante o
            INNER JOIN personas p ON o.numeroDocumento = p.numeroDocumento
            WHERE o.idOcupante = a.idRegistroAfectado
          )
          WHEN a.tablaAfectada = 'residentes' THEN (
            SELECT CONCAT(p.primerNombre, ' ', p.primerApellido)
            FROM personas p
            WHERE p.numeroDocumento = a.idRegistroAfectado
          )
          WHEN a.tablaAfectada = 'visitantes' THEN (
            SELECT v.nombreVisitante
            FROM visitantes v
            WHERE v.numeroDocumento = a.idRegistroAfectado
          )
          WHEN a.tablaAfectada = 'visitas' THEN (
            SELECT vi.nombreVisitante
            FROM visitas vis
            INNER JOIN visitantes vi ON vis.numeroDocumento = vi.numeroDocumento
            WHERE vis.idVisita = a.idRegistroAfectado
          )
          ELSE NULL
        END AS nombreAfectado
      FROM auditorias a
      LEFT JOIN usuarios u ON a.tablaAfectada = 'usuarios' AND a.idRegistroAfectado = u.username
      ORDER BY a.fechaHoraAuditoria DESC
    `;

    const [resultados] = await sequelize.query(sql);

    return res.status(200).json({
      success: true,
      data: resultados,
    });
  } catch (error) {
    console.error("Error al obtener registros de auditoría:", error);
    return res.status(500).json({
      success: false,
      message:
        "Error interno del servidor al obtener los registros de auditoría",
    });
  }
};
