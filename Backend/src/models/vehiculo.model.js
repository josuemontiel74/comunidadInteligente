import { Model, DataTypes } from "sequelize";

class Vehiculo extends Model {
  static initModel(sequelize) {
    Vehiculo.init(
      {
        matricula: {
          type: DataTypes.STRING(10),
          primaryKey: true,
          allowNull: false,
        },
        tipoVehiculoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        codigoParqueadero: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "vehiculo",
        tableName: "vehiculo",
        timestamps: false,
      }
    );
    return Vehiculo;
  }
}

export default Vehiculo;
