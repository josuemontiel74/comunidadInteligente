
<?php
require_once '../../modelo.dto/reservasareas.php';
require_once '../../modelo.dao/reservasareas.php';

require_once '../../conexion/conexion.php';

$registro = null;
if (isset($_GET['id'])) { 
    $dao = new ReservasAreasDao();
    $registro = $dao->buscarPorId($_GET['id']); 
}
$cnn = conexion::conectar();
$stmt = $cnn->query("SELECT idAreaComun, nombreArea FROM areacomun");
$opcionesArea = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

?>



<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Modificar Reserva</title>
  <link rel="stylesheet" href="../css/bootstrap.min.css">
  <link rel="stylesheet" href="../style/style.css">
  <style>
    body {
      background-color: #f0f2f5;
      font-family: 'Segoe UI', sans-serif;
    }

    .sidebar {
      background-color: #198754;
      color: white;
      min-height: 100vh;
      padding-top: 20px;
    }

    .sidebar a {
      color: white;
      text-decoration: none;
      font-weight: 500;
    }

    .sidebar a:hover {
      text-decoration: underline;
    }

    .top-bar {
      background-color: #198754;
      color: white;
    }

    .form-card {
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 40px 50px;
  max-width: 800px;
  margin: 50px auto;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.form-card:hover {
  box-shadow: 0 12px 50px rgba(0, 0, 0, 0.15);
}

.form-card h2 {
  font-size: 2rem;
  margin-bottom: 25px;
}

.form-card .form-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-card .form-control,
.form-card .form-select {
  border-radius: 8px;
  padding: 10px 15px;
  font-size: 1rem;
  border: 1px solid #ccc;
}

.form-card .btn {
  font-size: 1rem;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
}


    .logo {
      width: 40px;
      height: auto;
    }

    .user-popup-content {
      background-color: #fff;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
    }

    .btn {
      min-width: 120px;
    }
  </style>
</head>
<body>

<div class="container-fluid">
    <div class="row">
      <!-- Sidebar -->
      <div class="container-fluid p-0">
    <div class="row">
  <div class="sidebar col-md-2" id="sidebar">
    <button class="btn btn-light" onclick="toggleSidebar()">✖</button>
    <ul>
      <li><a href="../login/index.html">Inicio</a></li>
      <li><a href="paqueteria.html">Gestión de trabajadores</a></li>
      <li><a href="parqueaderos.html">Gestión de Notificaciones</a></li>
    </ul>
  </div>
  <div class=" col-lg-12 col-md-10 bg-success">
  <div class="user-popup" id="userPopup">
    <div class="user-popup-content">
      <p><strong>Administrador:</strong> Josué Montiel</p>
      <p><strong>Email:</strong> Administrador@correo.com</p>
      <button class="btn btn-primary" onclick="cerrarSesion()">Cerrar sesión</button>
    </div>
  </div>

  <header class="top-bar bg-success d-flex justify-content-between align-items-center p-3">
    <button class="menu-btn" onclick="toggleSidebar()">☰</button>
    <div class="logo-container">
      <img src="../img/logo.png" alt="Logo" class="logo ico" />
      <p class="nombre-conjunto">Conjunto Azahar</p>
    </div>
    <div class="user-info" onclick="toggleUserPopup()">
      <div class="">👤
      <span class="text-light">Perfil</span>
      </div> 
    </div>
  </header>
  </div>
    </div>
  <?php if ($registro): ?>
 <form action="../../controladores/controlador.areasComunes.php" method="post">

    <div class="container py-5">
      <div class="card shadow-lg rounded-4 border-0 p-5 mx-auto" style="max-width: 1000px; background-color: #ffffff;">
        <h5 class="text-center text-success mb-4">Modificar Reserva</h5>

        <input type="hidden" name="idReservas" value="<?= htmlspecialchars($registro['idReservas']) ?>">
<div class="row">
  <div class="mb-3 col-md-6">
    <label class="form-label">Área Común (nombre)</label>
    <input type="text" name="nombreArea" class="form-control" value="<?= htmlspecialchars($registro['nombreArea']) ?>" required>
  </div>
  <div class="mb-3 col-md-6">
    <label class="form-label">Solicitante</label>
    <input type="text" name="nombreSolicitante" class="form-control" value="<?= htmlspecialchars($registro['nombreSolicitante']) ?>">
  </div>
</div>
          
        <div class="row">
          <div class="mb-3 col-md-6">
            <label class="form-label">Teléfono</label>
           <input type="text" name="telefonoSolicitante" class="form-control" value="<?= htmlspecialchars($registro['telefonoSolicitante']) ?>">

          </div>
          <div class="mb-3 col-md-6">
            <label class="form-label">Fecha de Reserva</label>
           <input type="date" name="fechaReserva" class="form-control" 
  value="<?= isset($registro['FechaReserva']) ? date('Y-m-d', strtotime($registro['FechaReserva'])) : '' ?>" required>

          </div>
        </div>

        <div class="row">
          <div class="mb-3 col-md-6">
            <label class="form-label">Hora de Inicio</label>
            <input type="time" name="horaInicio" class="form-control" value="<?= $registro['horaInicio'] ?>" required>
          </div>
          <div class="mb-3 col-md-6">
            <label class="form-label">Hora de Fin</label>
            <input type="time" name="horaFin" class="form-control" value="<?= $registro['horaFin'] ?>" required>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Motivo</label>
          <input type="text" name="motivoReserva" class="form-control" value="<?= $registro['motivoReserva'] ?>" required>
        </div>

        <div class="mb-4">
          <label class="form-label">Cantidad de Asistentes</label>
          <input type="number" name="cantidadAsistentes" class="form-control" value="<?= $registro['cantidadAsistentes'] ?>" required>
        </div>
        <input type="hidden" name="apartamentoId" value="<?= $registro['apartamentoId'] ?>">
         <input type="hidden" name="areaComunId" value="<?= $registro['areaComunId'] ?>">
             <input type="hidden" name="invitadosExternos" value="<?= $registro['invitadosExternos'] ?>">
<input type="hidden" name="aceptaReglamento" value="<?= $registro['aceptaReglamento'] ?>">
<input type="hidden" name="estadoId" value="<?= $registro['estadoId'] ?>">
<input type="hidden" name="documentoSolicitante" value="<?= $registro['documentoSolicitante'] ?>">

<div class="d-flex justify-content-between">
  <a href="areascomunes.php" class="btn btn-secondary btn-lg px-4">Cancelar</a>
 <button type="submit" name="modificarReserva" class="btn btn-success">Guardar Cambios</button>

</div>

      </div>
    </div>
  </form>
  <?php else: ?>
    <div class="alert alert-danger text-center mt-5">No se encontró la reserva.</div>
  <?php endif; ?>
</div>

<script>
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('d-none');
  }

  function toggleUserPopup() {
    const popup = document.getElementById('userPopup');
    popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
  }
    function mostrarMensaje(event) {
      event.preventDefault();
      document.getElementById("mensaje").style.display = "block";
      }
    function toggleSidebar() {
      document.getElementById("sidebar").classList.toggle("active");
    }

    function toggleUserPopup() {
      document.getElementById("userPopup").classList.toggle("active");
    }

    function cerrarSesion() {
      window.location.href = "../login/index.php";
    }
    
    
</script>

</body>
</html>
