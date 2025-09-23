// src/models/estados.model.js
import { Model, DataTypes } from "sequelize";

class Estado extends Model {
  static initModel(sequelize) {
    Estado.init(
      {
        IdEstado: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
        },
        nombreEstado: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "estados",
        tableName: "estados",
        timestamps: false,
      }
    );
    return Estado;
  }
}

export default Estado;
