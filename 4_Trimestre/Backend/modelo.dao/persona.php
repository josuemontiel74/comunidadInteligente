<?php 

 class PersonaDao {
    public function insertar($personaDto) {
        $cnn = conexion::conectar();
        $mensaje = "";

        try {
            $query = $cnn->prepare("INSERT INTO persona VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $query->bindParam(1, $personaDto->getNumeroDocumento());
            $query->bindParam(2, $personaDto->getTipoDocumentoId());
            $query->bindParam(3, $personaDto->getPrimerNombre());
            $query->bindParam(4, $personaDto->getSegundoNombre());
            $query->bindParam(5, $personaDto->getPrimerApellido());
            $query->bindParam(6, $personaDto->getSegundoApellido());
            $query->bindParam(7, $personaDto->getTelefono());
            $query->bindParam(8, $personaDto->getCorreoElectronico());
            $query->execute();
        } catch (PDOException $ex) {
            $mensaje = "Error al preparar la consulta: " . $ex->getMessage();
        }

        $cnn = null;
        return $mensaje;
    }
}