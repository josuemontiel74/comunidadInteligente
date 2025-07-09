-- 1. Reservas activas de áreas comunes con datos del residente, área y apartamento
SELECT r.idReservas, p.primerNombre, p.primerApellido, a.nombreArea, ap.numeroApartamento, e.nombreEstado
FROM reservasareas r
JOIN areacomun a ON r.areaComunId = a.idAreaComun
JOIN apartamentos ap ON r.apartamentoId = ap.idApartamento
JOIN solicitante s ON r.documentoSolicitante = s.documentoSolicitante
JOIN personas p ON s.documentoSolicitante = p.numeroDocumento
JOIN estados e ON r.estadoId = e.idEstado
WHERE r.estadoId IN (7, 8);

-- 2.Muestra los usuarios activos junto a su rol y ubicación en el conjunto.
SELECT u.username, r.nombreRol, a.numeroApartamento, t.nombreTorre, e.nombreEstado
FROM usuarios u
JOIN roles r ON u.rolesId = r.idRol
JOIN estados e ON u.estadoId = e.idEstado
LEFT JOIN ocupante o ON u.numeroDocumento = o.numeroDocumento
LEFT JOIN apartamentos a ON o.apartamentosId = a.idApartamento
LEFT JOIN torres t ON a.torresId = t.idTorre
WHERE e.nombreEstado = 'activo';

-- 3 .Habitantes que sean arrendatarios
SELECT 
  CONCAT(p.primerNombre, ' ', p.primerApellido) AS nombreArrendatario,
  p.telefono,
  a.numeroApartamento,
  t.nombreTorre,
  e.nombreEstado
FROM ocupante o
JOIN personas p ON o.numeroDocumento = p.numeroDocumento
JOIN apartamentos a ON o.apartamentosId = a.idApartamento
JOIN torres t ON a.torresId = t.idTorre
JOIN estados e ON o.estadoId = e.idEstado
WHERE o.tipoOcupacion = 'arrendatario';

-- 4. Muestra cuántos propietarios y arrendatarios hay por cada torre. AGREGRA NOMBRES MAMAVERGA
SELECT o.tipoOcupacion, t.nombreTorre, COUNT(*) AS totalOcupantes
FROM ocupante o
JOIN apartamentos a ON o.apartamentosId = a.idApartamento
JOIN torres t ON a.torresId = t.idTorre
GROUP BY o.tipoOcupacion, t.nombreTorre
ORDER BY t.nombreTorre, o.tipoOcupacion;

-- 5. Paquetes pendientes por entregar hace más de 3 días
SELECT rp.idPaquete, rp.nombreDestinatario, rp.fechaRecepcion, a.numeroApartamento, t.nombreTorre, e.nombreEstado
FROM recepcionpaquetes rp
JOIN apartamentos a ON rp.apartamentoId = a.idApartamento
JOIN torres t ON a.torresId = t.idTorre
JOIN estados e ON rp.estadoId = e.idEstado
WHERE rp.estadoId = 14 -- 
  AND DATEDIFF(CURDATE(), rp.fechaRecepcion) > 3;
  



-- Apartamentos que no han hecho ninguna reserva de áreas comunes
SELECT 
  a.numeroApartamento,
  t.nombreTorre
FROM apartamentos a
JOIN torres t ON a.torresId = t.idTorre
WHERE a.idApartamento NOT IN (
  SELECT DISTINCT r.apartamentoId FROM reservasareas r
);
-- 7. Paquetes pendientes por entregar con detalles del apartamento, torre y destinatario
SELECT rp.idPaquete, rp.nombreDestinatario, rp.fechaRecepcion, ap.numeroApartamento, t.nombreTorre, e.nombreEstado
FROM recepcionpaquetes rp
JOIN apartamentos ap ON rp.apartamentoId = ap.idApartamento
JOIN torres t ON ap.torresId = t.idTorre
JOIN estados e ON rp.estadoId = e.idEstado
WHERE rp.estadoId = 14;

-- 8. Parqueaderos ocupados con vehículo, tipo de vehículo y estado
SELECT p.codigoParqueadero, v.matricula, tv.nombreVehiculo, e.nombreEstado
FROM parqueaderos p
JOIN vehiculo v ON p.codigoParqueadero = v.codigoParqueadero
JOIN tiposvehiculo tv ON v.tipoVehiculoId = tv.idTipoVehiculo
JOIN estados e ON p.estadoId = e.idEstado
WHERE p.estadoId = 3;

