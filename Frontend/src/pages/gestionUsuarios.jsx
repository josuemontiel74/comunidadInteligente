import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import "../Styles/estiloGestionUsuarios.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { API_BASE } from "../services/api.config.js";
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerPersonaPorDocumento,
  registrarUsuario,
  editarUsuario,
  finalizarUsuarioService,
  activarUsuarioService,
  obtenerUsuariosEnLinea,
  actualizarFotoPerfil,
} from "../services/gestionUsuarios.jsx";
import {
  validarNombre,
  validarTelefono,
  validarEmail,
  validarDocumento,
  filtrarInputDocumento,
  filtrarInputNombre,
  filtrarInputTelefono,
} from "../utils/validaciones.js";
import ModalOverlay from "../utils/ModalOverlay.jsx";
import { verificarTokenVencido, obtenerRolFromToken } from "../utils/auth.js";
import useLogout from "../utils/useLogout.js";

const ROLES_MAP = {
  1: "Super Administrador",
  2: "Administrador",
  3: "Vigilante",
};
const ESTADO_MAP = { 1: "Activo", 2: "Inactivo" };
const TIPO_DOC_MAP = { 1: "CC", 2: "CE", 3: "PA", 4: "PP", 5: "PPT" };
const PHOTO_STORAGE_KEY = "gu_user_photos";

const campoAmigable = (field) => {
  const map = {
    numeroDocumento: "Numero de documento",
    primerNombre: "Primer nombre",
    segundoNombre: "Segundo nombre",
    primerApellido: "Primer apellido",
    segundoApellido: "Segundo apellido",
    correoElectronico: "Correo electronico",
    telefono: "Telefono",
    username: "Username",
    contrasena: "Contrasena",
    rolesId: "Rol",
  };
  return map[field] || field;
};

function traducirString(s) {
  if (
    /required|is required|cannot be null|no puede estar vacio|cannot be empty/i.test(
      s,
    )
  )
    return "Falta informacion obligatoria en el formulario.";
  if (
    /max.*length|no puede.*mayor|exceeds the maximum|too long|longitud maxima/i.test(
      s,
    )
  )
    return "Algun campo supera la longitud permitida.";
  if (
    /min.*length|must be at least|falta.*caracter|too short|longitud minima/i.test(
      s,
    )
  )
    return "Algun campo no cumple la longitud minima requerida.";
  if (/invalid|not valid|no valido|formato/i.test(s))
    return "Formato de campo invalido.";
  if (/unique|exists|ya existe/i.test(s))
    return "Ya existe un registro con esos datos.";
  return s;
}

function traducirObjeto(obj) {
  if (obj.message && typeof obj.message === "string")
    return traducirMensajeBackend(obj.message);
  if (obj.errors && Array.isArray(obj.errors)) {
    return obj.errors
      .map((it) => {
        const f = it.field || it.param;
        if (f) {
          const msg = it.message || it.msg || it.error || JSON.stringify(it);
          return campoAmigable(f) + ": " + traducirMensajeBackend(msg);
        }
        return traducirMensajeBackend(it.message || it);
      })
      .join(" ");
  }
  const partes = [];
  for (const k in obj) {
    if (!Object.hasOwn(obj, k)) continue;
    partes.push(campoAmigable(k) + ": " + traducirMensajeBackend(obj[k]));
  }
  return partes.length ? partes.join(" ") : JSON.stringify(obj);
}

function validarNombresGU(fd) {
  const errPN = validarNombre(fd.primerNombre);
  if (errPN)
    return { titulo: "Nombre inválido", msg: `Primer Nombre: ${errPN}` };
  const errPA = validarNombre(fd.primerApellido);
  if (errPA)
    return { titulo: "Apellido inválido", msg: `Primer Apellido: ${errPA}` };
  if (fd.segundoNombre) {
    const errSN = validarNombre(fd.segundoNombre);
    if (errSN)
      return { titulo: "Nombre inválido", msg: `Segundo Nombre: ${errSN}` };
  }
  if (fd.segundoApellido) {
    const errSA = validarNombre(fd.segundoApellido);
    if (errSA)
      return { titulo: "Apellido inválido", msg: `Segundo Apellido: ${errSA}` };
  }
  return null;
}

function validarContactoGU(fd) {
  if (fd.telefono) {
    const errTelGU = validarTelefono(fd.telefono);
    if (errTelGU) return { titulo: "Teléfono inválido", msg: errTelGU };
  }
  if (fd.correoElectronico) {
    const errEmailGU = validarEmail(fd.correoElectronico);
    if (errEmailGU) return { titulo: "Correo inválido", msg: errEmailGU };
  }
  return null;
}

function validarFormularioGU(fd) {
  if (!fd.tipoDocumentoId)
    return { titulo: "Error", msg: "Seleccione un tipo de documento." };
  if (!fd.numeroDocumento?.trim())
    return { titulo: "Error", msg: "Ingrese el número de documento." };
  if (!fd.rolesId) return { titulo: "Error", msg: "Seleccione un rol." };

  const errNombres = validarNombresGU(fd);
  if (errNombres) return errNombres;

  const tipoDocNombreGU =
    TIPO_DOC_MAP[Number.parseInt(fd.tipoDocumentoId)] || "";
  const errDocGU = validarDocumento(
    fd.numeroDocumento,
    fd.tipoDocumentoId,
    tipoDocNombreGU,
  );
  if (errDocGU) return { titulo: "Documento inválido", msg: errDocGU };

  return validarContactoGU(fd);
}

const traducirMensajeBackend = (errData) => {
  if (errData === null || errData === undefined)
    return "Datos invalidos o incompletos.";
  if (typeof errData === "string") return traducirString(errData);
  if (Array.isArray(errData))
    return errData.map(traducirMensajeBackend).join(" ");
  if (typeof errData === "object") return traducirObjeto(errData);
  return "Hay un problema con los datos ingresados. Revise el formulario e intente nuevamente.";
};

const obtenerIniciales = (user) => {
  if (user.primerNombre && user.primerApellido)
    return (user.primerNombre[0] + user.primerApellido[0]).toUpperCase();
  return (user.username || "US").substring(0, 2).toUpperCase();
};

