import { Model, DataTypes } from "sequelize";
import apartamentos from "./apartamentos.model.js";

class Torre extends Model {
  static initModel(sequelize) {
    Torre.init(
      {
        idTorre: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },

        nombreTorre: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        modelName: "torres",
        tableName: "torres",
        timestamps: false,
      }
    );
    return Torre;
  }
}

export default Torre;
