import { API_BASE as BASE } from "./api.config.js";

export const obtenerUsuarios = async (token) => {
  const res = await fetch(`${BASE}/usuario`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Error al cargar usuarios: ${res.status}`);
  const data = await res.json();
  const raw = data.body || [];
  // Aplanar: merge Persona, Rol, Estado al nivel raiz
  return raw.map((u) => {
    const p = u.Persona || {};
    return {
      username: u.username,
      numeroDocumento: u.numeroDocumento || p.numeroDocumento || "",
      rolesId: u.rolesId,
      estadoId: u.estadoId,
      primerNombre: p.primerNombre || "",
      segundoNombre: p.segundoNombre || "",
      primerApellido: p.primerApellido || "",
      segundoApellido: p.segundoApellido || "",
      telefono: p.telefono || "",
      correoElectronico: p.correoElectronico || "",
      tipoDocumentoId: p.tipoDocumentoId || "",
      nombreRol: u.Rol?.nombreRol || "",
      nombreEstado: u.Estado?.nombreEstado || "",
      nombreDocumento: p.TipoDocumento?.nombreDocumento || "",
      fotoPerfil: u.fotoPerfil || null,
    };
  });
};

export const obtenerUsuarioPorId = async (username, token) => {
  const res = await fetch(`${BASE}/usuario/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Error al obtener usuario: ${res.status}`);
  const data = await res.json();
  return data.body || data;
};

export const obtenerPersonaPorDocumento = async (documento, token) => {
  const res = await fetch(`${BASE}/persona/${documento}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Error al obtener persona: ${res.status}`);
  const data = await res.json();
  return data.body || data;
};

export const registrarUsuario = async (datos, token) => {
  const res = await fetch(`${BASE}/usuario`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
  return res;
};

export const editarUsuario = async (username, payload, token) => {
  const res = await fetch(`${BASE}/usuario/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res;
};

export const finalizarUsuarioService = async (username, token) => {
  const res = await fetch(`${BASE}/usuario/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estadoId: 2 }),
  });
  return res;
};

export const activarUsuarioService = async (username, token) => {
  const res = await fetch(`${BASE}/usuario/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estadoId: 1 }),
  });
  return res;
};

export const logoutUsuario = async (token) => {
  try {
    await fetch(`${BASE}/usuario/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.warn("Error en logout remoto:", error);
  }
};

export const actualizarFotoPerfil = async (username, fotoPerfil, token) => {
  const res = await fetch(
    `${BASE}/usuario/${encodeURIComponent(username)}/foto`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fotoPerfil }),
    },
  );
  if (!res.ok) throw new Error(`Error al actualizar foto: ${res.status}`);
  return res.json();
};

export const obtenerUsuariosEnLinea = async (token) => {
  const res = await fetch(`${BASE}/usuario/en-linea`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.enLinea || {};
};
