import { Model, DataTypes } from "sequelize";

export default class areaComun extends Model {
  static initModel(sequelize) {
    return areaComun.init(
      {
        idAreaComun: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        nombreArea: {
          type: DataTypes.STRING(45),
          allowNull: false,
        },
        descripcion: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: null,
        },
        capacidad: {
          type: DataTypes.TINYINT,
          allowNull: false,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "areaComun",
        tableName: "areaComun",
        timestamps: false,
      }
    );
  }
}
