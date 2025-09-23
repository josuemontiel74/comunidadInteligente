  import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

  function App()
  {
     return(
    <div className="container-fluid p-0 center">
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
      >
    
        <div className="d-flex align-items-center">
          <button id="menuToggle" className="btn text-dark fs-4 border-0 m-0 px-3">
            ☰
          </button>
        </div>

        <div className="logo-container text-center flex-grow-1">
  <a href="../vistas/vigilanteDashboard.html">
    <img src="../img/logo.png" alt="Logo del sistema" className="logo-img" />
  </a>
</div>
        <div className="d-flex align-items-center gap-3 px-3">
  <div className="dropdown">
    <button
      className="user-circle text-white fw-semibold border-0 bg-success"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    style={{ cursor: 'pointer' }}

    >
      Josue
    </button>
    <ul className="dropdown-menu dropdown-menu-end">
      <li><span className="dropdown-item-text">Usuario: <strong>josmon07</strong></span></li>
      <li><hr className="dropdown-divider" /></li>
      <li><a className="dropdown-item text-danger" href="#">Cerrar sesión</a></li>
    </ul>
  </div>
</div>
      </div>

      <div className="text-center mt-3">
        <h2 className="fw-bold">Bienvenido, Vigilante</h2>
        <p>Selecciona el módulo que deseas gestionar en la plataforma</p>
      
<div id="menuTrabajador" className="worker-menu bg-success text-white">
  <div class="p-3 d-flex flex-column h-100">

   
    <button id="closeMenu" className="btn-close btn-close-white ms-auto mb-3" aria-label="Cerrar"></button>

  
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
        <li><a className="nav-link text-white" href="/vistas/paqueteria.html?abrirModal=1">Registrar Paquete</a></li>
        <li><a className="nav-link text-white" href="/vistas/paqueteria.html">Historial de Paquetes</a></li>
      </ul>
    </div>

    <div className="mb-4">
      <h6 className="text-uppercase fw-bold">📋 Gestión de Visitas</h6>
      <ul className="nav flex-column mt-2 gap-2">
            <li><a className="nav-link text-white" href="/vistas/visitas.html?abrirModal=1">Registrar Visita</a></li>
        <li><a className="nav-link text-white" href="/vistas/visitas.html">Consultar Visitas</a></li>
        <li><a className="nav-link text-white" href="/vistas/visitas.html?mostrarParqueaderos=1">Consultar Parqueaderos</a></li>
      </ul>
    </div>
    <div className="mt-auto">
      <button className="btn btn-light w-100">Cerrar sesión</button>
    </div>

  </div>
</div>
      <div className="d-flex flex-wrap justify-content-center gap-4 my-4">
      
        <div className="module-card">
          <img src="../img/paquetes.jpeg" alt="Paquetería" />
          <h5>Gestión de Paquetería</h5>
           <a href="/vistas/paqueteria.html"> 
          <button>➜</button>
         </a>
        </div>
  
        <div className="module-card">
          <img src="../img/visitas.jpg" alt="Parqueaderos" />
          <h5>Gestión de Visitas</h5>
          <a href="/vistas/visitas.html">
          <button>➜</button>
          </a>
        </div>
      </div>
    </div>
    <div className="d-flex flex-wrap justify-content-center gap-4 my-4">

      <div className="dashboard-card">
        <h5>Visitas del Día</h5>
        <div className="stat-number">9</div>
        <p>Ingresos registrados hoy.</p>
        <a href="/vistas/visitas.html">
        <button>Ver Registro</button>
        </a>
      </div>


      <div className="dashboard-card">
        <h5>Parqueaderos Ocupados</h5>
        <canvas id="parqueoChart"></canvas>
        <a href="/vistas/visitas.html?mostrarParqueaderos=1">
        <button>Ver Estado</button>
        </a>
      </div>

    
      <div className="dashboard-card">
        <h5>Paquetes Recibidos</h5>
        <div className="stat-number">8</div>
        <p>Total de paquetes que llegaron al conjunto hoy.</p>
        <a href="/vistas/paqueteria.html">
        <button>Ver Detalles</button>
        </a>
      </div>

 </div>  

    </div>
           );  
   
 }
 export default App;