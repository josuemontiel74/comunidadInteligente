import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../Styles/estiloPaqueteria.css";
import {
  validarNombreCompleto,
  validarTransportadora,
  TRANSPORTADORAS_CO,
} from "../utils/validaciones.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  obtenerPaquetes,
  registrarPaquete,
  actualizarPaquete,
  eliminarPaquete,
} from "../services/paqueteria.services.jsx";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";

// ── Torres y apartamentos (idéntico a Flutter) ──
const TORRES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const getApartamentosPorTorre = (torre) => {
  if (!torre) return [];
  const idx = torre.charCodeAt(0) - 65;
  if (torre === "J") return [1001, 1002, 1003, 1004, 1005];
  const base = (idx + 1) * 100;
  return [base + 1, base + 2, base + 3, base + 4, base + 5];
};

const obtenerApartamentoId = (torre, apartamento) => {
  const letraIndex = torre.charCodeAt(0) - 65;
  const num = parseInt(apartamento);
  let pos;
  if (num >= 1001 && num <= 1005) pos = num - 1000;
  else {
    pos = num % 100;
    if (pos === 0) pos = 5;
  }
  return letraIndex * 5 + pos;
};

const convertirTorreIdALetra = (id) => {
  const n = parseInt(id);
  if (isNaN(n) || n < 1 || n > 10) return "";
  return String.fromCharCode(64 + n);
};

