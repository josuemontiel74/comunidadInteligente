<?php
class ReservasAreasDao{
    public function insertar($reservasareasDto) {
    $cnn = conexion::conectar();
    $mensaje = "";

    try {
        $query = $cnn->prepare("INSERT INTO reservasareas (
            apartamentoId, areaComunId, fechaReserva, horaInicio, horaFin,
            motivoReserva, cantidadAsistentes, invitadosExternos,
            aceptaReglamento, estadoId, documentoSolicitante
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $query->bindParam(1, $reservasareasDto->getApartamentoId());
        $query->bindParam(2, $reservasareasDto->getAreaComunId());
        $query->bindParam(3, $reservasareasDto->getFechaReserva());
        $query->bindParam(4, $reservasareasDto->getHoraInicio());
        $query->bindParam(5, $reservasareasDto->getHoraFin());
        $query->bindParam(6, $reservasareasDto->getMotivoReserva());
        $query->bindParam(7, $reservasareasDto->getCantidadAsistentes());
        $query->bindParam(8, $reservasareasDto->getInvitadosExternos());
        $query->bindParam(9, $reservasareasDto->getAceptaReglamento());
        $query->bindParam(10, $reservasareasDto->getEstadoId());
        $query->bindParam(11, $reservasareasDto->getDocumentoSolicitante());

        $query->execute();
        $mensaje = "Reserva registrada con éxito.";
    } catch (PDOException $ex) {
        $mensaje = "Error al insertar reserva: " . $ex->getMessage();
    }

    $cnn = null;
    return $mensaje;
}

    
    public function mostrasRegistro(){
        $cnn = conexion::conectar();
        $mensaje = "";
        try{
           $mostrarRegistro = 'SELECT a.idReservas, c.nombreArea,s.nombreSolicitante,s.telefonoSolicitante,a.FechaReserva,a.horaInicio,a.horaFin,a.motivoReserva,a.cantidadAsistentes
from reservasareas a inner join areacomun c on a.areaComunId = c.idAreaComun inner join solicitante s on s.documentoSolicitante = a.documentoSolicitante;';
           $query  = $cnn ->prepare($mostrarRegistro) ;
           $query ->execute();
          return $query->fetchAll();
        } catch (Exception $ex) {
             echo 'Error'.$ex->getMessage();
         }
    }
public function modificar(ReservasAreasDto $reservasareasDto, SolicitanteDto $solicitanteDto) {
    $cnn = conexion::conectar();
    $mensaje = "";

    try {
        $query = $cnn->prepare("UPDATE reservasareas SET 
            apartamentoId = ?, 
            areaComunId = ?, 
            fechaReserva = ?, 
            horaInicio = ?, 
            horaFin = ?, 
            motivoReserva = ?, 
            cantidadAsistentes = ?, 
            invitadosExternos = ?, 
            aceptaReglamento = ?, 
            estadoId = ?, 
            documentoSolicitante = ?
            WHERE idReservas = ?");

        $query->bindValue(1, $reservasareasDto->getApartamentoId());
        $query->bindValue(2, $reservasareasDto->getAreaComunId());
        $query->bindValue(3, $reservasareasDto->getFechaReserva());
        $query->bindValue(4, $reservasareasDto->getHoraInicio());
        $query->bindValue(5, $reservasareasDto->getHoraFin());
        $query->bindValue(6, $reservasareasDto->getMotivoReserva());
        $query->bindValue(7, $reservasareasDto->getCantidadAsistentes());
        $query->bindValue(8, $reservasareasDto->getInvitadosExternos());
        $query->bindValue(9, $reservasareasDto->getAceptaReglamento());
        $query->bindValue(10, $reservasareasDto->getEstadoId());
        $query->bindValue(11, $reservasareasDto->getDocumentoSolicitante());
        $query->bindValue(12, $reservasareasDto->getIdReservas());

        $query->execute();

        // ✅ Solo actualiza el solicitante
        $query2 = $cnn->prepare("UPDATE solicitante SET nombreSolicitante = ?, telefonoSolicitante = ? WHERE documentoSolicitante = ?");
        $query2->execute([
            $solicitanteDto->getNombreSolicitante(),
            $solicitanteDto->getTelefonoSolicitante(),
            $solicitanteDto->getDocumentoSolicitante()
        ]);

        $mensaje = "Reserva modificada correctamente.";
    } catch (PDOException $ex) {
        $mensaje = "Error al actualizar: " . $ex->getMessage();
    }

    $cnn = null;
    return $mensaje;
}


public function buscarPorId($id) {
    $cnn = conexion::conectar();
    try {
        $sql = "SELECT 
                    a.idReservas,
                    a.apartamentoId,
                    a.areaComunId,
                    a.fechaReserva,
                    a.horaInicio,
                    a.horaFin,
                    a.motivoReserva,
                    a.cantidadAsistentes,
                    a.invitadosExternos,
                    a.aceptaReglamento,
                    a.estadoId,
                    a.documentoSolicitante,
                    c.nombreArea,
                    s.nombreSolicitante,
                    s.telefonoSolicitante
                FROM reservasareas a 
                INNER JOIN areacomun c ON a.areaComunId = c.idAreaComun 
                INNER JOIN solicitante s ON s.documentoSolicitante = a.documentoSolicitante 
                WHERE a.idReservas = ?";
        
        $query = $cnn->prepare($sql);
        $query->bindParam(1, $id, PDO::PARAM_INT);
        $query->execute();
        return $query->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        echo "Error al buscar la reserva: " . $e->getMessage();
        return null;
    }
}


    public function eliminar($id) {
        $cnn = conexion::conectar();
        $mensaje = "";
    
        try {
            $query = $cnn->prepare("DELETE FROM reservasareas WHERE idReservas = ?");
            $query->bindParam(1, $id, PDO::PARAM_INT);
            $query->execute();
        
        } catch (PDOException $ex) {
            $mensaje = "Error al eliminar: " . $ex->getMessage();
        }
    
        $cnn = null;
        return $mensaje;
    }
}