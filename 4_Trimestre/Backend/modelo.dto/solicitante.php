<?php
class SolicitanteDto {
    private $documentoSolicitante = 0;
    private $nombreSolicitante = "";
    private $telefonoSolicitante = "";
    private $correoSolicitante = "";
    private $tipoDocumentoId = 0;

    public function getDocumentoSolicitante() {
        return $this->documentoSolicitante;
    }

    public function setDocumentoSolicitante($documentoSolicitante) {
        $this->documentoSolicitante = $documentoSolicitante;
    }

    public function getNombreSolicitante() {
        return $this->nombreSolicitante;
    }

    public function setNombreSolicitante($nombreSolicitante) {
        $this->nombreSolicitante = $nombreSolicitante;
    }

    public function getTelefonoSolicitante() {
        return $this->telefonoSolicitante;
    }

    public function setTelefonoSolicitante($telefonoSolicitante) {
        $this->telefonoSolicitante = $telefonoSolicitante;
    }

    public function getCorreoSolicitante() {
        return $this->correoSolicitante;
    }

    public function setCorreoSolicitante($correoSolicitante) {
        $this->correoSolicitante = $correoSolicitante;
    }

    public function getTipoDocumentoId() {
        return $this->tipoDocumentoId;
    }

    public function setTipoDocumentoId($tipoDocumentoId) {
        $this->tipoDocumentoId = $tipoDocumentoId;
    }
}
