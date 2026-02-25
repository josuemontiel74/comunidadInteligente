import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Styles/estiloAreasComunes.css";
import {
  validarNombreCompleto,
  validarTelefono,
  validarEmail,
  validarDocumento,
} from "../utils/validaciones.js";
import {
  obtenerReservasAreas,
  obtenerApartamentos,
  obtenerAreas,
  crearReserva,
  actualizarReserva,
  eliminarReserva as eliminarReservaService,
  obtenerCalendarioReservas,
  actualizarAreaComun,
} from "../services/areasComunes.services.jsx";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

/** Genera el HTML de ticket térmico para impresión de recibo de reserva */
function buildTicketHtml({
  id,
  nombre,
  doc,
  tel,
  area,
  apto,
  torre,
  fecha,
  hi,
  hf,
  asistentes,
  motivo,
  estado,
  fechaImpresion,
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Recibo Reserva #${id}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    width: 80mm;
    padding: 4mm;
    background: #fff;
    color: #000;
    font-size: 12px;
    line-height: 1.4;
  }
  .ticket-center { text-align: center; }
  .ticket-title { font-size: 16px; font-weight: bold; margin: 4px 0 2px; }
  .ticket-subtitle { font-size: 10px; color: #555; margin-bottom: 6px; }
  .ticket-divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .ticket-section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; background: #f0f0f0; padding: 2px 4px; margin: 4px 0; }
  .ticket-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
  .ticket-row .label { font-weight: bold; flex-shrink: 0; }
  .ticket-row .value { text-align: right; word-break: break-word; max-width: 55%; }
  .ticket-id { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
  .ticket-footer { text-align: center; font-size: 9px; color: #777; margin-top: 8px; padding-top: 4px; }
  .ticket-barcode { text-align: center; font-size: 24px; letter-spacing: 4px; font-family: 'Libre Barcode 39', cursive, monospace; margin: 6px 0; }
  @media print { body { width: 80mm; } }
</style></head>
<body>
  <div class="ticket-center">
    <div class="ticket-title">AZAHAR</div>
    <div class="ticket-subtitle">Conjunto Residencial</div>
    <div class="ticket-subtitle">NIT: 900.XXX.XXX-X</div>
  </div>
  <hr class="ticket-divider">
  <div class="ticket-center">
    <div style="font-size:11px;font-weight:bold;">COMPROBANTE DE RESERVA</div>
    <div class="ticket-id">#${id}</div>
  </div>
  <hr class="ticket-divider">
  <div class="ticket-section-title">SOLICITANTE</div>
  <div class="ticket-row"><span class="label">Nombre:</span><span class="value">${nombre}</span></div>
  <div class="ticket-row"><span class="label">Doc:</span><span class="value">${doc}</span></div>
  <div class="ticket-row"><span class="label">Tel:</span><span class="value">${tel}</span></div>
  <hr class="ticket-divider">
  <div class="ticket-section-title">RESERVA</div>
  <div class="ticket-row"><span class="label">Área:</span><span class="value">${area}</span></div>
  <div class="ticket-row"><span class="label">Apto:</span><span class="value">${apto}${torre ? " - " + torre : ""}</span></div>
  <div class="ticket-row"><span class="label">Fecha:</span><span class="value">${fecha}</span></div>
  <div class="ticket-row"><span class="label">Hora:</span><span class="value">${hi} - ${hf}</span></div>
  <div class="ticket-row"><span class="label">Asist.:</span><span class="value">${asistentes}</span></div>
  <div class="ticket-row"><span class="label">Motivo:</span><span class="value">${motivo}</span></div>
  <div class="ticket-row"><span class="label">Estado:</span><span class="value">${estado}</span></div>
  <hr class="ticket-divider">
  <div class="ticket-center ticket-barcode">*${String(id).padStart(6, "0")}*</div>
  <hr class="ticket-divider">
  <div class="ticket-footer">
    Impreso: ${fechaImpresion}<br>
    Este documento es un comprobante de su reserva.<br>
    Conserve este recibo para cualquier reclamo.<br>
    ¡Gracias por usar nuestros servicios!
  </div>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════
   ÁREAS COMUNES — Gestión de Reservas
   Tema naranja · Layout responsivo (tabla desktop / cards móvil)
   ═══════════════════════════════════════════════════════════ */

function AreasComunes() {
  const navegacion = useNavigate();
  const location = useLocation();

  // ─── Sesión ───
  useEffect(() => {
    const tk = localStorage.getItem("token");
    if (!tk) {
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

  const cerrarSesion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) await logoutUsuario(token);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navegacion("/");
  };

  // ─── Token helpers ───
  const obtenerToken = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken");
    if (!token) {
      return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Impvc3VlMjAyMyIsInJvbGVzSWQiOjEsImlhdCI6MTc1OTUxNTQwMCwiZXhwIjoxNzU5NTE5MDAwfQ.wKzrnUttdHRGkHnnZL1LR1amxt2ZQ4PZR85khZauShQ";
    }
    return token;
  };
  const token = obtenerToken();

  const verificarTokenVencido = (tk) => {
    try {
      const payload = JSON.parse(atob(tk.split(".")[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };

  const obtenerUsuarioDelToken = () => {
    try {
      if (verificarTokenVencido(token)) return "josue2023";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || "Usuario";
    } catch {
      return "Usuario";
    }
  };

  const obtenerRolDelToken = () => {
    try {
      if (verificarTokenVencido(token)) return 1;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.rolesId || 1;
    } catch {
      return 1;
    }
  };

  const rolesId = obtenerRolDelToken();
  const nombreUsuario = obtenerUsuarioDelToken();
  const rolUsuario =
    rolesId === 1 ? "SuperAdmin" : rolesId === 2 ? "Admin" : "Vigilante";
  const dashboardPath =
    rolesId === 1 ? "/Superadmin" : rolesId === 2 ? "/Admin" : "/Vigilante";

  // ─── Estado UI ───
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [showCalendario, setShowCalendario] = useState(false);
  const [showModalAreas, setShowModalAreas] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── Datos ───
  const [reservas, setReservas] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [areasComunes, setAreasComunes] = useState([]);
  const [tiposDocumento] = useState([
    { tipoDocumentoId: 1, nombre: "CC" },
    { tipoDocumentoId: 2, nombre: "CE" },
    { tipoDocumentoId: 3, nombre: "PA" },
    { tipoDocumentoId: 4, nombre: "PP" },
    { tipoDocumentoId: 5, nombre: "PPT" },
  ]);

  // ─── Formulario ───
  const reservaVacia = {
    torre: "",
    apartamentoId: "",
    areaComunId: "",
    fechaReserva: "",
    horaInicio: "",
    horaFin: "",
    motivoReserva: "",
    cantidadAsistentes: "",
    invitadosExternos: false,
    aceptaReglamento: false,
    documentoSolicitante: "",
    tipoDocumentoId: "",
    nombreSolicitante: "",
    telefonoSolicitante: "",
    correoSolicitante: "",
  };
  const [reserva, setReserva] = useState({ ...reservaVacia });

  // ─── Filtros + Paginación ───
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas"); // todas | activas | finalizadas
  const [paginaActual, setPaginaActual] = useState(1);
  const reservasPorPagina = 5;

  // ─── Calendario ───
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarData, setCalendarData] = useState([]);

  // ─── Responsive (manejado por CSS media queries) ───

  // ════════════════════════════════════════════════════════
  // DATA FETCHING
  // ════════════════════════════════════════════════════════

  const obtenerReservas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerReservasAreas(token);
      if (response.ok) {
        const data = await response.json();
        const raw = data.mostrarAreasComunes || data.body || [];
        const planas = raw.map((r) => ({
          idReservas: r.idReservas,
          apartamentoId: r.apartamentoId,
          fechaReserva: r.fechaReserva,
          horaInicio: r.horaInicio,
          horaFin: r.horaFin,
          motivoReserva: r.motivoReserva,
          cantidadAsistentes: r.cantidadAsistentes,
          invitadosExternos: r.invitadosExternos,
          areaComunId: r.areaComun?.areaComunId ?? r.areaComunId,
          nombreArea: r.areaComun?.nombreArea ?? r.nombreArea,
          nombreEstado: r.estado?.nombreEstado ?? r.nombreEstado,
          numeroApartamento:
            r.apartamento?.numeroApartamento ?? r.numeroApartamento,
          nombreTorre: r.apartamento?.torre?.nombreTorre ?? r.nombreTorre,
          documentoSolicitante:
            r.Solicitante?.documentoSolicitante ?? r.documentoSolicitante,
          nombreSolicitante:
            r.Solicitante?.nombreSolicitante ?? r.nombreSolicitante,
          correoSolicitante:
            r.Solicitante?.correoSolicitante ?? r.correoSolicitante,
          telefonoSolicitante:
            r.Solicitante?.telefonoSolicitante ?? r.telefonoSolicitante,
          tipoDocumentoId: r.Solicitante?.tipoDocumentoId ?? r.tipoDocumentoId,
        }));
        setReservas(planas);
      } else {
        Swal.fire("Error", "Error al obtener reservas.", "error");
      }
    } catch {
      Swal.fire("Error", "Error de conexión con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const obtenerDatosIniciales = useCallback(async () => {
    // Apartamentos
    try {
      const resp = await obtenerApartamentos(token);
      if (resp.ok) {
        const d = await resp.json();
        const lista = (d.body || []).map((a) => ({
          ...a,
          idApartamento: a.IdApartamento || a.idApartamento,
        }));
        setApartamentos(lista);
      } else throw new Error();
    } catch {
      setApartamentos([]);
    }

    // Áreas comunes (desde API)
    try {
      const resp = await obtenerAreas(token);
      if (resp.ok) {
        const d = await resp.json();
        const areas = d.body || d.mostrarAreasComunes || [];
        if (areas.length > 0) {
          setAreasComunes(
            areas.map((a) => ({
              idAreaComun: a.areaComunId || a.idAreaComun,
              nombreArea: a.nombreArea,
              estadoId: a.estadoId,
              nombreEstado: a.estado?.nombreEstado || a.nombreEstado || "",
              descripcion: a.descripcion || "",
              capacidad: a.capacidad || 0,
            })),
          );
          return;
        }
      }
    } catch {
      /* fallback */
    }
    // Fallback
    setAreasComunes([
      {
        idAreaComun: 1,
        nombreArea: "Salón Comunal 1",
        estadoId: 4,
        nombreEstado: "disponible",
        capacidad: 50,
      },
      {
        idAreaComun: 2,
        nombreArea: "Salón Comunal 2",
        estadoId: 4,
        nombreEstado: "disponible",
        capacidad: 40,
      },
      {
        idAreaComun: 3,
        nombreArea: "Zona BBQ",
        estadoId: 4,
        nombreEstado: "disponible",
        capacidad: 25,
      },
    ]);
  }, [token]);

  const cargarCalendario = useCallback(async () => {
    try {
      const resp = await obtenerCalendarioReservas(token);
      if (resp.ok) {
        const d = await resp.json();
        setCalendarData(d.body || d.mostrarCalendario || d.reservas || []);
      }
    } catch {
      /* fallback calendario */
    }
  }, [token]);

  useEffect(() => {
    obtenerReservas();
    obtenerDatosIniciales();
    const intervalo = setInterval(obtenerReservas, 30000);
    return () => clearInterval(intervalo);
  }, [obtenerReservas, obtenerDatosIniciales]);

  useEffect(() => {
    if (location.state?.abrirModal) abrirModal(location.state?.prefill || null);
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ════════════════════════════════════════════════════════
  // FILTRADO POR TORRE
  // ════════════════════════════════════════════════════════

  // Extraer torres únicas de los apartamentos cargados
  const torresDisponibles = React.useMemo(() => {
    const mapa = new Map();
    apartamentos.forEach((apt) => {
      const id = apt.torresId;
      if (id && !mapa.has(id)) {
        mapa.set(
          id,
          apt.torres?.nombreTorre || apt.torre?.nombreTorre || `Torre ${id}`,
        );
      }
    });
    return Array.from(mapa.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.id - b.id);
  }, [apartamentos]);

  const apartamentosFiltrados = apartamentos.filter((apt) => {
    if (!reserva.torre) return false;
    return String(apt.torresId) === String(reserva.torre);
  });

  const handleTorreChange = (e) => {
    setReserva((prev) => ({
      ...prev,
      torre: e.target.value,
      apartamentoId: "",
    }));
  };

  // ════════════════════════════════════════════════════════
  // MODAL HANDLERS
  // ════════════════════════════════════════════════════════

  const abrirModal = (prefill = null) => {
    setReserva({
      ...reservaVacia,
      areaComunId: prefill?.areaComunId || "",
      fechaReserva: prefill?.fechaReserva || "",
      horaInicio: prefill?.horaInicio || "",
      horaFin: prefill?.horaFin || "",
    });
    setEditIndex(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditIndex(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReserva((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ════════════════════════════════════════════════════════

  const validarFechasReserva = (r) => {
    const hoy = new Date();
    const fechaRes = new Date(r.fechaReserva);
    const hoyLimpio = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
    );
    const fechaLimpia = new Date(
      fechaRes.getFullYear(),
      fechaRes.getMonth(),
      fechaRes.getDate(),
    );
    if (fechaLimpia < hoyLimpio) return "No puedes reservar en fechas pasadas";
    const dosMeses = new Date();
    dosMeses.setMonth(dosMeses.getMonth() + 2);
    if (fechaRes > dosMeses)
      return "No puedes reservar con más de 2 meses de anticipación";
    if (r.horaInicio >= r.horaFin)
      return "La hora de inicio debe ser menor que la hora de fin";
    return null;
  };

  const validarSolicitanteReserva = (r) => {
    const tipoDocObj = tiposDocumento.find(
      (t) => String(t.tipoDocumentoId) === String(r.tipoDocumentoId),
    );
    const tipoDocNombre = tipoDocObj ? tipoDocObj.nombre : "";
    const errDoc = validarDocumento(
      r.documentoSolicitante,
      r.tipoDocumentoId,
      tipoDocNombre,
    );
    if (errDoc) return { titulo: "Documento inválido", msg: errDoc };
    const errNom = validarNombreCompleto(r.nombreSolicitante);
    if (errNom) return { titulo: "Nombre inválido", msg: errNom };
    const errTel = validarTelefono(r.telefonoSolicitante);
    if (errTel) return { titulo: "Teléfono inválido", msg: errTel };
    const errEmail = validarEmail(r.correoSolicitante);
    if (errEmail) return { titulo: "Correo inválido", msg: errEmail };
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reserva.aceptaReglamento) {
      Swal.fire("Error", "Debe aceptar el reglamento para continuar", "error");
      return;
    }
    const errFechas = validarFechasReserva(reserva);
    if (errFechas) {
      Swal.fire("Error", errFechas, "error");
      return;
    }
    const errSolicitante = validarSolicitanteReserva(reserva);
    if (errSolicitante) {
      Swal.fire(errSolicitante.titulo, errSolicitante.msg, "error");
      return;
    }

    try {
      setLoading(true);
      const reservaData = {
        apartamentoId: parseInt(reserva.apartamentoId),
        areaComunId: parseInt(reserva.areaComunId),
        fechaReserva: reserva.fechaReserva,
        horaInicio: reserva.horaInicio + ":00",
        horaFin: reserva.horaFin + ":00",
        motivoReserva: reserva.motivoReserva,
        cantidadAsistentes: reserva.cantidadAsistentes,
        invitadosExternos: !!reserva.invitadosExternos,
        aceptaReglamento: !!reserva.aceptaReglamento,
        documentoSolicitante: reserva.documentoSolicitante,
        tipoDocumentoId: parseInt(reserva.tipoDocumentoId),
        nombreSolicitante: reserva.nombreSolicitante,
        telefonoSolicitante: reserva.telefonoSolicitante,
        correoSolicitante: reserva.correoSolicitante,
      };

      const isEditing = editIndex !== null;
      const response = isEditing
        ? await actualizarReserva(editIndex, reservaData, token)
        : await crearReserva(reservaData, token);

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: isEditing
            ? "Actualizado correctamente"
            : "Registrado correctamente",
          timer: 3500,
          showConfirmButton: false,
        });
        cerrarModal();
        await obtenerReservas();
      } else if (response.status === 409) {
        let msg = "El área ya está reservada en la fecha y horario indicados.";
        try {
          const errData = await response.json();
          msg = errData?.message || errData?.mensaje || errData?.error || msg;
        } catch {
          /* usar default */
        }
        Swal.fire({ icon: "error", title: "Conflicto", text: msg });
      } else {
        let msg = `Error ${response.status}`;
        try {
          const errData = await response.json();
          msg = errData?.message || errData?.mensaje || errData?.error || msg;
        } catch {
          /* usar default */
        }
        Swal.fire({ icon: "error", title: "Error", text: msg });
      }
    } catch {
      Swal.fire("Error", "Error de conexión con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  const finalizarRegistro = async (idReserva) => {
    const result = await Swal.fire({
      title: "¿Deseas finalizar esta reserva?",
      text: "No podrás revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e65100",
      cancelButtonColor: "#757575",
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await eliminarReservaService(idReserva, token);
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Finalizado correctamente",
          timer: 3500,
          showConfirmButton: false,
        });
        await obtenerReservas();
      } else {
        Swal.fire("Error", "No se pudo finalizar la reserva.", "error");
      }
    } catch {
      Swal.fire("Error", "Error de conexión con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  const editarReserva = (r) => {
    setReserva({
      torre: r.nombreTorre
        ? r.nombreTorre.charAt(r.nombreTorre.length - 1)
        : "",
      apartamentoId: r.apartamentoId,
      areaComunId: r.areaComunId,
      fechaReserva: r.fechaReserva,
      horaInicio: r.horaInicio?.substring(0, 5) || "",
      horaFin: r.horaFin?.substring(0, 5) || "",
      motivoReserva: r.motivoReserva,
      cantidadAsistentes: r.cantidadAsistentes,
      invitadosExternos:
        r.invitadosExternos === 1 || r.invitadosExternos === true,
      aceptaReglamento: true,
      documentoSolicitante: r.documentoSolicitante,
      tipoDocumentoId: r.tipoDocumentoId || "",
      nombreSolicitante: r.nombreSolicitante,
      telefonoSolicitante: r.telefonoSolicitante,
      correoSolicitante: r.correoSolicitante,
    });
    setEditIndex(r.idReservas);
    setModalAbierto(true);
  };

  const verDetalles = (registro) => {
    setRegistroSeleccionado(registro);
    setShowModalDetalles(true);
  };

  // ════════════════════════════════════════════════════════
  // GESTIÓN DE ÁREAS COMUNES (SuperAdmin)
  // ════════════════════════════════════════════════════════

  const toggleEstadoArea = async (area) => {
    const estaDisponible = area.estadoId === 4;
    const nuevoEstado = estaDisponible ? 18 : 4; // 4=disponible, 18=No disponible
    const accion = estaDisponible ? "inhabilitar" : "habilitar";

    const result = await Swal.fire({
      title: `¿${estaDisponible ? "Inhabilitar" : "Habilitar"} ${area.nombreArea}?`,
      text: estaDisponible
        ? "El área no estará disponible para nuevas reservas."
        : "El área volverá a estar disponible para reservas.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: estaDisponible ? "#d32f2f" : "#2e7d32",
      cancelButtonColor: "#757575",
      confirmButtonText: estaDisponible ? "Sí, inhabilitar" : "Sí, habilitar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const resp = await actualizarAreaComun(
        area.idAreaComun,
        { estadoId: nuevoEstado },
        token,
      );
      if (resp.ok) {
        Swal.fire({
          icon: "success",
          title: `Área ${accion === "inhabilitar" ? "inhabilitada" : "habilitada"}`,
          timer: 2500,
          showConfirmButton: false,
        });
        // Actualizar estado local
        setAreasComunes((prev) =>
          prev.map((a) =>
            a.idAreaComun === area.idAreaComun
              ? {
                  ...a,
                  estadoId: nuevoEstado,
                  nombreEstado:
                    nuevoEstado === 4 ? "disponible" : "No disponible",
                }
              : a,
          ),
        );
      } else {
        const errData = await resp.json().catch(() => ({}));
        Swal.fire(
          "Error",
          errData?.message || `No se pudo ${accion} el área.`,
          "error",
        );
      }
    } catch {
      Swal.fire("Error", "Error de conexión con el servidor.", "error");
    }
  };

  // ════════════════════════════════════════════════════════
  // CALENDARIO
  // ════════════════════════════════════════════════════════

  const abrirCalendario = () => {
    const ahora = new Date();
    setCalMonth(ahora.getMonth());
    setCalYear(ahora.getFullYear());
    setSelectedDay(null);
    cargarCalendario();
    setShowCalendario(true);
  };

  const mesAnterior = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
    setSelectedDay(null);
  };

  const mesSiguiente = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
    setSelectedDay(null);
  };

  const MESES = [
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
  const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

  const buildCalendarGrid = () => {
    const primerDia = new Date(calYear, calMonth, 1);
    const diasEnMes = new Date(calYear, calMonth + 1, 0).getDate();
    // getDay: 0=domingo, queremos lunes=0
    let startDay = primerDia.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const cells = [];
    // Celdas vacías antes del día 1
    for (let i = 0; i < startDay; i++) cells.push({ day: null });
    // Días del mes
    for (let d = 1; d <= diasEnMes; d++) cells.push({ day: d });
    return cells;
  };

  /** Reservas del calendario que caen en un día concreto del mes actual
   *  Usa las reservas ya cargadas (no solo las del mes actual del backend) */
  const reservasDelDia = (day) => {
    if (!day) return [];
    const fechaStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Combinar datos del backend calendario + reservas locales
    const fromLocal = reservas.filter((r) => r.fechaReserva === fechaStr);
    const fromCal = calendarData.filter(
      (r) => (r.fechaReserva || "") === fechaStr,
    );
    // Si hay reservas locales, usarlas (tienen más datos). Si no, usar las del endpoint.
    return fromLocal.length > 0 ? fromLocal : fromCal;
  };

  /** ¿Es hoy? */
  const esHoy = (day) => {
    const hoy = new Date();
    return (
      day === hoy.getDate() &&
      calMonth === hoy.getMonth() &&
      calYear === hoy.getFullYear()
    );
  };

  /** ¿Es pasado? */
  const esPasado = (day) => {
    if (!day) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(calYear, calMonth, day);
    return fecha < hoy;
  };

  // ════════════════════════════════════════════════════════
  // FILTROS + PAGINACIÓN
  // ════════════════════════════════════════════════════════

  const reservasFiltradas = reservas
    .filter((r) => {
      const texto = busqueda.toLowerCase();
      const cumpleBusqueda =
        !texto ||
        r.nombreArea?.toLowerCase().includes(texto) ||
        r.nombreSolicitante?.toLowerCase().includes(texto) ||
        r.documentoSolicitante?.includes(busqueda);

      const estado = r.nombreEstado?.toLowerCase() || "";
      const cumpleEstado =
        filtroEstado === "todas" ||
        (filtroEstado === "activas" && estado !== "finalizada") ||
        (filtroEstado === "finalizadas" && estado === "finalizada");

      return cumpleBusqueda && cumpleEstado;
    })
    .sort((a, b) => {
      const aFin = a.nombreEstado?.toLowerCase() === "finalizada";
      const bFin = b.nombreEstado?.toLowerCase() === "finalizada";
      if (aFin && !bFin) return 1;
      if (!aFin && bFin) return -1;
      return b.idReservas - a.idReservas;
    });

  const totalPaginas = Math.ceil(reservasFiltradas.length / reservasPorPagina);
  const indicePrimero = (paginaActual - 1) * reservasPorPagina;
  const reservasPaginadas = reservasFiltradas.slice(
    indicePrimero,
    indicePrimero + reservasPorPagina,
  );

  // Estadísticas
  const totalReservas = reservas.length;
  const totalActivas = reservas.filter(
    (r) => r.nombreEstado?.toLowerCase() !== "finalizada",
  ).length;
  const totalFinalizadas = reservas.filter(
    (r) => r.nombreEstado?.toLowerCase() === "finalizada",
  ).length;

  // ════════════════════════════════════════════════════════
  // GENERAR TICKET PDF
  // ════════════════════════════════════════════════════════

  const normalizeTime = (t) => {
    if (!t) return "";
    const parts = t.split(":");
    const hh = parseInt(parts[0], 10);
    const mm = parts[1] || "00";
    if (isNaN(hh)) return t;
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
  };

  /** Abre una ventana con formato de ticket térmico (80mm) y lanza impresión */
  const imprimirRecibo = (res) => {
    if (!res) return;
    const hi = normalizeTime((res.horaInicio || "").replace(/:00$/, ""));
    const hf = normalizeTime((res.horaFin || "").replace(/:00$/, ""));
    const ahora = new Date();
    const fechaImpresion =
      [
        String(ahora.getDate()).padStart(2, "0"),
        String(ahora.getMonth() + 1).padStart(2, "0"),
        ahora.getFullYear(),
      ].join("/") +
      " " +
      [
        String(ahora.getHours()).padStart(2, "0"),
        String(ahora.getMinutes()).padStart(2, "0"),
      ].join(":");

    const html = buildTicketHtml({
      id: res.idReservas || "",
      nombre: res.nombreSolicitante || "",
      doc: res.documentoSolicitante || "",
      tel: res.telefonoSolicitante || "",
      area: res.nombreArea || "",
      apto: res.numeroApartamento || "",
      torre: res.nombreTorre || "",
      fecha: res.fechaReserva || "",
      hi,
      hf,
      asistentes: res.cantidadAsistentes || "",
      motivo: res.motivoReserva || "",
      estado: res.nombreEstado || "Activa",
      fechaImpresion,
    });

    const ventana = window.open("", "_blank", "width=320,height=600");
    if (!ventana) {
      Swal.fire(
        "Error",
        "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.",
        "warning",
      );
      return;
    }
    ventana.document.write(html);
    ventana.document.close();
    ventana.onload = () => {
      setTimeout(() => {
        ventana.print();
      }, 300);
    };
  };

  // ════════════════════════════════════════════════════════
  // HELPERS DE RENDER
  // ════════════════════════════════════════════════════════

  const badgeEstado = (estado) => {
    const e = (estado || "").toLowerCase();
    if (e === "finalizada")
      return <span className="ac-badge ac-badge-finalizada">Finalizada</span>;
    return <span className="ac-badge ac-badge-activa">Activa</span>;
  };

  const formatHora = (h) => {
    if (!h) return "";
    return h.substring(0, 5);
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  if (loading && reservas.length === 0) {
    return (
      <div className="ac-loading-screen">
        <div className="spinner-border text-warning" role="status" />
        <p className="mt-3 text-muted">Cargando reservas...</p>
      </div>
    );
  }

  return (
    <div className="ac-dashboard">
      {/* ── Overlay ── */}
      <div
        className={`ac-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMenuOpen(false);
        }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar menú"
      />

      {/* ══════════ DRAWER ══════════ */}
      <aside className={`ac-drawer ${menuOpen ? "open" : ""}`}>
        <div className="ac-drawer-header">
          <div className="ac-drawer-avatar">
            <i className="bi bi-calendar2-event" />
          </div>
          <h4 className="ac-drawer-title">{nombreUsuario}</h4>
          <span className="ac-drawer-user">{rolUsuario}</span>
        </div>

        <div className="ac-drawer-body">
          {/* Navegación */}
          <div className="ac-menu-section">
            <h6 className="ac-menu-section-title">Navegación</h6>
            <Link
              className="ac-menu-item"
              to={dashboardPath}
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2" />
              <span>Dashboard</span>
              <i className="bi bi-chevron-right ac-menu-arrow" />
            </Link>
            <Link
              className="ac-menu-item active"
              to="/AreasComunes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-calendar2-event" />
              <span>Áreas Comunes</span>
              <i className="bi bi-chevron-right ac-menu-arrow" />
            </Link>
          </div>

          {/* Módulos */}
          <div className="ac-menu-section">
            <h6 className="ac-menu-section-title">Módulos</h6>
            <Link
              className="ac-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam" />
              <span>Paquetería</span>
              <i className="bi bi-chevron-right ac-menu-arrow" />
            </Link>
            <Link
              className="ac-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-person-badge" />
              <span>Visitas</span>
              <i className="bi bi-chevron-right ac-menu-arrow" />
            </Link>
            <Link
              className="ac-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-car-front" />
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right ac-menu-arrow" />
            </Link>
            {(rolesId === 1 || rolesId === 2) && (
              <>
                <Link
                  className="ac-menu-item"
                  to="/Residentes"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-people" />
                  <span>Residentes</span>
                  <i className="bi bi-chevron-right ac-menu-arrow" />
                </Link>
                <Link
                  className="ac-menu-item"
                  to="/Reportes"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-graph-up-arrow" />
                  <span>Reportes</span>
                  <i className="bi bi-chevron-right ac-menu-arrow" />
                </Link>
              </>
            )}
            {rolesId === 1 && (
              <>
                <Link
                  className="ac-menu-item"
                  to="/GestionUsuario"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-person-gear" />
                  <span>Gestión Usuarios</span>
                  <i className="bi bi-chevron-right ac-menu-arrow" />
                </Link>
                <Link
                  className="ac-menu-item"
                  to="/Auditorias"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-shield-check" />
                  <span>Auditorías</span>
                  <i className="bi bi-chevron-right ac-menu-arrow" />
                </Link>
                <Link
                  className="ac-menu-item"
                  to="/LogErrores"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-bug" />
                  <span>Log de Errores</span>
                  <i className="bi bi-chevron-right ac-menu-arrow" />
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="ac-drawer-footer">
          <button className="ac-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div className="ac-main">
        {/* ── Header ── */}
        <header className="ac-header">
          <button
            className="ac-header-btn"
            onClick={() => navegacion(-1)}
            title="Volver"
          >
            <i className="bi bi-arrow-left" />
          </button>
          <div className="ac-header-center">
            <h1 className="ac-header-title">Gestión de Áreas Comunes</h1>
          </div>
          <div className="ac-header-actions">
            <button
              className="ac-header-btn"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list" />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="ac-content">
          {/* Estadísticas */}
          <div className="ac-stats-container">
            <div className="ac-stat-box">
              <div className="ac-stat-label" style={{ color: "#e65100" }}>
                Total
              </div>
              <div className="ac-stat-value" style={{ color: "#e65100" }}>
                {totalReservas}
              </div>
            </div>
            <div className="ac-stat-box">
              <div className="ac-stat-label" style={{ color: "#f57c00" }}>
                Activas
              </div>
              <div className="ac-stat-value" style={{ color: "#f57c00" }}>
                {totalActivas}
              </div>
            </div>
            <div className="ac-stat-box">
              <div className="ac-stat-label" style={{ color: "#9e9e9e" }}>
                Finalizadas
              </div>
              <div className="ac-stat-value" style={{ color: "#9e9e9e" }}>
                {totalFinalizadas}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="ac-action-bar">
            <button
              className="ac-btn-registrar"
              onClick={() => abrirModal()}
              disabled={loading}
            >
              <i className="bi bi-plus-circle" />
              {loading ? "Cargando..." : "Registrar Nueva Reserva"}
            </button>
            <button className="ac-btn-calendario" onClick={abrirCalendario}>
              <i className="bi bi-calendar3" />
              Calendario
            </button>
            {rolesId === 1 && (
              <button
                className="ac-btn-gestionar-areas"
                onClick={() => setShowModalAreas(true)}
              >
                <i className="bi bi-toggles" />
                Gestionar Áreas
              </button>
            )}
          </div>

          {/* Toolbar: búsqueda + filtros */}
          <div className="ac-toolbar">
            <div className="ac-toolbar-row">
              <div className="ac-filter-search">
                <i className="bi bi-search ac-filter-search-icon" />
                <input
                  type="text"
                  className="form-control ac-filter-input"
                  placeholder="Buscar solicitante..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                />
              </div>

              <div className="ac-filter-group">
                <span className="ac-filter-label">Estado:</span>
                <div className="ac-filter-chips">
                  {[
                    { key: "todas", label: "Todas" },
                    { key: "activas", label: "Activas" },
                    { key: "finalizadas", label: "Finalizadas" },
                  ].map((chip) => (
                    <button
                      key={chip.key}
                      className={`ac-chip ${filtroEstado === chip.key ? "active" : ""}`}
                      onClick={() => {
                        setFiltroEstado(chip.key);
                        setPaginaActual(1);
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="ac-results-info">
              Mostrando {reservasPaginadas.length} de {reservasFiltradas.length}{" "}
              reservas
            </div>
          </div>

          {/* ── Estado vacío ── */}
          {reservasFiltradas.length === 0 && (
            <div className="ac-empty-container">
              <i className="bi bi-calendar-x ac-empty-icon" />
              <p>No hay reservas para mostrar</p>
            </div>
          )}

          {/* ── Tabla (desktop ≥ 800px, ocultada por CSS en móvil) ── */}
          {reservasPaginadas.length > 0 && (
            <div className="ac-table-container">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Solicitante</th>
                    <th>Área</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Apto</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasPaginadas.map((r) => (
                    <tr key={r.idReservas}>
                      <td>
                        <strong>{r.nombreSolicitante}</strong>
                        <br />
                        <small style={{ color: "#9e9e9e" }}>
                          {r.documentoSolicitante}
                        </small>
                      </td>
                      <td>{r.nombreArea}</td>
                      <td>{r.fechaReserva}</td>
                      <td>
                        {formatHora(r.horaInicio)} — {formatHora(r.horaFin)}
                      </td>
                      <td>
                        {r.numeroApartamento}
                        {r.nombreTorre && (
                          <small style={{ display: "block", color: "#9e9e9e" }}>
                            {r.nombreTorre}
                          </small>
                        )}
                      </td>
                      <td>{badgeEstado(r.nombreEstado)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="ac-action-btn info"
                          title="Detalles"
                          onClick={() => verDetalles(r)}
                        >
                          <i className="bi bi-eye" />
                        </button>
                        {r.nombreEstado?.toLowerCase() !== "finalizada" && (
                          <>
                            <button
                              className="ac-action-btn edit"
                              title="Editar"
                              onClick={() => editarReserva(r)}
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              className="ac-action-btn finish"
                              title="Finalizar"
                              onClick={() => finalizarRegistro(r.idReservas)}
                            >
                              <i className="bi bi-check-circle" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Cards (móvil < 800px, ocultadas por CSS en desktop) ── */}
          {reservasPaginadas.length > 0 && (
            <div className="ac-cards-container">
              {reservasPaginadas.map((r) => (
                <div className="ac-card" key={r.idReservas}>
                  <div className="ac-card-header">
                    <span className="ac-card-name">{r.nombreSolicitante}</span>
                    {badgeEstado(r.nombreEstado)}
                  </div>

                  <div className="ac-card-row">
                    <div className="ac-card-row-icon area">
                      <i className="bi bi-building" />
                    </div>
                    <span className="ac-card-row-text">{r.nombreArea}</span>
                  </div>

                  <div className="ac-card-row">
                    <div className="ac-card-row-icon fecha">
                      <i className="bi bi-calendar3" />
                    </div>
                    <span className="ac-card-row-text">
                      {r.fechaReserva} · {formatHora(r.horaInicio)} —{" "}
                      {formatHora(r.horaFin)}
                    </span>
                  </div>

                  <div className="ac-card-row">
                    <div className="ac-card-row-icon apto">
                      <i className="bi bi-door-open" />
                    </div>
                    <span className="ac-card-row-text">
                      Apto {r.numeroApartamento}{" "}
                      {r.nombreTorre ? `- ${r.nombreTorre}` : ""}
                    </span>
                  </div>

                  <div className="ac-card-actions">
                    <button
                      className="ac-card-btn detalles"
                      onClick={() => verDetalles(r)}
                    >
                      <i className="bi bi-eye" /> Detalles
                    </button>
                    {r.nombreEstado?.toLowerCase() !== "finalizada" && (
                      <>
                        <button
                          className="ac-card-btn editar"
                          onClick={() => editarReserva(r)}
                        >
                          <i className="bi bi-pencil" /> Editar
                        </button>
                        <button
                          className="ac-card-btn finalizar"
                          onClick={() => finalizarRegistro(r.idReservas)}
                        >
                          <i className="bi bi-check-circle" /> Finalizar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Paginación ── */}
          {totalPaginas > 1 && (
            <div className="ac-pagination">
              <button
                className="ac-page-btn"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(paginaActual - 1)}
              >
                <i className="bi bi-chevron-left" />
              </button>
              {[...Array(totalPaginas)].map((_, i) => (
                <button
                  key={i}
                  className={`ac-page-btn ${paginaActual === i + 1 ? "active" : ""}`}
                  onClick={() => setPaginaActual(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="ac-page-btn"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual(paginaActual + 1)}
              >
                <i className="bi bi-chevron-right" />
              </button>
              <span className="ac-page-info">
                Pág {paginaActual} de {totalPaginas}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ MODAL — REGISTRAR / EDITAR ══════════ */}
      {modalAbierto && (
        <div
          className="ac-modal-overlay"
          onClick={cerrarModal}
          onKeyDown={(e) => {
            if (e.key === "Escape") cerrarModal();
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div
            className="ac-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="ac-modal-header">
              <h5>
                {editIndex !== null ? "Editar Reserva" : "Registrar Reserva"}
              </h5>
              <button className="ac-modal-close" onClick={cerrarModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="ac-modal-body">
              <form onSubmit={handleSubmit}>
                {/* Sección Solicitante */}
                <div className="ac-form-section">
                  <div className="ac-form-section-title">
                    <i className="bi bi-person-fill me-2" />
                    Datos del Solicitante
                  </div>
                  <div className="ac-form-grid">
                    <div className="ac-form-group">
                      <label className="ac-form-label">Tipo Documento *</label>
                      <select
                        name="tipoDocumentoId"
                        className="ac-form-control"
                        value={reserva.tipoDocumentoId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {tiposDocumento.map((t) => (
                          <option
                            key={t.tipoDocumentoId}
                            value={t.tipoDocumentoId}
                          >
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">Nro. Documento *</label>
                      <input
                        type="text"
                        name="documentoSolicitante"
                        className="ac-form-control"
                        value={reserva.documentoSolicitante}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="ac-form-group full-width">
                      <label className="ac-form-label">Nombre Completo *</label>
                      <input
                        type="text"
                        name="nombreSolicitante"
                        className="ac-form-control"
                        value={reserva.nombreSolicitante}
                        onChange={handleChange}
                        placeholder="Nombre y apellidos"
                        required
                      />
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">Teléfono *</label>
                      <input
                        type="text"
                        name="telefonoSolicitante"
                        className="ac-form-control"
                        value={reserva.telefonoSolicitante}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">Correo *</label>
                      <input
                        type="email"
                        name="correoSolicitante"
                        className="ac-form-control"
                        value={reserva.correoSolicitante}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Reserva */}
                <div className="ac-form-section">
                  <div className="ac-form-section-title">
                    <i className="bi bi-calendar2-event me-2" />
                    Datos de la Reserva
                  </div>
                  <div className="ac-form-grid">
                    <div className="ac-form-group">
                      <label className="ac-form-label">Torre *</label>
                      <select
                        name="torre"
                        className="ac-form-control"
                        value={reserva.torre}
                        onChange={handleTorreChange}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {torresDisponibles.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">Apartamento *</label>
                      <select
                        name="apartamentoId"
                        className="ac-form-control"
                        value={reserva.apartamentoId}
                        onChange={handleChange}
                        required
                        disabled={!reserva.torre}
                      >
                        <option value="">
                          {!reserva.torre
                            ? "Primero selecciona torre"
                            : "Seleccionar"}
                        </option>
                        {apartamentosFiltrados.map((a) => (
                          <option key={a.idApartamento} value={a.idApartamento}>
                            Apto {a.numeroApartamento}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ac-form-group full-width">
                      <label className="ac-form-label">Área Común *</label>
                      <select
                        name="areaComunId"
                        className="ac-form-control"
                        value={reserva.areaComunId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccionar área</option>
                        {areasComunes
                          .filter((a) => a.estadoId === 4)
                          .map((a) => (
                            <option key={a.idAreaComun} value={a.idAreaComun}>
                              {a.nombreArea}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">Fecha Reserva *</label>
                      <input
                        type="date"
                        name="fechaReserva"
                        className="ac-form-control"
                        value={reserva.fechaReserva}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="ac-form-group" />
                    <div className="ac-form-group">
                      <label className="ac-form-label">Hora Inicio *</label>
                      <input
                        type="time"
                        name="horaInicio"
                        className="ac-form-control"
                        value={reserva.horaInicio}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">Hora Fin *</label>
                      <input
                        type="time"
                        name="horaFin"
                        className="ac-form-control"
                        value={reserva.horaFin}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">Asistentes *</label>
                      <input
                        type="number"
                        name="cantidadAsistentes"
                        className="ac-form-control"
                        value={reserva.cantidadAsistentes}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </div>
                    <div className="ac-form-group">
                      <label className="ac-form-label">&nbsp;</label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        <input
                          type="checkbox"
                          name="invitadosExternos"
                          checked={reserva.invitadosExternos}
                          onChange={handleChange}
                        />
                        Invitados externos
                      </label>
                    </div>
                    <div className="ac-form-group full-width">
                      <label className="ac-form-label">
                        Motivo de la Reserva *
                      </label>
                      <textarea
                        name="motivoReserva"
                        className="ac-form-control"
                        value={reserva.motivoReserva}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Describe el motivo de la reserva"
                        required
                      />
                    </div>
                    <div className="ac-form-group full-width">
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 14,
                          color: "#424242",
                        }}
                      >
                        <input
                          type="checkbox"
                          name="aceptaReglamento"
                          checked={reserva.aceptaReglamento}
                          onChange={handleChange}
                          required
                        />
                        Acepto el reglamento de uso *
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="ac-form-submit"
                  disabled={loading}
                >
                  {loading
                    ? editIndex !== null
                      ? "Guardando..."
                      : "Registrando..."
                    : editIndex !== null
                      ? "Guardar Cambios"
                      : "Registrar Reserva"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — DETALLES ══════════ */}
      {showModalDetalles && registroSeleccionado && (
        <div
          className="ac-modal-overlay"
          onClick={() => setShowModalDetalles(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowModalDetalles(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div
            className="ac-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="ac-modal-header">
              <h5>Detalles de la Reserva</h5>
              <button
                className="ac-modal-close"
                onClick={() => setShowModalDetalles(false)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-detalle-section">Solicitante</div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Nombre</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.nombreSolicitante}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Documento</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.documentoSolicitante}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Teléfono</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.telefonoSolicitante}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Correo</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.correoSolicitante}
                </span>
              </div>

              <div className="ac-detalle-section">Reserva</div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">ID</span>
                <span className="ac-detalle-value">
                  #{registroSeleccionado.idReservas}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Área</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.nombreArea}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Apartamento</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.numeroApartamento}{" "}
                  {registroSeleccionado.nombreTorre
                    ? `- ${registroSeleccionado.nombreTorre}`
                    : ""}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Fecha</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.fechaReserva}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Horario</span>
                <span className="ac-detalle-value">
                  {formatHora(registroSeleccionado.horaInicio)} —{" "}
                  {formatHora(registroSeleccionado.horaFin)}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Motivo</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.motivoReserva}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Asistentes</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.cantidadAsistentes}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Externos</span>
                <span className="ac-detalle-value">
                  {registroSeleccionado.invitadosExternos ? "Sí" : "No"}
                </span>
              </div>
              <div className="ac-detalle-row">
                <span className="ac-detalle-label">Estado</span>
                <span className="ac-detalle-value">
                  {badgeEstado(registroSeleccionado.nombreEstado)}
                </span>
              </div>

              {/* Botón imprimir recibo */}
              <button
                className="ac-btn-imprimir"
                onClick={() => imprimirRecibo(registroSeleccionado)}
              >
                <i className="bi bi-printer" /> Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — CALENDARIO ══════════ */}
      {showCalendario && (
        <div
          className="ac-modal-overlay"
          onClick={() => setShowCalendario(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowCalendario(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div
            className="ac-modal ac-calendar-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="ac-modal-header">
              <h5>Calendario de Reservas</h5>
              <button
                className="ac-modal-close"
                onClick={() => setShowCalendario(false)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="ac-modal-body">
              {/* Navegación de mes */}
              <div className="ac-calendar-nav">
                <button className="ac-calendar-nav-btn" onClick={mesAnterior}>
                  <i className="bi bi-chevron-left" />
                </button>
                <span className="ac-calendar-month">
                  {MESES[calMonth]} {calYear}
                </span>
                <button className="ac-calendar-nav-btn" onClick={mesSiguiente}>
                  <i className="bi bi-chevron-right" />
                </button>
              </div>

              {/* Encabezados de semana */}
              <div className="ac-calendar-weekdays">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="ac-calendar-weekday">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grilla de días */}
              <div className="ac-calendar-grid">
                {buildCalendarGrid().map((cell, idx) => {
                  if (!cell.day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="ac-calendar-day empty"
                      />
                    );
                  }
                  const reservasDia = reservasDelDia(cell.day);
                  const tieneReservas = reservasDia.length > 0;
                  const past = esPasado(cell.day);
                  const today = esHoy(cell.day);
                  const isSelected = selectedDay === cell.day;

                  let cls = "ac-calendar-day";
                  if (past) cls += " past";
                  if (today) cls += " today";
                  if (isSelected) cls += " selected";
                  if (tieneReservas && !past) cls += " has-reservas";

                  return (
                    <div
                      key={cell.day}
                      className={cls}
                      onClick={() => !past && setSelectedDay(cell.day)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && !past)
                          setSelectedDay(cell.day);
                      }}
                      role="button"
                      tabIndex={past ? -1 : 0}
                    >
                      {cell.day}
                      {tieneReservas && !past && (
                        <div className="ac-calendar-day-dot" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lista de reservas del día seleccionado */}
              {selectedDay && (
                <div className="ac-calendar-reservas">
                  <div className="ac-calendar-fecha">
                    {selectedDay} de {MESES[calMonth]} {calYear}
                  </div>
                  {reservasDelDia(selectedDay).length === 0 ? (
                    <p style={{ color: "#9e9e9e", textAlign: "center" }}>
                      No hay reservas este día
                    </p>
                  ) : (
                    reservasDelDia(selectedDay).map((r, i) => (
                      <div key={i} className="ac-calendar-reserva-card">
                        <div className="ac-calendar-reserva-icon">
                          <i className="bi bi-calendar2-event" />
                        </div>
                        <div className="ac-calendar-reserva-info">
                          <div className="ac-calendar-reserva-area">
                            {r.areaComun?.nombreArea ||
                              r.nombreArea ||
                              "Área común"}
                          </div>
                          <div className="ac-calendar-reserva-hora">
                            {formatHora(r.horaInicio)} — {formatHora(r.horaFin)}
                          </div>
                          <div className="ac-calendar-reserva-nombre">
                            {r.Solicitante?.nombreSolicitante ||
                              r.nombreSolicitante ||
                              ""}
                          </div>
                        </div>
                        <div className="ac-calendar-reserva-estado">
                          {r.estado?.nombreEstado || r.nombreEstado || "Activa"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL GESTIONAR ÁREAS (SuperAdmin) ══════════ */}
      {showModalAreas && rolesId === 1 && (
        <div
          className="ac-modal-overlay"
          onClick={() => setShowModalAreas(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowModalAreas(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div
            className="ac-modal ac-modal-areas"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="ac-modal-header">
              <h2>
                <i className="bi bi-toggles me-2" />
                Gestionar Áreas Comunes
              </h2>
              <button
                className="ac-modal-close"
                onClick={() => setShowModalAreas(false)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="ac-modal-body" style={{ padding: "20px" }}>
              <p className="ac-areas-desc">
                <i className="bi bi-info-circle me-1" />
                Active o desactive las áreas comunes. Las áreas inhabilitadas no
                aparecerán en el formulario de reservas.
              </p>
              <div className="ac-areas-list">
                {areasComunes.map((area) => {
                  const disponible = area.estadoId === 4;
                  return (
                    <div
                      key={area.idAreaComun}
                      className={`ac-area-card ${disponible ? "ac-area-disponible" : "ac-area-inhabilitada"}`}
                    >
                      <div className="ac-area-card-info">
                        <div className="ac-area-card-icon">
                          <i
                            className={`bi ${disponible ? "bi-building-check" : "bi-building-slash"}`}
                          />
                        </div>
                        <div>
                          <div className="ac-area-card-name">
                            {area.nombreArea}
                          </div>
                          <div className="ac-area-card-meta">
                            Capacidad: {area.capacidad || "—"} personas
                          </div>
                          <span
                            className={`ac-badge ${disponible ? "ac-badge-activa" : "ac-badge-finalizada"}`}
                          >
                            {disponible ? "Disponible" : "Inhabilitada"}
                          </span>
                        </div>
                      </div>
                      <button
                        className={`ac-area-toggle-btn ${disponible ? "ac-area-toggle-off" : "ac-area-toggle-on"}`}
                        onClick={() => toggleEstadoArea(area)}
                        title={disponible ? "Inhabilitar" : "Habilitar"}
                      >
                        <i
                          className={`bi ${disponible ? "bi-toggle-on" : "bi-toggle-off"}`}
                        />
                        {disponible ? "Inhabilitar" : "Habilitar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AreasComunes;
