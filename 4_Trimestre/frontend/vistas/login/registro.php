<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Registro de Usuario - Conjunto Azahar</title>
   <link rel="stylesheet"  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <link rel="shortcut icon" href="../img/logo.png" type="image/x-icon" />
</head>
<body>
<div class="container mt-5">
  <div class="text-center mb-4">
    <h2 class="text-success">Registro de Usuario</h2>
  </div>

  <form action="../../controladores/controlador.registro.php" method="POST">
    <div class="mb-3">
      <label for="tipoDocumento" class="form-label">Tipo de Documento</label>
      <input type="number" name="tipoDocumento" class="form-control" id="tipoDocumento" required>
    </div>

    <div class="mb-3">
      <label for="numeroDocumento" class="form-label">Número de Documento</label>
      <input type="text" name="numeroDocumento" class="form-control" id="numeroDocumento" required>
    </div>

    <div class="mb-3">
      <label for="username" class="form-label">Nombre de Usuario</label>
      <input type="text" name="username" class="form-control" id="username" required>
    </div>

    <div class="mb-3">
      <label for="password" class="form-label">Contraseña</label>
      <input type="password" name="password" class="form-control" id="password" required>
    </div>

    <div class="mb-4">
      <label for="rol" class="form-label">Rol</label>
      <select name="rol" class="form-control" id="rol" required>
        <option value="1">Administrador</option>
        <option value="2">Trabajador</option>
      </select>
    </div>

    <div class="d-grid">
      <button type="submit" name="registro" class="btn btn-success">Registrar</button>
    </div>
  </form>
</div>
</body>
</html>
