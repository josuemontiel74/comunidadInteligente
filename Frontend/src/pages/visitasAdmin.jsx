import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../Styles/styles.css';
import logo from '../../img/logo.png';
import moto from '../../img/moto.png';
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

function VisitasAdmin() {
   const navigator = useNavigate();
   useEffect(() => {
     const token = localStorage.getItem("token");
     if (!token) {
      Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 3500, showConfirmButton: false, timerProgressBar: true }).then(() => {
        localStorage.clear();
        navigator('/');
      });
     }
   }, [navigator]);
    const  cerrarSesión = (s) =>{
      localStorage.clear(); 
      s.preventDefault();
      navigator("/");
    };
  return (
    <div className="container-fluid p-0">
      {/* Navbar */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2">
        <div className="d-flex align-items-center">
          <button id="menuToggle" className="btn text-dark fs-4 border-0 m-0 px-3">☰</button>
        </div>
        <div className="logo-container text-center flex-grow-1">
          <Link to="/">
            <img src={logo} alt="Logo del sistema" className="logo-img" />
          </Link>
        </div>
        <div className="d-flex align-items-center gap-3 px-3">
          <div className="dropdown">
            <button
              className="user-circle text-white fw-semibold border-0 bg-success"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ cursor: 'pointer' }}
            >
              Admin
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <span className="dropdown-item-text">
                  Usuario: <strong>admin</strong>
                </span>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="btn btn-light w-100" onClick={cerrarSesión}>Cerrar sesión</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="text-center mt-3">
        <h2 className="fw-bold">Gestión de Visitantes</h2>
      </div>

  
        <td><img src={moto} alt="Moto" width="24" height="24" title="Motocicleta"/></td>
          <div className="p-3 d-flex flex-column h-100">
            <button
          id="closeMenu"
          className="btn-close btn-close-white ms-auto mb-3"
          aria-label="Cerrar"
            ></button>

            <div className="d-flex align-items-center gap-3 mb-4">
          <div className="user-circle text-dark fw-semibold bg-white">Admin</div>
          <div className="d-flex flex-column">
            <span className="fw-semibold text-white">Administrador</span>
            <span className="fw-semibold text-white">Sesión activa</span>
          </div>
        <td><img src={moto} alt="Moto" width="24" height="24" title="Motocicleta"/></td>

            <div className="mb-4">
          <h6 className="text-uppercase fw-bold">🏠 Inicio</h6>
          <ul className="nav flex-column">
            <li>
              <p className="nav-link text-white">
            Inicio
              </p>
            </li>
          </ul>
            </div>

            <div className="mb-4">
          <h6 className="text-uppercase fw-bold">📦 Gestión de Paquetes</h6>
          <ul className="nav flex-column mt-2 gap-2">
            <li>
              <p
            className="nav-link text-white"
              >
            Registrar Paquete
              </p>
            </li>
            <li>
              <p className="nav-link text-white">
            Historial de Paquetes
              </p>
            </li>
          </ul>
            </div>

            <div className="mb-4">
          <h6 className="text-uppercase fw-bold">📋 Gestión de Visitas</h6>
          <ul className="nav flex-column mt-2 gap-2">
            <li>
              <p
            className="nav-link text-white"
              >
            Registrar Visita
              </p>
            </li>
            <li>
              <p className="nav-link text-white">
            Consultar Visitas
              </p>
            </li>
            <li>
              <p>va algo no recuerdo</p>
            </li>
          </ul>
            </div>

            <div className="mb-4">
          <h6 className="text-uppercase fw-bold">🏢 Áreas Comunes</h6>
          <ul className="nav flex-column mt-2 gap-2">
            <li>
              <p>va algo pero no recuerdo </p>
            </li>
            <li>
              <p>va algo pero no recuerdo</p>
            </li>
          </ul>
            </div>

            <div className="mb-4">
          <h6 className="text-uppercase fw-bold">👥 Residentes</h6>
          <ul className="nav flex-column mt-2 gap-2">
            <li>
              <p> va algo no recuerdo</p>
            </li>
            <li>
              <p> va algo no recuerdo </p>
            </li>
          </ul>
            </div>

            <div className="mt-auto">
           <button className="btn btn-light w-100" onClick={cerrarSesión}>
              Cerrar sesión
            </button>
            </div>
          </div>
        </div>

    
      
