const BASE = "http://localhost:3001/api";

export async function obtenerVisitas(token) {
  return fetch(`${BASE}/visita`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

export async function obtenerVisitasJoin(token) {
  return fetch(`${BASE}/visitaJoin`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

export async function crearVisita(datos, token) {
  return fetch(`${BASE}/visita`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function actualizarVisita(id, datos, token) {
  return fetch(`${BASE}/visita/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function eliminarVisita(id, token) {
  return fetch(`${BASE}/visita/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function finalizarVisita(id, token) {
  return fetch(`${BASE}/visitaFinalizar/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}
 export async function visitasDia(token) {
  return fetch(`${BASE}/visitasDia`,
  {
    method:"GET",
    headers:{Authorization:`Bearer ${token}`}
  });
 }