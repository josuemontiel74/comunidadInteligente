import { useState, useCallback, useEffect } from "react";
import { obtenerResumenDashboard } from "../services/dashboard.services.jsx";

/**
 * Hook que carga los datos del resumen del dashboard desde la API.
 *
 * @param {boolean} sessionReady - `true` cuando la sesión ya fue verificada (loading === false).
 * @returns {{ dataLoading, cargarDatos, paquetesEntregados, paquetesPendientes,
 *             parqueosCarros, parqueosMotos, parqueosLibres, visitasHoy,
 *             visitasActivas, reservasHoy, residentesActivos, setDataLoading }}
 */
export default function useDashboardData(sessionReady) {
  const [dataLoading, setDataLoading] = useState(true);
  const [paquetesEntregados, setPaquetesEntregados] = useState(0);
  const [paquetesPendientes, setPaquetesPendientes] = useState(0);
  const [parqueosCarros, setParqueosCarros] = useState(0);
  const [parqueosMotos, setParqueosMotos] = useState(0);
  const [parqueosLibres, setParqueosLibres] = useState(0);
  const [visitasHoy, setVisitasHoy] = useState(0);
  const [visitasActivas, setVisitasActivas] = useState(0);
  const [reservasHoy, setReservasHoy] = useState(0);
  const [residentesActivos, setResidentesActivos] = useState(0);

  const cargarDatos = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setDataLoading(true);
    try {
      const res = await obtenerResumenDashboard(token);
      const responseData = await res.json();

      if (res.ok && responseData.success) {
        const datos = responseData.data;
        setPaquetesEntregados(datos.paquetes?.entregados ?? 0);
        setPaquetesPendientes(datos.paquetes?.pendientes ?? 0);
        setParqueosCarros(Math.max(0, datos.parqueaderos?.ocupadosCarros ?? 0));
        setParqueosMotos(Math.max(0, datos.parqueaderos?.ocupadosMotos ?? 0));
        setParqueosLibres(Math.max(0, datos.parqueaderos?.disponibles ?? 0));
        setVisitasHoy(datos.visitas?.hoy ?? 0);
        setVisitasActivas(datos.visitas?.activas ?? 0);
        setReservasHoy(datos.reservas?.hoy ?? 0);
        setResidentesActivos(datos.residentes?.activos ?? 0);
      }
    } catch {
      /* error de red ignorado, el dashboard muestra 0s */
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionReady) {
      cargarDatos();
    }
  }, [sessionReady, cargarDatos]);

  return {
    dataLoading,
    setDataLoading,
    cargarDatos,
    paquetesEntregados,
    paquetesPendientes,
    parqueosCarros,
    parqueosMotos,
    parqueosLibres,
    visitasHoy,
    visitasActivas,
    reservasHoy,
    residentesActivos,
  };
}
