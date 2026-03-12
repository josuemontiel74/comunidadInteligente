import { sequelize } from "../config/connect.db.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE_COLOMBIA = "America/Bogota";

/**
 * Registra una acción de auditoría en la base de datos.
 * @param {string} username - El nombre de usuario (PK de la tabla usuarios) que realizó la acción.
 * @param {string} tabla - El nombre de la tabla afectada (ej. 'visitas', 'usuarios').
 * @param {string} operacion - El tipo de acción ('INSERT', 'UPDATE', 'DELETE').
 * @param {number|string} idRegistroAfectado - La clave primaria (PK) del registro afectado.
 * @returns {Promise<void>}
 */
export async function registrarAuditoria(
  username,
  tabla,
  operacion,
  idRegistroAfectado,
) {
  const pkAfectada = String(idRegistroAfectado);

  const ahora = dayjs().tz(TIMEZONE_COLOMBIA).format("YYYY-MM-DD HH:mm:ss");
  const sql = `
    INSERT INTO auditorias (username, fechaHoraAuditoria, operacionRealizada, tablaAfectada, idRegistroAfectado)
    VALUES (?, ?, ?, ?, ?);
`;
  const values = [username, ahora, operacion, tabla, pkAfectada];

  try {
    await sequelize.query(sql, { replacements: values });
  } catch (error) {
    console.error(error);
    // La falla en la auditoría NO debe impedir la operación principal
  }
}
