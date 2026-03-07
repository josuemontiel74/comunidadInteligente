/**
 * Constantes compartidas para el backend.
 * Centraliza los IDs de estados y otros valores literales
 * que aparecen repetidos en múltiples controladores.
 */

// Estados de parqueadero 
export const ESTADO_PARQUEADERO = {
  DISPONIBLE: 4,
  OCUPADO: 3,
};

// Estados de visita ─
export const ESTADO_VISITA = {
  ACTIVA: 8,
  FINALIZADA: 9,
};

// Estados de ocupante ─
export const ESTADO_OCUPANTE = {
  ACTIVO: 5,
  INACTIVOS: [2, 3, 4],
};

// Estados de paquete 
export const ESTADO_PAQUETE = {
  RECIBIDO: 14,
  ENTREGADO: 15,
};

// Estados de reserva de área común 
export const ESTADO_RESERVA = {
  PENDIENTE: 7,
  EN_CURSO: 8,
  FINALIZADA: 9,
};

// Zona horaria Colombia ─
export const TIMEZONE_COLOMBIA = "America/Bogota";

// Año máximo permitido en fechas 
export const AÑO_MAXIMO = 2100;

// Formato de fecha y hora ─
export const FORMATO_FECHA_HORA = "YYYY-MM-DD HH:mm";

// Valor por defecto para usuario desconocido (auditorías) 
export const USUARIO_DESCONOCIDO = "desconocido";
