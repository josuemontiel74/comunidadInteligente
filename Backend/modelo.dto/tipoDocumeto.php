<?php
class tipoDocumentos{
    public $idtipoDocumeto = ""; // PK
    public $nombreDocumento = ""; // Nombre del tipo de documento
    public $abreviatura = ""; // Abreviatura del tipo de documento
   
    public function getIdtipoDocumento(){
        return $this -> idtipoDocumeto;
    }
    public function setIdtipoDocumento($idtipoDocumento){
        $this -> idtipoDocumento = $idtipoDocumento;
    }
    public function getnombreDocumento(){
        return $this -> nombreDocumento;
    }
    public function setnombreDocumento($nombreDocumento){
        $this -> nombreDocumento = $nombreDocumento;
    }
    public function getabreviatura(){
        return $this -> abreviatura;
    }
    private function setabreviatura($abreviatura){
        $this -> abreviatura = $abreviatura;
    }
}
?>