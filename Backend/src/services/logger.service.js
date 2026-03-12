import { sequelize } from "../config/connect.db.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE_COLOMBIA = "America/Bogota";

/**
 * Registra un fallo crítico en la tabla logErrores.
 * @param {string} nivel - Nivel de severidad ('ERROR', 'CRITICAL').
 * @param {string | null} username - El nombre de usuario que causó el error (o null si no estaba logueado).
 * @param {string} rutaAfectada - La ruta del endpoint donde ocurrió el error (Ej: 'PUT /visitas/:id').
 * @param {string} mensajeError - Un resumen legible del error (Ej: 'Error al conectar la BD').
 * @param {string | null} stackTrace - La traza completa del error (error.stack).
 */
export async function registrarFallo(
  nivel,
  username,
  rutaAfectada,
  mensajeError,
  stackTrace,
) {
  try {
    const ahora = dayjs().tz(TIMEZONE_COLOMBIA).format("YYYY-MM-DD HH:mm:ss");
    const sql = `
            INSERT INTO logerrores (
                fechaHora, 
                nivel, 
                username, 
                rutaAfectada, 
                mensajeError, 
                stackTrace
            )
            VALUES (?, ?, ?, ?, ?, ?);
        `;

    const values = [ahora, nivel, username, rutaAfectada, mensajeError, stackTrace];

    await sequelize.query(sql, {
      replacements: values,
    });
  } catch (dbError) {
    console.error(dbError);
    // fallo critico al registrar en logErrores
  }
}
