const BASE = "http://localhost:3001/api";

export async function obtenerParqueaderos(token) {
  return fetch(`${BASE}/parqueadero`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function actualizarParqueadero(id, datos, token) {
  return fetch(`${BASE}/parqueadero/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
}

export async function reservarParqueadero(datos, token) {
  return fetch(`${BASE}/parqueadero/reservar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
}

export async function cambiarEstadoParqueadero(
  codigoParqueadero,
  estadoId,
  token,
) {
  return fetch(`${BASE}/parqueadero/cambiarEstado/${codigoParqueadero}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estadoId }),
  });
}
