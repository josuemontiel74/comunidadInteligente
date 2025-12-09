import "bootstrap/dist/css/bootstrap.min.css";
import "../Styles/estiloPaqueteria.css";
import logo from "../../img/logo.png";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { obtenerPaquetes, registrarPaquete, actualizarPaquete, eliminarPaquete } from "../services/paqueteria.services.jsx";

function Paqueteria() {
  const navegacion = useNavigate();
  
  const cerrarSesión = (e) => {
    e.preventDefault();
    localStorage.clear();
    navegacion("/");
  };
 
  const location = useLocation();

  const obtenerToken = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken");


    if (!token) {
      console.warn("No se encontró token de autenticación");
      Swal.fire({
        title: "Sesión no encontrada",
        text: "No se encontró una sesión válida. Por favor, inicia sesión nuevamente.",
        icon: "warning",
        confirmButtonText: "Ir al login",
      }).then(() => {
        navegacion("/");
      });
      return null;
    }

    return token;
  };

  const token = obtenerToken();

  const verificarTokenVencido = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const fechaExpiracion = payload.exp * 1000; 
      return Date.now() >= fechaExpiracion;
    } catch (error) {
      console.error("Error al verificar expiración del token:", error);
      return true;
    }
  };

  const obtenerUsuarioDelToken = () => {
    try {
      if (verificarTokenVencido(token)) {
        console.warn("Token vencido, redirigiendo al login...");
        return "Sesión expirada";
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || "Usuario";
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return "Usuario";
    }
  };

  const nombreUsuario = obtenerUsuarioDelToken();


  //obtener rol 
const obtenerRolDelToken = () => {
  try {
    if (verificarTokenVencido(token)) {
      console.warn("Token vencido, usando rol por defecto...");
      return "RolDesconocido";
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.rolesId || "RolNoDefinido";
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return "RolNoDefinido";
  }
};
if(verificarTokenVencido(token)){
  
}
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
    rolUsuario = "RolNoDefinido";
}

  const manejarRespuestaHTTP = async (response) => {
    if (response.status === 401 || response.status === 403) {
      Swal.fire({
        title: "Sesión expirada",
        text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        icon: "warning",
        confirmButtonText: "Ir al login",
      }).then(() => {
        // Limpiar tokens y redirigir
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("authToken");
        navegacion("/");
      });
      return false;
    }
    return response.ok;
  };


  const obtenerApartamentoId = (torre, apartamento) => {
   

    const letraIndex = torre.charCodeAt(0) - 65;
    const numeroApartamento = parseInt(apartamento);

  
    let numeroEnTorre;
    if (numeroApartamento >= 1001 && numeroApartamento <= 1005) {
      
      numeroEnTorre = numeroApartamento - 1000;
    } else {
    
      numeroEnTorre = numeroApartamento % 100;
      if (numeroEnTorre === 0) numeroEnTorre = 5;
    }


    const apartamentoId = letraIndex * 5 + numeroEnTorre;

    console.log(
      `Torre: ${torre}, Apartamento: ${apartamento}, ID calculado: ${apartamentoId}`
    );
    return apartamentoId;
  };

  const normalizarFechaHora = (fechaHoraString) => {
    try {

      const fecha = new Date(fechaHoraString);

      if (isNaN(fecha.getTime())) {
        throw new Error("Fecha inválida");
      }


      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");
      const horas = String(fecha.getHours()).padStart(2, "0");
      const minutos = String(fecha.getMinutes()).padStart(2, "0");

      return `${año}-${mes}-${dia} ${horas}:${minutos}`;
    } catch (error) {
      console.error("Error al normalizar fecha/hora:", error);
     
      return fechaHoraString.replace("T", " ");
    }
  };

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);
  const [paqueteAEditar, setPaqueteAEditar] = useState(null);

  const [paquetes, setPaquetes] = useState([]);

  useEffect(() => {
    recargarPaquetes();
  }, []);


  const [formDataCrear, setFormDataCrear] = useState({
    residente: "",
    torre: "",
    apartamento: "",
    transportadora: "",
    observaciones: "",
    fechaHoraRecepcion: "",
  });

  const [formDataEditar, setFormDataEditar] = useState({
    residente: "",
    torre: "",
    apartamento: "",
    transportadora: "",
    observaciones: "",
    fechaHoraRecepcion: "",
  });

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos, recibidos, entregados
  const [paginaActual, setPaginaActual] = useState(1);
  const paquetesPorPagina = 5;

  useEffect(() => {
    localStorage.setItem("paquetes", JSON.stringify(paquetes));
  }, [paquetes]);

  useEffect(() => {
    if (location.state?.abrirModal) abrirModalCrear();
  }, [location.state]);

  const abrirModalCrear = () => {
    setFormDataCrear({
      residente: "",
      torre: "",
      apartamento: "",
      transportadora: "",
      observaciones: "",
      fechaHoraRecepcion: "",
    });
    setModalCrearAbierto(true);
  };

  const cerrarModalCrear = () => {
    setModalCrearAbierto(false);
    setFormDataCrear({
      residente: "",
      torre: "",
      apartamento: "",
      transportadora: "",
      observaciones: "",
      fechaHoraRecepcion: "",
    });
  };

  const abrirModalEditar = (paquete) => {

    const partesApartamento = paquete.apartamento.split(" - ");
    const torre = partesApartamento[0].replace("Torre ", ""); 
    const numeroApartamento = partesApartamento[1]; 
    setFormDataEditar({
      residente: paquete.residente,
      torre: torre,
      apartamento: numeroApartamento,
      transportadora: paquete.transportadora,
      observaciones: paquete.observaciones,
      fechaHoraRecepcion: paquete.fechaRecepcion + "T" + paquete.horaRecepcion,
    });
    setPaqueteAEditar(paquete);
    setModalEditarAbierto(true);
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setPaqueteAEditar(null);
    setFormDataEditar({
      residente: "",
      torre: "",
      apartamento: "",
      transportadora: "",
      observaciones: "",
      fechaHoraRecepcion: "",
    });
  };

  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  const handleChangeCrear = (e) =>
    setFormDataCrear({ ...formDataCrear, [e.target.name]: e.target.value });

  const handleChangeEditar = (e) =>
    setFormDataEditar({ ...formDataEditar, [e.target.name]: e.target.value });

  const handleSubmitCrear = async (e) => {
    e.preventDefault();

    if (!token) {
      Swal.fire(
        "Error de autenticación",
        "No se encontró un token válido",
        "error"
      );
      return;
    }

    const fechaHoraNormalizada = normalizarFechaHora(
      formDataCrear.fechaHoraRecepcion
    );


    const apartamentoId = obtenerApartamentoId(
      formDataCrear.torre,
      formDataCrear.apartamento
    );

    const paqueteParaRegistrar = {
      apartamentoId: apartamentoId,
      nombreDestinatario: formDataCrear.residente,
      empresaMensajeria: formDataCrear.transportadora,
      fechaRecepcion: fechaHoraNormalizada,
      observaciones: formDataCrear.observaciones,
    };

    console.log("Datos a enviar para registro:", paqueteParaRegistrar);

    try {
      const response = await registrarPaquete(paqueteParaRegistrar, token);

      console.log(
        "Respuesta del servidor (registro):",
        response.status,
        response.statusText
      );

      if (await manejarRespuestaHTTP(response)) {
        Swal.fire("Paquete Registrado!", "", "success");
        await recargarPaquetes();
        cerrarModalCrear();
      } else if (response.status !== 401 && response.status !== 403) {
        const errorText = await response.text();
        console.error("Error del servidor:", errorText);
        Swal.fire(
          "Error al registrar el paquete",
          `Código: ${response.status}. ${errorText}`,
          "error"
        );
      }
    } catch (err) {
      console.error("Error completo:", err);
      Swal.fire("Error de conexión con el servidor", err.message, "error");
    }
  };

  const handleSubmitEditar = async (e) => {
    e.preventDefault();


    if (!token) {
      Swal.fire(
        "Error de autenticación",
        "No se encontró un token válido",
        "error"
      );
      return;
    }

    const fechaHoraNormalizada = normalizarFechaHora(
      formDataEditar.fechaHoraRecepcion
    );

    const paqueteId = paqueteAEditar.id;
    const apartamentoId = obtenerApartamentoId(
      formDataEditar.torre,
      formDataEditar.apartamento
    );

    const paqueteParaEditar = {
      apartamentoId: apartamentoId,
      nombreDestinatario: formDataEditar.residente,
      empresaMensajeria: formDataEditar.transportadora,
      fechaRecepcion: fechaHoraNormalizada,
      observaciones: formDataEditar.observaciones,
    };

    console.log("Datos a enviar para edición:", paqueteParaEditar);

    Swal.fire({
      title: "¿Quieres guardar los cambios?",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      denyButtonText: `No guardar`,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          console.log(`Editando paquete ID: ${paqueteId}`);
          const response = await actualizarPaquete(paqueteId, paqueteParaEditar, token);

          console.log(
            "Respuesta del servidor:",
            response.status,
            response.statusText
          );

          if (await manejarRespuestaHTTP(response)) {
            Swal.fire("¡Guardado!", "", "success");
            await recargarPaquetes();
            cerrarModalEditar();
          } else if (response.status !== 401 && response.status !== 403) {
            const errorText = await response.text();
            console.error("Error del servidor:", errorText);
            Swal.fire(
              "Error al editar el paquete",
              `Código: ${response.status}. ${errorText}`,
              "error"
            );
          }
        } catch (err) {
          console.error("Error completo:", err);
          Swal.fire("Error de conexión con el servidor", err.message, "error");
        }
      } else if (result.isDenied) {
        Swal.fire("Los cambios no fueron guardados", "", "info");
        cerrarModalEditar();
      }
    });
  };

  const recargarPaquetes = async () => {
    try {
      const response = await obtenerPaquetes(token);
      const data = await response.json();
      const paquetesMapeados = data.map((item) => ({
        id: item.idPaquete,
        residente: item.nombreDestinatario,
        apartamento: `${item.nombreTorre} - ${item.numeroApartamento}`,
        transportadora: item.empresaMensajeria,
        fecha: new Date(item.fechaRecepcion).toISOString().split("T")[0],
        fechaRecepcion: new Date(item.fechaRecepcion)
          .toISOString()
          .split("T")[0],
        horaRecepcion: new Date(item.fechaRecepcion)
          .toTimeString()
          .split(" ")[0]
          .slice(0, 5),
        estado: item.nombreEstado === "recibido" ? "En proceso" : "Finalizado",
        observaciones: item.observaciones || "",
      }));
      setPaquetes(paquetesMapeados);
    } catch (err) {
      console.error("Error al cargar paquetes:", err);
    }
  };

  const finalizarPaquete = async (idPaquete) => {
    Swal.fire({
      title: "¿Seguro que deseas finalizar?",
      text: "No podrás revertir esto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, finalizar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await eliminarPaquete(idPaquete, token);

          if (await manejarRespuestaHTTP(response)) {
            Swal.fire("¡Paquete entregado!", "", "success");
            await recargarPaquetes();
          } else if (response.status !== 401 && response.status !== 403) {
            Swal.fire("Error al finalizar el paquete", "", "error");
          }
        } catch (err) {
          console.error(err);
          Swal.fire("Error al actualizar el paquete", "", "error");
        }
      }
    });
  };

  const verDetalles = (paquete) => {
    setPaqueteSeleccionado(paquete);
    setShowModalDetalles(true);
  };

  const paquetesFiltrados = paquetes
    .filter((p) => {
 
      const coincideApartamento = p.apartamento
        .toLowerCase()
        .includes(busqueda.toLowerCase());


      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "recibidos" && p.estado === "En proceso") ||
        (filtroEstado === "entregados" && p.estado === "Finalizado");

      return coincideApartamento && coincideEstado;
    })
    .sort((a, b) => {
   
      const fechaA = new Date(`${a.fechaRecepcion} ${a.horaRecepcion}`);
      const fechaB = new Date(`${b.fechaRecepcion} ${b.horaRecepcion}`);
      return fechaB - fechaA; 
    });

  
  const indiceUltimo = paginaActual * paquetesPorPagina;
  const indicePrimero = indiceUltimo - paquetesPorPagina;
  const paquetesPaginados = paquetesFiltrados.slice(
    indicePrimero,
    indiceUltimo
  );
  const totalPaginas = Math.ceil(paquetesFiltrados.length / paquetesPorPagina);

  return (
    <div className="container-fluid p-0">
      {/* Sidebar */}
      <aside id="menuTrabajador" className="worker-menu bg-success text-white">
        <div className="p-3 d-flex flex-column h-100">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="user-circle bg-white d-flex align-items-center justify-content-center"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
            >
              <span className="fw-bold text-success">
                {nombreUsuario?.substring(0, 2).toUpperCase() || "US"}
              </span>
            </div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">
                {nombreUsuario || "Usuario"}
              </span>
              <span className="fw-semibold text-white"> {rolUsuario || "Usuario"}</span>
              <span className="small text-white-50">Sesión activa</span>
            </div>
          </div>

          <h5 className="mb-3 mx-4">Menú Super Admin</h5>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Paquetes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link
                  className="nav-link text-white"
                  to="/Paqueteria"
                  state={{ abrirModal: true }}
                >
                  Registrar Paquete
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/Paqueteria">
                  Historial de Paquetes
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Visitas</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link
                  className="nav-link text-white"
                  to="/visitas"
                  state={{ abrirModal: true }}
                >
                  Crear Visita
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/visitas">
                  Consultar Visitas
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/parqueaderos">
                  Consultar Parqueaderos
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Áreas Comunes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/AreasComunes">
                  Registrar Reserva
                </Link>
              </li>
            </ul>
          </div>

      

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión Residentes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link
                  className="nav-link text-white"
                  to="/Residentes"
                  state={{ abrirModal: true }}
                >
                  Crear Residente
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/Residentes">
                  Consultar Residente
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-auto text-center logout-container">
            <button onClick={cerrarSesión} className="btn btn-light w-100">
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className={`main-content ${menuAbierto ? "shift" : ""}`}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2 header-bar">
          <div className="logo-container text-center flex-grow-1">
            <Link to="/">
              <img src={logo} alt="Logo" className="logo-img" />
            </Link>
          </div>
          <div className="position-relative">
            <div
              className="btn btn-outline-success d-flex align-items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}
            >
              {nombreUsuario}
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
                  Usuario: <strong>{nombreUsuario}</strong>
                </p>
                <hr />
                <div className="text-center">
                  <button
                    className="btn btn-danger d-block mx-auto"
                    onClick={cerrarSesión}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3 my-4">
          <h2 className="fw-bold">Gestión de Paquetería</h2>
        </div>

        {/* Buscador + Filtros + Registrar */}
        <div className="container mb-3">
          <div className="row align-items-center justify-content-center">
            <div className="col-md-4 text-center">
              <button className="btn btn-success" onClick={abrirModalCrear}>
                Registrar Nuevo Paquete
              </button>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="todos">Todos los estados</option>
                <option value="recibidos">Solo recibidos</option>
                <option value="entregados">Solo entregados</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="text"
                placeholder="Buscar apartamento"
                className="form-control"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="container">
          <table
            className="table table-bordered table-striped"
            style={{ maxWidth: "1200px", margin: "0 auto" }}
          >
            <thead className="table-success">
              <tr>
                <th>Residente</th>
                <th>Apartamento</th>
                <th>Transportadora</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paquetesPaginados.map((p, index) => (
                <tr key={index}>
                  <td>{p.residente}</td>
                  <td>{p.apartamento}</td>
                  <td>{p.transportadora}</td>
                  <td>{p.fecha}</td>
                  <td>
                    {p.estado === "Finalizado" ? (
                      <span className="badge text-bg-success">Entregado</span>
                    ) : (
                      <>
                        <span className="badge bg-warning text-dark">
                          Recibido
                        </span>
                        <i
                          className="bi bi-hourglass-split text-warning"
                          style={{
                            fontSize: "1.2rem",
                            marginLeft: "8px",
                            verticalAlign: "middle",
                          }}
                        ></i>
                      </>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      {p.estado !== "Finalizado" && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => abrirModalEditar(p)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => finalizarPaquete(p.id)}
                          >
                            Finalizar
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => verDetalles(p)}
                      >
                        Detalles
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <nav className="d-flex justify-content-center mt-3">
            <ul className="pagination">
              <li
                className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    paginaActual > 1 && setPaginaActual(paginaActual - 1)
                  }
                >
                  Anterior
                </button>
              </li>
              {[...Array(totalPaginas).keys()].map((num) => (
                <li
                  key={num + 1}
                  className={`page-item ${
                    paginaActual === num + 1 ? "active" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPaginaActual(num + 1)}
                  >
                    {num + 1}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${
                  paginaActual === totalPaginas || totalPaginas === 0
                    ? "disabled"
                    : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    paginaActual < totalPaginas &&
                    setPaginaActual(paginaActual + 1)
                  }
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Modal Crear Paquete */}
        {modalCrearAbierto && (
          <div
            className="modal fade show"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1050,
            }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">Registrar Nuevo Paquete</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Cerrar"
                    onClick={cerrarModalCrear}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmitCrear}>
                    <div className="mb-3">
                      <label className="form-label">Residente *</label>
                      <input
                        type="text"
                        name="residente"
                        className="form-control"
                        value={formDataCrear.residente}
                        onChange={handleChangeCrear}
                        required
                      />
                    </div>

                    <div className="d-flex gap-3 mb-3">
                      <div className="flex-grow-1">
                        <label className="form-label">Torre *</label>
                        <select
                          name="torre"
                          className="form-select"
                          value={formDataCrear.torre}
                          onChange={handleChangeCrear}
                          required
                        >
                          <option value="">Selecciona torre</option>
                          {Array.from({ length: 10 }).map((_, i) => {
                            const letra = String.fromCharCode(65 + i);
                            return (
                              <option key={letra} value={letra}>
                                Torre {letra}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex-grow-1">
                        <label className="form-label">Apartamento *</label>
                        <select
                          name="apartamento"
                          className="form-select"
                          value={formDataCrear.apartamento}
                          onChange={handleChangeCrear}
                          required
                          disabled={!formDataCrear.torre}
                        >
                          <option value="">Selecciona apartamento</option>
                          {formDataCrear.torre &&
                            Array.from({ length: 5 }).map((_, i) => {
                            
                              const num =
                                formDataCrear.torre === "J"
                                  ? 1001 + i
                                  : (formDataCrear.torre.charCodeAt(0) -
                                      65 +
                                      1) *
                                      100 +
                                    1 +
                                    i;
                              return (
                                <option key={num} value={num}>
                                  {formDataCrear.torre} - {num}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Transportadora</label>
                      <input
                        type="text"
                        name="transportadora"
                        className="form-control"
                        value={formDataCrear.transportadora}
                        onChange={handleChangeCrear}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Fecha y Hora de Recepción *
                      </label>
                      <input
                        type="datetime-local"
                        name="fechaHoraRecepcion"
                        className="form-control"
                        value={formDataCrear.fechaHoraRecepcion}
                        onChange={handleChangeCrear}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Observaciones</label>
                      <textarea
                        name="observaciones"
                        className="form-control"
                        value={formDataCrear.observaciones}
                        onChange={handleChangeCrear}
                        rows={3}
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-success w-100">
                      Registrar Paquete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Paquete */}
        {modalEditarAbierto && (
          <div
            className="modal fade show"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1050,
            }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Editar Paquete</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Cerrar"
                    onClick={cerrarModalEditar}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmitEditar}>
                    <div className="mb-3">
                      <label className="form-label">Residente *</label>
                      <input
                        type="text"
                        name="residente"
                        className="form-control"
                        value={formDataEditar.residente}
                        onChange={handleChangeEditar}
                        required
                      />
                    </div>

                    <div className="d-flex gap-3 mb-3">
                      <div className="flex-grow-1">
                        <label className="form-label">Torre *</label>
                        <select
                          name="torre"
                          className="form-select"
                          value={formDataEditar.torre}
                          onChange={handleChangeEditar}
                          required
                        >
                          <option value="">Selecciona torre</option>
                          {Array.from({ length: 10 }).map((_, i) => {
                            const letra = String.fromCharCode(65 + i);
                            return (
                              <option key={letra} value={letra}>
                                Torre {letra}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex-grow-1">
                        <label className="form-label">Apartamento *</label>
                        <select
                          name="apartamento"
                          className="form-select"
                          value={formDataEditar.apartamento}
                          onChange={handleChangeEditar}
                          required
                          disabled={!formDataEditar.torre}
                        >
                          <option value="">Selecciona apartamento</option>
                          {formDataEditar.torre &&
                            Array.from({ length: 5 }).map((_, i) => {
                              const num =
                                formDataEditar.torre === "J"
                                  ? 1001 + i
                                  : (formDataEditar.torre.charCodeAt(0) -
                                      65 +
                                      1) *
                                      100 +
                                    1 +
                                    i;
                              return (
                                <option key={num} value={num}>
                                  {formDataEditar.torre} - {num}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Transportadora</label>
                      <input
                        type="text"
                        name="transportadora"
                        className="form-control"
                        value={formDataEditar.transportadora}
                        onChange={handleChangeEditar}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Fecha y Hora de Recepción *
                      </label>
                      <input
                        type="datetime-local"
                        name="fechaHoraRecepcion"
                        className="form-control"
                        value={formDataEditar.fechaHoraRecepcion}
                        onChange={handleChangeEditar}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Observaciones</label>
                      <textarea
                        name="observaciones"
                        className="form-control"
                        value={formDataEditar.observaciones}
                        onChange={handleChangeEditar}
                        rows={3}
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                      Guardar Cambios
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalles */}
        {showModalDetalles && paqueteSeleccionado && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1050,
            }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">Detalles del Paquete</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModalDetalles(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    <strong>Residente:</strong> {paqueteSeleccionado.residente}
                  </p>
                  <p>
                    <strong>Apartamento:</strong>{" "}
                    {paqueteSeleccionado.apartamento}
                  </p>
                  <p>
                    <strong>Transportadora:</strong>{" "}
                    {paqueteSeleccionado.transportadora}
                  </p>
                  <p>
                    <strong>Fecha Recepción:</strong>{" "}
                    {paqueteSeleccionado.fechaRecepcion}
                  </p>
                  <p>
                    <strong>Hora Recepción:</strong>{" "}
                    {paqueteSeleccionado.horaRecepcion}
                  </p>
                  <p>
                    <strong>Estado:</strong> {paqueteSeleccionado.estado}
                  </p>
                  <p>
                    <strong>Observaciones:</strong>{" "}
                    {paqueteSeleccionado.observaciones}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Paqueteria;
