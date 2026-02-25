import { API_BASE as BASE } from "./api.config.js";

export async function obtenerPaquetes(token) {
  return fetch(`${BASE}/recepcion-paquetes`, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
}

export async function registrarPaquete(datos, token) {
  return fetch(`${BASE}/recepcionPaquetes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function actualizarPaquete(id, datos, token) {
  return fetch(`${BASE}/recepcionPaquetes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function eliminarPaquete(id, token) {
  return fetch(`${BASE}/recepcionPaquetes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
 export async function paquetesDia(token) {
   return fetch(`${BASE}/paquetesDia`,{
    method:"GET",
    headers:{Authorization:`Bearer ${token}`}
   }
  )
 }