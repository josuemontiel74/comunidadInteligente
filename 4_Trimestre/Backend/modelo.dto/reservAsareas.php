<?php
class ReservasAreasDto {
    private $idReservas;
    private $apartamentoId;
    private $areaComunId;
    private $fechaReserva;
    private $horaInicio;
    private $horaFin;
    private $motivoReserva;
    private $cantidadAsistentes;
    private $invitadosExternos;
    private $aceptaReglamento;
    private $estadoId;
    private $documentoSolicitante;

    // idReservas (PK)
    public function getIdReservas() {
        return $this->idReservas;
    }

    public function setIdReservas($idReservas) {
        $this->idReservas = $idReservas;
    }

    // apartamentoId (FK)
    public function getApartamentoId() {
        return $this->apartamentoId;
    }

    public function setApartamentoId($apartamentoId) {
        $this->apartamentoId = $apartamentoId;
    }

    // areaComunId (FK)
    public function getAreaComunId() {
        return $this->areaComunId;
    }

    public function setAreaComunId($areaComunId) {
        $this->areaComunId = $areaComunId;
    }

    // fechaReserva
    public function getFechaReserva() {
        return $this->fechaReserva;
    }

    public function setFechaReserva($fechaReserva) {
        $this->fechaReserva = $fechaReserva;
    }

    // horaInicio
    public function getHoraInicio() {
        return $this->horaInicio;
    }

    public function setHoraInicio($horaInicio) {
        $this->horaInicio = $horaInicio;
    }

    // horaFin
    public function getHoraFin() {
        return $this->horaFin;
    }

    public function setHoraFin($horaFin) {
        $this->horaFin = $horaFin;
    }

    // motivoReserva
    public function getMotivoReserva() {
        return $this->motivoReserva;
    }

    public function setMotivoReserva($motivoReserva) {
        $this->motivoReserva = $motivoReserva;
    }

    // cantidadAsistentes
    public function getCantidadAsistentes() {
        return $this->cantidadAsistentes;
    }

    public function setCantidadAsistentes($cantidadAsistentes) {
        $this->cantidadAsistentes = $cantidadAsistentes;
    }

    // invitadosExternos
    public function getInvitadosExternos() {
        return $this->invitadosExternos;
    }

    public function setInvitadosExternos($invitadosExternos) {
        $this->invitadosExternos = $invitadosExternos;
    }

    // aceptaReglamento
    public function getAceptaReglamento() {
        return $this->aceptaReglamento;
    }

    public function setAceptaReglamento($aceptaReglamento) {
        $this->aceptaReglamento = $aceptaReglamento;
    }

    // estadoId (FK)
    public function getEstadoId() {
        return $this->estadoId;
    }

    public function setEstadoId($estadoId) {
        $this->estadoId = $estadoId;
    }

    // documentoSolicitante (FK)
    public function getDocumentoSolicitante() {
        return $this->documentoSolicitante;
    }

    public function setDocumentoSolicitante($documentoSolicitante) {
        $this->documentoSolicitante = $documentoSolicitante;
    }
}
?>