<section class="container mt-4">
  <div class="d-flex justify-content-between align-items-center mb-3">
  <h3 class="fw-bold text-success">📋 Historial de Visitas</h3>

  <div class="d-flex gap-2">
    <button class="btn btn-success" id="btnRegistrarVisita">
  Registrar Nueva Visita
</button>
    <button type="button" class="btn btn-outline-primary" id="btnMostrarParqueaderos">
  Mostrar Parqueaderos
</button>
  </div>
</div>

  <div class="table-responsive">
    <table id="tablaVisitas" class="table table-bordered table-striped">
      <thead class="table-success">
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
          <td><i class="bi bi-car-front-fill text-primary fs-5"></i></td>
          <td><span class="badge bg-secondary">Finalizada</span></td>
          <td>
            <button class="btn btn-sm btn-outline-warning">Editar</button>
          </td>
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
            <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
          </td>
        </tr>
    
        <tr>
          <td>Carla Gómez</td>
          <td>1029384756</td>
          <td>Torre A - 201</td>
          <td>2025-07-10 11:45</td>
          <td>2025-07-10 12:30</td>
          <td><i className="bi bi-car-front-fill text-primary fs-5"></i></td>
          <td><span className="badge bg-secondary">Finalizada</span></td>
          <td>
            <button className="btn btn-sm btn-outline-warning">Editar</button>
          </td>
        </tr>
        <tr>
          <td>Andrés Pérez</td>
          <td>1034567890</td>
          <td>Torre B - 404</td>
          <td>2025-07-10 13:15</td>
          <td>–</td>
          <td><img src={moto} alt="Moto" width="24" height="24" title="Motocicleta"/></td>
          <td><span class="badge bg-warning text-dark">En proceso</span></td>
          <td>
            <button class="btn btn-sm btn-outline-warning">Editar</button>
            <button class="btn btn-sm btn-outline-danger">Finalizar</button>
            <button class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
          </td>
        </tr>
        <tr>
            <td>Laura Torres</td>
            <td>1045678901</td>
            <td>Torre D - 502</td>
            <td>2025-07-10 10:30</td>
            <td>2025-07-10 11:00</td>
            <td><i className="bi bi-car-front-fill text-primary fs-5"></i></td>
            <td><span className="badge bg-secondary">Finalizada</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
            </td>
        </tr>
        <tr>
            <td>Diego Martínez</td>
            <td>1056789012</td>
            <td>Torre E - 303</td>
            <td>2025-07-10 08:45</td>
            <td>–</td>
            <td><img src={moto} alt="Moto" width="24" height="24" title="Motocicleta"/></td>
            <td><span className="badge bg-warning text-dark">En proceso</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
                <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </td>
        </tr>
        <tr>
            <td>Paula Jiménez</td>
            <td>1067890123</td>
            <td>Torre C - 101</td>
            <td>2025-07-10 12:00</td>
            <td>2025-07-10 12:45</td>
            <td><i className="bi bi-car-front-fill text-primary fs-5"></i></td>
            <td><span className="badge bg-secondary">Finalizada</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
            </td>
        </tr>
        <tr>
            <td>Javier López</td>
            <td>1078901234</td>
            <td>Torre B - 202</td>
            <td>2025-07-10 14:30</td>
            <td>–</td>
            <td><img src={moto} alt="Moto" width="24" height="24" title="Motocicleta"/></td>
            <td><span className="badge bg-warning text-dark">En proceso</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
                <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </td>
        </tr>
        <tr>
            <td>Camila Rodríguez</td>
            <td>1089012345</td>
            <td>Torre A - 404</td>
            <td>2025-07-10 09:00</td>
            <td>2025-07-10 09:30</td>
            <td><i className="bi bi-car-front-fill text-primary fs-5"></i></td>
            <td><span className="badge bg-secondary">Finalizada</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
            </td>
        </tr>
        <tr>
            <td>Felipe Sánchez</td>
            <td>1090123456</td>
            <td>Torre D - 505</td>
            <td>2025-07-10 13:45</td>
            <td>–</td>
            <td><img src={moto} alt="Moto" width="24" height="24" title="Motocicleta"/></td>
            <td><span className="badge bg-warning text-dark">En proceso</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
                <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </td>
        </tr>
        <tr>
            <td>Isabel Fernández</td>
            <td>1101234567</td>
            <td>Torre E - 303</td>
            <td>2025-07-10 10:15</td>
            <td>2025-07-10 10:45</td>
            <td><i className="bi bi-car-front-fill text-primary fs-5"></i></td>
            <td><span className="badge bg-secondary">Finalizada</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
            </td>
        </tr>
        <tr>
            <td>Ricardo Torres</td>
            <td>1112345678</td>
            <td>Torre C - 202</td>
            <td>2025-07-10 11:30</td>
            <td>–</td>
            <td><img src={moto} alt="Moto" width="24" height="24" title="Motocicleta"/></td>
            <td><span className="badge bg-warning text-dark">En proceso</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
                <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </td>
        </tr>
        <tr>
            <td>Valentina Castro</td>
            <td>1123456789</td>
            <td>Torre B - 101</td>
            <td>2025-07-10 12:20</td>
            <td>2025-07-10 12:50</td>
            <td><i className="bi bi-car-front-fill text-primary fs-5"></i></td>
            <td><span className="badge bg-secondary">Finalizada</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
            </td>
        </tr>
        <tr>
            <td>Martín Gómez</td>
            <td>1134567890</td>
            <td>Torre A - 404</td>
            <td>2025-07-10 14:00</td>
            <td>–</td>
            <td><i className="bi bi-x-lg text-danger fs-5"></i></td>
            <td><span className="badge bg-warning text-dark">En proceso</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
                <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </td>
        </tr>
        <tr>
            <td>Lucía Ramírez</td>
            <td>1145678901</td>
            <td>Torre D - 505</td>
            <td>2025-07-10 09:30</td>
            <td>2025-07-10 10:00</td>
            <td><i className="bi bi-x-lg text-danger fs-5"></i></td>
            <td><span className="badge bg-secondary">Finalizada</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
            </td>
        </tr>
        <tr>
            <td>Héctor Díaz</td>
            <td>1156789012</td>
            <td>Torre E - 303</td>
            <td>2025-07-10 13:00</td>
            <td>–</td>
            <td><i className="bi bi-x-lg text-danger fs-5"></i></td>
            <td><span className="badge bg-warning text-dark">En proceso</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
                <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </td>
        </tr>
        <tr>
            <td>Gabriela Torres</td>
            <td>1167890123</td>
            <td>Torre C - 202</td>
            <td>2025-07-10 11:15</td>
            <td>2025-07-10 11:45</td>
            <td><i className="bi bi-x-lg text-danger fs-5"></i></td>
            <td><span className="badge bg-secondary">Finalizada</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
            </td>
        </tr>
        <tr>
            <td>Fernando López</td>
            <td>1178901234</td>
            <td>Torre B - 101</td>
            <td>2025-07-10 12:05</td>
            <td>–</td>
            <td><i className="bi bi-x-lg text-danger fs-5"></i></td>
            <td><span className="badge bg-warning text-dark">En proceso</span></td>
            <td>
                <button className="btn btn-sm btn-outline-warning">Editar</button>
                <button className="btn btn-sm btn-outline-danger">Finalizar</button>
                <button className="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>
            </td>
        </tr>
      </tbody>
    </table>
  </div>
  </section>
   <p>hola que mas <Link to="/">Regresar a App </Link></p>
  
    </div>
  );
}

export default VisitasAdmin;