-- 9. Usuarios registrados con su rol, estado y datos personales
SELECT u.username, p.primerNombre, p.primerApellido, r.nombreRol, e.nombreEstado
FROM usuarios u
JOIN personas p ON u.numeroDocumento = p.numeroDocumento
JOIN roles r ON u.rolesId = r.idRol
JOIN estados e ON u.estadoId = e.idEstado;

-- 10. Permisos que tiene cada rol del sistema
SELECT 
  r.nombreRol,
  pe.nombrePermiso,
  u.username AS usuario,
  e.nombreEstado
FROM rolespermisos rp
JOIN roles r ON rp.idRol = r.idRol
JOIN permisos pe ON rp.idPermiso = pe.idPermiso
JOIN usuarios u ON u.rolesId = r.idRol
JOIN estados e ON u.estadoId = e.idEstado
ORDER BY r.nombreRol, u.username;


-- 11. TOP 5 apartamentos con más reservas **NOMBRE QUIEN HIZO LA RESERVA**
SELECT 
  ap.numeroApartamento,
  t.nombreTorre,
  CONCAT(p.primerNombre, ' ', p.primerApellido) AS nombreSolicitante,
  COUNT(r.idReservas) AS totalReservas
FROM reservasareas r
JOIN apartamentos ap ON r.apartamentoId = ap.idApartamento
JOIN torres t ON ap.torresId = t.idTorre
JOIN estados e ON r.estadoId = e.idEstado
JOIN solicitante s ON r.documentoSolicitante = s.documentoSolicitante
JOIN personas p ON s.documentoSolicitante = p.numeroDocumento
GROUP BY ap.numeroApartamento, t.nombreTorre, nombreSolicitante
ORDER BY totalReservas DESC
LIMIT 5;


-- 12. Ocupantes con datos personales, apartamento, torre y estado de ocupación
SELECT o.idOcupante, p.primerNombre, p.primerApellido, ap.numeroApartamento, t.nombreTorre, o.tipoOcupacion, e.nombreEstado
FROM ocupante o
JOIN personas p ON o.numeroDocumento = p.numeroDocumento
JOIN apartamentos ap ON o.apartamentosId = ap.idApartamento
JOIN torres t ON ap.torresId = t.idTorre
JOIN estados e ON o.estadoId = e.idEstado;

-- 13 Consulta: Último paquete recibido por cada apartamento
SELECT 
  a.numeroApartamento,
  t.nombreTorre,
  rp.nombreDestinatario,
  rp.empresaMensajeria,
  rp.fechaRecepcion
FROM recepcionpaquetes rp
JOIN apartamentos a ON rp.apartamentoId = a.idApartamento
JOIN torres t ON a.torresId = t.idTorre
WHERE rp.fechaRecepcion = (
  SELECT MAX(rp2.fechaRecepcion)
  FROM recepcionpaquetes rp2
  WHERE rp2.apartamentoId = rp.apartamentoId
)
ORDER BY a.numeroApartamento;


-- 14. Última fecha de reserva por área común, incluyendo quién hizo la reserva y desde qué apartamento
SELECT 
  ac.nombreArea,
  MAX(r.fechaReserva) AS ultimaFechaReserva,
  s.nombreSolicitante,
  ap.numeroApartamento,
  t.nombreTorre
FROM reservasareas r
JOIN areacomun ac ON r.areaComunId = ac.idAreaComun
JOIN solicitante s ON r.documentoSolicitante = s.documentoSolicitante
JOIN apartamentos ap ON r.apartamentoId = ap.idApartamento
JOIN torres t ON ap.torresId = t.idTorre
GROUP BY ac.nombreArea, s.nombreSolicitante, ap.numeroApartamento, t.nombreTorre;


-- 15. Cantidad de reservas hechas por propietarios vs arrendatarios
SELECT 
  o.tipoOcupacion,
  COUNT(r.idReservas) AS totalReservas
FROM reservasareas r
JOIN ocupante o ON r.apartamentoId = o.apartamentosId
WHERE r.estadoId IN (7, 8, 9) -- registrada, en curso, finalizada
GROUP BY o.tipoOcupacion
ORDER BY totalReservas DESC;


-- ENCRIPTACION************************************************

INSERT INTO usuarios (username, numeroDocumento, rolesId, password, estadoId)
VALUES ( 'josmont74', '1034322926', 2, encriptarContrasena('3117325j'), 1);

select username, password from usuarios;
