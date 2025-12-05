import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../Styles/seleccionParqueadero.css";
import logo from "../../img/logo.png";
import motoVerde from "../../img/moto-verde.png";
import motoRoja from "../../img/moto-roja.png";
import carroVerde from "../../img/carro-verde.svg";
import carroRojo from "../../img/carro-rojo.svg";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Swal from "sweetalert2";
import { obtenerParqueaderos, actualizarParqueadero } from "../services/parqueadero.services.jsx";

function SeleccioneParqueadero() {
  const navegacion = useNavigate();
  const location = useLocation();
  
  // Obtener tipoVehiculoId del estado anterior (desde visitas.jsx)
  const tipoVehiculoId = location.state?.tipoVehiculoId || null;
  const fromVisitas = location.state?.fromVisitas || false;
  
  const CerraSesión = () => {
    navegacion("/");
  };

  const [parqueaderos, setParqueaderos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

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
        console.log("Datos del parqueadero:", data.body);
        setParqueaderos(data.body);
        setLoading(false);
      } catch (err) {
        console.error("Error al obtener datos del parqueadero:", err);
        localStorage.clear();
        navegacion("/");
      }
    })();
  }, [navegacion]);

  const liberarEspacio = async (codigoParqueadero) => {
    const token = localStorage.getItem("token");
    const EstadoParqueadero = { estadoId: 4 };

    try {
      const res = await actualizarParqueadero(codigoParqueadero, EstadoParqueadero, token);

      if (!res.ok) {
        throw new Error("Error al actualizar el estado del parqueadero");
      }

      setParqueaderos((prev) =>
        prev.map((u) =>
          u.codigoParqueadero === codigoParqueadero ? { ...u, estadoId: 4 } : u
        )
      );

      Swal.fire({
        title: "¡Espacio liberado!",
        text: `El espacio ${codigoParqueadero} ahora está disponible.`,
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#28a745",
      });
    } catch (error) {
      console.error("No se pudo actualizar el estado del espacio", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo liberar el espacio",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const asignarEspacio = async (codigoParqueadero, tipoVehiculoSeleccionado) => {
    // Si viene desde visitas, solo validar que el tipo coincida
    if (fromVisitas && tipoVehiculoId) {
      // tipoVehiculoId = 1 es Carro, tipoVehiculoId = 2 es Moto
      // tipoVehiculoSeleccionado es el del parqueadero
      
      // Validar que coincidan
      if (parseInt(tipoVehiculoId) !== tipoVehiculoSeleccionado) {
        const tipoVehiculoNombre = tipoVehiculoId === 1 ? "Carro" : "Moto";
        const tipoEspacioNombre = tipoVehiculoSeleccionado === 1 ? "Carro" : "Moto";
        
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
              state: { fromParqueaderos: true, abrirModal: true, formState: location.state?.formState }
            });
          }
          // Si elige volver a seleccionar, simplemente cierra el modal y continúa en la página
        });
        return;
      }

      // Si el tipo coincide, devolver el código seleccionado a la página de visitas
      const tipoVehiculoNombre = parseInt(tipoVehiculoId) === 1 ? "Carro" : "Moto";
      Swal.fire({
        title: "✅ Validación Exitosa",
        text: `El tipo de parqueadero coincide correctamente con tu vehículo (${tipoVehiculoNombre}). Se volverá al formulario y se completará el parqueadero seleccionado.`,
        icon: "success",
        confirmButtonText: "Regresar a Visitas",
        confirmButtonColor: "#28a745",
      }).then(() => {
        // Regresar a visitas enviando el código seleccionado (NO asignamos en BD aún)
        navegacion("/visitas", {
          state: {
            codigoParqueaderoSeleccionado: codigoParqueadero,
            tipoVehiculoId: parseInt(tipoVehiculoId),
            fromParqueaderos: true,
            abrirModal: true,
            formState: location.state?.formState
          }
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
      navegacion('/visitas', { state: { abrirModal: true } });
    }

    // No hacemos la asignación aquí: la asignación real debe ocurrir cuando la visita se guarda
    return;
  };

  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [tipoVehiculoSeleccionado, setTipoVehiculoSeleccionado] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const toggleMenu = () => setMenuAbierto(!menuAbierto);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      console.warn("No se pudo abrir modal vía Bootstrap: ", e);
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
      console.warn("No se pudo cerrar modal vía Bootstrap: ", e);
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
      console.error("Error al asignar espacio:", error);
    }
  };

  const liberar = async () => {
    if (!slotSeleccionado) return;
    try {
      await liberarEspacio(slotSeleccionado);
      closeBootstrapModal("modalLiberar");
    } catch (error) {
      console.error("Error liberando espacio:", error);
    }
  };

  // Filtrar parqueaderos
  const parqueaderosFiltrados = parqueaderos.filter((p) => {
    const coincideBusqueda = p.codigoParqueadero.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "libre" && p.estadoId === 4) ||
      (filtroEstado === "ocupado" && p.estadoId === 3);
    return coincideBusqueda && coincideEstado;
  });

  // Estadísticas
  const totalEspacios = parqueaderos.length;
  const espaciosLibres = parqueaderos.filter((p) => p.estadoId === 4).length;
  const espaciosOcupados = parqueaderos.filter((p) => p.estadoId === 3).length;

  return (
    <div className="container-fluid p-0" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Sidebar */}
      <aside
        id="menuTrabajador"
        className={`workers-menu bg-success text-white ${menuAbierto ? "active" : ""}`}
      >
        <div className="p-3 d-flex flex-column h-100">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="user-circle bg-white d-flex align-items-center justify-content-center"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
            >
              <span className="fw-bold text-success">JO</span>
            </div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">Josue</span>
              <span className="small text-white-50">Vigilante</span>
            </div>
          </div>

          <h5 className="mb-3 mx-4">Menú del Vigilante</h5>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">
              <i className="bi bi-box-seam-fill me-2"></i>Gestión de Paquetes
            </h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/paqueteria" state={{ abrirModal: true }}>
                  <i className="bi bi-plus-circle me-2"></i>Registrar Paquete
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/paqueteria">
                  <i className="bi bi-clock-history me-2"></i>Historial de Paquetes
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">
              <i className="bi bi-people-fill me-2"></i>Gestión de Visitas
            </h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/visitas" state={{ abrirModal: true }}>
                  <i className="bi bi-person-plus me-2"></i>Registrar Visita
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/visitas">
                  <i className="bi bi-list-ul me-2"></i>Historial Visitas
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-auto">
            <button className="btn btn-light w-100" onClick={CerraSesión}>
              <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className={`main-content ${menuAbierto ? "shift" : ""}`}>
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-white shadow-sm">
          <div className="logo-container text-center flex-grow-1">
            <Link to="/">
              <img src={logo} alt="Logo del sistema" className="logo-img" style={{ maxHeight: "50px" }} />
            </Link>
          </div>

          <div className="position-relative">
            <div
              className="btn btn-outline-success d-flex align-items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-person-circle"></i> Josue
            </div>

            {showUserMenu && (
              <div
                className="user-menu text-center bg-white shadow p-3 rounded"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  zIndex: 1000,
                  minWidth: "200px",
                  border: "1px solid #dee2e6",
                }}
              >
                <p className="mb-2">
                  Usuario: <strong>josmon07</strong>
                </p>
                <hr />
                <button className="btn btn-danger btn-sm w-100" onClick={CerraSesión}>
                  <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Título y Estadísticas */}
        <div className="container-fluid px-4 py-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-success mb-2">
              <i className="bi bi-car-front-fill me-2"></i>Gestión de Parqueadero
            </h2>
            <p className="text-muted">Administra los espacios de parqueadero en tiempo real</p>
          </div>

          {/* Tarjetas de Estadísticas */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">Total Espacios</h6>
                      <h2 className="fw-bold mb-0">{totalEspacios}</h2>
                    </div>
                    <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">Espacios Libres</h6>
                      <h2 className="fw-bold mb-0">{espaciosLibres}</h2>
                    </div>
                    <i className="bi bi-check-circle-fill" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)" }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">Espacios Ocupados</h6>
                      <h2 className="fw-bold mb-0">{espaciosOcupados}</h2>
                    </div>
                    <i className="bi bi-x-circle-fill" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
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
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i>
                    Carro Libre
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <img src={motoVerde} width="35" alt="Moto Libre" />
                  <span className="fw-semibold text-success">
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i>
                    Moto Libre
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <img src={carroRojo} width="35" alt="Carro Ocupado" />
                  <span className="fw-semibold text-danger">
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i>
                    Carro Ocupado
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <img src={motoRoja} width="35" alt="Moto Ocupada" />
                  <span className="fw-semibold text-danger">
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i>
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
              <select
                className="form-select shadow-sm"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">📋 Todos los estados</option>
                <option value="libre">✅ Solo libres</option>
                <option value="ocupado">❌ Solo ocupados</option>
              </select>
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
                      background: p.estadoId === 4 
                        ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)" 
                        : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "";
                    }}
                  >
                    <div className="card-body text-center p-3">
                      <div className="mb-2">
                        <img
                          src={
                            p.estadoId === 4
                              ? p.tipoVehiculoId === 2
                                ? motoVerde
                                : carroVerde
                              : p.tipoVehiculoId === 2
                              ? motoRoja
                              : carroRojo
                          }
                          width="60"
                          alt={p.estadoId === 4 ? "Libre" : "Ocupado"}
                          style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))" }}
                        />
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
              <i className="bi bi-exclamation-circle text-muted" style={{ fontSize: "4rem" }}></i>
              <p className="text-muted mt-3">No se encontraron espacios con los criterios seleccionados</p>
            </div>
          )}
        </div>

        {/* Modal para ASIGNAR */}
        <div className="modal fade" id="modalAsignar" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="bi bi-check-circle me-2"></i>Asignar espacio {slotSeleccionado}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => closeBootstrapModal("modalAsignar")}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <i className="bi bi-car-front-fill text-success mb-3" style={{ fontSize: "4rem" }}></i>
                <p className="fs-5">
                  ¿Seguro que desea <strong className="text-success">asignar</strong> el espacio{" "}
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
        <div className="modal fade" id="modalLiberar" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-unlock me-2"></i>Liberar espacio {slotSeleccionado}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => closeBootstrapModal("modalLiberar")}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <i className="bi bi-unlock-fill text-danger mb-3" style={{ fontSize: "4rem" }}></i>
                <p className="fs-5">
                  ¿Seguro que desea <strong className="text-danger">liberar</strong> el espacio{" "}
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
      </div>
    </div>
  );
}

export default SeleccioneParqueadero;