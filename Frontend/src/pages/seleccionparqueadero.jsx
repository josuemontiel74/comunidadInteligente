import React, { useState, useEffect } from "react";
import { Link , useNavigate} from "react-router-dom";
import "../Styles/seleccionParqueadero.css";
import logo from "../../img/logo.png";
import motoVerde from "../../img/moto-verde.png";
import motoRoja from "../../img/moto-roja.png";
import carroVerde from "../../img/carro-verde.svg";
import carroRojo from "../../img/carro-rojo.svg";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";


function SeleccioneParqueadero() {
  const navegacion = useNavigate();
  const CerraSesión = ()=>{
       navegacion("/");
  };

const [parqueaderos, setParqueaderos] = useState([

]);
const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navegacion("/");
      return;
    }
    fetch("http://localhost:3001/api/parqueadero", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    })
      .then((res) =>{if (!res.ok)throw new Error("No autorizado"); return res.json()} )
      .then((data) => {
  console.log("Datos del parqueadero:", data.body);
     setParqueaderos(data.body);
      setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener datos del parqueadero:", err);
        localStorage.clear();
        navegacion("/");
  }, [navegacion]);
    })
  
  
 const liberarEspacio = async (codigoParqueadero) => {
  const token = localStorage.getItem("token");
  const EstadoParqueadero = { estadoId: 4 };

  try {
    const res = await fetch(
      `http://localhost:3001/api/parqueadero/${codigoParqueadero}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(EstadoParqueadero),
      }
    );

    if (!res.ok) {
      throw new Error("Error al actualizar el estado del parqueadero");
    }

    setParqueaderos((prev) =>
      prev.map((u) =>
        u.codigoParqueadero === codigoParqueadero
          ? { ...u, estadoId: 4 }
          : u
      )
    );
  } catch (error) {
    console.error("No se pudo actualizar el estado del espacio", error);
  }
};
    
const asignarEspacio = async (codigoParqueadero, tipoVehiculo) => {
  const token = localStorage.getItem("token");
  const EstadoParqueadero = { estadoId: 3, tipoVehiculo }; 

  const res = await fetch(
    `http://localhost:3001/api/parqueadero/${codigoParqueadero}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(EstadoParqueadero),
    }
  );

  if (!res.ok) {
    throw new Error("Error al asignar el parqueadero");
  }

  setParqueaderos((prev) =>
    prev.map((u) =>
      u.codigoParqueadero === codigoParqueadero
        ? { ...u, estadoId: 3, tipoVehiculo } 
        : u
    )
  );
};



  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

 
const [formAsignar, setFormAsignar] = useState({
  documento: "",
  destino: "",
  horaIngreso: "",
  horaSalida: "",
  tipo: "Carro",
});


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
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
      }
    } catch (e) {
      console.warn("No se pudo cerrar modal vía Bootstrap: ", e);
    }
  };


  const handleCardClick = (p) => {
    setSlotSeleccionado(p.codigoParqueadero);
    setEstadoSeleccionado(p.estadoId);


    if (p.estadoId === 4) {
      openBootstrapModal("modalAsignar");
    } else {
      openBootstrapModal("modalLiberar");
    }
  };

const asignar = async () => {
  if (!slotSeleccionado) return;

  try {
    await asignarEspacio(slotSeleccionado); // llama al PATCH
    console.log("Asignado el espacio en la BD:", slotSeleccionado, formAsignar);
    setFormAsignar({ nombre: "", correo: "", tipo: "Carro" }); // limpiar form
    closeBootstrapModal("modalAsignar");
    Swal.fire({
      title: "¡Espacio asignado!",
      text: `El espacio ${slotSeleccionado} ha sido asignado correctamente.`,
      icon: "success",
      confirmButtonText: "Aceptar",
       });
  } catch (error) {
    console.error("Error al asignar espacio:", error);
  }
};



