<?php
class personaDto{

   private  $numeroDocumento = ""; // PK
   private  $tipoDocumentoId = 0; // FK
   private   $primerNombre = ""; 
   private  $segundoNombre = "";
   private  $primerApellido = ""; 
   private  $segundoApellido  = "";
   private  $telefono = "";
   private  $correoElectronico = "";

   public function getNumeroDocumento() {
       return $this->numeroDocumento;
   }
   public function getTipoDocumentoId() {
       return $this->tipoDocumentoId;
   }
   public function getPrimerNombre() {
    return $this->primerNombre;
   }
   public function getSegundoNombre() {
    return $this->segundoNombre;
   }
   public function getPrimerApellido() {
    return $this->primerApellido;
   }
   public function getSegundoApellido() {
    return $this->segundoApellido;
   }
    public function getTelefono() {
     return $this->telefono;
    }
    public function getCorreoElectronico() {
     return $this->correoElectronico;
    }
    public function setNumeroDocumento($numeroDocumento) {
        $this->numeroDocumento = $numeroDocumento;
    }
    public function setTipoDocumentoId($tipoDocumentoId) {
        $this->tipoDocumentoId = $tipoDocumentoId;
    }
    public function setPrimerNombre($primerNombre) {
        $this->primerNombre = $primerNombre;
    }
    public function setSegundoNombre($segundoNombre) {
        $this->segundoNombre = $segundoNombre;
    }
    public function setPrimerApellido($primerApellido) {
        $this->primerApellido = $primerApellido;
    }
    public function setSegundoApellido($segundoApellido) {
        $this->segundoApellido = $segundoApellido;
    }
    public function setTelefono($telefono) {
        $this->telefono = $telefono;
    }
    public function setCorreoElectronico($correoElectronico)
    {
        $this->correoElectronico = $correoElectronico;
    }
}
