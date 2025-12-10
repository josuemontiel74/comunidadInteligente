import React, { useEffect, useRef, useState } from "react";
import Swal from 'sweetalert2';
import { Routes, Route, Link, useNavigate, Outlet } from "react-router-dom";
import Chart from "chart.js/auto";
import VisitasAdmin from "./visitasAdmin.jsx";
import Paqueteria from "./paqueteria.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Styles/vigilanteDashboard.css";
import logo from "../../img/logo.png";
import paquetesImg from "../../img/paquetes.jpeg";
import visitasImg from "../../img/visitas.jpg";
import Visitas from "./visitas.jsx";
import Paqueadero from "./seleccionparqueadero.jsx";
import Login from "./login.jsx";
import { visitasDia } from "../services/visitas.services";
import { paquetesDia } from "../services/paqueteria.services";
import { obtenerParqueaderos } from "../services/parqueadero.services.jsx";
function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 2000, showConfirmButton: false, timerProgressBar: true }).then(() => {
        localStorage.clear();
        navigate('/');
      });
    }
  }, [navigate]);
  const CERRAR = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/");
  };
  useEffect(() => {
      async function fetchParqueaderos() {
        const token = localStorage.getItem("token");
        if (!token) return;
  
        try {
          const res = await obtenerParqueaderos(token);
          const data = await res.json();
  
          console.log(data);
  
          setParqueaderos(data.body);
        } catch (error) {
          console.error("Error cargando parqueaderos:", error);
        }
      }
  
      fetchParqueaderos();
    }, []);
   useEffect(() => {
      async function fecthpaquetesDia() {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
          const res = await paquetesDia(token);
          const data = await res.json();
          setTotalPaquetes(data.paqueteDia)
        } catch (error) {
          console.error("No se cargaron los datos")
        }
  
      }
      fecthpaquetesDia();
    }, []);
   useEffect(() => {
        async function fetchVisitas() {
          const token = localStorage.getItem("token");
          if (!token) return;
    
          try {
            const res = await visitasDia(token);
            const data = await res.json();
            setTotalVisitas(data.visitasDia);
          } catch (error) {
            console.error("Error cargando visitas del día:", error);
          }
        }
        fetchVisitas();
      }, []);
  const [totalVisitas, setTotalVisitas] = useState(0);
  const [totalPaquetes, setTotalPaquetes] = useState(0);

  const [parqueaderos, setParqueaderos] = useState([]);
   const espaciosLibres = parqueaderos.filter((p) => p.estadoId === 4).length;
  const espaciosOcupados = parqueaderos.filter((p) => p.estadoId === 3).length;
  const chartRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
  useEffect(() => {
    const ctx = document.getElementById("parqueoChart");

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Ocupados", "Disponibles"],
        datasets: [
          {
            data: [espaciosLibres, espaciosOcupados],
            backgroundColor: ["#dc3545", "#198754"], // rojo y verde
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }, [parqueaderos]);

  return (
    <div className="main-dashboard dashboard-container d-flex">
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

          

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold ">

              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z" />
              </svg> Gestión de Paquetes
            </h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li><Link className="nav-link  text-white" to="/Paqueteria" state={{ abrirModal: true }}>Registrar Paquete</Link></li>
              <li><Link className="nav-link text-white" to="/Paqueteria">Historial de Paquetes</Link></li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
                <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
              </svg> Gestión de Visitas
            </h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li><Link className="nav-link text-white" to="/visitas" state={{ abrirModal: true }}>Registrar Visita</Link></li>
              <li><Link className="nav-link text-white" to="/visitas">Consultar Visitas</Link></li>
              <li><Link className="nav-link text-white" to="/parqueaderos">Consultar Parqueaderos</Link></li>
            </ul>
          </div>

          <div className="mt-auto">
            <div onClick={CERRAR} className="btn btn-light w-100">Cerrar sesión</div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="main-content flex-grow-1">
        {/* Barra superior */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2">
          <div className="logo-container text-center flex-grow-1">
            <Link to="/"><img src={logo} alt="Logo del sistema" className="logo-img" /></Link>
          </div>
        
        </div>

        {/* Bienvenida */}
        <div className="text-center mt-3 my-4">
          <h2 className="fw-bold ">Bienvenido, Vigilante</h2>
          <p>Selecciona el módulo que deseas gestionar en la plataforma</p>
        </div>

        {/* Tarjetas principales */}
        <div className="d-flex flex-wrap justify-content-center gap-4 my-4">
          <div className="module-card">
            <img src={paquetesImg} alt="Paquetería" />
            <h5>Gestión de Paquetería</h5>
            <Link to="/Paqueteria" className="btn btn-success">➜</Link>
          </div>
          <div className="module-card">
            <img src={visitasImg} alt="Visitas" />
            <h5>Gestión de Visitas</h5>
            <Link to="/visitas" className="btn btn-success">➜</Link>
          </div>
        </div>

        {/* Dashboard */}
        <div className="d-flex flex-wrap justify-content-center gap-4 my-4">
              <div className="dashboard-card">
                <h5>Visitas del Día</h5>
                <div className="stat-number">{totalVisitas}</div>
                <p>Ingresos registrados hoy.</p>
                <Link to="/visitas" className="btn btn-success">
                  Ver Registro
                </Link>
              </div>
    
              <div className="dashboard-card">
                <h5>Parqueaderos Ocupados</h5>
                <div className="chart-container">
                  <canvas id="parqueoChart"></canvas>
                </div>
                <Link to="/parqueaderos" className="btn btn-success">
                  Ver Estado
                </Link>
              </div>
              <div className="dashboard-card">
                <h5>Paquetes Recibidos</h5>
                <div className="stat-number">{totalPaquetes}</div>
                <p>Total de paquetes que llegaron al conjunto hoy.</p>
                <Link to="/Paqueteria" className="btn btn-success">
                  Ver Detalles
                </Link>
              </div>
            </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/VisitasAdmin" element={<VisitasAdmin />} />
      <Route path="/Paqueteria" element={<Paqueteria />} />
      <Route path="/visitas" element={<Visitas />} />
      <Route path="/parqueaderos" element={<Paqueadero />} />
      <Route path="/Login" element={<Login />} />
    </Routes>
  );
}
