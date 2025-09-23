import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";


export default function Visitas() {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Inicializar gráfico
  useEffect(() => {
    const ctx = document.getElementById("parqueoChart")?.getContext("2d");
    if (ctx) {
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Ocupados", "Libres"],
          datasets: [
            {
              data: [26, 7],
              backgroundColor: ["#dc3545", "#28a745"],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
  }, []);

  // Toggle menú lateral
  useEffect(() => {
    const toggle = document.getElementById("menuToggle");
    const close = document.getElementById("closeMenu");
    const menu = document.getElementById("menuTrabajador");

    const openMenu = () => menu.classList.toggle("active");
    const closeMenu = () => menu.classList.remove("active");

    toggle?.addEventListener("click", openMenu);
    close?.addEventListener("click", closeMenu);

    return () => {
      toggle?.removeEventListener("click", openMenu);
      close?.removeEventListener("click", closeMenu);
    };
  }, []);

  return (
    <div className="container-fluid p-0 dashboard-container d-flex">
      {/* =============== SIDEBAR =============== */}
      <aside id="menuTrabajador" className="worker-menu bg-success text-white">
        <div className="p-3 d-flex flex-column h-100">
          <button
            id="closeMenu"
            className="btn-close btn-close-white ms-auto mb-3"
            aria-label="Cerrar"
          ></button>

          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="user-circle text-dark fw-semibold bg-white">Josue</div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-white">Vigilante</span>
              <span className="fw-semibold text-white">Sesión activa</span>
            </div>
          </div>

          <h5 className="mb-3">Menú del Vigilante</h5>

          <div className="mb-4">
            <h6 className="text-uppercase fw-bold">📦 Gestión de Paquetes</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/Paqueteria?abrirModal=1">
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
            <h6 className="text-uppercase fw-bold">📋 Gestión de Visitas</h6>
            <ul className="nav flex-column mt-2 gap-2">
              <li>
                <Link className="nav-link text-white" to="/visitas?abrirModal=1">
                  Registrar Visita
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/visitas">
                  Consultar Visitas
                </Link>
              </li>
              <li>
                <Link className="nav-link text-white" to="/visitas?mostrarParqueaderos=1">
                  Consultar Parqueaderos
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-auto">
            <button className="btn btn-light w-100">Cerrar sesión</button>
          </div>
        </div>
      </aside>

      {/* =============== CONTENIDO =============== */}
      <div className="flex-grow-1">
        {/* HEADER */}
        <header className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
          <div className="d-flex align-items-center">
            <button id="menuToggle" className="btn text-dark fs-4 border-0 m-0 px-3">
              ☰
            </button>
          </div>

          <div className="logo-container text-center flex-grow-1">
            <a href="#">
              <img src="/img/logo.png" alt="Logo del sistema" className="logo-img" />
            </a>
          </div>

          {/* BOTÓN USUARIO */}
          <div className="position-relative px-3">
            <div
              className="btn btn-outline-success d-flex align-items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-person-circle fs-5"></i>
              <span className="fw-semibold">Josue</span>
            </div>

            {showUserMenu && (
              <ul
                className="dropdown-menu dropdown-menu-end mt-2 show"
                style={{ display: "block", position: "absolute" }}
              >
                <li className="dropdown-item-text">
                  Usuario: <strong>josmon07</strong>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger">Cerrar sesión</button>
                </li>
              </ul>
            )}
          </div>
        </header>

        <div className="text-center mt-3">
          <h2 className="fw-bold">Gestión de Visitantes</h2>
        </div>

        {/* TABLA */}
        <section className="container mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold text-success">📋 Historial de Visitas</h3>
            <div className="d-flex gap-2">
              <button className="btn btn-success" id="btnRegistrarVisita">
                Registrar Nueva Visita
              </button>
              <button type="button" className="btn btn-outline-primary" id="btnMostrarParqueaderos">
                Mostrar Parqueaderos
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table id="tablaVisitas" className="table table-bordered table-striped">
              <thead className="table-success">
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Destino</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Lina Morales</td>
                  <td>1054896230</td>
                  <td>Torre C - 303</td>
                  <td>2025-07-10 14:02</td>
                  <td>2025-07-10 15:18</td>
                  <td><i className="bi bi-car-front-fill text-primary fs-5"></i></td>
                  <td><span className="badge bg-secondary">Finalizada</span></td>
                  <td><button className="btn btn-sm btn-outline-warning">Editar</button></td>
                </tr>
                <tr>
                  <td>Samuel Ruiz</td>
                  <td>1002938475</td>
                  <td>Torre F - 105</td>
                  <td>2025-07-10 09:21</td>
                  <td>–</td>
                  <td><i className="bi bi-x-lg text-danger fs-5"></i></td>
                  <td><span className="badge bg-warning text-dark">En proceso</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning">Editar</button>
                    <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
