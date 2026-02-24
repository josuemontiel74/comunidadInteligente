import rateLimit from "express-rate-limit";

// ── Rate limiting general: 200 req / 15 min por IP ────────────────────────────
export const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    status: 429,
    message: "Demasiadas solicitudes. Intenta más tarde.",
  },
});

// ── Rate limiting estricto en login: 10 intentos / 15 min ────────────────────
export const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    status: 429,
    message: "Demasiados intentos de inicio de sesión. Intenta más tarde.",
  },
});
