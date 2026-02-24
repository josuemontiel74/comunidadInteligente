import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../Styles/seleccionParqueadero.css";
import logo from "../../img/logo.png";
// Motos usan ícono Font Awesome fa-motorcycle
import carroVerde from "../../img/carro-verde.svg";
import carroRojo from "../../img/carro-rojo.svg";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Swal from "sweetalert2";
import {
  obtenerParqueaderos,
  actualizarParqueadero,
} from "../services/parqueadero.services.jsx";

function SeleccioneParqueadero() {
  const navegacion = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "La sesión expiró. Vuelva a iniciar sesión.",
        timer: 3500,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navegacion("/");
      });
    }
  }, [navegacion]);
  const location = useLocation();

  // Obtener tipoVehiculoId del estado anterior (desde visitas.jsx)
  const tipoVehiculoId = location.state?.tipoVehiculoId || null;
  const fromVisitas = location.state?.fromVisitas || false;

  const CerraSesión = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navegacion("/");
  };

  // Funciones para manejar token y usuario
  const obtenerToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  };
  const verificarTokenVencido = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };
  const obtenerUsuarioDelToken = () => {
    try {
      const t = obtenerToken();
      if (!t || verificarTokenVencido(t)) return "Usuario";
      return JSON.parse(atob(t.split(".")[1])).username || "Usuario";
    } catch {
      return "Usuario";
    }
  };
  const obtenerRolDelToken = () => {
    try {
      const t = obtenerToken();
      if (!t || verificarTokenVencido(t)) return null;
      return JSON.parse(atob(t.split(".")[1])).rolesId;
    } catch {
      return null;
    }
  };

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

  const [parqueaderos, setParqueaderos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Si venimos desde Visitas con un tipo forzado, aplicarlo como filtro inicial
  useEffect(() => {
    if (tipoVehiculoId) {
      setFiltroTipo(String(tipoVehiculoId));
    }
  }, [tipoVehiculoId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navegacion("/");
      return;
    }
    (async () => {
      try {
        const res = await obtenerParqueaderos(token);
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        setParqueaderos(data.body);
        setLoading(false);
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navegacion("/");
      }
    })();
  }, [navegacion]);

  const liberarEspacio = async (codigoParqueadero) => {
    const token = localStorage.getItem("token");
    const EstadoParqueadero = { estadoId: 4 };

    try {
      const res = await actualizarParqueadero(
        codigoParqueadero,
        EstadoParqueadero,
        token,
      );

      const data = await res.json();

      if (!res.ok) {
        // Si el backend dice que hay visita activa
        if (
          data.visitaActiva ||
          (data.message && data.message.includes("visita activa"))
        ) {
          Swal.fire({
            icon: "warning",
            title: "Parqueadero con visita activa",
            html: `<p>No es posible liberar el espacio <strong>${codigoParqueadero}</strong> porque tiene una visita en curso.</p><p>Primero debe <strong>finalizar la visita</strong> en el módulo de <strong>Visitas</strong>.</p>`,
            confirmButtonText: "Entendido",
            confirmButtonColor: "#7c3aed",
          });
          return;
        }
        throw new Error(
          data.message || "Error al actualizar el estado del parqueadero",
        );
      }

      setParqueaderos((prev) =>
        prev.map((u) =>
          u.codigoParqueadero === codigoParqueadero ? { ...u, estadoId: 4 } : u,
        ),
      );

      Swal.fire({
        icon: "success",
        title: "Liberado correctamente",
        text: `El espacio ${codigoParqueadero} ahora está disponible.`,
        timer: 3500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lo siento",
        text: "Error de conexión. Comuníquese con el área de sistemas.",
        confirmButtonText: "Entendido",
      });
    }
  };

  const asignarEspacio = async (
    codigoParqueadero,
    tipoVehiculoSeleccionado,
  ) => {
    // Si viene desde visitas, solo validar que el tipo coincida
    if (fromVisitas && tipoVehiculoId) {
      // tipoVehiculoId = 1 es Carro, tipoVehiculoId = 2 es Moto
      // tipoVehiculoSeleccionado es el del parqueadero

      // Validar que coincidan
      if (parseInt(tipoVehiculoId) !== tipoVehiculoSeleccionado) {
        const tipoVehiculoNombre = tipoVehiculoId === 1 ? "Carro" : "Moto";
        const tipoEspacioNombre =
          tipoVehiculoSeleccionado === 1 ? "Carro" : "Moto";

        Swal.fire({
          title: " Advertencia",
          text: `Lo siento, pero el tipo de espacio no es el apropiado para el tipo de vehículo que se está seleccionando. Seleccionaste un ${tipoVehiculoNombre} pero este espacio es para ${tipoEspacioNombre}s.`,
          icon: "error",
          showCancelButton: true,
          confirmButtonText: "Volver a seleccionar",
          cancelButtonText: "Regresar a Visitas",
          confirmButtonColor: "#ffc107",
          cancelButtonColor: "#dc3545",
        }).then((result) => {
          if (!result.isConfirmed) {
            // Si el usuario elige regresar a visitas, abrir modal y mantener formulario
            navegacion("/visitas", {
              state: {
                fromParqueaderos: true,
                abrirModal: true,
                formState: location.state?.formState,
              },
            });
          }
          // Si elige volver a seleccionar, simplemente cierra el modal y continúa en la página
        });
        return;
      }

      // Si el tipo coincide, devolver el código seleccionado a la página de visitas
      const tipoVehiculoNombre =
        parseInt(tipoVehiculoId) === 1 ? "Carro" : "Moto";
      Swal.fire({
        icon: "success",
        title: "Validado correctamente",
        text: `El tipo de parqueadero coincide con tu vehículo (${tipoVehiculoNombre}).`,
        timer: 3500,
        showConfirmButton: false,
      }).then(() => {
        navegacion("/visitas", {
          state: {
            codigoParqueaderoSeleccionado: codigoParqueadero,
            tipoVehiculoId: parseInt(tipoVehiculoId),
            fromParqueaderos: true,
            abrirModal: true,
            formState: location.state?.formState,
          },
        });
      });
      return;
    }

    // Si NO viene desde visitas, primero preguntar al usuario
    // Mostrar mensaje: no se puede asignar a nada y dar opciones
    const opcion = await Swal.fire({
      title: "No se puede asignar directamente",
      text: "Lo siento, pero no puedo asignar un parqueadero sin asociarlo a una visita.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ir a Visitas (abrir formulario)",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
    });

    if (opcion.isConfirmed) {
      // Redirigir a visitas y abrir el modal de registro
      navegacion("/visitas", { state: { abrirModal: true } });
    }

    // No hacemos la asignación aquí: la asignación real debe ocurrir cuando la visita se guarda
    return;
  };

  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [tipoVehiculoSeleccionado, setTipoVehiculoSeleccionado] =
    useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const openBootstrapModal = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      if (window.bootstrap && window.bootstrap.Modal) {
        const instance = new window.bootstrap.Modal(el);
        instance.show();
      } else {
        el.classList.add("show");
        el.style.display = "block";
        el.removeAttribute("aria-hidden");
        el.setAttribute("aria-modal", "true");
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop fade show";
        document.body.appendChild(backdrop);
      }
    } catch (e) {
      // No se pudo abrir modal via Bootstrap
    }
  };

  const closeBootstrapModal = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      if (window.bootstrap && window.bootstrap.Modal) {
        const inst = window.bootstrap.Modal.getInstance(el);
        if (inst) inst.hide();
        else {
          const tmp = new window.bootstrap.Modal(el);
          tmp.hide();
        }
      } else {
        el.classList.remove("show");
        el.style.display = "none";
        el.setAttribute("aria-hidden", "true");
        const backdrops = document.querySelectorAll(".modal-backdrop");
        backdrops.forEach((b) => b.remove());
      }
    } catch (e) {
      // No se pudo cerrar modal via Bootstrap
    }
  };

  const handleCardClick = (p) => {
    setSlotSeleccionado(p.codigoParqueadero);
    setEstadoSeleccionado(p.estadoId);
    setTipoVehiculoSeleccionado(p.tipoVehiculoId);

    if (p.estadoId === 4) {
      openBootstrapModal("modalAsignar");
    } else {
      openBootstrapModal("modalLiberar");
    }
  };

  const asignar = async () => {
    if (!slotSeleccionado) return;
    try {
      await asignarEspacio(slotSeleccionado, tipoVehiculoSeleccionado);
      closeBootstrapModal("modalAsignar");
    } catch (error) {
      // Error al asignar espacio
    }
  };

  const liberar = async () => {
    if (!slotSeleccionado) return;
    try {
      await liberarEspacio(slotSeleccionado);
      closeBootstrapModal("modalLiberar");
    } catch (error) {
      // Error liberando espacio
    }
  };

  // Filtrar parqueaderos
  const parqueaderosFiltrados = parqueaderos.filter((p) => {
    const coincideBusqueda = p.codigoParqueadero
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "libre" && p.estadoId === 4) ||
      (filtroEstado === "ocupado" && p.estadoId === 3);

    // Determinar el tipo efectivo a filtrar: si venimos desde Visitas, usamos ese tipo;
    // si no, usamos el filtro que el usuario eligió (filtroTipo).
    const effectiveTipo = tipoVehiculoId ? String(tipoVehiculoId) : filtroTipo;
    const coincideTipo =
      effectiveTipo === "todos" || p.tipoVehiculoId === parseInt(effectiveTipo);

    return coincideBusqueda && coincideEstado && coincideTipo;
  });

  // Estadísticas
  const totalEspacios = parqueaderos.length;
  const espaciosLibres = parqueaderos.filter((p) => p.estadoId === 4).length;
  const espaciosOcupados = parqueaderos.filter((p) => p.estadoId === 3).length;

  return (
    <div className="sp-dashboard">
      {/* Overlay */}
      <div
        className={`sp-overlay ${menuAbierto ? "active" : ""}`}
        onClick={() => setMenuAbierto(false)}
      />

      {/* Drawer moderno */}
      <aside className={`sp-drawer ${menuAbierto ? "open" : ""}`}>
        <div className="sp-drawer-header">
          <div className="sp-drawer-avatar">
            <i className="bi bi-person-fill"></i>
          </div>
          <h3 className="sp-drawer-title">Menú {rolUsuario}</h3>
          <p className="sp-drawer-user">{nombreUsuario || "Usuario"}</p>
        </div>

        <div className="sp-drawer-body">
          {/* Dashboard */}
          <div className="sp-menu-section">
            <h6 className="sp-menu-section-title">Dashboard</h6>
            <Link className="sp-menu-item" to={dashboardRuta}>
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right sp-menu-arrow"></i>
            </Link>
          </div>

          {/* Principal */}
          <div className="sp-menu-section">
            <h6 className="sp-menu-section-title">Parqueaderos</h6>
            <Link className="sp-menu-item active" to="/parqueaderos">
              <i className="bi bi-car-front"></i>
              <span>Gestión Parqueadero</span>
              <i className="bi bi-chevron-right sp-menu-arrow"></i>
            </Link>
          </div>

          {/* Navegación */}
          <div className="sp-menu-section">
            <h6 className="sp-menu-section-title">Navegación</h6>
            <Link className="sp-menu-item" to="/Paqueteria">
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right sp-menu-arrow"></i>
            </Link>
            <Link className="sp-menu-item" to="/visitas">
              <i className="bi bi-person-badge"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right sp-menu-arrow"></i>
            </Link>
            <Link className="sp-menu-item" to="/CalendarioReservas">
              <i className="bi bi-calendar3"></i>
              <span>Calendario</span>
              <i className="bi bi-chevron-right sp-menu-arrow"></i>
            </Link>
            {showAreasComunes && (
              <>
                <Link className="sp-menu-item" to="/AreasComunes">
                  <i className="bi bi-building"></i>
                  <span>Áreas Comunes</span>
                  <i className="bi bi-chevron-right sp-menu-arrow"></i>
                </Link>
                <Link className="sp-menu-item" to="/Residentes">
                  <i className="bi bi-people"></i>
                  <span>Residentes</span>
                  <i className="bi bi-chevron-right sp-menu-arrow"></i>
                </Link>
                <Link className="sp-menu-item" to="/reportes">
                  <i className="bi bi-graph-up"></i>
                  <span>Reportes</span>
                  <i className="bi bi-chevron-right sp-menu-arrow"></i>
                </Link>
              </>
            )}
            {showUserManagement && (
              <>
                <Link className="sp-menu-item" to="/GestionUsuario">
                  <i className="bi bi-person-gear"></i>
                  <span>Gestión Usuarios</span>
                  <i className="bi bi-chevron-right sp-menu-arrow"></i>
                </Link>
                <Link className="sp-menu-item" to="/auditorias">
                  <i className="bi bi-shield-check"></i>
                  <span>Auditorías</span>
                  <i className="bi bi-chevron-right sp-menu-arrow"></i>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="sp-drawer-footer">
          <button className="sp-logout-btn" onClick={CerraSesión}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="sp-main">
        {/* Header */}
        <header className="sp-header">
          <div className="sp-header-group">
            <Link to="/">
              <img src={logo} alt="Logo" className="sp-logo" />
            </Link>
            <h2 className="sp-title">Gestión de Parqueadero</h2>
          </div>
          <button
            className="sp-btn-hamburguer"
            onClick={() => setMenuAbierto(true)}
          >
            <i className="bi bi-list"></i>
          </button>
        </header>

        {/* Contenido */}
        <div className="container-fluid px-4 py-4">
          {/* Tarjetas de Estadísticas */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div
                className="card border-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">Total Espacios</h6>
                      <h2 className="fw-bold mb-0">{totalEspacios}</h2>
                    </div>
                    <i
                      className="bi bi-grid-3x3-gap-fill"
                      style={{ fontSize: "3rem", opacity: 0.3 }}
                    ></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                className="card border-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                }}
              >
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">Espacios Libres</h6>
                      <h2 className="fw-bold mb-0">{espaciosLibres}</h2>
                    </div>
                    <i
                      className="bi bi-check-circle-fill"
                      style={{ fontSize: "3rem", opacity: 0.3 }}
                    ></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                className="card border-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)",
                }}
              >
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">Espacios Ocupados</h6>
                      <h2 className="fw-bold mb-0">{espaciosOcupados}</h2>
                    </div>
                    <i
                      className="bi bi-x-circle-fill"
                      style={{ fontSize: "3rem", opacity: 0.3 }}
                    ></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leyenda mejorada */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-center gap-4">
                <div className="d-flex align-items-center gap-2">
                  <img src={carroVerde} width="35" alt="Carro Libre" />
                  <span className="fw-semibold text-success">
                    <i
                      className="bi bi-circle-fill me-1"
                      style={{ fontSize: "0.5rem" }}
                    ></i>
                    Carro Libre
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i
                    className="fa-solid fa-motorcycle"
                    style={{ fontSize: "1.6rem", color: "#28a745" }}
                  ></i>
                  <span className="fw-semibold text-success">
                    <i
                      className="bi bi-circle-fill me-1"
                      style={{ fontSize: "0.5rem" }}
                    ></i>
                    Moto Libre
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <img src={carroRojo} width="35" alt="Carro Ocupado" />
                  <span className="fw-semibold text-danger">
                    <i
                      className="bi bi-circle-fill me-1"
                      style={{ fontSize: "0.5rem" }}
                    ></i>
                    Carro Ocupado
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i
                    className="fa-solid fa-motorcycle"
                    style={{ fontSize: "1.6rem", color: "#dc3545" }}
                  ></i>
                  <span className="fw-semibold text-danger">
                    <i
                      className="bi bi-circle-fill me-1"
                      style={{ fontSize: "0.5rem" }}
                    ></i>
                    Moto Ocupada
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Buscador mejorado */}
          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-success"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Buscar espacio por código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ borderLeft: "none" }}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex gap-2">
                <select
                  className="form-select shadow-sm"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="libre">Solo libres</option>
                  <option value="ocupado">Solo ocupados</option>
                </select>

                <select
                  className="form-select shadow-sm"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="todos">Todos tipos</option>
                  <option value="1">Carro</option>
                  <option value="2">Moto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tarjetas de parqueaderos mejoradas */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3 text-muted">Cargando espacios...</p>
            </div>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 row-cols-xl-6 g-3">
              {parqueaderosFiltrados.map((p) => (
                <div key={p.codigoParqueadero} className="col">
                  <div
                    className={`card h-100 border-0 shadow-sm parking-card ${
                      p.estadoId === 4 ? "card-libre" : "card-ocupado"
                    }`}
                    onClick={() => handleCardClick(p)}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      background:
                        p.estadoId === 4
                          ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
                          : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 20px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "";
                    }}
                  >
                    <div className="card-body text-center p-3">
                      <div className="mb-2">
                        {p.tipoVehiculoId === 2 ? (
                          <i
                            className="fa-solid fa-motorcycle"
                            style={{
                              fontSize: "2.5rem",
                              color: p.estadoId === 4 ? "#28a745" : "#dc3545",
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))",
                            }}
                          ></i>
                        ) : (
                          <img
                            src={p.estadoId === 4 ? carroVerde : carroRojo}
                            width="60"
                            alt={p.estadoId === 4 ? "Libre" : "Ocupado"}
                            style={{
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))",
                            }}
                          />
                        )}
                      </div>
                      <h6 className="fw-bold mb-1">{p.codigoParqueadero}</h6>
                      <span
                        className={`badge ${p.estadoId === 4 ? "bg-success" : "bg-danger"}`}
                        style={{ fontSize: "0.75rem" }}
                      >
                        {p.estadoId === 4 ? "DISPONIBLE" : "OCUPADO"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {parqueaderosFiltrados.length === 0 && !loading && (
            <div className="text-center py-5">
              <i
                className="bi bi-exclamation-circle text-muted"
                style={{ fontSize: "4rem" }}
              ></i>
              <p className="text-muted mt-3">
                No se encontraron espacios con los criterios seleccionados
              </p>
            </div>
          )}
        </div>

        {/* Modal para ASIGNAR */}
        <div
          className="modal fade"
          id="modalAsignar"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="bi bi-check-circle me-2"></i>Asignar espacio{" "}
                  {slotSeleccionado}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => closeBootstrapModal("modalAsignar")}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <i
                  className="bi bi-car-front-fill text-success mb-3"
                  style={{ fontSize: "4rem" }}
                ></i>
                <p className="fs-5">
                  ¿Seguro que desea{" "}
                  <strong className="text-success">asignar</strong> el espacio{" "}
                  <strong className="text-success">{slotSeleccionado}</strong>?
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => closeBootstrapModal("modalAsignar")}
                >
                  <i className="bi bi-x-circle me-2"></i>Cancelar
                </button>
                <button className="btn btn-success" onClick={asignar}>
                  <i className="bi bi-check-circle me-2"></i>Asignar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal para LIBERAR */}
        <div
          className="modal fade"
          id="modalLiberar"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-unlock me-2"></i>Liberar espacio{" "}
                  {slotSeleccionado}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => closeBootstrapModal("modalLiberar")}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <i
                  className="bi bi-unlock-fill text-danger mb-3"
                  style={{ fontSize: "4rem" }}
                ></i>
                <p className="fs-5">
                  ¿Seguro que desea{" "}
                  <strong className="text-danger">liberar</strong> el espacio{" "}
                  <strong className="text-danger">{slotSeleccionado}</strong>?
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => closeBootstrapModal("modalLiberar")}
                >
                  <i className="bi bi-x-circle me-2"></i>Cancelar
                </button>
                <button className="btn btn-danger" onClick={liberar}>
                  <i className="bi bi-unlock me-2"></i>Liberar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SeleccioneParqueadero;
