import { sequelize } from "./connect.db.js";
import personasRoutes from "../routers/personas.router.js";
import tipodocumentosRoutes from "../routers/tipodocumentos.router.js";

export const modelsApp = function initModels(select) {
  if (select) {
    tipodocumentosRoutes.hasMany(personasRoutes, {
      name: "tipoDocumentoId",
      field: "tipoDocumentoId",
      AllowNull: false,
    });
    personasRoutes.belongsTo(tipodocumentosRoutes, {
      foreignKey: {
        name: "tipoDocumentoId",
        field: "tipoDocumentoId",
        AllowNull: false,
      },
    });
    sequelize.sync();
  }
};
