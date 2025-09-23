<?php
$registro = null;
if (isset($_GET['modificar_id'])) {
require_once '../modelo.dao/areascomunes.php';

    require '../conexion/conexion.php';

    $uDao = new AreasComunesDao();
    $cnn = conexion::conectar();
    $query = $cnn->prepare("SELECT * FROM areascomunes WHERE idareascomunes = ?");
    $query->bindParam(1, $_GET['modificar_id']);
    $query->execute();
    $registro = $query->fetch(PDO::FETCH_ASSOC);
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Panel de Trabajador</title>
  <link rel="stylesheet" href="../css/styles.css" />
  <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
  <link rel="shortcut icon" href="../img/logo.png" type="image/x-icon">
</head>
<body>
  <div class="container-fluid p-0">
      <header
        class="d-flex align-items-center justify-content-between px-3 py-2"
      >
        <div class="d-flex align-items-center">
          <button id="menuToggle" class="btn text-dark fs-4 border-0 m-0 px-3">
            ☰
          </button>
        </div>
        <div class="logo-container text-center flex-grow-1">
          <a href="../vistas/dashboardAdmin.html">
            <img
              src="../img/logo.png"
              alt="Logo del sistema"
              class="logo-img"
            />
          </a>
        </div>
        <div class="d-flex align-items-center gap-3 px-3">
          <div class="dropdown">
            <button
              class="user-circle text-white fw-semibold border-0 bg-success"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style="cursor: pointer"
            >
              Admin
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <span class="dropdown-item-text"
                  >Usuario: <strong>admin</strong></span
                >
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a
                  class="dropdown-item text-danger"
                  href="../controladores/cerrar_sesion.php"
                  >Cerrar sesión</a
                >
              </li>
            </ul>
          </div>
        </div>
      </header>

      <aside id="menuTrabajador" class="worker-menu bg-success text-white">
        <div class="p-3 d-flex flex-column h-100">
          <button
            id="closeMenu"
            class="btn-close btn-close-white ms-auto mb-3"
            aria-label="Cerrar"
          ></button>
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="user-circle text-dark fw-semibold bg-white">Admin</div>
            <div class="d-flex flex-column">
              <span class="fw-semibold text-white">Administrador</span>
              <span class="fw-semibold text-white">Sesión activa</span>
            </div>
          </div>
          <div class="mb-4">
            <h6 class="text-uppercase fw-bold">
              <ul class="nav flex-column">
                <li>
                  <a
                    class="nav-link text-white"
                    href="../vistas/dashboardAdmin.html"
                    >🏠 Inicio</a
                  >
                </li>
              </ul>
            </h6>
          </div>
          <!-- Módulo: Gestión de Paquetes -->
          <div class="mb-4">
            <h6 class="text-uppercase fw-bold">📦 Gestión de Paquetes</h6>
            <ul class="nav flex-column mt-2 gap-2">
              <li>
                <a
                  class="nav-link text-white"
                  href="../vistas/paqueteriaAdmin.html?abrirModal=1"
                  >Registrar Paquete</a
                >
              </li>
              <li>
                <a
                  class="nav-link text-white"
                  href="../vistas/paqueteriaAdmin.html"
                  >Historial de Paquetes</a
                >
              </li>
            </ul>
          </div>
          <!-- Módulo: Gestión de Visitas -->
          <div class="mb-4">
            <h6 class="text-uppercase fw-bold">📋 Gestión de Visitas</h6>
            <ul class="nav flex-column mt-2 gap-2">
              <li>
                <a
                  class="nav-link text-white"
                  href="../vistas/visitasAdmin.html?abrirModal=1"
                  >Registrar Visita</a
                >
              </li>
              <li>
                <a
                  class="nav-link text-white"
                  href="../vistas/visitasAdmin.html"
                  >Consultar Visitas</a
                >
              </li>
              <li>
                <a
                  class="nav-link text-white"
                  href="../vistas/visitasAdmin.html?mostrarParqueaderos=1"
                  >Consultar Parqueaderos</a
                >
              </li>
            </ul>
          </div>
          <!-- Módulo: Gestión de Áreas Comunes -->
          <div class="mb-4">
            <h6 class="text-uppercase fw-bold">🏢 Gestión de Áreas Comunes</h6>
            <ul class="nav flex-column mt-2 gap-2">
              <li>
                <a class="nav-link text-white" href="#">Registrar Reserva</a>
              </li>
              <li>
                <a class="nav-link text-white" href="#"
                  >Historial de Reservas</a
                >
              </li>
            </ul>
          </div>
          <!-- Módulo: Gestión de Residentes -->
          <div class="mb-4">
            <h6 class="text-uppercase fw-bold">👥 Gestión de Residentes</h6>
            <ul class="nav flex-column mt-2 gap-2">
              <li>
                <a
                  class="nav-link text-white"
                  href="../vistas/ocupacionResidencial.html?modalResidente"
                  >Registrar Residente</a
                >
              </li>
              <li>
                <a
                  class="nav-link text-white"
                  href="../vistas/ocupacionResidencial.html"
                  >Listado de Residentes</a
                >
              </li>
            </ul>
          </div>
          <div class="mt-auto">
            <a href="../controladores/cerrar_sesion.php">
              <button class="btn btn-light w-100">Cerrar sesión</button>
            </a>
          </div>
        </div>
      </aside>


  <div class="barra-progreso"></div>

  <!-- PANEL AREAS COMUNES -->
  
 <div class="container-md mt-3 p-2 ">
    <div class="bg-light rounded -10">
   <div class="text-center text-dark">
    <br>
    <h2>Lista de Áreas Comunes</h2>
    <p>Bienvenido a la lista de áreas comunes.<br>Por favor selecciona una de las siguientes opciones</p>
   </div >
  <!-- Áreas comunes -->
<!-- Áreas comunes -->
<div class="form px-3">
  <!-- 🔍 Campo de búsqueda -->
  <div class="row mb-3">
    <div class="col-md-6 offset-md-3">
      <input type="text" id="filtroBusqueda" class="form-control" placeholder="Buscar por nombre, apellido, cédula o área reservada..." onkeyup="filtrarTabla()">
    </div>
  </div>
<!-- Contenedor de paginación -->
<nav>
  <ul class="pagination justify-content-center" id="paginacion"></ul>
</nav>

  <!-- Tabla de resultados -->
  <div class="table-responsive container-md">
    <table class="table table-striped table-hover table-bordered mt-3" id="table">
    <thead class="table-dark">
  <tr class="text-center">
     <th onclick="ordenarTabla(0)">ID<span class="order-icon">↕</span></th>
    <th onclick="ordenarTabla(1)">Nombre-Area <span class="order-icon">↕</span></th>
    <th onclick="ordenarTabla(2)">solicitante <span class="order-icon">↕</span></th>
     <th onclick="ordenarTabla(3)">Telefono<span class="order-icon">↕</span></th>
    <th onclick="ordenarTabla(4)">inicio <span class="order-icon">↕</span></th>
    <th onclick="ordenarTabla(5)">final <span class="order-icon">↕</span></th>
    <th onclick="ordenarTabla(6)">Fecha reserva <span class="order-icon">↕</span></th>
    <th onclick="ordenarTabla(7)">Motivo <span class="order-icon">↕</span></th>
     <th onclick="ordenarTabla(8)">Cantidad<span class="order-icon">↕</span></th>
     
    <th>Modificar</th>
    <th>Eliminar</th>
    
  </tr>
  <!-- Contenedor de paginación -->

</thead>
      <tbody>
        
        <?php
        require '../modelo.dto/solicitante.php'; 
        require '../modelo.dto/areacomun.php';
          require '../modelo.dao/reservasareas.php';
          require '../modelo.dto/reservasareas.php'; 
          require '../conexion/conexion.php'; 
          $cnn = conexion::conectar();
$stmt = $cnn->query("SELECT idAreaComun, nombreArea FROM areacomun");
$opcionesArea = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

          $uDao = new ReservasAreasDao();
          $allusers = $uDao->mostrasRegistro();
          foreach ($allusers as $user) { ?>
            <tr class="text-center">
               <td><?php echo $user['idReservas'] ?></td>
              <td><?php echo $user['nombreArea'] ?></td>
              <td><?php echo $user['nombreSolicitante'] ?></td>
              <td><?php echo $user['telefonoSolicitante'] ?></td>
              <td><?php echo $user['horaInicio'] ?></td>
              <td><?php echo $user['horaFin'] ?></td>
               <td><?php echo $user['FechaReserva'] ?></td>
              <td><?php echo $user['motivoReserva'] ?></td>
              <td><?php echo $user['cantidadAsistentes'] ?></td>
             
              <td>
                <a href="modificar_area.php?id=<?= $user['idReservas'] ?>" class="btn btn-success btn-sm">Modificar</a>
              </td>
              <td>
                <a href="../../controladores/controlador.areasComunes.php?eliminar=<?= $user['idReservas'] ?>" 
                   class="btn btn-danger btn-sm" 
                   onclick="return confirm('¿Estás seguro de eliminar esta reserva?');">
                   Eliminar
                </a>
              </td>
            </tr>
        <?php } ?>
      </tbody>
    </table>

    <div class="d-flex justify-content-center align-items-end mt-4 mb-4 gap-2">
      <button class="btn btn-success btn-sm" onclick="mostrarDetalles('bbq')">Asignar Nueva Reserva</button>
      <button class="btn btn-outline-success px-4" onclick="window.location.href='modulos_administrador.html'">Menú Principal</button>
    </div>
  </div>
</div>

   <!-- Botón final -->
 
    
</div>
</div>
</div>
    

</div>
</div>

  </div>

  <!-- POPUP DISPONIBLE -->
  <div class="popup" id="formularioBBQ">
    <divc class="bg-light p-5 rounded shadow-sm mx-5">
     <h1>Registro de un nuevo</h1>
<form action="../../controladores/controlador.areasComunes.php" method="post">
  <div class="container py-5">
    <div class="card shadow-lg rounded-4 border-0 p-5 mx-auto" style="max-width: 1000px; background-color: #ffffff;">
      <h5 class="text-center text-success mb-4">Agregar Nueva Reserva</h5>

      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label">Área Común</label>
          <select name="areaComunId" class="form-select" required>
            <option value="">Seleccione un área...</option>
            <?php foreach ($opcionesArea as $id => $nombre): ?>
              <option value="<?= $id ?>"><?= htmlspecialchars($nombre) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="mb-3 col-md-6">
          <label class="form-label">Solicitante</label>
          <input type="text" name="nombreSolicitante" class="form-control" placeholder="Nombre del solicitante" required>
        </div>
      </div>

      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label">Teléfono</label>
          <input type="text" name="telefonoSolicitante" class="form-control" placeholder="Teléfono" required>
        </div>
         
        <div class="mb-3 col-md-6">
          <label class="form-label">Fecha de Reserva</label>
          <input type="date" name="fechaReserva" class="form-control" required>
        </div>
      </div>
       <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label">Documento</label>
      <input type="text" name="documentoSolicitante" class="form-control" placeholder="Documento" required>

        </div>
         
        <div class="mb-3 col-md-6">
          <label class="form-label">Correo</label>
    <input type="email" name="correoSolicitante" class="form-control" placeholder="Correo electrónico" required>

        </div>
      </div>


      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label">Hora de Inicio</label>
          <input type="time" name="horaInicio" class="form-control" required>
        </div>
        <div class="mb-3 col-md-6">
          <label class="form-label">Hora de Fin</label>
          <input type="time" name="horaFin" class="form-control" required>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Motivo</label>
        <input type="text" name="motivoReserva" class="form-control" placeholder="Motivo de la reserva" required>
      </div>

      <div class="mb-4">
        <label class="form-label">Cantidad de Asistentes</label>
        <input type="number" name="cantidadAsistentes" class="form-control" placeholder="Cantidad de personas" min="1" required>
      </div>

      <!-- Valores ocultos por defecto -->
      <input type="hidden" name="apartamentoId" value="1">
      <input type="hidden" name="invitadosExternos" value="0">
      <input type="hidden" name="aceptaReglamento" value="1">
      <input type="hidden" name="estadoId" value="1">

      <div class="d-flex justify-content-between">
        <a href="areascomunes.php" class="btn btn-secondary btn-lg px-4">Cancelar</a>
        <button type="submit" name="registro" class="btn btn-success">Guardar Reserva</button>
      </div>
    </div>
  </div>
</form>

    </div>
  </div>
   </div>
  <script>
    let currentSortColumn = null;
let currentSortAsc = true;
const rowsPerPage = 5;
let currentPage = 1;

function ordenarTabla(colIndex) {
  const table = document.getElementById("table");
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  if (currentSortColumn === colIndex) currentSortAsc = !currentSortAsc;
  else { currentSortColumn = colIndex; currentSortAsc = true; }

  rows.sort((a, b) => {
    let x = a.cells[colIndex].innerText.toLowerCase();
    let y = b.cells[colIndex].innerText.toLowerCase();
    return currentSortAsc ? (x > y) - (x < y) : (x < y) - (x > y);
  });

  rows.forEach(r => tbody.appendChild(r));
  document.querySelectorAll(".order-icon").forEach(e => e.innerText = "↕");
  document.querySelector(`thead th:nth-child(${colIndex + 1}) .order-icon`).innerText = currentSortAsc ? "↑" : "↓";
  currentPage = 1;
  actualizarTabla();
}

function filtrarTabla() {
  currentPage = 1;
  actualizarTabla();
}

function actualizarTabla() {
  const input = document.getElementById("filtroBusqueda").value.toLowerCase();
  const table = document.getElementById("table");
  const tbody = table.tBodies[0];
  const allRows = Array.from(tbody.rows);

  // 1. Aplicar filtro
  const rowsFiltradas = allRows.filter(row => {
    const cells = Array.from(row.cells).slice(0, -2); // Excluir botones
    return cells.some(cell => cell.innerText.toLowerCase().includes(input));
  });

  // 2. Ocultar todas las filas
  allRows.forEach(row => row.style.display = "none");

  // 3. Mostrar solo las filtradas en la página actual
  const totalPages = Math.ceil(rowsFiltradas.length / rowsPerPage);
  const inicio = (currentPage - 1) * rowsPerPage;
  const fin = inicio + rowsPerPage;

  rowsFiltradas.slice(inicio, fin).forEach(row => {
    row.style.display = "";
  });

  // 4. Crear paginación
  const pagUL = document.getElementById("paginacion");
  pagUL.innerHTML = "";
  for (let p = 1; p <= totalPages; p++) {
    const li = document.createElement("li");
    li.className = "page-item" + (p === currentPage ? " active" : "");
    li.innerHTML = `<a class="page-link" href="#" onclick="gotoPage(${p});return false;">${p}</a>`;
    pagUL.appendChild(li);
  }
}

function gotoPage(p) {
  currentPage = p;
  actualizarTabla();
}

window.onload = function () {
  actualizarTabla();
}
    function mostrarDetalles(id) {
      if (id === 'bbq') {
        document.getElementById('formularioBBQ').style.display = 'flex';
      } else if(id==='modificar'){
        document.getElementById('formularioModificar').style.display = 'flex';
      }
    }
     
    function cerrarPopup() {
      document.getElementById('detallesOcupado').style.display = 'none';
      document.getElementById('formularioModificar').style.display = 'none';
    }

    function liberarEspacio() {
      alert("Espacio liberado correctamente");
      cerrarPopup();
    }

    function asignarEspacio() {
      alert("Espacio asignado correctamente");
      cerrarPopup();
    }

    function toggleSidebar() {
      document.getElementById("sidebar").classList.toggle("active");
    }

    function toggleUserPopup() {
      document.getElementById("userPopup").classList.toggle("active");
    }


    function filtrarTabla() {
    const input = document.getElementById("filtroBusqueda");
    const filter = input.value.toLowerCase();
    const table = document.getElementById("table");
    const tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) {
      const row = tr[i];
      const cells = row.getElementsByTagName("td");
      let match = false;

      for (let j = 0; j < cells.length - 2; j++) { // No buscar en botones
        if (cells[j].innerText.toLowerCase().indexOf(filter) > -1) {
          match = true;
          break;
        }
      }

      row.style.display = match ? "" : "none";
    }
  }
  </script>
  <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Chart.js para los gráficos -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../js/dashboardAdmin.js"></script>
</body>
</html>