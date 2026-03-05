import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../Styles/dashboardSuperAdmin.css";
import logo from "../../img/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  obtenerUsuariosEnLinea,
  logoutUsuario,
} from "../services/gestionUsuarios.jsx";
import DescargaAppMovil from "./DescargaAppMovil.jsx";
import ModoOscuro from "./ModoOscuro.jsx";
import WhatsAppModal from "./WhatsAppModal.jsx";
import useDarkMode from "../utils/useDarkMode.js";
import useSessionCheck from "../utils/useSessionCheck.js";
import useDashboardData from "../utils/useDashboardData.js";
import {
  donutParqueaderosConfig,
  barChartConfig,
  useChart,
} from "../utils/chartConfigs.js";

/** Calcula porcentaje como string. Retorna "0" si total es 0 */
const calcPctStr = (val, total) =>
  total > 0 ? ((val / total) * 100).toFixed(0) : "0";

/** Construye la lista de módulos del dashboard según permisos */
function buildModulos(showAreasComunes, showUserManagement) {
  const base = [
    {
      icon: "bi-box-seam-fill",
      title: "Gestión de Paquetería",
      color: "#3b82f6",
      to: "/Paqueteria",
    },
    {
      icon: "bi-people-fill",
      title: "Gestión de Visitas",
      color: "#22c55e",
      to: "/visitas",
    },
    {
      icon: "bi-p-circle-fill",
      title: "Parqueaderos",
      color: "#ef4444",
      to: "/parqueaderos",
    },
  ];
  if (showAreasComunes) {
    base.push({
      icon: "bi-building",
      title: "Áreas Comunes",
      color: "#f97316",
      to: "/AreasComunes",
    });
  }
  if (showUserManagement) {
    base.push({
      icon: "bi-shield-lock-fill",
      title: "Gestión de Usuarios",
      color: "#a855f7",
      to: "/GestionUsuario",
    });
  }
  base.push(
    {
      icon: "bi-house-door-fill",
      title: "Gestión de Residentes",
      color: "#14b8a6",
      to: "/Residentes",
    },
    {
      icon: "bi-file-earmark-bar-graph-fill",
      title: "Reportes",
      color: "#6366f1",
      to: "/Reportes",
    },
  );
  if (showUserManagement) {
    base.push(
      {
        icon: "bi-journal-text",
        title: "Auditorías",
        color: "#4f46e5",
        to: "/Auditorias",
      },
      {
        icon: "bi-bug-fill",
        title: "Log de Errores",
        color: "#b91c1c",
        to: "/LogErrores",
      },
    );
  }
  return base;
}

/** Helper: extrae permisos del token para reducir complejidad del componente */
function getTokenPermissions() {
  const token = localStorage.getItem("token");
  if (!token) return { showUserManagement: false, showAreasComunes: false };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const valido = Date.now() < payload.exp * 1000;
    const rolesId = payload.rolesId ?? null;
    return {
      showUserManagement: valido && rolesId === 1,
      showAreasComunes: valido && rolesId !== 3,
    };
  } catch {
    return {
      showUserManagement: false,
      showAreasComunes: false,
    };
  }
}

