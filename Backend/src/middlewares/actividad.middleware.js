import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Middleware global que actualiza `ultimaActividad` del usuario autenticado
 * en cada petición que lleve un token JWT válido.
 *
 * - Se ejecuta ANTES de las rutas
 * - Decodifica el token silenciosamente (sin enviar 401)
 * - Si el token es válido, actualiza la fecha en background (fire-and-forget)
 * - Si no hay token o es inválido, simplemente continúa sin hacer nada
 * - NUNCA bloquea ni modifica la respuesta
 */
export const actualizarActividad = (req, res, next) => {
  try {
    const authHeader =
      req.header("Authorization") || req.header("authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.username) {
        // Fire-and-forget: actualiza sin esperar ni bloquear
        User.update(
          { ultimaActividad: new Date() },
          { where: { username: decoded.username } },
        ).catch(() => {});
      }
    }
  } catch {
    // Token inválido o expirado → no hacer nada
  }
  next();
};
