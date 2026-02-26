import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import "../Styles/auditorias.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { obtenerRegistrosAuditoria } from "../services/auditorias.services.jsx";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";

function Auditorias() {
  const navigator = useNavigate();

  const [loading, setLoading] = useState(true);
  const [auditorias, setAuditorias] = useState([]);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Filtros (igual que Flutter)
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [filtroOperacion, setFiltroOperacion] = useState("todos");
  const [filtroTabla, setFiltroTabla] = useState("todos");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // Detalle modal
  const [detalleAuditoria, setDetalleAuditoria] = useState(null);

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

  // Verificar sesión y rol
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

    const rol = obtenerRolFromToken(token);
    if (rol !== 1) {
      Swal.fire({
        icon: "error",
        title: "Sin permisos",
        text: "Solo el Super Administrador puede acceder a Auditorías.",
        timer: 2500,
        showConfirmButton: false,
      }).then(() => navigator(-1));
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

  // Cargar auditorías
  const cargarAuditorias = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await obtenerRegistrosAuditoria(token);
      setAuditorias(data);
    } catch (err) {
      setError("Error al cargar los datos de auditoría.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAuditorias();
  }, [cargarAuditorias]);

  // Formatear fecha a Colombia (UTC-5) — dd/MM/yyyy HH:mm:ss
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "N/A";
    try {
      const fecha = new Date(fechaStr);
      // Ajustar a Colombia UTC-5
      const colombiaOffset = -5 * 60;
      const utcMs = fecha.getTime() + fecha.getTimezoneOffset() * 60000;
      const colombiaDate = new Date(utcMs + colombiaOffset * 60000);

      const dd = String(colombiaDate.getDate()).padStart(2, "0");
      const mm = String(colombiaDate.getMonth() + 1).padStart(2, "0");
      const yyyy = colombiaDate.getFullYear();
      const hh = String(colombiaDate.getHours()).padStart(2, "0");
      const min = String(colombiaDate.getMinutes()).padStart(2, "0");
      const ss = String(colombiaDate.getSeconds()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
    } catch {
      return fechaStr;
    }
  };

  // Aplicar filtros (igual que Flutter)
  const auditoriasFiltradas = auditorias.filter((a) => {
    const cumpleBusqueda =
      !busquedaUsuario ||
      (a.username || "").toLowerCase().includes(busquedaUsuario.toLowerCase());

    const cumpleOperacion =
      filtroOperacion === "todos" ||
      (a.operacionRealizada || "").toUpperCase() ===
        filtroOperacion.toUpperCase();

    const cumpleTabla =
      filtroTabla === "todos" ||
      (a.tablaAfectada || "").toLowerCase() === filtroTabla.toLowerCase();

    return cumpleBusqueda && cumpleOperacion && cumpleTabla;
  });

  // Paginación sobre datos filtrados
  const totalPaginas = Math.ceil(
    auditoriasFiltradas.length / registrosPorPagina,
  );
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const auditoriasPaginadas = auditoriasFiltradas.slice(
    indiceInicio,
    indiceFin,
  );

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaUsuario, filtroOperacion, filtroTabla]);

  // Generar números de página (máx 5 visibles)
  const getPaginasVisibles = () => {
    const paginas = [];
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    if (fin - inicio < 4) inicio = Math.max(1, fin - 4);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  };

  // Colores de operación (mismo que Flutter)
  const getColorOperacion = (op) => {
    const upper = (op || "").toUpperCase();
    if (upper.includes("INSERT")) return "#22c55e";
    if (upper.includes("UPDATE")) return "#f97316";
    if (upper.includes("DELETE")) return "#ef4444";
    return "#6b7280";
  };

  // Iconos de operación
  const getIconOperacion = (op) => {
    const upper = (op || "").toUpperCase();
    if (upper.includes("INSERT")) return "bi-plus-circle-fill";
    if (upper.includes("UPDATE")) return "bi-pencil-fill";
    if (upper.includes("DELETE")) return "bi-trash-fill";
    return "bi-clock-history";
  };

  // Mostrar detalle
  const mostrarDetalle = (auditoria) => {
    setDetalleAuditoria(auditoria);
  };

  const cerrarSesion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) await logoutUsuario(token);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigator("/");
  };

  // Loading state
  if (loading && auditorias.length === 0) {
    return (
      <div className="aud-loading-screen">
        <output className="spinner-border" style={{ color: "#4f46e5" }}>
          <span className="visually-hidden">Cargando...</span>
        </output>
        <p className="mt-3 fw-semibold" style={{ color: "#4f46e5" }}>
          Cargando auditorías...
        </p>
      </div>
    );
  }

  return (
    <div className="aud-dashboard">
      {/* ====== OFFCANVAS MENU ====== */}
      <button
        type="button"
        className={`aud-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        tabIndex={0}
        aria-label="Cerrar menú"
      />
      <aside className={`aud-drawer ${menuOpen ? "open" : ""}`}>
        <div className="aud-drawer-header">
          <div className="aud-drawer-avatar">
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <h4 className="aud-drawer-title">Menú Super Admin</h4>
          <span className="aud-drawer-user">
            {usuario?.username || usuario?.nombre || "Usuario"}
          </span>
        </div>

        <div className="aud-drawer-body">
          <div className="aud-menu-section">
            <h6 className="aud-menu-section-title">Navegación</h6>
            <Link
              className="aud-menu-item"
              to="/Superadmin"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
            <Link
              className="aud-menu-item active"
              to="/Auditorias"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-journal-text"></i>
              <span>Auditorías</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
            <Link
              className="aud-menu-item"
              to="/LogErrores"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-bug"></i>
              <span>Log de Errores</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
          </div>

          <div className="aud-menu-section">
            <h6 className="aud-menu-section-title">Módulos</h6>
            <Link
              className="aud-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
            <Link
              className="aud-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
            <Link
              className="aud-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
            <Link
              className="aud-menu-item"
              to="/AreasComunes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-calendar2-week"></i>
              <span>Áreas Comunes</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
            <Link
              className="aud-menu-item"
              to="/Residentes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-house-door"></i>
              <span>Residentes</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
            <Link
              className="aud-menu-item"
              to="/GestionUsuario"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-person-gear"></i>
              <span>Gestión Usuarios</span>
              <i className="bi bi-chevron-right aud-menu-arrow"></i>
            </Link>
          </div>
        </div>

        <div className="aud-drawer-footer">
          <button className="aud-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="aud-main">
        {/* Header tipo AppBar (como Flutter) */}
        <header className="aud-header">
          <button
            className="aud-header-btn"
            onClick={() => navigator(-1)}
            title="Volver"
          >
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="aud-header-center">
            <h5 className="aud-header-title">Registro de Auditoría</h5>
          </div>

          <div className="aud-header-actions">
            <button
              className="aud-header-btn"
              onClick={cargarAuditorias}
              disabled={loading}
              title="Actualizar"
            >
              <i
                className={`bi ${loading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            <button
              className="aud-header-btn aud-hamburger"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        {/* Error state */}
        {error && (
          <div className="aud-error-container">
            <i className="bi bi-exclamation-triangle-fill aud-error-icon"></i>
            <h5>Error al cargar los datos</h5>
            <p>
              El servidor está teniendo problemas.
              <br />
              Por favor, contacta al administrador.
            </p>
            <button className="btn aud-btn-retry" onClick={cargarAuditorias}>
              <i className="bi bi-arrow-clockwise me-2"></i>Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && auditorias.length === 0 && (
          <div className="aud-empty-container">
            <i className="bi bi-clock-history aud-empty-icon"></i>
            <h5>No hay registros de auditoría</h5>
          </div>
        )}

        {/* Content */}
        {!error && auditorias.length > 0 && (
          <>
            {/* Filtros (igual que Flutter) */}
            <div className="aud-filters">
              <div className="aud-filter-search">
                <i className="bi bi-search aud-filter-search-icon"></i>
                <input
                  type="text"
                  className="form-control aud-filter-input"
                  placeholder="Buscar por usuario"
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                />
              </div>
              <div className="aud-filter-row">
                <div className="aud-filter-select-wrap">
                  <i className="bi bi-funnel aud-filter-select-icon"></i>
                  <select
                    className="form-select aud-filter-select"
                    value={filtroOperacion}
                    onChange={(e) => setFiltroOperacion(e.target.value)}
                  >
                    <option value="todos">Todas las Operaciones</option>
                    <option value="INSERT">INSERT</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="aud-filter-select-wrap">
                  <i className="bi bi-table aud-filter-select-icon"></i>
                  <select
                    className="form-select aud-filter-select"
                    value={filtroTabla}
                    onChange={(e) => setFiltroTabla(e.target.value)}
                  >
                    <option value="todos">Todas las Tablas</option>
                    <option value="usuarios">Usuarios</option>
                    <option value="ocupantes">Residentes</option>
                    <option value="recepcionPaquetes">Paquetería</option>
                    <option value="visitas">Visitas</option>
                    <option value="reservasareas">Áreas Comunes</option>
                    <option value="parqueaderos">Parqueaderos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sin resultados con filtros */}
            {auditoriasFiltradas.length === 0 && (
              <div className="aud-empty-container">
                <i className="bi bi-search aud-empty-icon"></i>
                <h5>No se encontraron registros</h5>
                <p className="text-muted">
                  Intenta cambiar los filtros de búsqueda
                </p>
              </div>
            )}

            {/* Tabla (escritorio) */}
            {auditoriasFiltradas.length > 0 && (
              <div className="aud-table-container">
                <table className="aud-table">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Usuario</th>
                      <th>Operación</th>
                      <th>Tabla Afectada</th>
                      <th>ID Afectado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoriasPaginadas.map((a) => (
                      <tr
                        key={a.idAuditoria}
                        onClick={() => mostrarDetalle(a)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") mostrarDetalle(a);
                        }}
                        className="aud-table-row"
                        tabIndex={0}
                        role="button"
                      >
                        <td>{formatearFecha(a.fechaHoraAuditoria)}</td>
                        <td>{a.username || "N/A"}</td>
                        <td>
                          <span
                            className="aud-badge-operacion"
                            style={{
                              backgroundColor: getColorOperacion(
                                a.operacionRealizada,
                              ),
                            }}
                          >
                            {a.operacionRealizada}
                          </span>
                        </td>
                        <td>{a.tablaAfectada || "N/A"}</td>
                        <td>
                          {a.nombreAfectado || a.idRegistroAfectado || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cards (móvil) */}
            {auditoriasFiltradas.length > 0 && (
              <div className="aud-cards-container">
                {auditoriasPaginadas.map((a) => (
                  <button
                    key={a.idAuditoria}
                    className="aud-card"
                    onClick={() => mostrarDetalle(a)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") mostrarDetalle(a);
                    }}
                    tabIndex={0}
                  >
                    <div className="aud-card-top">
                      <div
                        className="aud-card-avatar"
                        style={{
                          backgroundColor: getColorOperacion(
                            a.operacionRealizada,
                          ),
                        }}
                      >
                        <i
                          className={`bi ${getIconOperacion(a.operacionRealizada)}`}
                        ></i>
                      </div>
                      <div className="aud-card-info">
                        <span className="aud-card-username">
                          {a.username || "N/A"}
                        </span>
                        <span className="aud-card-fecha">
                          {formatearFecha(a.fechaHoraAuditoria)}
                        </span>
                      </div>
                      <span
                        className="aud-badge-operacion"
                        style={{
                          backgroundColor: getColorOperacion(
                            a.operacionRealizada,
                          ),
                        }}
                      >
                        {a.operacionRealizada}
                      </span>
                    </div>
                    <hr className="aud-card-divider" />
                    <div className="aud-card-bottom">
                      <div>
                        <span className="aud-card-label">Tabla Afectada</span>
                        <span className="aud-card-value">
                          {a.tablaAfectada || "N/A"}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="aud-card-label">ID Afectado</span>
                        <span className="aud-card-value">
                          {a.nombreAfectado || a.idRegistroAfectado || "N/A"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Paginación + Contador */}
            {auditoriasFiltradas.length > 0 && (
              <div className="aud-pagination-wrapper">
                <span className="aud-pagination-info">
                  Mostrando {indiceInicio + 1}–
                  {Math.min(indiceFin, auditoriasFiltradas.length)} de{" "}
                  {auditoriasFiltradas.length} registros
                </span>
                {totalPaginas > 1 && (
                  <nav>
                    <ul className="aud-pagination">
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

      {/* Modal Detalle (igual que Flutter AlertDialog) */}
      {detalleAuditoria && (
        <dialog
          open
          className="aud-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetalleAuditoria(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDetalleAuditoria(null);
          }}
          aria-modal="true"
          aria-label="Cerrar"
        >
          <div className="aud-modal">
            <div className="aud-modal-header">
              <i
                className="bi bi-info-circle"
                style={{ color: "#4f46e5", fontSize: "24px" }}
              ></i>
              <h5>Detalle del Registro Afectado</h5>
            </div>
            <div className="aud-modal-body">
              <p className="aud-modal-tabla">
                Tabla: <strong>{detalleAuditoria.tablaAfectada}</strong>
              </p>
              <p className="aud-modal-label">
                ID del Registro (Clave Primaria):
              </p>
              <div className="aud-modal-id-box">
                {detalleAuditoria.idRegistroAfectado || "N/A"}
              </div>
              {detalleAuditoria.nombreAfectado && (
                <>
                  <p className="aud-modal-label mt-3">Nombre asociado:</p>
                  <div className="aud-modal-name-box">
                    {detalleAuditoria.nombreAfectado}
                  </div>
                </>
              )}
            </div>
            <div className="aud-modal-footer">
              <button
                className="btn aud-btn-cerrar"
                onClick={() => setDetalleAuditoria(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default Auditorias;
