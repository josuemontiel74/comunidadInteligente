import React, { useEffect, useRef, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "../Styles/dashboardAdmin.css";
import logo from "../../img/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { obtenerResumenDashboard } from "../services/dashboard.services.jsx";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";

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

  // Canvas refs (evita document.getElementById que es inestable en React)
  const parqueoCanvasRef = useRef(null);
  const paquetesCanvasRef = useRef(null);
  const visitasCanvasRef = useRef(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fotoUsuario, setFotoUsuario] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);

  // Datos del dashboard
  const [paquetesEntregados, setPaquetesEntregados] = useState(0);
  const [paquetesPendientes, setPaquetesPendientes] = useState(0);
  const [parqueosCarros, setParqueosCarros] = useState(0);
  const [parqueosMotos, setParqueosMotos] = useState(0);
  const [parqueosLibres, setParqueosLibres] = useState(0);
  const [visitasHoy, setVisitasHoy] = useState(0);
  const [visitasActivas, setVisitasActivas] = useState(0);
  const [reservasHoy, setReservasHoy] = useState(0);
  const [residentesActivos, setResidentesActivos] = useState(0);

  // Token helpers
  const verificarTokenVencido = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };

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
      fetch("http://localhost:3001/api/usuario", {
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
        setParqueosCarros(Math.max(0, datos.parqueaderos?.ocupadosCarros ?? 0));
        setParqueosMotos(Math.max(0, datos.parqueaderos?.ocupadosMotos ?? 0));
        setParqueosLibres(Math.max(0, datos.parqueaderos?.disponibles ?? 0));
        setVisitasHoy(datos.visitas?.hoy ?? 0);
        setVisitasActivas(datos.visitas?.activas ?? 0);
        setReservasHoy(datos.reservas?.hoy ?? 0);
        setResidentesActivos(datos.residentes?.activos ?? 0);
      }
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      cargarDatos();
    }
  }, [loading, cargarDatos]);

  // Gráfico Donut parqueaderos
  useEffect(() => {
    if (loading || dataLoading) return;
    const ctx = parqueoCanvasRef.current;
    if (!ctx) return;

    try {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const totalParqueos = parqueosCarros + parqueosMotos + parqueosLibres;
      const ocupados = parqueosCarros + parqueosMotos;

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
              if (width === 0 || height === 0) return;
              drawCtx.save();
              drawCtx.font = "bold 28px Arial";
              drawCtx.fillStyle = "#1f2937";
              drawCtx.textAlign = "center";
              drawCtx.textBaseline = "middle";
              drawCtx.fillText(ocupados, width / 2, height / 2 - 10);
              drawCtx.font = "14px Arial";
              drawCtx.fillStyle = "#6b7280";
              drawCtx.fillText("Ocupados", width / 2, height / 2 + 14);
              drawCtx.restore();
            },
          },
        ],
      });
    } catch (err) {
      console.error("Error creando gráfico de parqueaderos:", err);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [loading, dataLoading, parqueosCarros, parqueosMotos, parqueosLibres]);

  // Gráfico de barras paquetes
  useEffect(() => {
    if (loading || dataLoading) return;
    const ctx = paquetesCanvasRef.current;
    if (!ctx) return;

    try {
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }

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
              ticks: { stepSize: 1, color: "#6b7280" },
              grid: { color: "rgba(0,0,0,0.05)" },
            },
            x: {
              ticks: { color: "#374151", font: { weight: "500" } },
              grid: { display: false },
            },
          },
        },
      });
    } catch (err) {
      console.error("Error creando gráfico de paquetes:", err);
    }

    return () => {
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }
    };
  }, [loading, dataLoading, paquetesEntregados, paquetesPendientes]);

  // Gráfico de barras visitas
  useEffect(() => {
    if (loading || dataLoading) return;
    const ctx = visitasCanvasRef.current;
    if (!ctx) return;

    try {
      if (visitasChartRef.current) {
        visitasChartRef.current.destroy();
        visitasChartRef.current = null;
      }

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
              ticks: { stepSize: 1, color: "#6b7280" },
              grid: { color: "rgba(0,0,0,0.05)" },
            },
            x: {
              ticks: { color: "#374151", font: { weight: "500" } },
              grid: { display: false },
            },
          },
        },
      });
    } catch (err) {
      console.error("Error creando gráfico de visitas:", err);
    }

    return () => {
      if (visitasChartRef.current) {
        visitasChartRef.current.destroy();
        visitasChartRef.current = null;
      }
    };
  }, [loading, dataLoading, visitasHoy, visitasActivas]);

  const cerrarSesion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) await logoutUsuario(token);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigator("/");
  };

  if (loading) {
    return (
      <div className="ad-loading-screen">
        <div
          className="spinner-border"
          role="status"
          style={{ color: "#eab308" }}
        >
          <span className="visually-hidden">Cargando...</span>
        </div>
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

  // Módulos del administrador
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
    <div className="ad-dashboard">
      {/* ====== OFFCANVAS MENU ====== */}
      <div
        className={`ad-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`ad-drawer ${menuOpen ? "open" : ""}`}>
        <div className="ad-drawer-header">
          <div className="ad-drawer-avatar">
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
          <h4 className="ad-drawer-title">Menú Administrador</h4>
          <span className="ad-drawer-user">
            {usuario?.username || usuario?.nombre || "Usuario"}
          </span>
        </div>

        <div className="ad-drawer-body">
          {/* Sección Paquetes */}
          <div className="ad-menu-section">
            <h6 className="ad-menu-section-title">Gestión de Paquetes</h6>
            <Link
              className="ad-menu-item"
              to="/Paqueteria"
              state={{ abrirModal: true }}
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-plus-box"></i>
              <span>Registrar Paquete</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
            <Link
              className="ad-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-clock-history"></i>
              <span>Historial de Paquetes</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
          </div>

          {/* Sección Visitas */}
          <div className="ad-menu-section">
            <h6 className="ad-menu-section-title">Gestión de Visitas</h6>
            <Link
              className="ad-menu-item"
              to="/visitas"
              state={{ abrirModal: true }}
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-calendar-event"></i>
              <span>Gestión de Visitas</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
            <Link
              className="ad-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Consultar Parqueadero</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
          </div>

          {/* Sección Áreas Comunes */}
          <div className="ad-menu-section">
            <h6 className="ad-menu-section-title">Gestión de Áreas Comunes</h6>
            <Link
              className="ad-menu-item"
              to="/AreasComunes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-gear"></i>
              <span>Gestionar Áreas</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
            <Link
              className="ad-menu-item"
              to="/AreasComunes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-calendar-plus"></i>
              <span>Registrar Reserva</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
          </div>

          {/* Sección Reportes */}
          <div className="ad-menu-section">
            <h6 className="ad-menu-section-title">Reportes</h6>
            <Link
              className="ad-menu-item"
              to="/Reportes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-bar-chart-line"></i>
              <span>Ver Reportes</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
          </div>

          {/* Sección Residentes */}
          <div className="ad-menu-section">
            <h6 className="ad-menu-section-title">Gestión de Residentes</h6>
            <Link
              className="ad-menu-item"
              to="/Residentes"
              state={{ abrirModal: true }}
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-house-add"></i>
              <span>Registrar Residentes</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
            <Link
              className="ad-menu-item"
              to="/Residentes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-list-ul"></i>
              <span>Consultar Residentes</span>
              <i className="bi bi-chevron-right ad-menu-arrow"></i>
            </Link>
          </div>
        </div>

        <div className="ad-drawer-footer">
          <button className="ad-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="ad-main">
        {/* Header */}
        <header className="ad-header">
          <button
            className="ad-header-btn"
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

          {showUserMenu && (
            <div className="ad-profile-popup">
              <div className="ad-profile-popup-header">
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
                  <i className="bi bi-person-circle ad-profile-icon"></i>
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

          <Link to="/Admin" className="ad-logo-wrapper" title="Ir al Dashboard">
            <div className="ad-logo-circle">
              <img src={logo} alt="Logo" className="ad-logo-img" />
            </div>
          </Link>

          <div className="ad-header-actions">
            <button
              className="ad-header-btn"
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
              className="ad-header-btn ad-hamburger"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        {/* Bienvenida */}
        <div className="ad-welcome">
          <h2 className="ad-welcome-title">
            Bienvenido, {usuario?.username || usuario?.nombre || "Usuario"}
          </h2>
          <p className="ad-welcome-sub">
            Selecciona el módulo que deseas gestionar en la plataforma
          </p>
        </div>

        {/* Tarjetas de módulos */}
        <div className="ad-modules-grid">
          {modulos.map((mod, idx) => (
            <Link
              to={mod.to}
              key={idx}
              className="ad-module-card"
              style={{
                background: `linear-gradient(135deg, ${mod.color}cc, ${mod.color})`,
              }}
            >
              <div className="ad-module-icon-wrap">
                <i className={`bi ${mod.icon}`}></i>
              </div>
              <span className="ad-module-title">{mod.title}</span>
            </Link>
          ))}
        </div>

        {/* Estadísticas */}
        <div className="ad-stats-section">
          <h3 className="ad-stats-title">Estadísticas del Día</h3>

          <div className="ad-stats-grid">
            {/* Paquetes */}
            <div className="ad-stat-card">
              <div className="ad-stat-card-header">
                <i
                  className="bi bi-box-seam-fill"
                  style={{ color: "#3b82f6", fontSize: "28px" }}
                ></i>
                <h5>Paquetes Entregados Hoy</h5>
              </div>

              <div className="ad-bar-chart-container">
                <canvas ref={paquetesCanvasRef}></canvas>
              </div>

              <div className="ad-stat-summary">
                <div className="ad-stat-summary-item">
                  <span
                    className="ad-stat-big-number"
                    style={{ color: "#22c55e" }}
                  >
                    {paquetesEntregados}
                  </span>
                  <span className="ad-stat-label">Entregados</span>
                </div>
                <div className="ad-stat-divider"></div>
                <div className="ad-stat-summary-item">
                  <span
                    className="ad-stat-big-number"
                    style={{ color: "#3b82f6" }}
                  >
                    {porcentajeEntregados}%
                  </span>
                  <span className="ad-stat-label">Eficiencia</span>
                </div>
              </div>
            </div>

            {/* Parqueaderos */}
            <Link to="/parqueaderos" className="ad-stat-card ad-stat-card-link">
              <div className="ad-stat-card-header">
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

              <div className="ad-donut-chart-container">
                <canvas ref={parqueoCanvasRef}></canvas>
              </div>

              <div className="ad-legend">
                <div className="ad-legend-item">
                  <span
                    className="ad-legend-dot"
                    style={{ backgroundColor: "#0d9488" }}
                  ></span>
                  <span className="ad-legend-label">Carros</span>
                  <span className="ad-legend-value">
                    {parqueosCarros} (
                    {totalParqueos > 0
                      ? ((parqueosCarros / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="ad-legend-item">
                  <span
                    className="ad-legend-dot"
                    style={{ backgroundColor: "#f97316" }}
                  ></span>
                  <span className="ad-legend-label">Motos</span>
                  <span className="ad-legend-value">
                    {parqueosMotos} (
                    {totalParqueos > 0
                      ? ((parqueosMotos / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="ad-legend-item">
                  <span
                    className="ad-legend-dot"
                    style={{ backgroundColor: "#d1d5db" }}
                  ></span>
                  <span className="ad-legend-label">Libres</span>
                  <span className="ad-legend-value">
                    {parqueosLibres} (
                    {totalParqueos > 0
                      ? ((parqueosLibres / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </Link>

            {/* Visitas del Día */}
            <Link to="/visitas" className="ad-stat-card ad-stat-card-link">
              <div className="ad-stat-card-header">
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

              <div className="ad-bar-chart-container">
                <canvas ref={visitasCanvasRef}></canvas>
              </div>

              <div className="ad-stat-summary">
                <div className="ad-stat-summary-item">
                  <span
                    className="ad-stat-big-number"
                    style={{ color: "#22c55e" }}
                  >
                    {visitasHoy}
                  </span>
                  <span className="ad-stat-label">Registradas Hoy</span>
                </div>
                <div className="ad-stat-divider"></div>
                <div className="ad-stat-summary-item">
                  <span
                    className="ad-stat-big-number"
                    style={{ color: "#3b82f6" }}
                  >
                    {visitasActivas}
                  </span>
                  <span className="ad-stat-label">Activas Ahora</span>
                </div>
              </div>
            </Link>

            {/* Reservas del Día */}
            <Link to="/AreasComunes" className="ad-stat-card ad-stat-card-link">
              <div className="ad-stat-card-header">
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

              <div className="ad-info-card-body">
                <div className="ad-info-big-value" style={{ color: "#f97316" }}>
                  {reservasHoy}
                </div>
                <span className="ad-info-sub-label">
                  Áreas comunes reservadas hoy
                </span>
              </div>

              <div className="ad-stat-summary">
                <div className="ad-stat-summary-item">
                  <span
                    className="ad-stat-big-number"
                    style={{ color: "#f97316" }}
                  >
                    {reservasHoy}
                  </span>
                  <span className="ad-stat-label">Total Hoy</span>
                </div>
                <div className="ad-stat-divider"></div>
                <div className="ad-stat-summary-item">
                  <span
                    className="ad-stat-big-number"
                    style={{ color: "#14b8a6" }}
                  >
                    {residentesActivos}
                  </span>
                  <span className="ad-stat-label">Residentes</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
