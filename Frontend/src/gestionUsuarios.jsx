import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./estiloPaqueteria.css";
import Swal from "sweetalert2";
import Lottie from 'lottie-react';
import BIEN from "./animacion/celebrate.json";
import Inactivo from "./animacion/Inactivo.json";


function Parqueaderos() {
  const navigate = useNavigate();
  
  const CERRAR = (e) => {
    localStorage.clear(); 
    e.preventDefault();
    navigate("/"); 
  };

  // Estados de modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [modoRegistro, setModoRegistro] = useState(true);

  // Estados del formulario
  const [tipoDocumentoId, setTipoDocumentoId] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [primerNombre, setPrimerNombre] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correoElectronico, setCorreoElectronico] = useState("");
  const [password, setPassword] = useState("");
  const [rolesId, setRolesId] = useState("");
  const [estadoId, setEstadoId] = useState("");
  const [username, setUsername] = useState(""); 

  // Estado para usuarios y búsqueda
  const [usuario, setUsuario] = useState([]);
  const [usuarioLog, setUsuarioLog] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPorPagina = 5;

  // Cargar usuario logueado
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userGuardado = localStorage.getItem("user");
    
    if (!token) {
      navigate("/");
      return;
    }
    
    if (userGuardado) {
      try {
        
        const usuarioParsed = JSON.parse(userGuardado);
        setUsuarioLog(usuarioParsed);
        setLoading(false);
      } catch (error) {
        console.error("Error usuario:", error);
        localStorage.clear();
        navigate("/");
      }
    } else {
      fetch("http://localhost:3001/api/usuario", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("No autorizado");
          return res.json();
        })
        .then((data) => {
          setUsuarioLog(data.usuario);
          localStorage.setItem("user", JSON.stringify(data.usuario));
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          localStorage.clear();
          navigate("/");
        });
    }
  }, [navigate]);

  // Cargar usuarios
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetch("http://localhost:3001/api/usuario", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No autorizado");
        return res.json();
      })
      .then((data) => {
        console.log("Usuarios cargados:", data.body);
        setUsuario(data.body || []); 
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  }, [navigate]);

  // Generar username automático
  useEffect(() => {
    if (modoRegistro && primerNombre && primerApellido) {
      const aleatorio = Math.floor(Math.random() );
      const nuevoUsername = primerNombre.toLowerCase() + primerApellido.toLowerCase() + aleatorio;
      setUsername(nuevoUsername);
    }
  }, [primerNombre, primerApellido, modoRegistro]);

  // Registrar usuario
  const registrarTodo = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const resUsuario = await fetch("http://localhost:3001/api/usuariol", {  
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          username,
          password,
          rolesId: parseInt(rolesId),
          estadoId:1,
          numeroDocumento,
          tipoDocumentoId: parseInt(tipoDocumentoId),
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          telefono,
          correoElectronico
        }),
      });

      const dataUsuario = await resUsuario.json();
      console.log("Respuesta backend:", dataUsuario);

      if (!resUsuario.ok) {
        throw new Error(dataUsuario.error || dataUsuario.message || JSON.stringify(dataUsuario));
      }

      Swal.fire("Éxito", "Usuario registrado correctamente", "success");
      resetForm();
      await cargarUsuarios(); 
      cerrarModal();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "No se pudo conectar al servidor", "error");
    }
  };

  // Editar usuario
  const editar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    try {
      const usuarioPayload = {};
      if (username) usuarioPayload.username = username;
      if (password) usuarioPayload.password = password;
      if (rolesId) usuarioPayload.rolesId = parseInt(rolesId);
      if (estadoId) usuarioPayload.estadoId = parseInt(estadoId);
      if (numeroDocumento) usuarioPayload.numeroDocumento = numeroDocumento;
      if (tipoDocumentoId) usuarioPayload.tipoDocumentoId = parseInt(tipoDocumentoId);
      if (primerNombre) usuarioPayload.primerNombre = primerNombre;
      if (segundoNombre) usuarioPayload.segundoNombre = segundoNombre;
      if (primerApellido) usuarioPayload.primerApellido = primerApellido;
      if (segundoApellido) usuarioPayload.segundoApellido = segundoApellido;
      if (telefono) usuarioPayload.telefono = telefono;
      if (correoElectronico) usuarioPayload.correoElectronico = correoElectronico;

      const res = await fetch(`http://localhost:3001/api/usuario/${username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usuarioPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire("Éxito", "Usuario actualizado correctamente", "success");
      await cargarUsuarios();
      cerrarModalEditar();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "No se pudo actualizar", "error");
    }
  };

  // Cargar usuarios
  const cargarUsuarios = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/usuario", {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
      });
      const data = await res.json();
      setUsuario(data.body || []);
    } catch (err) {
      console.error("Error al recargar usuarios:", err);
    }
  };

  // Abrir modal editar
  const abrirModalEditar = async (user) => {
    setModoRegistro(false);
    setUsuarioSeleccionado(user);
    const token = localStorage.getItem("token");

    try {
      // Consultar datos completos de Usuario
      const resUsuario = await fetch(`http://localhost:3001/api/usuario/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataUsuario = await resUsuario.json();
    
      if (resUsuario.ok && dataUsuario) {
        const u = dataUsuario.body || dataUsuario; 
        setUsername(u.username || "");
        setRolesId(u.rolesId || "");
        setEstadoId(u.estadoId || "");
        setNumeroDocumento(u.numeroDocumento || "");
      }

      // Consultar datos de Persona
      const resPersona = await fetch(`http://localhost:3001/api/persona/${user.numeroDocumento}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataPersona = await resPersona.json();

      if (resPersona.ok && dataPersona) {
        const p = dataPersona.body || dataPersona; 
        setTipoDocumentoId(p.tipoDocumentoId || "");
        setPrimerNombre(p.primerNombre || "");
        setSegundoNombre(p.segundoNombre || "");
        setPrimerApellido(p.primerApellido || "");
        setSegundoApellido(p.segundoApellido || "");
        setTelefono(p.telefono || "");
        setCorreoElectronico(p.correoElectronico || "");
      }
    } catch (error) {
      console.error("Error cargando datos para editar", error);
    }

    setModalEditar(true);
  };

  // Finalizar usuario
  const finalizarUsuario = async (username) => {
    const token = localStorage.getItem("token");

    Swal.fire({
      title: "¿Estás seguro?",
      text: "El usuario será inactivado y no podrá acceder al sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const usuarioPayload = { estadoId: 2 };
        
        try {
          const res = await fetch(`http://localhost:3001/api/usuario/${username}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(usuarioPayload), 
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "No se pudo actualizar el estado");
          }

          setUsuario((prev) =>
            prev.map((u) => u.username === username ? { ...u, estadoId: 2 } : u)
          );

          Swal.fire({
            icon: "success",
            title: "Usuario inactivado",
            text: "El usuario ha sido inactivado correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error("Error al inactivar:", error);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: error.message || "No se pudo inactivar el usuario",
          });
        }
      }
    });
  };

  // Funciones de modal
  const abrirModal = () => {
    setModoRegistro(true);
    resetForm();
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoRegistro(false);
    resetForm();
  };

  const cerrarModalEditar = () => {
    setModalEditar(false);
    setUsuarioSeleccionado(null);
    resetForm();
  };

  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  // Reset form
  const resetForm = () => {
    setTipoDocumentoId("");
    setNumeroDocumento("");
    setPrimerNombre("");
    setSegundoNombre("");
    setPrimerApellido("");
    setSegundoApellido("");
    setTelefono("");
    setCorreoElectronico(""); 
    setPassword("");
    setRolesId("");
    setEstadoId("");
    setUsername("");
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuario.filter((user) => {
    const numeroDoc = user.numeroDocumento?.toString() || "";
    const coincideDocumento = numeroDoc.includes(busqueda);
    const coincideEstado =
      filtroEstado === "Todos" ||
      (filtroEstado === "Activo" && user.estadoId === 1) ||
      (filtroEstado === "Finalizado" && user.estadoId === 2);
    return coincideDocumento && coincideEstado;
  });

  // Paginación
  const indexOfLastUser = currentPage * usuariosPorPagina;
  const indexOfFirstUser = indexOfLastUser - usuariosPorPagina;
  const usuariosActuales = usuariosFiltrados.slice(indexOfFirstUser, indexOfLastUser);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const cambiarPagina = (numero) => setCurrentPage(numero);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px",
        color: "#28a745"
      }}>
        Cargando usuarios...
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Sidebar */}
      <aside
        id="menuTrabajador"
        className={`workers-menu bg-success text-white ${menuAbierto ? "active" : ""}`}
      >
        <div className="p-3 d-flex flex-column h-100"> 
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="user-circle bg-white d-flex align-items-center justify-content-center" 
                 style={{ width: "50px", height: "50px", borderRadius: "50%" }}>
              <span className="fw-bold text-success">
                {usuarioLog?.username?.substring(0, 2).toUpperCase() || "US"}
              </span>
            </div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">
                {usuarioLog?.username || usuarioLog?.nombre || "Usuario"}
              </span>
              <span className="fw-semibold text-white">Super Admin</span>
              <span className="small text-white-50">Sesión activa</span>
            </div>
          </div>

          <h5 className="mb-3 mx-4">Menú SuperAdmin</h5> 

          <div className="mb-4"> 
            <h6 className="text-uppercase fw-bold">Gestión de Usuarios</h6>
            <ul className="nav flex-column mt-2 gap-2"> 
              <li>
                <Link className="nav-link text-white" to="/paqueteria?abrirModal=1">
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
            <h6 className="text-uppercase fw-bold">Gestión de Visitas</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <div className="nav-link text-white" onClick={abrirModal}>
                  Registrar Nueva Visita
                </div>
              </li>
              <li>
                <Link className="nav-link text-white" to="/visitas">
                  Consultar Visitas
                </Link>
              </li>
              <li>
                <div className="nav-link text-white" onClick={() => navigate("/parqueaderos")}>
                  Consultar Parqueaderos
                </div>
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión Áreas Comunes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="../visitas?abrirModal=1">
                  Registrar Reserva
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="../parqueaderos=1">
                  Consultar Zonas
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión Residentes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/Residentes" state={{ abrirModal: true }}>
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

          <div className="mt-auto">
            <button className="btn btn-light w-100" onClick={CERRAR}>
              Cerrar sesión
            </button>
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
                src="../img/logo.png"
                alt="Logo del sistema"
                style={{ marginLeft: "100px" }}
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
              {usuarioLog?.username || usuarioLog?.nombre || "Usuario"}
            </div>
            {showUserMenu && (
              <div className="user-menu text-center">
                <p>
                  Usuario: <strong>{usuarioLog?.username || usuarioLog?.nombre || "Usuario"}</strong>
                </p>
                <p>
                  Rol: <strong>Super Admin</strong>
                </p>
                <hr />
                <div className="text-center">
                  <button onClick={CERRAR} className="btn btn-danger d-block mx-auto">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3 my-4">
          <h2 className="fw-bold">Gestión de Usuarios</h2>
        </div>

        {/* TABLA */}
        <div className="TABLA container-fluid p-0">
          <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fw-bold text-success">
                <i className="bi bi-people-fill"></i> Historial de Usuarios
              </h3>

              <div className="d-flex align-items-center gap-2">
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "200px" }}
                  placeholder="Buscar por documento..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setCurrentPage(1);
                  }}
                />

                <select
                  className="form-select"
                  style={{ width: "150px" }}
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Finalizado">Inactivo</option>
                </select>

                <button className="btn btn-success" onClick={abrirModal}>
                  Registrar Nuevo Usuario
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-success">
                  <tr>
                    <th>Username</th>
                    <th>Número Documento</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosActuales.map((user) => {
                    const rolesMap = {
                      1: "Super Admin",
                      2: "Admin",
                      3: "Vigilante",
                    };

                    const estadoMap = {
                      1: "Activo",
                      2: "Inactivo",
                    };

                    return (
                      <tr key={user.username}>
                        <td>{user.username}</td>
                        <td>{user.numeroDocumento}</td>
                        <td>{rolesMap[user.rolesId] || user.rolesId}</td>
                        <td>
                          {estadoMap[user.estadoId]}
                          {user.estadoId === 1 && (
                            <Lottie
                              animationData={BIEN}
                              loop={true}
                              autoplay={true}
                              style={{ width: 60, height: 40, display: "inline-block", marginLeft: "8px" }}
                            />
                          )}
                          {user.estadoId === 2 && (
                            <Lottie
                              animationData={Inactivo}
                              loop={true}
                              autoplay={true}
                              style={{ width: 40, height: 20, display: "inline-block", marginLeft: "8px" }}
                            />
                          )}
                        </td>

                        <td className="d-flex align-items-center justify-content-evenly">
                          {user.estadoId === 1 ? (
                            <>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => abrirModalEditar(user)}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => finalizarUsuario(user.username)}
                              >
                                Inactivar
                              </button>
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <nav className="d-flex justify-content-center mt-3">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => currentPage > 1 && cambiarPagina(currentPage - 1)}
                  >
                    Anterior
                  </button>
                </li>

                {[...Array(totalPaginas).keys()].map((num) => (
                  <li
                    key={num + 1}
                    className={`page-item ${currentPage === num + 1 ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => cambiarPagina(num + 1)}
                    >
                      {num + 1}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    currentPage === totalPaginas || totalPaginas === 0 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => currentPage < totalPaginas && cambiarPagina(currentPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Modal Registrar */}
        {modalAbierto && (
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
                  <h5 className="modal-title">Registrar Usuarios</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Cerrar"
                    onClick={cerrarModal}
                  />
                </div>
                <div className="modal-body">
  <form onSubmit={registrarTodo} className="p-4 shadow rounded bg-light">
  <h4 className="mb-4 text-center fw-bold text-success">Registrar Usuario</h4>

  <div className="row g-3">
    <div className="col-md-6">
      <label className="form-label fw-semibold">Tipo Documento *</label>
      <select
        className="form-select"
        value={tipoDocumentoId}
        onChange={(e) => setTipoDocumentoId(e.target.value)}
        required
      >
        <option value="">Selecciona...</option>
        <option value="1">CC</option>
        <option value="2">CE</option>
        <option value="3">PA</option>
        <option value="4">PP</option>
        <option value="5">PPT</option>
      </select>
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Documento *</label>
      <input
        type="number"
        className="form-control"
        value={numeroDocumento}
        onChange={(e) => setNumeroDocumento(e.target.value)}
        required
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Primer Nombre *</label>
      <input
        type="text"
        className="form-control"
        value={primerNombre}
        onChange={(e) => setPrimerNombre(e.target.value)}
        required
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Segundo Nombre</label>
      <input
        type="text"
        className="form-control"
        value={segundoNombre}
        onChange={(e) => setSegundoNombre(e.target.value)}
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Primer Apellido *</label>
      <input
        type="text"
        className="form-control"
        value={primerApellido}
        onChange={(e) => setPrimerApellido(e.target.value)}
        required
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Segundo Apellido</label>
      <input
        type="text"
        className="form-control"
        value={segundoApellido}
        onChange={(e) => setSegundoApellido(e.target.value)}
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Teléfono</label>
      <input
        type="number"
        className="form-control"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Correo</label>
      <input
        type="email"
        className="form-control"
        value={correoElectronico}
        onChange={(e) => setCorreoElectronico(e.target.value)}
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Username</label>
      <input
        type="text"
        className="form-control bg-light"
        value={username}
        readOnly
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Contraseña *</label>
      <input
        type="password"
        className="form-control"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

    <div className="col-md-6">
      <label className="form-label fw-semibold">Rol *</label>
      <select
        className="form-select"
        value={rolesId}
        onChange={(e) => setRolesId(parseInt(e.target.value))}
      >
        <option value="">Selecciona...</option>
        <option value={3}>Trabajador</option>
        <option value={2}>Admin</option>
        <option value={1}>Super_Admin</option>
      </select>
    </div>

 <div className="col-md-6 d-none">
  <label className="form-label fw-semibold">Estado *</label>
  <select
    className="form-select"
    value={estadoId}
    onChange={(e) => setEstadoId(parseInt(e.target.value))}
  >
    <option value={1}>Activo</option>
    <option value={2}>Inactivo</option>
  </select>
</div>

  </div>

  <div className="d-flex justify-content-center mt-4">
    <button type="submit" className="btn btn-success px-4 py-2 shadow-sm">
      <i className="bi bi-person-plus me-2"></i> Registrar
    </button>
  </div>
</form>


                
                </div>
              </div>
            </div>
          </div>
        )}

    {/* Modal Editar */}
{modalEditar && (
  <div
    className="modal fade show"
    style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
  >
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header bg-success text-white">
          <h5 className="modal-title">Editar Usuario</h5>
          <button className="btn-close btn-close-white" onClick={cerrarModalEditar} />
        </div>
        <div className="modal-body">
       <form onSubmit={editar} className="p-4 shadow-lg rounded bg-white">
  <h4 className="fw-bold text-primary text-center mb-4">
    ✏️ Editar Usuario
  </h4>

  {/* Persona */}
  <div className="mb-3 pb-2 border-bottom">
    <h6 className="text-secondary fw-semibold mb-3">
      <i className="bi bi-person-badge me-2"></i>Datos de Persona
    </h6>

    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label small">Número Documento</label>
        <input
          type="text"
          className="form-control bg-light"
          value={numeroDocumento}
          onChange={(e) => setnumeroDocumento(e.target.value)}
          readOnly
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Tipo Documento</label>
        <select
          className="form-select"
          value={tipoDocumentoId}
          onChange={(e) => setTipoDocumentoId(parseInt(e.target.value))}
        >
          <option value="">Selecciona...</option>
          <option value={1}>CC</option>
          <option value={2}>CE</option>
          <option value={3}>PA</option>
          <option value={4}>PP</option>
          <option value={5}>PPT</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label small">Primer Nombre</label>
        <input
          type="text"
          className="form-control"
          value={primerNombre}
          onChange={(e) => setPrimerNombre(e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Segundo Nombre</label>
        <input
          type="text"
          className="form-control"
          value={segundoNombre}
          onChange={(e) => setSegundoNombre(e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Primer Apellido</label>
        <input
          type="text"
          className="form-control"
          value={primerApellido}
          onChange={(e) => setPrimerApellido(e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Segundo Apellido</label>
        <input
          type="text"
          className="form-control"
          value={segundoApellido}
          onChange={(e) => setSegundoApellido(e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Teléfono</label>
        <input
          type="text"
          className="form-control"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Correo Electrónico</label>
        <input
          type="email"
          className="form-control"
          value={correoElectronico}
          onChange={(e) => setCorreoElectronico(e.target.value)}
        />
      </div>
    </div>
  </div>

  {/* Usuario */}
  <div className="mb-3">
    <h6 className="text-secondary fw-semibold mb-3">
      <i className="bi bi-person-circle me-2"></i>Datos de Usuario
    </h6>

    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label small">Username</label>
        <input
          type="text"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Contraseña</label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small">Rol</label>
        <select
          className="form-select"
          value={rolesId}
          onChange={(e) => setRolesId(parseInt(e.target.value))}
        >
          <option value="">Selecciona...</option>
          <option value={3}>Trabajador</option>
          <option value={2}>Admin</option>
          <option value={1}>Super_Admin</option>
        </select>
      </div>

      {/* Estado oculto */}
      <div className="col-md-6 d-none">
        <label className="form-label small">Estado</label>
        <select
          className="form-select"
          value={estadoId}
          onChange={(e) => setEstadoId(parseInt(e.target.value))}
        >
          <option value="">Selecciona...</option>
          <option value={1}>Activo</option>
          <option value={2}>Inactivo</option>
        </select>
      </div>
    </div>
  </div>

  <div className="d-flex justify-content-center mt-4">
    <button type="submit" className="btn btn-primary px-4 py-2 shadow-sm">
      <i className="bi bi-save me-2"></i> Guardar Cambios
    </button>
  </div>
</form>

        </div>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
}

export default Parqueaderos;

