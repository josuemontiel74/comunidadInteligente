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

  // Canvas refs (evita document.getElementById que es inestable en React)
  const parqueoCanvasRef = useRef(null);
  const paquetesCanvasRef = useRef(null);
  const visitasCanvasRef = useRef(null);

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
  const [parqueosCarros, setParqueosCarros] = useState(0);
  const [parqueosMotos, setParqueosMotos] = useState(0);
  const [parqueosLibres, setParqueosLibres] = useState(0);
  const [visitasHoy, setVisitasHoy] = useState(0);
  const [visitasActivas, setVisitasActivas] = useState(0);
  const [reservasHoy, setReservasHoy] = useState(0);
  const [residentesActivos, setResidentesActivos] = useState(0);

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
        setParqueosCarros(Math.max(0, datos.parqueaderos?.ocupadosCarros ?? 0));
        setParqueosMotos(Math.max(0, datos.parqueaderos?.ocupadosMotos ?? 0));
        setParqueosLibres(Math.max(0, datos.parqueaderos?.disponibles ?? 0));
        setVisitasHoy(datos.visitas?.hoy ?? 0);
        setVisitasActivas(datos.visitas?.activas ?? 0);
        setReservasHoy(datos.reservas?.hoy ?? 0);
        setResidentesActivos(datos.residentes?.activos ?? 0);
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
    } catch (err) {
      // Error creando gráfico de parqueaderos
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [
    loading,
    dataLoading,
    parqueosCarros,
    parqueosMotos,
    parqueosLibres,
    oscuro,
  ]);

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
    } catch (err) {
      // Error creando gráfico de paquetes
    }

    return () => {
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }
    };
  }, [loading, dataLoading, paquetesEntregados, paquetesPendientes, oscuro]);

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
    } catch (err) {
      // Error creando gráfico de visitas
    }

    return () => {
      if (visitasChartRef.current) {
        visitasChartRef.current.destroy();
        visitasChartRef.current = null;
      }
    };
  }, [loading, dataLoading, visitasHoy, visitasActivas, oscuro]);

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
      <div className="adm-loading-screen">
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
    <div className={`adm-dashboard${saliendo ? " adm-saliendo" : ""}`}>
      {/* ====== OFFCANVAS MENU ====== */}
      <div
        className={`adm-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        role="button"
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
          {/* Navegación */}
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

          {/* Módulos */}
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
            <i className="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ====== CONTENIDO PRINCIPAL ====== */}
      <div className="adm-main">
        {/* Header */}
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

        {/* Bienvenida */}
        <div className="adm-welcome">
          <h2 className="adm-welcome-title">
            Bienvenido, {usuario?.username || usuario?.nombre || "Usuario"}
          </h2>
          <p className="adm-welcome-sub">
            Selecciona el módulo que deseas gestionar en la plataforma
          </p>
        </div>

        {/* Tarjetas de módulos */}
        <div className="adm-modules-grid">
          {modulos.map((mod, idx) => (
            <Link
              to={mod.to}
              key={idx}
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

        {/* Estadísticas */}
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
                <div className="adm-legend-item">
                  <span
                    className="adm-legend-dot"
                    style={{ backgroundColor: "#0d9488" }}
                  ></span>
                  <span className="adm-legend-label">Carros</span>
                  <span className="adm-legend-value">
                    {parqueosCarros} (
                    {totalParqueos > 0
                      ? ((parqueosCarros / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="adm-legend-item">
                  <span
                    className="adm-legend-dot"
                    style={{ backgroundColor: "#f97316" }}
                  ></span>
                  <span className="adm-legend-label">Motos</span>
                  <span className="adm-legend-value">
                    {parqueosMotos} (
                    {totalParqueos > 0
                      ? ((parqueosMotos / totalParqueos) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="adm-legend-item">
                  <span
                    className="adm-legend-dot"
                    style={{ backgroundColor: "#d1d5db" }}
                  ></span>
                  <span className="adm-legend-label">Libres</span>
                  <span className="adm-legend-value">
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
      <WhatsAppModal />
    </div>
  );
}

export default Dashboard;
