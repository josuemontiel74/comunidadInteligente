import "bootstrap/dist/css/bootstrap.min.css";

import "../Styles/AreasComunes.css";
import logo from "../../img/logo.png";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function AreasComunes() {
  const navegacion = useNavigate();
  const cerrarSesión = (e) => {
    e.preventDefault();
    localStorage.clear();
    navegacion("/");
  };
  const gestionUsuarios = (e) => {
    e.preventDefault();
    navegacion("/GestionUsuario");
  }
  const location = useLocation();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apartamentos, setApartamentos] = useState([]);
  const [areasComunes, setAreasComunes] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);

  // Funciones de manejo de token y usuario (igual que en paquetería)
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

  const nombreUsuario = obtenerUsuarioDelToken();

  const [formData, setFormData] = useState({
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
  });

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(""); // "" = todas, "registrada", "finalizada"
  const [paginaActual, setPaginaActual] = useState(1);
  const reservasPorPagina = 5;

  // Función para obtener apartamentos filtrados por torre
  const apartamentosFiltrados = apartamentos.filter((apt) => {
    if (!formData.torre) return false;

    const numeroApto = parseInt(apt.numeroApartamento);
    const torreLetra = formData.torre;

    // Mapear letras a números: A=1, B=2, C=3, etc.
    const torreNumero = torreLetra.charCodeAt(0) - 64; // A=1, B=2, C=3...

    // Definir rangos por torre
    switch (torreLetra) {
      case "A":
        return numeroApto >= 101 && numeroApto <= 109;
      case "B":
        return numeroApto >= 201 && numeroApto <= 209;
      case "C":
        return numeroApto >= 301 && numeroApto <= 309;
      case "D":
        return numeroApto >= 401 && numeroApto <= 409;
      case "E":
        return numeroApto >= 501 && numeroApto <= 509;
      case "F":
        return numeroApto >= 601 && numeroApto <= 609;
      case "G":
        return numeroApto >= 701 && numeroApto <= 709;
      case "H":
        return numeroApto >= 801 && numeroApto <= 809;
      case "I":
        return numeroApto >= 901 && numeroApto <= 909;
      case "J":
        return numeroApto >= 1001 && numeroApto <= 1009;
      default:
        return false;
    }
  });

  // Función para manejar cambio de torre
  const handleTorreChange = (e) => {
    const nuevaTorre = e.target.value;
    setFormData({
      ...formData,
      torre: nuevaTorre,
      apartamentoId: "", // Limpiar apartamento seleccionado cuando cambie la torre
    });
  };

  // Funciones para conectar con el backend
  const obtenerReservas = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/reservas-areas", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("=== DEBUG: Reservas obtenidas ===");
        console.log("Total reservas:", data.body?.length || 0);

        // Log específico para debugging de estados
        const estadosCount = {};
        data.body?.forEach((r) => {
          estadosCount[r.nombreEstado] =
            (estadosCount[r.nombreEstado] || 0) + 1;
        });
        console.log("Estados actuales:", estadosCount);

        setReservas(data.body || []);
      } else {
        console.error("Error al obtener reservas:", response.statusText);
        Swal.fire("Error", "No se pudieron cargar las reservas", "error");
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const obtenerDatosIniciales = async () => {
    try {
      // Obtener apartamentos
      try {
        const apartamentosResponse = await fetch(
          "http://localhost:3001/api/apartamentos",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (apartamentosResponse.ok) {
          const apartamentosData = await apartamentosResponse.json();
          setApartamentos(apartamentosData.body || []);
        } else {
          throw new Error("Endpoint no disponible");
        }
      } catch (error) {
        console.log("Usando datos de prueba para apartamentos");
        // Datos de prueba para apartamentos por torres
        const apartamentosPrueba = [
          // Torre A (101-109)
          { idApartamento: 1, numeroApartamento: 101, torresId: 1 },
          { idApartamento: 2, numeroApartamento: 102, torresId: 1 },
          { idApartamento: 3, numeroApartamento: 103, torresId: 1 },
          { idApartamento: 4, numeroApartamento: 104, torresId: 1 },
          { idApartamento: 5, numeroApartamento: 105, torresId: 1 },
          { idApartamento: 6, numeroApartamento: 106, torresId: 1 },
          { idApartamento: 7, numeroApartamento: 107, torresId: 1 },
          { idApartamento: 8, numeroApartamento: 108, torresId: 1 },
          { idApartamento: 9, numeroApartamento: 109, torresId: 1 },
          // Torre B (201-209)
          { idApartamento: 10, numeroApartamento: 201, torresId: 2 },
          { idApartamento: 11, numeroApartamento: 202, torresId: 2 },
          { idApartamento: 12, numeroApartamento: 203, torresId: 2 },
          { idApartamento: 13, numeroApartamento: 204, torresId: 2 },
          { idApartamento: 14, numeroApartamento: 205, torresId: 2 },
          { idApartamento: 15, numeroApartamento: 206, torresId: 2 },
          { idApartamento: 16, numeroApartamento: 207, torresId: 2 },
          { idApartamento: 17, numeroApartamento: 208, torresId: 2 },
          { idApartamento: 18, numeroApartamento: 209, torresId: 2 },
          // Torre C (301-309)
          { idApartamento: 19, numeroApartamento: 301, torresId: 3 },
          { idApartamento: 20, numeroApartamento: 302, torresId: 3 },
          { idApartamento: 21, numeroApartamento: 303, torresId: 3 },
          { idApartamento: 22, numeroApartamento: 304, torresId: 3 },
          { idApartamento: 23, numeroApartamento: 305, torresId: 3 },
          { idApartamento: 24, numeroApartamento: 306, torresId: 3 },
          { idApartamento: 25, numeroApartamento: 307, torresId: 3 },
          { idApartamento: 26, numeroApartamento: 308, torresId: 3 },
          { idApartamento: 27, numeroApartamento: 309, torresId: 3 },
          // Torre D (401-409)
          { idApartamento: 28, numeroApartamento: 401, torresId: 4 },
          { idApartamento: 29, numeroApartamento: 402, torresId: 4 },
          { idApartamento: 30, numeroApartamento: 403, torresId: 4 },
          { idApartamento: 31, numeroApartamento: 404, torresId: 4 },
          { idApartamento: 32, numeroApartamento: 405, torresId: 4 },
          { idApartamento: 33, numeroApartamento: 406, torresId: 4 },
          { idApartamento: 34, numeroApartamento: 407, torresId: 4 },
          { idApartamento: 35, numeroApartamento: 408, torresId: 4 },
          { idApartamento: 36, numeroApartamento: 409, torresId: 4 },
          // Torre E (501-509)
          { idApartamento: 37, numeroApartamento: 501, torresId: 5 },
          { idApartamento: 38, numeroApartamento: 502, torresId: 5 },
          { idApartamento: 39, numeroApartamento: 503, torresId: 5 },
          { idApartamento: 40, numeroApartamento: 504, torresId: 5 },
          { idApartamento: 41, numeroApartamento: 505, torresId: 5 },
          { idApartamento: 42, numeroApartamento: 506, torresId: 5 },
          { idApartamento: 43, numeroApartamento: 507, torresId: 5 },
          { idApartamento: 44, numeroApartamento: 508, torresId: 5 },
          { idApartamento: 45, numeroApartamento: 509, torresId: 5 },
          // Torre F (601-609)
          { idApartamento: 46, numeroApartamento: 601, torresId: 6 },
          { idApartamento: 47, numeroApartamento: 602, torresId: 6 },
          { idApartamento: 48, numeroApartamento: 603, torresId: 6 },
          { idApartamento: 49, numeroApartamento: 604, torresId: 6 },
          { idApartamento: 50, numeroApartamento: 605, torresId: 6 },
          { idApartamento: 51, numeroApartamento: 606, torresId: 6 },
          { idApartamento: 52, numeroApartamento: 607, torresId: 6 },
          { idApartamento: 53, numeroApartamento: 608, torresId: 6 },
          { idApartamento: 54, numeroApartamento: 609, torresId: 6 },
          // Torre G (701-709)
          { idApartamento: 55, numeroApartamento: 701, torresId: 7 },
          { idApartamento: 56, numeroApartamento: 702, torresId: 7 },
          { idApartamento: 57, numeroApartamento: 703, torresId: 7 },
          { idApartamento: 58, numeroApartamento: 704, torresId: 7 },
          { idApartamento: 59, numeroApartamento: 705, torresId: 7 },
          { idApartamento: 60, numeroApartamento: 706, torresId: 7 },
          { idApartamento: 61, numeroApartamento: 707, torresId: 7 },
          { idApartamento: 62, numeroApartamento: 708, torresId: 7 },
          { idApartamento: 63, numeroApartamento: 709, torresId: 7 },
          // Torre H (801-809)
          { idApartamento: 64, numeroApartamento: 801, torresId: 8 },
          { idApartamento: 65, numeroApartamento: 802, torresId: 8 },
          { idApartamento: 66, numeroApartamento: 803, torresId: 8 },
          { idApartamento: 67, numeroApartamento: 804, torresId: 8 },
          { idApartamento: 68, numeroApartamento: 805, torresId: 8 },
          { idApartamento: 69, numeroApartamento: 806, torresId: 8 },
          { idApartamento: 70, numeroApartamento: 807, torresId: 8 },
          { idApartamento: 71, numeroApartamento: 808, torresId: 8 },
          { idApartamento: 72, numeroApartamento: 809, torresId: 8 },
          // Torre I (901-909)
          { idApartamento: 73, numeroApartamento: 901, torresId: 9 },
          { idApartamento: 74, numeroApartamento: 902, torresId: 9 },
          { idApartamento: 75, numeroApartamento: 903, torresId: 9 },
          { idApartamento: 76, numeroApartamento: 904, torresId: 9 },
          { idApartamento: 77, numeroApartamento: 905, torresId: 9 },
          { idApartamento: 78, numeroApartamento: 906, torresId: 9 },
          { idApartamento: 79, numeroApartamento: 907, torresId: 9 },
          { idApartamento: 80, numeroApartamento: 908, torresId: 9 },
          { idApartamento: 81, numeroApartamento: 909, torresId: 9 },
          // Torre J (1001-1009)
          { idApartamento: 82, numeroApartamento: 1001, torresId: 10 },
          { idApartamento: 83, numeroApartamento: 1002, torresId: 10 },
          { idApartamento: 84, numeroApartamento: 1003, torresId: 10 },
          { idApartamento: 85, numeroApartamento: 1004, torresId: 10 },
          { idApartamento: 86, numeroApartamento: 1005, torresId: 10 },
          { idApartamento: 87, numeroApartamento: 1006, torresId: 10 },
          { idApartamento: 88, numeroApartamento: 1007, torresId: 10 },
          { idApartamento: 89, numeroApartamento: 1008, torresId: 10 },
          { idApartamento: 90, numeroApartamento: 1009, torresId: 10 },
        ];
        setApartamentos(apartamentosPrueba);
      }

      // Obtener áreas comunes (usando los IDs de las reservas existentes)
      setAreasComunes([
        { idAreaComun: 1, nombreArea: "Salón Comunal 1" },
        { idAreaComun: 2, nombreArea: "Salón Comunal 2" },
        { idAreaComun: 3, nombreArea: "Zona BBQ" },
      ]);

      // Tipos de documento
      setTiposDocumento([
        { tipoDocumentoId: 1, nombre: "CC" },
        { tipoDocumentoId: 2, nombre: "CE" },
        { tipoDocumentoId: 3, nombre: "PA" },
        { tipoDocumentoId: 4, nombre: "PP" },
        { tipoDocumentoId: 5, nombre: "PPT" },
      ]);
    } catch (error) {
      console.error("Error al obtener datos iniciales:", error);
    }
  };

  useEffect(() => {
    obtenerReservas();
    obtenerDatosIniciales();
  }, []);

  useEffect(() => {
    if (location.state?.abrirModal) abrirModal();
  }, [location.state]);

  const abrirModal = () => {
    setFormData({
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
    });
    setModalAbierto(true);
  };
  const cerrarModal = () => {
    setModalAbierto(false);
    setEditIndex(null);
  };
  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== DEBUG: Iniciando envío de formulario ===");
    console.log("FormData actual:", formData);

    // Validaciones
    if (!formData.aceptaReglamento) {
      Swal.fire("Error", "Debe aceptar el reglamento para continuar", "error");
      return;
    }

    // Validación de fecha (no puede ser en el pasado)
    const hoy = new Date();
    const fechaReserva = new Date(formData.fechaReserva);
    const hoyFormateado = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );
    const fechaReservaFormateada = new Date(
      fechaReserva.getFullYear(),
      fechaReserva.getMonth(),
      fechaReserva.getDate()
    );

    if (fechaReservaFormateada < hoyFormateado) {
      Swal.fire("Error", "No puedes reservar en fechas pasadas", "error");
      return;
    }

    // Validación de fecha (no más de 2 meses)
    const dosMesesDespues = new Date();
    dosMesesDespues.setMonth(dosMesesDespues.getMonth() + 2);
    if (fechaReserva > dosMesesDespues) {
      Swal.fire(
        "Error",
        "No puedes reservar con más de 2 meses de anticipación",
        "error"
      );
      return;
    }

    // Validación hora inicio < hora fin
    if (formData.horaInicio >= formData.horaFin) {
      Swal.fire(
        "Error",
        "La hora de inicio debe ser menor que la hora de fin",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      // Crear objeto para enviar al backend
      const reservaData = {
        apartamentoId: parseInt(formData.apartamentoId),
        areaComunId: parseInt(formData.areaComunId),
        fechaReserva: formData.fechaReserva,
        horaInicio: formData.horaInicio + ":00",
        horaFin: formData.horaFin + ":00",
        motivoReserva: formData.motivoReserva,
        cantidadAsistentes: formData.cantidadAsistentes, 
        invitadosExternos: formData.invitadosExternos, // Enviar como boolean
        aceptaReglamento: formData.aceptaReglamento, // Enviar como boolean
        documentoSolicitante: formData.documentoSolicitante,
        tipoDocumentoId: parseInt(formData.tipoDocumentoId),
        nombreSolicitante: formData.nombreSolicitante,
        telefonoSolicitante: formData.telefonoSolicitante,
        correoSolicitante: formData.correoSolicitante,
      };

      console.log("=== DEBUG: Datos a enviar al backend ===");
      console.log(JSON.stringify(reservaData, null, 2));
      console.log("Token:", token.substring(0, 50) + "...");

      const isEditing = editIndex !== null;
      const url = isEditing
        ? `http://localhost:3001/api/reservarAreas/${editIndex}`
        : "http://localhost:3001/api/reservarAreas";
      const method = isEditing ? "PATCH" : "POST";

      console.log(
        `=== DEBUG: ${isEditing ? "EDITANDO" : "CREANDO"} RESERVA ===`
      );
      console.log("URL:", url);
      console.log("Method:", method);

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservaData),
      });

      console.log("=== DEBUG: Respuesta del servidor ===");
      console.log("Status:", response.status);
      console.log("OK:", response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Respuesta exitosa:", responseData);
        const mensaje =
          editIndex !== null
            ? "¡Reserva editada exitosamente!"
            : "¡Reserva creada exitosamente!";
        Swal.fire({ title: mensaje, icon: "success" });

        setFormData({
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
        });

        cerrarModal();
        obtenerReservas();
      } else {
        const errorData = await response.json(); 
        console.error("Error del servidor:", errorData);

       
        const mensajeError =
          errorData.message || errorData.error || `Error ${response.status}`;
        Swal.fire("Error", mensajeError, "error");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const finalizarRegistro = async (idReserva) => {
    Swal.fire({
      title: "¿Deseas finalizar esta reserva?",
      text: "No podrás revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, finalizar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          // Finalizar la reserva usando DELETE
          const response = await fetch(
            `http://localhost:3001/api/reservarAreas/${idReserva}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const responseData = await response.text();
            console.log("=== DEBUG: DELETE EXITOSO ===");
            console.log("Respuesta del DELETE:", responseData);
            console.log("Reserva finalizada ID:", idReserva);

            Swal.fire({
              title: "¡Finalizado!",
              text: "La reserva fue finalizada",
              icon: "success",
            });

            console.log(
              "=== DEBUG: Recargando reservas después del DELETE ==="
            );
            obtenerReservas(); 
          } else {
            const errorData = await response.text();
            console.error("Error al finalizar reserva:", errorData);
            Swal.fire("Error", "No se pudo finalizar la reserva", "error");
          }
        } catch (error) {
          console.error("Error al finalizar reserva:", error);
          Swal.fire("Error", "No se pudo finalizar la reserva", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const editarReserva = (reserva) => {
  
    setFormData({
      torre: reserva.nombreTorre?.charAt(reserva.nombreTorre.length - 1) || "", 
      apartamentoId: reserva.apartamentoId,
      areaComunId: reserva.areaComunId,
      fechaReserva: reserva.fechaReserva,
      horaInicio: reserva.horaInicio?.substring(0, 5) || "", 
      horaFin: reserva.horaFin?.substring(0, 5) || "", 
      motivoReserva: reserva.motivoReserva,
      cantidadAsistentes: reserva.cantidadAsistentes,
      invitadosExternos:
        reserva.invitadosExternos === 1 || reserva.invitadosExternos === true,
      aceptaReglamento:
        reserva.aceptaReglamento === 1 || reserva.aceptaReglamento === true,
      documentoSolicitante: reserva.documentoSolicitante,
      tipoDocumentoId: reserva.tipoDocumentoId,
      nombreSolicitante: reserva.nombreSolicitante,
      telefonoSolicitante: reserva.telefonoSolicitante,
      correoSolicitante: reserva.correoSolicitante,
    });
    setEditIndex(reserva.idReservas); 
    setModalAbierto(true);
  };

  const eliminarReserva = async (idReserva) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará permanentemente la reserva",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const response = await fetch(
            `http://localhost:3001/api/reservarAreas/${idReserva}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            Swal.fire({
              title: "¡Eliminado!",
              text: "La reserva fue eliminada",
              icon: "success",
            });
            obtenerReservas(); 
          } else {
            const errorData = await response.text();
            console.error("Error al eliminar reserva:", errorData);
            Swal.fire("Error", "No se pudo eliminar la reserva", "error");
          }
        } catch (error) {
          console.error("Error al eliminar reserva:", error);
          Swal.fire("Error", "No se pudo eliminar la reserva", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const verDetalles = (registro) => {
    setRegistroSeleccionado(registro);
    setShowModalDetalles(true);
  };

 
  const reservasFiltradas = reservas
    .filter((r) => {
      
      const cumpleBusqueda =
        r.nombreArea?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.nombreSolicitante?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.documentoSolicitante?.includes(busqueda);

      
      const cumpleEstado =
        filtroEstado === "" ||
        (filtroEstado === "registrada" && r.nombreEstado !== "finalizada") ||
        (filtroEstado === "finalizada" && r.nombreEstado === "finalizada");

      return cumpleBusqueda && cumpleEstado;
    })
    .sort((a, b) => {
      
      if (a.nombreEstado === "finalizada" && b.nombreEstado !== "finalizada")
        return 1;
      if (a.nombreEstado !== "finalizada" && b.nombreEstado === "finalizada")
        return -1;
      // Si tienen el mismo estado, mantener orden original (por ID desc)
      return b.idReservas - a.idReservas;
    });

  // Paginación
  const indiceUltimo = paginaActual * reservasPorPagina;
  const indicePrimero = indiceUltimo - reservasPorPagina;
  const reservasPaginadas = reservasFiltradas.slice(
    indicePrimero,
    indiceUltimo
  );
  const totalPaginas = Math.ceil(reservasFiltradas.length / reservasPorPagina);

  return (
    <div className="container-fluid p-0">
      {/* Sidebar */}
      <aside
        id="menuTrabajador"
        className={`worker-menu bg-success text-white ${
          menuAbierto ? "active" : ""
        }`}
      >
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

          <h5 className="mb-3 mx-4">Menú {rolUsuario || "Usuario"} </h5>

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
                <Link className="nav-link text-white" onClick={abrirModal}>
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

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Usuarios</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li
                
                  className="nav-link text-white"
                 onClick={gestionUsuarios}
                  state={{ abrirModal: true }}
              
                >s
                  Registrar Usuario
                
              </li>
              <li>
                <Link className="nav-link text-white" to="/GestionUsuario">
                  Consultar Usuarios
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

          <div className="mt-auto text-center">
            <button className="btn btn-light w-100" onClick={cerrarSesión}>
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
                <button className="btn btn-danger w-100" onClick={cerrarSesión}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3 my-4">
          <h2 className="fw-bold">Gestión de Áreas Comunes</h2>
          {/* Indicadores de estado */}
          {reservas.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">
                Total: {reservas.length} |
                <span className="text-info ms-1">
                  Registradas:{" "}
                  {
                    reservas.filter((r) => r.nombreEstado !== "finalizada")
                      .length
                  }
                </span>{" "}
                |
                <span className="text-success ms-1">
                  Finalizadas:{" "}
                  {
                    reservas.filter((r) => r.nombreEstado === "finalizada")
                      .length
                  }
                </span>
                {filtroEstado && (
                  <span className="text-primary ms-2">
                    | Mostrando:{" "}
                    {filtroEstado === "registrada"
                      ? "Solo Registradas"
                      : "Solo Finalizadas"}
                  </span>
                )}
              </small>
            </div>
          )}
        </div>

        {/* Buscador + Filtros + Registrar */}
        <div className="container d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-success"
            onClick={abrirModal}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Registrar Nueva Reserva"}
          </button>

          <div className="d-flex gap-2 align-items-center">
            {/* Filtro por estado */}
            <select
              className="form-select"
              style={{ width: "180px" }}
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="registrada">Solo Registradas</option>
              <option value="finalizada">Solo Finalizadas</option>
            </select>

            {/* Buscador */}
            <input
              type="text"
              placeholder="Buscar por área, solicitante o documento"
              className="form-control"
              style={{ width: "350px" }}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>
        </div>

        {/* Tabla */}
        <div
          className="table-responsive"
          style={{ maxWidth: "85%", margin: "0 auto" }}
        >
          <table
            className="table table-bordered table-striped table-sm"
            style={{ fontSize: "0.9rem" }}
          >
            <thead className="table-success">
              <tr>
                <th style={{ width: "16%", padding: "0.5rem 0.3rem" }}>Área</th>
                <th style={{ width: "12%", padding: "0.5rem 0.3rem" }}>
                  Documento
                </th>
                <th style={{ width: "16%", padding: "0.5rem 0.3rem" }}>
                  Solicitante
                </th>
                <th style={{ width: "10%", padding: "0.5rem 0.3rem" }}>
                  Fecha
                </th>
                <th style={{ width: "8%", padding: "0.5rem 0.3rem" }}>
                  Inicio
                </th>
                <th style={{ width: "8%", padding: "0.5rem 0.3rem" }}>Fin</th>
                <th style={{ width: "6%", padding: "0.5rem 0.3rem" }}>
                  Asist.
                </th>
                <th style={{ width: "10%", padding: "0.5rem 0.3rem" }}>
                  Estado
                </th>
                <th style={{ width: "14%", padding: "0.5rem 0.3rem" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    Cargando reservas...
                  </td>
                </tr>
              ) : reservasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    No hay reservas para mostrar
                  </td>
                </tr>
              ) : (
                reservasPaginadas.map((r, index) => (
                  <tr key={r.idReservas || index}>
                    <td
                      className="text-truncate"
                      title={r.nombreArea}
                      style={{ padding: "0.5rem 0.3rem", maxWidth: "120px" }}
                    >
                      {r.nombreArea}
                    </td>
                    <td
                      className="text-truncate"
                      title={r.documentoSolicitante}
                      style={{ padding: "0.5rem 0.3rem", maxWidth: "100px" }}
                    >
                      {r.documentoSolicitante}
                    </td>
                    <td
                      className="text-truncate"
                      title={r.nombreSolicitante}
                      style={{ padding: "0.5rem 0.3rem", maxWidth: "130px" }}
                    >
                      {r.nombreSolicitante}
                    </td>
                    <td
                      style={{ padding: "0.5rem 0.3rem", fontSize: "0.85rem" }}
                    >
                      {r.fechaReserva}
                    </td>
                    <td
                      style={{ padding: "0.5rem 0.3rem", fontSize: "0.85rem" }}
                    >
                      {r.horaInicio?.substring(0, 5)}
                    </td>
                    <td
                      style={{ padding: "0.5rem 0.3rem", fontSize: "0.85rem" }}
                    >
                      {r.horaFin?.substring(0, 5)}
                    </td>
                    <td
                      className="text-center"
                      style={{ padding: "0.5rem 0.3rem" }}
                    >
                      {r.cantidadAsistentes}
                    </td>
                    <td style={{ padding: "0.6rem 0.4rem" }}>
                      {r.nombreEstado === "finalizada" ? (
                        <span
                          className="badge text-bg-success"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Finalizada
                        </span>
                      ) : r.nombreEstado === "en curso" ? (
                        <span
                          className="badge bg-warning text-dark"
                          style={{ fontSize: "0.75rem" }}
                        >
                          En Curso
                        </span>
                      ) : (
                        <span
                          className="badge bg-info text-white"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Registrada
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.4rem 0.3rem" }}>
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        {r.nombreEstado !== "finalizada" && (
                          <>
                            <button
                              className="btn btn-xs btn-outline-primary"
                              onClick={() => editarReserva(r)}
                              disabled={loading}
                              style={{
                                fontSize: "0.65rem",
                                padding: "0.15rem 0.3rem",
                                marginBottom: "0.1rem",
                              }}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-xs btn-outline-success"
                              onClick={() => finalizarRegistro(r.idReservas)}
                              disabled={loading}
                              style={{
                                fontSize: "0.65rem",
                                padding: "0.15rem 0.3rem",
                                marginBottom: "0.1rem",
                              }}
                            >
                              Finalizar
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-xs btn-outline-info"
                          onClick={() => verDetalles(r)}
                          style={{
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.3rem",
                            marginBottom: "0.1rem",
                          }}
                        >
                          Detalles
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

        {/* Modal Registrar/Editar */}
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
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    {editIndex !== null
                      ? "Editar Reserva"
                      : "Registrar Reserva"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Cerrar"
                    onClick={cerrarModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Torre *</label>
                        <select
                          name="torre"
                          className="form-select"
                          value={formData.torre}
                          onChange={handleTorreChange}
                          required
                        >
                          <option value="">Selecciona torre</option>
                          <option value="A">Torre A (101-109)</option>
                          <option value="B">Torre B (201-209)</option>
                          <option value="C">Torre C (301-309)</option>
                          <option value="D">Torre D (401-409)</option>
                          <option value="E">Torre E (501-509)</option>
                          <option value="F">Torre F (601-609)</option>
                          <option value="G">Torre G (701-709)</option>
                          <option value="H">Torre H (801-809)</option>
                          <option value="I">Torre I (901-909)</option>
                          <option value="J">Torre J (1001-1009)</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Apartamento *</label>
                        <select
                          name="apartamentoId"
                          className="form-select"
                          value={formData.apartamentoId}
                          onChange={handleChange}
                          required
                          disabled={!formData.torre}
                        >
                          <option value="">
                            {!formData.torre
                              ? "Primero selecciona una torre"
                              : "Selecciona apartamento"}
                          </option>
                          {apartamentosFiltrados.map((apt) => (
                            <option
                              key={apt.idApartamento}
                              value={apt.idApartamento}
                            >
                              Apartamento {apt.numeroApartamento}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Área Común *</label>
                        <select
                          name="areaComunId"
                          className="form-select"
                          value={formData.areaComunId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selecciona área</option>
                          {areasComunes.map((area) => (
                            <option
                              key={area.idAreaComun}
                              value={area.idAreaComun}
                            >
                              {area.nombreArea}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">
                          Tipo de Documento *
                        </label>
                        <select
                          name="tipoDocumentoId"
                          className="form-select"
                          value={formData.tipoDocumentoId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selecciona tipo</option>
                          {tiposDocumento.map((tipo) => (
                            <option
                              key={tipo.tipoDocumentoId}
                              value={tipo.tipoDocumentoId}
                            >
                              {tipo.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Número de Documento *
                        </label>
                        <input
                          type="text"
                          name="documentoSolicitante"
                          className="form-control"
                          value={formData.documentoSolicitante}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Nombre Completo del Solicitante *
                      </label>
                      <input
                        type="text"
                        name="nombreSolicitante"
                        className="form-control"
                        value={formData.nombreSolicitante}
                        onChange={handleChange}
                        placeholder="Nombre y apellidos completos"
                        required
                      />
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Teléfono *</label>
                        <input
                          type="text"
                          name="telefonoSolicitante"
                          className="form-control"
                          value={formData.telefonoSolicitante}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          name="correoSolicitante"
                          className="form-control"
                          value={formData.correoSolicitante}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Fecha Reserva *</label>
                        <input
                          type="date"
                          name="fechaReserva"
                          className="form-control"
                          value={formData.fechaReserva}
                          onChange={handleChange}
                          min={new Date().toISOString().split("T")[0]} // No permitir fechas pasadas
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Hora Inicio *</label>
                        <input
                          type="time"
                          name="horaInicio"
                          className="form-control"
                          value={formData.horaInicio}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Hora Fin *</label>
                        <input
                          type="time"
                          name="horaFin"
                          className="form-control"
                          value={formData.horaFin}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-8">
                        <label className="form-label">
                          Motivo de la Reserva *
                        </label>
                        <textarea
                          name="motivoReserva"
                          className="form-control"
                          value={formData.motivoReserva}
                          onChange={handleChange}
                          placeholder="Describe el motivo de la reserva"
                          rows="2"
                          required
                        ></textarea>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Cantidad Asistentes *
                        </label>
                        <input
                          type="number"
                          name="cantidadAsistentes"
                          className="form-control"
                          value={formData.cantidadAsistentes}
                          onChange={handleChange}
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="invitadosExternos"
                            checked={formData.invitadosExternos}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                invitadosExternos: e.target.checked,
                              })
                            }
                          />
                          <label className="form-check-label">
                            ¿Habrá invitados externos?
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="aceptaReglamento"
                            checked={formData.aceptaReglamento}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                aceptaReglamento: e.target.checked,
                              })
                            }
                            required
                          />
                          <label className="form-check-label">
                            Acepto el reglamento *
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-success w-100"
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
          </div>
        )}

        {/* Modal Detalles */}
        {showModalDetalles && registroSeleccionado && (
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
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">Detalles de la Reserva</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Cerrar"
                    onClick={() => setShowModalDetalles(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p>
                        <strong>ID Reserva:</strong>{" "}
                        {registroSeleccionado.idReservas}
                      </p>
                      <p>
                        <strong>Área:</strong> {registroSeleccionado.nombreArea}
                      </p>
                      <p>
                        <strong>Apartamento:</strong>{" "}
                        {registroSeleccionado.numeroApartamento} -{" "}
                        {registroSeleccionado.nombreTorre}
                      </p>
                      <p>
                        <strong>Documento:</strong>{" "}
                        {registroSeleccionado.documentoSolicitante}
                      </p>
                      <p>
                        <strong>Solicitante:</strong>{" "}
                        {registroSeleccionado.nombreSolicitante}
                      </p>
                      <p>
                        <strong>Teléfono:</strong>{" "}
                        {registroSeleccionado.telefonoSolicitante}
                      </p>
                      <p>
                        <strong>Correo:</strong>{" "}
                        {registroSeleccionado.correoSolicitante}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Fecha Reserva:</strong>{" "}
                        {registroSeleccionado.fechaReserva}
                      </p>
                      <p>
                        <strong>Hora Inicio:</strong>{" "}
                        {registroSeleccionado.horaInicio}
                      </p>
                      <p>
                        <strong>Hora Fin:</strong>{" "}
                        {registroSeleccionado.horaFin}
                      </p>
                      <p>
                        <strong>Motivo:</strong>{" "}
                        {registroSeleccionado.motivoReserva}
                      </p>
                      <p>
                        <strong>Cantidad Asistentes:</strong>{" "}
                        {registroSeleccionado.cantidadAsistentes}
                      </p>
                      <p>
                        <strong>Invitados Externos:</strong>{" "}
                        {registroSeleccionado.invitadosExternos ? "Sí" : "No"}
                      </p>
                      <p>
                        <strong>Estado:</strong>{" "}
                        <span
                          className={`badge ${
                            registroSeleccionado.nombreEstado === "finalizada"
                              ? "bg-success"
                              : registroSeleccionado.nombreEstado === "en curso"
                              ? "bg-warning"
                              : "bg-info"
                          }`}
                        >
                          {registroSeleccionado.nombreEstado}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AreasComunes;
