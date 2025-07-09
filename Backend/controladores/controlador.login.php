<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require '../conexion/conexion.php';
require '../modelo.dao/usuario.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    // Validar campos vacíos
    if (empty($username) || empty($password)) {
        header("Location: ../vistas/login.php?error=1");
        exit;
    }

    $dao = new UsuariosDao();
    $usuario = $dao->obtenerUsuarioPorUsername($username);

    // Validación de usuario y contraseña con hash
    if ($usuario && password_verify($password, $usuario['password'])) {

        $_SESSION['nombre'] = $usuario['username'];
        $_SESSION['rol'] = $usuario['rolesId'];

        // Redirección por roles
        switch ($usuario['rolesId']) {
            case 1:
                header("Location:../vistas/dashboardAdmin.html");
                break;
            case 2:
                header("Location:../vistas/vigilanteDashboard.html");
                break;
            default:
                header("Location:../vistas/login/index.php");
                break;
        }

    } else {
        // Usuario o contreña incorrecta
        header("Location:../vistas/login/index.php");
       
    }
}
?>
