import { API_BASE as BASE } from "./api.config.js";

// ========== SERVICIOS UNIFICADOS - RESERVAS DE ÁREAS COMUNES ==========

export async function obtenerReservasAreas(token) {
  return fetch(`${BASE}/reservas-areas`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function obtenerReservaPorId(id, token) {
  return fetch(`${BASE}/reservas-areas/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function obtenerAreas(token) {
  return fetch(`${BASE}/areaComunes`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function obtenerApartamentos(token) {
  return fetch(`${BASE}/apartamento`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function crearReserva(datos, token) {
  return fetch(`${BASE}/reservas-areas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
}

export async function actualizarReserva(id, datos, token) {
  return fetch(`${BASE}/reservas-areas/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
}

export async function eliminarReserva(id, token) {
  return fetch(`${BASE}/reservas-areas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function obtenerCalendarioReservas(token) {
  return fetch(`${BASE}/calendariodereservas`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function actualizarAreaComun(id, datos, token) {
  return fetch(`${BASE}/areaComunes/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
}
