const BASE = "http://localhost:3001/api";

export async function obtenerResumenDashboard(token, signal) {
  return fetch(`${BASE}/dashboard/resumen`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal,
  });
}

export async function obtenerEstadisticasParqueaderos(token) {
  return fetch(`${BASE}/dashboard/parqueaderos`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function obtenerPaquetesHoy(token) {
  return fetch(`${BASE}/dashboard/paquetes-hoy`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function obtenerReservasHoy(token) {
  return fetch(`${BASE}/dashboard/reservas-hoy`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
