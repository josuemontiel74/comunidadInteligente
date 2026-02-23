import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { obtenerCalendarioReservas } from "../services/areasComunes.services.jsx";
import Swal from "sweetalert2";
import logo from "../../img/logo.png";
import "../Styles/estiloCalendario.css";

export default function CalendarioReservas() {
  const navigate = useNavigate();
  const [mesActual, setMesActual] = useState(new Date());
  const [reservas, setReservas] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Funciones para manejar token y usuario
  const obtenerToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  };

  const verificarTokenVencido = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      return true;
    }
  };

  const obtenerUsuarioDelToken = () => {
    try {
      const token = obtenerToken();
      if (!token || verificarTokenVencido(token)) return "Usuario";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || "Usuario";
    } catch (error) {
      return "Usuario";
    }
  };

  const obtenerRolDelToken = () => {
    try {
      const token = obtenerToken();
      if (!token || verificarTokenVencido(token)) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.rolesId;
    } catch (error) {
      return null;
    }
  };

  const token = obtenerToken();
  const nombreUsuario = obtenerUsuarioDelToken();
  const rolesId = obtenerRolDelToken();

  let rolUsuario;
  switch (rolesId) {
    case 1:
      rolUsuario = "superAdmin";
      break;
    case 2:
      rolUsuario = "admin";
      break;
    case 3:
      rolUsuario = "vigilante";
      break;
    default:
      rolUsuario = "Usuario";
  }

  const showAreasComunes = rolesId !== 3;
  const showUserManagement = rolesId === 1;
  const dashboardRuta =
    rolesId === 1 ? "/Superadmin" : rolesId === 2 ? "/Admin" : "/Vigilante";

  const cerrarSesión = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  useEffect(() => {
    cargarReservas();
  }, [mesActual]);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const token = obtenerToken();

      if (!token) {
        console.error("No se encontró token de autenticación");
        setLoading(false);
        return;
      }

      const response = await obtenerCalendarioReservas(token);
      if (response.ok) {
        const data = await response.json();
        setReservas(data.caledarioreservas || []);
      } else {
        console.error("Error en la respuesta del calendario:", response.status);
        setReservas([]);
      }
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerNombreArea = (areaComunId) => {
    switch (areaComunId) {
      case 1:
        return "Salón Comunal 1";
      case 2:
        return "Salón Comunal 2";
      case 3:
        return "Zona BBQ";
      default:
        return `Área ${areaComunId}`;
    }
  };

  // Genera array de días para un mes (incluye nulls antes del primer día para alinear lunes=0)
  const generarDiasDelMes = (year, month) => {
    const first = new Date(year, month, 1);
    // Ajuste para que lunes sea 0
    const primerIndice = (first.getDay() + 6) % 7; // 0..6
    const diasEnMes = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < primerIndice; i++) cells.push(null);
    for (let d = 1; d <= diasEnMes; d++) {
      const yyyy = String(year);
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const iso = `${yyyy}-${mm}-${dd}`;
      cells.push({ day: d, iso });
    }
    return cells;
  };

  // Genera los 12 meses del año actual
  const obtenerMesesDelAnio = () => {
    const currentYear = new Date().getFullYear();
    const mesesArr = [];
    for (let m = 0; m < 12; m++) {
      mesesArr.push({
        year: currentYear,
        month: m,
        name: nombresMeses[m],
        dias: generarDiasDelMes(currentYear, m),
      });
    }
    return mesesArr;
  };

  const mostrarDetallesDia = (fecha) => {
    const reservasDia = obtenerReservasPorDia(fecha);
    const espacios = calcularEspaciosDisponibles(fecha);
    const diaTexto = `${diasSemana[fecha.getDay()]} ${fecha.getDate()} de ${nombresMeses[fecha.getMonth()]}`;

    let html = `<div style="text-align:left">`;

    const hoy = new Date();
    const fechaHoyStr = hoy.toISOString().split("T")[0];
    const fechaStr = fecha.toISOString().split("T")[0];
    const esHoy = fechaStr === fechaHoyStr;

    if (!reservasDia || reservasDia.length === 0) {
      html += `<p><strong>¡Excelente!</strong> No hay reservas para este día. Todos los espacios están disponibles.</p>`;
    } else {
      html += `<h5 style="color:#dc3545">Horarios Ocupados</h5>`;
      reservasDia.forEach((r) => {
        const area = obtenerNombreArea(r.areaComunId);
        html += `<div style="margin-bottom:8px;padding:8px;border-left:4px solid ${obtenerColorArea(r.areaComunId)}">`;
        html += `<div><strong>${area}</strong></div>`;
        html += `<div>${formatearHora(r.horaInicio)} → ${formatearHora(r.horaFin)}</div>`;
        const solicit = extraerSolicitante(r);
        html += `<div style="font-size:12px;color:#666">Solicitante: ${solicit.nombre || "N/A"} · Documento: ${solicit.documento || "N/A"}</div>`;
        html += `</div>`;
      });
    }

    // Mostrar espacios solo si hay disponibilidad
    if (espacios && espacios.length > 0) {
      html += `<hr/><h5 style="color:#198754">Espacios disponibles</h5>`;

      if (esHoy) {
        html += `<div class="alert alert-warning">Las reservas para hoy ya no están disponibles. Por favor realiza la reserva para <strong>mañana</strong> o una fecha posterior.</div>`;
      }

      espacios.forEach((e, i) => {
        const color = obtenerColorPorDuracion(e.duracion);
        html += `<div style="margin-bottom:8px;padding:8px;border-left:4px solid ${color}">`;
        html += `<div><strong>${e.nombreArea}</strong></div>`;
        html += `<div>${formatearHora(e.horaInicio)} → ${formatearHora(e.horaFin)}</div>`;
        html += `<div style="font-size:12px;color:${color}">Disponible por ${e.duracion} hora${e.duracion > 1 ? "s" : ""}</div>`;
        if (!esHoy) {
          html += `<div style="margin-top:6px"><button id="reservar-${i}" class="btn btn-sm btn-primary">Reservar</button></div>`;
        }
        html += `</div>`;
      });
    }

    html += `</div>`;

    Swal.fire({
      title: `Detalles del ${diaTexto}`,
      html,
      width: 800,
      showCloseButton: true,
      confirmButtonText: "Cerrar",
      didOpen: () => {
        // Añadir listeners a los botones Reservar creados dinámicamente (solo si no es hoy)
        if (!esHoy && espacios && espacios.length > 0) {
          espacios.forEach((e, i) => {
            const btn = document.getElementById(`reservar-${i}`);
            if (btn) {
              btn.addEventListener("click", () => {
                const fechaStr = fecha.toISOString().split("T")[0];
                navigate("/AreasComunes", {
                  state: {
                    abrirModal: true,
                    prefill: {
                      areaComunId: e.areaId || e.areaId,
                      fechaReserva: fechaStr,
                      horaInicio: e.horaInicio,
                      horaFin: e.horaFin,
                    },
                  },
                });
                Swal.close();
              });
            }
          });
        }
      },
    });
  };

  const obtenerReservasPorDia = (fecha) => {
    if (!fecha) return [];

    const fechaStr = fecha.toISOString().split("T")[0];
    return reservas.filter((r) => r.fechaReserva === fechaStr);
  };

  const calcularEspaciosDisponibles = (fecha) => {
    const reservasDia = obtenerReservasPorDia(fecha);
    const horaInicio = 8;
    const horaFin = 20;

    const areasPorId = {
      1: [],
      2: [],
      3: [],
    };

    reservasDia.forEach((reserva) => {
      if (areasPorId[reserva.areaComunId]) {
        areasPorId[reserva.areaComunId].push(reserva);
      }
    });

    const espaciosDisponibles = [];

    [1, 2, 3].forEach((areaId) => {
      const reservasArea = areasPorId[areaId].sort((a, b) => {
        return a.horaInicio.localeCompare(b.horaInicio);
      });

      if (reservasArea.length === 0) {
        espaciosDisponibles.push({
          areaId,
          nombreArea: obtenerNombreArea(areaId),
          horaInicio: `${horaInicio}:00`,
          horaFin: `${horaFin}:00`,
          duracion: horaFin - horaInicio,
        });
      } else {
        let horaActual = horaInicio;

        reservasArea.forEach((reserva) => {
          const [h] = reserva.horaInicio.split(":").map(Number);

          if (horaActual < h) {
            espaciosDisponibles.push({
              areaId,
              nombreArea: obtenerNombreArea(areaId),
              horaInicio: `${horaActual}:00`,
              horaFin: `${h}:00`,
              duracion: h - horaActual,
            });
          }

          const [hFin] = reserva.horaFin.split(":").map(Number);
          horaActual = Math.ceil(hFin);
        });

        if (horaActual < horaFin) {
          espaciosDisponibles.push({
            areaId,
            nombreArea: obtenerNombreArea(areaId),
            horaInicio: `${horaActual}:00`,
            horaFin: `${horaFin}:00`,
            duracion: horaFin - horaActual,
          });
        }
      }
    });

    return espaciosDisponibles;
  };

  const obtenerColorPorDuracion = (duracion) => {
    if (duracion < 5) return "#fb923c";
    if (duracion >= 6) return "#10b981";
    return "#f59e0b";
  };

  const formatearHora = (hora) => {
    const [h, m] = hora.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  const obtenerColorArea = (areaId) => {
    switch (areaId) {
      case 1:
        return "#3b82f6";
      case 2:
        return "#8b5cf6";
      case 3:
        return "#ec4899";
      default:
        return "#58d129ff";
    }
  };

  // Extrae nombre y documento del objeto reserva, soportando propiedades directas o incluidas por Sequelize
  const extraerSolicitante = (reserva) => {
    const resultado = { nombre: null, documento: null };
    if (!reserva) return resultado;

    if (reserva.nombreSolicitante) resultado.nombre = reserva.nombreSolicitante;
    if (reserva.documentoSolicitante)
      resultado.documento = reserva.documentoSolicitante;

    // Buscar en objetos incluidos (por si Sequelize devuelve { Solicitud: {...} } u otro alias)
    Object.keys(reserva).forEach((key) => {
      const val = reserva[key];
      if (!resultado.nombre && val && typeof val === "object") {
        if (val.nombreSolicitante) resultado.nombre = val.nombreSolicitante;
        if (val.nombre) resultado.nombre = resultado.nombre || val.nombre;
      }
      if (!resultado.documento && val && typeof val === "object") {
        if (val.documentoSolicitante)
          resultado.documento = val.documentoSolicitante;
        if (val.documento)
          resultado.documento = resultado.documento || val.documento;
      }
    });

    return resultado;
  };

  const mostrarDetallesReserva = (reserva) => {
    const [hi, mi] = reserva.horaInicio.split(":").map(Number);
    const [hf, mf] = reserva.horaFin.split(":").map(Number);
    const duracion = hf * 60 + mf - (hi * 60 + mi);
    const horas = Math.floor(duracion / 60);
    const minutos = duracion % 60;

    Swal.fire({
      title: obtenerNombreArea(reserva.areaComunId),
      html: `
        <div style="text-align: left;">
          <p><strong>🕐 Horario:</strong> ${formatearHora(reserva.horaInicio)} - ${formatearHora(reserva.horaFin)}</p>
          <p><strong>⏱️ Duración:</strong> ${horas}h ${minutos}min</p>
          <p><strong>📍 Área ID:</strong> ${reserva.areaComunId}</p>
          <hr />
          <p><strong>Solicitante:</strong> ${extraerSolicitante(reserva).nombre || "N/A"}</p>
          <p><strong>Documento:</strong> ${extraerSolicitante(reserva).documento || "N/A"}</p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Cerrar",
      confirmButtonColor: "#28a745",
    });
  };

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const nombresMeses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const meses = obtenerMesesDelAnio();
  const reservasSet = new Set(reservas.map((r) => r.fechaReserva));
  const hoyStr = new Date().toISOString().split("T")[0];

  return (
    <div className="cal-dashboard">
      {/* Overlay */}
      <div
        className={`cal-overlay ${menuAbierto ? "active" : ""}`}
        onClick={() => setMenuAbierto(false)}
      />

      {/* Drawer moderno */}
      <aside className={`cal-drawer ${menuAbierto ? "open" : ""}`}>
        <div className="cal-drawer-header">
          <div className="cal-drawer-avatar">
            <i className="bi bi-person-fill"></i>
          </div>
          <h3 className="cal-drawer-title">Menú {rolUsuario}</h3>
          <p className="cal-drawer-user">{nombreUsuario || "Usuario"}</p>
        </div>

        <nav className="cal-drawer-nav">
          {/* Dashboard */}
          <div className="cal-menu-section">
            <p className="cal-menu-section-title">Dashboard</p>
            <Link className="cal-menu-item" to={dashboardRuta}>
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right cal-menu-arrow"></i>
            </Link>
          </div>

          {/* Principal */}
          <div className="cal-menu-section">
            <p className="cal-menu-section-title">Calendario</p>
            <Link className="cal-menu-item active" to="/CalendarioReservas">
              <i className="bi bi-calendar3"></i>
              <span>Ver Calendario</span>
              <i className="bi bi-chevron-right cal-menu-arrow"></i>
            </Link>
          </div>

          {/* Navegación */}
          <div className="cal-menu-section">
            <p className="cal-menu-section-title">Navegación</p>
            <Link className="cal-menu-item" to="/Paqueteria">
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right cal-menu-arrow"></i>
            </Link>
            <Link className="cal-menu-item" to="/visitas">
              <i className="bi bi-person-badge"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right cal-menu-arrow"></i>
            </Link>
            <Link className="cal-menu-item" to="/parqueaderos">
              <i className="bi bi-car-front"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right cal-menu-arrow"></i>
            </Link>
            {showAreasComunes && (
              <>
                <Link className="cal-menu-item" to="/AreasComunes">
                  <i className="bi bi-building"></i>
                  <span>Áreas Comunes</span>
                  <i className="bi bi-chevron-right cal-menu-arrow"></i>
                </Link>
                <Link className="cal-menu-item" to="/Residentes">
                  <i className="bi bi-people"></i>
                  <span>Residentes</span>
                  <i className="bi bi-chevron-right cal-menu-arrow"></i>
                </Link>
                <Link className="cal-menu-item" to="/reportes">
                  <i className="bi bi-graph-up"></i>
                  <span>Reportes</span>
                  <i className="bi bi-chevron-right cal-menu-arrow"></i>
                </Link>
              </>
            )}
            {showUserManagement && (
              <>
                <Link className="cal-menu-item" to="/GestionUsuario">
                  <i className="bi bi-person-gear"></i>
                  <span>Gestión Usuarios</span>
                  <i className="bi bi-chevron-right cal-menu-arrow"></i>
                </Link>
                <Link className="cal-menu-item" to="/auditorias">
                  <i className="bi bi-shield-check"></i>
                  <span>Auditorías</span>
                  <i className="bi bi-chevron-right cal-menu-arrow"></i>
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="cal-drawer-footer">
          <button className="cal-logout-btn" onClick={cerrarSesión}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="cal-main">
        {/* Header */}
        <header className="cal-header">
          <div className="cal-header-group">
            <Link to="/">
              <img src={logo} alt="Logo" className="cal-logo" />
            </Link>
            <h2 className="cal-title">Calendario de Reservas</h2>
          </div>
          <button
            className="cal-btn-hamburguer"
            onClick={() => setMenuAbierto(true)}
          >
            <i className="bi bi-list"></i>
          </button>
        </header>

        {/* Contenido del calendario */}
        <div
          className="container-fluid py-4"
          style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
        >
          <div className="mb-4">
            <h2 className="text-success fw-bold">
              <Calendar
                size={32}
                className="me-2"
                style={{ display: "inline" }}
              />
              Calendario de Reservas
            </h2>
            <p className="text-muted">
              Haz clic en un día para ver más detalles
            </p>
          </div>

          {/* Calendario anual: 12 meses (3 por fila) */}
          <div className="row g-3 mb-4">
            {meses.map((mesObj) => (
              <div
                key={`${mesObj.year}-${mesObj.month}`}
                className="col-12 col-md-4"
              >
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title text-center mb-2">
                      {mesObj.name} {mesObj.year}
                    </h5>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 6,
                        marginBottom: 6,
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      {["L", "M", "M", "J", "V", "S", "D"].map((s, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#444" }}>
                          {s}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 6,
                      }}
                    >
                      {mesObj.dias.map((cell, i) => {
                        if (cell === null)
                          return (
                            <div
                              key={`empty-${i}`}
                              style={{ minHeight: 36 }}
                            ></div>
                          );
                        const reservado = reservasSet.has(cell.iso);
                        const esPasado = cell.iso < hoyStr;
                        const estilo = reservado
                          ? {
                              backgroundColor: "#e07a7a",
                              color: "#fff",
                              borderRadius: 6,
                              padding: "8px 6px",
                              textAlign: "center",
                              cursor: "not-allowed",
                            }
                          : {
                              backgroundColor: "#6fbf73",
                              color: "#fff",
                              borderRadius: 6,
                              padding: "8px 6px",
                              textAlign: "center",
                              cursor: "pointer",
                            };

                        return (
                          <div
                            key={cell.iso}
                            style={estilo}
                            title={cell.iso}
                            onClick={() => {
                              if (reservado) {
                                Swal.fire(
                                  "Fecha reservada",
                                  `La fecha ${cell.iso} ya está reservada.`,
                                  "info",
                                );
                                return;
                              }
                              if (esPasado) {
                                Swal.fire(
                                  "Fecha pasada",
                                  "No es posible reservar fechas pasadas.",
                                  "warning",
                                );
                                return;
                              }
                              // Usar la función existente para mostrar modal o flujo
                              mostrarDetallesDia(new Date(cell.iso));
                            }}
                          >
                            {cell.day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalles del día seleccionado */}
          {diaSeleccionado && (
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">
                  Detalles del {diasSemana[diaSeleccionado.getDay()]}{" "}
                  {diaSeleccionado.getDate()} de{" "}
                  {nombresMeses[diaSeleccionado.getMonth()]}
                </h4>
              </div>

              <div className="card-body">
                {/* Reservas existentes */}
                <div className="mb-4">
                  <h5 className="text-danger mb-3">
                    <Clock size={20} className="me-2" />
                    Horarios Ocupados
                  </h5>

                  {obtenerReservasPorDia(diaSeleccionado).length === 0 ? (
                    <div className="alert alert-success">
                      <strong>¡Excelente!</strong> No hay reservas para este
                      día. Todos los espacios están disponibles.
                    </div>
                  ) : (
                    <div className="row g-3">
                      {obtenerReservasPorDia(diaSeleccionado).map(
                        (reserva, idx) => (
                          <div key={idx} className="col-md-6 col-lg-4">
                            <div
                              className="card"
                              style={{
                                borderLeft: `4px solid ${obtenerColorArea(reserva.areaComunId)}`,
                              }}
                            >
                              <div className="card-body">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                  <h6
                                    className="mb-0"
                                    style={{
                                      color: obtenerColorArea(
                                        reserva.areaComunId,
                                      ),
                                    }}
                                  >
                                    <MapPin size={16} className="me-1" />
                                    {obtenerNombreArea(reserva.areaComunId)}
                                  </h6>
                                  <span className="badge bg-danger">
                                    Ocupado
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <Clock
                                    size={14}
                                    className="me-1 text-muted"
                                  />
                                  <strong>
                                    {formatearHora(reserva.horaInicio)}
                                  </strong>
                                  {" → "}
                                  <strong>
                                    {formatearHora(reserva.horaFin)}
                                  </strong>
                                </div>

                                <div className="mt-2 d-flex justify-content-between align-items-center">
                                  <div>
                                    <small className="text-muted">
                                      Duración:{" "}
                                      {(() => {
                                        const [hi, mi] = reserva.horaInicio
                                          .split(":")
                                          .map(Number);
                                        const [hf, mf] = reserva.horaFin
                                          .split(":")
                                          .map(Number);
                                        const duracion =
                                          hf * 60 + mf - (hi * 60 + mi);
                                        const horas = Math.floor(duracion / 60);
                                        const minutos = duracion % 60;
                                        return `${horas}h ${minutos}min`;
                                      })()}
                                    </small>
                                  </div>
                                  <div>
                                    <button
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() =>
                                        mostrarDetallesReserva(reserva)
                                      }
                                    >
                                      Más info
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Espacios disponibles */}
                <div>
                  <h5 className="text-success mb-3">
                    <Plus size={20} className="me-2" />
                    Espacios Disponibles para Reservar
                  </h5>

                  {calcularEspaciosDisponibles(diaSeleccionado).length === 0 ? (
                    <div className="alert alert-warning">
                      <strong>Lo sentimos.</strong> No hay espacios disponibles
                      en este día.
                    </div>
                  ) : (
                    <div className="row g-3">
                      {calcularEspaciosDisponibles(diaSeleccionado).map(
                        (espacio, idx) => {
                          const color = obtenerColorPorDuracion(
                            espacio.duracion,
                          );
                          return (
                            <div key={idx} className="col-md-6 col-lg-4">
                              <div
                                className="card"
                                style={{ borderLeft: `4px solid ${color}` }}
                              >
                                <div className="card-body">
                                  <div className="d-flex align-items-start justify-content-between mb-2">
                                    <h6 className="mb-0" style={{ color }}>
                                      <MapPin size={16} className="me-1" />
                                      {espacio.nombreArea}
                                    </h6>
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: "#ededed",
                                        color,
                                      }}
                                    >
                                      {espacio.duracion >= 6
                                        ? "Disponible"
                                        : espacio.duracion < 5
                                          ? "Corto"
                                          : "Medio"}
                                    </span>
                                  </div>

                                  <div className="mt-2">
                                    <Clock
                                      size={14}
                                      className="me-1"
                                      style={{ color }}
                                    />
                                    <strong>
                                      {formatearHora(espacio.horaInicio)}
                                    </strong>
                                    {" → "}
                                    <strong>
                                      {formatearHora(espacio.horaFin)}
                                    </strong>
                                  </div>

                                  <div className="mt-2">
                                    <small
                                      style={{ color }}
                                      className="fw-bold"
                                    >
                                      ⏱️ Disponible por {espacio.duracion} hora
                                      {espacio.duracion > 1 ? "s" : ""}
                                    </small>
                                  </div>

                                  <div className="mt-3">
                                    <button
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => {
                                        const fechaStr = diaSeleccionado
                                          .toISOString()
                                          .split("T")[0];
                                        navigate("/AreasComunes", {
                                          state: {
                                            abrirModal: true,
                                            prefill: {
                                              areaComunId: espacio.areaId,
                                              fechaReserva: fechaStr,
                                              horaInicio: espacio.horaInicio,
                                              horaFin: espacio.horaFin,
                                            },
                                          },
                                        });
                                      }}
                                    >
                                      Reservar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
}
