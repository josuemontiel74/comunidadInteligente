import { Model, DataTypes } from "sequelize";

class Solicitante extends Model {
  static initModel(sequelize) {
    Solicitante.init(
      {
        documentoSolicitante: {
          type: DataTypes.STRING(20),
          primaryKey: true,
          allowNull: false,
        },
        nombreSolicitante: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        telefonoSolicitante: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        correoSolicitante: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        tipoDocumentoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "Solicitante",
        tableName: "solicitante",
        timestamps: false,
      }
    );
    return Solicitante;
  }
}
export default Solicitante;
