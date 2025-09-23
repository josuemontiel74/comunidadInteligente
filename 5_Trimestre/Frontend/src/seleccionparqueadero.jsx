import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./vigilanteDashboard.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function SeleccioneParqueadero() {
  const [parqueaderos] = useState([
    { id: "A01", estado: "libre" },
    { id: "A02", estado: "ocupado" },
    { id: "A03", estado: "ocupado" },
    { id: "B01", estado: "ocupado" },
    { id: "B02", estado: "libre" },
    { id: "B03", estado: "ocupado" },
    { id: "B04", estado: "ocupado" },
    { id: "B05", estado: "libre" },
    { id: "B06", estado: "ocupado" },
    { id: "B07", estado: "ocupado" },
    { id: "B08", estado: "libre" },
    { id: "B09", estado: "ocupado" },
    { id: "B10", estado: "ocupado" },
    { id: "B11", estado: "libre" },
    { id: "B12", estado: "ocupado" },
    { id: "B13", estado: "ocupado" },
    { id: "B14", estado: "libre" },
    { id: "B15", estado: "ocupado" },
    { id: "B16", estado: "ocupado" },
    { id: "B17", estado: "libre" },
    { id: "B18", estado: "ocupado" },
    { id: "B19", estado: "ocupado" },
    { id: "B20", estado: "libre" },
    { id: "B21", estado: "ocupado" },
    { id: "B22", estado: "ocupado" },
    { id: "B23", estado: "libre" },
    { id: "B24", estado: "ocupado" },
    { id: "B25", estado: "ocupado" },
    { id: "B26", estado: "libre" },
    { id: "B27", estado: "ocupado" },
    { id: "B28", estado: "ocupado" },
    { id: "B29", estado: "ocupado" },
    { id: "B30", estado: "libre" },
    { id: "B31", estado: "ocupado" },
    { id: "B32", estado: "ocupado" },
    { id: "B33", estado: "ocupado" },
  ]);

  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  const asignar = () => {
    console.log("Asignar llamado para: ", slotSeleccionado);
  };

  return (
    <div className="container-fluid p-0">
      {/* 🔹 Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-success"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#sidebarLateral"
            aria-controls="sidebarLateral"
          >
            ☰
          </button>
        </div>

        <div className="logo-container text-center flex-grow-1">
          <img src="/img/logo.png" alt="Logo del sistema" className="logo-img" />
        </div>

        <div className="d-flex align-items-center gap-3 px-3">
          <div className="dropdown">
            <button
              className="user-circle text-white fw-semibold border-0 bg-success"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ cursor: "pointer" }}
            >
              l
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <span className="dropdown-item-text">
                  Usuario: <strong>josmon07</strong>
                </span>
              </li>
              <li>
                <Link className="dropdown-item text-danger" to="#">
                  Cerrar sesión
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🔹 Sidebar Offcanvas - Estructura corregida para Bootstrap */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="sidebarLateral"
        aria-labelledby="sidebarLateralLabel"
      >
        {/* 🔹 Offcanvas Header */}
        <div className="offcanvas-header bg-success text-white">
          <h5 className="offcanvas-title" id="sidebarLateralLabel">
            Menú del Vigilante
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Cerrar"
          ></button>
        </div>

        {/* 🔹 Offcanvas Body */}
        <div className="offcanvas-body p-0">
          <div className="worker-menu bg-success text-white h-100">
            <div className="p-3 d-flex flex-column h-100">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="user-circle text-dark fw-semibold bg-white">Josue</div>
                <div className="d-flex flex-column">
                  <span className="fw-semibold text-white">Vigilante</span>
                  <span className="fw-semibold text-white">Sesión activa</span>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-uppercase fw-bold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-box-seam-fill"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z"
                    />
                  </svg>{" "}
                  Gestión de Paquetes
                </h6>
                <ul className="nav flex-column mt-2 gap-2">
                  <li>
                    <Link className="nav-link text-white" to="../Paqueteria?abrirModal=1">
                      Registrar Paquete
                    </Link>
                  </li>
                  <li>
                    <Link className="nav-link text-white" to="../Paqueteria.jsx">
                      Historial de Paquetes
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h6 className="text-uppercase fw-bold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-people-fill"
                    viewBox="0 0 16 16"
                  >
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
                  </svg>{" "}
                  Gestión de Visitas
                </h6>
                <ul className="nav flex-column mt-2 gap-2">
                  <li>
                    <Link className="nav-link text-white" to="../visitas?abrirModal=1">
                      Registrar Visita
                    </Link>
                  </li>
                  <li>
                    <Link className="nav-link text-white" to="../visitas">
                      Consultar Visitas
                    </Link>
                  </li>
                  <li>
                    <Link className="nav-link text-white" to="../visitas?mostrarParqueaderos=1">
                      Consultar Parqueaderos
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mt-auto">
                <button className="btn btn-light w-100">Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Título */}
      <div className="text-center mt-3">
        <h2 className="fw-bold">Gestión de Parqueaderos</h2>

        {/* 🔹 Leyenda */}
        <div className="container mt-4">
          <div className="d-flex gap-4 mb-3">
            <span>
              <img src="/img/carro-verde.svg" width="30" alt="Libre" /> Libre
            </span>
            <span>
              <img src="/img/carro-rojo.svg" width="30" alt="Ocupado" /> Ocupado
            </span>
          </div>

          {/* 🔹 Buscador */}
          <div className="mb-3 d-flex gap-2">
            <input
              type="text"
              className="form-control"
              id="busquedaParqueo"
              placeholder="🔍 Buscar espacio..."
            />
            <select
              id="filtroEstado"
              className="form-select"
              style={{ maxWidth: "180px" }}
            >
              <option value="todos">Todos</option>
              <option value="libre">Libres</option>
              <option value="ocupado">Ocupados</option>
            </select>
          </div>

          {/* 🔹 Tarjetas de parqueaderos */}
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
            {parqueaderos.map((p) => (
              <div key={p.id} className="col">
                <div
                  className="card text-center p-3"
                  data-bs-toggle="modal"
                  data-bs-target="#modalConfirmar"
                  onClick={() => setSlotSeleccionado(p.id)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={
                      p.estado === "libre"
                        ? "/img/carro-verde.svg"
                        : "/img/carro-rojo.svg"
                    }
                    width="35"
                    alt={p.estado}
                  />
                  <p className="fw-bold">{p.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔹 Modal Confirmar */}
      <div
        className="modal fade"
        id="modalConfirmar"
        tabIndex="-1"
        aria-labelledby="modalConfirmarLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalConfirmarLabel">
                Confirmar asignación
              </h5>
              <button
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Cerrar"
              ></button>
            </div>
            <div className="modal-body">
              ¿Asignar el espacio{" "}
              <span id="slotSeleccionado" className="fw-bold">
                {slotSeleccionado}
              </span>{" "}
              al visitante?
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button className="btn btn-success" onClick={asignar}>
                Asignar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Modal Reserva */}
      <div
        className="modal fade"
        id="modalReserva"
        tabIndex="-1"
        aria-labelledby="modalReservaLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title" id="modalReservaLabel">
                Reservar Parqueadero
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Cerrar"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Espacio:</strong>{" "}
                <span id="reservaEspacio">{slotSeleccionado}</span>
              </p>
              <p>
                <strong>Tipo de vehículo:</strong> Carro
              </p>
              <p>
                <strong>Correo electrónico:</strong>
                <input
                  type="email"
                  id="correoReserva"
                  className="form-control"
                  placeholder="usuario@email.com"
                />
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-success" id="btnConfirmarReserva">
                Imprimir Recibo y Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeleccioneParqueadero;
