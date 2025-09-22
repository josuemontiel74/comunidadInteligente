<?php
class usuariosDto{
    private $username = "";
    private $numeroDocumento  ="";
    private $rolesId =0;
    private $password ="";
    private $estadoId = 0;

 public function getusername(){
    return $this -> username;
 }
 public function getnumeroDocumento(){
    return $this -> numeroDocumento;
 }
 public function getrolesId(){
    return $this -> rolesId;
 }
 public function getpassword(){
    return $this -> password;
 }
 public function getestadoId(){
    return $this -> estadoId;
 }
public function setusername($username){
    $this->username = $username;
}
public function setnumeroDocumento($numeroDocumento){
    $this->numeroDocumento = $numeroDocumento;
}
public function setrolesId($rolesId){
    $this->rolesId = $rolesId;
}
public function setpassword($password){
    $this->password = $password;
}
public function setestadoId($estadoId){
    $this->estadoId = $estadoId;
}
}