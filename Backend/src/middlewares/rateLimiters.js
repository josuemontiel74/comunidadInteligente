import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";

/**
 * Extrae un identificador único del usuario autenticado (JWT) para
 * distribuir el rate limiting por usuario en lugar de solo por IP.
 * Si no hay token válido, retorna la IP (vía ipKeyGenerator) como fallback.
 */
const extractUserKey = (req, res) => {
  try {
    const authHeader =
      req.header("Authorization") || req.header("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.username) {
        return `user_${decoded.username}`;
      }
    }
  } catch {
    // Token inválido o ausente — se usa IP como fallback
  }
  return ipKeyGenerator(req, res);
};

// Rate limiting general: 2 000 req / 15 min por usuario (o IP) ─
// Dimensionado para ~20 trabajadores simultáneos en la misma red,
// cada uno con ~100 req/min de margen operativo.
export const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: extractUserKey,
  message: {
    ok: false,
    status: 429,
    message: "Demasiadas solicitudes. Intenta más tarde.",
  },
});

// Rate limiting en login: 100 intentos / 15 min por IP ─
// Permite que múltiples usuarios inicien/cierren sesión desde la misma red
// sin bloquear la IP compartida.
export const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    status: 429,
    message: "Demasiados intentos de inicio de sesión. Intenta más tarde.",
  },
});
