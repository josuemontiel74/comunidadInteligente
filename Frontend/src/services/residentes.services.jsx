const API_BASE_URL = "http://localhost:3001/api";


export const getAuthToken = () => {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Impvc3VlMjAyMyIsInJvbGVzSWQiOjEsImlhdCI6MTc1OTQ5NzMzOCwiZXhwIjoxNzU5NTAwOTM4fQ.zoWZMuCBmzoyZvQ8_8OYGKHwQpkDFaB8QSMQXBQcbXA";
};

export const obtenerToken = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token) {
    console.warn(
      "No se encontró token de autenticación, usando token de desarrollo"
    );
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Impvc3VlMjAyMyIsInJvbGVzSWQiOjEsImlhdCI6MTc1OTUxNTQwMCwiZXhwIjoxNzU5NTE5MDAwfQ.wKzrnUttdHRGkHnnZL1LR1amxt2ZQ4PZR85khZauShQ";
  }

  return token;
};


export const verificarTokenVencido = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const fechaExpiracion = payload.exp * 1000;
    return Date.now() >= fechaExpiracion;
  } catch (error) {
    console.error("Error al verificar expiración del token:", error);
    return true;
  }
};

export const obtenerUsuarioDelToken = (token) => {
  try {
    if (verificarTokenVencido(token)) {
      console.warn("Token vencido, usando usuario por defecto...");
      return "josue2023";
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || "Usuario";
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return "Usuario";
  }
};

export const obtenerRolDelToken = (token) => {
  try {
    if (verificarTokenVencido(token)) {
      console.warn("Token vencido, usando rol por defecto...");
      return "RolDesconocido";
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.rolesId || "RolNoDefinido";
  } catch (error) {
    console.error("Error al decodificar el token:", error);
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
    1: "A", 2: "B", 3: "C", 4: "D", 5: "E",
    6: "F", 7: "G", 8: "H", 9: "I", 10: "J",
  };
  return torres[torresId] || "A";
};

export const mapTorreId = (torre) => {
  const torres = {
    A: 1, B: 2, C: 3, D: 4, E: 5,
    F: 6, G: 7, H: 8, I: 9, J: 10,
  };
  return torres[torre] || 1;
};


export async function obtenerResidentes(token = null) {
  const t = token || obtenerToken();
  return fetch(`${API_BASE_URL}/ocupantes`, {
    method: "GET",
    headers: { Authorization: `Bearer ${t}` },
  });
}

export async function obtenerOcupantePorId(id, token = null) {
  const t = token || obtenerToken();
  return fetch(`${API_BASE_URL}/ocupante/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${t}` },
  });
}

export async function crearOcupante(ocupanteData, token = null) {
  const t = token || obtenerToken();
  return fetch(`${API_BASE_URL}/ocupante`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(ocupanteData),
  });
}

export async function actualizarOcupante(id, ocupanteData, token = null) {
  const t = token || obtenerToken();
  return fetch(`${API_BASE_URL}/ocupante/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(ocupanteData),
  });
}

export async function finalizarOcupante(id, token = null) {
 
  const t = token || obtenerToken();
  return fetch(`${API_BASE_URL}/ocupante/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ estadoId: 9,fechaFin: new Date }),
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
export const prepararDatosOcupante = (formData, apartamentos, isEdit = false) => {
  const apartamentoId = parseInt(formData.apto);
  
  if (isNaN(apartamentoId) || apartamentoId <= 0) {
    throw new Error("ID de apartamento inválido");
  }

  const apartamentoExiste = apartamentos.some(
    (apt) => apt.idApartamento === apartamentoId
  );
  
  if (!apartamentoExiste) {
    throw new Error(`El apartamento con ID ${apartamentoId} no existe en el sistema`);
  }

  const ocupanteData = {
    apartamentosId: apartamentoId,
    tipoOcupacion: formData.tipoOcupacion.toLowerCase(),
    personasACargo: parseInt(formData.personasACargo) || 0,
    fechaInicio: formData.fechaInicio,
    fechaFin: formData.fechaFin && formData.fechaFin.trim() !== "" ? formData.fechaFin : null,
    tipoDocumentoId: mapTipoDocumentoId(formData.tipoDocumento),
    primerNombre: formData.primerNombre,
    segundoNombre: formData.segundoNombre && formData.segundoNombre.trim() !== "" ? formData.segundoNombre : null,
    primerApellido: formData.primerApellido,
    segundoApellido: formData.segundoApellido && formData.segundoApellido.trim() !== "" ? formData.segundoApellido : null,
    telefono: formData.telefono || "0000000000",
    correoElectronico: formData.correo || "noemail@example.com",
  };

  // Solo agregar numeroDocumento si no es edición
  if (!isEdit) {
    ocupanteData.numeroDocumento = formData.numeroDocumento;
  }

  return ocupanteData;
};