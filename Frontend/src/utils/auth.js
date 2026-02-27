/**
 * Utilidades de autenticación compartidas.
 * Reemplaza las funciones duplicadas en cada página.
 */

/**
 * Verifica si un token JWT está expirado.
 * @param {string} token - Token JWT
 * @returns {boolean} true si el token está vencido o es inválido
 */
export function verificarTokenVencido(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Extrae el rolesId del payload de un token JWT.
 * @param {string} token - Token JWT
 * @returns {number|null} rolesId o null si es inválido
 */
export function obtenerRolFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.rolesId;
  } catch {
    return null;
  }
}

/**
 * Extrae el nombre de usuario del payload de un token JWT.
 * @param {string} token - Token JWT
 * @returns {string|null} username o null si es inválido
 */
export function obtenerUsuarioFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? payload.nombre ?? null;
  } catch {
    return null;
  }
}

/**
 * Obtiene el token almacenado en localStorage.
 * @returns {string|null}
 */
export function obtenerToken() {
  return localStorage.getItem("token");
}
