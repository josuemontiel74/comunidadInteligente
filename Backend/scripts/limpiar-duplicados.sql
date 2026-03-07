-- ============================================================
-- SCRIPT: limpiar-duplicados.sql
-- DESCRIPCIÓN: Finaliza registros duplicados de ocupantes activos
--              en el mismo apartamento con el mismo tipo de ocupación.
--              Conserva el registro más reciente (mayor idOcupante).
--
-- INSTRUCCIONES:
--   1. Hacer backup antes de ejecutar (./backup-database.ps1)
--   2. Revisar los duplicados con las consultas SELECT previas
--   3. Ejecutar las consultas UPDATE para finalizar duplicados
-- ============================================================

-- ============================================================
-- CONSTANTES DE SESIÓN
-- ============================================================
SET @TIPO_PROPIETARIO   = 'propietario';
SET @TIPO_ARRENDATARIO  = 'arrendatario';
-- Estados finalizados: Inactivo(2), Retirado(3), Suspendido(4), Finalizado(9)
SET @ESTADOS_EXCLUIDOS  = '2,3,4,9';

-- ============================================================
-- 1. DIAGNÓSTICO: Ver duplicados actuales
-- ============================================================

-- Propietarios duplicados por apartamento
SELECT
  apartamentosId,
  tipoOcupacion,
  COUNT(*) AS total_activos,
  GROUP_CONCAT(idOcupante ORDER BY idOcupante DESC) AS ids_ocupantes
FROM ocupante
WHERE tipoOcupacion = @TIPO_PROPIETARIO
  AND estadoId NOT IN (2, 3, 4, 9)
GROUP BY apartamentosId, tipoOcupacion
HAVING COUNT(*) > 1;

-- Arrendatarios duplicados por apartamento
SELECT
  apartamentosId,
  tipoOcupacion,
  COUNT(*) AS total_activos,
  GROUP_CONCAT(idOcupante ORDER BY idOcupante DESC) AS ids_ocupantes
FROM ocupante
WHERE tipoOcupacion = @TIPO_ARRENDATARIO
  AND estadoId NOT IN (2, 3, 4, 9)
GROUP BY apartamentosId, tipoOcupacion
HAVING COUNT(*) > 1;


-- ============================================================
-- 2. LIMPIEZA: Finalizar propietarios duplicados
--    (conserva el de mayor idOcupante por apartamento)
-- ============================================================
UPDATE ocupante
SET
  estadoId   = 9,
  fechaFin   = CURDATE()
WHERE tipoOcupacion = @TIPO_PROPIETARIO
  AND estadoId NOT IN (2, 3, 4, 9)
  AND idOcupante NOT IN (
    SELECT maxId FROM (
      SELECT MAX(idOcupante) AS maxId
      FROM ocupante
      WHERE tipoOcupacion = @TIPO_PROPIETARIO
        AND estadoId NOT IN (2, 3, 4, 9)
      GROUP BY apartamentosId
    ) AS t
  );


-- ============================================================
-- 3. LIMPIEZA: Finalizar arrendatarios duplicados
--    (conserva el de mayor idOcupante por apartamento)
-- ============================================================
UPDATE ocupante
SET
  estadoId   = 9,
  fechaFin   = CURDATE()
WHERE tipoOcupacion = @TIPO_ARRENDATARIO
  AND estadoId NOT IN (2, 3, 4, 9)
  AND idOcupante NOT IN (
    SELECT maxId FROM (
      SELECT MAX(idOcupante) AS maxId
      FROM ocupante
      WHERE tipoOcupacion = @TIPO_ARRENDATARIO
        AND estadoId NOT IN (2, 3, 4, 9)
      GROUP BY apartamentosId
    ) AS t
  );


-- ============================================================
-- 4. VERIFICACIÓN POST-LIMPIEZA
-- ============================================================

-- No debe retornar filas si la limpieza fue exitosa
SELECT
  apartamentosId,
  tipoOcupacion,
  COUNT(*) AS total_activos
FROM ocupante
WHERE tipoOcupacion IN (@TIPO_PROPIETARIO, @TIPO_ARRENDATARIO)
  AND estadoId NOT IN (2, 3, 4, 9)
GROUP BY apartamentosId, tipoOcupacion
HAVING COUNT(*) > 1;

