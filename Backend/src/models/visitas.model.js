import { Model, DataTypes } from "sequelize";

class Visitas extends Model {
  static initModel(sequelize) {
    Visitas.init(
      {
        idVisita: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        numeroDocumento: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        apartamentoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        fechaHoraIngreso: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fechaHoraSalida: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        vehiculoMatricula: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        observaciones: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        telefono: {
          type: DataTypes.STRING(15),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "visitas",
        tableName: "visitas",
        timestamps: false,
      },
    );
    return Visitas;
  }
}

export default Visitas;
