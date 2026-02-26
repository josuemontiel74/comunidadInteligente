/**
 * Utilidades de validación compartidas para todos los módulos.
 * Reglas enfocadas en el contexto colombiano.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTADORAS COLOMBIANAS RECONOCIDAS
// ─────────────────────────────────────────────────────────────────────────────
export const TRANSPORTADORAS_CO = [
  "Servientrega",
  "Interrapidísimo",
  "Inter Rapidísimo",
  "472",
  "DHL",
  "FedEx",
  "Coordinadora",
  "TCC Expreso",
  "TCC",
  "Envía",
  "Deprisa",
  "La Lleva",
  "Mensajería Urbana",
  "Lógistica",
  "Domicilios Nacional",
  "Speed Courier",
  "Adpostal",
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

/** Solo letras (incl. tildes y ñ), espacios y guiones */
const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/;

/**
 * Comprueba que el texto tenga "sentido" en español:
 * - Al menos el 15 % de los caracteres alfabéticos son vocales.
 * - Bloquea "qwerty", "asdfgh", secuencias aleatorias.
 */
const tieneSentido = (str) => {
  const letras = str.replaceAll(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, "");
  if (letras.length < 2) return false;
  const vocales = (letras.match(/[aeiouáéíóúü]/gi) || []).length;
  return vocales / letras.length >= 0.15;
};

// ─────────────────────────────────────────────────────────────────────────────
// NOMBRES / APELLIDOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida un nombre o apellido.
 * @returns {string|null} Mensaje de error, o null si es válido.
 */
export const validarNombre = (str) => {
  const s = (str || "").trim();
  if (!s || s.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (!REGEX_SOLO_LETRAS.test(s))
    return "El nombre solo puede contener letras, espacios y guiones. No se permiten números ni caracteres especiales.";
  if (!tieneSentido(s))
    return "El nombre no parece válido. Evite escribir letras al azar o sin sentido.";
  return null;
};

/**
 * Valida un nombre completo (puede contener 2 tokens: nombre + apellido).
 */
export const validarNombreCompleto = (str) => {
  const s = (str || "").trim();
  if (!s || s.length < 3)
    return "El nombre completo debe tener al menos 3 caracteres.";
  if (!REGEX_SOLO_LETRAS.test(s))
    return "Solo se permiten letras, espacios y guiones. No se permiten números ni caracteres especiales.";
  if (!tieneSentido(s))
    return "El nombre no parece válido. Evite escribir letras al azar o sin sentido.";
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// TELÉFONO COLOMBIANO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida un número celular colombiano.
 * Reglas: solo dígitos, empieza por 3, exactamente 10 dígitos.
 */
export const validarTelefono = (str) => {
  const s = (str || "").trim();
  if (!s) return "El teléfono es obligatorio.";
  if (!/^\d+$/.test(s))
    return "El teléfono solo puede contener números, sin espacios ni guiones.";
  if (!s.startsWith("3"))
    return "El número celular colombiano debe empezar por 3 (ej: 3001234567).";
  if (s.length !== 10)
    return "El número celular debe tener exactamente 10 dígitos.";
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CORREO ELECTRÓNICO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida un correo electrónico con formato estándar.
 */
export const validarEmail = (str) => {
  const s = (str || "").trim();
  if (!s) return "El correo electrónico es obligatorio.";
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(s))
    return "El correo electrónico no es válido. Ejemplo: usuario@gmail.com";
  // Verifica que no sea solo @algo.x sin usuario real
  const local = s.split("@")[0];
  if (local.length < 2)
    return "La parte del usuario del correo es demasiado corta.";
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// NÚMERO DE DOCUMENTO (según tipo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tipos de documento y sus reglas:
 *  CC  (1) → solo dígitos, 6-10 caracteres
 *  CE  (2) → alfanumérico, máx 3 letras en total
 *  PA  (3) → alfanumérico, máx 3 letras iniciales
 *  PP  (4) → alfanumérico, máx 3 letras
 *  PPT (5) → alfanumérico, máx 3 letras
 *
 * @param {string} str        Valor del documento
 * @param {number|string} tipoId  Valor del tipoDocumentoId
 * @param {string} tipoNombre Nombre del tipo (para mensajes). Opcional.
 */
export const validarDocumento = (str, tipoId, tipoNombre = "") => {
  const s = (str || "").trim();
  const id = Number.parseInt(tipoId, 10);
  const etiqueta = tipoNombre || `tipo ${tipoId}`;

  if (!s) return "El número de documento es obligatorio.";

  // CC: solo números, 6-10 dígitos
  if (id === 1) {
    if (!/^\d{6,10}$/.test(s))
      return "La Cédula de Ciudadanía (CC) debe tener entre 6 y 10 dígitos numéricos, sin letras ni caracteres especiales.";
    return null;
  }

  // CE, Pasaporte, PP, PPT: alfanumérico, máx 3 letras
  if ([2, 3, 4, 5].includes(id)) {
    if (!/^[a-zA-Z0-9]+$/.test(s))
      return `El documento (${etiqueta}) solo puede contener letras y números, sin caracteres especiales.`;
    const letras = (s.match(/[a-zA-Z]/g) || []).length;
    if (letras > 3)
      return `El documento (${etiqueta}) no puede tener más de 3 letras. Los documentos como pasaporte o CE suelen comenzar con 1-3 letras seguidas de números.`;
    if (s.length < 4 || s.length > 20)
      return `El documento (${etiqueta}) debe tener entre 4 y 20 caracteres.`;
    return null;
  }

  // Caso genérico
  if (!/^[a-zA-Z0-9]+$/.test(s))
    return "El número de documento no puede contener caracteres especiales.";
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTADORA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida el nombre de una transportadora.
 * Acepta cualquier nombre de la lista TRANSPORTADORAS_CO o nombres
 * que solo contengan letras, números conocidos (472) y espacios.
 * No admite números aleatorios ni caracteres especiales.
 */
export const validarTransportadora = (str) => {
  const s = (str || "").trim();
  if (!s) return "La transportadora es obligatoria.";

  // Si es exactamente una de las transportadoras conocidas → OK
  const conocida = TRANSPORTADORAS_CO.map((t) => t.toLowerCase());
  if (conocida.includes(s.toLowerCase())) return null;

  // Regla general: solo letras, espacios, números y guiones/puntos
  // (ej: "472" es válido, "4x7z" no debería serlo)
  // Rechaza nombres puramente numéricos que no estén en la lista
  const soloNumeros = /^\d+$/.test(s);
  if (soloNumeros && !["472"].includes(s))
    return "La transportadora no puede ser solo un número. Escriba el nombre completo (ej: Servientrega, Coordinadora, 472).";

  if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s'.,-]+$/.test(s))
    return "La transportadora no puede contener caracteres especiales como @, #, !, etc.";

  if (s.length < 2) return "El nombre de la transportadora es demasiado corto.";

  // Verificar que si tiene letras, estas tengan sentido
  const soloLetras = s.replaceAll(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, "");
  if (soloLetras.length > 2 && !tieneSentido(s))
    return "El nombre de la transportadora no parece válido. Evite escribir letras al azar.";

  return null;
};
