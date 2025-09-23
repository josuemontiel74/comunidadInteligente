import { DataTypes } from "sequelize";

function initRolesPermisos(sequelize, Rol, Permiso) {
  const RolesPermisos = sequelize.define(
    "rolesPermisos",
    {
      idRol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: Rol,
          key: "idRol",
        },
      },
      idPermiso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: Permiso,
          key: "idPermiso",
        },
      },
    },
    {
      tableName: "rolespermisos",
      timestamps: false,
    }
  );

  Rol.belongsToMany(Permiso, {
    through: RolesPermisos,
    foreignKey: "idRol",
  });

  Permiso.belongsToMany(Rol, {
    through: RolesPermisos,
    foreignKey: "idPermiso",
  });

  return RolesPermisos;
}

export default initRolesPermisos;
