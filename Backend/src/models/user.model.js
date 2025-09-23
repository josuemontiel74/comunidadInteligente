import { Model, DataTypes } from "sequelize";

class Usuario extends Model {
  static initModel(sequelize) {
    return Usuario.init(
      {
        username: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
        },
        numeroDocumento: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        rolesId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "Usuario",
        tableName: "usuarios",
        timestamps: false,
      }
    );
  }
}

export default Usuario;
