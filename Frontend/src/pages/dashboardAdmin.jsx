import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../Styles/dashboardAdmin.css";
import logo from "../../img/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";
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

function Dashboard() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const oscuro = useDarkMode();
  const { loading, usuario, fotoUsuario } = useSessionCheck();
  const {
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
  } = useDashboardData(!loading);

  // Canvas refs
  const parqueoCanvasRef = useRef(null);
  const paquetesCanvasRef = useRef(null);
  const visitasCanvasRef = useRef(null);

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
      <div className="adm-loading-screen">
        <output className="spinner-border" style={{ color: "#eab308" }}>
          <span className="visually-hidden">Cargando...</span>
        </output>
        <p className="mt-3 fw-semibold" style={{ color: "#eab308" }}>
          Verificando sesión...
        </p>
      </div>
    );
  }

  const totalPaquetes = paquetesEntregados + paquetesPendientes;
  const porcentajeEntregados =
    totalPaquetes > 0
      ? ((paquetesEntregados / totalPaquetes) * 100).toFixed(0)
      : 0;
  const totalParqueos = parqueosCarros + parqueosMotos + parqueosLibres;

  const modulos = [
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
    {
      icon: "bi-building",
      title: "Áreas Comunes",
      color: "#f97316",
      to: "/AreasComunes",
    },
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
  ];

  return (
    <>
      <div className={`adm-dashboard${saliendo ? " adm-saliendo" : ""}`}>
        <button
          type="button"
          className={`adm-overlay ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMenuOpen(false);
          }}
          tabIndex={0}
          aria-label="Cerrar menú"
        />
        <aside className={`adm-drawer ${menuOpen ? "open" : ""}`}>
          <div className="adm-drawer-header">
            <div className="adm-drawer-avatar">
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
                <i className="bi bi-person-gear"></i>
              )}
            </div>
            <h4 className="adm-drawer-title">Menú Administrador</h4>
            <span className="adm-drawer-user">
              {usuario?.username || usuario?.nombre || "Usuario"}
            </span>
          </div>
          <div className="adm-drawer-body">
            <div className="adm-menu-section">
              <h6 className="adm-menu-section-title">Navegación</h6>
              <Link
                className="adm-menu-item active"
                to="/Admin"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-speedometer2"></i>
                <span>Dashboard</span>
                <i className="bi bi-chevron-right adm-menu-arrow"></i>
              </Link>
            </div>
            <div className="adm-menu-section">
              <h6 className="adm-menu-section-title">Módulos</h6>
              <Link
                className="adm-menu-item"
                to="/Paqueteria"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-box-seam"></i>
                <span>Paquetería</span>
                <i className="bi bi-chevron-right adm-menu-arrow"></i>
              </Link>
              <Link
                className="adm-menu-item"
                to="/visitas"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-people"></i>
                <span>Visitas</span>
                <i className="bi bi-chevron-right adm-menu-arrow"></i>
              </Link>
              <Link
                className="adm-menu-item"
                to="/parqueaderos"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-p-circle"></i>
                <span>Parqueaderos</span>
                <i className="bi bi-chevron-right adm-menu-arrow"></i>
              </Link>
              <Link
                className="adm-menu-item"
                to="/AreasComunes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-calendar2-event"></i>
                <span>Áreas Comunes</span>
                <i className="bi bi-chevron-right adm-menu-arrow"></i>
              </Link>
              <Link
                className="adm-menu-item"
                to="/Residentes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-house-door"></i>
                <span>Residentes</span>
                <i className="bi bi-chevron-right adm-menu-arrow"></i>
              </Link>
              <Link
                className="adm-menu-item"
                to="/Reportes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-graph-up-arrow"></i>
                <span>Reportes</span>
                <i className="bi bi-chevron-right adm-menu-arrow"></i>
              </Link>
            </div>
          </div>
          <div className="adm-drawer-footer">
            <button className="adm-logout-btn" onClick={cerrarSesion}>
              <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
            </button>
          </div>
        </aside>

        <div className="adm-main">
          <header className="adm-header">
            <div className="adm-profile-btn-wrap">
              <button
                className="adm-header-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="Ver perfil"
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
                className="adm-profile-status-dot"
                title="Administrador activo"
              ></span>
            </div>

            {showUserMenu && (
              <div className="adm-profile-popup">
                <div className="adm-profile-popup-header">
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
                    <i className="bi bi-person-circle adm-profile-icon"></i>
                  )}
                </div>
                <p>
                  <strong>Nombre:</strong>{" "}
                  {usuario?.username || usuario?.nombre || "Usuario"}
                </p>
                <p>
                  <strong>Rol:</strong> Administrador
                </p>
                <p style={{ color: "#eab308" }}>
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
              to="/Admin"
              className="adm-logo-wrapper"
              title="Ir al Dashboard"
            >
              <div className="adm-logo-circle">
                <img src={logo} alt="Logo" className="adm-logo-img" />
              </div>
            </Link>

            <div className="adm-header-actions">
              <DescargaAppMovil btnClass="adm-header-btn" />
              <ModoOscuro btnClass="adm-header-btn" />
              <button
                className="adm-header-btn"
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
                className="adm-header-btn adm-hamburger"
                onClick={() => setMenuOpen(true)}
                title="Abrir menú"
              >
                <i className="bi bi-list"></i>
              </button>
            </div>
          </header>

          <div className="adm-welcome">
            <h2 className="adm-welcome-title">
              Bienvenido, {usuario?.username || usuario?.nombre || "Usuario"}
            </h2>
            <p className="adm-welcome-sub">
              Selecciona el módulo que deseas gestionar en la plataforma
            </p>
          </div>

          <div className="adm-modules-grid">
            {modulos.map((mod) => (
              <Link
                to={mod.to}
                key={mod.to}
                className="adm-module-card"
                style={{
                  background: `linear-gradient(135deg, ${mod.color}cc, ${mod.color})`,
                }}
              >
                <div className="adm-module-icon-wrap">
                  <i className={`bi ${mod.icon}`}></i>
                </div>
                <span className="adm-module-title">{mod.title}</span>
              </Link>
            ))}
          </div>

          <div className="adm-stats-section">
            <h3 className="adm-stats-title">Estadísticas del Día</h3>
            <div className="adm-stats-grid">
              {/* Paquetes */}
              <div className="adm-stat-card">
                <div className="adm-stat-card-header">
                  <i
                    className="bi bi-box-seam-fill"
                    style={{ color: "#3b82f6", fontSize: "28px" }}
                  ></i>
                  <h5>Paquetes Entregados Hoy</h5>
                </div>
                <div className="adm-bar-chart-container">
                  <canvas ref={paquetesCanvasRef}></canvas>
                </div>
                <div className="adm-stat-summary">
                  <div className="adm-stat-summary-item">
                    <span
                      className="adm-stat-big-number"
                      style={{ color: "#22c55e" }}
                    >
                      {paquetesEntregados}
                    </span>
                    <span className="adm-stat-label">Entregados</span>
                  </div>
                  <div className="adm-stat-divider"></div>
                  <div className="adm-stat-summary-item">
                    <span
                      className="adm-stat-big-number"
                      style={{ color: "#3b82f6" }}
                    >
                      {porcentajeEntregados}%
                    </span>
                    <span className="adm-stat-label">Eficiencia</span>
                  </div>
                </div>
              </div>

              {/* Parqueaderos */}
              <Link
                to="/parqueaderos"
                className="adm-stat-card adm-stat-card-link"
              >
                <div className="adm-stat-card-header">
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
                <div className="adm-donut-chart-container">
                  <canvas ref={parqueoCanvasRef}></canvas>
                </div>
                <div className="adm-legend">
                  {[
                    {
                      label: "Carros",
                      value: parqueosCarros,
                      color: "#0d9488",
                    },
                    { label: "Motos", value: parqueosMotos, color: "#f97316" },
                    {
                      label: "Libres",
                      value: parqueosLibres,
                      color: "#d1d5db",
                    },
                  ].map((item) => (
                    <div className="adm-legend-item" key={item.label}>
                      <span
                        className="adm-legend-dot"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="adm-legend-label">{item.label}</span>
                      <span className="adm-legend-value">
                        {item.value} (
                        {totalParqueos > 0
                          ? ((item.value / totalParqueos) * 100).toFixed(0)
                          : 0}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </Link>

              {/* Visitas del Día */}
              <Link to="/visitas" className="adm-stat-card adm-stat-card-link">
                <div className="adm-stat-card-header">
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
                <div className="adm-bar-chart-container">
                  <canvas ref={visitasCanvasRef}></canvas>
                </div>
                <div className="adm-stat-summary">
                  <div className="adm-stat-summary-item">
                    <span
                      className="adm-stat-big-number"
                      style={{ color: "#22c55e" }}
                    >
                      {visitasHoy}
                    </span>
                    <span className="adm-stat-label">Registradas Hoy</span>
                  </div>
                  <div className="adm-stat-divider"></div>
                  <div className="adm-stat-summary-item">
                    <span
                      className="adm-stat-big-number"
                      style={{ color: "#3b82f6" }}
                    >
                      {visitasActivas}
                    </span>
                    <span className="adm-stat-label">Activas Ahora</span>
                  </div>
                </div>
              </Link>

              {/* Reservas del Día */}
              <Link
                to="/AreasComunes"
                className="adm-stat-card adm-stat-card-link"
              >
                <div className="adm-stat-card-header">
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
                <div className="adm-info-card-body">
                  <div
                    className="adm-info-big-value"
                    style={{ color: "#f97316" }}
                  >
                    {reservasHoy}
                  </div>
                  <span className="adm-info-sub-label">
                    Áreas comunes reservadas hoy
                  </span>
                </div>
                <div className="adm-stat-summary">
                  <div className="adm-stat-summary-item">
                    <span
                      className="adm-stat-big-number"
                      style={{ color: "#f97316" }}
                    >
                      {reservasHoy}
                    </span>
                    <span className="adm-stat-label">Total Hoy</span>
                  </div>
                  <div className="adm-stat-divider"></div>
                  <div className="adm-stat-summary-item">
                    <span
                      className="adm-stat-big-number"
                      style={{ color: "#14b8a6" }}
                    >
                      {residentesActivos}
                    </span>
                    <span className="adm-stat-label">Residentes</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppModal />
    </>
  );
}

export default Dashboard;
