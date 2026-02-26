import React, { useEffect, useRef, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "../Styles/dashboardVigilante.css";
import logo from "../../img/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { obtenerResumenDashboard } from "../services/dashboard.services.jsx";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";
import { API_BASE } from "../services/api.config.js";
import DescargaAppMovil from "./DescargaAppMovil.jsx";
import ModoOscuro from "./ModoOscuro.jsx";
import WhatsAppModal from "./WhatsAppModal.jsx";

const PHOTO_STORAGE_KEY = "gu_user_photos";
const getUserProfilePhoto = (key) => {
  try {
    const photos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || "{}");
    return photos[key] || null;
  } catch {
    return null;
  }
};

function Dashboard() {
  const navigator = useNavigate();
  const visitasChartRef = useRef(null);
  const paquetesChartRef = useRef(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fotoUsuario, setFotoUsuario] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);

  // Datos del dashboard
  const [paquetesEntregados, setPaquetesEntregados] = useState(0);
  const [paquetesPendientes, setPaquetesPendientes] = useState(0);
  const [visitasHoy, setVisitasHoy] = useState(0);
  const [visitasActivas, setVisitasActivas] = useState(0);

  // Modo oscuro – reactive para re-renderizar gráficas
  const [oscuro, setOscuro] = useState(
    () => document.documentElement.dataset.modo === "oscuro",
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setOscuro(document.documentElement.dataset.modo === "oscuro"),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-modo"],
    });
    return () => obs.disconnect();
  }, []);

  // Verificar sesión
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
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
        setLoading(false);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigator("/");
      }
    } else {
      fetch(`${API_BASE}/usuario`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("No autorizado");
          return res.json();
        })
        .then((data) => {
          setUsuario(data.usuario);
          localStorage.setItem("user", JSON.stringify(data.usuario));
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigator("/");
        });
    }
  }, [navigator]);

  // Cargar foto de perfil
  useEffect(() => {
    if (usuario) {
      setFotoUsuario(
        usuario.fotoPerfil ||
          getUserProfilePhoto(usuario.numeroDocumento) ||
          getUserProfilePhoto(usuario.username) ||
          null,
      );
    }
  }, [usuario]);

  // Cargar datos del dashboard
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
        setVisitasHoy(datos.visitas?.hoy ?? 0);
        setVisitasActivas(datos.visitas?.activas ?? 0);
      }
    } catch {
      /* error de red ignorado, el dashboard muestra 0s */
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      cargarDatos();
    }
  }, [loading, cargarDatos]);

  // Gráfico de barras para visitas del día
  useEffect(() => {
    if (loading || dataLoading) return;
    const ctx = document.getElementById("visitasBarChart");
    if (!ctx) return;

    if (visitasChartRef.current) visitasChartRef.current.destroy();

    visitasChartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Hoy", "Activas"],
        datasets: [
          {
            data: [visitasHoy, visitasActivas],
            backgroundColor: [
              "rgba(59, 130, 246, 0.85)",
              "rgba(34, 197, 94, 0.85)",
            ],
            borderRadius: 12,
            borderSkipped: false,
            barThickness: 60,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipCtx) => `${tooltipCtx.raw} visitas`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: oscuro ? "#94a3b8" : "#6b7280" },
            grid: {
              color: oscuro ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            },
          },
          x: {
            ticks: {
              color: oscuro ? "#e2e8f0" : "#374151",
              font: { weight: "500" },
            },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      if (visitasChartRef.current) visitasChartRef.current.destroy();
    };
  }, [loading, dataLoading, visitasHoy, visitasActivas, oscuro]);

  // Gráfico de barras para paquetes
  useEffect(() => {
    if (loading || dataLoading) return;
    const ctx = document.getElementById("paquetesBarChart");
    if (!ctx) return;

    if (paquetesChartRef.current) paquetesChartRef.current.destroy();

    paquetesChartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Entregados", "Pendientes"],
        datasets: [
          {
            data: [paquetesEntregados, paquetesPendientes],
            backgroundColor: [
              "rgba(34, 197, 94, 0.85)",
              "rgba(249, 115, 22, 0.85)",
            ],
            borderRadius: 12,
            borderSkipped: false,
            barThickness: 60,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipCtx) => `${tooltipCtx.raw} paquetes`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: oscuro ? "#94a3b8" : "#6b7280" },
            grid: {
              color: oscuro ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            },
          },
          x: {
            ticks: {
              color: oscuro ? "#e2e8f0" : "#374151",
              font: { weight: "500" },
            },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      if (paquetesChartRef.current) paquetesChartRef.current.destroy();
    };
  }, [loading, dataLoading, paquetesEntregados, paquetesPendientes, oscuro]);

  const cerrarSesion = async (e) => {
    e.preventDefault();
    setSaliendo(true);
    setTimeout(async () => {
      const token = localStorage.getItem("token");
      if (token) await logoutUsuario(token);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigator("/login", { replace: true });
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

  // Módulos del vigilante: Paquetería, Visitas y Parqueaderos
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
          {/* Navegación */}
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

          {/* Módulos */}
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
        {/* Header */}
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

        {/* Bienvenida */}
        <div className="vi-welcome">
          <h2 className="vi-welcome-title">
            Bienvenido, {usuario?.username || usuario?.nombre || "Usuario"}
          </h2>
          <p className="vi-welcome-sub">
            Selecciona el módulo que deseas gestionar en la plataforma
          </p>
        </div>

        {/* Tarjetas de módulos */}
        <div className="vi-modules-grid">
          {modulos.map((mod, idx) => (
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

        {/* Estadísticas */}
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
                <canvas id="visitasBarChart"></canvas>
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
                <canvas id="paquetesBarChart"></canvas>
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
