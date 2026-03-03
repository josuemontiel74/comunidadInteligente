import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import "../Styles/logErrores.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  obtenerLogErrores,
  obtenerResumenLogErrores,
  limpiarLogErrores,
} from "../services/logErrores.services.jsx";
import ModalOverlay from "../utils/ModalOverlay.jsx";
import { verificarTokenVencido, obtenerRolFromToken } from "../utils/auth.js";
import useLogout from "../utils/useLogout.js";

function LogErrores() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detalleRegistro, setDetalleRegistro] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 15;

  // Token helpers (importados de utils/auth.js)

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

    const rol = obtenerRolFromToken(token);
    if (rol !== 1) {
      Swal.fire({
        icon: "error",
        title: "Sin permisos",
        text: "Solo el Super Administrador puede acceder a este módulo.",
        timer: 2500,
        showConfirmButton: false,
      }).then(() => navigate(-1));
      return;
    }

    const userGuardado = localStorage.getItem("user");
    if (userGuardado) {
      try {
        setUsuario(JSON.parse(userGuardado));
      } catch {
        navigate("/");
      }
    }
  }, [navigate]);

  // ── Cargar datos ──
  const cargarDatos = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [data, resumenData] = await Promise.all([
        obtenerLogErrores(token, {
          nivel: filtroNivel,
          desde: filtroDesde,
          hasta: filtroHasta,
          limite: 500,
        }),
        obtenerResumenLogErrores(token),
      ]);
      setRegistros(data);
      setResumen(resumenData.resumenNivel || []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el log de errores.");
    } finally {
      setLoading(false);
    }
  }, [filtroNivel, filtroDesde, filtroHasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ── Formatear fecha Colombia ──
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "N/A";
    try {
      const fecha = new Date(fechaStr);
      const colombiaOffset = -5 * 60;
      const utcMs = fecha.getTime() + fecha.getTimezoneOffset() * 60000;
      const c = new Date(utcMs + colombiaOffset * 60000);
      const dd = String(c.getDate()).padStart(2, "0");
      const mm = String(c.getMonth() + 1).padStart(2, "0");
      const yyyy = c.getFullYear();
      const hh = String(c.getHours()).padStart(2, "0");
      const min = String(c.getMinutes()).padStart(2, "0");
      const ss = String(c.getSeconds()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
    } catch {
      return fechaStr;
    }
  };

  // ── Badge + colores por nivel ──
  const getBadgeClass = (nivel) => {
    const n = (nivel || "").toUpperCase();
    if (n === "ERROR") return "le-badge le-badge-error";
    if (n === "WARN" || n === "WARNING") return "le-badge le-badge-warn";
    if (n === "INFO") return "le-badge le-badge-info";
    return "le-badge le-badge-debug";
  };

  const getChipClass = (nivel) => {
    if (filtroNivel !== nivel) return "le-chip";
    const n = nivel.toUpperCase();
    if (n === "ERROR") return "le-chip active";
    if (n === "WARN") return "le-chip active-warn";
    if (n === "INFO") return "le-chip active-info";
    if (n === "DEBUG") return "le-chip active-debug";
    return "le-chip active";
  };

  const getIconNivel = (nivel) => {
    const n = (nivel || "").toUpperCase();
    if (n === "ERROR") return "bi-x-octagon-fill";
    if (n === "WARN" || n === "WARNING") return "bi-exclamation-triangle-fill";
    if (n === "INFO") return "bi-info-circle-fill";
    return "bi-bug-fill";
  };

  // ── Estadísticas del resumen ──
  const getCount = (nivel) => {
    const r = resumen.find(
      (x) => (x.nivel || "").toUpperCase() === nivel.toUpperCase(),
    );
    return r ? Number(r.total) : 0;
  };

  // ── Filtro local (búsqueda por texto) ──
  const registrosFiltrados = registros.filter((r) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      (r.mensajeError || "").toLowerCase().includes(q) ||
      (r.rutaAfectada || "").toLowerCase().includes(q) ||
      (r.username || "").toLowerCase().includes(q)
    );
  });

  // ── Paginación ──
  const totalPaginas = Math.ceil(
    registrosFiltrados.length / registrosPorPagina,
  );
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const paginados = registrosFiltrados.slice(indiceInicio, indiceFin);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroNivel, filtroDesde, filtroHasta]);

  const getPaginasVisibles = () => {
    const paginas = [];
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    if (fin - inicio < 4) inicio = Math.max(1, fin - 4);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  };

  // ── Limpiar registros antiguos ──
  const handleLimpiar = () => {
    Swal.fire({
      title: "Limpiar Log de Errores",
      html: `
        <p style="margin-bottom:12px;color:#6b7280;font-size:14px;">
          Se eliminarán todos los registros con más de:
        </p>
        <select id="swal-dias" class="swal2-input" style="text-align:center;">
          <option value="7">7 días</option>
          <option value="15">15 días</option>
          <option value="30" selected>30 días</option>
          <option value="60">60 días</option>
          <option value="90">90 días</option>
        </select>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, limpiar",
      confirmButtonColor: "#b91c1c",
      cancelButtonText: "Cancelar",
      cancelButtonColor: "#6b7280",
      preConfirm: () => {
        return document.getElementById("swal-dias").value;
      },
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      const token = localStorage.getItem("token");
      try {
        const data = await limpiarLogErrores(token, Number(result.value));
        Swal.fire({
          icon: "success",
          title: "Limpieza completada",
          text: data.mensaje,
          timer: 3000,
          showConfirmButton: false,
        });
        cargarDatos();
      } catch {
        Swal.fire("Error", "No se pudo limpiar el log.", "error");
      }
    });
  };

  // ── Cerrar sesión ──
  const cerrarSesion = useLogout();

  // ── Loading ──
  if (loading && registros.length === 0) {
    return (
      <div className="le-loading-screen">
        <output className="spinner-border" style={{ color: "#ef4444" }}>
          <span className="visually-hidden">Cargando...</span>
        </output>
        <p className="mt-3 fw-semibold" style={{ color: "#ef4444" }}>
          Cargando log de errores...
        </p>
      </div>
    );
  }

  return (
    <div className="le-dashboard">
      {/* OVERLAY */}
      <button
        type="button"
        className={`le-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        tabIndex={0}
        aria-label="Cerrar menú"
      />

      {/* DRAWER */}
      <aside className={`le-drawer ${menuOpen ? "open" : ""}`}>
        <div className="le-drawer-header">
          <div className="le-drawer-avatar">
            <i className="bi bi-shield-exclamation"></i>
          </div>
          <h4 className="le-drawer-title">Log de Errores</h4>
          <span className="le-drawer-user">
            {usuario?.username || "SuperAdmin"}
          </span>
        </div>

        <div className="le-drawer-body">
          <div className="le-menu-section">
            <h6 className="le-menu-section-title">Navegación</h6>
            <Link
              className="le-menu-item"
              to="/Superadmin"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
          </div>

          <div className="le-menu-section">
            <h6 className="le-menu-section-title">Módulos</h6>
            <Link
              className="le-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item"
              to="/AreasComunes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-calendar-event"></i>
              <span>Áreas Comunes</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item"
              to="/Residentes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-house-door"></i>
              <span>Residentes</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item"
              to="/Reportes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-graph-up-arrow"></i>
              <span>Reportes</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item"
              to="/GestionUsuario"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-person-gear"></i>
              <span>Gestión Usuarios</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item"
              to="/Auditorias"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-journal-text"></i>
              <span>Auditorías</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
            <Link
              className="le-menu-item active"
              to="/LogErrores"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-bug"></i>
              <span>Log de Errores</span>
              <i className="bi bi-chevron-right le-menu-arrow"></i>
            </Link>
          </div>
        </div>

        <div className="le-drawer-footer">
          <button className="le-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="le-main">
        {/* HEADER */}
        <header className="le-header">
          <button
            className="le-header-btn"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="le-header-center">
            <h5 className="le-header-title">Log de Errores del Sistema</h5>
          </div>
          <div className="le-header-actions">
            <button
              className="le-header-btn"
              onClick={cargarDatos}
              disabled={loading}
              title="Actualizar"
            >
              <i
                className={`bi ${loading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            <button
              className="le-header-btn"
              onClick={() => setMenuOpen(true)}
              title="Menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div className="le-empty-container">
            <i
              className="bi bi-exclamation-triangle-fill le-empty-icon"
              style={{ color: "#ef4444" }}
            ></i>
            <h5>Error al cargar</h5>
            <p className="text-muted">{error}</p>
            <button className="le-btn-limpiar" onClick={cargarDatos}>
              <i className="bi bi-arrow-clockwise"></i> Reintentar
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* STATS */}
            <div className="le-stats-row">
              <div
                className="le-stat-card"
                style={{ "--le-stat-color": "#ef4444" }}
              >
                <i className="bi bi-x-octagon-fill le-stat-icon"></i>
                <div className="le-stat-value">{getCount("ERROR")}</div>
                <div className="le-stat-label">Errores</div>
              </div>
              <div
                className="le-stat-card"
                style={{ "--le-stat-color": "#f97316" }}
              >
                <i className="bi bi-exclamation-triangle-fill le-stat-icon"></i>
                <div className="le-stat-value">
                  {getCount("WARN") + getCount("WARNING")}
                </div>
                <div className="le-stat-label">Advertencias</div>
              </div>
              <div
                className="le-stat-card"
                style={{ "--le-stat-color": "#3b82f6" }}
              >
                <i className="bi bi-info-circle-fill le-stat-icon"></i>
                <div className="le-stat-value">{getCount("INFO")}</div>
                <div className="le-stat-label">Información</div>
              </div>
              <div
                className="le-stat-card"
                style={{ "--le-stat-color": "#6b7280" }}
              >
                <i className="bi bi-collection le-stat-icon"></i>
                <div className="le-stat-value">{registros.length}</div>
                <div className="le-stat-label">Total cargados</div>
              </div>
            </div>

            {/* TOOLBAR */}
            <div className="le-toolbar">
              <div className="le-toolbar-top">
                <div className="le-search-wrap">
                  <i className="bi bi-search le-search-icon"></i>
                  <input
                    type="text"
                    className="le-search-input"
                    placeholder="Buscar por mensaje, ruta, usuario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <button
                  className="le-btn-limpiar-log"
                  onClick={handleLimpiar}
                  title="Eliminar registros antiguos"
                >
                  <i className="bi bi-trash3"></i> Limpiar antiguos
                </button>
              </div>

              <div className="le-filter-row">
                <input
                  type="date"
                  className="le-date-input"
                  value={filtroDesde}
                  onChange={(e) => setFiltroDesde(e.target.value)}
                  title="Desde"
                />
                <input
                  type="date"
                  className="le-date-input"
                  value={filtroHasta}
                  onChange={(e) => setFiltroHasta(e.target.value)}
                  title="Hasta"
                />
                {(filtroDesde || filtroHasta || busqueda) && (
                  <button
                    className="le-btn-limpiar"
                    onClick={() => {
                      setBusqueda("");
                      setFiltroDesde("");
                      setFiltroHasta("");
                    }}
                  >
                    <i className="bi bi-x-circle"></i> Limpiar filtros
                  </button>
                )}
              </div>

              {/* Chips nivel */}
              <div className="le-chips">
                {["todos", "ERROR", "WARN", "INFO", "DEBUG"].map((nivel) => (
                  <button
                    key={nivel}
                    className={
                      filtroNivel === nivel ? getChipClass(nivel) : "le-chip"
                    }
                    onClick={() => setFiltroNivel(nivel)}
                  >
                    {nivel === "todos" ? "Todos" : nivel}
                  </button>
                ))}
              </div>
            </div>

            {/* EMPTY */}
            {registrosFiltrados.length === 0 && !loading && (
              <div className="le-empty-container">
                <i
                  className="bi bi-check-circle le-empty-icon"
                  style={{ color: "#22c55e" }}
                ></i>
                <h5>Sin registros</h5>
                <p className="text-muted">
                  No se encontraron errores con los filtros aplicados
                </p>
              </div>
            )}

            {/* TABLA (escritorio) */}
            {registrosFiltrados.length > 0 && (
              <div className="le-table-container">
                <table className="le-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha y Hora</th>
                      <th>Nivel</th>
                      <th>Usuario</th>
                      <th>Ruta / Módulo</th>
                      <th>Mensaje</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginados.map((r, idx) => (
                      <tr key={r.idLog}>
                        <td style={{ color: "#9ca3af", fontSize: "12px" }}>
                          {indiceInicio + idx + 1}
                        </td>
                        <td style={{ whiteSpace: "nowrap", fontSize: "12px" }}>
                          {formatearFecha(r.fechaHora)}
                        </td>
                        <td>
                          <span className={getBadgeClass(r.nivel)}>
                            <i
                              className={`bi ${getIconNivel(r.nivel)} me-1`}
                            ></i>
                            {r.nivel}
                          </span>
                        </td>
                        <td>
                          {r.username || (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className="le-ruta">
                            {r.rutaAfectada || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="le-mensaje" title={r.mensajeError}>
                            {r.mensajeError}
                          </span>
                        </td>
                        <td>
                          <button
                            className="le-btn-ver"
                            onClick={() => setDetalleRegistro(r)}
                          >
                            <i className="bi bi-eye me-1"></i>Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* CARDS (móvil) */}
            {registrosFiltrados.length > 0 && (
              <div className="le-cards-container">
                {paginados.map((r) => (
                  <div key={r.idLog} className="le-card">
                    <div className="le-card-header">
                      <span className={getBadgeClass(r.nivel)}>
                        <i className={`bi ${getIconNivel(r.nivel)} me-1`}></i>
                        {r.nivel}
                      </span>
                      <span className="le-card-fecha">
                        {formatearFecha(r.fechaHora)}
                      </span>
                    </div>
                    <div className="le-card-body">
                      <div className="le-card-row">
                        <i className="bi bi-link-45deg le-card-icon"></i>
                        <div>
                          <div className="le-card-label">Ruta</div>
                          <div
                            className="le-card-value"
                            style={{
                              fontFamily: "monospace",
                              fontSize: "12px",
                            }}
                          >
                            {r.rutaAfectada || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="le-card-row">
                        <i className="bi bi-chat-text le-card-icon"></i>
                        <div>
                          <div className="le-card-label">Mensaje</div>
                          <div className="le-card-value">{r.mensajeError}</div>
                        </div>
                      </div>
                      {r.username && (
                        <div className="le-card-row">
                          <i className="bi bi-person le-card-icon"></i>
                          <div>
                            <div className="le-card-label">Usuario</div>
                            <div className="le-card-value">{r.username}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="le-card-actions">
                      <button
                        className="le-card-btn ver"
                        onClick={() => setDetalleRegistro(r)}
                      >
                        <i className="bi bi-eye"></i> Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINACIÓN */}
            {registrosFiltrados.length > registrosPorPagina && (
              <div className="le-pagination-wrapper">
                <span className="le-pagination-info">
                  Mostrando {indiceInicio + 1}–
                  {Math.min(indiceFin, registrosFiltrados.length)} de{" "}
                  {registrosFiltrados.length} registros
                </span>
                {totalPaginas > 1 && (
                  <nav>
                    <ul className="le-pagination">
                      <li className={paginaActual === 1 ? "disabled" : ""}>
                        <button
                          onClick={() => setPaginaActual(1)}
                          disabled={paginaActual === 1}
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

      {/* MODAL DETALLE */}
      {detalleRegistro && (
        <ModalOverlay
          isOpen
          onClose={() => setDetalleRegistro(null)}
          className="le-modal-overlay"
        >
          <div className="le-modal">
            <div className="le-modal-header">
              <i
                className="bi bi-bug-fill"
                style={{ color: "#b91c1c", fontSize: "22px" }}
              ></i>
              <span className="le-modal-title">Detalle del Error</span>
              <button
                className="le-modal-close"
                onClick={() => setDetalleRegistro(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="le-modal-body">
              <div className="le-detail-row">
                <div className="le-detail-icon">
                  <i className="bi bi-calendar-event"></i>
                </div>
                <div>
                  <div className="le-detail-label">Fecha y Hora</div>
                  <div className="le-detail-value">
                    {formatearFecha(detalleRegistro.fechaHora)}
                  </div>
                </div>
              </div>

              <div className="le-detail-row">
                <div className="le-detail-icon">
                  <i
                    className={`bi ${getIconNivel(detalleRegistro.nivel)}`}
                  ></i>
                </div>
                <div>
                  <div className="le-detail-label">Nivel</div>
                  <div className="le-detail-value">
                    <span className={getBadgeClass(detalleRegistro.nivel)}>
                      {detalleRegistro.nivel}
                    </span>
                  </div>
                </div>
              </div>

              {detalleRegistro.username && (
                <div className="le-detail-row">
                  <div className="le-detail-icon">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <div>
                    <div className="le-detail-label">Usuario</div>
                    <div className="le-detail-value">
                      {detalleRegistro.username}
                    </div>
                  </div>
                </div>
              )}

              <div className="le-detail-row">
                <div className="le-detail-icon">
                  <i className="bi bi-link-45deg"></i>
                </div>
                <div>
                  <div className="le-detail-label">Ruta / Módulo</div>
                  <div
                    className="le-detail-value"
                    style={{ fontFamily: "monospace", fontSize: "13px" }}
                  >
                    {detalleRegistro.rutaAfectada || "—"}
                  </div>
                </div>
              </div>

              <div className="le-detail-row">
                <div className="le-detail-icon">
                  <i className="bi bi-chat-text"></i>
                </div>
                <div>
                  <div className="le-detail-label">Mensaje de Error</div>
                  <div className="le-detail-value">
                    {detalleRegistro.mensajeError}
                  </div>
                </div>
              </div>

              {detalleRegistro.stackTrace && (
                <div className="le-detail-row">
                  <div className="le-detail-icon">
                    <i className="bi bi-terminal"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="le-detail-label">Stack Trace</div>
                    <pre className="le-stack-box">
                      {detalleRegistro.stackTrace}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="le-modal-footer">
              <button
                className="le-btn-cerrar"
                onClick={() => setDetalleRegistro(null)}
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

export default LogErrores;
