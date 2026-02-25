import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Styles/residentes.css";
import logo from "../../img/logo.png";

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  obtenerResidentes,
  crearOcupante,
  actualizarOcupante,
  finalizarOcupante,
} from "../services/residentes.services.jsx";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";

/* =========================================================
   UTILIDADES
   ========================================================= */
const obtenerToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    null
  );
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
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload.username || "Usuario";
  } catch {
    return "Usuario";
  }
};

const obtenerRolDelToken = () => {
  try {
    const t = obtenerToken();
    if (!t || verificarTokenVencido(t)) return null;
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload.rolesId || null;
  } catch {
    return null;
  }
};

const mapTipoDocumento = (id) =>
  ({ 1: "CC", 2: "CE", 3: "PP", 4: "PEP", 5: "PPT" })[id] || "CC";
const mapTipoDocumentoId = (t) =>
  ({ CC: 1, CE: 2, PP: 3, PEP: 4, PPT: 5 })[t] || 1;
const mapTorre = (id) =>
  ({
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F",
    7: "G",
    8: "H",
    9: "I",
    10: "J",
  })[id] || "";
const mapTorreId = (l) =>
  ({
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    I: 9,
    J: 10,
  })[l] || 1;

const campoAmigable = (field) => {
  const map = {
    numeroDocumento: "Número de documento",
    primerNombre: "Primer nombre",
    primerApellido: "Primer apellido",
    correoElectronico: "Correo electrónico",
    telefono: "Teléfono",
    apartamentosId: "Apartamento",
    tipoOcupacion: "Tipo de ocupación",
    fechaInicio: "Fecha de inicio",
    personasACargo: "Personas a cargo",
  };
  return map[field] || field;
};

const traducirMensajeBackend = (errData) => {
  if (!errData) return "Datos inválidos o incompletos.";
  if (typeof errData === "string") {
    if (/required|cannot be null/i.test(errData))
      return "Falta información obligatoria en el formulario.";
    if (/unique|exists|ya existe/i.test(errData))
      return "Ya existe un registro con esos datos.";
    return errData;
  }
  if (typeof errData === "object") {
    if (errData.message) return traducirMensajeBackend(errData.message);
    if (errData.errors && Array.isArray(errData.errors))
      return errData.errors
        .map(
          (it) =>
            `${campoAmigable(it.field || it.param || "")}: ${it.message || it.msg || ""}`,
        )
        .join(" ");
  }
  return "Hay un problema con los datos ingresados.";
};

