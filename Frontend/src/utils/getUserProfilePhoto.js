/**
 * Obtiene la foto de perfil del usuario almacenada en localStorage.
 * Las fotos se guardan bajo la clave "gu_user_photos" como un mapa
 * `{ [identificador]: urlBase64 }`.
 *
 * @param {string} key - Documento de identidad o username.
 * @returns {string|null} URL de la foto o null.
 */
const PHOTO_STORAGE_KEY = "gu_user_photos";

export default function getUserProfilePhoto(key) {
  try {
    const photos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || "{}");
    return photos[key] || null;
  } catch {
    return null;
  }
}
