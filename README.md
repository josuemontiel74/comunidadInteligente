# Comunidad Inteligente - Conjunto Residencial Azahar

## Descripcion del proyecto
Comunidad Inteligente es una plataforma integral (Web y Movil) diseñada para optimizar la gestion administrativa y logistica del Conjunto Residencial Azahar.

El proyecto resuelve problematicas criticas en la comunidad, tales como:
* Gestion ineficiente de paqueteria y correspondencia.
* Ausencia de un control de visitas estructurado.
* Falta de organizacion en la reserva de areas comunes.
* Necesidad de trazabilidad en las acciones administrativas.

## Tecnologias utilizadas

### Backend
* Node.js: Entorno de ejecucion para el servidor.
* Express.js: Framework para la construccion de la API REST.
* JSON Web Token (JWT): Gestion de autenticacion y autorizacion.
* MySQL: Sistema de gestion de base de datos relacional.

### Frontend (Web)
* React: Libreria para la interfaz de usuario.
* Vite.js: Herramienta de construccion y desarrollo.
* Bootstrap: Framework CSS para diseño responsivo.

### Movil (v1.0)
* Desarrollo multiplataforma con acceso a todos los modulos del sistema.

## Estado actual del proyecto
El sistema se encuentra en una fase avanzada con las siguientes implementaciones:

* Version Movil 1.0: Lanzamiento oficial que incluye modulos de paqueteria, areas comunes, visitas, usuarios, residentes y reportes.
* Sistema de Auditoria: Implementacion de trazabilidad completa en el backend para registrar acciones de usuarios en los controladores.
* Gestion de Errores: Nueva infraestructura para el manejo centralizado de excepciones y registro en base de datos.
* Modulo de Reportes: Interfaz web y movil para la generacion de informes detallados.
* Seguridad: Validacion de roles y sesiones activa en todas las plataformas.

## Infraestructura de Datos
Se han incorporado tablas especializadas para fortalecer la robustez del sistema:
* Tabla de Auditoria: Almacena el historial de transacciones y movimientos.
* Tabla de Errores: Registro tecnico de fallos para mantenimiento y depuracion.

## Proximos Pasos
* Optimizacion continua de controladores y procedimientos almacenados.
* Refactorizacion de componentes de UI para mejorar la experiencia de usuario.
* Escalabilidad de los modulos de reportes segun requerimientos administrativos.

---