const getUserProfilePhoto = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Prioridad 1: foto guardada en la BD (viene en el objeto user del login)
    if (user.fotoPerfil) return user.fotoPerfil;
    // Prioridad 2: caché local de fotos
    const photosStr = localStorage.getItem("gu_user_photos");
    if (!photosStr) return null;
    const photos = JSON.parse(photosStr);
    const key = user.numeroDocumento || user.username || "";
    return photos[key] || null;
  } catch {
    return null;
  }
};

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
function Residentes() {
  const location = useLocation();
  const navegacion = useNavigate();
  const rolesId = obtenerRolDelToken();
  const nombreUsuario = obtenerUsuarioDelToken();
  const showUserManagement = rolesId === 1;
  const showAreasComunes = rolesId !== 3;

  /* ---- estado ---- */
  const [menuOpen, setMenuOpen] = useState(false);
  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apartamentos, setApartamentos] = useState([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [residenteSeleccionado, setResidenteSeleccionado] = useState(null);

  const [vistaCuadricula, setVistaCuadricula] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTorre, setFiltroTorre] = useState("todos");
  const [filtroTipoOcupacion, setFiltroTipoOcupacion] = useState("todos");
  const [ordenFecha, setOrdenFecha] = useState("recientes");
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const [modalTorres, setModalTorres] = useState(false);
  const [torreSeleccionada, setTorreSeleccionada] = useState(null);

  const [formData, setFormData] = useState({
    tipoDocumento: "CC",
    numeroDocumento: "",
    tipoOcupacion: "Propietario",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    correo: "",
    telefono: "",
    torreId: 1,
    apto: "",
    personasACargo: 0,
    tieneNinos: 0,
    tieneAdultoMayor: 0,
    tieneDiscapacidad: 0,
  });

  /* ---- token check ---- */
  useEffect(() => {
    const token = obtenerToken();
    if (!token || verificarTokenVencido(token)) {
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

  /* ---- carga inicial + auto-refresh ---- */
  useEffect(() => {
    cargarResidentes();
    cargarApartamentos();
    const intervalo = setInterval(cargarResidentes, 30000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (location.state?.abrirModal) abrirModal();
  }, [location.state]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado, filtroTorre, filtroTipoOcupacion, ordenFecha]);

  /* ---- menu title ---- */
  const getMenuTitle = () => {
    if (rolesId === 1) return "Menú Super Admin";
    if (rolesId === 2) return "Menú Admin";
    return "Menú Vigilante";
  };

  /* ---- API calls ---- */
  const cargarResidentes = async () => {
    try {
      setLoading(true);
      const token = obtenerToken();
      const res = await obtenerResidentes(token);

      if (res?.status === 401) {
        Swal.fire({
          icon: "warning",
          title: "No autorizado",
          text: "Token inválido o expirado.",
        }).then(() => {
          localStorage.removeItem("token");
          navegacion("/");
        });
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      const ocupantes = data.body || data;
      const formateados = ocupantes.map((o) => ({
        idOcupante: o.idOcupante,
        tipoDocumento: mapTipoDocumento(o.tipoDocumentoId),
        tipoDocumentoId: o.tipoDocumentoId,
        numeroDocumento: o.numeroDocumento,
        tipoOcupacion:
          o.tipoOcupacion?.charAt(0).toUpperCase() + o.tipoOcupacion?.slice(1),
        primerNombre: o.primerNombre,
        segundoNombre: o.segundoNombre || "",
        primerApellido: o.primerApellido,
        segundoApellido: o.segundoApellido || "",
        fechaInicio: o.fechaInicio ? o.fechaInicio.split("T")[0] : "",
        fechaFin: o.fechaFin ? o.fechaFin.split("T")[0] : "",
        correo: o.correoElectronico || "",
        telefono: o.telefono || "",
        personasACargo: o.personasACargo || 0,
        tieneNinos: o.tieneNinos || 0,
        tieneAdultoMayor: o.tieneAdultoMayor || 0,
        tieneDiscapacidad: o.tieneDiscapacidad || 0,
        torre: mapTorre(o.torresId),
        torresId: o.torresId,
        apartamentosId: o.apartamentosId,
        numeroApartamento: o.numeroApartamento || o.apartamentosId,
        estado: o.nombreEstado === "activa" ? "Activo" : "Finalizado",
        estadoId: o.estadoId,
        nombreEstado: o.nombreEstado,
        nombreCompleto: [
          o.primerNombre,
          o.segundoNombre,
          o.primerApellido,
          o.segundoApellido,
        ]
          .filter(Boolean)
          .join(" "),
      }));
      setResidentes(formateados);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de conexión al cargar residentes.",
        iconColor: "#0d9488",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarApartamentos = async () => {
    try {
      const token = obtenerToken();
      const res = await obtenerResidentes(token);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const ocupantes = data.body || data;
      const unicos = [];
      const ids = new Set();
      ocupantes.forEach((o) => {
        if (!ids.has(o.apartamentosId)) {
          ids.add(o.apartamentosId);
          unicos.push({
            idApartamento: o.apartamentosId,
            numeroApartamento: o.numeroApartamento || o.apartamentosId?.toString(),
            torresId: o.torresId,
          });
        }
      });
      unicos.sort((a, b) => a.idApartamento - b.idApartamento);
      setApartamentos(unicos);
    } catch {
      setApartamentos([]);
    }
  };

  const generarAptos = (torreId) => {
    const id = Number(torreId);
    if (!id || !apartamentos.length) return [];
    return apartamentos
      .filter((a) => a.torresId === id)
      .map((a) => ({ id: a.idApartamento, numero: a.numeroApartamento }));
  };

  /* ---- filtro & paginacion ---- */
  const residentesFiltrados = (() => {
    let arr = [...residentes];
    // ordenar: activos primero, luego por fecha
    arr.sort((a, b) => {
      const estadoA = a.estado === "Activo" ? -1 : 1;
      const estadoB = b.estado === "Activo" ? -1 : 1;
      if (estadoA !== estadoB) return estadoA - estadoB;
      const fechaA = new Date(a.fechaInicio || 0).getTime();
      const fechaB = new Date(b.fechaInicio || 0).getTime();
      return ordenFecha === "recientes" ? fechaB - fechaA : fechaA - fechaB;
    });
    if (filtroEstado !== "todos")
      arr = arr.filter(
        (r) =>
          r.estado === (filtroEstado === "activo" ? "Activo" : "Finalizado"),
      );
    if (filtroTorre !== "todos")
      arr = arr.filter((r) => r.torre === filtroTorre);
    if (filtroTipoOcupacion !== "todos")
      arr = arr.filter(
        (r) => r.tipoOcupacion?.toLowerCase() === filtroTipoOcupacion,
      );
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      arr = arr.filter(
        (r) =>
          r.nombreCompleto.toLowerCase().includes(q) ||
          r.numeroDocumento?.toLowerCase().includes(q) ||
          r.correo?.toLowerCase().includes(q) ||
          r.telefono?.toLowerCase().includes(q) ||
          `${r.torre}-${r.apartamentosId}`.toLowerCase().includes(q),
      );
    }
    return arr;
  })();

  const totalPaginas = Math.ceil(
    residentesFiltrados.length / elementosPorPagina,
  );
  const residentesPaginados = residentesFiltrados.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina,
  );

  // Stats
  const totalCount = residentes.length;
  const activosCount = residentes.filter((r) => r.estado === "Activo").length;
  const finalizadosCount = residentes.filter(
    (r) => r.estado === "Finalizado",
  ).length;

  /* ---- modal ---- */
  const abrirModal = () => {
    if (editIndex === null) {
      setFormData({
        tipoDocumento: "CC",
        numeroDocumento: "",
        tipoOcupacion: "Propietario",
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        fechaInicio: new Date().toISOString().split("T")[0],
        correo: "",
        telefono: "",
        torreId: 1,
        apto: "",
        personasACargo: 0,
        tieneNinos: 0,
        tieneAdultoMayor: 0,
        tieneDiscapacidad: 0,
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditIndex(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      const soloNumeros = value.replace(/[^0-9]/g, "");
      setFormData((f) => ({ ...f, [name]: soloNumeros }));
      return;
    }
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const abrirModalEditar = (r) => {
    if (!r) return;
    setFormData({
      tipoDocumento: r.tipoDocumento || "CC",
      numeroDocumento: r.numeroDocumento || "",
      tipoOcupacion: r.tipoOcupacion || "Propietario",
      primerNombre: r.primerNombre || "",
      segundoNombre: r.segundoNombre || "",
      primerApellido: r.primerApellido || "",
      segundoApellido: r.segundoApellido || "",
      fechaInicio: r.fechaInicio || new Date().toISOString().split("T")[0],
      correo: r.correo || "",
      telefono: r.telefono || "",
      torreId: r.torresId || 1,
      apto: r.apartamentosId?.toString() || "",
      personasACargo: r.personasACargo || 0,
      tieneNinos: r.tieneNinos || 0,
      tieneAdultoMayor: r.tieneAdultoMayor || 0,
      tieneDiscapacidad: r.tieneDiscapacidad || 0,
    });
    setEditIndex(r.idOcupante);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.primerNombre.trim())
      return Swal.fire("Error", "Ingrese el primer nombre", "error");
    if (!formData.primerApellido.trim())
      return Swal.fire("Error", "Ingrese el primer apellido", "error");
    if (!formData.apto)
      return Swal.fire("Error", "Seleccione un apartamento", "error");
    if (!formData.fechaInicio)
      return Swal.fire("Error", "La fecha de inicio es obligatoria", "error");
    if (editIndex === null && !formData.numeroDocumento.trim())
      return Swal.fire("Error", "Ingrese el número de documento", "error");
    if (formData.telefono && !/^[0-9]{7,15}$/.test(formData.telefono))
      return Swal.fire(
        "Error",
        "El teléfono debe contener solo números (entre 7 y 15 dígitos)",
        "error",
      );

    // Validar número de documento por tipo
    if (formData.numeroDocumento.trim()) {
      const doc = formData.numeroDocumento.trim();
      if (!/^[a-zA-Z0-9\-]+$/.test(doc))
        return Swal.fire("Error", "El número de documento solo puede contener letras, números o guiones.", "error");
      if (!/[0-9]/.test(doc))
        return Swal.fire("Error", "El número de documento no puede estar compuesto únicamente de letras.", "error");
      if (formData.tipoDocumento === "CC" && !/^\d+$/.test(doc))
        return Swal.fire("Error", "La Cédula de Ciudadanía (CC) debe contener solo dígitos.", "error");
      if (formData.tipoDocumento === "CC" && (doc.length < 5 || doc.length > 10))
        return Swal.fire("Error", "La CC debe tener entre 5 y 10 dígitos.", "error");
    }

    // Validar duplicidad de documento al crear
    if (editIndex === null && formData.numeroDocumento.trim()) {
      const doc = formData.numeroDocumento.trim().toLowerCase();
      const existente = residentes.find(
        (r) => r.numeroDocumento?.toLowerCase() === doc,
      );
      if (existente) {
        if (existente.estado === "Activo") {
          const result = await Swal.fire({
            icon: "info",
            iconColor: "#0d9488",
            title: "Residente ya existe",
            html: `<b>${existente.nombreCompleto}</b> ya se encuentra <b>activo/a</b> en Torre ${existente.torre} - Apto ${existente.apartamentosId}.<br/><br/>¿Desea editar su información en lugar de crear un nuevo registro?`,
            showCancelButton: true,
            confirmButtonText: "Sí, editar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#0d9488",
          });
          if (result.isConfirmed) {
            cerrarModal();
            abrirModalEditar(existente);
          }
          return;
        }
        // Si está finalizado, permitir continuar (se puede re-registrar)
      }
    }

    const token = obtenerToken();
    try {
      const apartamentoId = parseInt(formData.apto);
      if (isNaN(apartamentoId) || apartamentoId <= 0)
        return Swal.fire("Error", "Apartamento inválido", "error");

      const ocupanteData = {
        apartamentosId: apartamentoId,
        tipoOcupacion: formData.tipoOcupacion.toLowerCase(),
        personasACargo: parseInt(formData.personasACargo) || 0,
        fechaInicio: formData.fechaInicio,
        fechaFin: null,
        tipoDocumentoId: mapTipoDocumentoId(formData.tipoDocumento),
        primerNombre: formData.primerNombre,
        segundoNombre: formData.segundoNombre?.trim() || null,
        primerApellido: formData.primerApellido,
        segundoApellido: formData.segundoApellido?.trim() || null,
        telefono: formData.telefono || "0000000000",
        correoElectronico:
          editIndex === null
            ? formData.correo || "noemail@example.com"
            : formData.correo?.trim() || undefined,
        tieneNinos: Number(formData.tieneNinos) === 1 ? 1 : 0,
        tieneAdultoMayor: Number(formData.tieneAdultoMayor) === 1 ? 1 : 0,
        tieneDiscapacidad: Number(formData.tieneDiscapacidad) === 1 ? 1 : 0,
      };

      if (formData.numeroDocumento?.trim())
        ocupanteData.numeroDocumento = formData.numeroDocumento.trim();

      if (editIndex !== null) {
        const confirm = await Swal.fire({
          title: "¿Guardar cambios?",
          icon: "question",
          iconColor: "#0d9488",
          showCancelButton: true,
          confirmButtonText: "Guardar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#0d9488",
        });
        if (!confirm.isConfirmed) return;

        const res = await actualizarOcupante(editIndex, ocupanteData, token);
        if (res?.status === 401) {
          Swal.fire("No autorizado", "Token expirado", "warning").then(() => {
            localStorage.removeItem("token");
            navegacion("/");
          });
          return;
        }
        if (!res.ok) {
          const ct = res.headers.get("content-type") || "";
          const errData = ct.includes("json")
            ? await res.json()
            : await res.text();
          Swal.fire("Error", traducirMensajeBackend(errData), "warning");
          return;
        }
        Swal.fire({
          icon: "success",
          title: "Actualizado correctamente",
          timer: 2500,
          showConfirmButton: false,
          iconColor: "#0d9488",
        });
      } else {
        const res = await crearOcupante(ocupanteData, token);
        if (res?.status === 401) {
          Swal.fire("No autorizado", "Token expirado", "warning").then(() => {
            localStorage.removeItem("token");
            navegacion("/");
          });
          return;
        }
        const ct = res.headers.get("content-type") || "";
        const dataCreate = ct.includes("json")
          ? await res.json()
          : await res.text();
        if (!res.ok) {
          Swal.fire("Error", traducirMensajeBackend(dataCreate), "warning");
          return;
        }
        Swal.fire({
          icon: "success",
          title: "Registrado correctamente",
          timer: 2500,
          showConfirmButton: false,
          iconColor: "#0d9488",
        });
      }
      await cargarResidentes();
      cerrarModal();
    } catch {
      Swal.fire("Error", "Error de conexión. Intente de nuevo.", "error");
    }
  };

  const cerrarSesion = async (e) => {
    e?.preventDefault();
    const token = localStorage.getItem("token");
    if (token) await logoutUsuario(token);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navegacion("/");
  };

  const ejecutarFinalizar = async (r) => {
    if (!r) return;
    const result = await Swal.fire({
      title: "¿Finalizar este residente?",
      text: "Esta acción finalizará la ocupación.",
      icon: "warning",
      iconColor: "#dc2626",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      const token = obtenerToken();
      const res = await finalizarOcupante(r.idOcupante, token);
      if (res?.status === 401) {
        Swal.fire("No autorizado", "Token expirado", "warning").then(() => {
          localStorage.removeItem("token");
          navegacion("/");
        });
        return;
      }
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const errData = ct.includes("json")
          ? await res.json()
          : await res.text();
        Swal.fire("Error", traducirMensajeBackend(errData), "warning");
        return;
      }
      Swal.fire({
        icon: "success",
        title: "Finalizado correctamente",
        timer: 2500,
        showConfirmButton: false,
        iconColor: "#0d9488",
      });
      await cargarResidentes();
    } catch {
      Swal.fire("Error", "Error de conexión.", "error");
    }
  };

  /* ---- render Paginacion ---- */
  const Paginacion = () => {
    if (totalPaginas <= 1) return null;
    const paginas = [];
    const maxVis = 5;
    let ini = Math.max(1, paginaActual - Math.floor(maxVis / 2));
    let fin = Math.min(totalPaginas, ini + maxVis - 1);
    if (fin - ini < maxVis - 1) ini = Math.max(1, fin - maxVis + 1);
    for (let i = ini; i <= fin; i++) paginas.push(i);

    return (
      <div className="res-pagination">
        <button
          className="res-page-btn"
          disabled={paginaActual === 1}
          onClick={() => setPaginaActual(1)}
        >
          <i className="bi bi-chevron-double-left"></i>
        </button>
        <button
          className="res-page-btn"
          disabled={paginaActual === 1}
          onClick={() => setPaginaActual(paginaActual - 1)}
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        {paginas.map((p) => (
          <button
            key={p}
            className={`res-page-btn ${paginaActual === p ? "active" : ""}`}
            onClick={() => setPaginaActual(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="res-page-btn"
          disabled={paginaActual === totalPaginas}
          onClick={() => setPaginaActual(paginaActual + 1)}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
        <button
          className="res-page-btn"
          disabled={paginaActual === totalPaginas}
          onClick={() => setPaginaActual(totalPaginas)}
        >
          <i className="bi bi-chevron-double-right"></i>
        </button>
        <span className="res-page-info">
          {residentesFiltrados.length} residentes
        </span>
      </div>
    );
  };

  /* ===========================================================
     RENDER
     =========================================================== */
  if (loading) {
    return (
      <div className="res-dashboard">
        <div className="res-main">
          <div className="res-loading">
            <div
              className="spinner-border"
              role="status"
              style={{ color: "#14b8a6" }}
            >
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 fw-semibold" style={{ color: "#14b8a6" }}>
              Cargando residentes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="res-dashboard">
      {/* OVERLAY */}
      <div
        className={`res-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* DRAWER */}
      <aside className={`res-drawer ${menuOpen ? "open" : ""}`}>
        <div className="res-drawer-header">
          {getUserProfilePhoto() ? (
            <img
              src={getUserProfilePhoto()}
              alt="Perfil"
              className="res-drawer-photo"
            />
          ) : (
            <div className="res-drawer-avatar">
              <i className="bi bi-people-fill"></i>
            </div>
          )}
          <h4 className="res-drawer-title">{getMenuTitle()}</h4>
          <span className="res-drawer-user">{nombreUsuario}</span>
        </div>
        <div className="res-drawer-body">
          <div className="res-menu-section">
            <h6 className="res-menu-section-title">Navegación</h6>
            <Link
              className="res-menu-item"
              to={
                rolesId === 1
                  ? "/Superadmin"
                  : rolesId === 2
                    ? "/Admin"
                    : "/VigilanteDashboard"
              }
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right res-menu-arrow"></i>
            </Link>
            <Link
              className="res-menu-item active"
              to="/Residentes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-house-door"></i>
              <span>Residentes</span>
              <i className="bi bi-chevron-right res-menu-arrow"></i>
            </Link>
          </div>

          <div className="res-menu-section">
            <h6 className="res-menu-section-title">Módulos</h6>
            <Link
              className="res-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right res-menu-arrow"></i>
            </Link>
            <Link
              className="res-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right res-menu-arrow"></i>
            </Link>
            <Link
              className="res-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right res-menu-arrow"></i>
            </Link>
            {showAreasComunes && (
              <Link
                className="res-menu-item"
                to="/AreasComunes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-calendar-event"></i>
                <span>Áreas Comunes</span>
                <i className="bi bi-chevron-right res-menu-arrow"></i>
              </Link>
            )}
            {(rolesId === 1 || rolesId === 2) && (
              <Link
                className="res-menu-item"
                to="/Reportes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-graph-up-arrow"></i>
                <span>Reportes</span>
                <i className="bi bi-chevron-right res-menu-arrow"></i>
              </Link>
            )}
            {showUserManagement && (
              <>
                <Link
                  className="res-menu-item"
                  to="/GestionUsuario"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Gestión Usuarios</span>
                  <i className="bi bi-chevron-right res-menu-arrow"></i>
                </Link>
                <Link
                  className="res-menu-item"
                  to="/Auditorias"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-journal-text"></i>
                  <span>Auditorías</span>
                  <i className="bi bi-chevron-right res-menu-arrow"></i>
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="res-drawer-footer">
          <button className="res-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="res-main">
        {/* HEADER */}
        <header className="res-header">
          <button
            className="res-header-btn"
            onClick={() =>
              navegacion(
                rolesId === 1
                  ? "/Superadmin"
                  : rolesId === 2
                    ? "/Admin"
                    : "/Vigilante",
              )
            }
            title="Volver al inicio"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="res-header-center">
            <h1 className="res-header-title">Gestión de Residentes</h1>
          </div>
          <div className="res-header-actions">
            <button
              className="res-header-btn"
              onClick={() => cargarResidentes()}
              title="Recargar"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            <button
              className="res-header-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="res-content">
          {/* STATS */}
          <div className="res-stats-container">
            <div className="res-stat-box">
              <p className="res-stat-label" style={{ color: "#0d9488" }}>
                Total
              </p>
              <p className="res-stat-value" style={{ color: "#0d9488" }}>
                {totalCount}
              </p>
            </div>
            <div className="res-stat-box">
              <p className="res-stat-label" style={{ color: "#16a34a" }}>
                Activos
              </p>
              <p className="res-stat-value" style={{ color: "#16a34a" }}>
                {activosCount}
              </p>
            </div>
            <div className="res-stat-box">
              <p className="res-stat-label" style={{ color: "#dc2626" }}>
                Finalizados
              </p>
              <p className="res-stat-value" style={{ color: "#dc2626" }}>
                {finalizadosCount}
              </p>
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="res-action-bar">
            <button
              className="res-btn-registrar"
              onClick={() => {
                setEditIndex(null);
                abrirModal();
              }}
            >
              <i className="bi bi-person-plus-fill"></i> Añadir Residente
            </button>
            <div className="res-view-toggle">
              <button
                className={`res-view-btn ${!vistaCuadricula ? "active" : ""}`}
                onClick={() => setVistaCuadricula(false)}
                title="Vista tabla"
              >
                <i className="bi bi-table"></i>
              </button>
              <button
                className={`res-view-btn ${vistaCuadricula ? "active" : ""}`}
                onClick={() => setVistaCuadricula(true)}
                title="Vista cuadrícula"
              >
                <i className="bi bi-grid-3x3-gap-fill"></i>
              </button>
            </div>
            <button
              className="res-btn-torres"
              onClick={() => { setTorreSeleccionada(null); setModalTorres(true); }}
              title="Ver mapa de torres y apartamentos"
            >
              <i className="bi bi-buildings"></i> Visualizar Torres
            </button>
          </div>

          {/* TOOLBAR */}
          <div className="res-toolbar">
            <div className="res-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Buscar por nombre, documento, correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select
              className="res-filter-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="finalizado">Finalizados</option>
            </select>
            <select
              className="res-filter-select"
              value={filtroTorre}
              onChange={(e) => setFiltroTorre(e.target.value)}
            >
              <option value="todos">Todas las torres</option>
              {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((l) => (
                <option key={l} value={l}>
                  Torre {l}
                </option>
              ))}
            </select>
            <select
              className="res-filter-select"
              value={filtroTipoOcupacion}
              onChange={(e) => setFiltroTipoOcupacion(e.target.value)}
            >
              <option value="todos">Tipo de ocupación</option>
              <option value="propietario">Propietario</option>
              <option value="arrendatario">Arrendatario</option>
            </select>
            <select
              className="res-filter-select"
              value={ordenFecha}
              onChange={(e) => setOrdenFecha(e.target.value)}
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
            </select>
          </div>

          {/* CONTENIDO */}
          {residentesFiltrados.length === 0 ? (
            <div className="res-empty">
              <i className="bi bi-people d-block"></i>
              <p>No se encontraron residentes</p>
            </div>
          ) : !vistaCuadricula ? (
            <>
              <div className="res-table-wrapper">
                <table className="res-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Documento</th>
                      <th>Torre-Apto</th>
                      <th>Ocupación</th>
                      <th>F. Inicio</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residentesPaginados.map((r) => (
                      <tr key={r.idOcupante}>
                        <td
                          style={{
                            maxWidth: "180px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={r.nombreCompleto}
                        >
                          {r.nombreCompleto}
                        </td>
                        <td>
                          <small className="text-muted">
                            {r.tipoDocumento}
                          </small>{" "}
                          {r.numeroDocumento}
                        </td>
                        <td>
                          {r.torre}-{r.numeroApartamento || r.apartamentosId}
                        </td>
                        <td>
                          <span
                            className={`res-badge ${r.tipoOcupacion?.toLowerCase() === "propietario" ? "res-badge-propietario" : "res-badge-arrendatario"}`}
                          >
                            {r.tipoOcupacion}
                          </span>
                        </td>
                        <td>{r.fechaInicio || "-"}</td>
                        <td>{r.telefono || "-"}</td>
                        <td>
                          <span
                            className={`res-badge ${r.estado === "Activo" ? "res-badge-activo" : "res-badge-finalizado"}`}
                          >
                            {r.estado}
                          </span>
                        </td>
                        <td>
                          <div className="res-actions">
                            <button
                              className="res-action-btn res-btn-ver"
                              title="Ver detalles"
                              onClick={() => {
                                setResidenteSeleccionado(r);
                                setShowModalDetalles(true);
                              }}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {r.estado === "Activo" && (
                              <>
                                <button
                                  className="res-action-btn res-btn-editar"
                                  title="Editar"
                                  onClick={() => abrirModalEditar(r)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="res-action-btn res-btn-finalizar"
                                  title="Finalizar"
                                  onClick={() => ejecutarFinalizar(r)}
                                >
                                  <i className="bi bi-x-circle"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Paginacion />
            </>
          ) : (
            <>
              <div className="res-grid">
                {residentesPaginados.map((r) => (
                  <div key={r.idOcupante} className="res-card">
                    <div className="res-card-header">
                      <div>
                        <p className="res-card-name">{r.nombreCompleto}</p>
                        <p className="res-card-doc">
                          {r.tipoDocumento} {r.numeroDocumento}
                        </p>
                      </div>
                      <span
                        className={`res-badge ${r.estado === "Activo" ? "res-badge-activo" : "res-badge-finalizado"}`}
                      >
                        {r.estado}
                      </span>
                    </div>
                    <div className="res-card-body">
                      <div className="res-card-row">
                        <span className="label">Torre - Apto</span>
                        <span className="value">
                          {r.torre} - {r.numeroApartamento || r.apartamentosId}
                        </span>
                      </div>
                      <div className="res-card-row">
                        <span className="label">Ocupación</span>
                        <span className="value">{r.tipoOcupacion}</span>
                      </div>
                      <div className="res-card-row">
                        <span className="label">Fecha Inicio</span>
                        <span className="value">{r.fechaInicio || "-"}</span>
                      </div>
                      <div className="res-card-row">
                        <span className="label">Teléfono</span>
                        <span className="value">{r.telefono || "-"}</span>
                      </div>
                      <div className="res-card-row">
                        <span className="label">Personas a cargo</span>
                        <span className="value">{r.personasACargo}</span>
                      </div>
                    </div>
                    <div className="res-card-conditions">
                      <span
                        className={`res-card-condition ${r.tieneNinos === 1 ? "active" : "inactive"}`}
                      >
                        Niños
                      </span>
                      <span
                        className={`res-card-condition ${r.tieneAdultoMayor === 1 ? "active" : "inactive"}`}
                      >
                        Adulto Mayor
                      </span>
                      <span
                        className={`res-card-condition ${r.tieneDiscapacidad === 1 ? "active" : "inactive"}`}
                      >
                        Discapacidad
                      </span>
                    </div>
                    <div className="res-card-actions">
                      <button
                        className="res-action-btn res-btn-ver"
                        title="Ver detalles"
                        onClick={() => {
                          setResidenteSeleccionado(r);
                          setShowModalDetalles(true);
                        }}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {r.estado === "Activo" && (
                        <>
                          <button
                            className="res-action-btn res-btn-editar"
                            title="Editar"
                            onClick={() => abrirModalEditar(r)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="res-action-btn res-btn-finalizar"
                            title="Finalizar"
                            onClick={() => ejecutarFinalizar(r)}
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Paginacion />
            </>
          )}
        </div>
      </main>

      {/* ===== MODAL CREAR / EDITAR ===== */}
      {modalAbierto && (
        <div className="res-modal-overlay" onClick={cerrarModal}>
          <div className="res-modal" onClick={(e) => e.stopPropagation()}>
            <div className="res-modal-header">
              <h3>
                <i
                  className={`bi ${editIndex !== null ? "bi-pencil-square" : "bi-person-plus-fill"}`}
                  style={{ fontSize: "22px" }}
                ></i>
                {editIndex !== null
                  ? "Editar Residente"
                  : "Registrar Residente"}
              </h3>
              <button className="res-modal-close" onClick={cerrarModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="res-modal-body">
                {/* SECCION: Informacion de Ocupacion */}
                <p className="res-modal-section-title">
                  <i className="bi bi-house-door"></i> Información de la
                  Ocupación
                </p>
                <div className="res-form-row triple">
                  <div className="res-form-group">
                    <label>Torre *</label>
                    <select
                      name="torreId"
                      value={formData.torreId}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((f) => ({ ...f, apto: "" }));
                      }}
                      required
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          Torre {String.fromCharCode(64 + n)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="res-form-group">
                    <label>Apartamento *</label>
                    <select
                      name="apto"
                      value={formData.apto}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {generarAptos(formData.torreId).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.numero}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="res-form-group">
                    <label>Tipo Ocupación *</label>
                    <select
                      name="tipoOcupacion"
                      value={formData.tipoOcupacion}
                      onChange={handleChange}
                      required
                    >
                      <option value="Propietario">Propietario</option>
                      <option value="Arrendatario">Arrendatario</option>
                    </select>
                  </div>
                </div>
                <div className="res-form-row">
                  <div className="res-form-group">
                    <label>Fecha de Inicio *</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="res-form-group">
                    <label>¿Cuántas personas vivirán con usted?</label>
                    <input
                      type="number"
                      name="personasACargo"
                      value={formData.personasACargo}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* SECCION: Informacion Personal */}
                <p className="res-modal-section-title">
                  <i className="bi bi-person-vcard"></i> Información Personal
                </p>
                <div className="res-form-row triple">
                  <div className="res-form-group">
                    <label>Tipo Documento *</label>
                    <select
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleChange}
                      required
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="PP">PP</option>
                      <option value="PEP">PEP</option>
                      <option value="PPT">PPT</option>
                    </select>
                  </div>
                  <div
                    className="res-form-group"
                    style={{ gridColumn: "span 2" }}
                  >
                    <label>Número de Documento *</label>
                    <input
                      type="text"
                      name="numeroDocumento"
                      value={formData.numeroDocumento}
                      onChange={handleChange}
                      required={editIndex === null}
                      disabled={editIndex !== null}
                    />
                  </div>
                </div>
                <div className="res-form-row">
                  <div className="res-form-group">
                    <label>Primer Nombre *</label>
                    <input
                      type="text"
                      name="primerNombre"
                      value={formData.primerNombre}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="res-form-group">
                    <label>Segundo Nombre</label>
                    <input
                      type="text"
                      name="segundoNombre"
                      value={formData.segundoNombre}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="res-form-row">
                  <div className="res-form-group">
                    <label>Primer Apellido *</label>
                    <input
                      type="text"
                      name="primerApellido"
                      value={formData.primerApellido}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="res-form-group">
                    <label>Segundo Apellido</label>
                    <input
                      type="text"
                      name="segundoApellido"
                      value={formData.segundoApellido}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* SECCION: Contacto */}
                <p className="res-modal-section-title">
                  <i className="bi bi-telephone"></i> Contacto
                </p>
                <div className="res-form-row">
                  <div className="res-form-group">
                    <label>Correo Electrónico</label>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="res-form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                      placeholder="Ej: 3001234567"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* SECCION: Información Adicional */}
                <p className="res-modal-section-title">
                  <i className="bi bi-info-circle"></i> Información Adicional
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    marginBottom: "12px",
                    fontStyle: "italic",
                  }}
                >
                  ¿Cuenta con alguno de estos en su núcleo familiar?
                </p>
                <div className="res-form-row triple">
                  <div className="res-form-check">
                    <input
                      type="checkbox"
                      id="tieneNinos"
                      checked={Number(formData.tieneNinos) === 1}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          tieneNinos: e.target.checked ? 1 : 0,
                        }))
                      }
                    />
                    <label htmlFor="tieneNinos">Niños</label>
                  </div>
                  <div className="res-form-check">
                    <input
                      type="checkbox"
                      id="tieneAdultoMayor"
                      checked={Number(formData.tieneAdultoMayor) === 1}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          tieneAdultoMayor: e.target.checked ? 1 : 0,
                        }))
                      }
                    />
                    <label htmlFor="tieneAdultoMayor">Adulto Mayor</label>
                  </div>
                  <div className="res-form-check">
                    <input
                      type="checkbox"
                      id="tieneDiscapacidad"
                      checked={Number(formData.tieneDiscapacidad) === 1}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          tieneDiscapacidad: e.target.checked ? 1 : 0,
                        }))
                      }
                    />
                    <label htmlFor="tieneDiscapacidad">Discapacidad</label>
                  </div>
                </div>
              </div>
              <div className="res-modal-footer">
                <button
                  type="button"
                  className="res-btn-cancel"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="res-btn-submit">
                  {editIndex !== null ? "Actualizar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL TORRES ===== */}
      {modalTorres && (
        <div className="res-modal-overlay" onClick={() => setModalTorres(false)}>
          <div
            className="res-modal-box res-torres-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="res-modal-header">
              {torreSeleccionada !== null ? (
                <>
                  <button
                    className="res-torres-back"
                    onClick={() => setTorreSeleccionada(null)}
                  >
                    <i className="bi bi-arrow-left"></i> Volver
                  </button>
                  <h2 className="res-modal-title">
                    <i className="bi bi-building"></i> Torre{" "}
                    {["A","B","C","D","E","F","G","H","I","J"][torreSeleccionada - 1]}
                    {" — Apartamentos"}
                  </h2>
                </>
              ) : (
                <h2 className="res-modal-title">
                  <i className="bi bi-buildings"></i> Mapa de Torres
                </h2>
              )}
              <button
                className="res-modal-close"
                onClick={() => setModalTorres(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="res-modal-body">
              {torreSeleccionada === null ? (
                /* ---- Vista: selección de torre ---- */
                <div className="res-torres-grid">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((tid) => {
                    const letra = ["A","B","C","D","E","F","G","H","I","J"][tid - 1];
                    const resEnTorre = residentes.filter(
                      (r) => r.torresId === tid && r.estado === "Activo",
                    );
                    const aptosEnTorre = [
                      ...new Set(resEnTorre.map((r) => r.apartamentosId)),
                    ].length;
                    return (
                      <div
                        key={tid}
                        className="res-torre-card"
                        onClick={() => setTorreSeleccionada(tid)}
                        title={`Ver apartamentos Torre ${letra}`}
                      >
                        <div className="res-torre-letter">{letra}</div>
                        <p className="res-torre-info">
                          <i className="bi bi-door-open"></i>{" "}
                          {aptosEnTorre} apto{aptosEnTorre !== 1 ? "s" : ""}
                        </p>
                        <p className="res-torre-info">
                          <i className="bi bi-people"></i>{" "}
                          {resEnTorre.length} residente
                          {resEnTorre.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ---- Vista: apartamentos de la torre ---- */
                (() => {
                  const letra = ["A","B","C","D","E","F","G","H","I","J"][
                    torreSeleccionada - 1
                  ];
                  const resEnTorre = residentes.filter(
                    (r) => r.torresId === torreSeleccionada,
                  );
                  const aptosMap = {};
                  resEnTorre.forEach((r) => {
                    const key = r.apartamentosId;
                    if (!aptosMap[key])
                      aptosMap[key] = {
                        numeroApartamento:
                          r.numeroApartamento || r.apartamentosId,
                        ocupantes: [],
                      };
                    aptosMap[key].ocupantes.push(r);
                  });
                  const aptosList = Object.values(aptosMap).sort(
                    (a, b) => a.numeroApartamento - b.numeroApartamento,
                  );
                  if (aptosList.length === 0)
                    return (
                      <p className="res-torres-empty">
                        No hay residentes registrados en Torre {letra}.
                      </p>
                    );
                  return (
                    <div className="res-aptos-grid">
                      {aptosList.map((ap) => (
                        <div key={ap.numeroApartamento} className="res-apto-card">
                          <div className="res-apto-numero">
                            <i className="bi bi-door-closed"></i>{" "}
                            Apto {ap.numeroApartamento}
                          </div>
                          {ap.ocupantes.map((oc) => (
                            <div
                              key={oc.idOcupante}
                              className={`res-apto-ocupante ${
                                oc.estado === "Activo"
                                  ? "res-apto-activo"
                                  : "res-apto-finalizado"
                              }`}
                            >
                              <span className="res-apto-nombre">
                                {oc.nombreCompleto}
                              </span>
                              <span
                                className={`res-badge ${
                                  oc.tipoOcupacion?.toLowerCase() ===
                                  "propietario"
                                    ? "res-badge-propietario"
                                    : "res-badge-arrendatario"
                                }`}
                              >
                                {oc.tipoOcupacion}
                              </span>
                              <div className="res-apto-tags">
                                {Number(oc.tieneNinos) === 1 && (
                                  <span className="res-apto-tag" title="Tiene niños">
                                    <i className="bi bi-emoji-smile"></i>
                                  </span>
                                )}
                                {Number(oc.tieneAdultoMayor) === 1 && (
                                  <span
                                    className="res-apto-tag"
                                    title="Adulto mayor"
                                  >
                                    <i className="bi bi-person-cane"></i>
                                  </span>
                                )}
                                {Number(oc.tieneDiscapacidad) === 1 && (
                                  <span
                                    className="res-apto-tag"
                                    title="Discapacidad"
                                  >
                                    <i className="bi bi-universal-access"></i>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DETALLES ===== */}
      {showModalDetalles && residenteSeleccionado && (
        <div
          className="res-modal-overlay"
          onClick={() => setShowModalDetalles(false)}
        >
          <div
            className="res-modal"
            style={{ maxWidth: 800 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="res-modal-header">
              <h3>
                <i
                  className="bi bi-person-badge"
                  style={{ fontSize: "22px" }}
                ></i>
                Detalles del Residente
              </h3>
              <button
                className="res-modal-close"
                onClick={() => setShowModalDetalles(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="res-modal-body">
              {/* Seccion Personal */}
              <div className="res-detail-section">
                <p className="res-detail-section-title">
                  <i className="bi bi-person"></i> Información Personal
                </p>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-person-fill"></i> Nombre Completo
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.nombreCompleto}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-card-text"></i> Documento
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.tipoDocumento}{" "}
                    {residenteSeleccionado.numeroDocumento}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-telephone"></i> Teléfono
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.telefono || "No registrado"}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-envelope"></i> Correo
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.correo || "No registrado"}
                  </span>
                </div>
              </div>

              {/* Seccion Residencia */}
              <div className="res-detail-section">
                <p className="res-detail-section-title">
                  <i className="bi bi-house-door"></i> Información de Residencia
                </p>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-building"></i> Torre - Apartamento
                  </span>
                  <span className="res-detail-value">
                    Torre {residenteSeleccionado.torre} - Apto{" "}
                    {residenteSeleccionado.numeroApartamento || residenteSeleccionado.apartamentosId}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-key"></i> Tipo de Ocupación
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.tipoOcupacion}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-flag"></i> Estado
                  </span>
                  <span className="res-detail-value">
                    <span
                      className={`res-badge ${residenteSeleccionado.estado === "Activo" ? "res-badge-activo" : "res-badge-finalizado"}`}
                    >
                      {residenteSeleccionado.estado}
                    </span>
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-calendar-check"></i> Fecha de Inicio
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.fechaInicio || "N/A"}
                  </span>
                </div>
                {residenteSeleccionado.fechaFin && (
                  <div className="res-detail-row">
                    <span className="res-detail-label">
                      <i className="bi bi-calendar-x"></i> Fecha de Fin
                    </span>
                    <span className="res-detail-value">
                      {residenteSeleccionado.fechaFin}
                    </span>
                  </div>
                )}
              </div>

              {/* Seccion Familiar */}
              <div className="res-detail-section">
                <p className="res-detail-section-title">
                  <i className="bi bi-people"></i> Información Familiar
                </p>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-people-fill"></i> Personas a Cargo
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.personasACargo || 0}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-emoji-smile"></i> Niños
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.tieneNinos === 1 ? "Sí" : "No"}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-heart-pulse"></i> Adulto Mayor
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.tieneAdultoMayor === 1 ? "Sí" : "No"}
                  </span>
                </div>
                <div className="res-detail-row">
                  <span className="res-detail-label">
                    <i className="bi bi-person-wheelchair"></i> Discapacidad
                  </span>
                  <span className="res-detail-value">
                    {residenteSeleccionado.tieneDiscapacidad === 1
                      ? "Sí"
                      : "No"}
                  </span>
                </div>
              </div>
            </div>
            <div className="res-modal-footer">
              <button
                className="res-btn-submit"
                onClick={() => setShowModalDetalles(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Residentes;
