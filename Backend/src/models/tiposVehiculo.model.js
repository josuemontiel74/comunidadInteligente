import { Model, DataTypes } from "sequelize";

export default class tiposVehiculo extends Model {
  static initModel(sequelize) {
    return tiposVehiculo.init(
      {
        idTipoVehiculo: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        nombreVehiculo: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "tiposVehiculo",
        tableName: "tiposVehiculo",
        timestamps: false,
      }
    );
  }
}
