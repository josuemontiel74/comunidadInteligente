const BASE = "http://localhost:3001/api";

export async function obtenerReservasAreas(token) {
  return fetch(`${BASE}/reservas-areas`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

export async function obtenerAreas(token) {
  return fetch(`${BASE}/areas-comunes`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function obtenerApartamentos(token) {
  return fetch(`${BASE}/apartamentos`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function crearReserva(datos, token) {
  return fetch(`${BASE}/reservas-areas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function eliminarReserva(id, token) {
  return fetch(`${BASE}/reservas-areas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Compatibilidad: algunos endpoints usan "reservarAreas"
export async function crearReserva_v2(datos, token) {
  return fetch(`${BASE}/reservarAreas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function actualizarReserva_v2(id, datos, token) {
 let idReservas=id;
  return fetch(`${BASE}/ActualizarReserva/${idReservas}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function eliminarReserva_v2(id, token) {
  return fetch(`${BASE}/reservarAreas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
