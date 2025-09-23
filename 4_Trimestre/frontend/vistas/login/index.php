<?php
session_start();
if (isset($_SESSION['nombre'])) {
   $rolId = $_SESSION['rol']; // Esto ya es un número

  if ($rolId == 1) {
    header('Location: ../dashboardAdmin.html'); // Admin
} elseif ($rolId == 2) {
    header('Location: ../vigilanteDashboard.html'); // trabajador
}
   exit();
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Conjunto Azahar - Iniciar sesión</title>
  <link rel="stylesheet"  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <link rel="shortcut icon" href="../img/logo.png" type="image/x-icon" />
</head>
<body>

  <div class="container-fluid p-0">  
   
     <div class="row">
    <div class="min-vh-100 d-flex align-items-center justify-content-center" style="background: linear-gradient(rgba(20, 79, 2, 0.6), rgba(33, 33, 33, 0.6)), url('../img/fondo.jpg'); background-size: cover; background-position: center;">
      <div class="bg-white p-5 rounded-4 shadow-lg w-100 mx-3" style="max-width: 500px;">
        <div class="text-center mb-4">
        
          <h1 class="mt-3 text-success fw-bold">Bienvenido  al Conjunto Azahar</h1>
        
          <p >Inicia sesión para continuar</p>
        </div>

        <form method="POST" action="../../controladores/controlador.login.php">
          <div class="mb-3">
            <label class="form-label">Usuario</label>
            <input type="text" id="username" name="username" class="form-control" placeholder="Nombre " required />


          </div>
          <div class="mb-4">
            <label class="form-label">Contraseña</label>
          <input type="password" name="password" class="form-control" placeholder="••••••••" required />
          </div>
          <div class="d-flex  justify-content-center alimg content-center">
             <h6>No Tienes Usuario? <a href="registro.php">Registrate aqui</a></h6>
          </div>
          <div class="d-flex  justify-content-center">
       
          <button type="submit" class="btn btn-success">Iniciar sesión</button>
          </div>
        </form>
      </div>
       </div>
      </div>

    </div>
  </div>

  <?php
if (isset($_GET['error']) && $_GET['error'] ==1){
  echo  "<script>
        Swal.fire({
          title: 'Inicio no valido',
          text: 'Usuario o contraseña incorrecta',
          icon: 'error'
});
  </script>";
}
?>
</body>
</html>
