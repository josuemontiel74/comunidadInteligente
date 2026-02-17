import "bootstrap/dist/css/bootstrap.min.css";
import "../Styles/residentes.css";
import logo from "../../img/logo.png";

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Table, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import { obtenerResidentes, crearOcupante, actualizarOcupante, finalizarOcupante } from "../services/residentes.services.jsx";



const obtenerToken = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  // Si no hay token válido, usar token de desarrollo
  if (!token) {
    console.warn(
      "No se encontró token de autenticación, usando token de desarrollo"
    );
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Impvc3VlMjAyMyIsInJvbGVzSWQiOjEsImlhdCI6MTc1OTUxNTQwMCwiZXhwIjoxNzU5NTE5MDAwfQ.wKzrnUttdHRGkHnnZL1LR1amxt2ZQ4PZR85khZauShQ";
  }

  return token;
};

const token = obtenerToken();

// Función para verificar si el token está vencido
const verificarTokenVencido = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const fechaExpiracion = payload.exp * 1000; // Convertir a milisegundos
    return Date.now() >= fechaExpiracion;
  } catch (error) {
    console.error("Error al verificar expiración del token:", error);
    return true; // Considerar vencido si hay error
  }
};

const obtenerUsuarioDelToken = () => {
  try {
    if (verificarTokenVencido(token)) {
      console.warn("Token vencido, usando usuario por defecto...");
      return "josue2023";
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || "Usuario";
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return "Usuario";
  }
};

// Traduce mensajes/estructuras de error del backend a textos amigables en español
const campoAmigable = (field) => {
  const map = {
    numeroDocumento: 'Número de documento',
    primerNombre: 'Primer nombre',
    segundoNombre: 'Segundo nombre',
    primerApellido: 'Primer apellido',
    segundoApellido: 'Segundo apellido',
    correoElectronico: 'Correo electrónico',
    correo: 'Correo electrónico',
    telefono: 'Teléfono',
    apto: 'Apartamento',
    apartamentosId: 'Apartamento',
    tipoOcupacion: 'Tipo de ocupación',
    fechaInicio: 'Fecha de inicio',
    fechaFin: 'Fecha de fin',
    personasACargo: 'Personas a cargo',
  };
  return map[field] || field;
};

const traducirMensajeBackend = (errData) => {
  if (errData === null || errData === undefined) return 'Datos inválidos o incompletos.';

  if (typeof errData === 'string') {
    const s = errData;
    if (/required|is required|cannot be null|no puede estar vacío|cannot be empty/i.test(s)) return 'Falta información obligatoria en el formulario.';
    if (/max.*length|no puede.*mayor|exceeds the maximum|too long|longitud máxima/i.test(s)) return 'Algún campo supera la longitud permitida.';
    if (/min.*length|must be at least|falta.*caracter|too short|longitud mínima/i.test(s)) return 'Algún campo no cumple la longitud mínima requerida.';
    if (/invalid|not valid|no válido|formato/i.test(s)) return 'Formato de campo inválido.';
    if (/unique|exists|ya existe/i.test(s)) return 'Ya existe un registro con esos datos.';
    // Si el mensaje ya está en español claro, devolverlo
    if (/[áéíóúñ¿¡]/i.test(s) || /\b(error|campo|no|falta|inválid)/i.test(s)) return s;
    // Por defecto, devolver un mensaje genérico pero útil
    return 'Hay un problema con los datos ingresados. Revise el formulario e intente nuevamente.';
  }

  if (Array.isArray(errData)) {
    return errData.map((e) => traducirMensajeBackend(e)).join(' ');
  }

  if (typeof errData === 'object') {
    // Estructura común: { message: '...', errors: [...] }
    if (errData.message && typeof errData.message === 'string') {
      return traducirMensajeBackend(errData.message);
    }

    if (errData.errors && Array.isArray(errData.errors)) {
      return errData.errors
        .map((it) => {
          if (it.field || it.param) {
            const f = it.field || it.param;
            const msg = it.message || it.msg || it.error || JSON.stringify(it);
            return `${campoAmigable(f)}: ${traducirMensajeBackend(msg)}`;
          }
          return traducirMensajeBackend(it.message || it);
        })
        .join(' ');
    }

    // Si es un objeto con claves por campo
    const partes = [];
    for (const k in errData) {
      if (!Object.prototype.hasOwnProperty.call(errData, k)) continue;
      const v = errData[k];
      const texto = traducirMensajeBackend(v);
      partes.push(`${campoAmigable(k)}: ${texto}`);
    }
    if (partes.length) return partes.join(' ');

    return 'Hay un problema con los datos ingresados. Revise el formulario e intente nuevamente.';
  }

  return 'Hay un problema con los datos ingresados. Revise el formulario e intente nuevamente.';
};
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
if (verificarTokenVencido(token)) {

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

const nombreUsuario = obtenerUsuarioDelToken();

const tokenValido = token && !verificarTokenVencido(token);
const showUserManagement = tokenValido && rolesId === 1; // solo SuperAdmin puede gestionar usuarios
const showAreasComunes = tokenValido && rolesId !== 3; // ocultar áreas comunes para Vigilante (3)


function Residentes() {
  const location = useLocation();
  const navegacion = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 3500, showConfirmButton: false, timerProgressBar: true }).then(() => {
        localStorage.clear();
        navegacion('/');
      });
    }
  }, [navegacion]);
  const CerraSesión = (e) => {
    e?.preventDefault();
    localStorage.clear();
    navegacion("/");
  };

  const [showUserMenu, setShowUserMenu] = useState(false);



  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarResidentes = async () => {
    try {
      setLoading(true);
      const res = await obtenerResidentes(obtenerToken());

      if (res?.status === 401) {
        // Mostrar mensaje que provea el backend si lo hay
        let body = null;
        try {
          const ct = res.headers.get('content-type') || '';
          body = ct.includes('application/json') ? await res.json() : await res.text();
        } catch (e) {
          body = null;
        }
        const backendMsg = body ? (typeof body === 'object' ? (body.message || JSON.stringify(body)) : body) : 'No autorizado. Token inválido o expirado.';
        console.error('Token expirado o inválido', res.status, backendMsg);
        Swal.fire({ icon: 'warning', title: 'No autorizado', text: backendMsg, confirmButtonText: 'Entendido' }).then(() => {
          localStorage.removeItem('token');
          navegacion('/');
        });
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        let parsed = text;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          // no es JSON
        }
        console.error("Error al obtener residentes:", res.status, res.statusText, parsed);
        if (res.status === 400) {
          const friendly = traducirMensajeBackend(parsed || text);
          Swal.fire({ icon: 'warning', title: 'Error de validación', text: friendly, confirmButtonText: 'Entendido' });
          setLoading(false);
          return;
        }
        if (res.status >= 500) {
          Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'Error en el servidor. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
          setLoading(false);
          return;
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const ocupantes = data.body || data;

      const residentesFormateados = ocupantes.map((ocupante) => ({
        idOcupante: ocupante.idOcupante,
        tipoDocumento: mapTipoDocumento(ocupante.tipoDocumentoId),
        numeroDocumento: ocupante.numeroDocumento,
        tipoOcupacion:
          ocupante.tipoOcupacion.charAt(0).toUpperCase() +
          ocupante.tipoOcupacion.slice(1),
        primerNombre: ocupante.primerNombre,
        segundoNombre: ocupante.segundoNombre || "",
        primerApellido: ocupante.primerApellido,
        segundoApellido: ocupante.segundoApellido || "",
        fechaInicio: ocupante.fechaInicio,
        fechaFin: ocupante.fechaFin || "",
        correo: ocupante.correoElectronico || "",
        telefono: ocupante.telefono || "",
        tieneNinos: ocupante.tieneNinos || 0,
        tieneAdultoMayor: ocupante.tieneAdultoMayor || 0,
        tieneDiscapacidad: ocupante.tieneDiscapacidad || 0,
        torre: mapTorre(ocupante.torresId),
        torresId: ocupante.torresId,
        apto: ocupante.apartamentosId?.toString(),
        aptoDisplay: formatNumeroApartamento(ocupante.apartamentosId),
        estado: ocupante.nombreEstado === "activa" ? "Activo" : "Finalizado",
        nombreCompleto: [
          ocupante.primerNombre,
          ocupante.segundoNombre,
          ocupante.primerApellido,
          ocupante.segundoApellido,
        ]
          .filter(Boolean)
          .join(" "),
        apartamentosId: ocupante.apartamentosId,
      }));
      setResidentes(residentesFormateados);
    } catch (error) {
      console.error("Error al cargar residentes:", error);
      Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
    } finally {
      setLoading(false);
    }
  };


  const mapTipoDocumento = (tipoDocumentoId) => {
    const tipos = { 1: "CC", 2: "CE", 3: "PP", 4: "PEP", 5: "PPT" };
    return tipos[tipoDocumentoId] || "CC";
  };

  const mapTipoDocumentoId = (tipoDocumento) => {
    const tipos = { CC: 1, CE: 2, PP: 3, PEP: 4, PPT: 5 };
    return tipos[tipoDocumento] || 1;
  };

  const mapTorre = (torresId) => {
    const torres = {
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
    };
    return torres[torresId] || "A";
  };

  const mapTorreId = (torre) => {
    const torres = {
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
    };
    return torres[torre] || 1;
  };

  useEffect(() => {
    cargarResidentes();
    cargarApartamentos();
  }, []);

  const formatNumeroApartamento = (num) => {
    if (num === null || num === undefined) return "";
    const s = num.toString();
    const m = s.match(/^(\d)(0)(\d{1,3})$/);
    if (m) return `${m[1]}${m[3]}`;
    return s;
  };

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [residenteSeleccionado, setResidenteSeleccionado] = useState(null);

  const [formData, setFormData] = useState({
    tipoDocumento: "CC",
    numeroDocumento: "",
    tipoOcupacion: "Propietario",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    correo: "",
    telefono: "",
    torre: "A",
    torreId: 1,
    apto: "",
    estado: "Activo",
    tieneNinos: 0,
    tieneAdultoMayor: 0,
    tieneDiscapacidad: 0,
  });

  useEffect(() => {
    if (location.state?.abrirModal) abrirModal();
  }, [location.state]);

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
        fechaFin: "",
        correo: "",
        telefono: "",
        torre: "A",
        torreId: 1,
        apto: "",
        estado: "Activo",
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
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const [apartamentos, setApartamentos] = useState([]);


  const cargarApartamentos = async () => {
    try {
      const res = await obtenerResidentes(obtenerToken());

      if (res?.status === 401) {
        console.error("Token expirado o inválido");
        localStorage.removeItem("token");
        navegacion("/");
        return;
      }

      if (!res.ok) {
        console.error("Error al obtener residentes para aptos:", res.status, res.statusText);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const ocupantes = data.body || data;
      const apartamentosUnicos = [];
      const idsVistos = new Set();


      const formatNumeroApartamento = (num) => {
        if (num === null || num === undefined) return '';
        const s = num.toString();

        const m = s.match(/^(\d)(0)(\d{1,3})$/);
        if (m) return `${m[1]}${m[3]}`;
        return s;
      };

      ocupantes.forEach((ocupante) => {
        if (!idsVistos.has(ocupante.apartamentosId)) {
          idsVistos.add(ocupante.apartamentosId);
          apartamentosUnicos.push({
            idApartamento: ocupante.apartamentosId,
            numeroApartamento: formatNumeroApartamento(ocupante.apartamentosId),
            torresId: ocupante.torresId,
          });
        }
      });


      console.log("Apartamentos cargados desde DB:", apartamentosUnicos);

      // Ordenar por ID
      apartamentosUnicos.sort((a, b) => a.idApartamento - b.idApartamento);

      setApartamentos(apartamentosUnicos);
    } catch (error) {
      console.error("Error al cargar apartamentos:", error);

      setApartamentos([
        { idApartamento: 1, numeroApartamento: "1", torresId: 1 },
        { idApartamento: 2, numeroApartamento: "2", torresId: 1 },
        { idApartamento: 3, numeroApartamento: "3", torresId: 1 },
        { idApartamento: 4, numeroApartamento: "4", torresId: 1 },
        { idApartamento: 5, numeroApartamento: "5", torresId: 1 },
      ]);
    }
  };

  const generarAptos = (torre) => {
    const torreId = Number(torre) || null;
    if (!torreId || apartamentos.length === 0) return [];
    return apartamentos
      .filter((apt) => apt.torresId === torreId)
      .map((apt) => ({
        id: apt.idApartamento,
        numero: apt.numeroApartamento,
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (editIndex === null && !formData.numeroDocumento.trim()) {
      Swal.fire("Error", "Ingrese número de documento", "error");
      return;
    }
    if (!formData.primerNombre.trim()) {
      Swal.fire("Error", "Ingrese al menos el primer nombre", "error");
      return;
    }
    if (!formData.primerApellido.trim()) {
      Swal.fire("Error", "Ingrese al menos el primer apellido", "error");
      return;
    }
    if (!formData.apto) {
      Swal.fire("Error", "Seleccione un apartamento", "error");
      return;
    }
    if (!formData.fechaInicio || formData.fechaInicio.trim() === "") {
      Swal.fire("Error", "La fecha de inicio es obligatoria", "error");
      return;
    }

    try {
      const apartamentoId = parseInt(formData.apto);
      if (isNaN(apartamentoId) || apartamentoId <= 0) {
        Swal.fire("Error", "ID de apartamento inválido", "error");
        return;
      }


      const apartamentoExiste = apartamentos.some(
        (apt) => apt.idApartamento === apartamentoId
      );
      if (!apartamentoExiste) {
        Swal.fire(
          "Error",
          `El apartamento con ID ${apartamentoId} no existe en el sistema`,
          "error"
        );
        console.error(
          "Apartamento no encontrado. ID:",
          apartamentoId,
          "Apartamentos disponibles:",
          apartamentos
        );
        return;
      }

      const ocupanteData = {
        apartamentosId: apartamentoId,
        tipoOcupacion: formData.tipoOcupacion.toLowerCase(),
        personasACargo: parseInt(formData.personasACargo) || 0,
        fechaInicio: formData.fechaInicio,
        fechaFin:
          formData.fechaFin && formData.fechaFin.trim() !== ""
            ? formData.fechaFin
            : null,
        tipoDocumentoId: mapTipoDocumentoId(formData.tipoDocumento),
        primerNombre: formData.primerNombre,
        segundoNombre:
          formData.segundoNombre && formData.segundoNombre.trim() !== ""
            ? formData.segundoNombre
            : null,
        primerApellido: formData.primerApellido,
        segundoApellido:
          formData.segundoApellido && formData.segundoApellido.trim() !== ""
            ? formData.segundoApellido
            : null,
        telefono: formData.telefono || "0000000000",
        // Para creación usar placeholder si no hay correo; para actualización omitir si está vacío
        correoElectronico:
          editIndex === null
            ? formData.correo || "noemail@example.com"
            : formData.correo && formData.correo.trim() !== ""
              ? formData.correo
              : undefined,
        tieneNinos: Number(formData.tieneNinos) === 1 ? 1 : 0,
        tieneAdultoMayor: Number(formData.tieneAdultoMayor) === 1 ? 1 : 0,
        tieneDiscapacidad: Number(formData.tieneDiscapacidad) === 1 ? 1 : 0,
      };


      // Incluir número de documento tanto en creación como en edición
      if (formData.numeroDocumento && formData.numeroDocumento.trim() !== "") {
        ocupanteData.numeroDocumento = formData.numeroDocumento.trim();
      }

      if (editIndex !== null) {
        const result = await Swal.fire({
          title: "¿Quieres guardar los cambios?",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Guardar",
          denyButtonText: "No guardar",
        });

        if (result.isConfirmed) {

          console.log("=== DEBUG UPDATE ===");
          console.log("ID a actualizar:", editIndex);
          console.log("Datos a enviar:", ocupanteData);

          const resUpdate = await actualizarOcupante(editIndex, ocupanteData, obtenerToken());
          if (resUpdate?.status === 401) {
            let body = null;
            try {
              const ct = resUpdate.headers.get('content-type') || '';
              body = ct.includes('application/json') ? await resUpdate.json() : await resUpdate.text();
            } catch (e) { body = null; }
            const backendMsg = body ? (typeof body === 'object' ? (body.message || JSON.stringify(body)) : body) : 'No autorizado. Token inválido o expirado.';
            Swal.fire({ icon: 'warning', title: 'No autorizado', text: backendMsg, confirmButtonText: 'Entendido' }).then(() => { localStorage.removeItem('token'); navegacion('/'); });
            return;
          }
          if (!resUpdate.ok) {
            const contentType = resUpdate.headers.get("content-type");
            const errData = contentType && contentType.includes("application/json") ? await resUpdate.json() : await resUpdate.text();
            console.error("Error actualizando ocupante:", resUpdate.status, errData);
            if (resUpdate.status === 400) {
              // Mostrar el mensaje tal cual lo envía el backend (si lo proporciona)
              const backendMsg = typeof errData === 'object' ? (errData.message || JSON.stringify(errData)) : errData;
              console.error('Error de validación desde backend:', backendMsg);
              Swal.fire({ icon: 'warning', title: 'Error de validación', text: backendMsg || 'Error de validación en los datos.', confirmButtonText: 'Entendido' });
              return;
            }
            if (resUpdate.status >= 500) {
              Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'Error en el servidor. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
              return;
            }
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el registro.', confirmButtonText: 'Entendido' });
            return;
          }

          Swal.fire({ icon: 'success', title: 'Guardado correctamente', timer: 3500, showConfirmButton: false });
          cargarResidentes();
          cerrarModal();
        } else if (result.isDenied) {
          Swal.fire("No guardado", "Los cambios no se aplicaron", "info");
        }
      } else {
        const resCreate = await crearOcupante(ocupanteData, obtenerToken());
        if (resCreate?.status === 401) {
          let body = null;
          try {
            const ct = resCreate.headers.get('content-type') || '';
            body = ct.includes('application/json') ? await resCreate.json() : await resCreate.text();
          } catch (e) { body = null; }
          const backendMsg = body ? (typeof body === 'object' ? (body.message || JSON.stringify(body)) : body) : 'No autorizado. Token inválido o expirado.';
          Swal.fire({ icon: 'warning', title: 'No autorizado', text: backendMsg, confirmButtonText: 'Entendido' }).then(() => { localStorage.removeItem('token'); navegacion('/'); });
          return;
        }
        const contentType = resCreate.headers.get("content-type");
        const dataCreate = contentType && contentType.includes("application/json") ? await resCreate.json() : await resCreate.text();

        if (!resCreate.ok) {
          console.error("Error creando ocupante:", resCreate.status, dataCreate);
          if (resCreate.status === 400) {
            const friendly = traducirMensajeBackend(dataCreate);
            Swal.fire({ icon: 'warning', title: 'Error de validación', text: friendly, confirmButtonText: 'Entendido' });
          } else if (resCreate.status >= 500) {
            Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'Error en el servidor. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear el registro.', confirmButtonText: 'Entendido' });
          }
        } else {
          Swal.fire({ icon: 'success', title: 'Registrado correctamente', timer: 3500, showConfirmButton: false });
          cargarResidentes();
          cerrarModal();
        }
      }
    } catch (error) {
      console.error("Error al guardar residente:", error);
      Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
    }
  };

  const abrirModalEditar = (residente) => {
    if (!residente) return;

    console.log("=== DEBUG EDICION ===");
    console.log("Residente a editar:", residente);
    console.log("ID del residente:", residente.idOcupante);


    setFormData({
      tipoDocumento: mapTipoDocumento(residente.tipoDocumentoId) || "CC",
      numeroDocumento: residente.numeroDocumento || "",
      tipoOcupacion:
        residente.tipoOcupacion?.charAt(0).toUpperCase() +
        residente.tipoOcupacion?.slice(1) || "Propietario",
      primerNombre: residente.primerNombre || "",
      segundoNombre: residente.segundoNombre || "",
      primerApellido: residente.primerApellido || "",
      segundoApellido: residente.segundoApellido || "",
      fechaInicio:
        residente.fechaInicio || new Date().toISOString().split("T")[0],
      fechaFin: residente.fechaFin || "",
      correo: residente.correoElectronico || "",
      telefono: residente.telefono || "",
      torre: mapTorre(residente.torresId) || "A",
      torreId: residente.torresId || mapTorreId(residente.torre) || 1,
      apto: residente.apartamentosId?.toString() || "",
      estado: residente.nombreEstado === "activa" ? "Activo" : "Finalizado",
      personasACargo: residente.personasACargo || 0,
      tieneNinos: residente.tieneNinos || 0,
      tieneAdultoMayor: residente.tieneAdultoMayor || 0,
      tieneDiscapacidad: residente.tieneDiscapacidad || 0,
    });

    setEditIndex(residente.idOcupante);
    setModalAbierto(true);
  };
  const finalizarResidente = async (residente) => {
    if (!residente) return;

    console.log("=== DEBUG FINALIZAR ===");
    console.log("Residente a finalizar:", residente);
    console.log("ID para API:", residente.idOcupante);

    const result = await Swal.fire({
      title: "¿Finalizar este residente?",
      text: "Esta acción finalizará la ocupación del residente. ¿Estás seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const resFinal = await finalizarOcupante(residente.idOcupante, obtenerToken());
        if (resFinal?.status === 401) {
          let body = null;
          try {
            const ct = resFinal.headers.get('content-type') || '';
            body = ct.includes('application/json') ? await resFinal.json() : await resFinal.text();
          } catch (e) { body = null; }
          const backendMsg = body ? (typeof body === 'object' ? (body.message || JSON.stringify(body)) : body) : 'No autorizado. Token inválido o expirado.';
          Swal.fire({ icon: 'warning', title: 'No autorizado', text: backendMsg, confirmButtonText: 'Entendido' }).then(() => { localStorage.removeItem('token'); navegacion('/'); });
          return;
        }
        if (!resFinal.ok) {
          const contentType = resFinal.headers.get("content-type");
          const errData = contentType && contentType.includes("application/json") ? await resFinal.json() : await resFinal.text();
          console.error("Error finalizando ocupante:", resFinal.status, errData);
          if (resFinal.status === 400) {
            const friendly = traducirMensajeBackend(errData);
            Swal.fire({ icon: 'warning', title: 'Error de validación', text: friendly, confirmButtonText: 'Entendido' });
            return;
          }
          if (resFinal.status >= 500) {
            Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'Error en el servidor. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
            return;
          }
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo finalizar el registro.', confirmButtonText: 'Entendido' });
          return;
        }
        Swal.fire({ icon: 'success', title: 'Finalizado correctamente', timer: 3500, showConfirmButton: false });
        cargarResidentes();
      } catch (error) {
        console.error("Error al finalizar residente:", error);
        Swal.fire({ icon: 'error', title: 'Lo siento', text: 'Error de conexión. Comuníquese con el área de sistemas.', confirmButtonText: 'Entendido' });
      }
    }
  };

  const verDetalles = (r) => {
    setResidenteSeleccionado(r);
    setShowModalDetalles(true);
  };

  const [vistaCuadricula, setVistaCuadricula] = useState(false);


  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const ordenarResidentes = (residentes) => {
    return [...residentes].sort((a, b) => {

      if (a.estado !== b.estado) {
        return a.estado === "Activo" ? -1 : 1;
      }

      const fechaA = new Date(a.fechaInicio || "1900-01-01");
      const fechaB = new Date(b.fechaInicio || "1900-01-01");
      return fechaB - fechaA;
    });
  };


  const filtrarResidentes = (residentes) => {
    let filtrados = [...residentes];

    if (filtroEstado !== "todos") {
      const estadoBuscado = filtroEstado === "activo" ? "Activo" : "Finalizado";
      filtrados = filtrados.filter((r) => r.estado === estadoBuscado);
    }

    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (r) =>
          r.nombreCompleto.toLowerCase().includes(terminoBusqueda) ||
          r.numeroDocumento.toLowerCase().includes(terminoBusqueda) ||
          r.correo.toLowerCase().includes(terminoBusqueda) ||
          r.telefono.toLowerCase().includes(terminoBusqueda) ||
          `${r.torre}-${r.aptoDisplay}`.toLowerCase().includes(terminoBusqueda)
      );
    }

    return filtrados;
  };

  const residentesOrdenados = ordenarResidentes(residentes);
  const residentesFiltrados = filtrarResidentes(residentesOrdenados);
  const totalPaginas = Math.ceil(
    residentesFiltrados.length / elementosPorPagina
  );
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const residentesPaginados = residentesFiltrados.slice(
    indiceInicio,
    indiceInicio + elementosPorPagina
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);


  const Paginacion = () => {
    if (totalPaginas <= 1) return null;

    const paginas = [];
    const maxPaginasVisibles = 5;

    let paginaInicio = Math.max(
      1,
      paginaActual - Math.floor(maxPaginasVisibles / 2)
    );
    let paginaFin = Math.min(
      totalPaginas,
      paginaInicio + maxPaginasVisibles - 1
    );

    if (paginaFin - paginaInicio < maxPaginasVisibles - 1) {
      paginaInicio = Math.max(1, paginaFin - maxPaginasVisibles + 1);
    }

    for (let i = paginaInicio; i <= paginaFin; i++) {
      paginas.push(i);
    }

    return (
      <nav aria-label="Paginación de residentes">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPaginaActual(1)}
              disabled={paginaActual === 1}
            >
              ««
            </button>
          </li>
          <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPaginaActual(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              ‹
            </button>
          </li>

          {paginas.map((pagina) => (
            <li
              key={pagina}
              className={`page-item ${paginaActual === pagina ? "active" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => setPaginaActual(pagina)}
              >
                {pagina}
              </button>
            </li>
          ))}

          <li
            className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""
              }`}
          >
            <button
              className="page-link"
              onClick={() => setPaginaActual(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              ›
            </button>
          </li>
          <li
            className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""
              }`}
          >
            <button
              className="page-link"
              onClick={() => setPaginaActual(totalPaginas)}
              disabled={paginaActual === totalPaginas}
            >
              »»
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div
      className="container-fluid p-0"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        overflow: "auto",
      }}
    >
      {/* Sidebar - Menú Super Admin */}
      <aside id="menuTrabajador" className="workers-menu bg-success text-white">
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

          {showAreasComunes && (
            <div className="mb-4">
              <h6 className="text-uppercase fw-bold">Gestión de Áreas Comunes</h6>
              <ul className="nav flex-column mt-2 gap-2">
                <li>
                  <Link className="nav-link text-white" to="/AreasComunes">
                    Registrar Reserva
                  </Link>
                </li>
                <li>
                  <Link className="nav-link text-white" to="/AreasComunes">
                    Consultar Zonas
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {showUserManagement && (
            <div className="mb-4">
              <h6 className="text-uppercase fw-bold">Gestión de Usuarios</h6>
              <ul className="nav flex-column mt-2 gap-2">
                <li>
                  <Link
                    className="nav-link text-white"
                    to="/GestionUsuario"
                    state={{ abrirModal: true }}
                  >
                    Registrar Usuario
                  </Link>
                </li>
                <li>
                  <Link className="nav-link text-white" to="/GestionUsuario">
                    Consultar Usuarios
                  </Link>
                </li>
              </ul>
            </div>
          )}

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
            <button className="btn btn-light w-100" onClick={CerraSesión}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 header-bar w-100">
          <div className="logo-container mx-auto">
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
              <i className="bi bi-person-circle"></i> {nombreUsuario}
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
                    onClick={CerraSesión}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-4 mb-4">
          <h2 className="fw-bold">Gestión de Residentes</h2>
        </div>

        <div
          className="container-fluid"
          style={{
            padding: "0 30px 30px 50px",
            maxWidth: "none",
          }}
        >
          <div
            className="d-flex justify-content-between align-items-center mb-3"
            style={{ margin: "0 15px" }}
          >
            <h3 className="fw-bold text-success"> Lista de Residentes</h3>
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={() => {
                  setEditIndex(null);
                  abrirModal();
                }}
              >
                <i className="bi bi-person-plus"></i> Añadir Residente
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setVistaCuadricula(!vistaCuadricula)}
              >
                {vistaCuadricula ? "Tabla" : "Cuadrícula"}
              </Button>
            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div
            className="row mb-3"
            style={{ margin: "0 15px", padding: "10px 0" }}
          >
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre, documento, correo, teléfono o apartamento..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setBusqueda("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Solo activos</option>
                <option value="finalizado">Solo finalizados</option>
              </select>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">
                Mostrando {residentesPaginados.length} de{" "}
                {residentesFiltrados.length} residentes
                {residentesFiltrados.length !== residentes.length &&
                  ` (${residentes.length} total)`}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando residentes...</p>
            </div>
          ) : !vistaCuadricula ? (
            <>
              <div
                className="table-container"
                style={{ margin: "0 15px", padding: "10px 0" }}
              >
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className="table-success">
                      <tr>
                        <th style={{ minWidth: "100px" }}>Documento</th>
                        <th style={{ minWidth: "60px" }}>Tipo</th>
                        <th style={{ minWidth: "90px" }}>Ocupación</th>
                        <th style={{ minWidth: "150px" }}>Nombre Completo</th>
                        <th style={{ minWidth: "85px" }}>F. Inicio</th>
                      
                        <th style={{ minWidth: "140px" }}>Correo</th>
                        <th style={{ minWidth: "100px" }}>Teléfono</th>
                        <th style={{ minWidth: "80px" }}>Niños</th>
                        <th style={{ minWidth: "120px" }}>Adulto Mayor</th>
                        <th style={{ minWidth: "120px" }}>Discapacidad</th>
                        <th style={{ minWidth: "70px" }}>Torre-Apto</th>
                        <th style={{ minWidth: "70px" }}>Estado</th>
                        <th style={{ minWidth: "120px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residentesPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="text-center py-4">
                            {residentesFiltrados.length === 0 &&
                              residentes.length > 0
                              ? "No se encontraron residentes con los criterios de búsqueda"
                              : "No hay residentes registrados"}
                          </td>
                        </tr>
                      ) : (
                        residentesPaginados.map((r, i) => (
                          <tr key={r.idOcupante || i}>
                            <td
                              className="text-truncate"
                              style={{ maxWidth: "100px" }}
                              title={r.numeroDocumento}
                            >
                              {r.numeroDocumento}
                            </td>
                            <td>{r.tipoDocumento}</td>
                            <td
                              className="text-truncate"
                              style={{ maxWidth: "90px" }}
                              title={r.tipoOcupacion}
                            >
                              {r.tipoOcupacion}
                            </td>
                            <td
                              className="text-truncate"
                              style={{ maxWidth: "150px" }}
                              title={r.nombreCompleto}
                            >
                              {r.nombreCompleto}
                            </td>
                            <td>{r.fechaInicio || "-"}</td>
                            
                            <td
                              className="text-truncate"
                              style={{ maxWidth: "140px" }}
                              title={r.correo}
                            >
                              {r.correo || "-"}
                            </td>
                            <td>{r.telefono || "-"}</td>
                            <td>{r.tieneNinos === 1 ? "Si" : "No"}</td>
                            <td>{r.tieneAdultoMayor === 1 ? "Si" : "No"}</td>
                            <td>{r.tieneDiscapacidad === 1 ? "Si" : "No"}</td>
                            <td>
                              {r.torre}-
                              {apartamentos.find(
                                (apt) => apt.idApartamento == r.apartamentosId
                              )?.numeroApartamento || r.aptoDisplay}
                            </td>
                            <td>
                              <Badge
                                bg={
                                  r.estado === "Activo"
                                    ? "success"
                                    : "secondary"
                                }
                                className="w-100"
                              >
                                {r.estado}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                {r.estado !== "Finalizado" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => abrirModalEditar(r)}
                                      title="Editar"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline-danger"
                                      onClick={() => finalizarResidente(r)}
                                      title="Finalizar"
                                    >
                                      <i className="bi bi-x-circle"></i>
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={() => verDetalles(r)}
                                  title="Ver detalles"
                                >
                                  <i className="bi bi-eye"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>{" "}
              {/* Cierre del table-container */}
              {/* Paginación */}
              <Paginacion />
            </>
          ) : (
            <>
           <div className="row g-4">
  {residentesPaginados.map((r, i) => (
    <div key={r.idOcupante || i} className="col-xl-3 col-lg-4 col-md-6">
      <div className="card h-100 shadow-sm border-0">

        {/* HEADER */}
        <div className="card-header bg-light d-flex justify-content-between align-items-start">
          <div className="text-truncate">
            <h6 className="mb-0 fw-bold text-truncate" title={r.nombreCompleto}>
              {r.nombreCompleto}
            </h6>
            <small className="text-muted">
              {r.tipoDocumento} · {r.numeroDocumento}
            </small>
          </div>

          <Badge bg={r.estado === "Activo" ? "success" : "secondary"}>
            {r.estado}
          </Badge>
        </div>

        {/* BODY */}
        <div className="card-body d-flex flex-column gap-2">

          <div className="small text-muted">
             Torre <strong>{r.torre}</strong> · Apto{" "}
            <strong>
              {apartamentos.find(
                (apt) => apt.idApartamento == r.apartamentosId
              )?.numeroApartamento || r.aptoDisplay}
            </strong>
          </div>

          {/* CONDICIONES */}
          <div className="d-flex flex-wrap gap-1 mt-2">
            <Badge bg={r.tieneNinos === 1 ? "primary" : "light"} text={r.tieneNinos === 1 ? "" : "dark"}>
              Niños
            </Badge>

            <Badge bg={r.tieneAdultoMayor === 1 ? "warning" : "light"} text={r.tieneAdultoMayor === 1 ? "" : "dark"}>
              Adulto Mayor
            </Badge>

            <Badge bg={r.tieneDiscapacidad === 1 ? "danger" : "light"} text={r.tieneDiscapacidad === 1 ? "" : "dark"}>
               Discapacidad
            </Badge>
          </div>

          {/* ACTIONS */}
          <div className="mt-auto d-flex gap-2 pt-3 border-top">
            {r.estado !== "Finalizado" && (
              <>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="w-100"
                  onClick={() => abrirModalEditar(r)}
                >
                  Editar
                </Button>

                <Button
                  size="sm"
                  variant="outline-danger"
                  className="w-100"
                  onClick={() => finalizarResidente(r)}
                >
                   Finalizar
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline-secondary"
              className="w-100"
              onClick={() => verDetalles(r)}
            >
               Detalles
            </Button>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>


              {/* Paginación */}
              <div className="mt-4">
                <Paginacion />
              </div>
            </>
          )}
        </div>

        {/* Modal Registrar / Editar */}
        {modalAbierto && (
          <div
            className="modal fade show"
            tabIndex="-1"
            role="dialog"
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
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    {editIndex !== null
                      ? "Editar Residente"
                      : "Registrar Residente"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Cerrar"
                    onClick={cerrarModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit} className="p-3">

                    {/* ===== DATOS DE IDENTIFICACIÓN ===== */}
                    <div className="card mb-3 shadow-sm">
                      <div className="card-header fw-bold">
                        Datos del arrendatario/propietario
                      </div>
                      <div className="card-body row g-3">

                        <div className="col-md-4">
                          <label className="form-label">Tipo Documento</label>
                          <select
                            name="tipoDocumento"
                            className="form-select"
                            value={formData.tipoDocumento}
                            onChange={handleChange}
                            required
                          >
                            <option value="CC">CC</option>
                            <option value="CE">CE</option>
                            <option value="PA">PA</option>
                            <option value="PP">PP</option>
                            <option value="PPT">PPT</option>
                          </select>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label">Número Documento</label>
                          <input
                            type="text"
                            name="numeroDocumento"
                            className="form-control"
                            value={formData.numeroDocumento}
                            onChange={handleChange}
                            required={editIndex === null}
                            disabled={editIndex !== null}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Fecha Inicio</label>
                          <input
                            type="date"
                            name="fechaInicio"
                            className="form-control"
                            value={formData.fechaInicio}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label">Torre</label>
                          <select
                            name="torreId"
                            className="form-select"
                            value={formData.torreId}
                            onChange={(e) => {
                              // actualizar torreId y limpiar apto seleccionado
                              handleChange(e);
                              setFormData((f) => ({ ...f, apto: "" }));
                            }}
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num}>
                                Torre {String.fromCharCode(64 + num)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label">Apartamento</label>
                            <select
                              name="apto"
                              className="form-select"
                              value={formData.apto}
                              onChange={handleChange}
                            >
                              <option value="">Seleccione...</option>
                              {generarAptos(formData.torreId).map((a) => (
                                <option key={a.id} value={a.id}>{a.numero}</option>
                              ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Tipo Ocupación</label>
                          <select
                            name="tipoOcupacion"
                            className="form-select"
                            value={formData.tipoOcupacion}
                            onChange={handleChange}
                          >
                            <option>Propietario</option>
                            <option>Arrendatario</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ===== DATOS PERSONALES ===== */}
                    <div className="card mb-3 shadow-sm">
                      <div className="card-header fw-bold">
                        Datos Personales
                      </div>
                      <div className="card-body row g-3">



                        <div className="col-md-6">
                          <label className="form-label">Primer Nombre</label>
                          <input
                            type="text"
                            name="primerNombre"
                            className="form-control"
                            value={formData.primerNombre}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Segundo Nombre</label>
                          <input
                            type="text"
                            name="segundoNombre"
                            className="form-control"
                            value={formData.segundoNombre}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Primer Apellido</label>
                          <input
                            type="text"
                            name="primerApellido"
                            className="form-control"
                            value={formData.primerApellido}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Segundo Apellido</label>
                          <input
                            type="text"
                            name="segundoApellido"
                            className="form-control"
                            value={formData.segundoApellido}
                            onChange={handleChange}
                          />
                        </div>

                      </div>
                    </div>
                      {/* ===== CONTACTO Y UBICACIÓN ===== */}
                  
                      <div className="card mb-3 shadow-sm">
                      <div className="card-header fw-bold">
                        Contacto 
                      </div>
                      <div className="card-body row g-3">

                        <div className="col-md-6">
                          <label className="form-label">Correo</label>
                          <input
                            type="email"
                            name="correo"
                            className="form-control"
                            value={formData.correo}
                            onChange={handleChange}
                          />
                        </div>

                      <div className="col-md-6">
                          <label className="form-label">Teléfono</label>
                          <input
                            type="text"
                            name="telefono"
                            className="form-control"
                            value={formData.telefono}
                            onChange={handleChange}
                          />
                        </div>

                      </div>
                    </div>

                    {/* ===== CONDICIÓN FAMILIAR ===== */}
                    <div className="card mb-3 shadow-sm">
                      <div className="card-header fw-bold">
                        Condición Familiar
                      </div>
                      <div className="card-body row g-3">

                        <div className="col-md-4 form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="tieneNinos"
                            checked={formData.tieneNinos === 1}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "tieneNinos",
                                  value: e.target.checked ? 1 : 0,
                                },
                              })
                            }
                          />
                          <label className="form-check-label">
                            ¿Tiene niños a cargo?
                          </label>
                        </div>

                        <div className="col-md-4 form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="tieneAdultoMayor"
                            checked={formData.tieneAdultoMayor === 1}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "tieneAdultoMayor",
                                  value: e.target.checked ? 1 : 0,
                                },
                              })
                            }
                          />
                          <label className="form-check-label">
                            ¿Tiene adulto mayor a cargo?
                          </label>
                        </div>

                        <div className="col-md-4 form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="tieneDiscapacidad"
                            checked={formData.tieneDiscapacidad === 1}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "tieneDiscapacidad",
                                  value: e.target.checked ? 1 : 0,
                                },
                              })
                            }
                          />
                          <label className="form-check-label">
                            ¿Tiene persona con discapacidad?
                          </label>
                        </div>

                      </div>
                    </div>

                  

                    {/* ===== BOTÓN ===== */}
                    <div className="text-end">
                      <button type="submit" className="btn btn-success px-4">
                        Guardar Información
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalles */}
        {showModalDetalles && residenteSeleccionado && (
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">Detalles del Residente</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModalDetalles(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    <strong>Documento:</strong>{" "}
                    {residenteSeleccionado.tipoDocumento}{" "}
                    {residenteSeleccionado.numeroDocumento}
                  </p>
                  <p>
                    <strong>Nombre:</strong>{" "}
                    {residenteSeleccionado.nombreCompleto}
                  </p>
                  <p>
                    <strong>Ocupación:</strong>{" "}
                    {residenteSeleccionado.tipoOcupacion}
                  </p>
                  <p>
                    <strong>Correo:</strong> {residenteSeleccionado.correo}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {residenteSeleccionado.telefono}
                  </p>
                  <p>
                    <strong>Torre - Apto:</strong> {residenteSeleccionado.torre}
                    -{residenteSeleccionado.apto}
                  </p>
                  <p>
                    <strong>Fecha Inicio:</strong>{" "}
                    {residenteSeleccionado.fechaInicio}
                  </p>
                  <p>
                    <strong>Fecha Fin:</strong>{" "}
                    {residenteSeleccionado.fechaFin || "-"}
                  </p>
                  <p>
                    <strong>Niños:</strong> {residenteSeleccionado.tieneNinos === 1 ? "Si" : "No"}
                  </p>
                  <p>
                    <strong>Adulto Mayor:</strong> {residenteSeleccionado.tieneAdultoMayor === 1 ? "Si" : "No"}
                  </p>
                  <p>
                    <strong>Discapacidad:</strong> {residenteSeleccionado.tieneDiscapacidad === 1 ? "Si" : "No"}
                  </p>
                  <p>
                    <strong>Estado:</strong> {residenteSeleccionado.estado}
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

export default Residentes;
