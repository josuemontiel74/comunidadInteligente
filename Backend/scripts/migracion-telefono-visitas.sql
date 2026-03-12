-- Migración: Agregar columna telefono a la tabla visitas
-- Fecha: 2026-03-12
-- Descripción: Permite registrar el número de teléfono del visitante
--              para que el vigilante pueda contactarlo cuando la visita venza.

ALTER TABLE visitas
ADD COLUMN telefono VARCHAR(15) NULL
AFTER observaciones;
