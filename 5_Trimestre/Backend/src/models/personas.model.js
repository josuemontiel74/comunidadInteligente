import { Model, DataTypes } from "sequelize";

export default class Personas extends Model {
  static initModel(sequelize) {
    return Personas.init(
      {
        numeroDocumento: {
          type: DataTypes.STRING(20),
          primaryKey: true,
          allowNull: false,
        },
        tipoDocumentoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        primerNombre: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        segundoNombre: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        primerApellido: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        segundoApellido: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        telefono: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        correoElectronico: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "personas",
        tableName: "personas",
        timestamps: false,
      }
    );
  }
}
