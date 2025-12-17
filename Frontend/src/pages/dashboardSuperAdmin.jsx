import React, { useEffect, useRef, useState } from "react";
import Swal from 'sweetalert2';
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "../Styles/dashboardSuperAdmin.css";
import logo from "../../img/logo.png";
import paquetesImg from "../../img/paquetes.jpeg";
import visitasImg from "../../img/visitas.jpg";
import areasImg from "../../img/areascomunes.jpg";
import gestionImg from "../../img/gestion.webp";
import residentesImg from "../../img/residentes.jpg";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { visitasDia } from "../services/visitas.services";
import { paquetesDia } from "../services/paqueteria.services";
import { obtenerParqueaderos } from "../services/parqueadero.services.jsx";

const API_URL = 'http://localhost:3001';

function Dashboard() {
  const navigator = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Sesión expirada', 
        text: 'La sesión expiró. Vuelva a iniciar sesión.', 
        timer: 2000, 
        showConfirmButton: false, 
        timerProgressBar: true 
      }).then(() => {
        localStorage.clear();
        navigator('/');
      });
    }
  }, [navigator]);

  const chartRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [totalVisitas, setTotalVisitas] = useState(0);
  const [totalPaquetes, setTotalPaquetes] = useState(0);
  const [parqueaderos, setParqueaderos] = useState([]);

  // Obtener parqueaderos
  useEffect(() => {
    async function fetchParqueaderos() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await obtenerParqueaderos(token);
        const data = await res.json();
        console.log("🚗 Parqueaderos:", data);
        setParqueaderos(data.body);
      } catch (error) {
        console.error("❌ Error cargando parqueaderos:", error);
      }
    }

    fetchParqueaderos();
  }, []);

  const espaciosLibres = parqueaderos.filter((p) => p.estadoId === 4).length;
  const espaciosOcupados = parqueaderos.filter((p) => p.estadoId === 3).length;

  // Visitas del día
  useEffect(() => {
    async function fetchVisitas() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        console.log("👥 Fetching visitas del día...");
        const res = await visitasDia(token);
        const data = await res.json();
        console.log("👥 Respuesta visitas:", data);
        
        // Intentar múltiples formas de acceder al dato
        const visitas = data.visitasDia || data.total || data.count || data.data?.visitasDia || 0;
        setTotalVisitas(visitas);
        console.log("✅ Visitas seteadas:", visitas);
      } catch (error) {
        console.error("❌ Error cargando visitas del día:", error);
        setTotalVisitas(0);
      }
    }
    fetchVisitas();
  }, []);

  // Paquetes del día
  useEffect(() => {
    async function fetchPaquetesDia() {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        console.log("📦 Fetching paquetes del día...");
        const res = await paquetesDia(token);
        const data = await res.json();
        console.log("📦 Respuesta paquetes:", data);
        
        // Intentar múltiples formas de acceder al dato
        const paquetes = data.paqueteDia || data.total || data.count || data.data?.paqueteDia || 0;
        setTotalPaquetes(paquetes);
        console.log("✅ Paquetes seteados:", paquetes);
      } catch (error) {
        console.error("❌ Error cargando paquetes del día:", error);
        setTotalPaquetes(0);
      }
    }
    fetchPaquetesDia();
  }, []);

  const cerrarSesión = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigator("/");
  };

  const GestionUsuarios = () => {
    navigator("/GestionUsuario");
  };

  const AreasComunes = () => {
    navigator("/AreasComunes");
  };

  // Token / roles helpers
  const verificarTokenVencidoLocal = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch (err) {
      return true;
    }
  };

  const tokenLocal = localStorage.getItem('token');
  const tokenValidoLocal = tokenLocal && !verificarTokenVencidoLocal(tokenLocal);
  
  const obtenerRolFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.rolesId;
    } catch (err) {
      return null;
    }
  };
  
  const rolesIdLocal = tokenLocal ? obtenerRolFromToken(tokenLocal) : null;
  const showUserManagementLocal = tokenValidoLocal && rolesIdLocal === 1; // solo SuperAdmin
  const showAreasComunesLocal = tokenValidoLocal && rolesIdLocal !== 3; // ocultar para Vigilante

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userGuardado = localStorage.getItem("user");

    if (!token) {
      navigator("/");
      return;
    }

    if (userGuardado) {
      try {
        const usuarioParsed = JSON.parse(userGuardado);
        console.log("=== USUARIO DESDE LOCALSTORAGE ===");
        console.log("Usuario completo:", usuarioParsed);
        console.log("Username:", usuarioParsed.username);

        setUsuario(usuarioParsed);
        setLoading(false);
      } catch (error) {
        console.error("Error parseando usuario:", error);
        localStorage.clear();
        navigator("/");
      }
    } else {
      fetch(`${API_URL}/api/usuario`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("No autorizado");
          }
          return res.json();
        })
        .then((data) => {
          console.log("=== USUARIO DESDE API ===");
          console.log("Data completo:", data);
          console.log("Data.usuario:", data.usuario);
          console.log("========================");

          setUsuario(data.usuario);
          localStorage.setItem("user", JSON.stringify(data.usuario));
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          localStorage.clear();
          navigator("/");
        });
    }
  }, [navigator]);

  useEffect(() => {
    if (loading) return;

    const ctx = document.getElementById("parqueoChart");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Ocupados", "Disponibles"],
        datasets: [
          {
            data: [espaciosOcupados, espaciosLibres],
            backgroundColor: ["#dc3545", "#198754"],
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

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [parqueaderos, loading, espaciosOcupados, espaciosLibres]);

  if (loading) {
    return <h2 className="text-center text-success mt-5">Verificando sesión...</h2>;
  }

  return (
    <div className="main-dashboard dashboard-container d-flex">
      <aside id="menuTrabajador" className="worker-menu bg-success text-white">
        <div className="p-3 d-flex flex-column h-100">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="user-circle bg-white d-flex align-items-center justify-content-center"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}>
              <span className="fw-bold text-success">
                {usuario?.username?.substring(0, 2).toUpperCase() || "US"}
              </span>
            </div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">
                {usuario?.username || usuario?.nombre || usuario?.user || "Usuario"}
              </span>
              <span className="fw-semibold text-white">Super Admin</span>
              <span className="small text-white-50">Sesión activa</span>
            </div>
          </div>

          <h5 className="mb-3 mx-4">Menú Super Admin</h5>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Paquetes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/Paqueteria" state={{ abrirModal: true }}>
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
                <Link className="nav-link text-white" to="/visitas" state={{ abrirModal: true }}>
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

          {showAreasComunesLocal && (
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
          )}

          {showUserManagementLocal && (
            <div className="mb-4">
              <h6 className="text-uppercase fw-bold">Gestión de Usuarios</h6>
              <ul className="nav flex-column mt-2 gap-2">
                <li>
                  <Link className="nav-link text-white" to="/GestionUsuario" state={{ abrirModal: true }}>
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

          <div className="mt-auto text-center logout-container">
            <button onClick={cerrarSesión} className="btn btn-light w-100">
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content flex-grow-1">
        <div className="container-md d-flex align-items-center justify-content-between px-3 py-2">
          <div className="logo-container text-center flex-grow-1">
            <Link to="/Superadmin">
              <img src={logo} alt="Logo del sistema" className="logo-img" />
            </Link>
          </div>
          <div className="position-relative">
            <div
              className="btn btn-outline-success d-flex align-items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}
            >
              {usuario?.username || usuario?.nombre || "Usuario"}
            </div>
            {showUserMenu && (
              <div className="user-menu text-center">
                <p>
                  Usuario: <strong>{usuario?.username || usuario?.nombre || "Usuario"}</strong>
                </p>
                <p>
                  Rol: <strong>Super Admin</strong>
                </p>
                <hr />
                <div className="text-center">
                  <button onClick={cerrarSesión} className="btn btn-danger d-block mx-auto">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3 my-4">
          <h2 className="fw-bold">Bienvenido, {usuario?.username}</h2>
          <p>Selecciona el módulo que deseas gestionar en la plataforma</p>
        </div>

        <div className="d-flex flex-wrap justify-content-center gap-4 my-4">
          <div className="module-card">
            <img src={paquetesImg} alt="Paquetería" />
            <h5>Gestión de Paquetería</h5>
            <Link to="/Paqueteria" className="btn btn-success">
              ➜
            </Link>
          </div>
          <div className="module-card">
            <img src={visitasImg} alt="Visitas" />
            <h5>Gestión de Visitas</h5>
            <Link to="/visitas" className="btn btn-success">
              ➜
            </Link>
          </div>
          {showAreasComunesLocal && (
            <div className="module-card">
              <img src={areasImg} alt="Áreas Comunes" />
              <h5>Áreas Comunes</h5>
              <button onClick={AreasComunes} className="btn btn-success">
                ➜
              </button>
            </div>
          )}
          {showUserManagementLocal && (
            <div className="module-card">
              <img src={gestionImg} alt="Usuarios" />
              <h5>Gestión De Usuarios</h5>
              <button onClick={GestionUsuarios} className="btn btn-success">
                ➜
              </button>
            </div>
          )}
          <div className="module-card">
            <img src={residentesImg} alt="Residentes" />
            <h5>Gestión Residentes</h5>
            <Link to="/Residentes" className="btn btn-success">
              ➜
            </Link>
          </div>
          <div className="module-card">
            <i className="bi bi-file-earmark-text" style={{ fontSize: "80px" }}></i>
            <h5>Gestión de Reportes</h5>
            <Link to="/Reportes" className="btn btn-success">
              ➜
            </Link>
          </div>
        </div>

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

export default Dashboard;