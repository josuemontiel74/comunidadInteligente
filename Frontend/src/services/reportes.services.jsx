const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export async function obtenerReporteParqueaderos(token, fechaInicio, fechaFin) {
  try {
    const res = await fetch(
      `${API_URL}/api/reportes/parqueaderos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: authHeaders(token) },
    );
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    return null;
  }
}

export async function obtenerReporteVisitas(token, fechaInicio, fechaFin) {
  try {
    const res = await fetch(
      `${API_URL}/api/reportes/visitas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: authHeaders(token) },
    );
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    return null;
  }
}

export async function obtenerReportePaquetes(token, fechaInicio, fechaFin) {
  try {
    const res = await fetch(
      `${API_URL}/api/reportes/paquetes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: authHeaders(token) },
    );
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    return null;
  }
}

export async function obtenerReporteReservas(token, fechaInicio, fechaFin) {
  try {
    const res = await fetch(
      `${API_URL}/api/reportes/reservas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: authHeaders(token) },
    );
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    return null;
  }
}

export async function obtenerReporteOcupacion(token) {
  try {
    const res = await fetch(`${API_URL}/api/reportes/residentes/ocupacion`, {
      headers: authHeaders(token),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    return null;
  }
}

export async function obtenerReporteNinos(token) {
  try {
    const res = await fetch(`${API_URL}/api/reportes/residentes/ninos`, {
      headers: authHeaders(token),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    return null;
  }
}

export async function obtenerReportePoblacionEspecial(token) {
  try {
    const res = await fetch(
      `${API_URL}/api/reportes/residentes/poblacion-especial`,
      { headers: authHeaders(token) },
    );
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    return null;
  }
}
