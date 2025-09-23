import { Model, DataTypes } from "sequelize";

class Visitante extends Model {
  static initModel(sequelize) {
    Visitante.init(
      {
        numeroDocumento: {
          type: DataTypes.STRING(20),
          primaryKey: true,
          allowNull: false,
        },
        tipoDocumentoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        nombreVisitante: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "visitantes",
        tableName: "visitantes",
        timestamps: false,
      }
    );
    return Visitante;
  }
}

export default Visitante;