function Dashboard() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [usuariosEnLinea, setUsuariosEnLinea] = useState([]);
  const [totalEnLinea, setTotalEnLinea] = useState(0);

  const oscuro = useDarkMode();
  const { loading, usuario, fotoUsuario } = useSessionCheck();
  const {
    dataLoading,
    setDataLoading,
    cargarDatos: cargarDatosBase,
    paquetesEntregados,
    paquetesPendientes,
    parqueosCarros,
    parqueosMotos,
    parqueosLibres,
    visitasHoy,
    visitasActivas,
    reservasHoy,
    residentesActivos,
  } = useDashboardData(!loading);

  // Token / roles (extraído a helper externo para reducir complejidad cognitiva)
  const { showUserManagement, showAreasComunes } = getTokenPermissions();

  // Canvas refs
  const parqueoCanvasRef = useRef(null);
  const paquetesCanvasRef = useRef(null);
  const visitasCanvasRef = useRef(null);

  // Cargar usuarios en línea junto con datos base
  const cargarDatos = async () => {
    await cargarDatosBase();
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const enLineaData = await obtenerUsuariosEnLinea(token);
        const nombres = Object.keys(enLineaData);
        setUsuariosEnLinea(nombres);
        setTotalEnLinea(nombres.length);
      }
    } catch (error) {
      console.warn("Error obteniendo usuarios en línea:", error);
    }
  };

  // Carga inicial + auto-refresh cada 30s para usuarios en línea
  useEffect(() => {
    if (loading) return;

    const fetchEnLinea = () => {
      const token = localStorage.getItem("token");
      if (token) {
        obtenerUsuariosEnLinea(token)
          .then((data) => {
            const nombres = Object.keys(data);
            setUsuariosEnLinea(nombres);
            setTotalEnLinea(nombres.length);
          })
          .catch(() => {});
      }
    };

    // Carga inmediata al montar / volver al dashboard
    fetchEnLinea();

    const interval = setInterval(fetchEnLinea, 30000);
    return () => clearInterval(interval);
  }, [loading]);

  // Gráficos
  const ready = !loading && !dataLoading;
  useChart(
    parqueoCanvasRef,
    ready
      ? donutParqueaderosConfig(
          {
            carros: parqueosCarros,
            motos: parqueosMotos,
            libres: parqueosLibres,
          },
          oscuro,
        )
      : null,
    [ready, parqueosCarros, parqueosMotos, parqueosLibres, oscuro],
  );
  useChart(
    paquetesCanvasRef,
    ready
      ? barChartConfig(
          ["Entregados", "Pendientes"],
          [paquetesEntregados, paquetesPendientes],
          ["rgba(34, 197, 94, 0.85)", "rgba(249, 115, 22, 0.85)"],
          "paquetes",
          oscuro,
        )
      : null,
    [ready, paquetesEntregados, paquetesPendientes, oscuro],
  );
  useChart(
    visitasCanvasRef,
    ready
      ? barChartConfig(
          ["Hoy", "Activas"],
          [visitasHoy, visitasActivas],
          ["rgba(34, 197, 94, 0.85)", "rgba(59, 130, 246, 0.85)"],
          "visitas",
          oscuro,
        )
      : null,
    [ready, visitasHoy, visitasActivas, oscuro],
  );

  const cerrarSesion = async (e) => {
    e.preventDefault();
    setSaliendo(true);
    setTimeout(async () => {
      const token = localStorage.getItem("token");
      if (token) await logoutUsuario(token);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      globalThis.location.replace("/login");
    }, 380);
  };

  if (loading) {
    return (
      <div className="sa-loading-screen">
        <output className="spinner-border text-success">
          <span className="visually-hidden">Cargando...</span>
        </output>
        <p className="mt-3 text-success fw-semibold">Verificando sesión...</p>
      </div>
    );
  }

  const totalPaquetes = paquetesEntregados + paquetesPendientes;
  const porcentajeEntregados = calcPctStr(paquetesEntregados, totalPaquetes);
  const totalParqueos = parqueosCarros + parqueosMotos + parqueosLibres;
  const modulos = buildModulos(showAreasComunes, showUserManagement);

  return (
    <div className={`sa-dashboard${saliendo ? " sa-saliendo" : ""}`}>
      {/* ====== OFFCANVAS MENU ====== */}
      <button
        type="button"
        className={`sa-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-label="Cerrar menú"
      />
      <aside className={`sa-drawer ${menuOpen ? "open" : ""}`}>
        <div className="sa-drawer-header">
          <div className="sa-drawer-avatar">
            {fotoUsuario ? (
              <img
                src={fotoUsuario}
                alt="Perfil"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <i className="bi bi-shield-lock-fill"></i>
            )}
          </div>
          <h4 className="sa-drawer-title">Menú Super Admin</h4>
          <span className="sa-drawer-user">
            {usuario?.username || usuario?.nombre || "Usuario"}
          </span>
        </div>
        <div className="sa-drawer-body">
          <div className="sa-menu-section">
            <h6 className="sa-menu-section-title">Navegación</h6>
            <Link
              className="sa-menu-item active"
              to="/Superadmin"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right sa-menu-arrow"></i>
            </Link>
          </div>
          <div className="sa-menu-section">
            <h6 className="sa-menu-section-title">Módulos</h6>
            <Link
              className="sa-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right sa-menu-arrow"></i>
            </Link>
            <Link
              className="sa-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right sa-menu-arrow"></i>
            </Link>
            <Link
              className="sa-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right sa-menu-arrow"></i>
            </Link>
            {showAreasComunes && (
              <Link
                className="sa-menu-item"
                to="/AreasComunes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-calendar2-event"></i>
                <span>Áreas Comunes</span>
                <i className="bi bi-chevron-right sa-menu-arrow"></i>
              </Link>
            )}
            <Link
              className="sa-menu-item"
              to="/Residentes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-house-door"></i>
              <span>Residentes</span>
              <i className="bi bi-chevron-right sa-menu-arrow"></i>
            </Link>
            <Link
              className="sa-menu-item"
              to="/Reportes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-graph-up-arrow"></i>
              <span>Reportes</span>
              <i className="bi bi-chevron-right sa-menu-arrow"></i>
            </Link>
            {showUserManagement && (
              <>
                <Link
                  className="sa-menu-item"
                  to="/Auditorias"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-journal-text"></i>
                  <span>Auditorías</span>
                  <i className="bi bi-chevron-right sa-menu-arrow"></i>
                </Link>
                <Link
                  className="sa-menu-item"
                  to="/LogErrores"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-bug"></i>
                  <span>Log de Errores</span>
                  <i className="bi bi-chevron-right sa-menu-arrow"></i>
                </Link>
                <Link
                  className="sa-menu-item"
                  to="/GestionUsuario"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Gestión Usuarios</span>
                  <i className="bi bi-chevron-right sa-menu-arrow"></i>
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="sa-drawer-footer">
          <button className="sa-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="sa-main">
        <header className="sa-header">
          <div className="sa-profile-btn-wrap">
            <button
              className="sa-header-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title="Ver perfil"
              style={{ overflow: "hidden" }}
            >
              {fotoUsuario ? (
                <img
                  src={fotoUsuario}
                  alt="Perfil"
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <i className="bi bi-person-circle"></i>
              )}
            </button>
            <span
              className="sa-profile-status-dot"
              title="Super Administrador activo"
            ></span>
          </div>

          {showUserMenu && (
            <div className="sa-profile-popup">
              <div className="sa-profile-popup-header">
                {fotoUsuario ? (
                  <img
                    src={fotoUsuario}
                    alt="Perfil"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <i className="bi bi-person-circle sa-profile-icon"></i>
                )}
              </div>
              <p>
                <strong>Nombre:</strong>{" "}
                {usuario?.username || usuario?.nombre || "Usuario"}
              </p>
              <p>
                <strong>Rol:</strong> Super Administrador
              </p>
              <p className="text-success">
                <strong>Estado:</strong> Activo
              </p>
              <button
                className="btn btn-sm btn-outline-secondary w-100 mt-2"
                onClick={() => setShowUserMenu(false)}
              >
                Cerrar
              </button>
            </div>
          )}

          <Link
            to="/Superadmin"
            className="sa-logo-wrapper"
            title="Ir al Dashboard"
          >
            <div className="sa-logo-circle">
              <img src={logo} alt="Logo" className="sa-logo-img" />
            </div>
          </Link>

          <div className="sa-header-actions">
            <DescargaAppMovil btnClass="sa-header-btn" />
            <ModoOscuro btnClass="sa-header-btn" />
            <button
              className="sa-header-btn"
              onClick={() => {
                setDataLoading(true);
                cargarDatos();
              }}
              disabled={dataLoading}
              title="Actualizar datos"
            >
              <i
                className={`bi ${dataLoading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            <button
              className="sa-header-btn sa-hamburger"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        <div className="sa-welcome">
          <h2 className="sa-welcome-title">
            Bienvenido, {usuario?.username || usuario?.nombre || "Usuario"}
          </h2>
          <p className="sa-welcome-sub">
            Selecciona el módulo que deseas gestionar en la plataforma
          </p>
        </div>

        <div className="sa-modules-grid">
          {modulos.map((mod) => (
            <Link
              to={mod.to}
              key={mod.to}
              className="sa-module-card"
              style={{
                background: `linear-gradient(135deg, ${mod.color}cc, ${mod.color})`,
              }}
            >
              <div className="sa-module-icon-wrap">
                <i className={`bi ${mod.icon}`}></i>
              </div>
              <span className="sa-module-title">{mod.title}</span>
            </Link>
          ))}
        </div>

        <div className="sa-stats-section">
          <h3 className="sa-stats-title">Estadísticas del Día</h3>
          <div className="sa-stats-grid">
            {/* Paquetes */}
            <div className="sa-stat-card">
              <div className="sa-stat-card-header">
                <i
                  className="bi bi-box-seam-fill"
                  style={{ color: "#3b82f6", fontSize: "28px" }}
                ></i>
                <h5>Paquetes Entregados Hoy</h5>
              </div>
              <div className="sa-bar-chart-container">
                <canvas ref={paquetesCanvasRef}></canvas>
              </div>
              <div className="sa-stat-summary">
                <div className="sa-stat-summary-item">
                  <span
                    className="sa-stat-big-number"
                    style={{ color: "#22c55e" }}
                  >
                    {paquetesEntregados}
                  </span>
                  <span className="sa-stat-label">Entregados</span>
                </div>
                <div className="sa-stat-divider"></div>
                <div className="sa-stat-summary-item">
                  <span
                    className="sa-stat-big-number"
                    style={{ color: "#3b82f6" }}
                  >
                    {porcentajeEntregados}%
                  </span>
                  <span className="sa-stat-label">Eficiencia</span>
                </div>
              </div>
            </div>

            {/* Parqueaderos */}
            <Link to="/parqueaderos" className="sa-stat-card sa-stat-card-link">
              <div className="sa-stat-card-header">
                <i
                  className="bi bi-p-circle-fill"
                  style={{ color: "#a855f7", fontSize: "28px" }}
                ></i>
                <h5>Parqueaderos Visitantes</h5>
                <i
                  className="bi bi-chevron-right"
                  style={{ color: "#9ca3af", marginLeft: "auto" }}
                ></i>
              </div>
              <div className="sa-donut-chart-container">
                <canvas ref={parqueoCanvasRef}></canvas>
              </div>
              <div className="sa-legend">
                {[
                  { label: "Carros", value: parqueosCarros, color: "#0d9488" },
                  { label: "Motos", value: parqueosMotos, color: "#f97316" },
                  { label: "Libres", value: parqueosLibres, color: "#d1d5db" },
                ].map((item) => (
                  <div className="sa-legend-item" key={item.label}>
                    <span
                      className="sa-legend-dot"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="sa-legend-label">{item.label}</span>
                    <span className="sa-legend-value">
                      {item.value} ({calcPctStr(item.value, totalParqueos)}%)
                    </span>
                  </div>
                ))}
              </div>
            </Link>

            {/* Visitas del Día */}
            <Link to="/visitas" className="sa-stat-card sa-stat-card-link">
              <div className="sa-stat-card-header">
                <i
                  className="bi bi-people-fill"
                  style={{ color: "#22c55e", fontSize: "28px" }}
                ></i>
                <h5>Visitas del Día</h5>
                <i
                  className="bi bi-chevron-right"
                  style={{ color: "#9ca3af", marginLeft: "auto" }}
                ></i>
              </div>
              <div className="sa-bar-chart-container">
                <canvas ref={visitasCanvasRef}></canvas>
              </div>
              <div className="sa-stat-summary">
                <div className="sa-stat-summary-item">
                  <span
                    className="sa-stat-big-number"
                    style={{ color: "#22c55e" }}
                  >
                    {visitasHoy}
                  </span>
                  <span className="sa-stat-label">Registradas Hoy</span>
                </div>
                <div className="sa-stat-divider"></div>
                <div className="sa-stat-summary-item">
                  <span
                    className="sa-stat-big-number"
                    style={{ color: "#3b82f6" }}
                  >
                    {visitasActivas}
                  </span>
                  <span className="sa-stat-label">Activas Ahora</span>
                </div>
              </div>
            </Link>

            {/* Reservas del Día */}
            <Link to="/AreasComunes" className="sa-stat-card sa-stat-card-link">
              <div className="sa-stat-card-header">
                <i
                  className="bi bi-calendar-event-fill"
                  style={{ color: "#f97316", fontSize: "28px" }}
                ></i>
                <h5>Reservas del Día</h5>
                <i
                  className="bi bi-chevron-right"
                  style={{ color: "#9ca3af", marginLeft: "auto" }}
                ></i>
              </div>
              <div className="sa-info-card-body">
                <div className="sa-info-big-value" style={{ color: "#f97316" }}>
                  {reservasHoy}
                </div>
                <span className="sa-info-sub-label">
                  Áreas comunes reservadas hoy
                </span>
              </div>
              <div className="sa-stat-summary">
                <div className="sa-stat-summary-item">
                  <span
                    className="sa-stat-big-number"
                    style={{ color: "#f97316" }}
                  >
                    {reservasHoy}
                  </span>
                  <span className="sa-stat-label">Total Hoy</span>
                </div>
                <div className="sa-stat-divider"></div>
                <div className="sa-stat-summary-item">
                  <span
                    className="sa-stat-big-number"
                    style={{ color: "#14b8a6" }}
                  >
                    {residentesActivos}
                  </span>
                  <span className="sa-stat-label">Residentes</span>
                </div>
              </div>
            </Link>

            {/* Usuarios en Línea */}
            {showUserManagement && (
              <Link
                to="/GestionUsuario"
                className="sa-stat-card sa-stat-card-link"
              >
                <div className="sa-stat-card-header">
                  <i
                    className="bi bi-broadcast"
                    style={{ color: "#a855f7", fontSize: "28px" }}
                  ></i>
                  <h5>Usuarios en Línea</h5>
                  <i
                    className="bi bi-chevron-right"
                    style={{ color: "#9ca3af", marginLeft: "auto" }}
                  ></i>
                </div>
                <div className="sa-online-header">
                  <span
                    className="sa-online-count"
                    style={{ color: "#a855f7" }}
                  >
                    {totalEnLinea}
                  </span>
                  <span className="sa-online-label">
                    {totalEnLinea === 1
                      ? "usuario conectado"
                      : "usuarios conectados"}
                  </span>
                </div>
                <div className="sa-online-users-list">
                  {usuariosEnLinea.length > 0 ? (
                    usuariosEnLinea.map((username) => (
                      <div key={username} className="sa-online-user-item">
                        <span className="sa-online-dot"></span>
                        <span className="sa-online-username">{username}</span>
                      </div>
                    ))
                  ) : (
                    <div className="sa-online-empty">
                      <i
                        className="bi bi-wifi-off"
                        style={{ fontSize: "24px", color: "#d1d5db" }}
                      ></i>
                      <span>Ningún usuario en línea</span>
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
      <WhatsAppModal />
    </div>
  );
}

export default Dashboard;
