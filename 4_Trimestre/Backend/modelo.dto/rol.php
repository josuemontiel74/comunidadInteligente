<?php
class rolesDto {
    private $idRol = 0;
    private $nombreRol = "";

    public  function getIdRol(){
    return $this-> idRol;
    } 
     public function setIdRol($idRol){
        $this -> idRol = $idRol;
     }
     public function getNombreRol(){
        return $this -> nombreRol;
     }
   
    public function setNombreRol($nombreRol){
        $this->nombreRol = $nombreRol;
    }

}

