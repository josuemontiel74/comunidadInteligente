-- Script para crear la base de datos "comunidadInteligente"
-- Este script crea las tablas necesarias para gestionar una comunidad inteligente
-- Autor: Josue Montiel
-- Fecha: 06-07-2025

CREATE SCHEMA comunidadInteligente DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE comunidadInteligente;

-- Creación de las tablas
-- Tabla de tipos de documentos
-- Esta tabla almacena los diferentes tipos de documentos que pueden tener las personas
-- como cédula, pasaporte, etc.
CREATE TABLE tipoDocumentos (
  idTipoDocumento INT AUTO_INCREMENT PRIMARY KEY,
  nombreDocumento VARCHAR(30) NOT NULL UNIQUE,
  abreviatura VARCHAR(5) NOT NULL UNIQUE
);

-- Tabla de roles
-- Esta tabla almacena los diferentes roles que pueden tener los usuarios en el sistema,
-- como administrador, residente, etc.
CREATE TABLE roles (
  idRol INT AUTO_INCREMENT PRIMARY KEY,
  nombreRol VARCHAR(45) NOT NULL UNIQUE
);

-- Tabla de permisos
-- Esta tabla almacena los diferentes permisos que pueden asignarse a los roles,
-- como acceso a áreas comunes, gestión de visitantes, etc.
CREATE TABLE permisos (
  idPermiso INT AUTO_INCREMENT PRIMARY KEY,
  nombrePermiso VARCHAR(45) NOT NULL UNIQUE
);

-- Tabla de roles y permisos
-- Esta tabla relaciona los roles con los permisos que tienen asignados,
-- permitiendo una gestión flexible de los accesos y funcionalidades del sistema.
CREATE TABLE rolesPermisos (
  idRol INT NOT NULL,
  idPermiso INT NOT NULL,
  PRIMARY KEY (idRol, idPermiso),
  FOREIGN KEY (idRol) REFERENCES roles (idRol),
  FOREIGN KEY (idPermiso) REFERENCES permisos (idPermiso)
);

-- Tabla de estados
-- Esta tabla almacena los diferentes estados que pueden tener los apartamentos,
-- ocupantes, vehículos, parqueaderos, etc., como activo, inactivo, reservado, etc.
CREATE TABLE estados (
  idEstado INT AUTO_INCREMENT PRIMARY KEY,
  nombreEstado VARCHAR(20) NOT NULL
);

-- Tabla de torres
-- Esta tabla almacena las diferentes torres del conjunto residencial,
-- cada torre puede tener varios apartamentos asociados.
CREATE TABLE torres (
  idTorre INT AUTO_INCREMENT PRIMARY KEY,
  nombreTorre VARCHAR(15) NOT NULL UNIQUE
);

-- Tabla de apartamentos
-- Esta tabla almacena los apartamentos del conjunto residencial,
-- cada apartamento está asociado a una torre y tiene un estado.
CREATE TABLE apartamentos (
  idApartamento INT AUTO_INCREMENT PRIMARY KEY,
  torresId INT NOT NULL,
  numeroApartamento VARCHAR(10) NOT NULL UNIQUE,
  estadoId INT NOT NULL,
  FOREIGN KEY (torresId) REFERENCES torres (idTorre),
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado)
);

-- Tabla de personas
-- Esta tabla almacena la información de las personas que pueden ser ocupantes,
-- propietarios o arrendatarios de los apartamentos, incluyendo su tipo de documento,
-- nombres, apellidos, teléfono y correo electrónico.
CREATE TABLE personas (
  numeroDocumento VARCHAR(20) PRIMARY KEY,
  tipoDocumentoId INT NOT NULL,
  primerNombre VARCHAR(20) NOT NULL,
  segundoNombre VARCHAR(45),
  primerApellido VARCHAR(30) NOT NULL,
  segundoApellido VARCHAR(30),
  telefono VARCHAR(10) NOT NULL,
  correoElectronico VARCHAR(45) UNIQUE,
  FOREIGN KEY (tipoDocumentoId) REFERENCES tipoDocumentos (idTipoDocumento)
);

