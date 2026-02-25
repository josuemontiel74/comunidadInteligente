import { sequelize } from "../src/config/connect.db.js";

const [rows] = await sequelize.query(`
  SELECT oc.idOcupante, oc.estadoId, es.nombreEstado, oc.tipoOcupacion, 
         ap.numeroApartamento, ap.torresId
  FROM ocupante oc
  JOIN estados es ON oc.estadoId = es.idEstado
  JOIN apartamentos ap ON oc.apartamentosId = ap.idApartamento
  ORDER BY oc.estadoId
  LIMIT 20
`);
console.log("\n=== ESTADOS REALES EN BD ===");
console.table(rows);

const [resumen] = await sequelize.query(`
  SELECT es.nombreEstado, es.idEstado, COUNT(*) as total
  FROM ocupante oc
  JOIN estados es ON oc.estadoId = es.idEstado
  GROUP BY oc.estadoId, es.nombreEstado
`);
console.log("\n=== RESUMEN POR ESTADO ===");
console.table(resumen);

process.exit(0);