// ── Formatear fechas a Colombia UTC-5 ──
const formatearFecha = (fechaStr) => {
  if (!fechaStr) return "N/A";
  try {
    const fecha = new Date(fechaStr);
    const colombiaOffset = -5 * 60;
    const utcMs = fecha.getTime() + fecha.getTimezoneOffset() * 60000;
    const col = new Date(utcMs + colombiaOffset * 60000);
    const yyyy = col.getFullYear();
    const mm = String(col.getMonth() + 1).padStart(2, "0");
    const dd = String(col.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return fechaStr;
  }
};

const formatearHora = (fechaStr) => {
  if (!fechaStr) return "";
  try {
    const fecha = new Date(fechaStr);
    const colombiaOffset = -5 * 60;
    const utcMs = fecha.getTime() + fecha.getTimezoneOffset() * 60000;
    const col = new Date(utcMs + colombiaOffset * 60000);
    const hh = String(col.getHours()).padStart(2, "0");
    const min = String(col.getMinutes()).padStart(2, "0");
    return `${hh}:${min}`;
  } catch {
    return "";
  }
};

const normalizarFechaHora = (fechaHoraString) => {
  try {
    const fecha = new Date(fechaHoraString);
    if (isNaN(fecha.getTime())) return fechaHoraString.replace("T", " ");
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const hh = String(fecha.getHours()).padStart(2, "0");
    const min = String(fecha.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch {
    return fechaHoraString.replace("T", " ");
  }
};

function Paqueteria() {
  const navigator = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [paquetes, setPaquetes] = useState([]);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Filtros (como Flutter)
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTorre, setFiltroTorre] = useState("");
  const [filtroApartamento, setFiltroApartamento] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [paqueteEditar, setPaqueteEditar] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Formulario crear
  const formCrearVacio = {
    residente: "",
    torre: "",
    apartamento: "",
    transportadora: "",
    fechaHoraRecepcion: "",
    observaciones: "",
  };
  const [formCrear, setFormCrear] = useState(formCrearVacio);

  // Formulario editar
  const [formEditar, setFormEditar] = useState(formCrearVacio);

  // Token helpers
  const verificarTokenVencido = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };

  const obtenerRolFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.rolesId;
    } catch {
      return null;
    }
  };

  const tokenLocal = localStorage.getItem("token");
  const rolesId = tokenLocal ? obtenerRolFromToken(tokenLocal) : null;

  // ── Verificar sesión ──
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
        navigator("/");
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
        navigator("/");
      }
    }
  }, [navigator]);

  // Abrir modal de registro si se viene desde otro módulo
  useEffect(() => {
    if (location.state?.abrirModal) {
      setModalCrear(true);
    }
  }, [location.state]);

  // ── Cargar paquetes ──
  const cargarPaquetes = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await obtenerPaquetes(token);
      if (response.status === 401 || response.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          text: "Tu sesión ha expirado.",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigator("/");
        });
        return;
      }
      const data = await response.json();
      const lista = Array.isArray(data)
        ? data
        : data.paquetes || data.data || [];
      setPaquetes(lista);
    } catch (err) {
      setError("Error al cargar los datos de paquetería.");
    } finally {
      setLoading(false);
    }
  }, [navigator]);

  useEffect(() => {
    cargarPaquetes();
  }, [cargarPaquetes]);

  // Auto-refresco cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      cargarPaquetes();
    }, 30000);
    return () => clearInterval(interval);
  }, [cargarPaquetes]);

  // ── Filtrado + ordenamiento (igual que Flutter) ──
  const paquetesFiltrados = paquetes
    .filter((p) => {
      const nombre = (p.nombreDestinatario || "").toLowerCase();
      const cumpleBusqueda =
        !busquedaNombre || nombre.includes(busquedaNombre.toLowerCase());

      const estado = (p.nombreEstado || "").toLowerCase();
      const cumpleEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "recibido" && estado === "recibido") ||
        (filtroEstado === "entregado" && estado === "entregado");

      // nombreTorre viene como "Torre A", "Torre B", etc. — extraer la letra
      const torreLetra = (p.nombreTorre || "").replace(/^Torre\s*/i, "").trim();
      const cumpleTorre = !filtroTorre || torreLetra === filtroTorre;

      const numApto = String(p.numeroApartamento || "");
      const cumpleApto = !filtroApartamento || numApto === filtroApartamento;

      return cumpleBusqueda && cumpleEstado && cumpleTorre && cumpleApto;
    })
    .sort((a, b) => {
      // Primero recibidos, luego entregados; dentro de cada grupo, fecha desc
      const estadoA =
        (a.nombreEstado || "").toLowerCase() === "recibido" ? 0 : 1;
      const estadoB =
        (b.nombreEstado || "").toLowerCase() === "recibido" ? 0 : 1;
      if (estadoA !== estadoB) return estadoA - estadoB;
      return new Date(b.fechaRecepcion || 0) - new Date(a.fechaRecepcion || 0);
    });

  // ── Paginación ──
  const totalPaginas = Math.ceil(paquetesFiltrados.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const paquetesPaginados = paquetesFiltrados.slice(indiceInicio, indiceFin);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaNombre, filtroEstado, filtroTorre, filtroApartamento]);

  const getPaginasVisibles = () => {
    const paginas = [];
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    if (fin - inicio < 4) inicio = Math.max(1, fin - 4);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  };

  // Stats: Hoy = recibidos hoy | Pendientes = TODOS aún no entregados | Entregados hoy
  const hoyStr = new Date().toISOString().slice(0, 10);
  const paquetesHoy = paquetes.filter((p) => {
    try {
      return (p.fechaRecepcion || "").slice(0, 10) === hoyStr;
    } catch {
      return false;
    }
  });
  const totalHoyCount = paquetesHoy.length;
  const pendientesCount = paquetes.filter(
    (p) => (p.nombreEstado || "").toLowerCase() === "recibido",
  ).length;
  const entregadosHoyCount = paquetesHoy.filter(
    (p) => (p.nombreEstado || "").toLowerCase() === "entregado",
  ).length;

  // ── CRUD: Crear ──
  const handleSubmitCrear = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const errNombre = validarNombreCompleto(formCrear.residente);
    if (errNombre) {
      Swal.fire("Nombre inválido", errNombre, "error");
      return;
    }
    const errTransp = validarTransportadora(formCrear.transportadora);
    if (errTransp) {
      Swal.fire("Transportadora inválida", errTransp, "error");
      return;
    }

    setEnviando(true);
    try {
      const body = {
        apartamentoId: obtenerApartamentoId(
          formCrear.torre,
          formCrear.apartamento,
        ),
        nombreDestinatario: formCrear.residente,
        empresaMensajeria: formCrear.transportadora,
        fechaRecepcion: normalizarFechaHora(formCrear.fechaHoraRecepcion),
        observaciones: formCrear.observaciones || undefined,
      };

      const response = await registrarPaquete(body, token);

      if (response.status === 401 || response.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          timer: 2000,
          showConfirmButton: false,
        });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigator("/");
        return;
      }

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Registrado correctamente",
          timer: 2500,
          showConfirmButton: false,
        });
        setModalCrear(false);
        setFormCrear(formCrearVacio);
        await cargarPaquetes();
      } else {
        const errText = await response.text();
        Swal.fire(
          "Error al registrar",
          `${response.status}: ${errText}`,
          "error",
        );
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "Comuníquese con el área de sistemas.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setEnviando(false);
    }
  };

  // ── CRUD: Editar ──
  const abrirEditar = (paq) => {
    const torreLetra = (paq.nombreTorre || "").replace(/^Torre\s*/i, "").trim();
    const fechaRaw = paq.fechaRecepcion || "";
    let dtLocal = "";
    try {
      const d = new Date(fechaRaw);
      const colombiaOffset = -5 * 60;
      const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
      const col = new Date(utcMs + colombiaOffset * 60000);
      const yyyy = col.getFullYear();
      const mm = String(col.getMonth() + 1).padStart(2, "0");
      const dd = String(col.getDate()).padStart(2, "0");
      const hh = String(col.getHours()).padStart(2, "0");
      const min = String(col.getMinutes()).padStart(2, "0");
      dtLocal = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } catch {
      dtLocal = "";
    }

    setFormEditar({
      residente: paq.nombreDestinatario || "",
      torre: torreLetra,
      apartamento: String(paq.numeroApartamento || ""),
      transportadora: paq.empresaMensajeria || "",
      fechaHoraRecepcion: dtLocal,
      observaciones: paq.observaciones || "",
    });
    setPaqueteEditar(paq);
    setModalEditar(true);
  };

  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !paqueteEditar) return;

    const errNombreE = validarNombreCompleto(formEditar.residente);
    if (errNombreE) {
      Swal.fire("Nombre inválido", errNombreE, "error");
      return;
    }
    const errTranspE = validarTransportadora(formEditar.transportadora);
    if (errTranspE) {
      Swal.fire("Transportadora inválida", errTranspE, "error");
      return;
    }

    setEnviando(true);
    try {
      const body = {
        apartamentoId: obtenerApartamentoId(
          formEditar.torre,
          formEditar.apartamento,
        ),
        nombreDestinatario: formEditar.residente,
        empresaMensajeria: formEditar.transportadora,
        fechaRecepcion: normalizarFechaHora(formEditar.fechaHoraRecepcion),
        observaciones: formEditar.observaciones || undefined,
      };

      const response = await actualizarPaquete(
        paqueteEditar.idPaquete,
        body,
        token,
      );

      if (response.status === 401 || response.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          timer: 2000,
          showConfirmButton: false,
        });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigator("/");
        return;
      }

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Actualizado correctamente",
          timer: 2500,
          showConfirmButton: false,
        });
        setModalEditar(false);
        setPaqueteEditar(null);
        setFormEditar(formCrearVacio);
        await cargarPaquetes();
      } else {
        const errText = await response.text();
        Swal.fire(
          "Error al actualizar",
          `${response.status}: ${errText}`,
          "error",
        );
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "Comuníquese con el área de sistemas.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setEnviando(false);
    }
  };

  // ── CRUD: Entregar (DELETE) ──
  const marcarEntregado = (paq) => {
    Swal.fire({
      title: "¿Marcar como entregado?",
      html: `<p><strong>${paq.nombreDestinatario}</strong><br/>Apto: ${paq.nombreTorre || "N/A"} - ${paq.numeroApartamento}</p><p class="text-muted" style="font-size:13px">Esta acción no se puede deshacer</p>`,
      icon: "question",
      iconColor: "#3b82f6",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, entregar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
          const response = await eliminarPaquete(paq.idPaquete, token);
          if (response.ok || response.status === 204) {
            Swal.fire({
              icon: "success",
              title: "Entregado correctamente",
              timer: 2500,
              showConfirmButton: false,
            });
            await cargarPaquetes();
          } else if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigator("/");
          } else {
            Swal.fire("Error al entregar", "", "error");
          }
        } catch (err) {
          Swal.fire("Error de conexión", "", "error");
        }
      }
    });
  };

  // ── Dashboard según rol ──
  const getDashboardRoute = () => {
    if (rolesId === 1) return "/Superadmin";
    if (rolesId === 2) return "/admin";
    return "/Vigilante";
  };

  const getMenuTitle = () => {
    if (rolesId === 1) return "Menú Super Admin";
    if (rolesId === 2) return "Menú Admin";
    return "Menú Vigilante";
  };

  const cerrarSesion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) await logoutUsuario(token);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigator("/");
  };

  // ── Loading ──
  if (loading && paquetes.length === 0) {
    return (
      <div className="paq-loading-screen">
        <div
          className="spinner-border"
          role="status"
          style={{ color: "#3b82f6" }}
        >
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3b82f6" }}>
          Cargando paquetes...
        </p>
      </div>
    );
  }

  return (
    <div className="paq-dashboard">
      {/* ====== OVERLAY & DRAWER ====== */}
      <div
        className={`paq-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar menú"
      />
      <aside className={`paq-drawer ${menuOpen ? "open" : ""}`}>
        <div className="paq-drawer-header">
          <div className="paq-drawer-avatar">
            <i className="bi bi-box-seam-fill"></i>
          </div>
          <h4 className="paq-drawer-title">{getMenuTitle()}</h4>
          <span className="paq-drawer-user">
            {usuario?.username || usuario?.nombre || "Usuario"}
          </span>
        </div>

        <div className="paq-drawer-body">
          <div className="paq-menu-section">
            <h6 className="paq-menu-section-title">Navegación</h6>
            <Link
              className="paq-menu-item"
              to={getDashboardRoute()}
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right paq-menu-arrow"></i>
            </Link>
            <Link
              className="paq-menu-item active"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right paq-menu-arrow"></i>
            </Link>
          </div>

          <div className="paq-menu-section">
            <h6 className="paq-menu-section-title">Módulos</h6>
            <Link
              className="paq-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right paq-menu-arrow"></i>
            </Link>
            <Link
              className="paq-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right paq-menu-arrow"></i>
            </Link>
            {(rolesId === 1 || rolesId === 2) && (
              <>
                <Link
                  className="paq-menu-item"
                  to="/AreasComunes"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-calendar-event"></i>
                  <span>Áreas Comunes</span>
                  <i className="bi bi-chevron-right paq-menu-arrow"></i>
                </Link>
                <Link
                  className="paq-menu-item"
                  to="/Residentes"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-house-door"></i>
                  <span>Residentes</span>
                  <i className="bi bi-chevron-right paq-menu-arrow"></i>
                </Link>
                <Link
                  className="paq-menu-item"
                  to="/Reportes"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-graph-up-arrow"></i>
                  <span>Reportes</span>
                  <i className="bi bi-chevron-right paq-menu-arrow"></i>
                </Link>
              </>
            )}
            {rolesId === 1 && (
              <>
                <Link
                  className="paq-menu-item"
                  to="/GestionUsuario"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Gestión Usuarios</span>
                  <i className="bi bi-chevron-right paq-menu-arrow"></i>
                </Link>
                <Link
                  className="paq-menu-item"
                  to="/Auditorias"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-journal-text"></i>
                  <span>Auditorías</span>
                  <i className="bi bi-chevron-right paq-menu-arrow"></i>
                </Link>
                <Link
                  className="paq-menu-item"
                  to="/LogErrores"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-bug"></i>
                  <span>Log de Errores</span>
                  <i className="bi bi-chevron-right paq-menu-arrow"></i>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="paq-drawer-footer">
          <button className="paq-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="paq-main">
        {/* Header tipo AppBar (como Flutter) */}
        <header className="paq-header">
          <button
            className="paq-header-btn"
            onClick={() => navigator(-1)}
            title="Volver"
          >
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="paq-header-center">
            <h5 className="paq-header-title">Gestión de Paquetería</h5>
          </div>

          <div className="paq-header-actions">
            <button
              className="paq-header-btn"
              onClick={cargarPaquetes}
              disabled={loading}
              title="Actualizar"
            >
              <i
                className={`bi ${loading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            <button
              className="paq-header-btn paq-hamburger"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        {/* Error state */}
        {error && (
          <div className="paq-error-container">
            <i className="bi bi-exclamation-triangle-fill paq-error-icon"></i>
            <h5>Error al cargar los datos</h5>
            <p>
              El servidor está teniendo problemas.
              <br />
              Por favor, contacta al administrador.
            </p>
            <button className="btn paq-btn-retry" onClick={cargarPaquetes}>
              <i className="bi bi-arrow-clockwise me-2"></i>Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && paquetes.length === 0 && (
          <div className="paq-empty-container">
            <i className="bi bi-box-seam paq-empty-icon"></i>
            <h5>No hay paquetes registrados</h5>
            <button
              className="btn paq-btn-retry mt-3"
              onClick={() => setModalCrear(true)}
            >
              <i className="bi bi-plus-lg me-2"></i>Registrar primer paquete
            </button>
          </div>
        )}

        {/* Content */}
        {!error && paquetes.length > 0 && (
          <>
            {/* ── Stats ── */}
            <div className="paq-stats-container">
              <div className="paq-stat-box">
                <div className="paq-stat-label" style={{ color: "#2563eb" }}>
                  Hoy
                </div>
                <div className="paq-stat-value" style={{ color: "#2563eb" }}>
                  {totalHoyCount}
                </div>
              </div>
              <div className="paq-stat-box">
                <div className="paq-stat-label" style={{ color: "#d97706" }}>
                  Pendientes
                </div>
                <div className="paq-stat-value" style={{ color: "#d97706" }}>
                  {pendientesCount}
                </div>
              </div>
              <div className="paq-stat-box">
                <div className="paq-stat-label" style={{ color: "#059669" }}>
                  Entregados hoy
                </div>
                <div className="paq-stat-value" style={{ color: "#059669" }}>
                  {entregadosHoyCount}
                </div>
              </div>
            </div>

            {/* ── Toolbar: Registrar + Filtros (como Flutter) ── */}
            <div className="paq-toolbar">
              <div className="paq-toolbar-top">
                <button
                  className="paq-btn-registrar"
                  onClick={() => setModalCrear(true)}
                >
                  <i className="bi bi-plus-lg"></i> Registrar Paquete
                </button>
                <div className="paq-filter-search">
                  <i className="bi bi-search paq-filter-search-icon"></i>
                  <input
                    type="text"
                    className="form-control paq-filter-input"
                    placeholder="Buscar por nombre del destinatario"
                    value={busquedaNombre}
                    onChange={(e) => setBusquedaNombre(e.target.value)}
                  />
                </div>
              </div>

              <div className="paq-filter-row">
                <div className="paq-filter-select-wrap">
                  <i className="bi bi-building paq-filter-select-icon"></i>
                  <select
                    className="form-select paq-filter-select"
                    value={filtroTorre}
                    onChange={(e) => {
                      setFiltroTorre(e.target.value);
                      setFiltroApartamento("");
                    }}
                  >
                    <option value="">Todas las Torres</option>
                    {TORRES.map((t) => (
                      <option key={t} value={t}>
                        Torre {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="paq-filter-select-wrap">
                  <i className="bi bi-door-open paq-filter-select-icon"></i>
                  <select
                    className="form-select paq-filter-select"
                    value={filtroApartamento}
                    onChange={(e) => setFiltroApartamento(e.target.value)}
                    disabled={!filtroTorre}
                  >
                    <option value="">Todos los Apartamentos</option>
                    {filtroTorre &&
                      getApartamentosPorTorre(filtroTorre).map((num) => (
                        <option key={num} value={num}>
                          {filtroTorre} - {num}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Filter Chips de estado (como Flutter) */}
              <div className="paq-filter-chips">
                {[
                  { value: "todos", label: "Todos" },
                  { value: "recibido", label: "Recibidos" },
                  { value: "entregado", label: "Entregados" },
                ].map((chip) => (
                  <button
                    key={chip.value}
                    className={`paq-chip ${filtroEstado === chip.value ? "active" : ""}`}
                    onClick={() => setFiltroEstado(chip.value)}
                  >
                    {chip.label}
                  </button>
                ))}

                {/* Botón limpiar filtros — solo visible si hay algún filtro activo */}
                {(busquedaNombre ||
                  filtroTorre ||
                  filtroApartamento ||
                  filtroEstado !== "todos") && (
                  <button
                    className="paq-chip paq-chip-clear"
                    onClick={() => {
                      setBusquedaNombre("");
                      setFiltroTorre("");
                      setFiltroApartamento("");
                      setFiltroEstado("todos");
                    }}
                    title="Eliminar todos los filtros"
                  >
                    <i className="bi bi-x-circle me-1"></i> Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Sin resultados con filtros */}
            {paquetesFiltrados.length === 0 && (
              <div className="paq-empty-container">
                <i className="bi bi-search paq-empty-icon"></i>
                <h5>No se encontraron paquetes</h5>
                <p className="text-muted">
                  Intenta cambiar los filtros de búsqueda
                </p>
              </div>
            )}

            {/* ── Tabla (escritorio >=801px) ── */}
            {paquetesFiltrados.length > 0 && (
              <div className="paq-table-container">
                <table className="paq-table">
                  <thead>
                    <tr>
                      <th>Residente</th>
                      <th>Torre</th>
                      <th>Apartamento</th>
                      <th>Transportadora</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paquetesPaginados.map((p, idx) => {
                      const esRecibido =
                        (p.nombreEstado || "").toLowerCase() === "recibido";
                      return (
                        <tr key={p.idPaquete || idx} className="paq-table-row">
                          <td>{p.nombreDestinatario || "N/A"}</td>
                          <td>{p.nombreTorre || "N/A"}</td>
                          <td>{p.numeroApartamento || "N/A"}</td>
                          <td>{p.empresaMensajeria || "N/A"}</td>
                          <td>{formatearFecha(p.fechaRecepcion)}</td>
                          <td>
                            <span
                              className={`paq-badge ${esRecibido ? "paq-badge-recibido" : "paq-badge-entregado"}`}
                            >
                              {esRecibido ? "Recibido" : "Entregado"}
                            </span>
                          </td>
                          <td>
                            <div className="paq-action-btns">
                              <button
                                className="paq-action-btn info"
                                title="Ver detalles"
                                onClick={() => setModalDetalle(p)}
                              >
                                <i className="bi bi-info-circle"></i>
                              </button>
                              {esRecibido && (
                                <>
                                  <button
                                    className="paq-action-btn edit"
                                    title="Editar"
                                    onClick={() => abrirEditar(p)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="paq-action-btn deliver"
                                    title="Marcar entregado"
                                    onClick={() => marcarEntregado(p)}
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

            {/* ── Cards (móvil <800px) ── */}
            {paquetesFiltrados.length > 0 && (
              <div className="paq-cards-container">
                {paquetesPaginados.map((p, idx) => {
                  const esRecibido =
                    (p.nombreEstado || "").toLowerCase() === "recibido";
                  return (
                    <div key={p.idPaquete || idx} className="paq-card">
                      <div className="paq-card-header">
                        <span className="paq-card-name">
                          {p.nombreDestinatario || "N/A"}
                        </span>
                        <span
                          className={`paq-badge ${esRecibido ? "paq-badge-recibido" : "paq-badge-entregado"}`}
                        >
                          {esRecibido ? "Recibido" : "Entregado"}
                        </span>
                      </div>
                      <div className="paq-card-body">
                        <div className="paq-card-info-row">
                          <div className="paq-card-info-icon blue">
                            <i className="bi bi-building"></i>
                          </div>
                          <div>
                            <div className="paq-card-info-label">
                              Apartamento
                            </div>
                            <div className="paq-card-info-value">
                              {p.nombreTorre || "N/A"} - {p.numeroApartamento}
                            </div>
                          </div>
                        </div>
                        <div className="paq-card-info-row">
                          <div className="paq-card-info-icon green">
                            <i className="bi bi-truck"></i>
                          </div>
                          <div>
                            <div className="paq-card-info-label">
                              Transportadora
                            </div>
                            <div className="paq-card-info-value">
                              {p.empresaMensajeria || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="paq-card-info-row">
                          <div className="paq-card-info-icon orange">
                            <i className="bi bi-calendar-event"></i>
                          </div>
                          <div>
                            <div className="paq-card-info-label">Fecha</div>
                            <div className="paq-card-info-value">
                              {formatearFecha(p.fechaRecepcion)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="paq-card-actions">
                        <button
                          className="paq-card-action-btn details"
                          onClick={() => setModalDetalle(p)}
                        >
                          Detalles
                        </button>
                        {esRecibido && (
                          <>
                            <button
                              className="paq-card-action-btn editar"
                              onClick={() => abrirEditar(p)}
                            >
                              Editar
                            </button>
                            <button
                              className="paq-card-action-btn entregar"
                              onClick={() => marcarEntregado(p)}
                            >
                              Entregar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Paginación + Contador ── */}
            {paquetesFiltrados.length > 0 && (
              <div className="paq-pagination-wrapper">
                <span className="paq-pagination-info">
                  Mostrando {indiceInicio + 1}–
                  {Math.min(indiceFin, paquetesFiltrados.length)} de{" "}
                  {paquetesFiltrados.length} paquetes
                </span>
                {totalPaginas > 1 && (
                  <nav>
                    <ul className="paq-pagination">
                      <li className={paginaActual === 1 ? "disabled" : ""}>
                        <button
                          onClick={() => setPaginaActual(1)}
                          disabled={paginaActual === 1}
                          title="Primera"
                        >
                          <i className="bi bi-chevron-double-left"></i>
                        </button>
                      </li>
                      <li className={paginaActual === 1 ? "disabled" : ""}>
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
                      <li
                        className={
                          paginaActual === totalPaginas ? "disabled" : ""
                        }
                      >
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
                      <li
                        className={
                          paginaActual === totalPaginas ? "disabled" : ""
                        }
                      >
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

      {/* ====== MODAL CREAR PAQUETE ====== */}
      {modalCrear && (
        <div
          className="paq-modal-overlay"
          onClick={() => setModalCrear(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setModalCrear(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div
            className="paq-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="paq-modal-header">
              <div className="paq-modal-header-left">
                <i
                  className="bi bi-plus-circle"
                  style={{ color: "#3b82f6", fontSize: "22px" }}
                ></i>
                <h5>Registrar Paquete</h5>
              </div>
              <button
                className="paq-modal-close"
                onClick={() => setModalCrear(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="paq-modal-body">
              <form onSubmit={handleSubmitCrear}>
                <div className="paq-form-group">
                  <label className="paq-form-label">
                    Nombre del Residente <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="paq-form-control"
                    value={formCrear.residente}
                    onChange={(e) =>
                      setFormCrear({ ...formCrear, residente: e.target.value })
                    }
                    required
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="paq-form-row">
                  <div className="paq-form-group">
                    <label className="paq-form-label">
                      Torre <span className="required">*</span>
                    </label>
                    <select
                      className="paq-form-control"
                      value={formCrear.torre}
                      onChange={(e) =>
                        setFormCrear({
                          ...formCrear,
                          torre: e.target.value,
                          apartamento: "",
                        })
                      }
                      required
                    >
                      <option value="">Seleccionar torre</option>
                      {TORRES.map((t) => (
                        <option key={t} value={t}>
                          Torre {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="paq-form-group">
                    <label className="paq-form-label">
                      Apartamento <span className="required">*</span>
                    </label>
                    <select
                      className="paq-form-control"
                      value={formCrear.apartamento}
                      onChange={(e) =>
                        setFormCrear({
                          ...formCrear,
                          apartamento: e.target.value,
                        })
                      }
                      required
                      disabled={!formCrear.torre}
                    >
                      <option value="">Seleccionar apto</option>
                      {formCrear.torre &&
                        getApartamentosPorTorre(formCrear.torre).map((num) => (
                          <option key={num} value={num}>
                            {formCrear.torre} - {num}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="paq-form-group">
                  <label className="paq-form-label">
                    Transportadora <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    list="transportadoras-list-crear"
                    className="paq-form-control"
                    value={formCrear.transportadora}
                    onChange={(e) =>
                      setFormCrear({
                        ...formCrear,
                        transportadora: e.target.value,
                      })
                    }
                    required
                    placeholder="Ej: Servientrega, Inter Rapidísimo..."
                  />
                  <datalist id="transportadoras-list-crear">
                    {TRANSPORTADORAS_CO.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="paq-form-group">
                  <label className="paq-form-label">
                    Fecha y Hora de Recepción{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="paq-form-control"
                    value={formCrear.fechaHoraRecepcion}
                    onChange={(e) =>
                      setFormCrear({
                        ...formCrear,
                        fechaHoraRecepcion: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="paq-form-group">
                  <label className="paq-form-label">Observaciones</label>
                  <textarea
                    className="paq-form-control paq-form-textarea"
                    value={formCrear.observaciones}
                    onChange={(e) =>
                      setFormCrear({
                        ...formCrear,
                        observaciones: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Opcional..."
                  />
                </div>

                <div className="paq-modal-footer" style={{ padding: "0" }}>
                  <button
                    type="submit"
                    className="paq-btn-submit blue"
                    disabled={enviando}
                  >
                    {enviando ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span>{" "}
                        Registrando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i> Registrar Paquete
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL EDITAR PAQUETE ====== */}
      {modalEditar && paqueteEditar && (
        <div
          className="paq-modal-overlay"
          onClick={() => {
            setModalEditar(false);
            setPaqueteEditar(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setModalEditar(false);
              setPaqueteEditar(null);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div
            className="paq-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="paq-modal-header">
              <div className="paq-modal-header-left">
                <i
                  className="bi bi-pencil-square"
                  style={{ color: "#f97316", fontSize: "22px" }}
                ></i>
                <h5>Editar Paquete</h5>
              </div>
              <button
                className="paq-modal-close"
                onClick={() => {
                  setModalEditar(false);
                  setPaqueteEditar(null);
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="paq-modal-body">
              <form onSubmit={handleSubmitEditar}>
                <div className="paq-form-group">
                  <label className="paq-form-label">
                    Nombre del Residente <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="paq-form-control"
                    value={formEditar.residente}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        residente: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="paq-form-row">
                  <div className="paq-form-group">
                    <label className="paq-form-label">
                      Torre <span className="required">*</span>
                    </label>
                    <select
                      className="paq-form-control"
                      value={formEditar.torre}
                      onChange={(e) =>
                        setFormEditar({
                          ...formEditar,
                          torre: e.target.value,
                          apartamento: "",
                        })
                      }
                      required
                    >
                      <option value="">Seleccionar torre</option>
                      {TORRES.map((t) => (
                        <option key={t} value={t}>
                          Torre {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="paq-form-group">
                    <label className="paq-form-label">
                      Apartamento <span className="required">*</span>
                    </label>
                    <select
                      className="paq-form-control"
                      value={formEditar.apartamento}
                      onChange={(e) =>
                        setFormEditar({
                          ...formEditar,
                          apartamento: e.target.value,
                        })
                      }
                      required
                      disabled={!formEditar.torre}
                    >
                      <option value="">Seleccionar apto</option>
                      {formEditar.torre &&
                        getApartamentosPorTorre(formEditar.torre).map((num) => (
                          <option key={num} value={num}>
                            {formEditar.torre} - {num}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="paq-form-group">
                  <label className="paq-form-label">
                    Transportadora <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    list="transportadoras-list-editar"
                    className="paq-form-control"
                    value={formEditar.transportadora}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        transportadora: e.target.value,
                      })
                    }
                    required
                  />
                  <datalist id="transportadoras-list-editar">
                    {TRANSPORTADORAS_CO.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="paq-form-group">
                  <label className="paq-form-label">
                    Fecha y Hora de Recepción{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="paq-form-control"
                    value={formEditar.fechaHoraRecepcion}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        fechaHoraRecepcion: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="paq-form-group">
                  <label className="paq-form-label">Observaciones</label>
                  <textarea
                    className="paq-form-control paq-form-textarea"
                    value={formEditar.observaciones}
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        observaciones: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="paq-modal-footer" style={{ padding: "0" }}>
                  <button
                    type="submit"
                    className="paq-btn-submit orange"
                    disabled={enviando}
                  >
                    {enviando ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span>{" "}
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i> Actualizar Paquete
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL DETALLES ====== */}
      {modalDetalle && (
        <div
          className="paq-modal-overlay"
          onClick={() => setModalDetalle(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setModalDetalle(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div
            className="paq-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="paq-modal-header">
              <div className="paq-modal-header-left">
                <i
                  className="bi bi-info-circle"
                  style={{ color: "#3b82f6", fontSize: "22px" }}
                ></i>
                <h5>Detalles del Paquete</h5>
              </div>
              <button
                className="paq-modal-close"
                onClick={() => setModalDetalle(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="paq-modal-body">
              <div className="paq-detalle-row">
                <div className="paq-detalle-icon">
                  <i className="bi bi-person"></i>
                </div>
                <div className="paq-detalle-content">
                  <div className="paq-detalle-label">Residente</div>
                  <div className="paq-detalle-value">
                    {modalDetalle.nombreDestinatario || "N/A"}
                  </div>
                </div>
              </div>
              <div className="paq-detalle-row">
                <div className="paq-detalle-icon">
                  <i className="bi bi-building"></i>
                </div>
                <div className="paq-detalle-content">
                  <div className="paq-detalle-label">Torre</div>
                  <div className="paq-detalle-value">
                    {modalDetalle.nombreTorre || "N/A"}
                  </div>
                </div>
              </div>
              <div className="paq-detalle-row">
                <div className="paq-detalle-icon">
                  <i className="bi bi-door-open"></i>
                </div>
                <div className="paq-detalle-content">
                  <div className="paq-detalle-label">Apartamento</div>
                  <div className="paq-detalle-value">
                    {modalDetalle.numeroApartamento || "N/A"}
                  </div>
                </div>
              </div>
              <div className="paq-detalle-row">
                <div className="paq-detalle-icon">
                  <i className="bi bi-truck"></i>
                </div>
                <div className="paq-detalle-content">
                  <div className="paq-detalle-label">Empresa Mensajería</div>
                  <div className="paq-detalle-value">
                    {modalDetalle.empresaMensajeria || "N/A"}
                  </div>
                </div>
              </div>
              <div className="paq-detalle-row">
                <div className="paq-detalle-icon">
                  <i className="bi bi-calendar-event"></i>
                </div>
                <div className="paq-detalle-content">
                  <div className="paq-detalle-label">Fecha Recepción</div>
                  <div className="paq-detalle-value">
                    {formatearFecha(modalDetalle.fechaRecepcion)}
                  </div>
                </div>
              </div>
              <div className="paq-detalle-row">
                <div className="paq-detalle-icon">
                  <i className="bi bi-clock"></i>
                </div>
                <div className="paq-detalle-content">
                  <div className="paq-detalle-label">Hora Recepción</div>
                  <div className="paq-detalle-value">
                    {formatearHora(modalDetalle.fechaRecepcion) || "N/A"}
                  </div>
                </div>
              </div>
              <div className="paq-detalle-row">
                <div className="paq-detalle-icon">
                  <i
                    className={`bi ${(modalDetalle.nombreEstado || "").toLowerCase() === "recibido" ? "bi-hourglass-split" : "bi-check-circle"}`}
                  ></i>
                </div>
                <div className="paq-detalle-content">
                  <div className="paq-detalle-label">Estado</div>
                  <div className="paq-detalle-value">
                    <span
                      className={`paq-badge ${(modalDetalle.nombreEstado || "").toLowerCase() === "recibido" ? "paq-badge-recibido" : "paq-badge-entregado"}`}
                    >
                      {(modalDetalle.nombreEstado || "").toLowerCase() ===
                      "recibido"
                        ? "Recibido"
                        : "Entregado"}
                    </span>
                  </div>
                </div>
              </div>
              {modalDetalle.observaciones && (
                <div className="paq-detalle-row">
                  <div className="paq-detalle-icon">
                    <i className="bi bi-sticky"></i>
                  </div>
                  <div className="paq-detalle-content">
                    <div className="paq-detalle-label">Observaciones</div>
                    <div className="paq-detalle-value">
                      {modalDetalle.observaciones}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="paq-modal-footer" style={{ textAlign: "right" }}>
              <button
                className="paq-btn-cerrar"
                onClick={() => setModalDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Paqueteria;