const obtenerNombreCompleto = (user) => {
  const partes = [
    user.primerNombre,
    user.segundoNombre,
    user.primerApellido,
    user.segundoApellido,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : user.username || "Sin nombre";
};

/* Fotos en localStorage */
const getPhotos = () => {
  try {
    return JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};
const savePhoto = (docOrUser, base64) => {
  const photos = getPhotos();
  photos[docOrUser] = base64;
  localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
};

/** Helpers para reducir complejidad cognitiva */
const activeIf = (cond) => (cond ? "active" : "");
const pluralS = (n) => (n === 1 ? "" : "s");

function GestionUsuarios() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLog, setUsuarioLog] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [soloEnLinea, setSoloEnLinea] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;
  const [showModalRegistrar, setShowModalRegistrar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [detalleUsuario, setDetalleUsuario] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [vistaGrid, setVistaGrid] = useState(false);
  const [photoTarget, setPhotoTarget] = useState(null);
  const [userPhotos, setUserPhotos] = useState(getPhotos());
  const [usuariosEnLinea, setUsuariosEnLinea] = useState({});
  const modalFileInputRef = useRef(null);
  const [formPhoto, setFormPhoto] = useState(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    tipoDocumentoId: "",
    numeroDocumento: "",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    telefono: "",
    correoElectronico: "",
    password: "",
    rolesId: "",
    username: "",
    originalUsername: "",
  });

  // Token helpers (importados de utils/auth.js)
  const obtenerUsernameFromToken = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1])).username;
    } catch {
      return null;
    }
  };

  const usernameActual = useMemo(() => {
    const t = localStorage.getItem("token");
    return t ? obtenerUsernameFromToken(t) : null;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || verificarTokenVencido(token)) {
      Swal.fire({
        icon: "warning",
        title: "Sesion expirada",
        text: "La sesion expiro. Vuelva a iniciar sesion.",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      });
      return;
    }
    const rol = obtenerRolFromToken(token);
    if (rol !== 1) {
      Swal.fire({
        icon: "error",
        title: "Sin permisos",
        text: "Solo el Super Administrador puede acceder a Gestion de Usuarios.",
        timer: 2500,
        showConfirmButton: false,
      }).then(() => navigate(-1));
      return;
    }
    const userGuardado = localStorage.getItem("user");
    if (userGuardado) {
      try {
        setUsuarioLog(JSON.parse(userGuardado));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      }
    }
  }, [navigate]);

  const cargarUsuarios = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const data = await obtenerUsuarios(token);
      setUsuarios(data);
      // Hidratar localStorage con fotos que vienen de la BD
      const photosLocales = getPhotos();
      let actualizadas = false;
      data.forEach((u) => {
        if (u.fotoPerfil) {
          const key = u.numeroDocumento || u.username;
          if (photosLocales[key] !== u.fotoPerfil) {
            photosLocales[key] = u.fotoPerfil;
            actualizadas = true;
          }
        }
      });
      if (actualizadas) {
        localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photosLocales));
        setUserPhotos({ ...photosLocales });
      }
    } catch {
      /* fallo al sincronizar fotos de perfil */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  /* Polling: consultar usuarios en línea cada 30 segundos */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchEnLinea = async () => {
      try {
        const mapa = await obtenerUsuariosEnLinea(token);
        setUsuariosEnLinea(mapa);
      } catch (error) {
        console.warn("Error en polling de usuarios en línea:", error);
      }
    };

    fetchEnLinea(); // Primera carga inmediata
    const intervalo = setInterval(fetchEnLinea, 30000); // Cada 30s

    return () => clearInterval(intervalo);
  }, []);

  /** Determina el estado visual del dot: 'en-linea', 'activo', 'inactivo' */
  const obtenerEstadoDot = (user) => {
    if (user.estadoId === 2) return "inactivo";
    if (usuariosEnLinea[user.username]) return "en-linea";
    return "activo";
  };

  /** Texto tooltip del dot */
  const obtenerTitleDot = (user) => {
    if (user.estadoId === 2) return "Inactivo";
    if (usuariosEnLinea[user.username]) return "En línea";
    return "Activo (desconectado)";
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios
      .filter((u) => {
        const texto = busqueda.toLowerCase();
        const coincideBusqueda =
          !texto ||
          (u.username || "").toLowerCase().includes(texto) ||
          (u.numeroDocumento || "").toString().includes(texto) ||
          (u.primerNombre || "").toLowerCase().includes(texto) ||
          (u.primerApellido || "").toLowerCase().includes(texto);
        const coincideEstado =
          filtroEstado === "todos" ||
          (filtroEstado === "activo" && u.estadoId === 1) ||
          (filtroEstado === "inactivo" && u.estadoId === 2);
        const coincideRol =
          filtroRol === "todos" || u.rolesId === Number.parseInt(filtroRol);
        const coincideEnLinea = !soloEnLinea || !!usuariosEnLinea[u.username];
        return (
          coincideBusqueda && coincideEstado && coincideRol && coincideEnLinea
        );
      })
      .sort((a, b) => {
        if (a.estadoId !== b.estadoId) return a.estadoId - b.estadoId;
        return 0;
      });
  }, [
    usuarios,
    busqueda,
    filtroEstado,
    filtroRol,
    soloEnLinea,
    usuariosEnLinea,
  ]);

  const totalUsuarios = usuarios.length;
  const activos = usuarios.filter((u) => u.estadoId === 1).length;
  const inactivos = usuarios.filter((u) => u.estadoId === 2).length;
  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indiceInicio, indiceFin);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado, filtroRol]);

  const getPaginasVisibles = () => {
    const paginas = [];
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + 4);
    if (fin - inicio < 4) inicio = Math.max(1, fin - 4);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  };

  const resetForm = () => {
    setFormData({
      tipoDocumentoId: "",
      numeroDocumento: "",
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      telefono: "",
      correoElectronico: "",
      password: "",
      rolesId: "",
      username: "",
      originalUsername: "",
    });
    setFormPhoto(null);
    setFormPhotoPreview(null);
  };
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* Foto upload */
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !photoTarget) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Imagen muy grande",
        text: "El archivo no debe superar 2MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const key = photoTarget.numeroDocumento || photoTarget.username;
      savePhoto(key, ev.target.result);
      setUserPhotos(getPhotos());
      // Guardar en la BD
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await actualizarFotoPerfil(
            photoTarget.username,
            ev.target.result,
            token,
          );
        } catch (err) {
          console.error("No se pudo sincronizar foto:", err);
        }
      }
      setPhotoTarget(null);
      Swal.fire({
        icon: "success",
        title: "Foto actualizada",
        timer: 1500,
        showConfirmButton: false,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const abrirSubirFoto = (user) => {
    setPhotoTarget(user);
    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.click();
    }, 100);
  };

  const eliminarFoto = async (user) => {
    const key = user.numeroDocumento || user.username;
    const photos = getPhotos();
    delete photos[key];
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
    setUserPhotos({ ...photos });
    // Eliminar en la BD
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await actualizarFotoPerfil(user.username, null, token);
      } catch (err) {
        console.error("No se pudo eliminar foto:", err);
      }
    }
    Swal.fire({
      icon: "info",
      title: "Foto eliminada",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const getUserPhoto = (user) => {
    return (
      userPhotos[user.numeroDocumento] || userPhotos[user.username] || null
    );
  };

  /* Foto en modales (registrar/editar) */
  const handleModalPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Imagen muy grande",
        text: "El archivo no debe superar 2MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormPhoto(ev.target.result);
      setFormPhotoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const triggerModalPhotoInput = () => {
    setTimeout(() => {
      if (modalFileInputRef.current) modalFileInputRef.current.click();
    }, 100);
  };

  const removeFormPhoto = () => {
    setFormPhoto(null);
    setFormPhotoPreview(null);
  };

  /* Registrar */
  const manejarDocDuplicadoFE = async (existente, token) => {
    if (existente.estadoId === 1) {
      Swal.fire({
        icon: "info",
        title: "Usuario ya existe",
        html: `<b>${existente.primerNombre} ${existente.primerApellido}</b> ya se encuentra <b>activo</b> con ese número de documento.<br/><br/>Si necesita modificar su información, puede editarlo desde la tabla.`,
        confirmButtonText: "Entendido",
      });
      return;
    }
    const result = await Swal.fire({
      icon: "info",
      title: "Usuario inactivo encontrado",
      html: `<b>${existente.primerNombre} ${existente.primerApellido}</b> ya existe con ese documento pero se encuentra <b>inactivo</b>.<br/><br/>¿Desea reactivarlo en lugar de crear un nuevo usuario?`,
      showCancelButton: true,
      confirmButtonText: "Sí, reactivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      const resAct = await activarUsuarioService(existente.username, token);
      if (resAct.ok) {
        await Swal.fire({
          icon: "success",
          title: "Usuario reactivado",
          timer: 3000,
          showConfirmButton: false,
        });
        await cargarUsuarios();
        setShowModalRegistrar(false);
        resetForm();
      } else {
        Swal.fire("Error", "No se pudo reactivar el usuario.", "error");
      }
    }
  };

  const manejar409GU = async (dataRes, token) => {
    const verif =
      dataRes?.verficacions ||
      dataRes?.verficaciones ||
      dataRes?.verificaciones ||
      null;
    const backendMsg = dataRes?.message || dataRes?.mensaje || "";
    if (verif?.numeroDocumento) {
      const result = await Swal.fire({
        title: "Usuario existente",
        html:
          (backendMsg || "Ya existe un usuario con ese documento.") +
          "<br/><br/>Desea reactivar este usuario?",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Si, reactivar",
        cancelButtonText: "No, cancelar",
        reverseButtons: true,
      });
      if (result.isConfirmed) {
        const payload = {
          numeroDocumento: verif.numeroDocumento,
          volverActivar: 1,
        };
        const resAct = await fetch(`${API_BASE}/usuario`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(payload),
        });
        if (resAct.ok) {
          await Swal.fire({
            icon: "success",
            title: "Usuario reactivado",
            timer: 3000,
            showConfirmButton: false,
          });
          await cargarUsuarios();
          setShowModalRegistrar(false);
          resetForm();
          return;
        }
      }
    }
    setShowModalRegistrar(false);
    resetForm();
  };

  /** Parsea respuesta fetch como JSON o texto */
  const parseJsonOrText = async (res) => {
    const ct = res.headers.get("content-type");
    return ct?.includes("application/json")
      ? await res.json()
      : await res.text();
  };

  /** Maneja errores HTTP comunes de registro/edición */
  const manejarErrorHttpGU = async (status, data, token) => {
    if (status === 400) {
      Swal.fire({
        icon: "warning",
        title: "Error de validacion",
        text: traducirMensajeBackend(data),
      });
      return;
    }
    if (status === 409) {
      await manejar409GU(data, token);
      return;
    }
    if (status >= 500) {
      Swal.fire({
        icon: "error",
        title: "Error de servidor",
        text: "Error en el servidor. Comuniquese con el area de sistemas.",
      });
      return;
    }
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo completar la operación.",
    });
  };

  /** Guarda foto local y la sincroniza al backend */
  const guardarFotoGU = async (photo, docKey, username, token) => {
    if (!photo) return;
    const photoKey = docKey || username || "";
    if (photoKey) {
      savePhoto(photoKey, photo);
      setUserPhotos(getPhotos());
    }
    if (username && token) {
      try {
        await actualizarFotoPerfil(username, photo, token);
      } catch (error) {
        console.warn("Foto no sincronizada:", error);
      }
    }
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    const errForm = validarFormularioGU(formData);
    if (errForm) {
      Swal.fire(errForm.titulo, errForm.msg, "error");
      return;
    }

    setSubmitting(true);
    try {
      const doc = formData.numeroDocumento?.trim().toLowerCase();
      if (doc) {
        const existente = usuarios.find(
          (u) => u.numeroDocumento?.toLowerCase() === doc,
        );
        if (existente) {
          await manejarDocDuplicadoFE(existente, token);
          return;
        }
      }
      const datos = {
        password: formData.password,
        rolesId: Number.parseInt(formData.rolesId),
        estadoId: 1,
        numeroDocumento: formData.numeroDocumento,
        tipoDocumentoId: Number.parseInt(formData.tipoDocumentoId),
        primerNombre: formData.primerNombre,
        segundoNombre: formData.segundoNombre,
        primerApellido: formData.primerApellido,
        segundoApellido: formData.segundoApellido,
        telefono: formData.telefono,
        correoElectronico: formData.correoElectronico,
      };
      const res = await registrarUsuario(datos, token);
      const dataRes = await parseJsonOrText(res);
      if (!res.ok) {
        await manejarErrorHttpGU(res.status, dataRes, token);
        return;
      }
      await guardarFotoGU(
        formPhoto,
        formData.numeroDocumento,
        dataRes.usuario?.username || "",
        token,
      );
      await Swal.fire({
        icon: "success",
        title: "Registrado correctamente",
        text:
          "Username asignado: " +
          (dataRes.usuario?.username || dataRes.idUsuario || ""),
        timer: 3500,
        showConfirmButton: false,
      });
      resetForm();
      await cargarUsuarios();
      setShowModalRegistrar(false);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lo siento",
        text: "Error de conexion. Comuniquese con el area de sistemas.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* Abrir modal editar */
  const abrirModalEditar = async (user) => {
    const token = localStorage.getItem("token");
    try {
      const u = await obtenerUsuarioPorId(user.username, token);
      setFormData((prev) => ({
        ...prev,
        username: u.username || "",
        originalUsername: u.username || "",
        rolesId: u.rolesId || "",
        numeroDocumento: u.numeroDocumento || "",
        password: "",
      }));
      if (u.numeroDocumento) {
        const p = await obtenerPersonaPorDocumento(u.numeroDocumento, token);
        setFormData((prev) => ({
          ...prev,
          tipoDocumentoId: p.tipoDocumentoId || "",
          primerNombre: p.primerNombre || "",
          segundoNombre: p.segundoNombre || "",
          primerApellido: p.primerApellido || "",
          segundoApellido: p.segundoApellido || "",
          telefono: p.telefono || "",
          correoElectronico: p.correoElectronico || "",
        }));
      }
    } catch (err) {
      console.error(err);
      setFormData({
        username: user.username || "",
        originalUsername: user.username || "",
        rolesId: user.rolesId || "",
        numeroDocumento: user.numeroDocumento || "",
        tipoDocumentoId: "",
        primerNombre: user.primerNombre || "",
        segundoNombre: user.segundoNombre || "",
        primerApellido: user.primerApellido || "",
        segundoApellido: user.segundoApellido || "",
        telefono: user.telefono || "",
        correoElectronico: user.correoElectronico || "",
        password: "",
      });
    }
    setShowModalEditar(true);
    /* Pre-cargar foto existente en el preview */
    const existingPhoto = getUserPhoto(user);
    if (existingPhoto) {
      setFormPhoto(existingPhoto);
      setFormPhotoPreview(existingPhoto);
    } else {
      setFormPhoto(null);
      setFormPhotoPreview(null);
    }
  };

  /** Construye payload de edición filtrando campos vacíos */
  const buildPayloadEditar = (fd, username) => {
    const INT_FIELDS = new Set(["rolesId", "tipoDocumentoId"]);
    const campos = {
      username,
      password: fd.password,
      numeroDocumento: fd.numeroDocumento,
      primerNombre: fd.primerNombre,
      segundoNombre: fd.segundoNombre,
      primerApellido: fd.primerApellido,
      segundoApellido: fd.segundoApellido,
      telefono: fd.telefono,
      correoElectronico: fd.correoElectronico,
      rolesId: fd.rolesId,
      tipoDocumentoId: fd.tipoDocumentoId,
    };
    const payload = {};
    for (const [key, val] of Object.entries(campos)) {
      if (!val) continue;
      payload[key] = INT_FIELDS.has(key) ? Number.parseInt(val) : val;
    }
    return payload;
  };

  /* Editar */
  const handleEditar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    const targetUsername =
      formData.username?.trim() || formData.originalUsername;
    if (!formData.primerNombre || !formData.primerApellido) {
      Swal.fire(
        "Error",
        "Los campos 'Primer Nombre' y 'Primer Apellido' son obligatorios y no pueden contener espacios, tildes ni caracteres especiales.",
        "error",
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayloadEditar(formData, targetUsername);
      const res = await editarUsuario(targetUsername, payload, token);
      const data = await parseJsonOrText(res);
      if (!res.ok) {
        await manejarErrorHttpGU(res.status, data, token);
        return;
      }
      await guardarFotoGU(
        formPhoto,
        formData.numeroDocumento,
        targetUsername,
        token,
      );
      await Swal.fire({
        icon: "success",
        title: "Actualizado correctamente",
        timer: 3000,
        showConfirmButton: false,
      });
      await cargarUsuarios();
      setShowModalEditar(false);
      resetForm();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lo siento",
        text: "Error de conexion.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* Inactivar - con proteccion de auto-eliminacion */
  const inactivarUsuario = async (username) => {
    if (username === usernameActual) {
      Swal.fire({
        icon: "error",
        title: "Accion no permitida",
        text: "No puedes inactivar tu propia cuenta mientras la estas usando.",
      });
      return;
    }
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: "Estas seguro?",
      text: "El usuario sera inactivado y no podra acceder al sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, inactivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await finalizarUsuarioService(username, token);
      if (!res.ok) {
        const ct = res.headers.get("content-type");
        const ed = ct?.includes("application/json")
          ? await res.json()
          : await res.text();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: traducirMensajeBackend(ed),
        });
        return;
      }
      setUsuarios((prev) =>
        prev.map((u) => (u.username === username ? { ...u, estadoId: 2 } : u)),
      );
      await Swal.fire({
        icon: "success",
        title: "Usuario inactivado",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error de conexion" });
    }
  };

  /* Activar */
  const activarUsuario = async (username) => {
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: "Reactivar usuario?",
      text: "El usuario podra volver a acceder al sistema.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Si, activar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await activarUsuarioService(username, token);
      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo activar el usuario.",
        });
        return;
      }
      setUsuarios((prev) =>
        prev.map((u) => (u.username === username ? { ...u, estadoId: 1 } : u)),
      );
      Swal.fire({
        icon: "success",
        title: "Usuario activado",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error de conexion" });
    }
  };

  /* Ver detalles */
  const verDetalles = async (user) => {
    const token = localStorage.getItem("token");
    let detalle = { ...user };
    try {
      if (user.numeroDocumento) {
        const p = await obtenerPersonaPorDocumento(user.numeroDocumento, token);
        detalle = { ...detalle, ...p };
      }
    } catch (error) {
      console.warn("Persona sin ficha:", error);
    }
    setDetalleUsuario(detalle);
    setShowModalDetalle(true);
  };

  const cerrarSesion = useLogout();

  const esUsuarioActual = (username) => username === usernameActual;

  if (loading && usuarios.length === 0) {
    return (
      <div className="gu-loading-screen">
        <output className="spinner-border" style={{ color: "#7b1fa2" }}>
          <span className="visually-hidden">Cargando...</span>
        </output>
        <p className="mt-3 fw-semibold" style={{ color: "#7b1fa2" }}>
          Cargando usuarios...
        </p>
      </div>
    );
  }

  return (
    <div className="gu-dashboard">
      {/* File input oculto para fotos (grid) */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handlePhotoUpload}
      />
      {/* File input oculto para fotos (modales registrar/editar) */}
      <input
        type="file"
        ref={modalFileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleModalPhotoSelect}
      />

      <button
        type="button"
        className={`gu-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        tabIndex={0}
        aria-label="Cerrar menú"
      />

      {/* DRAWER */}
      <aside className={`gu-drawer ${menuOpen ? "open" : ""}`}>
        <div className="gu-drawer-header">
          <div className="gu-drawer-avatar">
            {(() => {
              const foto = usuarioLog
                ? getUserPhoto(usuarioLog) ||
                  getUserPhoto({ username: usuarioLog.username })
                : null;
              return foto ? (
                <img
                  src={foto}
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
              );
            })()}
          </div>
          <h4 className="gu-drawer-title">Menu Super Admin</h4>
          <span className="gu-drawer-user">
            {usuarioLog?.username || "Usuario"}
          </span>
        </div>
        <div className="gu-drawer-body">
          <div className="gu-menu-section">
            <h6 className="gu-menu-section-title">Navegación</h6>
            <Link
              className="gu-menu-item"
              to="/Superadmin"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item active"
              to="/GestionUsuario"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-person-gear"></i>
              <span>Gestion Usuarios</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
          </div>
          <div className="gu-menu-section">
            <h6 className="gu-menu-section-title">Módulos</h6>
            <Link
              className="gu-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paqueteria</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item"
              to="/AreasComunes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-calendar2-week"></i>
              <span>Areas Comunes</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item"
              to="/Residentes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-house-door"></i>
              <span>Residentes</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item"
              to="/Auditorias"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-journal-text"></i>
              <span>Auditorias</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item"
              to="/Reportes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-bar-chart-line"></i>
              <span>Reportes</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
            <Link
              className="gu-menu-item"
              to="/LogErrores"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-bug"></i>
              <span>Log de Errores</span>
              <i className="bi bi-chevron-right gu-menu-arrow"></i>
            </Link>
          </div>
        </div>
        <div className="gu-drawer-footer">
          <button className="gu-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i> Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="gu-main">
        <header className="gu-header">
          <button
            className="gu-header-btn"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="gu-header-center">
            <h5 className="gu-header-title">Gestion de Usuarios</h5>
          </div>
          <div className="gu-header-actions">
            <button
              className="gu-header-btn"
              onClick={cargarUsuarios}
              disabled={loading}
              title="Actualizar"
            >
              <i
                className={`bi ${loading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            <button
              className="gu-header-btn"
              onClick={() => setMenuOpen(true)}
              title="Menu"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        <div className="gu-content">
          {/* Stats */}
          <div className="gu-stats-container">
            <div className="gu-stat-box">
              <div className="gu-stat-label" style={{ color: "#7b1fa2" }}>
                Total
              </div>
              <div className="gu-stat-value" style={{ color: "#4a148c" }}>
                {totalUsuarios}
              </div>
            </div>
            <div className="gu-stat-box">
              <div className="gu-stat-label" style={{ color: "#2e7d32" }}>
                En linea
              </div>
              <div className="gu-stat-value" style={{ color: "#2e7d32" }}>
                {Object.keys(usuariosEnLinea).length}
              </div>
            </div>
            <div className="gu-stat-box">
              <div className="gu-stat-label" style={{ color: "#fb8c00" }}>
                Activos
              </div>
              <div className="gu-stat-value" style={{ color: "#fb8c00" }}>
                {activos}
              </div>
            </div>
            <div className="gu-stat-box">
              <div className="gu-stat-label" style={{ color: "#c62828" }}>
                Inactivos
              </div>
              <div className="gu-stat-value" style={{ color: "#c62828" }}>
                {inactivos}
              </div>
            </div>
          </div>

          {/* Leyenda de indicadores - solo visible en vista grid */}
          {vistaGrid && (
            <div className="gu-legend">
              <span className="gu-legend-item">
                <span className="gu-legend-dot en-linea"></span>En linea
              </span>
              <span className="gu-legend-item">
                <span className="gu-legend-dot activo"></span>Activo
                (desconectado)
              </span>
              <span className="gu-legend-item">
                <span className="gu-legend-dot inactivo"></span>Inactivo
              </span>
            </div>
          )}

          {/* Action bar */}
          <div className="gu-action-bar">
            <button
              className="gu-btn-registrar"
              onClick={() => {
                resetForm();
                setShowModalRegistrar(true);
              }}
            >
              <i className="bi bi-person-plus"></i> Nuevo Usuario
            </button>
            <div className="gu-view-toggle">
              <button
                className={`gu-view-btn ${activeIf(!vistaGrid)}`}
                onClick={() => setVistaGrid(false)}
                title="Vista lista"
              >
                <i className="bi bi-list-ul"></i>
              </button>
              <button
                className={`gu-view-btn ${activeIf(vistaGrid)}`}
                onClick={() => setVistaGrid(true)}
                title="Vista cuadricula"
              >
                <i className="bi bi-grid-3x3-gap-fill"></i>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="gu-toolbar">
            <div className="gu-toolbar-row">
              <div className="gu-filter-search">
                <i className="bi bi-search gu-filter-search-icon"></i>
                <input
                  type="text"
                  className="form-control gu-filter-input"
                  placeholder="Buscar por nombre, usuario o documento..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="gu-filter-group">
                <span className="gu-filter-label">Estado:</span>
                <div className="gu-filter-chips">
                  {[
                    { key: "todos", label: "Todos" },
                    { key: "activo", label: "Activos" },
                    { key: "inactivo", label: "Inactivos" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      className={`gu-chip ${filtroEstado === f.key ? "active" : ""}`}
                      onClick={() => setFiltroEstado(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="gu-filter-select-wrap">
                <i className="bi bi-funnel gu-filter-select-icon"></i>
                <select
                  className="form-select gu-filter-select"
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                >
                  <option value="todos">Todos los Roles</option>
                  <option value="1">Super Administrador</option>
                  <option value="2">Administrador</option>
                  <option value="3">Vigilante</option>
                </select>
              </div>
              <div className="gu-switch-group">
                <span className="gu-switch-dot-indicator"></span>
                <span className="gu-filter-label">Solo en línea</span>
                <button
                  className={`gu-toggle ${soloEnLinea ? "active" : ""}`}
                  onClick={() => setSoloEnLinea(!soloEnLinea)}
                  role="switch"
                  aria-checked={soloEnLinea}
                  title={
                    soloEnLinea
                      ? "Mostrando solo usuarios en línea"
                      : "Mostrar solo usuarios en línea"
                  }
                >
                  <span className="gu-toggle-thumb"></span>
                </button>
              </div>
            </div>
            {usuariosFiltrados.length > 0 && (
              <p className="gu-results-info">
                {usuariosFiltrados.length} usuario
                {pluralS(usuariosFiltrados.length)} encontrado
                {pluralS(usuariosFiltrados.length)}
              </p>
            )}
          </div>

          {/* Empty */}
          {!loading && usuariosFiltrados.length === 0 && (
            <div className="gu-empty-container">
              <i className="bi bi-people gu-empty-icon"></i>
              <h5>No se encontraron usuarios</h5>
              <p>Intenta cambiar los filtros de busqueda</p>
            </div>
          )}

          {/* TABLE (desktop, vista lista) */}
          {usuariosFiltrados.length > 0 && !vistaGrid && (
            <div className="gu-table-container">
              <table className="gu-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Contacto</th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosPaginados.map((u) => (
                    <tr key={u.username}>
                      <td>
                        <strong>{u.username}</strong>
                      </td>
                      <td>{obtenerNombreCompleto(u)}</td>
                      <td>{u.numeroDocumento || "N/A"}</td>
                      <td>
                        <span className="gu-badge gu-badge-rol">
                          {ROLES_MAP[u.rolesId] || u.rolesId}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`gu-table-status-dot ${obtenerEstadoDot(u)}`}
                          title={obtenerTitleDot(u)}
                        ></span>
                        <span
                          className={`gu-badge ${u.estadoId === 1 ? "gu-badge-activo" : "gu-badge-inactivo"}`}
                        >
                          {ESTADO_MAP[u.estadoId] || u.estadoId}
                        </span>
                      </td>
                      <td>
                        {u.correoElectronico || u.telefono || "Sin contacto"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="gu-action-btn info"
                          title="Ver detalles"
                          onClick={() => verDetalles(u)}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        {u.estadoId === 1 && (
                          <div style={{ display: 'contents' }}>
                            <button
                              className="gu-action-btn edit"
                              title="Editar"
                              onClick={() => abrirModalEditar(u)}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            {!esUsuarioActual(u.username) && (
                              <button
                                className="gu-action-btn toggle-off"
                                title="Inactivar"
                                onClick={() => inactivarUsuario(u.username)}
                              >
                                <i className="bi bi-person-dash-fill"></i>
                              </button>
                            )}
                          </div>
                        )}
                        {u.estadoId === 2 && (
                          <button
                            className="gu-action-btn toggle-on"
                            title="Activar"
                            onClick={() => activarUsuario(u.username)}
                          >
                            <i className="bi bi-person-check-fill"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CARDS (mobile, vista lista) */}
          {usuariosFiltrados.length > 0 && !vistaGrid && (
            <div className="gu-cards-container">
              {usuariosPaginados.map((u) => (
                <div key={u.username} className="gu-card">
                  <div className="gu-card-header">
                    <div className="gu-card-avatar">{obtenerIniciales(u)}</div>
                    <div className="gu-card-header-info">
                      <h6 className="gu-card-name">
                        {obtenerNombreCompleto(u)}
                      </h6>
                      <span className="gu-card-username">@{u.username}</span>
                    </div>
                    <span
                      className={`gu-badge ${u.estadoId === 1 ? "gu-badge-activo" : "gu-badge-inactivo"}`}
                    >
                      {ESTADO_MAP[u.estadoId] || u.estadoId}
                    </span>
                  </div>
                  <div className="gu-card-row">
                    <div className="gu-card-row-icon doc">
                      <i className="bi bi-credit-card-2-front"></i>
                    </div>
                    <span className="gu-card-row-text">
                      {u.numeroDocumento || "Sin documento"}
                    </span>
                  </div>
                  <div className="gu-card-row">
                    <div className="gu-card-row-icon rol">
                      <i className="bi bi-shield-lock"></i>
                    </div>
                    <span className="gu-card-row-text">
                      {ROLES_MAP[u.rolesId] || "Sin rol"}
                    </span>
                  </div>
                  <div className="gu-card-row">
                    <div className="gu-card-row-icon email">
                      <i
                        className={`bi ${u.correoElectronico ? "bi-envelope" : "bi-telephone"}`}
                      ></i>
                    </div>
                    <span className="gu-card-row-text">
                      {u.correoElectronico || u.telefono || "Sin contacto"}
                    </span>
                  </div>
                  <div className="gu-card-actions">
                    <button
                      className="gu-card-btn detalles"
                      onClick={() => verDetalles(u)}
                    >
                      <i className="bi bi-eye"></i> Detalles
                    </button>
                    {u.estadoId === 1 && (
                      <div style={{ display: 'contents' }}>
                        <button
                          className="gu-card-btn editar"
                          onClick={() => abrirModalEditar(u)}
                        >
                          <i className="bi bi-pencil"></i> Editar
                        </button>
                        {!esUsuarioActual(u.username) && (
                          <button
                            className="gu-card-btn inactivar"
                            onClick={() => inactivarUsuario(u.username)}
                          >
                            <i className="bi bi-person-dash"></i> Inactivar
                          </button>
                        )}
                      </div>
                    )}
                    {u.estadoId === 2 && (
                      <button
                        className="gu-card-btn activar"
                        onClick={() => activarUsuario(u.username)}
                      >
                        <i className="bi bi-person-check"></i> Activar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GRID VIEW (cuadricula con fotos) */}
          {usuariosFiltrados.length > 0 && vistaGrid && (
            <div className="gu-grid-container">
              {usuariosPaginados.map((u) => {
                const foto = getUserPhoto(u);
                return (
                  <div
                    key={u.username}
                    className={`gu-grid-card ${u.estadoId === 2 ? "inactive" : ""}`}
                  >
                    <div className="gu-grid-photo-wrap">
                      {foto ? (
                        <img
                          src={foto}
                          alt={u.username}
                          className="gu-grid-photo"
                        />
                      ) : (
                        <div className="gu-grid-avatar">
                          {obtenerIniciales(u)}
                        </div>
                      )}
                      <div className="gu-grid-photo-overlay">
                        <button
                          className="gu-grid-photo-btn"
                          onClick={() => abrirSubirFoto(u)}
                          title="Subir foto"
                        >
                          <i className="bi bi-camera-fill"></i>
                        </button>
                        {foto && (
                          <button
                            className="gu-grid-photo-btn delete"
                            onClick={() => eliminarFoto(u)}
                            title="Eliminar foto"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        )}
                      </div>
                      <span
                        className={`gu-grid-estado-dot ${obtenerEstadoDot(u)}`}
                        title={obtenerTitleDot(u)}
                      ></span>
                    </div>
                    <div className="gu-grid-info">
                      <h6 className="gu-grid-name">
                        {obtenerNombreCompleto(u)}
                      </h6>
                      <span className="gu-grid-username">@{u.username}</span>
                      <span
                        className="gu-badge gu-badge-rol"
                        style={{ marginTop: "4px", fontSize: "10px" }}
                      >
                        {ROLES_MAP[u.rolesId] || u.rolesId}
                      </span>
                      <span className="gu-grid-contact">
                        {u.correoElectronico || u.telefono || "Sin contacto"}
                      </span>
                    </div>
                    <div className="gu-grid-actions">
                      <button
                        className="gu-grid-action-btn info"
                        title="Detalles"
                        onClick={() => verDetalles(u)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {u.estadoId === 1 && (
                        <div style={{ display: 'contents' }}>
                          <button
                            className="gu-grid-action-btn edit"
                            title="Editar"
                            onClick={() => abrirModalEditar(u)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          {!esUsuarioActual(u.username) && (
                            <button
                              className="gu-grid-action-btn toggle-off"
                              title="Inactivar"
                              onClick={() => inactivarUsuario(u.username)}
                            >
                              <i className="bi bi-person-dash"></i>
                            </button>
                          )}
                        </div>
                      )}
                      {u.estadoId === 2 && (
                        <button
                          className="gu-grid-action-btn toggle-on"
                          title="Activar"
                          onClick={() => activarUsuario(u.username)}
                        >
                          <i className="bi bi-person-check"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION */}
          {usuariosFiltrados.length > 0 && totalPaginas > 1 && (
            <div className="gu-pagination">
              <button
                className="gu-page-btn"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(1)}
                title="Primera"
              >
                <i className="bi bi-chevron-double-left"></i>
              </button>
              <button
                className="gu-page-btn"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                title="Anterior"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              {getPaginasVisibles().map((num) => (
                <button
                  key={num}
                  className={`gu-page-btn ${paginaActual === num ? "active" : ""}`}
                  onClick={() => setPaginaActual(num)}
                >
                  {num}
                </button>
              ))}
              <button
                className="gu-page-btn"
                disabled={paginaActual === totalPaginas}
                onClick={() =>
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                }
                title="Siguiente"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
              <button
                className="gu-page-btn"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual(totalPaginas)}
                title="Ultima"
              >
                <i className="bi bi-chevron-double-right"></i>
              </button>
              <span className="gu-page-info">
                {indiceInicio + 1} -{" "}
                {Math.min(indiceFin, usuariosFiltrados.length)} de{" "}
                {usuariosFiltrados.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL REGISTRAR */}
      <ModalOverlay
        isOpen={showModalRegistrar}
        onClose={() => setShowModalRegistrar(false)}
        confirmBeforeClose
        className="gu-modal-overlay"
      >
        <div className="gu-modal">
          <div className="gu-modal-header">
            <h5>
              <i className="bi bi-person-plus me-2"></i>Registrar Usuario
            </h5>
            <button
              className="gu-modal-close"
              onClick={() => setShowModalRegistrar(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="gu-modal-body">
            <form onSubmit={handleRegistrar}>
              {/* Seccion de foto opcional */}
              <div className="gu-form-photo-section">
                <button
                  type="button"
                  className="gu-form-photo-wrap"
                  onClick={triggerModalPhotoInput}
                  aria-label="Seleccionar foto de perfil"
                >
                  {formPhotoPreview ? (
                    <img
                      src={formPhotoPreview}
                      alt="Preview"
                      className="gu-form-photo-img"
                    />
                  ) : (
                    <div className="gu-form-photo-placeholder">
                      <i className="bi bi-camera-fill"></i>
                    </div>
                  )}
                  <div className="gu-form-photo-hover">
                    <i className="bi bi-pencil-fill"></i>
                  </div>
                </button>
                <div className="gu-form-photo-actions">
                  <button
                    type="button"
                    className="gu-form-photo-btn upload"
                    onClick={triggerModalPhotoInput}
                  >
                    <i className="bi bi-upload me-1"></i>
                    {formPhotoPreview ? "Cambiar foto" : "Agregar foto"}
                  </button>
                  {formPhotoPreview && (
                    <button
                      type="button"
                      className="gu-form-photo-btn remove"
                      onClick={removeFormPhoto}
                    >
                      <i className="bi bi-trash me-1"></i>Quitar
                    </button>
                  )}
                </div>
                <span className="gu-form-photo-hint">
                  <i className="bi bi-info-circle me-1"></i>Opcional - Max. 2MB
                </span>
              </div>

              <div className="gu-form-section">
                <h6 className="gu-form-section-title">
                  <i className="bi bi-person-badge me-2"></i>Datos Personales
                </h6>
                <div className="gu-form-grid">
                  <div className="gu-form-group">
                    <label htmlFor="gu-c-tipoDoc" className="gu-form-label">
                      Tipo Documento *
                    </label>
                    <select
                      id="gu-c-tipoDoc"
                      className="gu-form-control"
                      value={formData.tipoDocumentoId}
                      onChange={(e) =>
                        updateField("tipoDocumentoId", e.target.value)
                      }
                    >
                      <option value="">-- Tipo de documento --</option>
                      <option value="1">CC - Cédula de Ciudadanía</option>
                      <option value="2">CE - Cédula de Extranjería</option>
                      <option value="3">PP - Pasaporte</option>
                      <option value="4">
                        PEP - Permiso Especial de Permanencia
                      </option>
                      <option value="5">
                        PPT - Permiso de Protección Temporal
                      </option>
                    </select>
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-c-numDoc" className="gu-form-label">
                      Numero Documento *
                    </label>
                    <input
                      id="gu-c-numDoc"
                      type="text"
                      className="gu-form-control"
                      value={formData.numeroDocumento}
                      onChange={(e) =>
                        updateField(
                          "numeroDocumento",
                          filtrarInputDocumento(
                            e.target.value,
                            formData.tipoDocumentoId === "3",
                          ),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-c-primerNombre"
                      className="gu-form-label"
                    >
                      Primer Nombre *
                    </label>
                    <input
                      id="gu-c-primerNombre"
                      type="text"
                      className="gu-form-control"
                      value={formData.primerNombre}
                      onChange={(e) =>
                        updateField(
                          "primerNombre",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-c-segundoNombre"
                      className="gu-form-label"
                    >
                      Segundo Nombre
                    </label>
                    <input
                      id="gu-c-segundoNombre"
                      type="text"
                      className="gu-form-control"
                      value={formData.segundoNombre}
                      onChange={(e) =>
                        updateField(
                          "segundoNombre",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-c-primerApellido"
                      className="gu-form-label"
                    >
                      Primer Apellido *
                    </label>
                    <input
                      id="gu-c-primerApellido"
                      type="text"
                      className="gu-form-control"
                      value={formData.primerApellido}
                      onChange={(e) =>
                        updateField(
                          "primerApellido",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-c-segundoApellido"
                      className="gu-form-label"
                    >
                      Segundo Apellido
                    </label>
                    <input
                      id="gu-c-segundoApellido"
                      type="text"
                      className="gu-form-control"
                      value={formData.segundoApellido}
                      onChange={(e) =>
                        updateField(
                          "segundoApellido",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-c-telefono" className="gu-form-label">
                      Telefono
                    </label>
                    <input
                      id="gu-c-telefono"
                      type="text"
                      className="gu-form-control"
                      placeholder="Ej: 3101234567"
                      value={formData.telefono}
                      onChange={(e) =>
                        updateField("telefono", filtrarInputTelefono(e.target.value))
                      }
                      maxLength={10}
                    />
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-c-correo" className="gu-form-label">
                      Correo Electronico
                    </label>
                    <input
                      id="gu-c-correo"
                      type="email"
                      className="gu-form-control"
                      value={formData.correoElectronico}
                      onChange={(e) =>
                        updateField("correoElectronico", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="gu-form-section">
                <h6 className="gu-form-section-title">
                  <i className="bi bi-shield-lock me-2"></i>Datos de Cuenta
                </h6>
                <div className="gu-form-grid">
                  <div className="gu-form-group">
                    <label htmlFor="gu-c-password" className="gu-form-label">
                      Contrasena *
                    </label>
                    <input
                      id="gu-c-password"
                      type="password"
                      className="gu-form-control"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimo 6 caracteres"
                    />
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-c-rol" className="gu-form-label">
                      Rol *
                    </label>
                    <select
                      id="gu-c-rol"
                      className="gu-form-control"
                      value={formData.rolesId}
                      onChange={(e) => updateField("rolesId", e.target.value)}
                    >
                      <option value="">-- Selecciona rol --</option>
                      <option value="3">Vigilante</option>
                      <option value="2">Administrador</option>
                      <option value="1">Super Administrador</option>
                    </select>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9e9e9e",
                    marginTop: "8px",
                  }}
                >
                  <i className="bi bi-info-circle me-1"></i>El username se
                  generara automaticamente.
                </p>
              </div>
              <button
                type="submit"
                className="gu-form-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <div style={{ display: 'contents' }}>
                    <span className="spinner-border spinner-border-sm me-2"></span>{" "}
                    Registrando...
                  </div>
                ) : (
                  <div style={{ display: 'contents' }}>
                    <i className="bi bi-person-plus me-2"></i>Registrar Usuario
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </ModalOverlay>

      {/* MODAL EDITAR */}
      <ModalOverlay
        isOpen={showModalEditar}
        onClose={() => {
          setShowModalEditar(false);
          resetForm();
        }}
        confirmBeforeClose
        className="gu-modal-overlay"
      >
        <div className="gu-modal">
          <div className="gu-modal-header">
            <h5>
              <i className="bi bi-pencil-square me-2"></i>Editar Usuario
            </h5>
            <button
              className="gu-modal-close"
              onClick={() => {
                setShowModalEditar(false);
                resetForm();
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="gu-modal-body">
            <form onSubmit={handleEditar}>
              {/* Seccion de foto opcional */}
              <div className="gu-form-photo-section">
                <button
                  type="button"
                  className="gu-form-photo-wrap"
                  onClick={triggerModalPhotoInput}
                  aria-label="Seleccionar foto de perfil"
                >
                  {formPhotoPreview ? (
                    <img
                      src={formPhotoPreview}
                      alt="Preview"
                      className="gu-form-photo-img"
                    />
                  ) : (
                    <div className="gu-form-photo-placeholder">
                      <i className="bi bi-camera-fill"></i>
                    </div>
                  )}
                  <div className="gu-form-photo-hover">
                    <i className="bi bi-pencil-fill"></i>
                  </div>
                </button>
                <div className="gu-form-photo-actions">
                  <button
                    type="button"
                    className="gu-form-photo-btn upload"
                    onClick={triggerModalPhotoInput}
                  >
                    <i className="bi bi-upload me-1"></i>
                    {formPhotoPreview ? "Cambiar foto" : "Agregar foto"}
                  </button>
                  {formPhotoPreview && (
                    <button
                      type="button"
                      className="gu-form-photo-btn remove"
                      onClick={removeFormPhoto}
                    >
                      <i className="bi bi-trash me-1"></i>Quitar
                    </button>
                  )}
                </div>
                <span className="gu-form-photo-hint">
                  <i className="bi bi-info-circle me-1"></i>Opcional - Max. 2MB
                </span>
              </div>

              <div className="gu-form-section">
                <h6 className="gu-form-section-title">
                  <i className="bi bi-person-badge me-2"></i>Datos Personales
                </h6>
                <div className="gu-form-grid">
                  <div className="gu-form-group">
                    <label htmlFor="gu-e-tipoDoc" className="gu-form-label">
                      Tipo Documento
                    </label>
                    <select
                      id="gu-e-tipoDoc"
                      className="gu-form-control"
                      value={formData.tipoDocumentoId}
                      onChange={(e) =>
                        updateField("tipoDocumentoId", e.target.value)
                      }
                    >
                      <option value="">-- Tipo de documento --</option>
                      <option value="1">CC - Cédula de Ciudadanía</option>
                      <option value="2">CE - Cédula de Extranjería</option>
                      <option value="3">PP - Pasaporte</option>
                      <option value="4">
                        PEP - Permiso Especial de Permanencia
                      </option>
                      <option value="5">
                        PPT - Permiso de Protección Temporal
                      </option>
                    </select>
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-e-numDoc" className="gu-form-label">
                      Numero Documento
                    </label>
                    <input
                      id="gu-e-numDoc"
                      type="text"
                      className="gu-form-control"
                      value={formData.numeroDocumento}
                      readOnly
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-e-primerNombre"
                      className="gu-form-label"
                    >
                      Primer Nombre *
                    </label>
                    <input
                      id="gu-e-primerNombre"
                      type="text"
                      className="gu-form-control"
                      value={formData.primerNombre}
                      onChange={(e) =>
                        updateField(
                          "primerNombre",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-e-segundoNombre"
                      className="gu-form-label"
                    >
                      Segundo Nombre
                    </label>
                    <input
                      id="gu-e-segundoNombre"
                      type="text"
                      className="gu-form-control"
                      value={formData.segundoNombre}
                      onChange={(e) =>
                        updateField(
                          "segundoNombre",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-e-primerApellido"
                      className="gu-form-label"
                    >
                      Primer Apellido *
                    </label>
                    <input
                      id="gu-e-primerApellido"
                      type="text"
                      className="gu-form-control"
                      value={formData.primerApellido}
                      onChange={(e) =>
                        updateField(
                          "primerApellido",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="gu-form-group">
                    <label
                      htmlFor="gu-e-segundoApellido"
                      className="gu-form-label"
                    >
                      Segundo Apellido
                    </label>
                    <input
                      id="gu-e-segundoApellido"
                      type="text"
                      className="gu-form-control"
                      value={formData.segundoApellido}
                      onChange={(e) =>
                        updateField(
                          "segundoApellido",
                          filtrarInputNombre(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-e-telefono" className="gu-form-label">
                      Telefono
                    </label>
                    <input
                      id="gu-e-telefono"
                      type="text"
                      className="gu-form-control"
                      placeholder="Ej: 3101234567"
                      value={formData.telefono}
                      onChange={(e) =>
                        updateField("telefono", filtrarInputTelefono(e.target.value))
                      }
                      maxLength={10}
                    />
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-e-correo" className="gu-form-label">
                      Correo Electronico
                    </label>
                    <input
                      id="gu-e-correo"
                      type="email"
                      className="gu-form-control"
                      value={formData.correoElectronico}
                      onChange={(e) =>
                        updateField("correoElectronico", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="gu-form-section">
                <h6 className="gu-form-section-title">
                  <i className="bi bi-shield-lock me-2"></i>Datos de Cuenta
                </h6>
                <div className="gu-form-grid">
                  <div className="gu-form-group">
                    <label htmlFor="gu-e-username" className="gu-form-label">
                      Username
                    </label>
                    <input
                      id="gu-e-username"
                      type="text"
                      className="gu-form-control"
                      value={formData.username}
                      readOnly
                    />
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-e-password" className="gu-form-label">
                      Nueva Contrasena
                    </label>
                    <input
                      id="gu-e-password"
                      type="password"
                      className="gu-form-control"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder="Dejar vacio para no cambiar"
                    />
                  </div>
                  <div className="gu-form-group">
                    <label htmlFor="gu-e-rol" className="gu-form-label">
                      Rol
                    </label>
                    <select
                      id="gu-e-rol"
                      className="gu-form-control"
                      value={formData.rolesId}
                      onChange={(e) => updateField("rolesId", e.target.value)}
                    >
                      <option value="">-- Selecciona rol --</option>
                      <option value="3">Vigilante</option>
                      <option value="2">Administrador</option>
                      <option value="1">Super Administrador</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="gu-form-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <div style={{ display: 'contents' }}>
                    <span className="spinner-border spinner-border-sm me-2"></span>{" "}
                    Guardando...
                  </div>
                ) : (
                  <div style={{ display: 'contents' }}>
                    <i className="bi bi-save me-2"></i>Guardar Cambios
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </ModalOverlay>

      {/* MODAL DETALLES */}
      {showModalDetalle && detalleUsuario && (
        <ModalOverlay
          isOpen
          onClose={() => setShowModalDetalle(false)}
          className="gu-modal-overlay"
        >
          <div className="gu-modal" style={{ maxWidth: "600px" }}>
            <div className="gu-modal-header">
              <h5>
                <i className="bi bi-person-lines-fill me-2"></i>Detalles del
                Usuario
              </h5>
              <button
                className="gu-modal-close"
                onClick={() => setShowModalDetalle(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="gu-modal-body">
              {/* Foto / Avatar circular del usuario */}
              <div className="gu-detalle-photo-section">
                <div className="gu-detalle-photo-wrap">
                  {getUserPhoto(detalleUsuario) ? (
                    <img
                      src={getUserPhoto(detalleUsuario)}
                      alt={detalleUsuario.username}
                      className="gu-detalle-photo"
                    />
                  ) : (
                    <div className="gu-detalle-avatar">
                      {obtenerIniciales(detalleUsuario)}
                    </div>
                  )}
                  <span
                    className={`gu-detalle-estado-dot ${obtenerEstadoDot(detalleUsuario)}`}
                    title={obtenerTitleDot(detalleUsuario)}
                  ></span>
                </div>
                <h5 className="gu-detalle-photo-name">
                  {obtenerNombreCompleto(detalleUsuario)}
                </h5>
                <span className="gu-detalle-photo-username">
                  @{detalleUsuario.username}
                </span>
                <span
                  className={`gu-badge ${detalleUsuario.estadoId === 1 ? "gu-badge-activo" : "gu-badge-inactivo"}`}
                  style={{ marginTop: "6px" }}
                >
                  {ESTADO_MAP[detalleUsuario.estadoId] || "N/A"}
                </span>
              </div>

              <h6
                className="gu-detalle-section"
                style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}
              >
                <i className="bi bi-shield-lock me-2"></i>Informacion de Cuenta
              </h6>
              <div className="gu-detalle-row">
                <span className="gu-detalle-label">Username</span>
                <span className="gu-detalle-value">
                  {detalleUsuario.username || "N/A"}
                </span>
              </div>
              <div className="gu-detalle-row">
                <span className="gu-detalle-label">Rol</span>
                <span className="gu-detalle-value">
                  <span className="gu-badge gu-badge-rol">
                    {ROLES_MAP[detalleUsuario.rolesId] || "N/A"}
                  </span>
                </span>
              </div>

              <h6 className="gu-detalle-section">
                <i className="bi bi-person me-2"></i>Informacion Personal
              </h6>
              <div className="gu-detalle-row">
                <span className="gu-detalle-label">Nombre Completo</span>
                <span className="gu-detalle-value">
                  {obtenerNombreCompleto(detalleUsuario)}
                </span>
              </div>
              <div className="gu-detalle-row">
                <span className="gu-detalle-label">Tipo Documento</span>
                <span className="gu-detalle-value">
                  {TIPO_DOC_MAP[detalleUsuario.tipoDocumentoId] || "N/A"}
                </span>
              </div>
              <div className="gu-detalle-row">
                <span className="gu-detalle-label">Numero Documento</span>
                <span className="gu-detalle-value">
                  {detalleUsuario.numeroDocumento || "N/A"}
                </span>
              </div>

              <h6 className="gu-detalle-section">
                <i className="bi bi-telephone me-2"></i>Informacion de Contacto
              </h6>
              <div className="gu-detalle-row">
                <span className="gu-detalle-label">Telefono</span>
                <span className="gu-detalle-value">
                  {detalleUsuario.telefono || "No registrado"}
                </span>
              </div>
              <div className="gu-detalle-row">
                <span className="gu-detalle-label">Correo Electronico</span>
                <span className="gu-detalle-value">
                  {detalleUsuario.correoElectronico || "No registrado"}
                </span>
              </div>

              <button
                className="gu-form-submit"
                style={{ marginTop: "20px" }}
                onClick={() => setShowModalDetalle(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

export default GestionUsuarios;
