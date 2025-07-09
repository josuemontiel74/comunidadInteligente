<?php
require '../conexion/conexion.php';
require '../modelo.dto/persona.php';
require '../modelo.dto/usuario.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Conectar a la BD
    $cnn = conexion::conectar();

    // Obtener datos del formulario
    $numeroDocumento = trim($_POST['numeroDocumento']);
    $tipoDocumento = trim($_POST['tipoDocumento']);
    $username = $_POST['username'];
$password = $_POST['password'];
$rol = $_POST['rol'];


    // Convertir rol a ID
   $rolesId = (int)$rol;


    // 1️⃣ Insertar en tabla personas
    try {
        $insertPersona = $cnn->prepare("INSERT INTO personas (numeroDocumento, tipoDocumentoId) VALUES (?, ?)");
        $insertPersona->execute([$numeroDocumento, $tipoDocumento]);
    } catch (PDOException $e) {
        die("Error al insertar en personas: " . $e->getMessage());
    }

    // 2️⃣ Insertar en tabla usuarios
    try {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $insertUsuario = $cnn->prepare("INSERT INTO usuarios (username, numeroDocumento, rolesId, password, estadoId) VALUES (?, ?, ?, ?, ?)");
        $insertUsuario->execute([$username, $numeroDocumento, $rolesId, $hash, 1]);
        header("Location: ../vistas/login/index.php?registro=ok");
    } catch (PDOException $e) {
        die("Error al insertar en usuarios: " . $e->getMessage());
    }
}
?>
