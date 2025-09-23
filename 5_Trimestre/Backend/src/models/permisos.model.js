import { Model, DataTypes } from "sequelize";

class Permiso extends Model {
  static initModel(sequelize) {
    Permiso.init(
      {
        idPermiso: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        nombrePermiso: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        modelName: "Permiso",
        tableName: "permisos",
        timestamps: false,
      }
    );
    return Permiso;
  }
}

export default Permiso;
