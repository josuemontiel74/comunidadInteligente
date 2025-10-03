import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "bootstrap/dist/css/bootstrap.min.css";
import "./dashboardAdmin.css";
function Dashboard() {
  const chartRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [rolUsuario, setRolUsuario] = useState("Admin");
  const navigate = useNavigate();

  const verificarTokenVencido = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000; 
      return Date.now() >= exp;
    } catch (error) {
      console.error("Error al verificar token:", error);
      return true;
    }
  };

  // Función para obtener el token
  const obtenerToken = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken");

    if (!token) {
      console.warn("No se encontró token de autenticación, usando token de desarrollo");
      return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Impvc3VlMjAyMyIsInJvbGVzSWQiOjEsImlhdCI6MTc1OTUxNTQwMCwiZXhwIjoxNzU5NTE5MDAwfQ.wKzrnUttdHRGkHnnZL1LR1amxt2ZQ4PZR85khZauShQ";
    }
    return token;
  };

  // Función para obtener usuario del token
  const obtenerUsuarioDelToken = (token) => {
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

  // Función para obtener rol del token
  const obtenerRolDelToken = (token) => {
    try {
      if (verificarTokenVencido(token)) {
        console.warn("Token vencido, usando rol por defecto...");
        return 1;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.rolesId || 1;
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return 1;
    }
  };

  // Función para convertir rolesId a nombre de rol
  const obtenerNombreRol = (rolesId) => {
    switch (rolesId) {
      case 1:
        return "SuperAdmin";
      case 2:
        return "Admin";
      case 3:
        return "Vigilante";
      default:
        return "RolNoDefinido";
    }
  };

  const cerrarSesión = (e) => {
    e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const gestionAreacomunes = () => {
    navigate("/AreasComunes");
  };

  // useEffect para cargar la información del usuario
  useEffect(() => {
    const token = obtenerToken();
    const usuario = obtenerUsuarioDelToken(token);
    const rolesId = obtenerRolDelToken(token);
    const rol = obtenerNombreRol(rolesId);

    setNombreUsuario(usuario);
    setRolUsuario(rol);
  }, []);

  // useEffect para prevenir navegación hacia atrás
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
      window.history.go(1);
    };
  }, []);

  // useEffect para crear el gráfico
  useEffect(() => {
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
            data: [7, 3],
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
  }, []);

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className="bg-success text-white"
        style={{ width: "280px", overflowY: "auto" }}
      >
        <div className="p-3 d-flex flex-column h-100">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="bg-white d-flex align-items-center justify-content-center"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
            >
              <span className="fw-bold text-success">
                {nombreUsuario?.substring(0, 2).toUpperCase() || "US"}
              </span>
            </div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">
                {nombreUsuario}
              </span>
              <span className="fw-semibold text-white">{rolUsuario}</span>
              <span className="small text-white-50">Sesión activa</span>
            </div>
          </div>

          <h5 className="mb-3 mx-4">Menú Administrador</h5>

          {/* Paquetería */}
          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión Paquetería</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/Paqueteria">
                  Registrar Paquete
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/Paqueteria">
                  Consultar Paquete
                </Link>
              </li>
            </ul>
          </div>

          {/* Visitas */}
          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Visitas</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/visitas">
                  Registrar Visita
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

          {/* Áreas Comunes */}
          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión de Áreas Comunes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <button
                  className="nav-link text-white bg-transparent border-0 text-start w-100"
                  onClick={gestionAreacomunes}
                  style={{ cursor: "pointer" }}
                >
                  Registrar Reserva
                </button>
              </li>
              <li>
                <Link className="nav-link text-white" to="/AreasComunes">
                  Consultar Eventos
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" onClick={gestionAreacomunes}>
                  Consultar Zonas
                </Link>
              </li>
            </ul>
          </div>

          {/* Residentes */}
          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">Gestión Residentes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/residentes?crear=1">
                  Crear Residente
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/residentes">
                  Consultar Residente
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-auto">
            <button className="btn btn-light w-100" onClick={cerrarSesión}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-grow-1" style={{ overflowY: "auto" }}>
        {/* Barra superior */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
          <div className="text-center flex-grow-1">
            <Link to="/">
              <img
                src="../img/logo.png"
                alt="Logo del sistema"
                style={{ maxHeight: "50px" }}
              />
            </Link>
          </div>
          <div className="position-relative">
            <button
              className="btn btn-outline-success d-flex align-items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-person-circle"
                viewBox="0 0 16 16"
              >
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path
                  fillRule="evenodd"
                  d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"
                />
              </svg>
              {nombreUsuario}
            </button>
            {showUserMenu && (
              <div
                className="position-absolute end-0 mt-2 bg-white border rounded shadow p-3"
                style={{ minWidth: "200px", zIndex: 1000 }}
              >
                <p className="mb-2">
                  Usuario: <strong>{nombreUsuario}</strong>
                </p>
                <p className="mb-2">
                  Rol: <strong>{rolUsuario}</strong>
                </p>
                <hr />
                <button onClick={cerrarSesión} className="btn btn-danger w-100">
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bienvenida */}
        <div className="text-center mt-4 mb-4">
          <h2 className="fw-bold">Bienvenido, {rolUsuario}</h2>
          <p>Selecciona el módulo que deseas gestionar en la plataforma</p>
        </div>

        {/* Tarjetas principales */}
        <div className="d-flex flex-wrap justify-content-center gap-4 px-4 mb-4">
          <div className="card text-center" style={{ width: "250px" }}>
            <img
              src="../img/paquetes.jpeg"
              className="card-img-top"
              alt="Paquetería"
              style={{ height: "150px", objectFit: "cover" }}
            />
            <div className="card-body">
              <h5 className="card-title">Gestión de Paquetería</h5>
              <Link to="/Paqueteria" className="btn btn-success">
                Acceder ➜
              </Link>
            </div>
          </div>

          <div className="card text-center" style={{ width: "250px" }}>
            <img
              src="../img/visitas.jpg"
              className="card-img-top"
              alt="Visitas"
              style={{ height: "150px", objectFit: "cover" }}
            />
            <div className="card-body">
              <h5 className="card-title">Gestión de Visitas</h5>
              <Link to="/visitas" className="btn btn-success">
                Acceder ➜
              </Link>
            </div>
          </div>

          <div className="card text-center" style={{ width: "250px" }}>
            <img
              src="../img/areascomunes.jpg"
              className="card-img-top"
              alt="Áreas Comunes"
              style={{ height: "150px", objectFit: "cover" }}
            />
            <div className="card-body">
              <h5 className="card-title">Gestión Áreas Comunes</h5>
              <Link to="/AreasComunes" className="btn btn-success">
                Acceder ➜
              </Link>
            </div>
          </div>

          <div className="card text-center" style={{ width: "250px" }}>
            <img
              src="../img/modoluresidente.jpg"
              className="card-img-top"
              alt="Residentes"
              style={{ height: "150px", objectFit: "cover" }}
            />
            <div className="card-body">
              <h5 className="card-title">Gestión Residentes</h5>
              <Link to="/residentes" className="btn btn-success">
                Acceder ➜
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard con estadísticas */}
        <div className="d-flex flex-wrap justify-content-center gap-4 px-4 mb-4">
          <div className="card text-center" style={{ width: "300px" }}>
            <div className="card-body">
              <h5 className="card-title">Visitas del Día</h5>
              <div className="display-4 text-success fw-bold">9</div>
              <p className="text-muted">Ingresos registrados hoy</p>
              <Link to="/Visitas" className="btn btn-success">
                Ver Registro
              </Link>
            </div>
          </div>

          <div className="card text-center" style={{ width: "300px" }}>
            <div className="card-body">
              <h5 className="card-title">Parqueaderos Ocupados</h5>
              <div style={{ height: "200px", position: "relative" }}>
                <canvas id="parqueoChart"></canvas>
              </div>
              <Link to="/visitas" className="btn btn-success mt-3">
                Ver Estado
              </Link>
            </div>
          </div>

          <div className="card text-center" style={{ width: "300px" }}>
            <div className="card-body">
              <h5 className="card-title">Paquetes Recibidos</h5>
              <div className="display-4 text-success fw-bold">8</div>
              <p className="text-muted">Total de paquetes que llegaron hoy</p>
              <Link to="/Paqueteria" className="btn btn-success">
                Ver Detalles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;