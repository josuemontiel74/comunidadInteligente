import { API_BASE as BASE } from "./api.config.js";

export async function obtenerLogErrores(token, filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.nivel && filtros.nivel !== "todos")
    params.append("nivel", filtros.nivel);
  if (filtros.desde) params.append("desde", filtros.desde);
  if (filtros.hasta) params.append("hasta", filtros.hasta);
  if (filtros.modulo) params.append("modulo", filtros.modulo);
  if (filtros.limite) params.append("limite", filtros.limite);

  const res = await fetch(`${BASE}/log-errores?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

export async function obtenerResumenLogErrores(token) {
  const res = await fetch(`${BASE}/log-errores/resumen`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}

export async function limpiarLogErrores(token, diasAntiguedad) {
  const res = await fetch(`${BASE}/log-errores/limpiar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ diasAntiguedad }),
  });

  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}