-- Tabla de ocupantes
-- Esta tabla almacena la información de los ocupantes de los apartamentos,
-- incluyendo su número de documento, tipo de ocupación (propietario o arrendatario),
CREATE TABLE ocupante (
  idOcupante INT AUTO_INCREMENT PRIMARY KEY,
  apartamentosId INT NOT NULL,
  numeroDocumento VARCHAR(20) NOT NULL,
  tipoOcupacion ENUM('propietario', 'arrendatario') NOT NULL,
  personasACargo TINYINT,
  fechaInicio DATE NOT NULL,
  fechaFin DATE,
  estadoId INT NOT NULL,
  FOREIGN KEY (apartamentosId) REFERENCES apartamentos (idApartamento),
  FOREIGN KEY (numeroDocumento) REFERENCES personas (numeroDocumento),
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado)
);

-- Tabla de usuarios
-- Esta tabla almacena la información de los usuarios del sistema,
-- incluyendo su nombre de usuario, número de documento, roles asignados,
-- contraseña y estado del usuario.
CREATE TABLE usuarios (
  username VARCHAR(45) PRIMARY KEY,
  numeroDocumento VARCHAR(20) NOT NULL UNIQUE,
  rolesId INT NOT NULL,
  password VARCHAR(255) NOT NULL,
  estadoId INT NOT NULL,
  FOREIGN KEY (rolesId) REFERENCES roles (idRol),
  FOREIGN KEY (numeroDocumento) REFERENCES personas (numeroDocumento),
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado)
);

-- Tabla de vehículos
-- Esta tabla almacena la información de los vehículos asociados a los apartamentos,
-- incluyendo su matrícula, tipo de vehículo, parqueadero asignado y estado del vehículo.
CREATE TABLE tiposVehiculo (
  idTipoVehiculo INT AUTO_INCREMENT PRIMARY KEY,
  nombreVehiculo VARCHAR(30) NOT NULL
);

-- Tabla de parqueaderos
-- Esta tabla almacena los parqueaderos disponibles en el conjunto residencial,
-- incluyendo su código, tipo de vehículo permitido y estado del parqueadero.
-- Cada parqueadero puede estar asociado a un tipo de vehículo y tener un estado.
CREATE TABLE parqueaderos (
  codigoParqueadero VARCHAR(10) PRIMARY KEY,
  tipoVehiculoId INT NOT NULL,
  estadoId INT NOT NULL,
  FOREIGN KEY (tipoVehiculoId) REFERENCES tiposVehiculo (idTipoVehiculo),
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado)
);

-- Tabla de vehículos
-- Esta tabla almacena la información de los vehículos registrados en el sistema,
-- incluyendo su matrícula, tipo de vehículo, parqueadero asignado y estado del vehículo.
-- Cada vehículo está asociado a un tipo de vehículo y a un parqueadero específico.
CREATE TABLE vehiculo (
  matricula VARCHAR(10) PRIMARY KEY,
  tipoVehiculoId INT NOT NULL,
  codigoParqueadero VARCHAR(10) NOT NULL,
  FOREIGN KEY (tipoVehiculoId) REFERENCES tiposVehiculo (idTipoVehiculo),
  FOREIGN KEY (codigoParqueadero) REFERENCES parqueaderos (codigoParqueadero)
);

-- Tabla de visitantes
-- Esta tabla almacena la información de los visitantes que ingresan al conjunto residencial,
-- incluyendo su número de documento, nombre, tipo de documento y estado del visitante.
CREATE TABLE Visitantes (
  numeroDocumento VARCHAR(20) PRIMARY KEY,
  nombreVisitante VARCHAR(100) NOT NULL,
  tipoDocumentoId INT NOT NULL,
  FOREIGN KEY (tipoDocumentoId) REFERENCES tipoDocumentos (idTipoDocumento)
);

-- Tabla de visitas
-- Esta tabla almacena la información de las visitas realizadas por los visitantes,
-- incluyendo el número de documento del visitante, apartamento visitado,
-- fecha y hora de ingreso, fecha y hora de salida, matrícula del vehículo (si aplica)
-- y estado de la visita. Cada visita está asociada a un apartamento, un estado y un vehículo.
CREATE TABLE Visitas (
  idVisita INT AUTO_INCREMENT PRIMARY KEY,
  numeroDocumento VARCHAR(20) NOT NULL,
  apartamentoId INT NOT NULL,
  fechaHoraIngreso DATETIME NOT NULL,
  fechaHoraSalida DATETIME,
  vehiculoMatricula VARCHAR(10),
  estadoId INT NOT NULL,
  FOREIGN KEY (apartamentoId) REFERENCES apartamentos (idApartamento),
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado),
  FOREIGN KEY (vehiculoMatricula) REFERENCES vehiculo (matricula),
  FOREIGN KEY (numeroDocumento) REFERENCES Visitantes (numeroDocumento)
);