const liberar = async () => {
  if (!slotSeleccionado) return;

  try {
    await liberarEspacio(slotSeleccionado); 
    closeBootstrapModal("modalLiberar");
    console.log("Liberado el espacio en la BD:", slotSeleccionado);
  } catch (error) {
    console.error("Error liberando espacio:", error);
  }
};


  return (
      <div className="container-fluid p-0">
        {/*  Sidebar */}
        <aside
          id="menuTrabajador"
          className={`workers-menu bg-success text-white ${
            menuAbierto ? "active" : ""
          }`}
        >
          <div className="p-3 d-flex flex-column h-100">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="user-circle text-dark fw-semibold bg-white">
                Josue
              </div>
              <div className="d-flex flex-column">
                <span className="fw-semibold text-white">Vigilante</span>
                <span className="fw-semibold text-white">Sesión activa</span>
              </div>
            </div>
  
            <h5 className="mb-3 mx-4">Menú del Vigilante</h5>
            <div className="mb-4">
              <h6 className="text-uppercase fw-bold">
                <i className="bi bi-box-seam-fill"></i> Gestión de Paquetes
              </h6>
              <ul className="nav flex-column mt-2 gap-2">
                <li>
                  <Link
                    className="nav-link text-white"
                    to="/paqueteria" state={{ abrirModal: true }}
                  >
                    Registrar Paquete
                  </Link>
                </li>
                <li>
                  <Link className="nav-link text-white" to="/paqueteria">
                    Historial de Paquetes
                  </Link>
                </li>
              </ul>
            </div>
  
            <div className="mb-4">
              <h6 className="text-uppercase fw-bold">
                <i className="bi bi-people-fill"></i> Gestión de Visitas
              </h6>
              <ul className="nav flex-column mt-2 gap-2">
                <li>
                  <Link
                    className="nav-link text-white"
                    to="/visitas"  state={{ abrirModal: true }}
                  >
                    Registrar Visita
                  </Link>
                </li>
                <li>
                  <Link className="nav-link text-white" to="/visitas">
                    Historial Visitas
                  </Link>
                </li>
              
              </ul>
            </div>
  
            <div className="mt-auto">
              <button className="btn btn-light w-100" onClick={CerraSesión}>Cerrar sesión</button>
            </div>
          </div>
        </aside>
  
        {/* Contenido principal */}
        <div className={`main-content ${menuAbierto ? "shift" : ""}`}>
          {/* HEADER */}
          <div className="d-flex align-items-center justify-content-between px-3 py-2 header-bar">
            <div className="logo-container text-center flex-grow-1">
              <Link to="/">
                <img
                  src={logo}
                  alt="Logo del sistema"
                  className="logo-img"
                />
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
                    top: "calc(100% + 20px)",
                    zIndex: 1000,
                    minWidth: "200px",
                  }}
                >
                  <p>
                    Usuario: <strong>josmon07</strong>
                  </p>
                  <hr />
                  <div className="text-center">
                    <button className="btn btn-danger d-block mx-auto"onClick={CerraSesión}>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-center mt-3 my-4">
            <h2 className="fw-bold">Gestión de Parqueadero</h2>
          

          {/* Leyenda */}
          <div className="container mt-4">
            <div className="d-flex gap-4 mb-3">
              <span>
                <img src={motoVerde} width="30" alt="Libre" /> Libre
              </span>
               <span>
                <img src={carroVerde} width="30" alt="Libre" /> Libre
              </span>
               <span>
                <img src={motoRoja} width="30" alt="Ocupado" /> Ocupado
              </span>
             
              <span>
                <img src={carroRojo} width="30" alt="Ocupado" /> Ocupado
              </span>
            </div>

            {/* Buscador */}
            <div className="mb-3 d-flex gap-2">
              <input
                type="text"
                className="form-control"
                id="busquedaParqueo"
                placeholder="🔍 Buscar espacio..."
              />
              <select
                id="filtroEstado"
                className="form-select"
                style={{ maxWidth: "180px" }}
              >
                <option value="todos">Todos</option>
                <option value="libre">Libres</option>
                <option value="ocupado">Ocupados</option>
              </select>
            </div>

            {/* Tarjetas */}
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
              {parqueaderos.map((p) => (
                <div key={p.codigoParqueadero} className="col">
                  <div
                    className="card text-center p-3"
                    // removí data-bs-toggle/data-bs-target y usé handler React para abrir modal correcto
                    onClick={() => handleCardClick(p)}
                    style={{ cursor: "pointer" }}
                  >
                    <img
  className="vehiculo-icon"
  src={
    p.estadoId === 4
      ? (p.tipoVehiculoId === 2 
          ? motoVerde
          : carroVerde)
      : (p.tipoVehiculoId === 2 
          ? motoRoja
          : carroRojo)
  }
  width="50"
  alt={p.estadoId}
/>

                    <p className="fw-bold">{p.codigoParqueadero}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Confirmar */}
        <div
          className="modal fade"
          id="modalConfirmar"
          tabIndex="-1"
          aria-labelledby="modalConfirmarLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="modalConfirmarLabel">
                  Confirmar asignación
                </h5>
                <button
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Cerrar"
                ></button>
              </div>
              <div className="modal-body">
                ¿Asignar el espacio{" "}
                
                <span id="slotSeleccionado" className="fw-bold">
                  {slotSeleccionado}
                </span>{" "}
                al visitante?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancelar
                </button>
                <button className="btn btn-success" onClick={asignar}>
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Reserva */}
        <div
          className="modal fade"
          id="modalReserva"
          tabIndex="-1"
          aria-labelledby="modalReservaLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title" id="modalReservaLabel">
                  Reservar Parqueadero
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Cerrar"
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Espacio:</strong>{" "}
                  <span id="reservaEspacio">{slotSeleccionado}</span>
                </p>
                <p>
                  <strong>Tipo de vehículo:</strong> Carro
                </p>
                <p>
                  <strong>Correo electrónico:</strong>
                  <input
                    type="email"
                    id="correoReserva"
                    className="form-control"
                    placeholder="usuario@email.com"
                  />
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success"
                  id="btnConfirmarReserva"
                >
                  Imprimir Recibo y Enviar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NUEVO: Modal para ASIGNAR */}
        <div className="modal fade" id="modalAsignar" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Asignar espacio {slotSeleccionado}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => closeBootstrapModal('modalAsignar')}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
  
  
</div>          
<div className="modal-body">
                ¿Seguro que desea <strong>Asignar</strong> el espacio <strong>{slotSeleccionado}</strong>?
              </div>    
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => closeBootstrapModal('modalAsignar')}>Cancelar</button>
                <button className="btn btn-success" onClick={asignar}>Asignar</button>
              </div>
            </div>
          </div>
        </div>

        {/* NUEVO: Modal para LIBERAR */}
        <div className="modal fade" id="modalLiberar" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Liberar espacio {slotSeleccionado}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => closeBootstrapModal('modalLiberar')}></button>
              </div>
              <div className="modal-body">
                ¿Seguro que desea <strong>liberar</strong> el espacio <strong>{slotSeleccionado}</strong>?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => closeBootstrapModal('modalLiberar')}>Cancelar</button>
                <button className="btn btn-danger" onClick={liberar}>Liberar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
export default SeleccioneParqueadero;

