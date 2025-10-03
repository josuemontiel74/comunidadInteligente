import { Model, DataTypes } from "sequelize";

class Ocupante extends Model {
  static initModel(sequelize) {
    Ocupante.init(
      {
        idOcupante: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
        },
        apartamentosId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "apartamentos",
            key: "IdApartamento",
          },
        },
        numeroDocumento: {
          type: DataTypes.STRING(20),
          allowNull: false,
          references: {
            model: "personas",
            key: "numeroDocumento",
          },
        },
        tipoOcupacion: {
          type: DataTypes.ENUM("propietario", "arrendatario"),
          allowNull: false,
        },
        personasACargo: {
          type: DataTypes.TINYINT(4),
          allowNull: true,
        },
        fechaInicio: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        fechaFin: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        estadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      {
        sequelize,
        tableName: "ocupante",
        modelName: "Ocupante",
        timestamps: false,
      }
    );
    return Ocupante;
  }
}

export default Ocupante;
