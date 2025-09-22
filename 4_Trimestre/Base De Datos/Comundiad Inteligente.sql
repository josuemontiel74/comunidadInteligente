CREATE DATABASE  IF NOT EXISTS `comunidadinteligente` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_bin */;
USE `comunidadinteligente`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: comunidadinteligente
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `apartamentos`
--

DROP TABLE IF EXISTS `apartamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apartamentos` (
  `idApartamento` int(11) NOT NULL AUTO_INCREMENT,
  `torresId` int(11) NOT NULL,
  `numeroApartamento` varchar(10) NOT NULL,
  `estadoId` int(11) NOT NULL,
  PRIMARY KEY (`idApartamento`),
  UNIQUE KEY `numeroApartamento` (`numeroApartamento`),
  KEY `torresId` (`torresId`),
  KEY `estadoId` (`estadoId`),
  CONSTRAINT `apartamentos_ibfk_1` FOREIGN KEY (`torresId`) REFERENCES `torres` (`idTorre`),
  CONSTRAINT `apartamentos_ibfk_2` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apartamentos`
--

LOCK TABLES `apartamentos` WRITE;
/*!40000 ALTER TABLE `apartamentos` DISABLE KEYS */;
INSERT INTO `apartamentos` VALUES (1,1,'101',3),(2,1,'102',3),(3,1,'103',4),(4,1,'104',3),(5,1,'105',3),(6,2,'201',3),(7,2,'202',3),(8,2,'203',4),(9,2,'204',3),(10,2,'205',3),(11,3,'301',3),(12,3,'302',3),(13,3,'303',3),(14,3,'304',4),(15,3,'305',3),(16,4,'401',3),(17,4,'402',3),(18,4,'403',4),(19,4,'404',3),(20,4,'405',3),(21,5,'501',3),(22,5,'502',3),(23,5,'503',3),(24,5,'504',4),(25,5,'505',3),(26,6,'601',3),(27,6,'602',3),(28,6,'603',4),(29,6,'604',3),(30,6,'605',3),(31,7,'701',3),(32,7,'702',3),(33,7,'703',3),(34,7,'704',4),(35,7,'705',3),(36,8,'801',3),(37,8,'802',3),(38,8,'803',3),(39,8,'804',4),(40,8,'805',3),(41,9,'901',3),(42,9,'902',3),(43,9,'903',4),(44,9,'904',3),(45,9,'905',3),(46,10,'1001',3),(47,10,'1002',3),(48,10,'1003',4),(49,10,'1004',3),(50,10,'1005',3);
/*!40000 ALTER TABLE `apartamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areacomun`
--

DROP TABLE IF EXISTS `areacomun`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areacomun` (
  `idAreaComun` int(11) NOT NULL AUTO_INCREMENT,
  `nombreArea` varchar(45) NOT NULL,
  `descripcion` text NOT NULL,
  `capacidad` tinyint(4) NOT NULL,
  `estadoId` int(11) NOT NULL,
  PRIMARY KEY (`idAreaComun`),
  KEY `estadoId` (`estadoId`),
  CONSTRAINT `areacomun_ibfk_1` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areacomun`
--

LOCK TABLES `areacomun` WRITE;
/*!40000 ALTER TABLE `areacomun` DISABLE KEYS */;
INSERT INTO `areacomun` VALUES (1,'Salón Comunal 1','Salón amplio con mobiliario y aire acondicionado, ideal para eventos.',50,4),(2,'Salón Comunal 2','Espacio cerrado con ventilación natural, ideal para reuniones pequeñas.',40,4),(3,'Zona BBQ','Área al aire libre con parrilla y mesas, perfecta para celebraciones familiares.',25,4);
/*!40000 ALTER TABLE `areacomun` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estados`
--

DROP TABLE IF EXISTS `estados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados` (
  `idEstado` int(11) NOT NULL AUTO_INCREMENT,
  `nombreEstado` varchar(20) NOT NULL,
  PRIMARY KEY (`idEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estados`
--

LOCK TABLES `estados` WRITE;
/*!40000 ALTER TABLE `estados` DISABLE KEYS */;
INSERT INTO `estados` VALUES (1,'activo'),(2,'inactivo'),(3,'ocupado'),(4,'disponible'),(5,'activa'),(6,'finalizada'),(7,'registrada'),(8,'en curso'),(9,'finalizada'),(10,'rechazada'),(11,'pendiente'),(12,'aprobada'),(13,'cancelada'),(14,'recibido'),(15,'entregado'),(16,'activo'),(17,'inactivo');
/*!40000 ALTER TABLE `estados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocupante`
--

DROP TABLE IF EXISTS `ocupante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocupante` (
  `idOcupante` int(11) NOT NULL AUTO_INCREMENT,
  `apartamentosId` int(11) NOT NULL,
  `numeroDocumento` varchar(20) NOT NULL,
  `tipoOcupacion` enum('propietario','arrendatario') NOT NULL,
  `personasACargo` tinyint(4) DEFAULT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date DEFAULT NULL,
  `estadoId` int(11) NOT NULL,
  PRIMARY KEY (`idOcupante`),
  KEY `apartamentosId` (`apartamentosId`),
  KEY `numeroDocumento` (`numeroDocumento`),
  KEY `estadoId` (`estadoId`),
  CONSTRAINT `ocupante_ibfk_1` FOREIGN KEY (`apartamentosId`) REFERENCES `apartamentos` (`idApartamento`),
  CONSTRAINT `ocupante_ibfk_2` FOREIGN KEY (`numeroDocumento`) REFERENCES `personas` (`numeroDocumento`),
  CONSTRAINT `ocupante_ibfk_3` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocupante`
--

LOCK TABLES `ocupante` WRITE;
/*!40000 ALTER TABLE `ocupante` DISABLE KEYS */;
INSERT INTO `ocupante` VALUES (1,1,'1032485764','propietario',2,'2022-03-01',NULL,5),(2,2,'CE980112376','arrendatario',0,'2023-01-15',NULL,5),(3,4,'PP83922911','propietario',1,'2021-11-10','2024-01-10',6),(4,5,'PEP10241766','arrendatario',3,'2024-05-01',NULL,5),(5,6,'PPT80244966','propietario',2,'2022-03-12',NULL,5),(6,7,'1043910845','arrendatario',0,'2023-07-01',NULL,5),(7,8,'CE723844982','propietario',1,'2022-10-23',NULL,5),(8,9,'PP54821012','propietario',0,'2022-09-09',NULL,5),(9,10,'PPT73849652','arrendatario',2,'2023-12-01',NULL,5),(10,11,'PEP66298110','propietario',3,'2021-02-20',NULL,5),(11,12,'1015678910','arrendatario',1,'2023-08-01','2024-06-01',6),(12,13,'CE884192793','propietario',2,'2023-06-01',NULL,5),(13,14,'PP72319805','arrendatario',0,'2022-04-10',NULL,5),(14,15,'PPT98300145','propietario',2,'2023-03-15',NULL,5),(15,16,'PEP78114392','propietario',1,'2022-01-25',NULL,5),(16,17,'1010039108','arrendatario',2,'2023-06-17',NULL,5),(17,18,'CE998233471','propietario',0,'2023-09-01',NULL,5),(18,19,'PP63801181','propietario',3,'2024-02-01',NULL,5),(19,20,'PPT88422119','arrendatario',1,'2023-07-01',NULL,5),(20,21,'PEP42998229','propietario',0,'2023-10-01',NULL,5),(21,22,'1020040001','arrendatario',2,'2022-08-01',NULL,5),(22,23,'CE848222193','propietario',1,'2024-01-01',NULL,5),(23,24,'PP55301290','arrendatario',0,'2023-03-01',NULL,5),(24,25,'PPT74829110','propietario',2,'2022-12-10',NULL,5),(25,26,'PEP88200349','arrendatario',1,'2023-02-15',NULL,5),(26,27,'1020040002','propietario',2,'2023-09-01',NULL,5),(27,28,'CE771200984','arrendatario',0,'2022-06-01',NULL,5),(28,29,'PP72218900','propietario',3,'2021-09-01','2023-10-01',6),(29,30,'PPT71299130','arrendatario',1,'2023-01-01',NULL,5),(30,31,'PEP62981932','propietario',0,'2023-03-01',NULL,5),(31,32,'1020040003','arrendatario',1,'2022-05-01',NULL,5),(32,33,'CE854199201','propietario',2,'2023-04-01',NULL,5),(33,34,'PP61139821','arrendatario',1,'2024-03-01',NULL,5),(34,35,'PPT78421133','propietario',2,'2021-10-01',NULL,5),(35,36,'PEP88321914','propietario',0,'2023-01-01',NULL,5),(36,37,'1020040004','arrendatario',2,'2022-11-01',NULL,5),(37,38,'CE793012834','propietario',3,'2023-09-01',NULL,5),(38,39,'PP81293822','arrendatario',0,'2023-07-01',NULL,5),(39,40,'PPT71928300','propietario',1,'2023-08-01',NULL,5),(40,41,'PEP71821190','arrendatario',2,'2022-01-01',NULL,5),(41,42,'1020040005','propietario',2,'2023-04-10',NULL,5),(42,43,'CE768120841','arrendatario',0,'2024-02-01',NULL,5),(43,44,'PP80091281','propietario',1,'2023-03-01',NULL,5),(44,45,'PPT63912388','arrendatario',3,'2022-06-01',NULL,5),(45,46,'PEP68821392','propietario',1,'2023-01-01',NULL,5),(46,47,'1020040006','arrendatario',2,'2022-09-01',NULL,5),(47,48,'CE799002831','propietario',0,'2023-08-01',NULL,5),(48,49,'PP79381290','arrendatario',3,'2022-03-01',NULL,5),(49,50,'PPT84128813','propietario',1,'2023-05-01',NULL,5);
/*!40000 ALTER TABLE `ocupante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parqueaderos`
--

DROP TABLE IF EXISTS `parqueaderos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parqueaderos` (
  `codigoParqueadero` varchar(10) NOT NULL,
  `tipoVehiculoId` int(11) NOT NULL,
  `estadoId` int(11) NOT NULL,
  PRIMARY KEY (`codigoParqueadero`),
  KEY `tipoVehiculoId` (`tipoVehiculoId`),
  KEY `estadoId` (`estadoId`),
  CONSTRAINT `parqueaderos_ibfk_1` FOREIGN KEY (`tipoVehiculoId`) REFERENCES `tiposvehiculo` (`idTipoVehiculo`),
  CONSTRAINT `parqueaderos_ibfk_2` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parqueaderos`
--

LOCK TABLES `parqueaderos` WRITE;
/*!40000 ALTER TABLE `parqueaderos` DISABLE KEYS */;
INSERT INTO `parqueaderos` VALUES ('PC001',1,3),('PC002',1,4),('PC003',1,3),('PC004',1,4),('PC005',1,3),('PC006',1,4),('PC007',1,3),('PC008',1,4),('PC009',1,3),('PC010',1,4),('PC011',1,3),('PC012',1,4),('PC013',1,3),('PC014',1,4),('PC015',1,3),('PC016',1,4),('PC017',1,3),('PC018',1,4),('PC019',1,3),('PC020',1,4),('PC021',1,3),('PC022',1,4),('PC023',1,3),('PC024',1,4),('PC025',1,3),('PM001',2,4),('PM002',2,3),('PM003',2,4),('PM004',2,3),('PM005',2,4),('PM006',2,3),('PM007',2,4),('PM008',2,3),('PM009',2,4),('PM010',2,3),('PM011',2,4),('PM012',2,3),('PM013',2,4),('PM014',2,3),('PM015',2,4),('PM016',2,3),('PM017',2,4),('PM018',2,3),('PM019',2,4),('PM020',2,3),('PM021',2,4),('PM022',2,3),('PM023',2,4),('PM024',2,3),('PM025',2,4);
/*!40000 ALTER TABLE `parqueaderos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `idPermiso` int(11) NOT NULL AUTO_INCREMENT,
  `nombrePermiso` varchar(45) NOT NULL,
  PRIMARY KEY (`idPermiso`),
  UNIQUE KEY `nombrePermiso` (`nombrePermiso`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (18,'consultar paquete'),(4,'consultar usuarios'),(12,'consultar visita'),(9,'crear nueva visita'),(5,'crear reserva'),(13,'crear residente'),(1,'crear usuarios'),(20,'editar paquete'),(6,'editar reserva'),(14,'editar residente'),(2,'editar usuarios'),(10,'editar visita'),(19,'eliminar registro paquete'),(7,'eliminar reserva'),(15,'eliminar residente'),(3,'eliminar usuarios'),(11,'eliminar visita'),(21,'generar reportes'),(17,'registrar nuevo paquete'),(16,'ver residentes'),(8,'ver áreas comunes');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `numeroDocumento` varchar(20) NOT NULL,
  `tipoDocumentoId` int(11) NOT NULL,
  `primerNombre` varchar(20) NOT NULL,
  `segundoNombre` varchar(45) DEFAULT NULL,
  `primerApellido` varchar(30) NOT NULL,
  `segundoApellido` varchar(30) DEFAULT NULL,
  `telefono` varchar(10) NOT NULL,
  `correoElectronico` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`numeroDocumento`),
  UNIQUE KEY `correoElectronico` (`correoElectronico`),
  KEY `tipoDocumentoId` (`tipoDocumentoId`),
  CONSTRAINT `personas_ibfk_1` FOREIGN KEY (`tipoDocumentoId`) REFERENCES `tipodocumentos` (`idTipoDocumento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personas`
--

LOCK TABLES `personas` WRITE;
/*!40000 ALTER TABLE `personas` DISABLE KEYS */;
INSERT INTO `personas` VALUES ('1010039108',1,'Fernanda','Lucía','Gil','Moreno','3056789012','fernanda.g@example.com'),('1015678910',1,'José','Fernando','Gutiérrez','Ramírez','3001234567','jose.g@example.com'),('1020040001',1,'Felipe','Javier','Gómez','Sánchez','3001111222','felipe.g@example.com'),('1020040002',1,'Nicole',NULL,'Fonseca',NULL,'3056661777','nicole.f@example.com'),('1020040003',1,'Ángel',NULL,'Bermúdez','Correa','3001122334','angel.b@example.com'),('1020040004',1,'Jennifer','Paola','Valencia','Uribe','3056677889','jennifer.v@example.com'),('1020040005',1,'Rafael',NULL,'Trujillo','Castañeda','3001122445','rafael.t@example.com'),('1020040006',1,'Angela',NULL,'Santacruz','Guerrero','3056677990','angela.s@example.com'),('1032485764',1,'Juan','Carlos','Torres','Gómez','3001112233','juan.torres@example.com'),('1043910845',1,'María','José','Pineda','Ortiz','3056667788','maria.p@example.com'),('1222222',1,'',NULL,'',NULL,'',NULL),('123123123',1,'',NULL,'',NULL,'',NULL),('123452025',1,'',NULL,'',NULL,'',NULL),('202020',1,'',NULL,'',NULL,'',NULL),('202021',1,'',NULL,'',NULL,'',NULL),('CE723844982',2,'Felipe',NULL,'Restrepo','Mejía','3067778899','felipe.r@example.com'),('CE768120841',2,'Paula','Natalia','Córdoba',NULL,'3012233556','paula.c@example.com'),('CE771200984',2,'Diego','Manuel','León','Espinosa','3067771888','diego.l@example.com'),('CE793012834',2,'Cristian',NULL,'Benítez','Granados','3067788990','cristian.b@example.com'),('CE799002831',2,'Gustavo','Emilio','Santos','Villamil','3067788001','gustavo.s@example.com'),('CE848222193',2,'Juliana',NULL,'Escobar','Molina','3012221333','juliana.e@example.com'),('CE854199201',2,'Isabela','Sofía','Cruz',NULL,'3012233445','isabela.c@example.com'),('CE884192793',2,'Natalia',NULL,'Córdoba',NULL,'3012345678','natalia.c@example.com'),('CE980112376',2,'Luisa',NULL,'Martínez','Ríos','3012223344','luisa.m@example.com'),('CE998233471',2,'Daniel','Esteban','Montoya','Arango','3067890123','daniel.m@example.com'),('PEP10241766',4,'Camila',NULL,'Zapata',NULL,'3034445566','camila.z@example.com'),('PEP42998229',4,'Tatiana',NULL,'Mendoza','Ríos','3090123456','tatiana.m@example.com'),('PEP62981932',4,'Ximena',NULL,'Cárdenas',NULL,'3090002111','ximena.c@example.com'),('PEP66298110',4,'Diana','Marcela','Bermúdez','Silva','3099001122','diana.b@example.com'),('PEP68821392',4,'Iván','Alonso','López',NULL,'3045566889','ivan.l@example.com'),('PEP71821190',4,'Vanessa','Marcela','Ardila','Zambrano','3090011223','vanessa.a@example.com'),('PEP78114392',4,'Tomás',NULL,'Salazar',NULL,'3045678901','tomas.s@example.com'),('PEP83928319',4,'Mateo','Simón','Agudelo','Cuellar','3090011334','mateo.a@example.com'),('PEP88200349',4,'Jorge',NULL,'Martínez','Luna','3045551666','jorge.m@example.com'),('PEP88321914',4,'Pablo','Esteban','Guzmán','Vallejo','3045566778','pablo.g@example.com'),('PP54821012',3,'Laura','Isabel','Navarro',NULL,'3078889900','laura.n@example.com'),('PP55301290',3,'Miguel',NULL,'Velásquez',NULL,'3023331444','miguel.v@example.com'),('PP61139821',3,'Mauricio',NULL,'Franco','Jiménez','3023344556','mauricio.f@example.com'),('PP63801181',3,'Luisa',NULL,'Quintero','Zapata','3078901234','luisa.q@example.com'),('PP72218900',3,'Patricia',NULL,'Navarro','Delgado','3078881999','patricia.n@example.com'),('PP72319805',3,'Sebastián','Miguel','Herrera','Pinto','3023456789','sebastian.h@example.com'),('PP79381290',3,'Yolanda','Beatriz','Velasco',NULL,'3078899112','yolanda.v@example.com'),('PP80091281',3,'Oscar','Humberto','Rivas','Galindo','3023344667','oscar.r@example.com'),('PP81293822',3,'Sandra','Milena','Linares','Hoyos','3078899001','sandra.l@example.com'),('PP83922911',3,'Sergio','Andrés','Garzón','Velásquez','3023334455','sergio.g@example.com'),('PPT63912388',5,'Melisa',NULL,'Calle','Paredes','3034455778','melisa.c@example.com'),('PPT71299130',5,'Leonardo','Iván','Castillo','Ramos','3089992000','leonardo.c@example.com'),('PPT71928300',5,'David',NULL,'Buitrago',NULL,'3089900112','david.b@example.com'),('PPT73849652',5,'Esteban','Iván','Córdoba','Santana','3089990011','esteban.c@example.com'),('PPT74829110',5,'Carolina','Andrea','Suárez','Rodríguez','3034441555','caro.s@example.com'),('PPT78421133',5,'Rosa',NULL,'Martínez',NULL,'3034455667','rosa.m@example.com'),('PPT80244966',5,'Tomás','Eduardo','Montoya','López','3045556677','tomas.m@example.com'),('PPT84128813',5,'Adriana',NULL,'Peralta','Nieves','3089900223','adriana.p@example.com'),('PPT88422119',5,'Ricardo','Enrique','Peña',NULL,'3089012345','ricardo.p@example.com'),('PPT98300145',5,'Mónica',NULL,'Padilla','Bonilla','3034567890','monica.p@example.com'),('aaron',1,'',NULL,'',NULL,'',NULL);
/*!40000 ALTER TABLE `personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recepcionpaquetes`
--

DROP TABLE IF EXISTS `recepcionpaquetes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recepcionpaquetes` (
  `idPaquete` int(11) NOT NULL AUTO_INCREMENT,
  `apartamentoId` int(11) NOT NULL,
  `nombreDestinatario` varchar(100) NOT NULL,
  `empresaMensajeria` varchar(45) NOT NULL,
  `fechaRecepcion` datetime NOT NULL,
  `fechaEntrega` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estadoId` int(11) NOT NULL,
  PRIMARY KEY (`idPaquete`),
  KEY `apartamentoId` (`apartamentoId`),
  KEY `estadoId` (`estadoId`),
  CONSTRAINT `recepcionpaquetes_ibfk_1` FOREIGN KEY (`apartamentoId`) REFERENCES `apartamentos` (`idApartamento`),
  CONSTRAINT `recepcionpaquetes_ibfk_2` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recepcionpaquetes`
--

LOCK TABLES `recepcionpaquetes` WRITE;
/*!40000 ALTER TABLE `recepcionpaquetes` DISABLE KEYS */;
INSERT INTO `recepcionpaquetes` VALUES (1,1,'Juan Carlos Torres','Servientrega','2024-05-10 10:34:00',NULL,'Caja con accesorios tecnológicos',14),(2,2,'Luisa Martínez','Servientrega','2024-06-15 10:00:00','2024-06-20 12:00:00','Sobre notarial firmado',15),(3,3,'Sergio Andrés Garzón','DHL','2024-02-10 08:45:00','2024-02-11 14:10:00','Licuadora - caja mediana',15),(4,4,'Camila Zapata','InterRapidísimo','2024-05-25 14:10:00',NULL,'Paquete familiar sin reclamar',14),(5,5,'Esteban Iván Córdoba','Coordinadora','2023-11-05 11:25:00','2023-11-06 13:30:00','Electrónica pequeña',15),(6,6,'María José Pineda','Servientrega','2025-01-01 09:00:00','2025-01-03 16:00:00','Libro universitario entregado',15),(7,7,'Felipe Restrepo','DHL','2023-12-12 08:20:00','2023-12-13 10:30:00','Zapatos deportivos',15),(8,8,'Laura Isabel Navarro','Servientrega','2023-10-10 10:55:00','2023-10-12 14:45:00','Tarjetas bancarias',15),(9,9,'Esteban Iván Córdoba','Coordinadora','2024-03-20 12:00:00','2024-03-21 13:00:00','Accesorios tech',15),(10,10,'Diana Marcela Bermúdez','InterRapidísimo','2024-08-15 11:10:00','2024-08-17 16:15:00','Medicamentos básicos',15),(11,11,'José Fernando Gutiérrez','Servientrega','2023-06-02 13:20:00','2023-06-03 17:10:00','Correspondencia oficial',15),(12,12,'Natalia Córdoba','DHL','2023-07-10 10:45:00','2023-07-12 13:30:00','Encomienda familiar',15),(13,13,'Sebastián Miguel Herrera','Servientrega','2024-05-01 11:40:00','2024-05-02 14:50:00','Kit de oficina entregado',15),(14,14,'Mónica Padilla','Coordinadora','2023-02-13 09:05:00','2023-02-14 11:25:00','Papelería institucional',15),(15,15,'María José Pineda','Coordinadora','2024-05-30 09:20:00',NULL,'Sobre corporativo urgente',14),(16,16,'Fernanda Lucía Gil','Servientrega','2023-11-21 13:55:00','2023-11-22 16:30:00','Sobre confidencial',15),(17,17,'Daniel Esteban Montoya','DHL','2023-03-03 10:10:00','2023-03-04 15:00:00','Ropa infantil',15),(18,18,'Luisa Quintero','InterRapidísimo','2023-12-08 09:30:00','2023-12-10 12:40:00','Audífonos bluetooth',15),(19,19,'Ricardo Enrique Peña','DHL','2024-05-28 11:45:00',NULL,'Documentación académica pendiente',14),(20,20,'Tatiana Mendoza','Servientrega','2024-06-19 08:00:00','2024-06-20 14:00:00','Víveres entregados',15),(21,21,'Felipe Javier Gómez','DHL','2023-04-07 12:00:00','2023-04-08 14:10:00','Facturas y recibos',15),(22,22,'Juliana Escobar','Coordinadora','2024-03-10 09:10:00','2024-03-11 13:50:00','Repuestos mecánicos',15),(23,23,'Miguel Velásquez','Servientrega','2023-09-01 14:25:00','2023-09-02 16:30:00','Libros y revistas',15),(24,24,'Carolina Andrea Suárez','InterRapidísimo','2023-06-21 10:40:00','2023-06-22 12:00:00','Ropa formal',15),(25,25,'Jorge Martínez','Servientrega','2024-07-14 09:00:00','2024-07-15 14:00:00','Cargador celular',15),(26,26,'Nicole Fonseca','DHL','2023-05-15 15:10:00','2023-05-17 10:00:00','Sobre certificado',15),(27,27,'Diego Manuel León','Servientrega','2024-05-20 16:22:00',NULL,'Paquete institucional no entregado',14),(28,28,'Patricia Navarro','Coordinadora','2024-02-02 11:00:00','2024-02-03 13:00:00','Snacks y bebidas',15),(29,29,'Leonardo Iván Castillo','Servientrega','2024-08-05 08:10:00','2024-08-06 14:30:00','Sobre bancario',15),(30,30,'Vanessa Marcela Ardila','Coordinadora','2024-06-25 13:10:00',NULL,'Productos de aseo personal',14),(31,31,'Ángel Bermúdez','DHL','2023-03-08 10:20:00','2023-03-09 13:40:00','Fotos impresas',15),(32,32,'Isabela Sofía Cruz','Coordinadora','2024-09-01 12:00:00','2024-09-03 15:00:00','Útiles escolares',15),(33,33,'Mauricio Franco','InterRapidísimo','2024-07-01 09:00:00',NULL,'Sobre bancario - tarjeta nueva',14),(34,34,'Pablo Esteban Guzmán','InterRapidísimo','2023-07-20 09:45:00','2023-07-21 14:30:00','Aseo personal',15),(35,35,'Pablo Esteban Guzmán','Servientrega','2025-01-10 09:30:00','2025-01-11 14:15:00','Citación legal entregada',15),(36,36,'Jennifer Paola Valencia','DHL','2024-06-29 17:30:00',NULL,'Kit de oficina básico',14),(37,37,'Cristian Benítez','Coordinadora','2024-05-09 09:50:00','2024-05-10 12:00:00','Repuestos domésticos',15),(38,38,'Sandra Milena Linares','Servientrega','2024-06-27 12:40:00',NULL,'Correspondencia escolar pendiente',14),(39,39,'David Buitrago','DHL','2023-12-01 08:30:00','2023-12-02 13:00:00','Material escolar entregado',15),(40,40,'Mateo Simón Agudelo','Servientrega','2024-07-02 15:20:00',NULL,'Paquete de regalo sin reclamar',14),(41,41,'Rafael Trujillo','InterRapidísimo','2024-06-07 09:00:00','2024-06-08 15:00:00','Artículo devuelto entregado',15),(42,42,'Paula Natalia Córdoba','Servientrega','2023-05-14 10:30:00','2023-05-15 12:00:00','Herramientas pequeñas',15),(43,43,'Oscar Humberto Rivas','Coordinadora','2023-07-30 11:10:00','2023-07-31 13:40:00','Certificados académicos',15),(44,44,'Melisa Calle','Servientrega','2023-08-28 12:25:00','2023-08-29 14:20:00','Material digital físico',15),(45,45,'Iván Alonso López','DHL','2023-12-24 17:00:00','2023-12-25 18:00:00','Regalo navideño entregado',15),(46,46,'Angela Santacruz','InterRapidísimo','2023-02-20 08:20:00','2023-02-21 10:30:00','Correspondencia personal',15),(47,47,'Gustavo Emilio Santos','Servientrega','2024-01-01 09:15:00','2024-01-02 11:45:00','Accesorios de baño',15),(48,48,'Yolanda Beatriz Velasco','Coordinadora','2024-03-22 10:00:00','2024-03-23 14:00:00','Papelería institucional',15),(49,49,'Adriana Peralta','Servientrega','2023-06-02 13:00:00','2023-06-03 15:20:00','Tesis impresa entregada',15),(50,50,'Mateo Simón Agudelo','Servientrega','2024-05-27 11:00:00',NULL,'Paquete corporativo aún sin entregar',14);
/*!40000 ALTER TABLE `recepcionpaquetes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservasareas`
--

DROP TABLE IF EXISTS `reservasareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservasareas` (
  `idReservas` int(11) NOT NULL AUTO_INCREMENT,
  `apartamentoId` int(11) NOT NULL,
  `areaComunId` int(11) NOT NULL,
  `fechaReserva` date NOT NULL,
  `horaInicio` time NOT NULL,
  `horaFin` time NOT NULL,
  `motivoReserva` varchar(100) NOT NULL,
  `cantidadAsistentes` tinyint(4) NOT NULL,
  `invitadosExternos` tinyint(1) NOT NULL,
  `aceptaReglamento` tinyint(1) NOT NULL,
  `estadoId` int(11) NOT NULL,
  `documentoSolicitante` varchar(20) NOT NULL,
  PRIMARY KEY (`idReservas`),
  KEY `apartamentoId` (`apartamentoId`),
  KEY `areaComunId` (`areaComunId`),
  KEY `estadoId` (`estadoId`),
  KEY `documentoSolicitante` (`documentoSolicitante`),
  CONSTRAINT `reservasareas_ibfk_1` FOREIGN KEY (`apartamentoId`) REFERENCES `apartamentos` (`idApartamento`),
  CONSTRAINT `reservasareas_ibfk_2` FOREIGN KEY (`areaComunId`) REFERENCES `areacomun` (`idAreaComun`),
  CONSTRAINT `reservasareas_ibfk_3` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`),
  CONSTRAINT `reservasareas_ibfk_4` FOREIGN KEY (`documentoSolicitante`) REFERENCES `solicitante` (`documentoSolicitante`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservasareas`
--

LOCK TABLES `reservasareas` WRITE;
/*!40000 ALTER TABLE `reservasareas` DISABLE KEYS */;
INSERT INTO `reservasareas` VALUES (103,5,1,'2024-05-10','15:00:00','18:00:00','Cumpleaños adulto',10,1,1,7,'PPT80244966'),(104,5,3,'2024-06-20','13:00:00','16:00:00','Almuerzo familiar',8,1,1,9,'PPT80244966'),(105,12,2,'2024-08-05','14:00:00','17:00:00','Reunión juvenil',9,0,1,8,'CE884192793'),(106,12,1,'2025-01-10','16:00:00','19:00:00','Taller educativo',6,0,1,7,'CE884192793'),(107,22,3,'2024-03-02','15:00:00','18:00:00','Asado comunitario',12,1,1,9,'CE848222193'),(108,22,2,'2024-07-11','17:00:00','20:00:00','Cumpleaños adolescente',13,1,1,8,'CE848222193'),(109,18,1,'2023-11-15','09:00:00','11:30:00','Reunión empresarial',7,0,1,9,'PP63801181'),(110,18,3,'2024-01-22','12:00:00','15:00:00','Celebración navideña',14,1,1,7,'PP63801181'),(111,7,2,'2023-12-08','10:00:00','13:00:00','Despedida laboral',8,0,1,9,'CE723844982'),(112,7,1,'2024-04-28','13:30:00','16:30:00','Taller ambiental',6,0,1,7,'CE723844982'),(113,25,2,'2024-05-05','09:00:00','12:00:00','Celebración especial',15,1,1,9,'PEP88200349'),(114,25,3,'2024-07-19','18:00:00','21:00:00','Fiesta temática',13,1,1,8,'PEP88200349'),(115,40,1,'2024-06-30','14:00:00','17:00:00','Reunión familiar',11,0,1,7,'PEP71821190'),(116,40,2,'2024-07-12','12:00:00','15:00:00','Cumpleaños infantil',12,1,1,9,'PEP71821190'),(117,9,3,'2023-10-22','16:00:00','19:00:00','Cena con invitados',10,1,1,8,'PPT73849652'),(118,9,2,'2024-03-10','11:00:00','13:00:00','Junta informativa',7,0,1,7,'PPT73849652'),(119,17,1,'2024-01-01','10:00:00','13:00:00','Taller de escritura',5,0,1,9,'CE998233471'),(120,17,3,'2024-02-15','15:00:00','18:00:00','Cumpleaños íntimo',6,1,1,8,'CE998233471'),(121,30,1,'2024-03-22','09:30:00','12:30:00','Reunión con proveedores',9,0,1,9,'PEP62981932'),(122,30,2,'2024-06-14','15:00:00','18:00:00','Clase comunitaria',10,1,1,7,'PEP62981932'),(123,3,1,'2023-07-18','10:00:00','12:30:00','Taller de primeros auxilios',8,0,1,9,'PP83922911'),(124,3,3,'2024-04-02','17:00:00','20:00:00','Reunión de padres',11,0,1,7,'PP83922911'),(125,10,2,'2024-06-28','14:00:00','17:00:00','Celebración de logros académicos',12,1,1,8,'PEP66298110'),(126,10,1,'2025-02-11','11:00:00','14:00:00','Asamblea interna',6,0,1,7,'PEP66298110'),(127,33,3,'2023-09-15','09:00:00','12:00:00','Jornada de pintura',5,0,1,9,'PP61139821'),(128,33,1,'2024-10-25','13:00:00','16:00:00','Celebración comunitaria',14,1,1,8,'PP61139821'),(129,15,2,'2024-05-20','10:00:00','13:00:00','Evento motivacional',9,0,1,7,'PEP78114392'),(130,15,1,'2023-10-28','18:00:00','21:00:00','Fiesta de disfraces',15,1,1,9,'PEP78114392'),(131,34,2,'2024-08-15','11:00:00','13:30:00','Reunión de seguridad',7,0,1,7,'PPT78421133'),(132,34,3,'2025-01-19','15:00:00','18:00:00','Actividad cultural externa',12,1,1,8,'PPT78421133'),(133,14,1,'2024-07-21','14:00:00','17:00:00','Taller de cocina',10,0,1,7,'PPT98300145'),(134,14,3,'2024-11-30','16:00:00','19:00:00','Celebración navideña',13,1,1,9,'PPT98300145'),(135,1,2,'2025-03-01','13:00:00','15:00:00','Reunión de vecinos',8,0,1,8,'1032485764'),(136,1,3,'2024-05-04','17:00:00','20:00:00','Fiesta familiar',11,1,1,9,'1032485764'),(137,28,1,'2024-04-17','10:00:00','13:00:00','Taller de jardinería',7,0,1,9,'PP72218900'),(138,28,2,'2024-06-05','14:00:00','17:00:00','Asamblea conjunta',9,1,1,8,'PP72218900'),(139,16,3,'2023-08-09','15:00:00','18:00:00','Reunión sectorial',9,0,1,9,'1010039108'),(140,16,1,'2024-02-07','10:00:00','13:00:00','Taller comunitario sobre reciclaje',6,0,1,7,'1010039108'),(141,6,2,'2024-07-30','13:30:00','16:30:00','Celebración de grado',15,1,1,8,'1043910845'),(142,6,1,'2023-12-13','09:00:00','12:00:00','Reunión técnica interna',7,0,1,9,'1043910845'),(143,29,3,'2024-05-03','17:00:00','20:00:00','Fiesta por aniversario laboral',13,1,1,8,'PPT71299130'),(144,29,1,'2024-06-10','08:30:00','11:00:00','Clase de cocina saludable',5,0,1,7,'PPT71299130'),(145,21,2,'2023-11-04','14:00:00','17:00:00','Taller sobre huertas urbanas',10,0,1,9,'1020040001'),(146,21,3,'2024-08-22','13:00:00','16:00:00','Reunión de planeación vecinal',11,1,1,7,'1020040001'),(147,13,1,'2024-09-01','10:00:00','13:00:00','Charla sobre finanzas familiares',6,0,1,8,'PP72319805'),(148,13,2,'2023-06-09','15:30:00','18:30:00','Reunión con junta administrativa',7,0,1,9,'PP72319805'),(149,11,3,'2024-07-13','13:00:00','16:00:00','Actividad lúdica comunitaria',10,1,1,8,'1015678910'),(150,11,1,'2023-09-18','09:00:00','12:00:00','Taller de lectura crítica',4,0,1,9,'1015678910'),(151,35,2,'2024-10-20','12:00:00','15:00:00','Reunión intergeneracional',13,1,1,7,'PEP88321914'),(152,35,3,'2025-01-15','16:00:00','19:00:00','Fiesta de integración familiar',15,1,1,9,'PEP88321914'),(153,19,2,'2023-05-26','10:00:00','13:00:00','Sesión informativa ambiental',6,0,1,9,'PPT88422119');
/*!40000 ALTER TABLE `reservasareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `idRol` int(11) NOT NULL AUTO_INCREMENT,
  `nombreRol` varchar(45) NOT NULL,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `nombreRol` (`nombreRol`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (2,'administrador'),(1,'superAdmin'),(3,'vigilante');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rolespermisos`
--

DROP TABLE IF EXISTS `rolespermisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rolespermisos` (
  `idRol` int(11) NOT NULL,
  `idPermiso` int(11) NOT NULL,
  PRIMARY KEY (`idRol`,`idPermiso`),
  KEY `idPermiso` (`idPermiso`),
  CONSTRAINT `rolespermisos_ibfk_1` FOREIGN KEY (`idRol`) REFERENCES `roles` (`idRol`),
  CONSTRAINT `rolespermisos_ibfk_2` FOREIGN KEY (`idPermiso`) REFERENCES `permisos` (`idPermiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rolespermisos`
--

LOCK TABLES `rolespermisos` WRITE;
/*!40000 ALTER TABLE `rolespermisos` DISABLE KEYS */;
INSERT INTO `rolespermisos` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(2,6),(2,7),(2,8),(2,9),(2,10),(2,11),(2,12),(2,13),(2,14),(2,15),(2,16),(2,17),(2,18),(2,19),(2,20),(2,21),(3,9),(3,10),(3,11),(3,12),(3,17),(3,18),(3,19),(3,20);
/*!40000 ALTER TABLE `rolespermisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitante`
--

DROP TABLE IF EXISTS `solicitante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitante` (
  `documentoSolicitante` varchar(20) NOT NULL,
  `nombreSolicitante` varchar(100) NOT NULL,
  `telefonoSolicitante` varchar(20) NOT NULL,
  `correoSolicitante` varchar(100) NOT NULL,
  `tipoDocumentoId` int(11) NOT NULL,
  PRIMARY KEY (`documentoSolicitante`),
  KEY `tipoDocumentoId` (`tipoDocumentoId`),
  CONSTRAINT `solicitante_ibfk_1` FOREIGN KEY (`tipoDocumentoId`) REFERENCES `tipodocumentos` (`idTipoDocumento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitante`
--

LOCK TABLES `solicitante` WRITE;
/*!40000 ALTER TABLE `solicitante` DISABLE KEYS */;
INSERT INTO `solicitante` VALUES ('1010039108','Fernanda Gil','3209881442','fernanda.gil@gmail.com',1),('1015678910','José Gutiérrez','3128891132','jose.gtz@gmail.com',1),('1020040001','Felipe Gómez','3108891234','felipe.gomez@gmail.com',1),('1020040002','Nicole Fonseca','3127728833','nicole.fonseca@outlook.com',1),('1020040003','Adriana Peralta','3108891122','adriana.peralta@hotmail.com',1),('1020040004','Angela Santacruz','3138849930','angela.santacruz@gmail.com',1),('1032485764','Juan Carlos Torres','3007123456','juan.torres@gmail.com',1),('1043910845','María José Pineda','3117729011','mj.pineda@gmail.com',1),('CE723844982','Felipe Restrepo','3102249933','felipe.restrepo@outlook.com',2),('CE771200984','Patricia Navarro','3208841222','patricia.navarro@yahoo.com',2),('CE793012834','Gustavo Santos','3118890011','gustavo.santos@outlook.com',2),('CE848222193','Juliana Escobar','3209941132','juliana.escobar@outlook.com',2),('CE854199201','Cristian Benítez','3138899910','cristian.benitez@gmail.com',2),('CE884192793','Natalia Córdoba','3117628899','natalia.cordoba@outlook.com',2),('CE980112376','Luisa Martínez','3209981122','luisa.martinez@yahoo.com',2),('CE998233471','Daniel Montoya','3127789220','daniel.montoya@outlook.com',2),('EX31002918','Claudia Patiño','3117729910','claudia.patino@yahoo.com',3),('EX90111002','Lorena Marín','3208812233','lorena.marin@outlook.com',2),('EX99911222','Marcela Beltrán','3108891234','marcela.beltran@gmail.com',1),('EXT10123302','Luis Fernando Ruiz','3119921001','luis.ruiz@hotmail.com',3),('EXT10992830','Nicolás Valdés','3128813456','nicolas.valdes@gmail.com',2),('IND77023991','Andrés Camacho','3007789922','andres.camacho@gmail.com',1),('INV83839210','Sandra Pardo','3198812930','sandra.pardo@yahoo.com',2),('PEP10241766','Camila Zapata','3228831145','camila.zapata@gmail.com',4),('PEP42998229','Tatiana Mendoza','3011129001','tatiana.mendoza@hotmail.com',4),('PEP62981932','Isabela Cruz','3012254410','isabela.cruz@gmail.com',4),('PEP66298110','Diana Bermúdez','3001128899','diana.bm@gmail.com',4),('PEP71821190','Sandra Linares','3017799133','sandra.linares@outlook.com',4),('PEP78114392','Tatiana Mendoza','3011129001','tatiana.mendoza@hotmail.com',4),('PEP88200349','Jorge Martínez','3011124555','jorge.martinez@gmail.com',4),('PEP88321914','Rafael Trujillo','3207789110','rafael.trujillo@gmail.com',4),('PP54821012','Laura Navarro','3138894550','laura.navarro@yahoo.com',3),('PP55301290','Miguel Velásquez','3138895112','miguel.velasquez@yahoo.com',3),('PP61139821','David Buitrago','3128842233','david.buitrago@outlook.com',3),('PP63801181','Luisa Quintero','3108812344','luisa.q23@gmail.com',3),('PP72218900','Leonardo Castillo','3117789901','leonardo.castillo@gmail.com',3),('PP72319805','Sebastián Herrera','3148819234','sebastian.herrera@yahoo.com',3),('PP81293822','Melisa Calle','3008921100','melisa.calle@gmail.com',3),('PP83922911','Sergio Andrés Garzón','3013342255','sergio.garzon@outlook.com',3),('PPT71299130','Ángel Bermúdez','3138821100','angel.bermudez@outlook.com',5),('PPT71928300','Iván López','3102229310','ivan.lopez@gmail.com',5),('PPT73849652','Esteban Córdoba','3018827111','e.cordoba2@gmail.com',5),('PPT74829110','Carolina Suárez','3002298310','carosuarez@gmail.com',5),('PPT78421133','Yolanda Velasco','3002238811','yolanda.velasco@gmail.com',5),('PPT80244966','Esteban Córdoba','3009987211','esteban.cordoba@gmail.com',5),('PPT88422119','Ricardo Peña','3012248911','ricardo.peña@gmail.com',5),('PPT98300145','Mónica Padilla','3007229981','monica.padilla@gmail.com',5),('PRV12009901','José Luis Arango','3009981120','josel.arango@gmail.com',1),('TST99123823','Camilo Torres','3158890123','camilo.torres@gmail.com',1),('TUR50123901','Sebastián Barrios','3148890022','sebastian.barrios@gmail.com',1);
/*!40000 ALTER TABLE `solicitante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipodocumentos`
--

DROP TABLE IF EXISTS `tipodocumentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipodocumentos` (
  `idTipoDocumento` int(11) NOT NULL AUTO_INCREMENT,
  `nombreDocumento` varchar(30) NOT NULL,
  `abreviatura` varchar(5) NOT NULL,
  PRIMARY KEY (`idTipoDocumento`),
  UNIQUE KEY `nombreDocumento` (`nombreDocumento`),
  UNIQUE KEY `abreviatura` (`abreviatura`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipodocumentos`
--

LOCK TABLES `tipodocumentos` WRITE;
/*!40000 ALTER TABLE `tipodocumentos` DISABLE KEYS */;
INSERT INTO `tipodocumentos` VALUES (1,'Cédula de ciudadanía','CC'),(2,'Cédula de extranjería','CE'),(3,'Pasaporte','PP'),(4,'Permiso Especial de Permanenci','PEP'),(5,'Permiso por Protección Tempora','PPT');
/*!40000 ALTER TABLE `tipodocumentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiposvehiculo`
--

DROP TABLE IF EXISTS `tiposvehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiposvehiculo` (
  `idTipoVehiculo` int(11) NOT NULL AUTO_INCREMENT,
  `nombreVehiculo` varchar(30) NOT NULL,
  PRIMARY KEY (`idTipoVehiculo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiposvehiculo`
--

LOCK TABLES `tiposvehiculo` WRITE;
/*!40000 ALTER TABLE `tiposvehiculo` DISABLE KEYS */;
INSERT INTO `tiposvehiculo` VALUES (1,'carro'),(2,'moto');
/*!40000 ALTER TABLE `tiposvehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `torres`
--

DROP TABLE IF EXISTS `torres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `torres` (
  `idTorre` int(11) NOT NULL AUTO_INCREMENT,
  `nombreTorre` varchar(15) NOT NULL,
  PRIMARY KEY (`idTorre`),
  UNIQUE KEY `nombreTorre` (`nombreTorre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `torres`
--

LOCK TABLES `torres` WRITE;
/*!40000 ALTER TABLE `torres` DISABLE KEYS */;
INSERT INTO `torres` VALUES (1,'Torre A'),(2,'Torre B'),(3,'Torre C'),(4,'Torre D'),(5,'Torre E'),(6,'Torre F'),(7,'Torre G'),(8,'Torre H'),(9,'Torre I'),(10,'Torre J');
/*!40000 ALTER TABLE `torres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `username` varchar(45) NOT NULL,
  `numeroDocumento` varchar(20) NOT NULL,
  `rolesId` int(11) NOT NULL,
  `password` varchar(255) NOT NULL,
  `estadoId` int(11) NOT NULL,
  PRIMARY KEY (`username`),
  UNIQUE KEY `numeroDocumento` (`numeroDocumento`),
  KEY `rolesId` (`rolesId`),
  KEY `estadoId` (`estadoId`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rolesId`) REFERENCES `roles` (`idRol`),
  CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`numeroDocumento`) REFERENCES `personas` (`numeroDocumento`),
  CONSTRAINT `usuarios_ibfk_3` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES ('1515','aaron',2,'$2y$10$Wa710N.JkEGplu0NXw8tT.olZXNzTBpByiHuhANysMBvcxfpiHlMi',1),('camila.z','PEP10241766',1,'b76223af9f22c4d62ce1a4c5b2f7df9956fd49bda1d75806adf475b96eefb9db',1),('croxduro','123452025',2,'$2y$10$kgUT/p0NbbAGMARbIKfBqeQtCEt7UULEuQB0YofyHbsGtcRIU7kW6',1),('david','202021',2,'$2y$10$Fl7r13FnSUVddwRhOXKoWeD0pXvUqcAmPDJ2onlRo6ndbtLq8ckDK',1),('diana.b','PEP66298110',2,'fec893bc26e80cc8da3fa05837d266334e73e66ed0558f2b73969f81abf9f8b7',1),('esteban.c','PPT73849652',3,'83fa22f0959d392c6cd0e33949ec69ec73fdc187fb580c31c3bb48e3b719dd4b',1),('felipe.r','CE723844982',1,'5db54656750ff3bd0d039e13305a1eb12c8bb5fd6223695bde57e8787b556444',1),('jhonsebas','1222222',1,'$2y$10$.Aj4x5YH/ZRXPXn9vggyVebRL5oEzpyon4F/5lhQ17INsBFs.Q6w2',1),('josue','123123123',1,'$2y$10$91x3.opjhOWc.VVzBq1Deu2l1y2P0aqB6xQfzqcZCll/.eCpBuavC',1),('josue Montiel','202020',2,'$2y$10$yWO5p4smSBG9z0eXcETZLeaIr/le7QdrPO0gXnN7c.VraL2nDMx.2',1),('jtorres','1032485764',2,'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',1),('laura.n','PP54821012',2,'69c904220e5ed1fc018399b6b0fa1ed79737c870d0ac3ba461def12ed884875f',2),('luisa.m','CE980112376',3,'be19b61c9643acaa17cb2e45377c37e8513d218b98126a3bf0bd2d29004b6bb6',1),('maria.p','1043910845',2,'4a6f9b5684dac744718a51f1516a49e25b91782f7826db53f24db9704ec51a8a',1),('sergio.g','PP83922911',2,'becf77f3ec82a43422b7712134d1860e3205c6ce778b08417a7389b43f2b4661',1),('tomasm','PPT80244966',3,'59406b3bc408c5b70ca2606daf9133ad0f59e8f84e53dadf2f0ab51a31576859',2);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculo`
--

DROP TABLE IF EXISTS `vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculo` (
  `matricula` varchar(10) NOT NULL,
  `tipoVehiculoId` int(11) NOT NULL,
  `codigoParqueadero` varchar(10) NOT NULL,
  PRIMARY KEY (`matricula`),
  KEY `tipoVehiculoId` (`tipoVehiculoId`),
  KEY `codigoParqueadero` (`codigoParqueadero`),
  CONSTRAINT `vehiculo_ibfk_1` FOREIGN KEY (`tipoVehiculoId`) REFERENCES `tiposvehiculo` (`idTipoVehiculo`),
  CONSTRAINT `vehiculo_ibfk_2` FOREIGN KEY (`codigoParqueadero`) REFERENCES `parqueaderos` (`codigoParqueadero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculo`
--

LOCK TABLES `vehiculo` WRITE;
/*!40000 ALTER TABLE `vehiculo` DISABLE KEYS */;
INSERT INTO `vehiculo` VALUES ('ABC123',1,'PC001'),('ASD800',1,'PC024'),('BNM667',1,'PC007'),('CVB889',1,'PC009'),('DFG955',1,'PC015'),('EDF412',1,'PC022'),('FDS555',1,'PC023'),('GHF901',1,'PC025'),('GHJ732',1,'PC013'),('HGT112',1,'PC005'),('JKL456',1,'PC003'),('LMN789',1,'PC004'),('MLK440',1,'PC016'),('MOTO001',2,'PM001'),('MOTO002',2,'PM002'),('MOTO003',2,'PM003'),('MOTO004',2,'PM004'),('MOTO005',2,'PM005'),('MOTO006',2,'PM006'),('MOTO007',2,'PM007'),('MOTO008',2,'PM008'),('MOTO009',2,'PM009'),('MOTO010',2,'PM010'),('MOTO011',2,'PM011'),('MOTO012',2,'PM012'),('MOTO013',2,'PM013'),('MOTO014',2,'PM014'),('MOTO015',2,'PM015'),('MOTO016',2,'PM016'),('MOTO017',2,'PM017'),('MOTO018',2,'PM018'),('MOTO019',2,'PM019'),('MOTO020',2,'PM020'),('MOTO021',2,'PM021'),('MOTO022',2,'PM022'),('MOTO023',2,'PM023'),('MOTO024',2,'PM024'),('MOTO025',2,'PM025'),('NJI300',1,'PC020'),('OIP901',1,'PC012'),('OKM210',1,'PC021'),('PLM877',1,'PC019'),('QWE223',1,'PC008'),('RTY334',1,'PC006'),('TRE762',1,'PC018'),('TYU882',1,'PC011'),('UYT661',1,'PC017'),('WER812',1,'PC014'),('XYZ987',1,'PC002'),('ZXC443',1,'PC010');
/*!40000 ALTER TABLE `vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitantes`
--

DROP TABLE IF EXISTS `visitantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitantes` (
  `numeroDocumento` varchar(20) NOT NULL,
  `nombreVisitante` varchar(100) NOT NULL,
  `tipoDocumentoId` int(11) NOT NULL,
  PRIMARY KEY (`numeroDocumento`),
  KEY `tipoDocumentoId` (`tipoDocumentoId`),
  CONSTRAINT `visitantes_ibfk_1` FOREIGN KEY (`tipoDocumentoId`) REFERENCES `tipodocumentos` (`idTipoDocumento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitantes`
--

LOCK TABLES `visitantes` WRITE;
/*!40000 ALTER TABLE `visitantes` DISABLE KEYS */;
INSERT INTO `visitantes` VALUES ('CC1001122334','Andrea Pérez',1),('CC1001122335','Carlos Torres',1),('CC1001122336','Diana Rodríguez',1),('CC1001122337','Felipe Gómez',1),('CC1001122338','Gabriela Sánchez',1),('CC1001122339','Héctor Jiménez',1),('CC1001122340','Isabela Ruiz',1),('CC1001122341','Jorge Martínez',1),('CC1001122342','Karen Gómez',1),('CC1001122343','Luis Herrera',1),('CE2002233441','Ana López',2),('CE2002233442','Bruno Silva',2),('CE2002233443','Camila Costa',2),('CE2002233444','Daniela Monteiro',2),('CE2002233445','Eduardo Lima',2),('CE2002233446','Fernanda Alves',2),('CE2002233447','Gustavo Pereira',2),('CE2002233448','Helena Castro',2),('CE2002233449','Ignacio Torres',2),('CE2002233450','Julieta Moreno',2),('PEP4004455661','Laura Varela',4),('PEP4004455662','Manuel Céspedes',4),('PEP4004455663','Natalia Bermúdez',4),('PEP4004455664','Oscar Lozano',4),('PEP4004455665','Pamela Ortiz',4),('PEP4004455666','Quetzal Ramírez',4),('PEP4004455667','Raúl Valencia',4),('PEP4004455668','Sofía Gaitán',4),('PEP4004455669','Tomás Galindo',4),('PEP4004455670','Ulises Andrade',4),('PP3003344551','Andrés Vega',3),('PP3003344552','Beatriz León',3),('PP3003344553','Cristóbal Medina',3),('PP3003344554','Daniel Esquivel',3),('PP3003344555','Estefanía Ríos',3),('PP3003344556','Federico Ayala',3),('PP3003344557','Gloria Núñez',3),('PP3003344558','Horacio Ortega',3),('PP3003344559','Inés Castaño',3),('PP3003344560','Javier Salazar',3),('PPT5005566771','Vanessa Arias',5),('PPT5005566772','Walter Cruz',5),('PPT5005566773','Ximena Zuluaga',5),('PPT5005566774','Yair Figueroa',5),('PPT5005566775','Zulema Rojas',5),('PPT5005566776','Abel Fuentes',5),('PPT5005566777','Betsy Camargo',5),('PPT5005566778','César Molina',5),('PPT5005566779','Diana Lara',5),('PPT5005566780','Emilio Torres',5);
/*!40000 ALTER TABLE `visitantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitas`
--

DROP TABLE IF EXISTS `visitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitas` (
  `idVisita` int(11) NOT NULL AUTO_INCREMENT,
  `numeroDocumento` varchar(20) NOT NULL,
  `apartamentoId` int(11) NOT NULL,
  `fechaHoraIngreso` datetime NOT NULL,
  `fechaHoraSalida` datetime DEFAULT NULL,
  `vehiculoMatricula` varchar(10) DEFAULT NULL,
  `estadoId` int(11) NOT NULL,
  PRIMARY KEY (`idVisita`),
  KEY `apartamentoId` (`apartamentoId`),
  KEY `estadoId` (`estadoId`),
  KEY `vehiculoMatricula` (`vehiculoMatricula`),
  KEY `numeroDocumento` (`numeroDocumento`),
  CONSTRAINT `visitas_ibfk_1` FOREIGN KEY (`apartamentoId`) REFERENCES `apartamentos` (`idApartamento`),
  CONSTRAINT `visitas_ibfk_2` FOREIGN KEY (`estadoId`) REFERENCES `estados` (`idEstado`),
  CONSTRAINT `visitas_ibfk_3` FOREIGN KEY (`vehiculoMatricula`) REFERENCES `vehiculo` (`matricula`),
  CONSTRAINT `visitas_ibfk_4` FOREIGN KEY (`numeroDocumento`) REFERENCES `visitantes` (`numeroDocumento`)
) ENGINE=InnoDB AUTO_INCREMENT=361 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitas`
--

LOCK TABLES `visitas` WRITE;
/*!40000 ALTER TABLE `visitas` DISABLE KEYS */;
INSERT INTO `visitas` VALUES (311,'CC1001122334',5,'2024-06-20 09:00:00','2024-06-20 11:30:00','ABC123',9),(312,'CE2002233441',12,'2024-06-21 14:00:00',NULL,'ASD800',8),(313,'PP3003344551',3,'2024-06-22 10:15:00','2024-06-22 12:00:00','BNM667',9),(314,'PEP4004455661',9,'2024-06-23 15:00:00',NULL,'CVB889',8),(315,'PPT5005566771',7,'2024-06-24 08:30:00','2024-06-24 09:45:00','DFG955',9),(316,'CC1001122335',14,'2024-06-25 17:00:00',NULL,'EDF412',8),(317,'CE2002233442',11,'2024-06-26 13:00:00','2024-06-26 16:00:00','FDS555',9),(318,'PP3003344552',6,'2024-06-27 09:30:00',NULL,'GHF901',8),(319,'PEP4004455662',1,'2024-06-28 19:00:00','2024-06-28 21:00:00','GHJ732',9),(320,'PPT5005566772',20,'2024-06-29 10:00:00',NULL,'HGT112',7),(321,'CC1001122336',2,'2024-07-01 10:30:00','2024-07-01 13:00:00','JKL456',9),(322,'CE2002233443',4,'2024-07-02 12:00:00',NULL,'LMN789',8),(323,'PP3003344553',18,'2024-07-03 09:15:00','2024-07-03 11:00:00','MLK440',9),(324,'PEP4004455663',15,'2024-07-04 14:45:00',NULL,'MOTO001',8),(325,'PPT5005566773',8,'2024-07-05 07:00:00','2024-07-05 09:00:00','MOTO002',9),(326,'CC1001122337',13,'2024-07-06 16:00:00',NULL,'MOTO003',8),(327,'CE2002233444',17,'2024-07-07 10:00:00','2024-07-07 12:00:00','MOTO004',9),(328,'PP3003344554',25,'2024-07-08 13:30:00',NULL,'MOTO005',8),(329,'PEP4004455664',21,'2024-07-09 08:00:00','2024-07-09 10:00:00','MOTO006',9),(330,'PPT5005566774',19,'2024-07-10 14:00:00',NULL,'MOTO007',7),(331,'CC1001122338',40,'2024-07-11 09:30:00','2024-07-11 11:30:00','MOTO008',9),(332,'CE2002233445',32,'2024-07-12 15:00:00',NULL,'MOTO009',8),(333,'PP3003344555',31,'2024-07-13 18:00:00','2024-07-13 20:00:00','MOTO010',9),(334,'PEP4004455665',36,'2024-07-14 10:15:00',NULL,'MOTO011',8),(335,'PPT5005566775',37,'2024-07-15 08:30:00','2024-07-15 10:00:00','MOTO012',9),(336,'CC1001122339',28,'2024-07-16 14:00:00',NULL,'MOTO013',8),(337,'CE2002233446',24,'2024-07-17 09:45:00','2024-07-17 11:30:00','MOTO014',9),(338,'PP3003344556',16,'2024-07-18 12:00:00',NULL,'MOTO015',8),(339,'PEP4004455666',38,'2024-07-19 10:30:00','2024-07-19 13:00:00','MOTO016',9),(340,'PPT5005566776',30,'2024-07-20 15:00:00',NULL,'MOTO017',7),(341,'CC1001122340',22,'2024-07-21 08:15:00','2024-07-21 10:15:00','MOTO018',9),(342,'CE2002233447',23,'2024-07-22 16:00:00',NULL,'MOTO019',8),(343,'PP3003344557',10,'2024-07-23 09:30:00','2024-07-23 11:30:00','MOTO020',9),(344,'PEP4004455667',26,'2024-07-24 13:45:00',NULL,'MOTO021',8),(345,'PPT5005566777',39,'2024-07-25 18:00:00','2024-07-25 20:00:00','MOTO022',9),(346,'CC1001122341',27,'2024-07-26 10:00:00',NULL,'MOTO023',8),(347,'CE2002233448',29,'2024-07-27 15:30:00','2024-07-27 17:30:00','MOTO024',9),(348,'PP3003344558',35,'2024-07-28 12:30:00',NULL,'MOTO025',8),(349,'PEP4004455668',33,'2024-07-29 09:00:00','2024-07-29 11:15:00','NJI300',9),(350,'PPT5005566778',34,'2024-07-30 14:45:00',NULL,'OIP901',7),(351,'CC1001122342',38,'2024-07-31 10:15:00','2024-07-31 12:30:00','OKM210',9),(352,'CE2002233449',12,'2024-08-01 13:00:00',NULL,'PLM877',8),(353,'PP3003344559',6,'2024-08-02 09:30:00','2024-08-02 11:00:00','QWE223',9),(354,'PEP4004455669',13,'2024-08-03 16:45:00',NULL,'RTY334',8),(355,'PPT5005566779',2,'2024-08-04 08:00:00','2024-08-04 10:30:00','TRE762',9),(356,'CC1001122343',17,'2024-08-05 18:30:00',NULL,'TYU882',8),(357,'PEP4004455670',38,'2024-08-06 12:15:00',NULL,'UYT661',8),(358,'PPT5005566780',3,'2024-08-07 10:00:00','2024-08-07 12:30:00','WER812',9),(359,'CC1001122343',14,'2024-08-08 09:30:00',NULL,'XYZ987',7),(360,'CE2002233450',7,'2024-08-09 11:45:00','2024-08-09 13:15:00','ZXC443',9);
/*!40000 ALTER TABLE `visitas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-05 20:45:45
