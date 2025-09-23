import { Model, DataTypes } from "sequelize";

class Rol extends Model {
  static initModel(sequelize) {
    Rol.init(
      {
        idRol: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        nombreRol: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        modelName: "Rol",
        tableName: "roles",
        timestamps: false,
      }
    );
    return Rol;
  }
}

export default Rol;
