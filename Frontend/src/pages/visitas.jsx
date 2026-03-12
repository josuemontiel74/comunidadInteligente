import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Styles/estiloVisitas.css";
import Swal from "sweetalert2";
import {
  validarNombreCompleto,
  filtrarInputDocumento,
  filtrarInputNombre,
} from "../utils/validaciones.js";
import {
  obtenerVisitasJoin,
  crearVisita,
  actualizarVisita,
  finalizarVisita,
} from "../services/visitas.services.jsx";
import ModalOverlay from "../utils/ModalOverlay.jsx";
import { verificarTokenVencido, obtenerRolFromToken } from "../utils/auth.js";
import useLogout from "../utils/useLogout.js";
import { obtenerParqueaderos } from "../services/parqueadero.services.jsx";

/** Valida los campos del formulario de visita. Retorna string de error o null */
function validarFormularioVisita(fd) {
  if (!fd.numeroDocumento || fd.numeroDocumento.length < 8)
    return "El documento debe tener al menos 8 caracteres";
  const errNom = validarNombreCompleto(fd.nombreVisitante);
  if (errNom) return errNom;
  if (!fd.tipoDocumentoId) return "Selecciona un tipo de documento";
  if (!fd.apartamentoId) return "Selecciona un apartamento";
  if (!fd.fechaHoraIngreso) return "Ingresa la fecha y hora de ingreso";
  if (!fd.telefono || fd.telefono.trim().length < 7)
    return "El teléfono del visitante es obligatorio (mínimo 7 dígitos)";
  if (!/^[0-9+\- ]{7,15}$/.test(fd.telefono.trim()))
    return "El teléfono solo puede contener dígitos, +, - y espacios";
  return null;
}

/** Valida los campos de vehículo cuando el visitante viene en vehículo */
function validarVehiculoVisita(fd) {
  if (fd.vieneEnVehiculo !== "SI") return null;
  if (!fd.matricula) return "Ingresa la matrícula del vehículo";
  const placaLimpia = fd.matricula.trim().toUpperCase();
  const placaRegex = /^[A-Z]{3}\d{2,3}[A-Z]?$/;
  if (!placaRegex.test(placaLimpia))
    return "La matrícula debe seguir el formato colombiano: ABC123 (carro) o ABC12D / ABC12 (moto). Sin caracteres especiales.";
  if (!fd.tipoVehiculoId) return "Selecciona el tipo de vehículo";
  if (!fd.codigoParqueadero) return "Selecciona un parqueadero";
  return null;
}

/** Resuelve la fecha del evento para el recibo (ingreso o salida) */
function resolverFechaEvento(v, esIngreso) {
  const campo = esIngreso ? v.fechaHoraIngreso : v.fechaHoraSalida;
  return campo ? new Date(campo).toLocaleString("es-CO") : "-";
}

/** Genera la sección HTML del vehículo para el recibo */
function generarSeccionVehiculo(v) {
  if (!v.matricula) return "";
  const parqueaderoHtml = v.codigoParqueadero
    ? `<div class="row"><span class="l">Parqueadero:</span><span class="v">${v.codigoParqueadero}</span></div>`
    : "";
  return `<hr/><div class="sec">Veh&iacute;culo</div><div class="row"><span class="l">Tipo:</span><span class="v">${v.nombreVehiculo || "Veh&iacute;culo"}</span></div><div class="row"><span class="l">Matr&iacute;cula:</span><span class="v">${v.matricula}</span></div>${parqueaderoHtml}`;
}

