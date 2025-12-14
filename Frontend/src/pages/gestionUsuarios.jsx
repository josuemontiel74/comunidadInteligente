import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Styles/gestionUsuarios.css";
import logo from "../../img/logo.png";
import Swal from "sweetalert2";
import Lottie from 'lottie-react';
import BIEN from "../animacion/celebrate.json";
import Inactivo from "../animacion/Inactivo.json";
import { registrarUsuario, editarUsuario, finalizarUsuarioService } from "../services/gestionUsuarios.jsx"

// Traduce mensajes/estructuras de error del backend a textos amigables en español
const campoAmigable = (field) => {
  const map = {
    numeroDocumento: 'Número de documento',
    primerNombre: 'Primer nombre',
    segundoNombre: 'Segundo nombre',
    primerApellido: 'Primer apellido',
    segundoApellido: 'Segundo apellido',
    correoElectronico: 'Correo electrónico',
    telefono: 'Teléfono',
    username: 'Username',
    password: 'Contraseña',
    rolesId: 'Rol',
  };
  return map[field] || field;
};

const traducirMensajeBackend = (errData) => {
  if (errData == null) return 'Datos inválidos o incompletos.';
  if (typeof errData === 'string') {
    const s = errData;
    if (/required|is required|cannot be null|no puede estar vacío|cannot be empty/i.test(s)) return 'Falta información obligatoria en el formulario.';
    if (/max.*length|no puede.*mayor|exceeds the maximum|too long|longitud máxima/i.test(s)) return 'Algún campo supera la longitud permitida.';
    if (/min.*length|must be at least|falta.*caracter|too short|longitud mínima/i.test(s)) return 'Algún campo no cumple la longitud mínima requerida.';
    if (/invalid|not valid|no válido|formato/i.test(s)) return 'Formato de campo inválido.';
    if (/unique|exists|ya existe/i.test(s)) return 'Ya existe un registro con esos datos.';
    return s;
  }
  if (Array.isArray(errData)) return errData.map(e => traducirMensajeBackend(e)).join(' ');
  if (typeof errData === 'object') {
    if (errData.message && typeof errData.message === 'string') return traducirMensajeBackend(errData.message);
    if (errData.errors && Array.isArray(errData.errors)) {
      return errData.errors.map(it => {
        if (it.field || it.param) {
          const f = it.field || it.param;
          const msg = it.message || it.msg || it.error || JSON.stringify(it);
          return `${campoAmigable(f)}: ${traducirMensajeBackend(msg)}`;
        }
        return traducirMensajeBackend(it.message || it);
      }).join(' ');
    }
    const partes = [];
    for (const k in errData) {
      if (!Object.prototype.hasOwnProperty.call(errData, k)) continue;
      partes.push(`${campoAmigable(k)}: ${traducirMensajeBackend(errData[k])}`);
    }
    if (partes.length) return partes.join(' ');
    return JSON.stringify(errData);
  }
  return 'Hay un problema con los datos ingresados. Revise el formulario e intente nuevamente.';
};

