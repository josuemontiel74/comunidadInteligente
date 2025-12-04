import { Model, DataTypes } from "sequelize";

class ReservarAreas extends Model {
  static initModel(sequelize) {
    ReservarAreas.init(
      {
        idReservas: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        apartamentoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        areaComunId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        fechaReserva: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        horaInicio: {
          type: DataTypes.TIME,
          allowNull: false,
        },
        horaFin: {
          type: DataTypes.TIME,
          allowNull: false,
        },
        motivoReserva: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        cantidadAsistentes: {
          type: DataTypes.TINYINT(4),
          allowNull: false,
        },
        invitadosExternos: {
          type: DataTypes.TINYINT(1),
          allowNull: false,
        },
        aceptaReglamento: {
          type: DataTypes.TINYINT(1),
          allowNull: false,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        documentoSolicitante: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "ReservarAreas",
        tableName: "reservasAreas",
        timestamps: false,
      }
    );
    return ReservarAreas;
  }
}

export default ReservarAreas;
