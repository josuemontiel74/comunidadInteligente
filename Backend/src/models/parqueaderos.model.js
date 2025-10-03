import { Model, DataTypes } from "sequelize";

class Parqueadero extends Model {
  static initModel(sequelize) {
    Parqueadero.init(
      {
        codigoParqueadero: {
          type: DataTypes.STRING(10),
          primaryKey: true,
        },
        tipoVehiculoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "Parqueadero",
        tableName: "parqueaderos",
        timestamps: false,
      }
    );
    return Parqueadero;
  }
}
export default Parqueadero;
