import { Model, DataTypes } from "sequelize";

export default class Tipodocumentos extends Model {
  static initModel(sequelize) {
    return Tipodocumentos.init(
      {
        idTipoDocumento: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        nombreDocumento: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        abreviatura: {
          type: DataTypes.STRING(5),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "tipodocumentos",
        tableName: "tipodocumentos",
        timestamps: false,
      }
    );
  }
}
