import { Model, DataTypes } from "sequelize";

class Auditorias extends Model {
  static initModel(sequelize) {
    Auditorias.init(
      {
        idAuditoria: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        username: {
          type: DataTypes.STRING(45),
          allowNull: false,
        },
        fechaHoraAuditoria: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        operacionRealizada: {
          type: DataTypes.STRING(45),
          allowNull: false,
        },
        tablaAfectada: {
          type: DataTypes.STRING(45),
          allowNull: false,
        },
        idRegistroAfectado: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "auditorias",
        tableName: "auditorias",
        timestamps: false,
      }
    );
    return Auditorias;
  }
}

export default Auditorias;
