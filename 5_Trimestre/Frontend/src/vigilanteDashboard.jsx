import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Chart from "chart.js/auto";
import VisitasAdmin from "./visitasAdmin.jsx";
import Paqueteria from "./paqueteria.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./vigilanteDashboard.css";
import Visitas  from "./visitas.jsx";

function Dashboard() {
  const chartRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
            data: [7, 3],
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
  }, []);

  return (
    <div className="main-dashboard dashboard-container d-flex">
      {/* Sidebar */}
      <aside id="menuTrabajador" className="worker-menu bg-success text-white">
        <div className="p-3 d-flex flex-column h-100">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="user-circle text-dark fw-semibold bg-white">Josue</div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">Vigilante</span>
              <span className="fw-semibold text-white">Sesión activa</span>
            </div>
          </div>

          <h5 className="mb-3 mx-4">Menú del Vigilante</h5>
   
          <div className="mb-4">
            <h6 className="text-uppercase fw-bold ">
      
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z"/>
</svg> Gestión de Paquetes
            </h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li><Link className="nav-link  text-white" to="../Paqueteria?abrirModal=1">Registrar Paquete</Link></li>
              <li><Link className="nav-link text-white" to="../Paqueteria.jsx">Historial de Paquetes</Link></li>
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
</svg> Gestión de Visitas
            </h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li><Link className="nav-link text-white" to="../visitas?abrirModal=1">Registrar Visita</Link></li>
              <li><Link className="nav-link text-white" to="../visitas">Consultar Visitas</Link></li>
              <li><Link className="nav-link text-white" to="../visitas?mostrarParqueaderos=1">Consultar Parqueaderos</Link></li>
            </ul>
          </div>

          <div className="mt-auto">
            <button className="btn btn-light w-100">Cerrar sesión</button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="main-content flex-grow-1">
        {/* Barra superior */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2">
          <div className="logo-container text-center flex-grow-1">
            <Link to="/"><img src="../img/logo.png" alt="Logo del sistema" className="logo-img" /></Link>
          </div>
          <div className="position-relative">
            <div
              className=" btn btn-outline-success d-flex align-items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
  <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
</svg> Josue
            </div>
            {showUserMenu && (
              <div className="user-menu text-center">
                <p>Usuario: <strong>josmon07</strong></p>
                <hr />
                <div className="text-center">
                  <button className="btn btn-danger d-block mx-auto">Cerrar sesión</button>
                </div>
              </div>
            )}
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
            <img src="../img/paquetes.jpeg" alt="Paquetería" />
            <h5>Gestión de Paquetería</h5>
            <Link to="/Paqueteria" className="btn btn-success">➜</Link>
          </div>
          <div className="module-card">
            <img src="../img/visitas.jpg" alt="Visitas" />
            <h5>Gestión de Visitas</h5>
            <Link to="/visitas" className="btn btn-success">➜</Link>
          </div>
        </div>

        {/* Dashboard */}
       <div className="d-flex flex-wrap justify-content-center gap-4 my-4">
          <div className="dashboard-card">
            <h5>Visitas del Día</h5>
            <div className="stat-number">9</div>
            <p>Ingresos registrados hoy.</p>
            <div className="btn btn-success">
            <Link to="/VisitasAdmin">Ver Registro</Link>
          </div>
          </div>
           <div className="dashboard-card">
            <h5>Parqueaderos Ocupados</h5>
            <div className="chart-container">
              <canvas id="parqueoChart"></canvas>
            </div>
            <div className="btn btn-success">
            <Link to="/parqueaderos">Ver Estado</Link>
          </div>
          </div>

            <div className="dashboard-card">
            <h5>Paquetes Recibidos</h5>
            <div className="stat-number">8</div>
            <p>Total de paquetes que llegaron al conjunto hoy.</p>
            <div className="btn btn-success">
            <Link to="/Paqueteria">Ver Detalles</Link>
          </div>
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
    </Routes>
  );
}
