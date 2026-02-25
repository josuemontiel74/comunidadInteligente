/**
 * Configuración central de la URL base de la API.
 *
 * Usar la variable de entorno VITE_API_URL en producción.
 * Por defecto apunta al servidor de desarrollo local.
 *
 * Ejemplo de .env:
 *   VITE_API_URL=https://mi-api.ejemplo.com
 */
export const API_ORIGIN = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export const API_BASE = `${API_ORIGIN}/api`;
