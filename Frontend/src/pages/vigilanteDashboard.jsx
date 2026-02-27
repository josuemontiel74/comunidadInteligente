import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../Styles/dashboardVigilante.css";
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
import { barChartConfig, useChart } from "../utils/chartConfigs.js";

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
    visitasHoy,
    visitasActivas,
  } = useDashboardData(!loading);

  // Canvas refs
  const visitasCanvasRef = useRef(null);
  const paquetesCanvasRef = useRef(null);

  // Gráficos
  const ready = !loading && !dataLoading;
  useChart(
    visitasCanvasRef,
    ready
      ? barChartConfig(
          ["Hoy", "Activas"],
          [visitasHoy, visitasActivas],
          ["rgba(59, 130, 246, 0.85)", "rgba(34, 197, 94, 0.85)"],
          "visitas",
          oscuro,
        )
      : null,
    [ready, visitasHoy, visitasActivas, oscuro],
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

  const cerrarSesion = async (e) => {
    e.preventDefault();
    setSaliendo(true);
    setTimeout(async () => {
      const token = localStorage.getItem("token");
      if (token) await logoutUsuario(token);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("/login");
    }, 380);
  };

  if (loading) {
    return (
      <div className="vi-loading-screen">
        <output className="spinner-border" style={{ color: "#3b82f6" }}>
          <span className="visually-hidden">Cargando...</span>
        </output>
        <p className="mt-3 fw-semibold" style={{ color: "#3b82f6" }}>
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
  ];

  return (
    <div className={`vi-dashboard${saliendo ? " vi-saliendo" : ""}`}>
      {/* ====== OFFCANVAS MENU ====== */}
      <button
        type="button"
        className={`vi-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        tabIndex={0}
        aria-label="Cerrar menú"
      />
      <aside className={`vi-drawer ${menuOpen ? "open" : ""}`}>
        <div className="vi-drawer-header">
          <div className="vi-drawer-avatar">
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
              <i className="bi bi-shield-check"></i>
            )}
          </div>
          <h4 className="vi-drawer-title">Menú Vigilante</h4>
          <span className="vi-drawer-user">
            {usuario?.username || usuario?.nombre || "Usuario"}
          </span>
        </div>
        <div className="vi-drawer-body">
          <div className="vi-menu-section">
            <h6 className="vi-menu-section-title">Navegación</h6>
            <Link
              className="vi-menu-item active"
              to="/Vigilante"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right vi-menu-arrow"></i>
            </Link>
          </div>
          <div className="vi-menu-section">
            <h6 className="vi-menu-section-title">Módulos</h6>
            <Link
              className="vi-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right vi-menu-arrow"></i>
            </Link>
            <Link
              className="vi-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right vi-menu-arrow"></i>
            </Link>
            <Link
              className="vi-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right vi-menu-arrow"></i>
            </Link>
          </div>
        </div>
        <div className="vi-drawer-footer">
          <button className="vi-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="vi-main">
        <header className="vi-header">
          <div className="vi-profile-btn-wrap">
            <button
              className="vi-header-btn"
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
              className="vi-profile-status-dot"
              title="Vigilante activo"
            ></span>
          </div>

          {showUserMenu && (
            <div className="vi-profile-popup">
              <div className="vi-profile-popup-header">
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
                  <i className="bi bi-person-circle vi-profile-icon"></i>
                )}
              </div>
              <p>
                <strong>Nombre:</strong>{" "}
                {usuario?.username || usuario?.nombre || "Usuario"}
              </p>
              <p>
                <strong>Rol:</strong> Vigilante
              </p>
              <p style={{ color: "#3b82f6" }}>
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
            to="/Vigilante"
            className="vi-logo-wrapper"
            title="Ir al Dashboard"
          >
            <div className="vi-logo-circle">
              <img src={logo} alt="Logo" className="vi-logo-img" />
            </div>
          </Link>

          <div className="vi-header-actions">
            <DescargaAppMovil btnClass="vi-header-btn" />
            <ModoOscuro btnClass="vi-header-btn" />
            <button
              className="vi-header-btn"
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
              className="vi-header-btn vi-hamburger"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        <div className="vi-welcome">
          <h2 className="vi-welcome-title">
            Bienvenido, {usuario?.username || usuario?.nombre || "Usuario"}
          </h2>
          <p className="vi-welcome-sub">
            Selecciona el módulo que deseas gestionar en la plataforma
          </p>
        </div>

        <div className="vi-modules-grid">
          {modulos.map((mod) => (
            <Link
              to={mod.to}
              key={mod.to}
              className="vi-module-card"
              style={{
                background: `linear-gradient(135deg, ${mod.color}cc, ${mod.color})`,
              }}
            >
              <div className="vi-module-icon-wrap">
                <i className={`bi ${mod.icon}`}></i>
              </div>
              <span className="vi-module-title">{mod.title}</span>
            </Link>
          ))}
        </div>

        <div className="vi-stats-section">
          <h3 className="vi-stats-title">Estadísticas del Día</h3>
          <div className="vi-stats-grid">
            {/* Visitas del Día */}
            <Link to="/visitas" className="vi-stat-card vi-stat-card-link">
              <div className="vi-stat-card-header">
                <i
                  className="bi bi-people-fill"
                  style={{ color: "#3b82f6", fontSize: "28px" }}
                ></i>
                <h5>Visitas del Día</h5>
                <i
                  className="bi bi-chevron-right"
                  style={{ color: "#9ca3af", marginLeft: "auto" }}
                ></i>
              </div>
              <div className="vi-bar-chart-container">
                <canvas ref={visitasCanvasRef}></canvas>
              </div>
              <div className="vi-stat-summary">
                <div className="vi-stat-summary-item">
                  <span
                    className="vi-stat-big-number"
                    style={{ color: "#3b82f6" }}
                  >
                    {visitasHoy}
                  </span>
                  <span className="vi-stat-label">Registradas Hoy</span>
                </div>
                <div className="vi-stat-divider"></div>
                <div className="vi-stat-summary-item">
                  <span
                    className="vi-stat-big-number"
                    style={{ color: "#22c55e" }}
                  >
                    {visitasActivas}
                  </span>
                  <span className="vi-stat-label">Activas Ahora</span>
                </div>
              </div>
            </Link>

            {/* Paquetes */}
            <Link to="/Paqueteria" className="vi-stat-card vi-stat-card-link">
              <div className="vi-stat-card-header">
                <i
                  className="bi bi-box-seam-fill"
                  style={{ color: "#3b82f6", fontSize: "28px" }}
                ></i>
                <h5>Paquetes del Día</h5>
                <i
                  className="bi bi-chevron-right"
                  style={{ color: "#9ca3af", marginLeft: "auto" }}
                ></i>
              </div>
              <div className="vi-bar-chart-container">
                <canvas ref={paquetesCanvasRef}></canvas>
              </div>
              <div className="vi-stat-summary">
                <div className="vi-stat-summary-item">
                  <span
                    className="vi-stat-big-number"
                    style={{ color: "#22c55e" }}
                  >
                    {paquetesEntregados}
                  </span>
                  <span className="vi-stat-label">Entregados</span>
                </div>
                <div className="vi-stat-divider"></div>
                <div className="vi-stat-summary-item">
                  <span
                    className="vi-stat-big-number"
                    style={{ color: "#3b82f6" }}
                  >
                    {porcentajeEntregados}%
                  </span>
                  <span className="vi-stat-label">Eficiencia</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <WhatsAppModal />
    </div>
  );
}

export default Dashboard;
