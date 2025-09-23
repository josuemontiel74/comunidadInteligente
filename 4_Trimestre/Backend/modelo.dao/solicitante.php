<?php
class SolicitanteDao {
    public function insertar(SolicitanteDto $dto) {
        $cnn = conexion::conectar();
        $mensaje = "";

        try {
            $verificar = $cnn->prepare("SELECT 1 FROM solicitante WHERE documentoSolicitante = ?");
            $verificar->bindValue(1, $dto->getDocumentoSolicitante());
            $verificar->execute();

            if ($verificar->fetch()) {
                $mensaje = "El solicitante ya existe.";
            } else {
                $query = $cnn->prepare("INSERT INTO solicitante 
                    (documentoSolicitante, nombreSolicitante, telefonoSolicitante, correoSolicitante, tipoDocumentoId) 
                    VALUES (?, ?, ?, ?, ?)");

                $query->bindValue(1, $dto->getDocumentoSolicitante());
                $query->bindValue(2, $dto->getNombreSolicitante());
                $query->bindValue(3, $dto->getTelefonoSolicitante());
                $query->bindValue(4, $dto->getCorreoSolicitante());
                $query->bindValue(5, $dto->getTipoDocumentoId());

                $query->execute();
                $mensaje = "Solicitante registrado correctamente.";
            }

        } catch (PDOException $e) {
            $mensaje = "Error al insertar solicitante: " . $e->getMessage();
        }

        $cnn = null;
        return $mensaje;
    }
}
?>