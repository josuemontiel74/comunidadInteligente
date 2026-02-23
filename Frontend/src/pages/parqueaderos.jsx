import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Styles/estiloParqueaderos.css";
import Swal from "sweetalert2";
import {
  obtenerParqueaderos,
  cambiarEstadoParqueadero,
} from "../services/parqueadero.services.jsx";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";

function Parqueaderos() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── estado general ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parqueaderos, setParqueaderos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── filtros ──
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // ── paginación ──
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 12;

  // ── modo selección (desde visitas) ──
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [tipoVehiculoFilter, setTipoVehiculoFilter] = useState(null);
  const [formStateVisitas, setFormStateVisitas] = useState(null);
  const [editModeVisitas, setEditModeVisitas] = useState(false);
  const [visitaEditandoVisitas, setVisitaEditandoVisitas] = useState(null);

  // ── Token helpers ──
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

  // ── Detectar modo selección desde visitas ──
  useEffect(() => {
    if (location.state?.fromVisitas) {
      setModoSeleccion(true);
      setFormStateVisitas(location.state.formState || null);
      setEditModeVisitas(location.state.editMode || false);
      setVisitaEditandoVisitas(location.state.visitaEditando || null);
      if (location.state.tipoVehiculoId) {
        setTipoVehiculoFilter(location.state.tipoVehiculoId);
        // Auto-filtrar por tipo de vehículo
        setFiltroTipo(location.state.tipoVehiculoId === 2 ? "motos" : "carros");
      }
      // Mostrar solo disponibles en modo selección
      setFiltroEstado("disponibles");
    }
  }, [location.state]);

  // ── Cargar parqueaderos ──
  const cargarParqueaderos = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await obtenerParqueaderos(token);
      const data = await res.json();
      if (Array.isArray(data)) {
        setParqueaderos(data);
      } else if (data.body && Array.isArray(data.body)) {
        setParqueaderos(data.body);
      } else {
        setParqueaderos([]);
      }
    } catch (err) {
      console.error("Error al cargar parqueaderos:", err);
      setError("Error al cargar los parqueaderos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarParqueaderos();
  }, [cargarParqueaderos]);

  // ── Filtros ──
  const parqueaderosFiltrados = parqueaderos.filter((p) => {
    const cumpleBusqueda =
      !searchTerm ||
      (p.codigoParqueadero || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const estaDisponible = p.estadoId === 4;
    const esNoDisponible = p.estadoId === 18;
    const estaOcupado = p.estadoId === 3;
    const cumpleEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "disponibles" && estaDisponible) ||
      (filtroEstado === "ocupados" && estaOcupado) ||
      (filtroEstado === "noDisponible" && esNoDisponible);

    const cumpleTipoSeleccion =
      !tipoVehiculoFilter || p.tipoVehiculoId === tipoVehiculoFilter;

    const cumpleTipo =
      filtroTipo === "todos" ||
      (filtroTipo === "carros" && p.tipoVehiculoId !== 2) ||
      (filtroTipo === "motos" && p.tipoVehiculoId === 2);

    return cumpleBusqueda && cumpleEstado && cumpleTipoSeleccion && cumpleTipo;
  });

  // ── Paginación calculada ──
  const totalPaginas = Math.ceil(parqueaderosFiltrados.length / porPagina);
  const parqueaderosPaginados = parqueaderosFiltrados.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina,
  );

  // ── Calcular estadísticas ──
  const totalParqueaderos = parqueaderos.length;
  const disponibles = parqueaderos.filter((p) => p.estadoId === 4).length;
  const ocupados = parqueaderos.filter((p) => p.estadoId === 3).length;
  const noDisponibles = parqueaderos.filter((p) => p.estadoId === 18).length;
  const totalMotos = parqueaderos.filter((p) => p.tipoVehiculoId === 2).length;
  const totalCarros = totalParqueaderos - totalMotos;

  // ── Limpiar filtros ──
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("todos");
    setFiltroTipo("todos");
    setPaginaActual(1);
  };

  const hayFiltrosActivos =
    searchTerm || filtroEstado !== "todos" || filtroTipo !== "todos";

  // ── Resetear página al cambiar filtros ──
  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, filtroEstado, filtroTipo]);

  // ── Seleccionar parqueadero ──
  const seleccionarParqueadero = (codigo) => {
    if (!modoSeleccion) return;
    Swal.fire({
      title: `¿Asignar ${codigo}?`,
      html: `Se asignará el parqueadero <strong>${codigo}</strong> a la visita.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4caf50",
      cancelButtonColor: "#9e9e9e",
      confirmButtonText: "Sí, asignar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/visitas", {
          replace: true,
          state: {
            fromVisitas: true,
            codigoParqueadero: codigo,
            formState: formStateVisitas,
            editMode: editModeVisitas,
            visitaEditando: visitaEditandoVisitas,
          },
        });
      }
    });
  };

  // ── Cambiar estado de parqueadero (solo SuperAdmin) ──
  const handleCambiarEstado = (p) => {
    const estadoActual = p.estadoId;

    // Si está ocupado, bloquear cualquier cambio de estado
    if (estadoActual === 3) {
      Swal.fire({
        icon: "warning",
        title: "Acción no permitida",
        html: `<p>El parqueadero <strong>${p.codigoParqueadero}</strong> está <strong>Ocupado</strong>.</p><p>No se puede cambiar su estado hasta que se <strong>finalice la visita</strong> asociada en el módulo de <strong>Visitas</strong>.</p>`,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    // Opciones de estado disponibles según estado actual
    // NUNCA se permite poner "Ocupado" manualmente (solo se ocupa al crear visita)
    const opciones = {};
    if (estadoActual !== 4) opciones["4"] = "Disponible";
    if (estadoActual !== 18) opciones["18"] = "No disponible (Mantenimiento)";

    const estadoNombreActual =
      estadoActual === 4 ? "Disponible" : "No disponible";

    Swal.fire({
      title: `Cambiar estado`,
      html: `<p>Parqueadero <strong>${p.codigoParqueadero}</strong></p><p>Estado actual: <strong>${estadoNombreActual}</strong></p><p>Selecciona el nuevo estado:</p>`,
      input: "select",
      inputOptions: opciones,
      inputPlaceholder: "Selecciona un estado",
      showCancelButton: true,
      confirmButtonColor: "#c62828",
      cancelButtonColor: "#9e9e9e",
      confirmButtonText: "Cambiar estado",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "Debes seleccionar un estado";
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const res = await cambiarEstadoParqueadero(
            p.codigoParqueadero,
            Number(result.value),
            token,
          );
          const data = await res.json();
          if (res.ok) {
            Swal.fire({
              icon: "success",
              title: "Estado actualizado",
              text: data.message,
              timer: 2000,
              showConfirmButton: false,
            });
            cargarParqueaderos();
          } else {
            // Manejo específico: visita activa
            if (
              data.visitaActiva ||
              (data.message && data.message.includes("visita activa"))
            ) {
              Swal.fire({
                icon: "warning",
                title: "Parqueadero con visita activa",
                html: `<p>No se puede cambiar el estado de <strong>${p.codigoParqueadero}</strong> porque tiene una visita en curso.</p><p>Primero debe <strong>finalizar la visita</strong> en el módulo de <strong>Visitas</strong>.</p>`,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#7c3aed",
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: data.message || "No se pudo cambiar el estado",
              });
            }
          }
        } catch (err) {
          console.error("Error al cambiar estado:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error de conexión al cambiar el estado",
          });
        }
      }
    });
  };

  // ── Cerrar sesión ──
  const cerrarSesion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) await logoutUsuario(token);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ── Loading ──
  if (loading && parqueaderos.length === 0) {
    return (
      <div className="parq-loading-screen">
        <div
          className="spinner-border"
          role="status"
          style={{ color: "#ef5350" }}
        >
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#ef5350" }}>
          Cargando parqueaderos...
        </p>
      </div>
    );
  }

  // ═════════════════════════════════════════ RENDER ═════════════════════════════════════════
  return (
    <div className="parq-dashboard">
      {/* ====== OVERLAY + DRAWER ====== */}
      <div
        className={`parq-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`parq-drawer ${menuOpen ? "open" : ""}`}>
        <div className="parq-drawer-header">
          <div className="parq-drawer-avatar">
            <i className="bi bi-p-circle"></i>
          </div>
          <h4 className="parq-drawer-title">
            {modoSeleccion
              ? "Seleccionar Parqueadero"
              : "Gestión de Parqueaderos"}
          </h4>
          <span className="parq-drawer-user">
            {usuario?.username || usuario?.nombre || "Usuario"}
          </span>
        </div>

        <div className="parq-drawer-body">
          {!modoSeleccion && (
            <>
              <div className="parq-menu-section">
                <h6 className="parq-menu-section-title">Navegación</h6>
                <Link
                  className="parq-menu-item"
                  to={
                    rolesId === 1
                      ? "/Superadmin"
                      : rolesId === 2
                        ? "/Admin"
                        : "/Vigilante"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-speedometer2"></i>
                  <span>Dashboard</span>
                  <i className="bi bi-chevron-right parq-menu-arrow"></i>
                </Link>
                {rolesId === 1 && (
                  <Link
                    className="parq-menu-item"
                    to="/Auditorias"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-journal-text"></i>
                    <span>Auditorías</span>
                    <i className="bi bi-chevron-right parq-menu-arrow"></i>
                  </Link>
                )}
              </div>

              <div className="parq-menu-section">
                <h6 className="parq-menu-section-title">Módulos</h6>
                <Link
                  className="parq-menu-item"
                  to="/Paqueteria"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Paquetería</span>
                  <i className="bi bi-chevron-right parq-menu-arrow"></i>
                </Link>
                <Link
                  className="parq-menu-item"
                  to="/visitas"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-people"></i>
                  <span>Visitas</span>
                  <i className="bi bi-chevron-right parq-menu-arrow"></i>
                </Link>
                <Link
                  className="parq-menu-item active"
                  to="/parqueaderos"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-p-circle"></i>
                  <span>Parqueaderos</span>
                  <i className="bi bi-chevron-right parq-menu-arrow"></i>
                </Link>
                {(rolesId === 1 || rolesId === 2) && (
                  <>
                    <Link
                      className="parq-menu-item"
                      to="/AreasComunes"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="bi bi-calendar-event"></i>
                      <span>Áreas Comunes</span>
                      <i className="bi bi-chevron-right parq-menu-arrow"></i>
                    </Link>
                    <Link
                      className="parq-menu-item"
                      to="/Residentes"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="bi bi-house-door"></i>
                      <span>Residentes</span>
                      <i className="bi bi-chevron-right parq-menu-arrow"></i>
                    </Link>
                    <Link
                      className="parq-menu-item"
                      to="/Reportes"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="bi bi-graph-up-arrow"></i>
                      <span>Reportes</span>
                      <i className="bi bi-chevron-right parq-menu-arrow"></i>
                    </Link>
                  </>
                )}
                {rolesId === 1 && (
                  <Link
                    className="parq-menu-item"
                    to="/GestionUsuario"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-person-gear"></i>
                    <span>Gestión Usuarios</span>
                    <i className="bi bi-chevron-right parq-menu-arrow"></i>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        {!modoSeleccion && (
          <div className="parq-drawer-footer">
            <button className="parq-logout-btn" onClick={cerrarSesion}>
              <i className="bi bi-box-arrow-right"></i>
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="parq-main">
        {/* Header AppBar */}
        <header className="parq-header">
          <button
            className="parq-header-btn"
            onClick={() => {
              if (modoSeleccion && formStateVisitas) {
                // Volver a visitas sin seleccionar, preservando formulario
                navigate("/visitas", {
                  replace: true,
                  state: {
                    fromVisitas: true,
                    formState: formStateVisitas,
                    editMode: editModeVisitas,
                    visitaEditando: visitaEditandoVisitas,
                  },
                });
              } else {
                navigate(-1);
              }
            }}
            title="Volver"
          >
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="parq-header-center">
            <h5 className="parq-header-title">
              {modoSeleccion ? "Seleccionar Parqueadero" : "Parqueaderos"}
            </h5>
          </div>

          <div className="parq-header-actions">
            <button
              className="parq-header-btn"
              onClick={cargarParqueaderos}
              disabled={loading}
              title="Actualizar"
            >
              <i
                className={`bi ${loading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            {!modoSeleccion && (
              <button
                className="parq-header-btn"
                onClick={() => setMenuOpen(true)}
                title="Abrir menú"
              >
                <i className="bi bi-list"></i>
              </button>
            )}
          </div>
        </header>

        {/* Error state */}
        {error && (
          <div className="parq-error-container">
            <i className="bi bi-exclamation-triangle-fill parq-error-icon"></i>
            <h5>Error al cargar los datos</h5>
            <p>
              El servidor está teniendo problemas.
              <br />
              Por favor, contacta al administrador.
            </p>
            <button
              className="btn btn-danger mt-3"
              onClick={cargarParqueaderos}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && parqueaderos.length === 0 && (
          <div className="parq-empty-container">
            <i className="bi bi-p-circle parq-empty-icon"></i>
            <h5>No hay parqueaderos</h5>
            <p className="text-muted">
              No se encontraron espacios de estacionamiento
            </p>
          </div>
        )}

        {/* Content */}
        {!error && parqueaderos.length > 0 && (
          <div className="parq-content">
            {/* Banner modo selección */}
            {modoSeleccion && (
              <div className="parq-selection-banner">
                <i className="bi bi-info-circle me-2"></i>
                Selecciona un parqueadero disponible para asignarlo a la visita.
                <button
                  className="parq-selection-banner-btn"
                  onClick={() => {
                    if (formStateVisitas) {
                      navigate("/visitas", {
                        state: {
                          fromVisitas: true,
                          formState: formStateVisitas,
                          editMode: editModeVisitas,
                          visitaEditando: visitaEditandoVisitas,
                        },
                        replace: true,
                      });
                    } else {
                      navigate(-1);
                    }
                  }}
                >
                  Volver sin seleccionar
                </button>
              </div>
            )}

            {/* Estadísticas */}
            {!modoSeleccion && (
              <div className="parq-stats-container">
                <div className="parq-stat-box">
                  <div className="parq-stat-label">Total</div>
                  <div className="parq-stat-value">{totalParqueaderos}</div>
                </div>
                <div className="parq-stat-box">
                  <div className="parq-stat-label" style={{ color: "#2e7d32" }}>
                    Disponibles
                  </div>
                  <div className="parq-stat-value" style={{ color: "#4caf50" }}>
                    {disponibles}
                  </div>
                </div>
                <div className="parq-stat-box">
                  <div className="parq-stat-label" style={{ color: "#c62828" }}>
                    Ocupados
                  </div>
                  <div className="parq-stat-value" style={{ color: "#ef5350" }}>
                    {ocupados}
                  </div>
                </div>
                {noDisponibles > 0 && (
                  <div className="parq-stat-box">
                    <div
                      className="parq-stat-label"
                      style={{ color: "#e65100" }}
                    >
                      No disponible
                    </div>
                    <div
                      className="parq-stat-value"
                      style={{ color: "#ff9800" }}
                    >
                      {noDisponibles}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Barra de búsqueda y filtros */}
            <div className="parq-toolbar">
              <div className="parq-toolbar-row">
                <div className="parq-filter-search">
                  <i className="bi bi-search parq-filter-search-icon"></i>
                  <input
                    type="text"
                    className="form-control parq-filter-input"
                    placeholder="Buscar por código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtros de estado */}
                <div className="parq-filter-group">
                  <span className="parq-filter-label">Estado:</span>
                  <div className="parq-filter-chips">
                    {["todos", "disponibles", "ocupados", "noDisponible"].map(
                      (est) => (
                        <button
                          key={est}
                          className={`parq-chip ${filtroEstado === est ? "active" : ""}`}
                          onClick={() => setFiltroEstado(est)}
                        >
                          {est === "todos"
                            ? "Todos"
                            : est === "disponibles"
                              ? "Disponibles"
                              : est === "ocupados"
                                ? "Ocupados"
                                : "No disponible"}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Filtros de tipo de vehículo */}
                <div className="parq-filter-group">
                  <span className="parq-filter-label">Tipo:</span>
                  <div className="parq-filter-chips">
                    <button
                      className={`parq-chip ${filtroTipo === "todos" ? "active" : ""}`}
                      onClick={() => setFiltroTipo("todos")}
                    >
                      Todos
                    </button>
                    <button
                      className={`parq-chip parq-chip-tipo ${filtroTipo === "carros" ? "active" : ""}`}
                      onClick={() => setFiltroTipo("carros")}
                    >
                      <i className="bi bi-car-front me-1"></i>
                      Carros ({totalCarros})
                    </button>
                    <button
                      className={`parq-chip parq-chip-tipo ${filtroTipo === "motos" ? "active" : ""}`}
                      onClick={() => setFiltroTipo("motos")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="me-1"
                        style={{ verticalAlign: "-2px" }}
                      >
                        <path d="M4 18a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2m16 2a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2M15.4 5H11v2h3.6l1.4 1.4-3.4 3.6H8.6L5.4 9H2v2h2.6l3.4 3.4V17a3 3 0 0 0 6 0v-2.6L17.4 11h2l-4-6zM13 17a2 2 0 0 1-4 0v-1.6l1.6-1.4H13v3z" />
                      </svg>
                      Motos ({totalMotos})
                    </button>
                  </div>
                </div>

                {hayFiltrosActivos && (
                  <button
                    className="parq-chip parq-chip-clear"
                    onClick={limpiarFiltros}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Limpiar
                  </button>
                )}
              </div>

              {/* Info de resultados */}
              <div className="parq-results-info">
                Mostrando {parqueaderosPaginados.length} de{" "}
                {parqueaderosFiltrados.length} parqueaderos
                {totalPaginas > 1 && (
                  <span>
                    {" "}
                    — Página {paginaActual} de {totalPaginas}
                  </span>
                )}
              </div>
            </div>

            {/* Sin resultados */}
            {parqueaderosFiltrados.length === 0 && (
              <div className="parq-empty-container" style={{ height: "300px" }}>
                <i className="bi bi-search parq-empty-icon"></i>
                <h5>No se encontraron parqueaderos</h5>
                <p className="text-muted">
                  Intenta cambiar los filtros de búsqueda
                </p>
              </div>
            )}

            {/* Grid de parqueaderos */}
            {parqueaderosFiltrados.length > 0 && (
              <div className="parq-grid-container">
                {parqueaderosPaginados.map((p) => {
                  const disponible = p.estadoId === 4;
                  const esMoto = p.tipoVehiculoId === 2;
                  const esNoDisponible = p.estadoId === 18;
                  const estadoClase = disponible
                    ? "disponible"
                    : esNoDisponible
                      ? "no-disponible"
                      : "ocupado";
                  const estadoTexto = disponible
                    ? "Disponible"
                    : esNoDisponible
                      ? "No disponible"
                      : "Ocupado";
                  const badgeClase = disponible
                    ? "parq-badge-disponible"
                    : esNoDisponible
                      ? "parq-badge-no-disponible"
                      : "parq-badge-ocupado";
                  return (
                    <div
                      key={p.id}
                      className={`parq-card ${estadoClase} ${modoSeleccion && disponible ? "seleccionable" : ""}`}
                      onClick={() => {
                        if (disponible && modoSeleccion) {
                          seleccionarParqueadero(p.codigoParqueadero);
                        }
                      }}
                    >
                      <div className="parq-card-header">
                        <div className="parq-card-codigo">
                          {p.codigoParqueadero}
                        </div>
                        <div className="parq-card-icon">
                          {esMoto ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="1em"
                              height="1em"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M4 18a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2m16 2a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2M15.4 5H11v2h3.6l1.4 1.4-3.4 3.6H8.6L5.4 9H2v2h2.6l3.4 3.4V17a3 3 0 0 0 6 0v-2.6L17.4 11h2l-4-6zM13 17a2 2 0 0 1-4 0v-1.6l1.6-1.4H13v3z" />
                            </svg>
                          ) : (
                            <i className="bi bi-car-front"></i>
                          )}
                        </div>
                        <div className="parq-card-tipo">
                          {esMoto ? "Moto" : "Carro"}
                        </div>
                      </div>
                      <div className="parq-card-footer">
                        <span className={`parq-badge ${badgeClase}`}>
                          {estadoTexto}
                        </span>
                        {rolesId === 1 && !modoSeleccion && (
                          <button
                            className="parq-btn-estado"
                            title="Cambiar estado"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCambiarEstado(p);
                            }}
                          >
                            <i className="bi bi-gear-fill"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="parq-pagination">
                <button
                  className="parq-page-btn"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  title="Primera página"
                >
                  <i className="bi bi-chevron-double-left"></i>
                </button>
                <button
                  className="parq-page-btn"
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  title="Anterior"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter(
                    (num) =>
                      num === 1 ||
                      num === totalPaginas ||
                      Math.abs(num - paginaActual) <= 2,
                  )
                  .reduce((acc, num, idx, arr) => {
                    if (idx > 0 && num - arr[idx - 1] > 1) {
                      acc.push("...");
                    }
                    acc.push(num);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`dots-${idx}`} className="parq-page-dots">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        className={`parq-page-btn ${paginaActual === item ? "active" : ""}`}
                        onClick={() => setPaginaActual(item)}
                      >
                        {item}
                      </button>
                    ),
                  )}

                <button
                  className="parq-page-btn"
                  onClick={() =>
                    setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaActual === totalPaginas}
                  title="Siguiente"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button
                  className="parq-page-btn"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  title="Última página"
                >
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Parqueaderos;
