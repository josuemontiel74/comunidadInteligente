import { sequelize } from "../config/connect.db.js";

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
    const sql = `
            INSERT INTO logErrores (
                fechaHora, 
                nivel, 
                username, 
                rutaAfectada, 
                mensajeError, 
                stackTrace
            )
            VALUES (NOW(), ?, ?, ?, ?, ?);
        `;

    const values = [nivel, username, rutaAfectada, mensajeError, stackTrace];

    await sequelize.query(sql, {
      replacements: values,
    });
  } catch (dbError) {
    console.error(dbError);
    // fallo critico al registrar en logErrores
  }
}