function Parqueaderos() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 3500, showConfirmButton: false, timerProgressBar: true }).then(() => {
        localStorage.clear();
        navigate('/');
      });
    }
  }, [navigate]);

  const CERRAR = (e) => {
    localStorage.clear();
    e.preventDefault();
    navigate("/");
  };
  // verifia rol del usaruio
 

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
  const [originalUsername, setOriginalUsername] = useState("");

  // Validador: sólo letras A-Z/a-z y números 0-9; no espacios, tildes, ñ ni símbolos
  const containsInvalidChars = (value) => {
    if (value == null) return false;
    const re = /^[A-Za-z0-9]+$/;
    return !re.test(value);
  };

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


  // Registrar usuario
  const registrarTodo = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // Validar nombres: no permiten espacios, tildes, ñ ni caracteres especiales
    if (!primerNombre || containsInvalidChars(primerNombre) || !primerApellido || containsInvalidChars(primerApellido)) {
      Swal.fire("Error", "Los campos 'Primer Nombre' y 'Primer Apellido' son obligatorios y no pueden contener espacios, tildes,numeros, ñ ni caracteres especiales.", "error");
      return;
    }

    if ((segundoNombre && containsInvalidChars(segundoNombre)) || (segundoApellido && containsInvalidChars(segundoApellido))) {
      Swal.fire("Error", "No se permiten espacios, tildes, numeros,ñ ni caracteres especiales en los nombres o apellidos.", "error");
      return;
    }

    try {
      const datos = {
        password,
        rolesId: parseInt(rolesId),
        estadoId: 1,
        numeroDocumento,
        tipoDocumentoId: parseInt(tipoDocumentoId),
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        telefono,
        correoElectronico
      }
      const resUsuario = await registrarUsuario(datos, token);
      const contentType = resUsuario.headers.get("content-type");
      const dataUsuario = contentType && contentType.includes("application/json") ? await resUsuario.json() : await resUsuario.text();
      console.log("Respuesta backend:", dataUsuario);

      if (!resUsuario.ok) {
        if (resUsuario.status === 400) {
          const friendly = traducirMensajeBackend(dataUsuario);
          Swal.fire({ icon: 'warning', title: 'Error de validación', text: friendly, confirmButtonText: 'Entendido' });
          return;
        }
        if (resUsuario.status >= 500) {
          Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'Error en el servidor. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
          return;
        }
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear el usuario.', confirmButtonText: 'Entendido' });
        return;
      }

      Swal.fire({ icon: 'success', title: 'Registrado correctamente', text: `Username asignado: ${dataUsuario.usuario?.username || dataUsuario.idUsuario}`, timer: 3500, showConfirmButton: false });
      resetForm();
      await cargarUsuarios();
      cerrarModal();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
    }
  };

  // Editar usuario
  const editar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    try {
      // Asegurarse de usar el username original si el campo quedó vacío
      const targetUsername = username && username.toString().trim() ? username : originalUsername;

      // Validar username final antes de enviar
      if (targetUsername && containsInvalidChars(targetUsername)) {
        Swal.fire("Error", "El username contiene caracteres inválidos. Solo letras y números, sin espacios ni tildes.", "error");
        return;
      }

      // Validar nombres y apellidos (no permiten espacios, tildes, ñ ni caracteres especiales)
      if (!primerNombre || containsInvalidChars(primerNombre) || !primerApellido || containsInvalidChars(primerApellido)) {
        Swal.fire("Error", "Los campos 'Primer Nombre' y 'Primer Apellido' son obligatorios y no pueden contener espacios, tildes, ñ ni caracteres especiales.", "error");
        return;
      }

      if ((segundoNombre && containsInvalidChars(segundoNombre)) || (segundoApellido && containsInvalidChars(segundoApellido))) {
        Swal.fire("Error", "No se permiten espacios, tildes, ñ ni caracteres especiales en los nombres o apellidos.", "error");
        return;
      }

      const usuarioPayload = {};
      // Enviar siempre el username efectivo para evitar enviarlo vacío
      if (targetUsername) usuarioPayload.username = targetUsername;
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
      const res = await editarUsuario(targetUsername, usuarioPayload, token);
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await res.json() : await res.text();
      if (!res.ok) {
        if (res.status === 400) {
          const friendly = traducirMensajeBackend(data);
          Swal.fire({ icon: 'warning', title: 'Error de validación', text: friendly, confirmButtonText: 'Entendido' });
          return;
        }
        if (res.status >= 500) {
          Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'Error en el servidor. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
          return;
        }
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el usuario.', confirmButtonText: 'Entendido' });
        return;
      }

      Swal.fire({ icon: 'success', title: 'Actualizado correctamente', timer: 3500, showConfirmButton: false });
      await cargarUsuarios();
      cerrarModalEditar();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
      console.log("Payload enviado:", usuarioPayload);
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

      let numeroDocToFetch = user.numeroDocumento || "";

      if (resUsuario.ok && dataUsuario) {
        const u = dataUsuario.body || dataUsuario;
        setUsername(u.username || "");
        setOriginalUsername(u.username || "");
        setRolesId(u.rolesId || "");
        setEstadoId(u.estadoId || "");
        setNumeroDocumento(u.numeroDocumento || "");
        // Preferir el número recuperado desde la consulta al backend
        numeroDocToFetch = u.numeroDocumento || numeroDocToFetch;
      }

      // Consultar datos de Persona solo si tenemos número de documento
      if (numeroDocToFetch) {
        const resPersona = await fetch(`http://localhost:3001/api/persona/${numeroDocToFetch}`, {
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
      } else {
        // Limpiar campos de persona si no hay documento
        setTipoDocumentoId("");
        setPrimerNombre("");
        setSegundoNombre("");
        setPrimerApellido("");
        setSegundoApellido("");
        setTelefono("");
        setCorreoElectronico("");
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
        try {
          const res = await finalizarUsuarioService(username, token);
          if (!res.ok) {
            const contentType = res.headers.get("content-type");
            const errorData = contentType && contentType.includes("application/json") ? await res.json() : await res.text();
            console.error('Error al finalizar usuario:', res.status, errorData);
            if (res.status === 400) {
              const friendly = traducirMensajeBackend(errorData);
              Swal.fire({ icon: 'warning', title: 'Error de validación', text: friendly, confirmButtonText: 'Entendido' });
              return;
            }
            if (res.status >= 500) {
              Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'Error en el servidor. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
              return;
            }
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo inactivar el usuario.', confirmButtonText: 'Entendido' });
            return;
          }

          setUsuario((prev) => prev.map((u) => (u.username === username ? { ...u, estadoId: 2 } : u)));

          Swal.fire({ icon: 'success', title: 'Finalizado correctamente', timer: 3500, showConfirmButton: false });
        } catch (error) {
          console.error("Error al inactivar:", error);
          Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
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
               {(usuarioLog?.username?.substring(0, 2)?.toUpperCase()) || "US"}

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
                src={logo}
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
              <div className="row g-3">
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
                    <div className="col-md-4" key={user.username}>
                      <div
                        className="card shadow-sm border-0"
                        style={{ borderRadius: "20px" }}
                      >
                        {/* Cabecera con icono */}
                        <div
                          className="text-center p-3"
                          style={{
                            background: "#d1fae5",
                            borderTopLeftRadius: "20px",
                            borderTopRightRadius: "20px",
                          }}
                        >
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/3607/3607444.png"
                            alt="user_icon"
                            width="60"
                            height="60"
                            style={{ opacity: 0.9 }}
                          />
                        </div>

                        {/* Contenido */}
                        <div className="card-body">

                          <h5 className="card-title text-center fw-bold">
                            {user.username}
                          </h5>

                          <p className="mb-1">
                            <strong>Documento:</strong> {user.numeroDocumento}
                          </p>

                          <p className="mb-1">
                            <strong>Rol:</strong> {rolesMap[user.rolesId]}
                          </p>

                          <p className="mb-1 d-flex align-items-center">
                            <strong>Estado:</strong>
                            <span className="ms-2">{estadoMap[user.estadoId]}</span>

                            {user.estadoId === 1 && (
                              <Lottie
                                animationData={BIEN}
                                loop
                                autoplay
                                style={{ width: 50, height: 30, marginLeft: "8px" }}
                              />
                            )}

                            {user.estadoId === 2 && (
                              <Lottie
                                animationData={Inactivo}
                                loop
                                autoplay
                                style={{ width: 40, height: 20, marginLeft: "8px" }}
                              />
                            )}
                          </p>

                          {/* Botones */}
                          <div className="mt-3 d-flex justify-content-between">

                            {user.estadoId === 1 ? (
                              <>
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => abrirModalEditar(user)}
                                >
                                  Editar
                                </button>

                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => finalizarUsuario(user.username)}
                                >
                                  Inactivar
                                </button>
                              </>
                            ) : (
                              <span className="text-muted">Sin acciones</span>
                            )}

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                  className={`page-item ${currentPage === totalPaginas || totalPaginas === 0 ? "disabled" : ""
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
                            onChange={(e) => setNumeroDocumento(e.target.value)}
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
                            className="form-control bg-light"
                            value={username}
                            readOnly
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

