import { Model, DataTypes } from "sequelize";

class RecepcionPaquetes extends Model {
  static initModel(sequelize) {
    RecepcionPaquetes.init(
      {
        idPaquete: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        apartamentoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        nombreDestinatario: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        empresaMensajeria: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        fechaRecepcion: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fechaEntrega: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
        observaciones: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: null,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "recepcionPaquetes",
        tableName: "recepcionPaquetes",
        timestamps: false,
      }
    );
    return RecepcionPaquetes;
  }
}

export default RecepcionPaquetes;
