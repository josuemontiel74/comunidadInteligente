  import 'bootstrap/dist/css/bootstrap.min.css';
  import './styles.css';

  import { Link, useNavigate } from "react-router-dom";
  function Parqueaderos(){
      return(
      <div className="container-fluid p-0">
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2"
        >
          <div className="d-flex align-items-center">
            <button id="menuToggle" className="btn text-dark fs-4 border-0 m-0 px-3">
              ☰
            </button>
          </div>

          <div className="logo-container text-center flex-grow-1">
    <Link to="/vistas/vigilanteDashboard.html">
      <img src="/img/logo.png" alt="Logo del sistema" className="logo-img" />
    </Link>
  </div>

      
  <div className="d-flex align-items-center gap-3 px-3">
    <div className="dropdown">
      <button
        className="user-circle text-white fw-semibold border-0 bg-success"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{cursor: 'pointer'}}>
        Josue
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        <li><span className="dropdown-item-text">Usuario: <strong>josmon07</strong></span></li>
        <li><hr className="dropdown-divider" /></li>
        <li>< Link className="dropdown-item text-danger" to="#">Cerrar sesión</Link></li>
      </ul>
    </div>
  </div>
        </div>

        <div className="text-center mt-3">
          <h2 className="fw-bold">Gestión de paquetería</h2>
        
  <aside id="menuTrabajador" className="worker-menu bg-success text-white">
    <div className="p-3 d-flex flex-column h-100">


      <button id="closeMenu" className="btn-close btn-close-white ms-auto mb-3" aria-label="Cerrar"></button>

      <div className="d-flex align-items-center gap-3 mb-4">
    <div className="user-circle text-dark fw-semibold bg-white">Josue</div>
    <div className="d-flex flex-column">
      <span className="fw-semibold text-white">Vigilante</span>
      <span className="fw-semibold text-white">Sesión activa</span>
    </div>
  </div>

  <div className="mb-4">
      <h6 className="text-uppercase fw-bold">
      <ul className="nav flex-column">
        <li><Link className="nav-link text-white" href="/vistas/vigilanteDashboard.html">🏠 Inicio</Link></li>
      </ul>
      </h6>
      </div>
      <div className="mb-4">
        <h6 className="text-uppercase fw-bold">📦 Gestión de Paquetes</h6>
        <ul className="nav flex-column mt-2 gap-2">
          <li><Link className="nav-link text-white" to="/vistas/paqueteria.html?abrirModal=1">Registrar Paquete</Link></li>
          <li>< Link className="nav-link text-white" to="/vistas/paqueteria.html">Historial de Paquetes</Link></li>
        </ul>

      </div>

      <div className="mb-4">
        <h6 className="text-uppercase fw-bold">📋 Gestión de Visitas</h6>
        <ul className="nav flex-column mt-2 gap-2">
          <li><Link className="nav-link text-white" to="/vistas/visitas.html?abrirModal=1">Registrar Visita</Link></li>
          <li><Link  className="nav-link text-white" to="/vistas/visitas.html">Consultar Visitas</Link></li>
          <li><Link className="nav-link text-white" to="/vistas/visitas.html?mostrarParqueaderos=1">Consultar Parqueaderos</Link></li>
        </ul>
      </div>
      <div className="mt-auto">
        <button className="btn btn-light w-100">Cerrar sesión</button>
      </div>

    </div>
  </aside>
  </div>
    <div className="container-fluid p-0">
  <div className="container mt-4">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h3 className="fw-bold text-success">📦 Historial de Paquetería</h3>
      <button className="btn btn-success" id="btnRegistrar">
    Registrar Nuevo Paquete
  </button>
    </div>

    <div className="table-responsive">
      <table id="tablaPaquetes" className="table table-bordered table-striped">
        <thead className="table-success">
          <tr>
            <th>Residente</th>
            <th>Apartamento</th>
            <th>Transportadora</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          
          <tr>
    <td>Andrea Rodríguez</td>
    <td>Torre B - 202</td>
    <td>Interrapidisimo</td>
    <td>2025-07-09</td>
    <td><span className="badge bg-warning text-dark">Recibido</span></td>
    <td>
      <button className="btn btn-sm btn-outline-primary btn-editar">Editar</button>
      <button className="btn btn-sm btn-outline-success btn-finalizar">Finalizar</button>
      <button className="btn btn-sm btn-outline-info btn-ver-detalles"
        data-residente="Andrea Rodríguez"
        data-apartamento="Torre B - 202"
        data-transportadora="Interrapidisimo"
        data-fecha="2025-07-09"
        data-estado="Recibido"
        data-observaciones="Paquete frágil, entregado sin firma"
        data-bs-toggle="modal" data-bs-target="#modalDetalles">
        Detalles
      </button>
    </td>
  </tr>

  <tr>
    <td>Cristian Mora</td>
    <td>Torre C - 303</td>
    <td>Servientrega</td>
    <td>2025-07-09</td>
    <td><span className="badge bg-warning text-dark">Recibido</span></td>
    <td>
      <button className="btn btn-sm btn-outline-primary btn-editar">Editar</button>
      <button className="btn btn-sm btn-outline-success btn-finalizar">Finalizar</button>
      <button className="btn btn-sm btn-outline-info btn-ver-detalles"
        data-residente="Cristian Mora"
        data-apartamento="Torre C - 303"
        data-transportadora="Servientrega"
        data-fecha="2025-07-09"
        data-estado="Recibido"
        data-observaciones="Paquete frágil, entregado sin firma"
        data-bs-toggle="modal" data-bs-target="#modalDetalles">
        Detalles
      </button>
    </td>
  </tr>

  <tr>
    <td>David Ospina</td>
    <td>Torre C - 301</td>
    <td>Servientrega</td>
    <td>2025-07-09</td>
    <td><span class="badge bg-warning text-dark">Recibido</span></td>
    <td>
      <button class="btn btn-sm btn-outline-primary btn-editar">Editar</button>
      <button class="btn btn-sm btn-outline-success btn-finalizar">Finalizar</button>
      <button class="btn btn-sm btn-outline-info btn-ver-detalles"
        data-residente="David Ospina"
        data-apartamento="Torre C - 301"
        data-transportadora="Servientrega"
        data-fecha="2025-07-09"
        data-estado="Recibido"
        data-observaciones="Paquete frágil, entregado sin firma"
        data-bs-toggle="modal" data-bs-target="#modalDetalles">
        Detalles
      </button>
    </td>
  </tr>

  <tr>
    <td>Mario Castro</td>
    <td>Torre B - 201</td>
    <td>4-72</td>
    <td>2025-07-09</td>
    <td><span className="badge bg-warning text-dark">Recibido</span></td>
    <td>
      <button className="btn btn-sm btn-outline-primary btn-editar">Editar</button>
      <button className="btn btn-sm btn-outline-success btn-finalizar">Finalizar</button>
      <button className="btn btn-sm btn-outline-info btn-ver-detalles"
        data-residente="Mario Castro"
        data-apartamento="Torre B - 201"
        data-transportadora="4-72"
        data-fecha="2025-07-09"
        data-estado="Recibido"
        data-observaciones="Paquete frágil, entregado sin firma"
        data-bs-toggle="modal" data-bs-target="#modalDetalles">
        Detalles
      </button>
    </td>
  </tr>

  <tr>
    <td>Carlos Mejía</td>
    <td>Torre A - 105</td>
    <td>Coordinadora</td>
    <td>2025-07-09</td>
    <td><span className="badge bg-warning text-dark">Recibido</span></td>
    <td>
      <button className="btn btn-sm btn-outline-primary btn-editar">Editar</button>
      <button className="btn btn-sm btn-outline-success btn-finalizar">Finalizar</button>
      <button className="btn btn-sm btn-outline-info btn-ver-detalles"
        data-residente="Carlos Mejía"
        data-apartamento="Torre A - 105"
        data-transportadora="Coordinadora"
        data-fecha="2025-07-09"
        data-estado="Recibido"
        data-observaciones="Paquete frágil, entregado sin firma"
        data-bs-toggle="modal" data-bs-target="#modalDetalles">
        Detalles
      </button>
    </td>
  </tr>

  <tr>
    <td>Laura Pérez</td>
    <td>Torre A - 101</td>
    <td>Servientrega</td>
    <td>2025-07-09</td>
    <td><span className="badge bg-warning text-dark">Recibido</span></td>
    <td>
      <button className="btn btn-sm btn-outline-primary btn-editar">Editar</button>
      <button className="btn btn-sm btn-outline-success btn-finalizar">Finalizar</button>
      <button className="btn btn-sm btn-outline-info btn-ver-detalles"
        data-residente="Laura Pérez"
        data-apartamento="Torre A - 101"
        data-transportadora="Servientrega"
        data-fecha="2025-07-09"
        data-estado="Recibido"
        data-observaciones="Paquete frágil, entregado sin firma"
        data-bs-toggle="modal" data-bs-target="#modalDetalles">
        Detalles
      </button>
    </td>
  </tr>

  <tr>
    <td>Juan Gómez</td>
    <td>Torre A - 102</td>
    <td>Coordinadora</td>
    <td>2025-07-09</td>
    <td><span class="badge bg-warning text-dark">Recibido</span></td>
    <td>
      <button class="btn btn-sm btn-outline-primary btn-editar">Editar</button>
      <button class="btn btn-sm btn-outline-success btn-finalizar">Finalizar</button>
      <button class="btn btn-sm btn-outline-info btn-ver-detalles"
        data-residente="Juan Gómez"
        data-apartamento="Torre A - 102"
        data-transportadora="Coordinadora"
        data-fecha="2025-07-09"
        data-estado="Recibido"
        data-observaciones="Paquete frágil, entregado sin firma"
        data-bs-toggle="modal" data-bs-target="#modalDetalles">
        Detalles
      </button>
    </td>
  </tr>

        </tbody>
      </table>
    </div>
  </div>
    </div>

  <div className="modal fade" id="modalDetalles" tabindex="-1" aria-labelledby="modalDetallesLabel" aria-hidden="true">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header bg-success text-white">
          <h5 className="modal-title" id="modalDetallesLabel">📦 Detalles del Paquete</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div className="modal-body">
          <p><strong>Residente:</strong> <span id="detalleResidente"></span></p>
          <p><strong>Apartamento:</strong> <span id="detalleApartamento"></span></p>
          <p><strong>Transportadora:</strong> <span id="detalleTransportadora"></span></p>
          <p><strong>Fecha de registro:</strong> <span id="detalleFecha"></span></p>
          <p><strong>Estado:</strong> <span id="detalleEstado"></span></p>
          <p><strong>Observaciones:</strong> <span id="detalleObservaciones"></span></p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>

  <div className="modal fade" id="modalEditar" tabindex="-1" aria-labelledby="modalEditarLabel" aria-hidden="true">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header bg-warning text-dark">
          <h5 className="modal-title" id="modalEditarLabel">✏️ Editar Paquete</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div className="modal-body">
          <form id="formEditar">
            <div className="mb-3">
              <label className="form-label">Apartamento</label>
              <input type="text" className="form-control" id="editApartamento"/>
            </div>
            <div className="mb-3">
              <label className="form-label">Observaciones</label>
              <textarea className="form-control" rows="3" id="editObservaciones"></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Estado</label>
              <select className="form-select" id="editEstado">
                <option value="Pendiente">Pendiente</option>
                <option value="Recibido">Recibido</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
            <button type="submit" className="btn btn-warning">Guardar cambios</button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <div className="modal fade" id="modalRegistrar" tabindex="-1" aria-labelledby="modalRegistrarLabel" aria-hidden="true">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header bg-success text-white">
          <h5 className="modal-title" id="modalRegistrarLabel">📦 Registrar Paquete</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div className="modal-body">
          <form id="formRegistrar">
            <div className="mb-3">
              <label className="form-label">Residente</label>
              <input type="text" className="form-control" id="nuevoResidente" required/>
            </div>
            <div className="mb-3 d-flex gap-2">
  
    <div className="flex-grow-1">
      <label className="form-label">Torre</label>
      <select className="form-select" id="nuevoTorre" required>
        <option value="">Selecciona una torre</option>
        <option value="A">Torre A</option>
        <option value="B">Torre B</option>
        <option value="C">Torre C</option>
        <option value="D">Torre D</option>
        <option value="E">Torre E</option>
        <option value="F">Torre F</option>
        <option value="G">Torre G</option>
        <option value="H">Torre H</option>
        <option value="I">Torre I</option>
        <option value="J">Torre J</option>
      </select>
    </div>


    <div className="flex-grow-1">
      <label className="form-label">Apartamento</label>
      <input type="text" className="form-control" id="nuevoApartamento" placeholder="Ej. 202" required/>
    </div>
  </div>
            <div className="mb-3">
              <label className="form-label">Transportadora</label>
              <input type="text" className="form-control" id="nuevoTransportadora"/>
            </div>
            <div className="mb-3">
              <label className="form-label">Observaciones</label>
              <textarea className="form-control" id="nuevoObservaciones" rows="3"></textarea>
            </div>
            <button type="submit" className="btn btn-success w-100">Registrar</button>
          </form>
        </div>
      </div>
    </div>
  </div>
  <p> <Link to="/">Regresar al apartado principal </Link></p>
    
  </div>

  );
  }
  export default Parqueaderos;