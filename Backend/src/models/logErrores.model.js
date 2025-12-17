import { Model, DataTypes } from "sequelize";

class logErrores extends Model {
  static initModel(sequelize) {
    logErrores.init(
      {
        idLog: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        fechaHora: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        nivel: {
          type: DataTypes.STRING(15),
          allowNull: false,
        },
        username: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        rutaAfectada: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        mensajeError: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        stackTrace: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "logErrores",
        tableName: "logErrores",
        timestamps: false,
      }
    );
    return logErrores;
  }
}

export default logErrores;
