import { API_BASE as API_BASE_URL } from "./api.config.js";

// NOTE: this module no longer reads token from storage.
// The caller must pass a valid `token` string to each API function.

export const verificarTokenVencido = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const fechaExpiracion = payload.exp * 1000;
    return Date.now() >= fechaExpiracion;
  } catch (error) {
    return true;
  }
};

export const obtenerUsuarioDelToken = (token) => {
  try {
    if (verificarTokenVencido(token)) {
      return "josue2023";
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || "Usuario";
  } catch (error) {
    return "Usuario";
  }
};

export const obtenerRolDelToken = (token) => {
  try {
    if (verificarTokenVencido(token)) {
      return "RolDesconocido";
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.rolesId || "RolNoDefinido";
  } catch (error) {
    return "RolNoDefinido";
  }
};

export const obtenerNombreRol = (rolesId) => {
  switch (rolesId) {
    case 1:
      return "superAdmin";
    case 2:
      return "admin";
    case 3:
      return "vigilante";
    default:
      return "RolNoDefinido";
  }
};

export const mapTipoDocumento = (tipoDocumentoId) => {
  const tipos = { 1: "CC", 2: "CE", 3: "PP", 4: "PEP", 5: "PPT" };
  return tipos[tipoDocumentoId] || "CC";
};

export const mapTipoDocumentoId = (tipoDocumento) => {
  const tipos = { CC: 1, CE: 2, PP: 3, PEP: 4, PPT: 5 };
  return tipos[tipoDocumento] || 1;
};

export const mapTorre = (torresId) => {
  const torres = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F",
    7: "G",
    8: "H",
    9: "I",
    10: "J",
  };
  return torres[torresId] || "A";
};

export const mapTorreId = (torre) => {
  const torres = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    I: 9,
    J: 10,
  };
  return torres[torre] || 1;
};

export async function obtenerResidentes(token) {
  if (!token)
    throw new Error("Token de autenticación requerido para obtener residentes");
  return fetch(`${API_BASE_URL}/ocupantes`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function obtenerTodosApartamentos(token) {
  if (!token) throw new Error("Token requerido");
  return fetch(`${API_BASE_URL}/apartamento`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function obtenerOcupantePorId(id, token) {
  if (!token)
    throw new Error("Token de autenticación requerido para obtener ocupante");
  return fetch(`${API_BASE_URL}/ocupante/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function crearOcupante(ocupanteData, token) {
  if (!token)
    throw new Error("Token de autenticación requerido para crear ocupante");
  return fetch(`${API_BASE_URL}/ocupante`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ocupanteData),
  });
}

export async function actualizarOcupante(id, ocupanteData, token) {
  let idOcupante = id;
  if (!token)
    throw new Error(
      "Token de autenticación requerido para actualizar ocupante",
    );
  return fetch(`${API_BASE_URL}/ocupante/${idOcupante}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ocupanteData),
  });
}

export async function finalizarOcupante(id, token) {
  if (!token)
    throw new Error("Token de autenticación requerido para finalizar ocupante");
  return fetch(`${API_BASE_URL}/ocupante/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estadoId: 9, fechaFin: new Date() }),
  });
}

export default {
  obtenerResidentes,
  obtenerOcupantePorId,
  crearOcupante,
  actualizarOcupante,
  finalizarOcupante,
};

// Función para preparar datos del ocupante
export const prepararDatosOcupante = (
  formData,
  apartamentos,
  isEdit = false,
) => {
  const apartamentoId = parseInt(formData.apto);

  if (isNaN(apartamentoId) || apartamentoId <= 0) {
    throw new Error("ID de apartamento inválido");
  }

  const apartamentoExiste = apartamentos.some(
    (apt) => apt.idApartamento === apartamentoId,
  );

  if (!apartamentoExiste) {
    throw new Error(
      `El apartamento con ID ${apartamentoId} no existe en el sistema`,
    );
  }

  const ocupanteData = {
    apartamentosId: apartamentoId,
    tipoOcupacion: formData.tipoOcupacion.toLowerCase(),
    personasACargo: parseInt(formData.personasACargo) || 0,
    fechaInicio: formData.fechaInicio,
    fechaFin:
      formData.fechaFin && formData.fechaFin.trim() !== ""
        ? formData.fechaFin
        : null,
    tipoDocumentoId: mapTipoDocumentoId(formData.tipoDocumento),
    primerNombre: formData.primerNombre,
    segundoNombre:
      formData.segundoNombre && formData.segundoNombre.trim() !== ""
        ? formData.segundoNombre
        : null,
    primerApellido: formData.primerApellido,
    segundoApellido:
      formData.segundoApellido && formData.segundoApellido.trim() !== ""
        ? formData.segundoApellido
        : null,
    telefono: formData.telefono || "0000000000",
    // Si es edición y no se proporcionó correo, omitimos el campo para no enviar el placeholder
    correoElectronico: isEdit
      ? formData.correo && formData.correo.trim() !== ""
        ? formData.correo
        : undefined
      : formData.correo && formData.correo.trim() !== ""
        ? formData.correo
        : "noemail@example.com",
  };

  // Solo agregar numeroDocumento si no es edición
  if (!isEdit) {
    ocupanteData.numeroDocumento = formData.numeroDocumento;
  }

  return ocupanteData;
};
