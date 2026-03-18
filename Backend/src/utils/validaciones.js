/**
 * Utilidades de validación compartidas para el backend.
 * Centraliza las validaciones de nombres, teléfono y número de documento
 * para evitar duplicación entre controladores.
 */

// Patrón: solo letras, espacios, guiones y apóstrofes 
export const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-']+$/;

/** Cuenta dígitos en un string */
const contarDigitos = (str) => (str.match(/\d/g) || []).length;

/** Nombres de tipo de documento por ID numérico */
const NOMBRES_TIPO_DOC = { 2: "CE", 3: "Pasaporte", 4: "PEP", 5: "PPT" };

// Helpers por tipo de documento 

const validarDocCC = (doc) => {
  if (!/^\d+$/.test(doc))
    return "La Cédula de Ciudadanía (CC) debe contener solo dígitos";
  if (doc.length < 5 || doc.length > 10)
    return "La CC debe tener entre 5 y 10 dígitos";
  return null;
};

const validarDocCE = (doc, digitos) => {
  if (digitos < 3)
    return "La Cédula de Extranjería debe contener al menos 3 dígitos";
  if (doc.length < 4 || doc.length > 15)
    return "La CE debe tener entre 4 y 15 caracteres";
  return null;
};

const validarDocPasaporte = (doc, digitos) => {
  if (digitos < 2) return "El Pasaporte debe contener al menos 2 dígitos";
  if (doc.length < 5 || doc.length > 12)
    return "El Pasaporte debe tener entre 5 y 12 caracteres";
  return null;
};

const validarDocPepPpt = (doc, digitos, tipo) => {
  const nombre = NOMBRES_TIPO_DOC[tipo];
  if (digitos < 2)
    return `El documento ${nombre} debe contener al menos 2 dígitos`;
  if (doc.length < 4 || doc.length > 20)
    return `El ${nombre} debe tener entre 4 y 20 caracteres`;
  return null;
};

// Funciones exportadas 

/**
 * Valida que los campos de nombre no contengan números ni secuencias sin sentido.
 * @param {{ [campo: string]: string | undefined | null }} campos
 * @returns {string | null} Mensaje de error o null si es válido
 */
export const validarCamposNombre = (campos) => {
  for (const [campo, valor] of Object.entries(campos)) {
    if (!valor) continue;
    const v = String(valor).trim();
    if (!v) continue;
    if (!NOMBRE_REGEX.test(v))
      return `El campo "${campo}" no puede contener números ni caracteres especiales. Solo se permiten letras, espacios, guiones y apóstrofes.`;
    if (/^(.)\1+$/.test(v))
      return `El campo "${campo}" no puede estar formado por el mismo carácter repetido (ej: "XXXXX" o "aaaa"). Ingrese un nombre real.`;
    if (/(.)\1{3,}/.test(v))
      return `El campo "${campo}" contiene demasiadas letras consecutivas iguales. Ingrese un nombre válido.`;
  }
  return null;
};

/**
 * Valida formato y calidad de un número de teléfono.
 * @param {string | number | undefined | null} telefono
 * @returns {string | null} Mensaje de error o null si es válido
 */
export const validarTelefono = (telefono) => {
  if (!telefono) return null;
  const tel = telefono.toString().trim();
  // Teléfonos del sistema por defecto se permiten sin validación estricta
  if (tel === "0000000000" || tel === "1234567890") return null;
  if (!/^\d{7,15}$/.test(tel))
    return "El teléfono debe contener solo dígitos, entre 7 y 15 caracteres.";
  if (/^(\d)\1+$/.test(tel))
    return `El número de teléfono "${tel}" no es válido porque todos sus dígitos son iguales. Ingrese un número real.`;
  return null;
};

/**
 * Valida el número de documento según el tipo de documento.
 * @param {number | string} tipoDocumentoId
 * @param {string | number | undefined | null} numeroDocumento
 * @returns {string | null} Mensaje de error o null si es válido
 */
export const validarNumeroDocumento = (tipoDocumentoId, numeroDocumento) => {
  if (!numeroDocumento?.toString().trim()) return null;
  const doc = numeroDocumento.toString().trim();
  const tipo = Number.parseInt(tipoDocumentoId, 10) || 1;

  if (!/^[a-zA-Z0-9-]+$/.test(doc))
    return "El número de documento solo puede contener letras, números o guiones. No se permiten espacios ni caracteres como @, #, %, etc.";

  const digitos = contarDigitos(doc);
  const letras = (doc.match(/[a-zA-Z]/g) || []).length;

  if ([2, 3, 4, 5].includes(tipo) && letras > digitos) {
    const nombreTipo = NOMBRES_TIPO_DOC[tipo];
    return `El ${nombreTipo} tiene más letras (${letras}) que dígitos (${digitos}). Los documentos deben ser principalmente numéricos (ej: E-123456789).`;
  }

  if (tipo === 1) return validarDocCC(doc);
  if (tipo === 2) return validarDocCE(doc, digitos);
  if (tipo === 3) return validarDocPasaporte(doc, digitos);
  if (tipo === 4 || tipo === 5) return validarDocPepPpt(doc, digitos, tipo);
  if (digitos === 0)
    return "El número de documento no puede estar compuesto únicamente de letras";
  return null;
};
