import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Styles/estiloVisitas.css";
import logo from "../../img/logo.png";
import Swal from "sweetalert2";
import { obtenerVisitas, obtenerVisitasJoin, crearVisita, actualizarVisita, finalizarVisita } from "../services/visitas.services.jsx";
import { obtenerParqueaderos, actualizarParqueadero } from "../services/parqueadero.services.jsx";

const styles = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  .connection-indicator {
    transition: all 0.3s ease;
  }
  
  .connection-indicator.online {
    background-color: #28a745 !important;
  }
  .connection-indicator.loading {
    background-color: #ffc107 !important;
    animation: pulse 1s infinite;
  }
  
  .connection-indicator.offline {
    background-color: #dc3545 !important;
  }
`;

function Visitas() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 3500, showConfirmButton: false, timerProgressBar: true }).then(() => {
        localStorage.clear();
        navigate('/');
      });
    }
  }, [navigate]);

  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [visitasFiltradas, setVisitasFiltradas] = useState([]);


  const [usuario, setUsuario] = useState({ nombre: "Usuario", username: "" });

  const apartamentos = [
    { id: 1, torreId: 1, numero: 101 },
    { id: 2, torreId: 1, numero: 102 },
    { id: 3, torreId: 1, numero: 103 },
    { id: 4, torreId: 1, numero: 104 },
    { id: 5, torreId: 1, numero: 105 },
    { id: 6, torreId: 2, numero: 201 },
    { id: 7, torreId: 2, numero: 202 },
    { id: 8, torreId: 2, numero: 203 },
    { id: 9, torreId: 2, numero: 204 },
    { id: 10, torreId: 2, numero: 205 },
    { id: 11, torreId: 3, numero: 301 },
    { id: 12, torreId: 3, numero: 302 },
    { id: 13, torreId: 3, numero: 303 },
    { id: 14, torreId: 3, numero: 304 },
    { id: 15, torreId: 3, numero: 305 },
    { id: 16, torreId: 4, numero: 401 },
    { id: 17, torreId: 4, numero: 402 },
    { id: 18, torreId: 4, numero: 403 },
    { id: 19, torreId: 4, numero: 404 },
    { id: 20, torreId: 4, numero: 405 },
    { id: 21, torreId: 5, numero: 501 },
    { id: 22, torreId: 5, numero: 502 },
    { id: 23, torreId: 5, numero: 503 },
    { id: 24, torreId: 5, numero: 504 },
    { id: 25, torreId: 5, numero: 505 },
    { id: 26, torreId: 6, numero: 601 },
    { id: 27, torreId: 6, numero: 602 },
    { id: 28, torreId: 6, numero: 603 },
    { id: 29, torreId: 6, numero: 604 },
    { id: 30, torreId: 6, numero: 605 },
    { id: 31, torreId: 7, numero: 701 },
    { id: 32, torreId: 7, numero: 702 },
    { id: 33, torreId: 7, numero: 703 },
    { id: 34, torreId: 7, numero: 704 },
    { id: 35, torreId: 7, numero: 705 },
    { id: 36, torreId: 8, numero: 801 },
    { id: 37, torreId: 8, numero: 802 },
    { id: 38, torreId: 8, numero: 803 },
    { id: 39, torreId: 8, numero: 804 },
    { id: 40, torreId: 8, numero: 805 },
    { id: 41, torreId: 9, numero: 901 },
    { id: 42, torreId: 9, numero: 902 },
    { id: 43, torreId: 9, numero: 903 },
    { id: 44, torreId: 9, numero: 904 },
    { id: 45, torreId: 9, numero: 905 },
    { id: 46, torreId: 10, numero: 1001 },
    { id: 47, torreId: 10, numero: 1002 },
    { id: 48, torreId: 10, numero: 1003 },
    { id: 49, torreId: 10, numero: 1004 },
    { id: 50, torreId: 10, numero: 1005 },
  ];

  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [tipoDocumentoId, setTipoDocumentoId] = useState("");
  const [nombreVisitante, setNombreVisitante] = useState("");
  const [torreId, setTorreId] = useState("");
  const [apartamentoId, setApartamentoId] = useState("");
  const [fechaHoraIngreso, setFechaHoraIngreso] = useState("");
  const [fechaHoraSalida, setFechaHoraSalida] = useState("");
  const [estadoId] = useState(8); // Estado "En proceso"
  const [observaciones, setObservaciones] = useState("");
  const [matricula, setMatricula] = useState("");
  const [tipoVehiculoId, setTipoVehiculoId] = useState("");
  const [codigoParqueadero, setCodigoParqueadero] = useState("");
  const [vieneEnVehiculo, setVieneEnVehiculo] = useState("");
  const [verificadorRol, setVerificadorRol] = useState(null);

  const [parqueaderosDisponibles, setParqueaderosDisponibles] = useState([]);

  // Persistir formulario en sessionStorage para evitar pérdida por recarga
  useEffect(() => {
    const saved = sessionStorage.getItem("visitaForm");
    if (saved) {
      try {
        const f = JSON.parse(saved);
        if (f.numeroDocumento) setNumeroDocumento(f.numeroDocumento);
        if (f.nombreVisitante) setNombreVisitante(f.nombreVisitante);
        if (f.tipoDocumentoId) setTipoDocumentoId(String(f.tipoDocumentoId));
        if (f.apartamentoId) setApartamentoId(String(f.apartamentoId));
        if (f.fechaHoraIngreso) setFechaHoraIngreso(f.fechaHoraIngreso);
        if (f.observaciones) setObservaciones(f.observaciones);
        if (f.matricula) setMatricula(f.matricula);
        if (f.tipoVehiculoId) setTipoVehiculoId(String(f.tipoVehiculoId));
        if (f.codigoParqueadero) setCodigoParqueadero(f.codigoParqueadero);
        if (f.vieneEnVehiculo) setVieneEnVehiculo(f.vieneEnVehiculo);
      } catch (e) {
        console.warn("No se pudo parsear visitaForm de sessionStorage", e);
      }
    }
  }, []);

  // Guardar en sessionStorage cada vez que cambien los campos relevantes
  useEffect(() => {
    const f = {
      numeroDocumento,
      nombreVisitante,
      tipoDocumentoId,
      apartamentoId,
      fechaHoraIngreso,
      observaciones,
      matricula,
      tipoVehiculoId,
      codigoParqueadero,
      vieneEnVehiculo,
    };
    sessionStorage.setItem("visitaForm", JSON.stringify(f));
  }, [numeroDocumento, nombreVisitante, tipoDocumentoId, apartamentoId, fechaHoraIngreso, observaciones, matricula, tipoVehiculoId, codigoParqueadero, vieneEnVehiculo]);


  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    const opciones = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    return fecha.toLocaleDateString("es-CO", opciones).replace(",", "");
  };

  const obtenerToken = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken");

    if (!token) {
      console.warn(
        "No se encontró token de autenticación, usando token de desarrollo"
      );
      return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Impvc3VlMjAyMyIsInJvbGVzSWQiOjEsImlhdCI6MTc1OTUxNTQwMCwiZXhwIjoxNzU5NTE5MDAwfQ.wKzrnUttdHRGkHnnZL1LR1amxt2ZQ4PZR85khZauShQ";
    }

    return token;
  };

  const token = obtenerToken();

  const verificarTokenVencido = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const fechaExpiracion = payload.exp * 1000;
      return Date.now() >= fechaExpiracion;
    } catch (error) {
      console.error("Error al verificar expiración del token:", error);
      return true;
    }
  };

  const obtenerUsuarioDelToken = () => {
    try {
      if (verificarTokenVencido(token)) {
        console.warn("Token vencido, usando usuario por defecto...");
        return "josue2023";
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || "Usuario";
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return "Usuario";
    }
  };
  //obtener rol 
  const obtenerRolDelToken = () => {
    try {
      if (verificarTokenVencido(token)) {
        console.warn("Token vencido, usando rol por defecto...");
        return "RolDesconocido";
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.rolesId || "RolNoDefinido";
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return "RolNoDefinido";
    }
  };
  if (verificarTokenVencido(token)) {

  }


  const rolesId = obtenerRolDelToken();
  useEffect(() => {
    const rolesId = obtenerRolDelToken();
    setVerificadorRol(rolesId);
  }, [token]);
  let rolUsuario;

  switch (rolesId) {
    case 1:
      rolUsuario = "superAdmin";
      break;
    case 2:
      rolUsuario = "admin";
      break;
    case 3:
      rolUsuario = "vigilante";
      break;
    default:
      rolUsuario = "RolNoDefinido";
  }

  const nombreUsuario = obtenerUsuarioDelToken();

  const validarFecha = (fechaString) => {
    if (!fechaString) return false;

    const fecha = new Date(fechaString);
    const ahora = new Date();


    if (isNaN(fecha.getTime())) {
      return { valida: false, error: "Formato de fecha inválido" };
    }

    if (fecha > new Date(ahora.getTime() + 60000)) {
      return { valida: false, error: "La fecha no puede ser futura" };
    }

    const unAnoAtras = new Date(
      ahora.getFullYear() - 1,
      ahora.getMonth(),
      ahora.getDate()
    );
    if (fecha < unAnoAtras) {
      return {
        valida: false,
        error: "La fecha no puede ser mayor a 1 año atrás",
      };
    }

    return { valida: true };
  };


  const obtenerEstadoReal = (estadoVisita) => {
    const estado = String(estadoVisita || "")
      .toLowerCase()
      .trim();
    if (estado.includes("finalizada")) return "finalizada";
    if (estado.includes("en curso")) return "en curso";
    return "registrada";
  };

  const obtenerFechaSalidaReal = (fechaHoraSalida, estadoVisita) => {
    const estado = obtenerEstadoReal(estadoVisita);
    if (estado !== "finalizada") return null;

    if (fechaHoraSalida) {
      const fechaStr = String(fechaHoraSalida).trim();

      if (fechaStr.includes(" ")) {
        const fechas = fechaStr.split(" ").filter((f) => f && f.includes("T"));
        if (fechas.length > 0) {
          return fechas[fechas.length - 1].trim();
        }
      } else if (fechaStr.includes("T")) {

        return fechaStr;
      }
    }
    return null;
  };

  const cargarUsuario = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUsuario({
          nombre: payload.username || "Usuario",
          username: payload.username || "",
        });
      } catch (error) {
        console.error("Error decodificando token:", error);
      }
    }
  };


  useEffect(() => {
    cargarUsuario();
    cargarVisitas();
  }, [navigate]);


  useEffect(() => {
    if (visitas.length > 0 && !loading) {
      console.log(
        ` Datos actualizados: ${visitas.length} visitas disponibles`
      );


      const isInitialLoad = sessionStorage.getItem("visitasInitialLoad");
      if (!isInitialLoad) {
        sessionStorage.setItem("visitasInitialLoad", "true");
      } else {

        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
        });

        Toast.fire({
          icon: "success",
          title: ` Datos actualizados: ${visitas.length} visitas`,
        });
      }
    }
  }, [visitas, loading]);

  useEffect(() => {
    if (!visitas || visitas.length === 0) {
      setVisitasFiltradas([]);
      return;
    }

    let resultado = [...visitas];

    if (searchTerm && searchTerm.trim() !== "") {
      const termino = searchTerm.toLowerCase().trim();

      resultado = resultado.filter((visita) => {
        const documento = String(visita.numeroDocumento || "").toLowerCase();
        const nombre = String(visita.nombreVisitante || "").toLowerCase();
        const matricula = String(visita.matricula || "").toLowerCase();

        return (
          documento.includes(termino) ||
          nombre.includes(termino) ||
          matricula.includes(termino)
        );
      });
    }

    if (filterEstado && filterEstado.trim() !== "") {
      resultado = resultado.filter((visita) => {
        const estadoReal = obtenerEstadoReal(visita.estadoVisita);

        if (filterEstado === "activo") {
          return estadoReal === "en curso";
        } else if (filterEstado === "Finalizado") {
          return estadoReal === "finalizada";
        }
        return false;
      });
    }

    resultado = resultado.sort((a, b) => {
      const estadoA = obtenerEstadoReal(a.estadoVisita);
      const estadoB = obtenerEstadoReal(b.estadoVisita);

      const esEnCursoA = estadoA === "en curso";
      const esEnCursoB = estadoB === "en curso";

      if (esEnCursoA && !esEnCursoB) return -1;
      if (!esEnCursoA && esEnCursoB) return 1;

      const fechaA = new Date(a.fechaHoraIngreso || 0);
      const fechaB = new Date(b.fechaHoraIngreso || 0);

      return fechaB - fechaA;
    });

    setVisitasFiltradas(resultado);
  }, [visitas, searchTerm, filterEstado]);

  useEffect(() => {
    console.log(" Aplicando filtros:", {
      totalVisitas: visitas.length,
      searchTerm,
      filterEstado,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [visitas, searchTerm, filterEstado]);

  const verificarSincronizacion = async (
    visitaEsperada = null,
    maxIntentos = 5
  ) => {
    console.log(" Verificando sincronización de datos...");

    for (let intento = 1; intento <= maxIntentos; intento++) {
      console.log(`📡 Verificación ${intento}/${maxIntentos}`);

      try {
        const datos = await cargarVisitas();

        if (visitaEsperada) {
          const encontrada = datos?.find(
            (v) =>
              v.nombreVisitante === visitaEsperada.nombre &&
              v.numeroDocumento === visitaEsperada.documento
          );

          if (encontrada) {
            console.log(
              " Visita sincronizada correctamente:",
              encontrada.idVisita
            );
            return { success: true, visita: encontrada };
          }
        } else {

          if (datos && datos.length > 0) {
            console.log(" Datos sincronizados correctamente");
            return { success: true, datos };
          }
        }

        if (intento < maxIntentos) {
          const delay = intento * 2000; // 2s, 4s, 6s, 8s, 10s
          console.log(` Reintentando verificación en ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Error en verificación ${intento}:`, error);
      }
    }

    console.log(
      "Sincronización no confirmada después de todos los intentos"
    );
    return { success: false };
  };

  const cargarVisitas = async (reintento = 0, maxReintentos = 3) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    console.log(
      `Iniciando carga de visitas... (intento ${reintento + 1}/${maxReintentos + 1
      })`
    );

    try {
      const res = await obtenerVisitasJoin(token);

      if (res.status === 401) {
        console.error("Token expirado o inválido");
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!res.ok) {
        console.error("Error al cargar visitas:", res.status, res.statusText);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Visitas cargadas exitosamente:", {
        total: data.length,
        timestamp: new Date().toLocaleTimeString(),
        primerasVisitas: data.slice(0, 3).map((v) => ({
          id: v.idVisita,
          nombre: v.nombreVisitante,
          estado: v.nombreEstado,
          fecha: v.fechaHoraIngreso,
        })),
      });

      setVisitas(data);
      setLoading(false);

      return data;
    } catch (error) {
      console.error(
        ` Error cargando visitas (intento ${reintento + 1}):`,
        error
      );


      if (reintento >= maxReintentos) {
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: `No se pudo cargar las visitas después de ${maxReintentos + 1
            } intentos. Verifica que el servidor esté funcionando.`,
          showCancelButton: true,
          confirmButtonText: "Reintentar",
          cancelButtonText: "Cerrar",
        }).then((result) => {
          if (result.isConfirmed) {
            cargarVisitas(0, maxReintentos);
          }
        });
        setVisitas([]);
        setVisitasFiltradas([]);
        setLoading(false);
        return;
      }


      const delay = Math.pow(2, reintento) * 1000;
      console.log(` Reintentando en ${delay / 1000} segundos...`);
      setTimeout(() => {
        cargarVisitas(reintento + 1, maxReintentos);
      }, delay);
    }
  };

  useEffect(() => {
    if (vieneEnVehiculo === "SI" && tipoVehiculoId) {
      cargarParqueaderosDisponibles();
    }
  }, [vieneEnVehiculo, tipoVehiculoId]);

  // Recibir el código del parqueadero seleccionado desde seleccionparqueadero.jsx
  useEffect(() => {
    const st = location.state;
    if (!st) return;

    // Si recibimos el formState, restaura los campos del formulario
    if (st.formState) {
      const f = st.formState;
      if (f.numeroDocumento !== undefined) setNumeroDocumento(f.numeroDocumento);
      if (f.nombreVisitante !== undefined) setNombreVisitante(f.nombreVisitante);
      if (f.tipoDocumentoId !== undefined) setTipoDocumentoId(String(f.tipoDocumentoId));
      if (f.apartamentoId !== undefined) setApartamentoId(String(f.apartamentoId));
      if (f.fechaHoraIngreso !== undefined) setFechaHoraIngreso(f.fechaHoraIngreso);
      if (f.observaciones !== undefined) setObservaciones(f.observaciones);
      if (f.matricula !== undefined) setMatricula(f.matricula);
      if (f.vieneEnVehiculo !== undefined) setVieneEnVehiculo(f.vieneEnVehiculo);
      if (f.codigoParqueadero !== undefined) setCodigoParqueadero(f.codigoParqueadero);
    }

    if (st.codigoParqueaderoSeleccionado && st.tipoVehiculoId) {
      setCodigoParqueadero(st.codigoParqueaderoSeleccionado);
      setTipoVehiculoId(String(st.tipoVehiculoId));
      // Mostrar confirmación breve al usuario
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Parqueadero ${st.codigoParqueaderoSeleccionado} seleccionado`,
        showConfirmButton: false,
        timer: 3500
      });
    }

    if (st.abrirModal) {
      abrirModal();
    }

    // Limpiar el state para evitar reutilizaciones
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [location.state]);

  const cargarParqueaderosDisponibles = async () => {
    const token = localStorage.getItem("token");
    console.log(" === INICIANDO CARGA DE PARQUEADEROS ===");
    console.log(" Tipo de vehículo seleccionado:", tipoVehiculoId);
    console.log(" Tipo de vehículo parseado:", parseInt(tipoVehiculoId));

    if (!tipoVehiculoId) {
      console.log(" No hay tipo de vehículo seleccionado, saltando carga");
      setParqueaderosDisponibles([]);
      return;
    }

    try {
      const res = await obtenerParqueaderos(token);
      if (!res.ok) {
        console.error("Error al obtener parqueaderos, status:", res.status);
        setParqueaderosDisponibles([]);
        return;
      }

      const data = await res.json();
      console.log(" Total parqueaderos recibidos:", data.body?.length || 0);
      console.log(" Estructura de parqueadero ejemplo:", data.body?.[0]);

      const porEstado = {};
      const porTipo = {};

      data.body?.forEach((p) => {
        porEstado[p.estadoId] = (porEstado[p.estadoId] || 0) + 1;
        porTipo[p.tipoVehiculoId] = (porTipo[p.tipoVehiculoId] || 0) + 1;
      });

      console.log(" Distribución por estado:", porEstado);
      console.log(" Distribución por tipo:", porTipo);

      const disponibles =
        data.body?.filter((p) => {
          const esLibre = p.estadoId === 4;
          const esTipoCorrect = p.tipoVehiculoId === parseInt(tipoVehiculoId);

          if (esLibre) {
            console.log(
              `🔍 Parqueadero LIBRE ${p.codigoParqueadero}: estadoId=${p.estadoId}, tipoVehiculoId=${p.tipoVehiculoId} (necesario=${parseInt(
                tipoVehiculoId
              )}) =${esTipoCorrect}`
            );
          }

          return esLibre && esTipoCorrect;
        }) || [];

      console.log(" RESULTADO FINAL:");
      console.log(`   - Parqueaderos disponibles: ${disponibles.length}`);
      console.log(
        `   - Códigos: [${disponibles
          .map((p) => p.codigoParqueadero)
          .join(", ")} ]`
      );
      console.log(" === FIN CARGA DE PARQUEADEROS ===");

      setParqueaderosDisponibles(disponibles);
    } catch (err) {
      console.error(" Error cargando parqueaderos:", err);
      setParqueaderosDisponibles([]);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = visitasFiltradas.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(visitasFiltradas.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado]);

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  useEffect(() => {
    if (location.state?.abrirModal) {
      abrirModal();
    }
  }, [location.state]);

  const abrirModal = () => setModalAbierto(true);

  const cerrarModal = () => {
    setModalAbierto(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingIndex(null);
    setNumeroDocumento("");
    setTipoDocumentoId("");
    setNombreVisitante("");
    setTorreId("");
    setApartamentoId("");
    setFechaHoraIngreso("");
    setObservaciones("");
    setMatricula("");
    setTipoVehiculoId("");
    setCodigoParqueadero("");
    setVieneEnVehiculo("");
    setParqueaderosDisponibles([]);
    // Limpiar el formulario persistido en sessionStorage para evitar reaparecer datos previos
    try { sessionStorage.removeItem('visitaForm'); } catch (e) { console.warn('No se pudo limpiar visitaForm', e); }
  };

  const fetchConReintento = async (url, options = {}, maxReintentos = 2) => {
    let ultimoError;

    for (let intento = 0; intento <= maxReintentos; intento++) {
      try {
        console.log(
          `📡 Realizando request (intento ${intento + 1}/${maxReintentos + 1
          }):`,
          url
        );

        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            ...options.headers,
          },
        });

        if (response.status === 401) {
          console.error(" Token expirado o inválido");
          localStorage.removeItem("token");
          navigate("/");
          throw new Error("Sesión expirada");
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        console.log("Request exitoso");
        return response;
      } catch (error) {
        ultimoError = error;
        console.error(
          ` Request falló (intento ${intento + 1}):`,
          error.message
        );

        if (intento < maxReintentos) {
          const delay = Math.pow(2, intento) * 1000; // 1s, 2s delay exponencial
          console.log(` Reintentando en ${delay / 1000} segundos...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw ultimoError;
  };


  const editarVisita = (visita, index) => {
    setEditingIndex(index);

    setNumeroDocumento(visita.numeroDocumento || "");
    setNombreVisitante(visita.nombreVisitante || "");
    setMatricula(visita.matricula || "");
    setCodigoParqueadero(visita.codigoParqueadero || "");

    setTipoDocumentoId(visita.tipoDocumentoId?.toString() || "1");
    setTipoVehiculoId(
      visita.tipoVehiculoId?.toString() || (visita.matricula ? "1" : "")
    );
    setObservaciones(visita.observaciones || "");

    setVieneEnVehiculo(visita.matricula ? "SI" : "NO");

    if (visita.apartamentoId) {

      const apartamento = apartamentos.find(
        (apt) => apt.id === visita.apartamentoId
      );
      if (apartamento) {
        setTorreId(apartamento.torreId.toString());
        setApartamentoId(visita.apartamentoId.toString());
      }
    } else if (visita.nombreTorre && visita.numeroApartamento) {

      const torreMap = {
        "Torre A": 1,
        "Torre B": 2,
        "Torre C": 3,
        "Torre D": 4,
        "Torre E": 5,
        "Torre F": 6,
        "Torre G": 7,
        "Torre H": 8,
        "Torre I": 9,
        "Torre J": 10,
      };
      const torreId = torreMap[visita.nombreTorre];
      if (torreId) {
        setTorreId(torreId.toString());
        const numeroApart = parseInt(visita.numeroApartamento);
        const apartamento = apartamentos.find(
          (apt) => apt.numero === numeroApart && apt.torreId === torreId
        );
        if (apartamento) {
          setApartamentoId(apartamento.id.toString());
        }
      }
    }


    if (visita.fechaHoraIngreso) {
      const fecha = new Date(visita.fechaHoraIngreso);
      const fechaLocal = new Date(
        fecha.getTime() - fecha.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setFechaHoraIngreso(fechaLocal);
    }

    console.log(" Editando visita:", {
      id: visita.idVisita,
      nombre: visita.nombreVisitante,
      tipoDoc: visita.tipoDocumentoId || " No disponible en JOIN",
      tipoVeh: visita.tipoVehiculoId || " No disponible en JOIN",
      observaciones: visita.observaciones || " No disponible en JOIN",
    });

    // Abrir modal y forzar recarga de parqueaderos disponibles para que
    // el parqueadero previamente asignado aparezca en el select.
    abrirModal();
    setTimeout(() => {
      try { cargarParqueaderosDisponibles(); } catch (e) { console.warn('Error recargando parqueaderos al editar', e); }
    }, 50);
  };

  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  const CERRAR = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/");
  };


  const asignarParqueadero = async () => {
    if (!codigoParqueadero) {
      Swal.fire("Error", "Debes seleccionar un parqueadero", "error");
      return null;
    }

    const token = localStorage.getItem("token");

    try {
      const datosAsignacion = {
        estadoId: 3, // Ocupado
        tipoVehiculoId: parseInt(tipoVehiculoId),
      };
      const res = await actualizarParqueadero(codigoParqueadero, datosAsignacion, token);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      setParqueaderosDisponibles((prev) =>
        prev.filter((p) => p.codigoParqueadero !== codigoParqueadero)
      );

      console.log(`✅ Parqueadero ${codigoParqueadero} asignado correctamente`);
      return data.body || { codigoParqueadero };
    } catch (error) {
      console.error("Error asignando parqueadero:", error);
      Swal.fire({
        icon: "error",
        title: "Error al asignar parqueadero",
        text: error.message,
        confirmButtonText: "Entendido",
      });
      return null;
    }
  };



  const liberarParqueadero = async (codigoParqueaderoALiberar) => {
    if (!codigoParqueaderoALiberar) {
      console.log(" No hay parqueadero para liberar");
      return false;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await actualizarParqueadero(
        codigoParqueaderoALiberar,
        { estadoId: 4, tipoVehiculoId: null },
        token
      );

      if (!res.ok) throw new Error("Error al liberar parqueadero");

      console.log(`✅ Parqueadero ${codigoParqueaderoALiberar} liberado correctamente`);
      return true;
    } catch (error) {
      console.error("Error liberando parqueadero:", error);
      console.log(
        ` No se pudo liberar el parqueadero ${codigoParqueaderoALiberar}`
      );
      return false;
    }
  };

  const registrarVisita = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // 🔹 Validaciones básicas
    if (
      !numeroDocumento ||
      !tipoDocumentoId ||
      !nombreVisitante ||
      !torreId ||
      !apartamentoId ||
      !fechaHoraIngreso
    ) {
      Swal.fire("Error", "Por favor completa todos los campos obligatorios", "error");
      return;
    }

    if (nombreVisitante.trim().length < 20) {
      Swal.fire({
        icon: "error",
        title: "Nombre muy corto",
        text: `El nombre debe tener al menos 20 caracteres. Actual: ${nombreVisitante.trim().length}`,
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (numeroDocumento.trim().length < 8) {
      Swal.fire({
        icon: "error",
        title: "Documento inválido",
        text: `El número de documento debe tener al menos 8 caracteres. Actual: ${numeroDocumento.trim().length}`,
        confirmButtonText: "Entendido",
      });
      return;
    }

    const validacionFecha = validarFecha(fechaHoraIngreso);
    if (!validacionFecha.valida) {
      Swal.fire({
        icon: "error",
        title: "Fecha inválida",
        text: validacionFecha.error,
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (isNaN(parseInt(tipoDocumentoId)) || parseInt(tipoDocumentoId) < 1) {
      Swal.fire({
        icon: "error",
        title: "Tipo de documento inválido",
        text: "Debes seleccionar un tipo de documento válido",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (isNaN(parseInt(apartamentoId)) || parseInt(apartamentoId) < 1) {
      Swal.fire({
        icon: "error",
        title: "Apartamento inválido",
        text: "Debes seleccionar un apartamento válido",
        confirmButtonText: "Entendido",
      });
      return;
    }

    // 🔹 Validación de datos del vehículo
    if (vieneEnVehiculo === "SI") {
      if (!matricula) {
        Swal.fire("Error", "Debes ingresar la matrícula", "error");
        return;
      }
      if (!tipoVehiculoId) {
        Swal.fire("Error", "Debes seleccionar el tipo de vehículo", "error");
        return;
      }
      if (!codigoParqueadero) {
        Swal.fire("Error", "Debes seleccionar un parqueadero", "error");
        return;
      }
    }

    try {
      // 🔹 Construir objeto de datos
      const visitaData = {
        numeroDocumento: numeroDocumento.trim(),
        nombreVisitante: nombreVisitante.trim(),
        tipoDocumentoId: parseInt(tipoDocumentoId),
        apartamentoId: parseInt(apartamentoId),
        fechaHoraIngreso: getFechaCompleta(fechaHoraIngreso),
        observaciones: observaciones.trim() || "-",
      };

      // 🔹 Datos del vehículo si aplica
      if (vieneEnVehiculo === "SI") {
        if (!matricula || !tipoVehiculoId || !codigoParqueadero) {
          Swal.fire("Error", "Debes ingresar todos los datos del vehículo y parqueadero", "error");
          return;
        }

        visitaData.matricula = matricula.trim().toUpperCase();
        visitaData.tipoVehiculoId = parseInt(tipoVehiculoId);
        visitaData.codigoParqueadero = codigoParqueadero;
      } else {
        visitaData.matricula = null;
        visitaData.tipoVehiculoId = null;
        visitaData.codigoParqueadero = null;
      }

      // 🔹 Determinar método y URL
      // 🔹 Enviar al backend usando servicios
      let res;
      try {
        if (editingIndex !== null) {
          console.log("📤 Actualizando visita (servicio):", visitas[editingIndex].idVisita, visitaData);
          res = await actualizarVisita(visitas[editingIndex].idVisita, visitaData, token);
        } else {
          console.log("📤 Creando visita (servicio):", visitaData);
          res = await crearVisita(visitaData, token);
        }

        const contentType = res.headers.get("content-type");
        const data = contentType && contentType.includes("application/json")
          ? await res.json()
          : await res.text();

        if (!res.ok) {
          console.error("Error del servidor:", data);
          Swal.fire("Error", data.error || "No se pudo registrar la visita", "error");
          return;
        }

        // mantener la variable data para el resto del flujo

        } catch (err) {
        console.error(" Error en la petición de visita:", err);
        Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
        return;
      }

      // 🔹 Mensaje de éxito
      const mensaje = editingIndex !== null
        ? "Actualizado correctamente"
        : "Registrado correctamente";

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: mensaje,
        timer: 3500,
        showConfirmButton: false,
      });

      // 🔹 Limpiar formulario y actualizar lista
      resetForm();
      cerrarModal();

      console.log(" Recargando visitas...");
      await cargarVisitas(0, 5);

    } catch (err) {
      console.error("🚨 Error registrando visita:", err);
      Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
    }
  };


  const getFechaCompleta = (fechaHora) => {
    if (!fechaHora) return null;

    if (fechaHora.includes(":") && !fechaHora.includes("T")) {
      const fechaHoy = new Date();
      const [hh, mm] = fechaHora.split(":");
      fechaHoy.setHours(parseInt(hh, 10));
      fechaHoy.setMinutes(parseInt(mm, 10));
      fechaHoy.setSeconds(0);
      return fechaHoy.toISOString();
    }

    return new Date(fechaHora).toISOString();
  };

  const finalizarvisita = async (idVisita) => {
    const token = localStorage.getItem("token");

    Swal.fire({
      title: "¿Estás seguro?",
      text: "La visita será finalizada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const ahora = new Date().toISOString();
        const visitaPayload = {
          estadoId: 9,
          fechaHoraSalida: ahora,
        };

        try {
          console.log(` Finalizando visita ID: ${idVisita}`);
          console.log(" Usando PATCH con payload completo");

          const response = await finalizarVisita(idVisita, token);

          console.log(" Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(" Error response:", errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
          }

          console.log(" Visita finalizada exitosamente");
          console.log(
            " El backend liberará automáticamente el parqueadero si existe"
          );

          await cargarVisitas();

          Swal.fire({
            icon: "success",
            title: "Finalizado correctamente",
            text: "La visita ha sido finalizada correctamente.",
            timer: 3500,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error(" Error al finalizar visita:", error);
          Swal.fire({
            icon: "error",
            title: "Lo siento",
            text: "Error de conexión. Comuníquese con el área de sistemas.",
            showCancelButton: true,
            confirmButtonText: "Reintentar",
            cancelButtonText: "Cerrar",
          }).then((retryResult) => {
            if (retryResult.isConfirmed) {
              finalizarvisita(idVisita);
            }
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#28a745",
        }}
      >
        <div className="spinner-border text-success mb-3" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <div>Cargando visitas...</div>
        <small className="text-muted mt-2">
          Verificando conexión con el servidor...
        </small>
      </div>
    );
  }

  return (
    <div className="main-dashboard dashboard-container d-flex">
      {/* Inyectar estilos CSS */}
      <style>{styles}</style>

      {/* Sidebar */}
      <aside id="menuTrabajador" className="worker-menu bg-success text-white">
        <div className="p-3 d-flex flex-column h-100">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="user-circle bg-white d-flex align-items-center justify-content-center"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
            >
              <span className="fw-bold text-success">
                {nombreUsuario?.substring(0, 2).toUpperCase() || "US"}
              </span>
            </div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">
                {nombreUsuario || "Usuario"}
              </span>
              <span className="fw-semibold text-white"> {rolUsuario || "Usuario"}</span>
              <span className="small text-white-50">Sesión activa</span>
            </div>
          </div>
          <h5 className="mb-3 mx-4">Menú {rolUsuario || "Usuario"} </h5>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Paquetes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link
                  className="nav-link text-white"
                  to="/Paqueteria"
                  state={{ abrirModal: true }}
                >
                  Registrar Paquete
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/Paqueteria">
                  Historial de Paquetes
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Visitas</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <div
                  className="nav-link text-white"
                  onClick={abrirModal}
                  style={{ cursor: "pointer" }}
                >
                  Crear Visita
                </div>
              </li>
              <li>
                <Link className="nav-link text-white" to="/visitas">
                  Consultar Visitas
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/parqueaderos">
                  Consultar Parqueaderos
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-4">
               {(
                verificadorRol === 1 || verificadorRol === "1" ||
                verificadorRol === 2 || verificadorRol === "2"
              )&& (
            <h6 className="text-uppercase fw-bold">Gestión de Áreas Comunes</h6>
              )}
            <ul className="nav flex-column mt-2 gap-2">
              {(
                verificadorRol === 1 || verificadorRol === "1" ||
                verificadorRol === 2 || verificadorRol === "2"
              ) && (
                  <li>
                    <Link className="nav-link text-white" to="/AreasComunes">
                      Registrar Reserva
                    </Link>
                  </li>
                )}
            </ul>
          </div>


          <div className="mb-4">
               {(
                verificadorRol === 1 || verificadorRol === "1" 
              )&& (
            <h6 className="text-uppercase fw-bold">Gestión de Usuarios</h6>
              )}
            {(
                verificadorRol === 1 || verificadorRol === "1" 
              )&& (
            <ul className="nav flex-column mt-2 gap-2">
            
                <li>
                  <Link
                    className="nav-link text-white"
                    to="/GestionUsuario"
                    state={{ abrirModal: true }}
                  >
                    Registrar Usuario
                  </Link>
                </li>
             
              <li>
                <Link className="nav-link text-white" to="/GestionUsuario">
                  Consultar Usuarios
                </Link>
              </li>
            </ul>
        )}
          </div>

          <div className="mb-4">
              {(
                verificadorRol === 1 || verificadorRol === "1" ||
                verificadorRol === 2 || verificadorRol === "2"
              )&& (
            <h6 className="text-uppercase fw-bold">Gestión Residentes</h6>
              )}
              {(
                verificadorRol === 1 || verificadorRol === "1" ||
                verificadorRol === 2 || verificadorRol === "2"
              )&& (
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link
                  className="nav-link text-white"
                  to="/Residentes"
                  state={{ abrirModal: true }}
                >
                  Crear Residente
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/Residentes">
                  Consultar Residente
                </Link>
              </li>
            </ul>
              )}
          </div>

          <div className="mt-auto text-center logout-container">
            <button onClick={CERRAR} className="btn btn-light w-100">
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="main-content flex-grow-1">
        {/* Barra superior */}
        <div className="d-flex align-items-center px-3 py-2 position-relative">
          {/* Espacio izquierdo para equilibrar */}
          <div style={{ width: "200px" }}></div>

          {/* Logo centrado */}
          <div className="flex-grow-1 text-center">
            <Link to="/Superadmin">
              <img
                src={logo}
                alt="Logo del sistema"
                className="logo-img"
              />
            </Link>
          </div>

          {/* Botón de usuario al extremo derecho */}
          <div
            className="position-relative"
            style={{
              width: "200px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              className="btn btn-outline-success d-flex align-items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-person-circle"
                viewBox="0 0 16 16"
              >
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                <path
                  fillRule="evenodd"
                  d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"
                />
              </svg>
              {usuario?.username || usuario?.nombre || "Usuario"}
            </div>
            {showUserMenu && (
              <div className="user-menu text-center">
                <p>
                  Usuario:{" "}
                  <strong>{usuario?.username || usuario?.nombre}</strong>
                </p>
                <p className="mb-2">
                  Rol: <strong>{rolUsuario}</strong>
                </p>
                <button onClick={CERRAR} className="btn btn-danger btn-sm">
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3 my-4">
          <h2 className="fw-bold">Gestión de Visitantes</h2>
        </div>

        {/* TABLA */}
        <div className="TABLA container-fluid p-0">
          <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fw-bold text-success">
                <i className="bi bi-people-fill"></i> Historial de Visitas
              </h3>
              <div className="d-flex gap-2 align-items-center">
                <button className="btn btn-primary btn-sm" >
                  <Link className="nav-link text-white" to="/parqueaderos">
                    Consultar Parqueaderos
                  </Link>
                </button>
                <button className="btn btn-success btn-sm" onClick={abrirModal}>
                  <i className="bi bi-plus-circle"></i> Registrar Nueva Visita
                </button>
              </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por documento, nombre o matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearchTerm("")}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="activo">En proceso</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            {/* Información de resultados */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">
                {visitasFiltradas.length === visitas.length
                  ? `${visitas.length} visita${visitas.length !== 1 ? "s" : ""
                  } total${visitas.length !== 1 ? "es" : ""}`
                  : `${visitasFiltradas.length} de ${visitas.length} visitas`}
              </span>
              <div className="d-flex gap-2">
                {(searchTerm || filterEstado) && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterEstado("");
                    }}
                  >
                    <i className="bi bi-arrow-clockwise"></i> Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-success">
                  <tr>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>Destino</th>
                    <th>Ingreso</th>
                    <th>Salida</th>
                    <th>Vehículo</th>
                    <th>Parqueadero</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((v, index) => {
                    const realIndex = indexOfFirstItem + index;
                    return (
                      <tr key={realIndex}>
                        <td>{v.numeroDocumento}</td>
                        <td>{v.nombreVisitante}</td>
                        <td>
                          {v.numeroApartamento} - {v.nombreTorre}
                        </td>
                        <td>{formatearFecha(v.fechaHoraIngreso)}</td>
                        <td>
                          {(() => {
                            const fechaSalida = obtenerFechaSalidaReal(
                              v.fechaHoraSalida,
                              v.estadoVisita
                            );
                            return fechaSalida
                              ? formatearFecha(fechaSalida)
                              : "Aún en el conjunto";
                          })()}
                        </td>
                        <td>
                          {v.matricula ? (
                            <div className="d-flex align-items-center gap-2">
                              {v.nombreVehiculo === "Moto" ? (
                                <i
                                  className="bi bi-scooter text-warning"
                                  title="Moto"
                                ></i>
                              ) : (
                                <i
                                  className="bi bi-car-front text-primary"
                                  title="Carro"
                                ></i>
                              )}
                              <span>{v.matricula}</span>
                            </div>
                          ) : (
                            <span className="text-muted d-flex align-items-center gap-1">
                              <i className="bi bi-x text-danger"></i>
                              <span>Sin vehículo</span>
                            </span>
                          )}
                        </td>
                        <td>{v.codigoParqueadero || "N/A"}</td>
                        <td>
                          {(() => {
                            const estadoReal = obtenerEstadoReal(
                              v.estadoVisita
                            );
                            if (estadoReal === "finalizada") {
                              return (
                                <span className="badge text-bg-secondary">
                                  Finalizada
                                </span>
                              );
                            } else if (estadoReal === "en curso") {
                              return (
                                <span className="badge bg-warning text-dark">
                                  En curso
                                </span>
                              );
                            } else {
                              return (
                                <span className="badge bg-info text-white">
                                  Registrada
                                </span>
                              );
                            }
                          })()}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {(() => {
                              const estadoReal = obtenerEstadoReal(
                                v.estadoVisita
                              );
                              if (estadoReal === "finalizada") {
                                return <span className="text-muted">—</span>;
                              } else {
                                return (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() =>
                                        editarVisita(
                                          v,
                                          indexOfFirstItem + index
                                        )
                                      }
                                      title="Editar visita"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    {estadoReal === "en curso" ? (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success"
                                        onClick={() =>
                                          finalizarvisita(v.idVisita)
                                        }
                                      >
                                        Finalizar
                                      </button>
                                    ) : (
                                      <span className="text-muted small">
                                        Solo visitas en curso
                                      </span>
                                    )}
                                  </>
                                );
                              }
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {visitasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center">
                        {searchTerm || filterEstado
                          ? "No se encontraron visitas con los filtros aplicados"
                          : "No hay visitas registradas"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginación */}
            {visitasFiltradas.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Mostrando {indexOfFirstItem + 1} -{" "}
                  {Math.min(indexOfLastItem, visitasFiltradas.length)} de{" "}
                  {visitasFiltradas.length} visitas
                </div>

                <nav>
                  <ul className="pagination mb-0">
                    <li
                      className={`page-item ${currentPage === 1 ? "disabled" : ""
                        }`}
                    >
                      <button
                        className="page-link"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i> Anterior
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <li
                          key={pageNum}
                          className={`page-item ${currentPage === pageNum ? "active" : ""
                            }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => goToPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      )
                    )}

                    <li
                      className={`page-item ${currentPage === totalPages ? "disabled" : ""
                        }`}
                    >
                      <button
                        className="page-link"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Modal Registrar Visita */}
        {modalAbierto && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1050,
              overflowY: "auto",
            }}
          >
            <div
              className="modal-dialog modal-dialog-scrollable"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    {editingIndex !== null
                      ? "Editar Visitante"
                      : "Registrar Visitante"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={cerrarModal}
                  />
                </div>

                <div className="modal-body">
                  <form onSubmit={registrarVisita}>
                    <div className="row">
                      {/* Tipo de Documento */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          Tipo Documento *
                        </label>
                        <select
                          className="form-select"
                          value={tipoDocumentoId}
                          onChange={(e) => setTipoDocumentoId(e.target.value)}
                          required
                        >
                          <option value="">Selecciona...</option>
                          <option value={1}>CC</option>
                          <option value={2}>CE</option>
                          <option value={3}>PA</option>
                          <option value={4}>PP</option>
                          <option value={5}>PPT</option>
                        </select>
                      </div>

                      {/* Número de Documento */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          Documento *{" "}
                          <small className="text-muted">
                            (mín. 8 caracteres)
                          </small>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={numeroDocumento}
                          onChange={(e) => setNumeroDocumento(e.target.value)}
                          placeholder="Ej: 12345678"
                          minLength={8}
                          required
                        />
                      </div>
                    </div>

                    {/* Nombre */}
                    <div className="mb-3">
                      <label className="form-label">
                        Nombre Visitante *{" "}
                        <small className="text-muted">
                          (mín. 20 caracteres)
                        </small>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={nombreVisitante}
                        onChange={(e) => setNombreVisitante(e.target.value)}
                        placeholder="Ej: Juan Carlos Rodriguez Gonzalez"
                        minLength={20}
                        required
                      />
                      {nombreVisitante && nombreVisitante.length < 20 && (
                        <small className="text-warning">
                          Faltan {20 - nombreVisitante.length} caracteres
                        </small>
                      )}
                    </div>

                    <div className="row">
                      {/* Torre */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Torre *</label>
                        <select
                          className="form-select"
                          value={torreId}
                          onChange={(e) => {
                            setTorreId(e.target.value);
                            setApartamentoId("");
                          }}
                          required
                        >
                          <option value="">Selecciona una torre</option>
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Torre {String.fromCharCode(65 + i)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Apartamento */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Apartamento *</label>
                        <select
                          className="form-select"
                          value={apartamentoId}
                          onChange={(e) => setApartamentoId(e.target.value)}
                          required
                          disabled={!torreId}
                        >
                          <option value="">Selecciona apartamento</option>
                          {apartamentos
                            .filter((a) => a.torreId === parseInt(torreId))
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.numero} {/* Esto ve el usuario */}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Fecha y hora de ingreso */}
                    <div className="mb-3">
                      <label className="form-label">
                        Fecha y Hora de Ingreso *
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={fechaHoraIngreso}
                        onChange={(e) => setFechaHoraIngreso(e.target.value)}
                        required
                      />
                    </div>

                    {/* Vehículo */}
                    <div className="mb-3">
                      <label className="form-label">
                        ¿Viene en Vehículo? *
                      </label>
                      <select
                        className="form-select"
                        value={vieneEnVehiculo}
                        onChange={(e) => {
                          setVieneEnVehiculo(e.target.value);
                          if (e.target.value === "NO") {
                            setMatricula("");
                            setTipoVehiculoId("");
                            setCodigoParqueadero("");
                          }
                        }}
                        required
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>

                    {/* Datos del vehículo */}
                    {vieneEnVehiculo === "SI" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Matrícula *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={matricula}
                            onChange={(e) =>
                              setMatricula(e.target.value.toUpperCase())
                            }
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Tipo de Vehículo *
                          </label>
                          <select
                            className="form-select"
                            value={tipoVehiculoId}
                            onChange={(e) => {
                              const tipoSeleccionado = e.target.value;
                              setTipoVehiculoId(tipoSeleccionado);
                              setCodigoParqueadero("");

                              // Si se selecciona un tipo de vehículo válido, redirigir a seleccionar parqueadero
                              if (tipoSeleccionado === "1" || tipoSeleccionado === "2") {
                                // Enviar el estado actual del formulario para preservarlo mientras el usuario selecciona parqueadero
                                navigate("/parqueaderos", {
                                  state: {
                                    tipoVehiculoId: parseInt(tipoSeleccionado),
                                    fromVisitas: true,
                                    formState: {
                                      numeroDocumento,
                                      nombreVisitante,
                                      tipoDocumentoId,
                                      apartamentoId,
                                      fechaHoraIngreso,
                                      observaciones,
                                      matricula,
                                      vieneEnVehiculo,
                                      codigoParqueadero
                                    }
                                  }
                                });
                              }
                            }}
                            required
                          >
                            <option value="">Selecciona tipo</option>
                            <option value={1}> Carro</option>
                            <option value={2}> Moto</option>
                          </select>
                        </div>

                        {/* Selección de parqueadero */}
                        {tipoVehiculoId && (
                          <div className="mb-3">


                            {/* Si hay un parqueadero ya seleccionado mostrarlo como información y permitir cambiarlo */}
                            {codigoParqueadero ? (
                              <div className="d-flex align-items-center gap-3">
                                <div>
                                  <div className="small text-muted">Parqueadero seleccionado</div>
                                  <div className="fw-bold">{codigoParqueadero}</div>
                                </div>

                                <div className="ms-auto d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                      // Navegar a selección limpiando el código actual en el formState
                                      navigate('/parqueaderos', {
                                        state: {
                                          tipoVehiculoId: parseInt(tipoVehiculoId) || null,
                                          fromVisitas: true,
                                          formState: {
                                            numeroDocumento,
                                            nombreVisitante,
                                            tipoDocumentoId,
                                            apartamentoId,
                                            fechaHoraIngreso,
                                            observaciones,
                                            matricula,
                                            vieneEnVehiculo,
                                            codigoParqueadero: "",
                                            tipoVehiculoId
                                          }
                                        }
                                      });
                                    }}
                                  >
                                    Cambiar parqueadero
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Si no hay parqueadero seleccionado, mostrar select con disponibles y botón para ir a la selección
                              (parqueaderosDisponibles.length > 0 ? (
                                <div className="d-flex gap-2 align-items-center">
                                  <select
                                    className="form-select"
                                    value={codigoParqueadero}
                                    onChange={(e) => {
                                      const seleccion = e.target.value;
                                      const encontrado = parqueaderosDisponibles.find(p => p.codigoParqueadero === seleccion);
                                      if (encontrado && encontrado.disabled) {
                                        Swal.fire('Tipo inválido', 'Este espacio no coincide con el tipo de vehículo y no puede seleccionarlo.', 'error');
                                        return;
                                      }
                                      setCodigoParqueadero(seleccion);
                                    }}
                                    required
                                  >
                                    <option value="">Selecciona un parqueadero</option>
                                    {parqueaderosDisponibles.map((p) => (
                                      <option key={p.codigoParqueadero} value={p.codigoParqueadero} disabled={p.disabled}>
                                        {p.codigoParqueadero}{p.disabled ? ' (no compatible)' : ''}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                      navigate('/parqueaderos', {
                                        state: {
                                          tipoVehiculoId: parseInt(tipoVehiculoId) || null,
                                          fromVisitas: true,
                                          formState: {
                                            numeroDocumento,
                                            nombreVisitante,
                                            tipoDocumentoId,
                                            apartamentoId,
                                            fechaHoraIngreso,
                                            observaciones,
                                            matricula,
                                            vieneEnVehiculo,
                                            codigoParqueadero: "",
                                            tipoVehiculoId
                                          }
                                        }
                                      });
                                    }}
                                  >
                                    Seleccionar parqueadero
                                  </button>
                                </div>
                              ) : (
                                <div className="alert alert-warning">
                                  <strong>No hay parqueaderos disponibles</strong>
                                  <br />
                                  Para {tipoVehiculoId === "1" ? " carros" : " motos"}. Todos están ocupados o no existen para este tipo de vehículo.
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Observaciones */}
                    <div className="mb-3">
                      <label className="form-label">Observaciones</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                      />
                    </div>

                    {/* Botones */}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary w-50"
                        onClick={cerrarModal}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-success w-50">
                        {editingIndex !== null ? "Actualizar" : "Registrar"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Visitas;
