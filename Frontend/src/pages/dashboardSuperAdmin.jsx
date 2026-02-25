import React, { useEffect, useRef, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "../Styles/dashboardSuperAdmin.css";
import logo from "../../img/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { obtenerResumenDashboard } from "../services/dashboard.services.jsx";
import {
  obtenerUsuariosEnLinea,
  logoutUsuario,
} from "../services/gestionUsuarios.jsx";
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
  const chartRef = useRef(null);
  const barChartRef = useRef(null);
  const visitasChartRef = useRef(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fotoUsuario, setFotoUsuario] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);

  // Datos del dashboard desde /api/dashboard/resumen
  const [paquetesEntregados, setPaquetesEntregados] = useState(0);
  const [paquetesPendientes, setPaquetesPendientes] = useState(0);
  const [parqueosCarros, setParqueosCarros] = useState(0);
  const [parqueosMotos, setParqueosMotos] = useState(0);
  const [parqueosLibres, setParqueosLibres] = useState(0);
  const [visitasHoy, setVisitasHoy] = useState(0);
  const [visitasActivas, setVisitasActivas] = useState(0);
  const [reservasHoy, setReservasHoy] = useState(0);
  const [residentesActivos, setResidentesActivos] = useState(0);
  const [usuariosEnLinea, setUsuariosEnLinea] = useState([]);

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
  const [totalEnLinea, setTotalEnLinea] = useState(0);

  // Token / roles helpers
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
  const tokenValido = tokenLocal && !verificarTokenVencido(tokenLocal);
  const rolesId = tokenLocal ? obtenerRolFromToken(tokenLocal) : null;
  const showUserManagement = tokenValido && rolesId === 1;
  const showAreasComunes = tokenValido && rolesId !== 3;

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
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/usuario`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        setUsuario(data.usuario);
        localStorage.setItem("user", JSON.stringify(data.usuario));
        setLoading(false);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigator("/");
      }
    })();
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

  // Cargar datos del dashboard (unificado como en Flutter)
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
        setParqueosCarros(Math.max(0, datos.parqueaderos?.ocupadosCarros ?? 0));
        setParqueosMotos(Math.max(0, datos.parqueaderos?.ocupadosMotos ?? 0));
        setParqueosLibres(Math.max(0, datos.parqueaderos?.disponibles ?? 0));
        setVisitasHoy(datos.visitas?.hoy ?? 0);
        setVisitasActivas(datos.visitas?.activas ?? 0);
        setReservasHoy(datos.reservas?.hoy ?? 0);
        setResidentesActivos(datos.residentes?.activos ?? 0);
      }

      // Obtener usuarios en línea
      try {
        const enLineaData = await obtenerUsuariosEnLinea(token);
        const nombres = Object.keys(enLineaData);
        setUsuariosEnLinea(nombres);
        setTotalEnLinea(nombres.length);
      } catch (err) {
        // Error al obtener usuarios en linea
      }
    } catch (error) {
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      cargarDatos();
    }
  }, [loading, cargarDatos]);

  // Gráfico de Donut para parqueaderos
  useEffect(() => {
    if (loading || dataLoading) return;
    const ctx = document.getElementById("parqueoChart");
    if (!ctx) return;

    if (chartRef.current) chartRef.current.destroy();

    const totalParqueos = parqueosCarros + parqueosMotos + parqueosLibres;

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Carros", "Motos", "Libres"],
        datasets: [
          {
            data: [parqueosCarros, parqueosMotos, parqueosLibres],
            backgroundColor: ["#0d9488", "#f97316", "#d1d5db"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "50%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipCtx) => {
                const pct =
                  totalParqueos > 0
                    ? ((tooltipCtx.raw / totalParqueos) * 100).toFixed(0)
                    : 0;
                return `${tooltipCtx.label}: ${tooltipCtx.raw} (${pct}%)`;
              },
            },
          },
        },
      },
      plugins: [
        {
          id: "centerText",
          beforeDraw(chart) {
            const { width, height, ctx: drawCtx } = chart;
            drawCtx.save();
            const ocupados = parqueosCarros + parqueosMotos;
            drawCtx.font = "bold 28px Arial";
            drawCtx.fillStyle = oscuro ? "#e2e8f0" : "#1f2937";
            drawCtx.textAlign = "center";
            drawCtx.textBaseline = "middle";
            drawCtx.fillText(ocupados, width / 2, height / 2 - 10);
            drawCtx.font = "14px Arial";
            drawCtx.fillStyle = oscuro ? "#94a3b8" : "#6b7280";
            drawCtx.fillText("Ocupados", width / 2, height / 2 + 14);
            drawCtx.restore();
          },
        },
      ],
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [
    loading,
    dataLoading,
    parqueosCarros,
    parqueosMotos,
    parqueosLibres,
    oscuro,
  ]);

  // Gráfico de barras para paquetes
  useEffect(() => {
    if (loading || dataLoading) return;
    const ctx = document.getElementById("paquetesBarChart");
    if (!ctx) return;

    if (barChartRef.current) barChartRef.current.destroy();

    barChartRef.current = new Chart(ctx, {
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
      if (barChartRef.current) barChartRef.current.destroy();
    };
  }, [loading, dataLoading, paquetesEntregados, paquetesPendientes, oscuro]);

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
              "rgba(34, 197, 94, 0.85)",
              "rgba(59, 130, 246, 0.85)",
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

  // Auto-refresh cada 30 segundos para usuarios en línea
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
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
    }, 30000);
    return () => clearInterval(interval);
  }, [loading]);

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
      <div className="sa-loading-screen">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-success fw-semibold">Verificando sesión...</p>
      </div>
    );
  }

  const totalPaquetes = paquetesEntregados + paquetesPendientes;
  const porcentajeEntregados =
    totalPaquetes > 0
      ? ((paquetesEntregados / totalPaquetes) * 100).toFixed(0)
      : 0;
  const totalParqueos = parqueosCarros + parqueosMotos + parqueosLibres;

  // Definición de módulos (como en Flutter)
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
    ...(showAreasComunes
      ? [
          {
            icon: "bi-building",
            title: "Áreas Comunes",
            color: "#f97316",
            to: "/AreasComunes",
          },
        ]
      : []),
    ...(showUserManagement
      ? [
          {
            icon: "bi-shield-lock-fill",
            title: "Gestión de Usuarios",
            color: "#a855f7",
            to: "/GestionUsuario",
          },
        ]
      : []),
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
    ...(showUserManagement
      ? [
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
        ]
      : []),
  ];

  return (
    <div className={`sa-dashboard${saliendo ? " sa-saliendo" : ""}`}>
      {/* ====== OFFCANVAS MENU (hamburguesa como Flutter) ====== */}
      <div
        className={`sa-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
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
          {/* Navegación */}
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

          {/* Módulos */}
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
            <i className="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="sa-main">
        {/* Header / AppBar (como Flutter) */}
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

        {/* Bienvenida */}
        <div className="sa-welcome">
          <h2 className="sa-welcome-title">
            Bienvenido, {usuario?.username || usuario?.nombre || "Usuario"}
          </h2>
          <p className="sa-welcome-sub">
            Selecciona el módulo que deseas gestionar en la plataforma
          </p>
        </div>

        {/* Tarjetas de módulos (como Flutter: iconos + gradientes) */}
        <div className="sa-modules-grid">
          {modulos.map((mod, idx) => (
            <Link
              to={mod.to}
              key={idx}
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

        {/* Sección de estadísticas (como Flutter) */}
        <div className="sa-stats-section">
          <h3 className="sa-stats-title">Estadísticas del Día</h3>

          <div className="sa-stats-grid">
            {/* Tarjeta de Paquetes */}
            <div className="sa-stat-card">
              <div className="sa-stat-card-header">
                <i
                  className="bi bi-box-seam-fill"
                  style={{ color: "#3b82f6", fontSize: "28px" }}
                ></i>
                <h5>Paquetes Entregados Hoy</h5>
              </div>

              <div className="sa-bar-chart-container">
                <canvas id="paquetesBarChart"></canvas>
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

            {/* Tarjeta de Parqueaderos */}
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
                <canvas id="parqueoChart"></canvas>
              </div>

              <div className="sa-legend">
                <div className="sa-legend-item">
                  <span
                    className="sa-legend-dot"
                    style={{ backgroundColor: "#0d9488" }}
                  ></span>
                  <span className="sa-legend-label">Carros</span>
                  <span className="sa-legend-value">
                    {parqueosCarros} (
                    {totalParqueos > 0
                      ? ((parqueosCarros / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="sa-legend-item">
                  <span
                    className="sa-legend-dot"
                    style={{ backgroundColor: "#f97316" }}
                  ></span>
                  <span className="sa-legend-label">Motos</span>
                  <span className="sa-legend-value">
                    {parqueosMotos} (
                    {totalParqueos > 0
                      ? ((parqueosMotos / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="sa-legend-item">
                  <span
                    className="sa-legend-dot"
                    style={{ backgroundColor: "#d1d5db" }}
                  ></span>
                  <span className="sa-legend-label">Libres</span>
                  <span className="sa-legend-value">
                    {parqueosLibres} (
                    {totalParqueos > 0
                      ? ((parqueosLibres / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Visitas del Día */}
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
                <canvas id="visitasBarChart"></canvas>
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

            {/* Tarjeta de Reservas del Día */}
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

            {/* Tarjeta de Usuarios en Línea */}
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