-- Tabla de recepción de paquetes
-- Esta tabla almacena la información de los paquetes recibidos en el conjunto residencial,
-- incluyendo el apartamento al que se entrega, nombre del destinatario, empresa de mensajería,
-- fecha de recepción, fecha de entrega (si aplica), observaciones y estado del paquete.
CREATE TABLE recepcionPaquetes (
  idPaquete INT AUTO_INCREMENT PRIMARY KEY,
  apartamentoId INT NOT NULL,
  nombreDestinatario VARCHAR(100) NOT NULL,
  empresaMensajeria VARCHAR(45) NOT NULL,
  fechaRecepcion DATETIME NOT NULL,
  fechaEntrega DATETIME,
  observaciones TEXT,
  estadoId INT NOT NULL,
  FOREIGN KEY (apartamentoId) REFERENCES apartamentos (idApartamento),
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado)
);

-- Tabla de áreas comunes
-- Esta tabla almacena la información de las áreas comunes del conjunto residencial,
-- incluyendo su nombre, descripción, capacidad y estado. Cada área común puede ser reservada
-- por los residentes para eventos o actividades.
CREATE TABLE areaComun (
  idAreaComun INT AUTO_INCREMENT PRIMARY KEY,
  nombreArea VARCHAR(45) NOT NULL,
  descripcion TEXT NOT NULL,
  capacidad TINYINT NOT NULL,
  estadoId INT NOT NULL,
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado)
);

-- Tabla de solicitantes
-- Esta tabla almacena la información de los solicitantes que realizan reservas de áreas comunes,
-- incluyendo su número de documento, nombre, teléfono, correo electrónico y tipo de documento.
CREATE TABLE solicitante (
  documentoSolicitante VARCHAR(20) PRIMARY KEY,
  nombreSolicitante VARCHAR(100) NOT NULL,
  telefonoSolicitante VARCHAR(20) NOT NULL,
  correoSolicitante VARCHAR(100) NOT NULL,
  tipoDocumentoId INT NOT NULL,
  FOREIGN KEY (tipoDocumentoId) REFERENCES tipoDocumentos (idTipoDocumento)
);

-- Tabla de reservas de áreas comunes
-- Esta tabla almacena las reservas realizadas por los solicitantes para las áreas comunes,
-- incluyendo el apartamento del solicitante, área común reservada, fecha y hora de la reserva,
-- motivo de la reserva, cantidad de asistentes, si hay invitados externos, aceptación del reglamento
-- y estado de la reserva. Cada reserva está asociada a un apartamento, un área común,
-- un estado y un solicitante.
CREATE TABLE reservasAreas (
  idReservas INT AUTO_INCREMENT PRIMARY KEY,
  apartamentoId INT NOT NULL,
  areaComunId INT NOT NULL,
  fechaReserva DATE NOT NULL,
  horaInicio TIME NOT NULL,
  horaFin TIME NOT NULL,
  motivoReserva VARCHAR(100) NOT NULL,
  cantidadAsistentes TINYINT NOT NULL,
  invitadosExternos TINYINT(1) NOT NULL,
  aceptaReglamento TINYINT(1) NOT NULL,
  estadoId INT NOT NULL,
  documentoSolicitante VARCHAR(20) NOT NULL,
  FOREIGN KEY (apartamentoId) REFERENCES apartamentos (idApartamento),
  FOREIGN KEY (areaComunId) REFERENCES areaComun (idAreaComun),
  FOREIGN KEY (estadoId) REFERENCES estados (idEstado),
  FOREIGN KEY (documentoSolicitante) REFERENCES solicitante (documentoSolicitante)
);

-- Función para encriptar contraseñas
-- Esta función utiliza el algoritmo SHA-256 para encriptar las contraseñas de los
DELIMITER //

CREATE FUNCTION encriptarContrasena(contrasena VARCHAR(255))
RETURNS VARCHAR(64)
DETERMINISTIC
BEGIN
  RETURN SHA2(contrasena, 256);
END //

DELIMITER ;
