import { Model, DataTypes } from "sequelize";

class Apartamento extends Model {
  static initModel(sequelize) {
    Apartamento.init(
      {
        IdApartamento: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
        },
        torresId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        numeroApartamento: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "apartamentos",
        tableName: "apartamentos",
        timestamps: false,
      }
    );
    return Apartamento;
  }
}

export default Apartamento;
