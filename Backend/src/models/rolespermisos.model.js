import { Model, DataTypes } from "sequelize";

class RolesPermisos extends Model {
  static initModel(sequelize) {
    RolesPermisos.init(
      {
        idRol: {
          type: DataTypes.INTEGER,
          primaryKey: true,
        },
        idPermiso: {
          type: DataTypes.INTEGER,
          primaryKey: true,
        },
      },
      {
        sequelize,
        modelName: "rolesPermisos",
        tableName: "rolespermisos",
        timestamps: false,
      },
    );
    return RolesPermisos;
  }
}

export default RolesPermisos;
