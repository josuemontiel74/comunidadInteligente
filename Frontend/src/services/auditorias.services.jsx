const BASE = "http://localhost:3001/api";

export async function obtenerRegistrosAuditoria(token) {
  const res = await fetch(`${BASE}/auditoria`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Error al cargar auditorías: ${res.status}`);
  }

  const data = await res.json();
  return data.data || [];
}
