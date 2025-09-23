<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require '../conexion/conexion.php';
require '../modelo.dao/reservasareas.php';
require '../modelo.dto/reservasareas.php';
require '../modelo.dto/solicitante.php';
require_once '../modelo.dao/solicitante.php';


    

$uDao = new ReservasAreasDao();
$uDto = new ReservasAreasDto(); // ✅ MOVIDO AQUÍ
if (isset($_POST['registro'])) {
    // 1️⃣ Insertar el Solicitante
    $sDto = new SolicitanteDto();
$sDto->setDocumentoSolicitante($_POST['documentoSolicitante']);
$sDto->setNombreSolicitante($_POST['nombreSolicitante']);
$sDto->setTelefonoSolicitante($_POST['telefonoSolicitante']);
$sDto->setCorreoSolicitante($_POST['correoSolicitante']);
$sDto->setTipoDocumentoId(1); // o el que corresponda

$sDao = new SolicitanteDao();
$mensajeSolicitante = $sDao->insertar($sDto);


    // 2️⃣ Insertar la Reserva
    $uDto = new ReservasAreasDto();
    $uDto->setApartamentoId($_POST['apartamentoId']);
    $uDto->setAreaComunId($_POST['areaComunId']);
    $uDto->setFechaReserva($_POST['fechaReserva']);
    $uDto->setHoraInicio($_POST['horaInicio']);
    $uDto->setHoraFin($_POST['horaFin']);
    $uDto->setMotivoReserva($_POST['motivoReserva']);
    $uDto->setCantidadAsistentes($_POST['cantidadAsistentes']);
    $uDto->setInvitadosExternos($_POST['invitadosExternos']);
    $uDto->setAceptaReglamento($_POST['aceptaReglamento']);
    $uDto->setEstadoId($_POST['estadoId']);
    $uDto->setDocumentoSolicitante($_POST['documentoSolicitante']);

    $uDao = new ReservasAreasDao();
    $mensaje = $uDao->insertar($uDto);

    // Redirigir con mensaje
    header("Location:../vistas/rolAdmi/areascomunes.php?mensaje=" . urlencode("Reserva registrada correctamente. " . $mensaje));
    exit;
} elseif (isset($_POST['modificarReserva'])) {
    $uDto = new ReservasAreasDto();
    $uDto->setIdReservas($_POST['idReservas']);
    $uDto->setApartamentoId($_POST['apartamentoId']);
    $uDto->setAreaComunId($_POST['areaComunId']);
    $uDto->setFechaReserva($_POST['fechaReserva']);
    $uDto->setHoraInicio($_POST['horaInicio']);
    $uDto->setHoraFin($_POST['horaFin']);
    $uDto->setMotivoReserva($_POST['motivoReserva']);
    $uDto->setCantidadAsistentes($_POST['cantidadAsistentes']);
    $uDto->setInvitadosExternos($_POST['invitadosExternos']);
    $uDto->setAceptaReglamento($_POST['aceptaReglamento']);
    $uDto->setEstadoId($_POST['estadoId']);
    $uDto->setDocumentoSolicitante($_POST['documentoSolicitante']);
     $sDto = new SolicitanteDto();
    $sDto->setDocumentoSolicitante($_POST['documentoSolicitante']);
    $sDto->setNombreSolicitante($_POST['nombreSolicitante']);
    $sDto->setTelefonoSolicitante($_POST['telefonoSolicitante']);
   $nombreArea = $_POST['nombreArea']; // <- nueva línea para capturar el nombre que escribió el usuario

    // ✅ Pasas ambos objetos al método
$mensaje = $uDao->modificar($uDto, $sDto, $nombreArea);



   
   

   
    header("Location:../vistas/rolAdmi/areascomunes.php?mensaje=".urlencode($mensaje));

    exit;
    
}
elseif (isset($_GET['eliminar'])) {
    $id = $_GET['eliminar'];
    $mensaje = $uDao->eliminar($id);
    header("Location:../vistas/rolAdmi/areascomunes.php?mensaje=" . urlencode("Reserva eliminada correctamente"));
    exit;
}



?>