/** Filtra visitas según criterios de búsqueda activos */
function filtrarVisitas(
  visitas,
  { searchTerm, filtroTorre, filtroApartamento, filtroEstado },
  obtenerEstadoReal,
) {
  return visitas.filter((v) => {
    const cumpleBusqueda =
      !searchTerm ||
      (v.nombreVisitante || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (v.numeroDocumento || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (v.matricula || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.numeroApartamento || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const letraTorre = (v.nombreTorre || "").replace(/^Torre\s*/i, "");
    const cumpleTorre = !filtroTorre || letraTorre === filtroTorre;
    const cumpleApartamento =
      !filtroApartamento || (v.numeroApartamento || "") === filtroApartamento;
    const estado = obtenerEstadoReal(v);
    const cumpleEstado = filtroEstado === "todas" || estado === filtroEstado;
    return cumpleBusqueda && cumpleTorre && cumpleApartamento && cumpleEstado;
  });
}

/** Configuración visual del modal según modo crear/editar (extraída para reducir complejidad cognitiva) */
function getModalEditConfig(isEditing) {
  return {
    headerIcon: isEditing ? "bi-pencil-square" : "bi-person-plus",
    headerTitle: isEditing ? "Editar Visita" : "Registrar Nueva Visita",
    submitColor: isEditing ? "orange" : "green",
    submitIcon: isEditing ? "bi-pencil-square" : "bi-check-circle",
    submitText: isEditing ? "Actualizar Visita" : "Registrar Visita",
  };
}

/** Devuelve la fecha/hora actual en Colombia (UTC-5) con formato YYYY-MM-DDTHH:mm */
function obtenerFechaHoraColombia() {
  const ahora = new Date();
  const utcMs = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const col = new Date(utcMs + -5 * 60 * 60000);
  const yyyy = col.getFullYear();
  const mm = String(col.getMonth() + 1).padStart(2, "0");
  const dd = String(col.getDate()).padStart(2, "0");
  const hh = String(col.getHours()).padStart(2, "0");
  const min = String(col.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function visitaRequiereRenovacion(visita) {
  return Boolean(visita?.requiereRenovacion);
}

/** Helper para clase disabled en paginación */
const disabledIf = (cond) => (cond ? "disabled" : "");

function Visitas() {
  const navigate = useNavigate();
  const location = useLocation();

  // estado general
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitas, setVisitas] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTorre, setFiltroTorre] = useState("");
  const [filtroApartamento, setFiltroApartamento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  // paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // modal CRUD
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [visitaEditando, setVisitaEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // formulario
  const FORM_INITIAL = {
    numeroDocumento: "",
    tipoDocumentoId: "",
    nombreVisitante: "",
    torreId: "",
    apartamentoId: "",
    fechaHoraIngreso: "",
    observaciones: "",
    telefono: "",
    vieneEnVehiculo: "NO",
    matricula: "",
    tipoVehiculoId: "",
    codigoParqueadero: "",
  };
  const [formData, setFormData] = useState(FORM_INITIAL);

  // parqueaderos
  const [parqueaderosDisponibles, setParqueaderosDisponibles] = useState([]);

  // Apartamentos hardcoded (50 unidades, 5 por torre)
  const apartamentos = [
    { id: 1, torreId: 1, numero: "101" },
    { id: 2, torreId: 1, numero: "102" },
    { id: 3, torreId: 1, numero: "201" },
    { id: 4, torreId: 1, numero: "202" },
    { id: 5, torreId: 1, numero: "301" },
    { id: 6, torreId: 2, numero: "101" },
    { id: 7, torreId: 2, numero: "102" },
    { id: 8, torreId: 2, numero: "201" },
    { id: 9, torreId: 2, numero: "202" },
    { id: 10, torreId: 2, numero: "301" },
    { id: 11, torreId: 3, numero: "101" },
    { id: 12, torreId: 3, numero: "102" },
    { id: 13, torreId: 3, numero: "201" },
    { id: 14, torreId: 3, numero: "202" },
    { id: 15, torreId: 3, numero: "301" },
    { id: 16, torreId: 4, numero: "101" },
    { id: 17, torreId: 4, numero: "102" },
    { id: 18, torreId: 4, numero: "201" },
    { id: 19, torreId: 4, numero: "202" },
    { id: 20, torreId: 4, numero: "301" },
    { id: 21, torreId: 5, numero: "101" },
    { id: 22, torreId: 5, numero: "102" },
    { id: 23, torreId: 5, numero: "201" },
    { id: 24, torreId: 5, numero: "202" },
    { id: 25, torreId: 5, numero: "301" },
    { id: 26, torreId: 6, numero: "101" },
    { id: 27, torreId: 6, numero: "102" },
    { id: 28, torreId: 6, numero: "201" },
    { id: 29, torreId: 6, numero: "202" },
    { id: 30, torreId: 6, numero: "301" },
    { id: 31, torreId: 7, numero: "101" },
    { id: 32, torreId: 7, numero: "102" },
    { id: 33, torreId: 7, numero: "201" },
    { id: 34, torreId: 7, numero: "202" },
    { id: 35, torreId: 7, numero: "301" },
    { id: 36, torreId: 8, numero: "101" },
    { id: 37, torreId: 8, numero: "102" },
    { id: 38, torreId: 8, numero: "201" },
    { id: 39, torreId: 8, numero: "202" },
    { id: 40, torreId: 8, numero: "301" },
    { id: 41, torreId: 9, numero: "101" },
    { id: 42, torreId: 9, numero: "102" },
    { id: 43, torreId: 9, numero: "201" },
    { id: 44, torreId: 9, numero: "202" },
    { id: 45, torreId: 9, numero: "301" },
    { id: 46, torreId: 10, numero: "101" },
    { id: 47, torreId: 10, numero: "102" },
    { id: 48, torreId: 10, numero: "201" },
    { id: 49, torreId: 10, numero: "202" },
    { id: 50, torreId: 10, numero: "301" },
  ];

  // Token helpers (importados de utils/auth.js)

  const tokenLocal = localStorage.getItem("token");
  const rolesId = tokenLocal ? obtenerRolFromToken(tokenLocal) : null;

  // Verificar sesión
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || verificarTokenVencido(token)) {
      Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "La sesión expiró. Vuelva a iniciar sesión.",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      });
      return;
    }

    const userGuardado = localStorage.getItem("user");
    if (userGuardado) {
      try {
        setUsuario(JSON.parse(userGuardado));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      }
    }
  }, [navigate]);

  // Cargar visitas
  const cargarVisitas = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await obtenerVisitasJoin(token);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVisitas(data);
      } else if (data.body && Array.isArray(data.body)) {
        setVisitas(data.body);
      } else {
        setVisitas([]);
      }
    } catch {
      setError("Error al cargar las visitas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarVisitas();
  }, [cargarVisitas]);

  // Auto-refresco cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      cargarVisitas();
    }, 30000);
    return () => clearInterval(interval);
  }, [cargarVisitas]);

  // Imprimir recibo de visita
  const imprimirReciboVisita = (v, tipo) => {
    if (!v) return;
    const ahora = new Date();
    const fechaImpresion = `${ahora.getDate().toString().padStart(2, "0")}/${(ahora.getMonth() + 1).toString().padStart(2, "0")}/${ahora.getFullYear()} ${ahora.getHours().toString().padStart(2, "0")}:${ahora.getMinutes().toString().padStart(2, "0")}`;
    const esIngreso = tipo === "INGRESO";
    const fechaEvento = resolverFechaEvento(v, esIngreso);
    const id = v.idVisita || v.id || "---";
    const seccionIngresoExtra =
      !esIngreso && v.fechaHoraIngreso
        ? `<div class="row"><span class="l">Ingreso:</span><span class="v">${new Date(v.fechaHoraIngreso).toLocaleString("es-CO")}</span></div>`
        : "";
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Comprobante Visita #${id}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 80mm; padding: 4mm; background: #fff; color: #000; font-size: 12px; line-height: 1.5; }
  .c { text-align: center; }
  .titulo { font-size: 17px; font-weight: bold; margin: 4px 0 2px; }
  .sub { font-size: 10px; color: #555; margin-bottom: 4px; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .sec { font-size: 11px; font-weight: bold; text-transform: uppercase; background: #f0f0f0; padding: 2px 4px; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
  .row .l { font-weight: bold; flex-shrink: 0; }
  .row .v { text-align: right; word-break: break-word; max-width: 58%; }
  .tipo-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; margin: 6px 0; background: ${esIngreso ? "#d4f1e4" : "#fde8e8"}; color: ${esIngreso ? "#155724" : "#7f1d1d"}; border: 1.5px solid ${esIngreso ? "#27ae60" : "#e74c3c"}; }
  .aviso { font-size: 10.5px; font-weight: bold; text-align: center; border: 1.5px solid #000; padding: 5px 4px; margin: 8px 0 4px; border-radius: 4px; line-height: 1.4; }
  .pie { text-align: center; font-size: 9px; color: #777; margin-top: 8px; padding-top: 4px; }
  .barcode { text-align: center; font-size: 22px; letter-spacing: 3px; font-family: 'Libre Barcode 39', cursive, monospace; margin: 6px 0; }
  @media print { body { width: 80mm; } }
</style></head>
<body>
  <div class="c">
    <div class="titulo">AZAHAR</div>
    <div class="sub">Conjunto Residencial</div>
    <div class="sub">NIT: 900.XXX.XXX-X</div>
    <br/>
    <div class="tipo-badge">${esIngreso ? "&#x2714; INGRESO" : "&#x2190; SALIDA"}</div>
    <div style="font-size:11px;font-weight:bold;">COMPROBANTE DE VISITA</div>
    <div style="font-size:18px;font-weight:bold;letter-spacing:2px;">#${String(id).padStart(5, "0")}</div>
  </div>
  <hr/>
  <div class="sec">Visitante</div>
  <div class="row"><span class="l">Nombre:</span><span class="v">${v.nombreVisitante || "-"}</span></div>
  <div class="row"><span class="l">Documento:</span><span class="v">${v.numeroDocumento || "-"}</span></div>
  <div class="row"><span class="l">Teléfono:</span><span class="v">${v.telefono || "-"}</span></div>
  <hr/>
  <div class="sec">Destino</div>
  <div class="row"><span class="l">Apto:</span><span class="v">${v.numeroApartamento || "-"} &mdash; ${v.nombreTorre || ""}</span></div>
  <hr/>
  <div class="sec">${esIngreso ? "Hora de Ingreso" : "Hora de Salida"}</div>
  <div class="row"><span class="l">${esIngreso ? "Ingreso:" : "Salida:"}</span><span class="v">${fechaEvento}</span></div>
  ${seccionIngresoExtra}
  ${generarSeccionVehiculo(v)}
  <hr/>
  <div class="aviso">
    &#9888; ESTE COMPROBANTE NO DEBE SER DESECHADO<br/>
    Consérvelo hasta retirarse del conjunto.<br/>
    Puede ser requerido por seguridad.
  </div>
  <div class="barcode">*${String(id).padStart(6, "0")}*</div>
  <hr/>
  <div class="pie">
    Impreso: ${fechaImpresion}<br/>
    Vigilancia &mdash; Conjunto Residencial AZAHAR<br/>
    Documento v&aacute;lido solo para la fecha indicada.
  </div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const ventana = window.open(url, "_blank", "width=320,height=650");
    if (!ventana) {
      URL.revokeObjectURL(url);
      Swal.fire(
        "Bloqueado",
        "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.",
        "warning",
      );
      return;
    }
    ventana.onload = () => {
      URL.revokeObjectURL(url);
      setTimeout(() => ventana.print(), 300);
    };
  };

  // Restaurar estado del formulario desde parqueaderos
  useEffect(() => {
    if (location.state?.fromVisitas && location.state?.formState) {
      const fs = location.state.formState;
      setFormData({
        numeroDocumento: fs.numeroDocumento || "",
        tipoDocumentoId: fs.tipoDocumentoId || "",
        nombreVisitante: fs.nombreVisitante || "",
        torreId: fs.torreId || "",
        apartamentoId: fs.apartamentoId || "",
        fechaHoraIngreso: fs.fechaHoraIngreso || "",
        observaciones: fs.observaciones || "",
        telefono: fs.telefono || "",
        vieneEnVehiculo: fs.vieneEnVehiculo || "NO",
        matricula: fs.matricula || "",
        tipoVehiculoId: fs.tipoVehiculoId || "",
        codigoParqueadero:
          location.state.codigoParqueadero || fs.codigoParqueadero || "",
      });

      // Restaurar modo edición si venía de editar
      if (location.state.editMode && location.state.visitaEditando) {
        setVisitaEditando(location.state.visitaEditando);
        setModalEditar(true);
      } else {
        setModalCrear(true);
      }

      // Limpiar el state para evitar re-apertura
      globalThis.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Cargar parqueaderos disponibles
  const cargarParqueaderos = useCallback(async (tipoVehiculo) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await obtenerParqueaderos(token);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.body || [];
      // Filtrar: estadoId === 4 (disponible)
      const disponibles = lista.filter((p) => p.estadoId === 4);
      // Marcar como disabled los que no coinciden con el tipo
      const conMarca = disponibles.map((p) => ({
        ...p,
        disabled:
          tipoVehiculo &&
          p.tipoVehiculoId !== Number.parseInt(tipoVehiculo, 10),
      }));
      setParqueaderosDisponibles(conMarca);
    } catch {
      setParqueaderosDisponibles([]);
    }
  }, []);

  // Convertir fecha a hora Colombia UTC-5
  const toColombiaDate = (fechaStr) => {
    const fecha = new Date(fechaStr);
    if (Number.isNaN(fecha.getTime())) return null;
    const colombiaOffset = -5 * 60;
    const utcMs = fecha.getTime() + fecha.getTimezoneOffset() * 60000;
    return new Date(utcMs + colombiaOffset * 60000);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "N/A";
    try {
      const d = toColombiaDate(fechaStr);
      if (!d) return fechaStr;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
    } catch {
      return fechaStr;
    }
  };

  const fechaParaInput = (fechaStr) => {
    if (!fechaStr) return "";
    try {
      const d = toColombiaDate(fechaStr);
      if (!d) return "";
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${d.getFullYear()}-${mm}-${dd}T${hh}:${min}`;
    } catch {
      return "";
    }
  };

  // Obtener estado real
  const obtenerEstadoReal = (visita) => {
    if (visitaRequiereRenovacion(visita)) return "vencida";
    const estadoVisita = visita?.estadoVisita;
    if (!estadoVisita) return "activa";
    const lower = estadoVisita.toLowerCase();
    if (
      lower.includes("finaliz") ||
      lower.includes("inactiv") ||
      lower === "finalizada"
    )
      return "finalizada";
    return "activa";
  };

  // Filtros
  const visitasFiltradas = filtrarVisitas(
    visitas,
    { searchTerm, filtroTorre, filtroApartamento, filtroEstado },
    obtenerEstadoReal,
  );

  // Apartamentos disponibles para el filtro según torre seleccionada
  const apartamentosFiltro = filtroTorre
    ? [
        ...new Set(
          visitas
            .filter(
              (v) =>
                (v.nombreTorre || "").replace(/^Torre\s*/i, "") === filtroTorre,
            )
            .map((v) => v.numeroApartamento)
            .filter(Boolean),
        ),
      ].sort((a, b) =>
        String(a).localeCompare(String(b), "es", { numeric: true }),
      )
    : [];

  // Paginación
  const totalPaginas = Math.ceil(visitasFiltradas.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const visitasPaginadas = visitasFiltradas.slice(indiceInicio, indiceFin);

  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, filtroTorre, filtroApartamento, filtroEstado]);

  const getPaginasVisibles = () => {
    const paginas = [];
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    if (fin - inicio < 4) inicio = Math.max(1, fin - 4);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  };

  // Stats: Hoy = ingresaron hoy | Activas = TODAS aún activas | Finalizadas hoy
  const hoyStr = new Date().toISOString().slice(0, 10);
  const visitasHoy = visitas.filter((v) => {
    try {
      return (v.fechaHoraIngreso || "").slice(0, 10) === hoyStr;
    } catch {
      return false;
    }
  });
  const totalVisitasHoy = visitasHoy.length;
  const activasTotalCount = visitas.filter(
    (v) => obtenerEstadoReal(v) === "activa",
  ).length;
  const vencidasTotalCount = visitas.filter(
    (v) => obtenerEstadoReal(v) === "vencida",
  ).length;
  const finalizadasHoyCount = visitasHoy.filter(
    (v) => obtenerEstadoReal(v) === "finalizada",
  ).length;

  const hayFiltrosActivos =
    searchTerm || filtroTorre || filtroApartamento || filtroEstado !== "todas";

  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroTorre("");
    setFiltroApartamento("");
    setFiltroEstado("todas");
  };

  // Reset form
  const resetForm = () => {
    setFormData(FORM_INITIAL);
    setParqueaderosDisponibles([]);
  };

  // Abrir modal crear
  const abrirModalCrear = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      fechaHoraIngreso: obtenerFechaHoraColombia(),
    }));
    setModalCrear(true);
  };

  // Abrir modal editar
  const abrirModalEditar = (v) => {
    // Resolver torreId desde nombreTorre
    const letraTorre = (v.nombreTorre || "").replace(/^Torre\s*/i, "");
    const torreIndex = letraTorre.codePointAt(0) - 64; // A=1, B=2...

    setVisitaEditando(v);
    setFormData({
      numeroDocumento: v.numeroDocumento || "",
      tipoDocumentoId: String(v.tipoDocumentoId || ""),
      nombreVisitante: v.nombreVisitante || "",
      torreId: String(torreIndex || ""),
      apartamentoId: String(v.apartamentoId || ""),
      fechaHoraIngreso: fechaParaInput(v.fechaHoraIngreso),
      observaciones: v.observaciones || "",
      telefono: v.telefono || "",
      vieneEnVehiculo: v.matricula ? "SI" : "NO",
      matricula: v.matricula || "",
      tipoVehiculoId: String(v.tipoVehiculoId || ""),
      codigoParqueadero: v.codigoParqueadero || "",
    });
    if (v.matricula && v.tipoVehiculoId) {
      cargarParqueaderos(v.tipoVehiculoId);
    }
    setModalEditar(true);
  };

  // Guardar visita (crear o editar)
  const handleGuardar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const errForm = validarFormularioVisita(formData);
    if (errForm) {
      Swal.fire("Error", errForm, "error");
      return;
    }
    const errVeh = validarVehiculoVisita(formData);
    if (errVeh) {
      Swal.fire("Error", errVeh, "error");
      return;
    }

    setGuardando(true);
    try {
      const visitaData = {
        numeroDocumento: formData.numeroDocumento.trim(),
        nombreVisitante: formData.nombreVisitante.trim(),
        tipoDocumentoId: Number.parseInt(formData.tipoDocumentoId, 10),
        apartamentoId: Number.parseInt(formData.apartamentoId, 10),
        fechaHoraIngreso: formData.fechaHoraIngreso.replace("T", " "),
        observaciones: formData.observaciones.trim() || "-",
        telefono: formData.telefono.trim(),
      };

      if (formData.vieneEnVehiculo === "SI") {
        visitaData.matricula = formData.matricula.trim().toUpperCase();
        visitaData.tipoVehiculoId = Number.parseInt(
          formData.tipoVehiculoId,
          10,
        );
        visitaData.codigoParqueadero = formData.codigoParqueadero;
      } else {
        visitaData.matricula = null;
        visitaData.tipoVehiculoId = null;
        visitaData.codigoParqueadero = null;
      }

      let res;
      if (modalEditar && visitaEditando) {
        res = await actualizarVisita(
          visitaEditando.idVisita,
          visitaData,
          token,
        );
      } else {
        res = await crearVisita(visitaData, token);
      }

      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        if (data?.codigo === "VISITA_DUPLICADA") {
          Swal.fire({
            icon: "warning",
            title: "Lo siento",
            text:
              data.error ||
              "Ya hay una persona con este número de documento en visita. Todavía no ha salido.",
            confirmButtonText: "Entendido",
            confirmButtonColor: "#4CAF50",
          });
        } else {
          Swal.fire(
            "Error",
            data.error || "No se pudo guardar la visita",
            "error",
          );
        }
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: modalEditar
          ? "Visita actualizada correctamente"
          : "Visita registrada correctamente",
        timer: 3000,
        showConfirmButton: false,
      });

      setModalCrear(false);
      setModalEditar(false);
      setVisitaEditando(null);
      resetForm();
      await cargarVisitas();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Lo siento",
        text: "Error de conexión. Comuníquese con el área de sistemas.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setGuardando(false);
    }
  };

  // Finalizar visita
  const handleFinalizar = (idVisita) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "La visita será finalizada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4CAF50",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const response = await finalizarVisita(idVisita, token);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
          }
          await cargarVisitas();
          Swal.fire({
            icon: "success",
            title: "Finalizada",
            text: "La visita ha sido finalizada correctamente.",
            timer: 3000,
            showConfirmButton: false,
          });
        } catch {
          Swal.fire({
            icon: "error",
            title: "Lo siento",
            text: "Error de conexión. Comuníquese con el área de sistemas.",
            confirmButtonText: "Entendido",
          });
        }
      }
    });
  };

  // Cerrar sesión
  const cerrarSesion = useLogout();

  // Navegar a parqueaderos para seleccionar
  const irASeleccionarParqueadero = () => {
    navigate("/parqueaderos", {
      replace: true,
      state: {
        tipoVehiculoId: Number.parseInt(formData.tipoVehiculoId, 10) || null,
        fromVisitas: true,
        formState: { ...formData },
        editMode: modalEditar,
        visitaEditando: visitaEditando || null,
      },
    });
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Si cambia torre, resetear apartamento
      if (field === "torreId") {
        updated.apartamentoId = "";
      }

      // Si cambia vieneEnVehiculo a NO, limpiar datos vehículo
      if (field === "vieneEnVehiculo" && value === "NO") {
        updated.matricula = "";
        updated.tipoVehiculoId = "";
        updated.codigoParqueadero = "";
        setParqueaderosDisponibles([]);
      }

      // Si cambia tipo vehiculo, cargar parqueaderos
      if (field === "tipoVehiculoId" && value) {
        cargarParqueaderos(value);
        updated.codigoParqueadero = "";
      }

      return updated;
    });
  };

  // Loading
  if (loading && visitas.length === 0) {
    return (
      <div className="vis-loading-screen">
        <output className="spinner-border" style={{ color: "#4CAF50" }}>
          <span className="visually-hidden">Cargando...</span>
        </output>
        <p className="mt-3 fw-semibold" style={{ color: "#4CAF50" }}>
          Cargando visitas...
        </p>
      </div>
    );
  }

  const modalConfig = getModalEditConfig(modalEditar);

  // ══════════════════════ RENDER ══════════════════════
  return (
    <div className="vis-dashboard">
      <button
        type="button"
        className={`vis-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        tabIndex={0}
        aria-label="Cerrar menú"
      />
      <aside className={`vis-drawer ${menuOpen ? "open" : ""}`}>
        <div className="vis-drawer-header">
          <div className="vis-drawer-avatar">
            <i className="bi bi-people-fill"></i>
          </div>
          <h4 className="vis-drawer-title">Gestión de Visitas</h4>
          <span className="vis-drawer-user">
            {usuario?.username || usuario?.nombre || "Usuario"}
          </span>
        </div>

        <div className="vis-drawer-body">
          <div className="vis-menu-section">
            <h6 className="vis-menu-section-title">Navegación</h6>
            <Link
              className="vis-menu-item"
              to={{ 1: "/Superadmin", 2: "/Admin" }[rolesId] || "/Vigilante"}
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right vis-menu-arrow"></i>
            </Link>
            {rolesId === 1 && (
              <Link
                className="vis-menu-item"
                to="/Auditorias"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-journal-text"></i>
                <span>Auditorías</span>
                <i className="bi bi-chevron-right vis-menu-arrow"></i>
              </Link>
            )}
          </div>

          <div className="vis-menu-section">
            <h6 className="vis-menu-section-title">Módulos</h6>
            <Link
              className="vis-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right vis-menu-arrow"></i>
            </Link>
            <Link
              className="vis-menu-item active"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right vis-menu-arrow"></i>
            </Link>
            <Link
              className="vis-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right vis-menu-arrow"></i>
            </Link>
            {(rolesId === 1 || rolesId === 2) && (
              <>
                <Link
                  className="vis-menu-item"
                  to="/AreasComunes"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-calendar-event"></i>
                  <span>Áreas Comunes</span>
                  <i className="bi bi-chevron-right vis-menu-arrow"></i>
                </Link>
                <Link
                  className="vis-menu-item"
                  to="/Residentes"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-house-door"></i>
                  <span>Residentes</span>
                  <i className="bi bi-chevron-right vis-menu-arrow"></i>
                </Link>
              </>
            )}
            {(rolesId === 1 || rolesId === 2) && (
              <Link
                className="vis-menu-item"
                to="/Reportes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-graph-up-arrow"></i>
                <span>Reportes</span>
                <i className="bi bi-chevron-right vis-menu-arrow"></i>
              </Link>
            )}
            {rolesId === 1 && (
              <>
                <Link
                  className="vis-menu-item"
                  to="/GestionUsuario"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Gestión Usuarios</span>
                  <i className="bi bi-chevron-right vis-menu-arrow"></i>
                </Link>
                <Link
                  className="vis-menu-item"
                  to="/LogErrores"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-bug"></i>
                  <span>Log de Errores</span>
                  <i className="bi bi-chevron-right vis-menu-arrow"></i>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="vis-drawer-footer">
          <button className="vis-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="vis-main">
        {/* Header AppBar */}
        <header className="vis-header">
          <button
            className="vis-header-btn"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="vis-header-center">
            <h5 className="vis-header-title">Gestión de Visitas</h5>
          </div>

          <div className="vis-header-actions">
            <button
              className="vis-header-btn"
              onClick={cargarVisitas}
              disabled={loading}
              title="Actualizar"
            >
              <i
                className={`bi ${loading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            <button
              className="vis-header-btn"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        {/* Error state */}
        {error && (
          <div className="vis-error-container">
            <i className="bi bi-exclamation-triangle-fill vis-error-icon"></i>
            <h5>Error al cargar los datos</h5>
            <p>
              El servidor está teniendo problemas.
              <br />
              Por favor, contacta al administrador.
            </p>
            <button className="vis-btn-retry" onClick={cargarVisitas}>
              <i className="bi bi-arrow-clockwise me-2"></i>Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && visitas.length === 0 && (
          <div className="vis-empty-container">
            <i className="bi bi-people vis-empty-icon"></i>
            <h5>No hay visitas registradas</h5>
            <p className="text-muted mb-3">
              Registra la primera visita con el botón de abajo
            </p>
            <button className="vis-btn-retry" onClick={abrirModalCrear}>
              <i className="bi bi-plus-circle me-2"></i>Registrar Visita
            </button>
          </div>
        )}

        {/* Content */}
        {!error && visitas.length > 0 && (
          <>
            {/* ── Stats diarios ── */}
            <div className="vis-stats-container">
              <div className="vis-stat-box">
                <div className="vis-stat-label" style={{ color: "#388e3c" }}>
                  Hoy
                </div>
                <div className="vis-stat-value" style={{ color: "#388e3c" }}>
                  {totalVisitasHoy}
                </div>
              </div>
              <div className="vis-stat-box">
                <div className="vis-stat-label" style={{ color: "#f57c00" }}>
                  Activas
                </div>
                <div className="vis-stat-value" style={{ color: "#f57c00" }}>
                  {activasTotalCount}
                </div>
              </div>
              <div className="vis-stat-box">
                <div className="vis-stat-label" style={{ color: "#c2410c" }}>
                  Vencidas
                </div>
                <div className="vis-stat-value" style={{ color: "#c2410c" }}>
                  {vencidasTotalCount}
                </div>
              </div>
              <div className="vis-stat-box">
                <div className="vis-stat-label" style={{ color: "#757575" }}>
                  Finalizadas hoy
                </div>
                <div className="vis-stat-value" style={{ color: "#757575" }}>
                  {finalizadasHoyCount}
                </div>
              </div>
            </div>

            {/* ── TOOLBAR ── */}
            <div className="vis-toolbar">
              <div className="vis-toolbar-top">
                <button className="vis-btn-registrar" onClick={abrirModalCrear}>
                  <i className="bi bi-plus-circle"></i> Registrar Visita
                </button>
                <div className="vis-filter-search">
                  <i className="bi bi-search vis-filter-search-icon"></i>
                  <input
                    type="text"
                    className="form-control vis-filter-input"
                    placeholder="Buscar por nombre, documento, matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  className="vis-btn-parking"
                  onClick={() => navigate("/parqueaderos")}
                  title="Ver Parqueaderos"
                >
                  <i className="bi bi-p-circle"></i>
                  <span>Parqueaderos</span>
                </button>
              </div>

              <div className="vis-filter-row">
                <div className="vis-filter-select-wrap">
                  <i className="bi bi-building vis-filter-select-icon"></i>
                  <select
                    className="form-select vis-filter-select"
                    value={filtroTorre}
                    onChange={(e) => {
                      setFiltroTorre(e.target.value);
                      setFiltroApartamento("");
                    }}
                  >
                    <option value="">Todas las Torres</option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option
                        key={String.fromCodePoint(65 + i)}
                        value={String.fromCodePoint(65 + i)}
                      >
                        Torre {String.fromCodePoint(65 + i)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="vis-filter-select-wrap">
                  <i className="bi bi-door-open vis-filter-select-icon"></i>
                  <select
                    className="form-select vis-filter-select"
                    value={filtroApartamento}
                    onChange={(e) => setFiltroApartamento(e.target.value)}
                    disabled={!filtroTorre}
                  >
                    <option value="">Todos los Apartamentos</option>
                    {apartamentosFiltro.map((num) => (
                      <option key={num} value={num}>
                        Apto {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Chips (estado) + Limpiar filtros */}
              <div className="vis-filter-chips">
                {["todas", "activa", "vencida", "finalizada"].map((est) => (
                  <button
                    key={est}
                    className={`vis-chip ${filtroEstado === est ? "active" : ""}`}
                    onClick={() => setFiltroEstado(est)}
                  >
                    {
                      {
                        todas: "Todas",
                        activa: "Activas",
                        vencida: "Vencidas",
                        finalizada: "Finalizadas",
                      }[est]
                    }
                  </button>
                ))}
                {hayFiltrosActivos && (
                  <button
                    className="vis-chip vis-chip-clear"
                    onClick={limpiarFiltros}
                  >
                    <i className="bi bi-x-circle me-1"></i> Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Sin resultados con filtros */}
            {visitasFiltradas.length === 0 && (
              <div className="vis-empty-container">
                <i className="bi bi-search vis-empty-icon"></i>
                <h5>No se encontraron visitas</h5>
                <p className="text-muted">
                  Intenta cambiar los filtros de búsqueda
                </p>
              </div>
            )}

            {/* ── TABLA (escritorio ≥ 800px) ── */}
            {visitasFiltradas.length > 0 && (
              <div className="vis-table-container">
                <table className="vis-table">
                  <thead>
                    <tr>
                      <th>Visitante</th>
                      <th>Documento</th>
                      <th>Teléfono</th>
                      <th>Apartamento</th>
                      <th>Torre</th>
                      <th>Fecha Ingreso</th>
                      <th>Vehículo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitasPaginadas.map((v) => {
                      const estado = obtenerEstadoReal(v);
                      return (
                        <tr key={v.idVisita} className="vis-table-row">
                          <td>{v.nombreVisitante}</td>
                          <td>{v.numeroDocumento}</td>
                          <td>
                            {v.telefono ? (
                              <a href={`tel:${v.telefono}`} title="Llamar">
                                <i className="bi bi-telephone me-1"></i>
                                {v.telefono}
                              </a>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>{v.numeroApartamento}</td>
                          <td>{v.nombreTorre}</td>
                          <td>{formatearFecha(v.fechaHoraIngreso)}</td>
                          <td>
                            {v.matricula ? (
                              <span>
                                <i
                                  className={`${v.nombreVehiculo?.toLowerCase() === "moto" ? "fa-solid fa-motorcycle" : "bi bi-car-front"} text-success me-1`}
                                ></i>
                                {v.matricula}
                              </span>
                            ) : (
                              <span className="vis-sin-vehiculo">
                                Sin vehículo
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`vis-badge ${estado === "activa" ? "vis-badge-activa" : estado === "vencida" ? "vis-badge-vencida" : "vis-badge-finalizada"}`}
                            >
                              {estado === "activa"
                                ? "Activa"
                                : estado === "vencida"
                                  ? "Vencida"
                                  : "Finalizada"}
                            </span>
                          </td>
                          <td>
                            <div className="vis-action-btns">
                              <button
                                className="vis-action-btn info"
                                onClick={() => setModalDetalle(v)}
                                title="Ver detalles"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              {(estado === "activa" ||
                                estado === "vencida") && (
                                <>
                                  <button
                                    className="vis-action-btn edit"
                                    onClick={() => abrirModalEditar(v)}
                                    title="Editar visita"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="vis-action-btn finalizar"
                                    onClick={() => handleFinalizar(v.idVisita)}
                                    title="Finalizar visita"
                                  >
                                    <i className="bi bi-check-circle"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CARDS (móvil < 800px) ── */}
            {visitasFiltradas.length > 0 && (
              <div className="vis-cards-container">
                {visitasPaginadas.map((v) => {
                  const estado = obtenerEstadoReal(v);
                  return (
                    <div key={v.idVisita} className="vis-card">
                      <div className="vis-card-header">
                        <span className="vis-card-name">
                          {v.nombreVisitante}
                        </span>
                        <span
                          className={`vis-badge ${estado === "activa" ? "vis-badge-activa" : estado === "vencida" ? "vis-badge-vencida" : "vis-badge-finalizada"}`}
                        >
                          {estado === "activa"
                            ? "Activa"
                            : estado === "vencida"
                              ? "Vencida"
                              : "Finalizada"}
                        </span>
                      </div>
                      <div className="vis-card-body">
                        <div className="vis-card-info-row">
                          <div className="vis-card-info-icon green">
                            <i className="bi bi-person-vcard"></i>
                          </div>
                          <div>
                            <div className="vis-card-info-label">Documento</div>
                            <div className="vis-card-info-value">
                              {v.numeroDocumento}
                            </div>
                          </div>
                        </div>
                        {v.telefono && (
                          <div className="vis-card-info-row">
                            <div className="vis-card-info-icon green">
                              <i className="bi bi-telephone"></i>
                            </div>
                            <div>
                              <div className="vis-card-info-label">
                                Teléfono
                              </div>
                              <div className="vis-card-info-value">
                                <a href={`tel:${v.telefono}`}>{v.telefono}</a>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="vis-card-info-row">
                          <div className="vis-card-info-icon blue">
                            <i className="bi bi-building"></i>
                          </div>
                          <div>
                            <div className="vis-card-info-label">Destino</div>
                            <div className="vis-card-info-value">
                              Apto {v.numeroApartamento} - {v.nombreTorre}
                            </div>
                          </div>
                        </div>
                        <div className="vis-card-info-row">
                          <div className="vis-card-info-icon orange">
                            <i className="bi bi-calendar-event"></i>
                          </div>
                          <div>
                            <div className="vis-card-info-label">Ingreso</div>
                            <div className="vis-card-info-value">
                              {formatearFecha(v.fechaHoraIngreso)}
                            </div>
                          </div>
                        </div>
                        {v.matricula && (
                          <div className="vis-card-info-row">
                            <div className="vis-card-info-icon green">
                              <i
                                className={
                                  v.nombreVehiculo?.toLowerCase() === "moto"
                                    ? "fa-solid fa-motorcycle"
                                    : "bi bi-car-front"
                                }
                              ></i>
                            </div>
                            <div>
                              <div className="vis-card-info-label">
                                Vehículo
                              </div>
                              <div className="vis-card-info-value">
                                {v.nombreVehiculo} — {v.matricula}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="vis-card-actions">
                        <button
                          className="vis-card-action-btn details"
                          onClick={() => setModalDetalle(v)}
                        >
                          <i className="bi bi-eye me-1"></i> Detalles
                        </button>
                        {(estado === "activa" || estado === "vencida") && (
                          <>
                            <button
                              className="vis-card-action-btn editar"
                              onClick={() => abrirModalEditar(v)}
                            >
                              <i className="bi bi-pencil me-1"></i> Editar
                            </button>
                            <button
                              className="vis-card-action-btn finalizar"
                              onClick={() => handleFinalizar(v.idVisita)}
                            >
                              <i className="bi bi-check-circle me-1"></i>{" "}
                              Finalizar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── PAGINACIÓN ── */}
            {visitasFiltradas.length > 0 && (
              <div className="vis-pagination-wrapper">
                <span className="vis-pagination-info">
                  Mostrando {indiceInicio + 1}–
                  {Math.min(indiceFin, visitasFiltradas.length)} de{" "}
                  {visitasFiltradas.length} visitas
                </span>
                {totalPaginas > 1 && (
                  <nav>
                    <ul className="vis-pagination">
                      <li className={disabledIf(paginaActual === 1)}>
                        <button
                          onClick={() => setPaginaActual(1)}
                          disabled={paginaActual === 1}
                          title="Primera"
                        >
                          <i className="bi bi-chevron-double-left"></i>
                        </button>
                      </li>
                      <li className={disabledIf(paginaActual === 1)}>
                        <button
                          onClick={() =>
                            setPaginaActual((p) => Math.max(1, p - 1))
                          }
                          disabled={paginaActual === 1}
                          title="Anterior"
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {getPaginasVisibles().map((num) => (
                        <li
                          key={num}
                          className={paginaActual === num ? "active" : ""}
                        >
                          <button onClick={() => setPaginaActual(num)}>
                            {num}
                          </button>
                        </li>
                      ))}
                      <li className={disabledIf(paginaActual === totalPaginas)}>
                        <button
                          onClick={() =>
                            setPaginaActual((p) =>
                              Math.min(totalPaginas, p + 1),
                            )
                          }
                          disabled={paginaActual === totalPaginas}
                          title="Siguiente"
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                      <li className={disabledIf(paginaActual === totalPaginas)}>
                        <button
                          onClick={() => setPaginaActual(totalPaginas)}
                          disabled={paginaActual === totalPaginas}
                          title="Última"
                        >
                          <i className="bi bi-chevron-double-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════ MODAL CREAR / EDITAR ══════════ */}
      <ModalOverlay
        isOpen={modalCrear || modalEditar}
        onClose={() => {
          setModalCrear(false);
          setModalEditar(false);
          setVisitaEditando(null);
          resetForm();
        }}
        confirmBeforeClose
        className="vis-modal-overlay"
      >
        <div className="vis-modal">
          <div className="vis-modal-header">
            <div className="vis-modal-header-left">
              <i
                className={`bi ${modalConfig.headerIcon}`}
                style={{ color: "#4CAF50", fontSize: "22px" }}
              ></i>
              <h5>{modalConfig.headerTitle}</h5>
            </div>
            <button
              className="vis-modal-close"
              onClick={() => {
                setModalCrear(false);
                setModalEditar(false);
                setVisitaEditando(null);
                resetForm();
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleGuardar}>
            <div className="vis-modal-body">
              {/* Tipo Documento + Nro Documento */}
              <div className="vis-form-row">
                <div className="vis-form-group">
                  <label
                    htmlFor="vis-tipoDocumentoId"
                    className="vis-form-label"
                  >
                    Tipo Documento <span className="required">*</span>
                  </label>
                  <select
                    id="vis-tipoDocumentoId"
                    className="vis-form-control"
                    value={formData.tipoDocumentoId}
                    onChange={(e) =>
                      handleChange("tipoDocumentoId", e.target.value)
                    }
                    required
                  >
                    <option value="">Selecciona...</option>
                    <option value="1">CC</option>
                    <option value="2">CE</option>
                    <option value="3">PA</option>
                    <option value="4">PP</option>
                    <option value="5">PPT</option>
                  </select>
                </div>
                <div className="vis-form-group">
                  <label
                    htmlFor="vis-numeroDocumento"
                    className="vis-form-label"
                  >
                    N° Documento <span className="required">*</span>
                  </label>
                  <input
                    id="vis-numeroDocumento"
                    type="text"
                    className="vis-form-control"
                    value={formData.numeroDocumento}
                    onChange={(e) =>
                      handleChange(
                        "numeroDocumento",
                        filtrarInputDocumento(
                          e.target.value,
                          formData.tipoDocumentoId === "3",
                        ),
                      )
                    }
                    placeholder="Ej: 12345678"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {/* Nombre */}
              <div className="vis-form-group">
                <label htmlFor="vis-nombreVisitante" className="vis-form-label">
                  Nombre Visitante <span className="required">*</span>
                </label>
                <input
                  id="vis-nombreVisitante"
                  type="text"
                  className="vis-form-control"
                  value={formData.nombreVisitante}
                  onChange={(e) =>
                    handleChange(
                      "nombreVisitante",
                      filtrarInputNombre(e.target.value),
                    )
                  }
                  placeholder="Ej: Juan Carlos Rodriguez Gonzalez"
                  minLength={10}
                  required
                />
                {formData.nombreVisitante &&
                  formData.nombreVisitante.length < 10 && (
                    <small style={{ color: "#f97316", fontSize: "12px" }}>
                      Faltan {10 - formData.nombreVisitante.length} caracteres
                    </small>
                  )}
              </div>

              {/* Teléfono del visitante */}
              <div className="vis-form-group">
                <label htmlFor="vis-telefono" className="vis-form-label">
                  Teléfono del Visitante <span className="required">*</span>
                </label>
                <input
                  id="vis-telefono"
                  type="tel"
                  className="vis-form-control"
                  value={formData.telefono}
                  onChange={(e) =>
                    handleChange(
                      "telefono",
                      e.target.value.replace(/[^0-9+\- ]/g, "").slice(0, 15),
                    )
                  }
                  placeholder="Ej: 3101234567"
                  minLength={7}
                  maxLength={15}
                  required
                />
                {formData.telefono &&
                  formData.telefono.replace(/\D/g, "").length < 7 && (
                    <small style={{ color: "#f97316", fontSize: "12px" }}>
                      Faltan {7 - formData.telefono.replace(/\D/g, "").length}{" "}
                      dígitos
                    </small>
                  )}
              </div>

              {/* Torre + Apartamento */}
              <div className="vis-form-row">
                <div className="vis-form-group">
                  <label htmlFor="vis-torreId" className="vis-form-label">
                    Torre <span className="required">*</span>
                  </label>
                  <select
                    id="vis-torreId"
                    className="vis-form-control"
                    value={formData.torreId}
                    onChange={(e) => handleChange("torreId", e.target.value)}
                    required
                  >
                    <option value="">Selecciona torre</option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option
                        key={`torre-${String.fromCodePoint(65 + i)}`}
                        value={i + 1}
                      >
                        Torre {String.fromCodePoint(65 + i)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="vis-form-group">
                  <label htmlFor="vis-apartamentoId" className="vis-form-label">
                    Apartamento <span className="required">*</span>
                  </label>
                  <select
                    id="vis-apartamentoId"
                    className="vis-form-control"
                    value={formData.apartamentoId}
                    onChange={(e) =>
                      handleChange("apartamentoId", e.target.value)
                    }
                    required
                    disabled={!formData.torreId}
                  >
                    <option value="">Selecciona apartamento</option>
                    {apartamentos
                      .filter(
                        (a) =>
                          a.torreId === Number.parseInt(formData.torreId, 10),
                      )
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.numero}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Fecha hora ingreso */}
              <div className="vis-form-group">
                <label
                  htmlFor="vis-fechaHoraIngreso"
                  className="vis-form-label"
                >
                  Fecha y Hora de Ingreso <span className="required">*</span>
                </label>
                <input
                  id="vis-fechaHoraIngreso"
                  type="datetime-local"
                  className="vis-form-control"
                  value={formData.fechaHoraIngreso}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                  required
                />
              </div>

              {/* ¿Viene en vehículo? */}
              <div className="vis-form-group">
                <label htmlFor="vis-vieneEnVehiculo" className="vis-form-label">
                  ¿Viene en vehículo? <span className="required">*</span>
                </label>
                <select
                  id="vis-vieneEnVehiculo"
                  className="vis-form-control"
                  value={formData.vieneEnVehiculo}
                  onChange={(e) =>
                    handleChange("vieneEnVehiculo", e.target.value)
                  }
                >
                  <option value="NO">NO</option>
                  <option value="SI">SI</option>
                </select>
              </div>

              {/* Sección vehículo condicional */}
              {formData.vieneEnVehiculo === "SI" && (
                <div className="vis-vehicle-section">
                  <div className="vis-vehicle-title">
                    <i
                      className={
                        String(formData.tipoVehiculoId) === "2"
                          ? "fa-solid fa-motorcycle"
                          : "bi bi-car-front"
                      }
                    ></i>{" "}
                    Datos del Vehículo
                  </div>

                  <div className="vis-form-group">
                    <label htmlFor="vis-matricula" className="vis-form-label">
                      Matrícula <span className="required">*</span>
                    </label>
                    <input
                      id="vis-matricula"
                      type="text"
                      className="vis-form-control"
                      value={formData.matricula}
                      onChange={(e) =>
                        handleChange("matricula", e.target.value.toUpperCase())
                      }
                      placeholder="Ej: ABC123"
                      required
                    />
                  </div>

                  <div className="vis-form-group">
                    <label
                      htmlFor="vis-tipoVehiculoId"
                      className="vis-form-label"
                    >
                      Tipo de Vehículo <span className="required">*</span>
                    </label>
                    <select
                      id="vis-tipoVehiculoId"
                      className="vis-form-control"
                      value={formData.tipoVehiculoId}
                      onChange={(e) =>
                        handleChange("tipoVehiculoId", e.target.value)
                      }
                      required
                    >
                      <option value="">Selecciona tipo</option>
                      <option value="1">Carro</option>
                      <option value="2">Moto</option>
                    </select>
                  </div>

                  {/* Parqueadero */}
                  {formData.tipoVehiculoId && (
                    <div className="vis-form-group">
                      <label
                        htmlFor="vis-parqueadero"
                        className="vis-form-label"
                      >
                        Parqueadero <span className="required">*</span>
                      </label>
                      {(() => {
                        if (formData.codigoParqueadero) {
                          return (
                            <div className="vis-parking-selected">
                              <div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Parqueadero seleccionado
                                </div>
                                <div className="vis-parking-code">
                                  {formData.codigoParqueadero}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="vis-parking-change"
                                onClick={irASeleccionarParqueadero}
                              >
                                Cambiar
                              </button>
                            </div>
                          );
                        }
                        if (parqueaderosDisponibles.length > 0) {
                          return (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <select
                                className="vis-form-control"
                                value={formData.codigoParqueadero}
                                onChange={(e) => {
                                  const sel = e.target.value;
                                  const found = parqueaderosDisponibles.find(
                                    (p) => p.codigoParqueadero === sel,
                                  );
                                  if (found?.disabled) {
                                    Swal.fire(
                                      "Tipo inválido",
                                      "Este espacio no coincide con el tipo de vehículo.",
                                      "error",
                                    );
                                    return;
                                  }
                                  handleChange("codigoParqueadero", sel);
                                }}
                                required
                                style={{ flex: 1 }}
                              >
                                <option value="">
                                  Selecciona un parqueadero
                                </option>
                                {parqueaderosDisponibles.map((p) => (
                                  <option
                                    key={p.codigoParqueadero}
                                    value={p.codigoParqueadero}
                                    disabled={p.disabled}
                                  >
                                    {p.codigoParqueadero}
                                    {p.disabled ? " (no compatible)" : ""}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="vis-parking-change"
                                onClick={irASeleccionarParqueadero}
                                style={{ whiteSpace: "nowrap" }}
                              >
                                Ver mapa
                              </button>
                            </div>
                          );
                        }
                        const tipoLabel =
                          formData.tipoVehiculoId === "1" ? "carros" : "motos";
                        return (
                          <div
                            style={{
                              background: "#fff7ed",
                              border: "1px solid #fed7aa",
                              borderRadius: "10px",
                              padding: "12px",
                              fontSize: "13px",
                              color: "#c2410c",
                            }}
                          >
                            <strong>No hay parqueaderos disponibles</strong>
                            <br />
                            Para {tipoLabel}.
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Observaciones */}
              <div className="vis-form-group">
                <label htmlFor="vis-observaciones" className="vis-form-label">
                  Observaciones
                </label>
                <textarea
                  id="vis-observaciones"
                  className="vis-form-control vis-form-textarea"
                  value={formData.observaciones}
                  onChange={(e) =>
                    handleChange("observaciones", e.target.value)
                  }
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>

            <div className="vis-modal-footer">
              <button
                type="submit"
                className={`vis-btn-submit ${modalConfig.submitColor}`}
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <output className="spinner-border spinner-border-sm"></output>{" "}
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className={`bi ${modalConfig.submitIcon}`}></i>
                    {modalConfig.submitText}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </ModalOverlay>

      {/* ══════════ MODAL DETALLE ══════════ */}
      {modalDetalle && (
        <ModalOverlay
          isOpen
          onClose={() => setModalDetalle(null)}
          className="vis-modal-overlay"
        >
          <div className="vis-modal">
            <div className="vis-modal-header">
              <div className="vis-modal-header-left">
                <i
                  className="bi bi-info-circle"
                  style={{ color: "#4CAF50", fontSize: "22px" }}
                ></i>
                <h5>Detalle de la Visita</h5>
              </div>
              <button
                className="vis-modal-close"
                onClick={() => setModalDetalle(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="vis-modal-body">
              <div className="vis-detalle-row">
                <div className="vis-detalle-icon">
                  <i className="bi bi-person"></i>
                </div>
                <div className="vis-detalle-content">
                  <div className="vis-detalle-label">Visitante</div>
                  <div className="vis-detalle-value">
                    {modalDetalle.nombreVisitante}
                  </div>
                </div>
              </div>

              <div className="vis-detalle-row">
                <div className="vis-detalle-icon">
                  <i className="bi bi-person-vcard"></i>
                </div>
                <div className="vis-detalle-content">
                  <div className="vis-detalle-label">Documento</div>
                  <div className="vis-detalle-value">
                    {modalDetalle.numeroDocumento}
                  </div>
                </div>
              </div>

              {modalDetalle.telefono && (
                <div className="vis-detalle-row">
                  <div className="vis-detalle-icon">
                    <i className="bi bi-telephone"></i>
                  </div>
                  <div className="vis-detalle-content">
                    <div className="vis-detalle-label">Teléfono</div>
                    <div className="vis-detalle-value">
                      <a href={`tel:${modalDetalle.telefono}`}>
                        {modalDetalle.telefono}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="vis-detalle-row">
                <div className="vis-detalle-icon">
                  <i className="bi bi-building"></i>
                </div>
                <div className="vis-detalle-content">
                  <div className="vis-detalle-label">Destino</div>
                  <div className="vis-detalle-value">
                    Apto {modalDetalle.numeroApartamento} —{" "}
                    {modalDetalle.nombreTorre}
                  </div>
                </div>
              </div>

              <div className="vis-detalle-row">
                <div className="vis-detalle-icon">
                  <i className="bi bi-flag"></i>
                </div>
                <div className="vis-detalle-content">
                  <div className="vis-detalle-label">Estado</div>
                  <div className="vis-detalle-value">
                    <span
                      className={`vis-badge ${obtenerEstadoReal(modalDetalle.estadoVisita) === "activa" ? "vis-badge-activa" : "vis-badge-finalizada"}`}
                    >
                      {obtenerEstadoReal(modalDetalle.estadoVisita) === "activa"
                        ? "Activa"
                        : "Finalizada"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="vis-detalle-row">
                <div className="vis-detalle-icon">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className="vis-detalle-content">
                  <div className="vis-detalle-label">Fecha Ingreso</div>
                  <div className="vis-detalle-value">
                    {formatearFecha(modalDetalle.fechaHoraIngreso)}
                  </div>
                </div>
              </div>

              {modalDetalle.fechaHoraSalida &&
                obtenerEstadoReal(modalDetalle.estadoVisita) ===
                  "finalizada" && (
                  <div className="vis-detalle-row">
                    <div className="vis-detalle-icon">
                      <i className="bi bi-calendar-x"></i>
                    </div>
                    <div className="vis-detalle-content">
                      <div className="vis-detalle-label">Fecha Salida</div>
                      <div className="vis-detalle-value">
                        {formatearFecha(modalDetalle.fechaHoraSalida)}
                      </div>
                    </div>
                  </div>
                )}

              {modalDetalle.matricula && (
                <>
                  <div className="vis-detalle-row">
                    <div className="vis-detalle-icon">
                      <i
                        className={
                          modalDetalle.nombreVehiculo?.toLowerCase() === "moto"
                            ? "fa-solid fa-motorcycle"
                            : "bi bi-car-front"
                        }
                      ></i>
                    </div>
                    <div className="vis-detalle-content">
                      <div className="vis-detalle-label">Vehículo</div>
                      <div className="vis-detalle-value">
                        {modalDetalle.nombreVehiculo || "Vehículo"} —{" "}
                        {modalDetalle.matricula}
                      </div>
                    </div>
                  </div>
                  {modalDetalle.codigoParqueadero && (
                    <div className="vis-detalle-row">
                      <div className="vis-detalle-icon">
                        <i className="bi bi-p-circle"></i>
                      </div>
                      <div className="vis-detalle-content">
                        <div className="vis-detalle-label">Parqueadero</div>
                        <div className="vis-detalle-value">
                          {modalDetalle.codigoParqueadero}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {modalDetalle.observaciones &&
                modalDetalle.observaciones !== "-" && (
                  <div className="vis-detalle-row">
                    <div className="vis-detalle-icon">
                      <i className="bi bi-chat-text"></i>
                    </div>
                    <div className="vis-detalle-content">
                      <div className="vis-detalle-label">Observaciones</div>
                      <div className="vis-detalle-value">
                        {modalDetalle.observaciones}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="vis-modal-footer vis-modal-footer-acciones">
              {modalDetalle.matricula && (
                <button
                  className="vis-btn-imprimir vis-btn-ingreso"
                  onClick={() => imprimirReciboVisita(modalDetalle, "INGRESO")}
                >
                  <i className="bi bi-printer"></i> Imprimir Recibo
                </button>
              )}
              <button
                className="vis-btn-cerrar"
                onClick={() => setModalDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

export default Visitas;
