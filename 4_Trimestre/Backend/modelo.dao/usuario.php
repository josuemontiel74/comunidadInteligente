<?php
class UsuariosDao {
    private $cnn;

    public function __construct() {
        $this->cnn = conexion::conectar();
    }

    public function obtenerUsuarioPorUsername($username) {
        $query = $this->cnn->prepare("SELECT * FROM usuarios WHERE username = ?");
        $query->bindParam(1, $username, PDO::PARAM_STR);
        $query->execute();
        return $query->fetch(PDO::FETCH_ASSOC);
    }
    public function insertar(UsuariosDto $dto) {
        try {
            $query = $this->cnn->prepare("INSERT INTO usuarios (username, numeroDocumento, rolesId, password, estadoId) 
                                          VALUES (?, ?, ?, ?, ?)");
            $query->bindValue(1, $dto->getUsername());
            $query->bindValue(2, $dto->getNumeroDocumento());
            $query->bindValue(3, $dto->getRolesId());
            $query->bindValue(4, $dto->getPassword());
            $query->bindValue(5, $dto->getEstadoId());

            return $query->execute(); // true si todo salió bien
        } catch (PDOException $e) {
            return "Error SQL: " . $e->getMessage();
        }
    }
}



?>