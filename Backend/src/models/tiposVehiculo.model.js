import { Model, DataTypes } from "sequelize";

export default class TiposVehiculo extends Model {
  static initModel(sequelize) {
    return TiposVehiculo.init(
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
        tableName: "tiposvehiculo",
        timestamps: false,
      },
    );
  }
}
