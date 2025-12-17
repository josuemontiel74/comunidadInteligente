// src/models/initModels.js
import Estado from "./estados.model.js";
import Apartamento from "./apartamentos.model.js";
import Torre from "./torres.model.js";
import Usuario from "./user.model.js";
import Ocupante from "./ocupante.model.js";
import Personas from "./personas.model.js";
import Rol from "./rol.model.js";
import Permiso from "./permisos.model.js";
import initRolesPermisos from "./rolespermisos.model.js";
import tiposVehiculo from "./tiposVehiculo.model.js";
import tipodocumento from "./tipoDocumento.model.js";
import Parqueadero from "./parqueaderos.model.js";
import Vehiculo from "./vehiculo.model.js";
import Visitante from "./visitantes.model.js";
import Visita from "./visitas.model.js";
import RecepcionPaquetes from "./recepcionPaquetes.model.js";
import Solicitante from "./solicitante.model.js";
import AreaComun from "./areaComun.model.js";
import ReservaArea from "./reservasAreas.model.js";
import Auditorias from "./auditorias.model.js";
import logErrores from "./logErrores.model.js";

export function initModels(sequelize) {
  const EstadoModel = Estado.initModel(sequelize);
  const ApartamentoModel = Apartamento.initModel(sequelize);
  const TorreModel = Torre.initModel(sequelize);
  const UsuarioModel = Usuario.initModel(sequelize);
  const OcupanteModel = Ocupante.initModel(sequelize);
  const PersonasModel = Personas.initModel(sequelize);
  const RolModel = Rol.initModel(sequelize);
  const PermisoModel = Permiso.initModel(sequelize);
  const tiposVehiculoModel = tiposVehiculo.initModel(sequelize);
  const tipodocumentoModel = tipodocumento.initModel(sequelize);
  const ParqueaderoModel = Parqueadero.initModel(sequelize);
  const VehiculoModel = Vehiculo.initModel(sequelize);
  const VisitanteModel = Visitante.initModel(sequelize);
  const VisitaModel = Visita.initModel(sequelize);
  const RecepcionPaquetesModel = RecepcionPaquetes.initModel(sequelize);
  const SolicitanteModel = Solicitante.initModel(sequelize);
  const AreasModel = AreaComun.initModel(sequelize);
  const ReservasAreasModel = ReservaArea.initModel(sequelize);
  const AuditoriasModel = Auditorias.initModel(sequelize);
  const LogErroresModel = logErrores.initModel(sequelize);

  const RolesPermisosModel = initRolesPermisos(
    sequelize,
    RolModel,
    PermisoModel
  );

  // 2. Asociaciones
  EstadoModel.hasMany(ApartamentoModel, { foreignKey: "estadoId" });
  ApartamentoModel.belongsTo(EstadoModel, { foreignKey: "estadoId" });

  TorreModel.hasMany(ApartamentoModel, { foreignKey: "torresId" });
  ApartamentoModel.belongsTo(TorreModel, { foreignKey: "torresId" });

  EstadoModel.hasMany(UsuarioModel, { foreignKey: "estadoId" });
  UsuarioModel.belongsTo(EstadoModel, { foreignKey: "estadoId", as: "Estado" });

  ApartamentoModel.hasMany(OcupanteModel, { foreignKey: "apartamentosId" });
  OcupanteModel.belongsTo(ApartamentoModel, { foreignKey: "apartamentosId" });

  PersonasModel.hasMany(OcupanteModel, { foreignKey: "numeroDocumento" });
  OcupanteModel.belongsTo(PersonasModel, {
    foreignKey: "numeroDocumento",
    as: "persona",
  });

  OcupanteModel.belongsTo(EstadoModel, { foreignKey: "estadoId" });
  EstadoModel.hasMany(OcupanteModel, { foreignKey: "estadoId" });

  RolModel.hasMany(UsuarioModel, { foreignKey: "rolesId" });
  UsuarioModel.belongsTo(RolModel, { foreignKey: "rolesId", as: "Rol" });

  PersonasModel.hasMany(UsuarioModel, {
    foreignKey: "numeroDocumento",
    onDelete: "RESTRICT",
  });

  UsuarioModel.belongsTo(PersonasModel, {
    foreignKey: "numeroDocumento",
    as: "Persona",
  });

  tiposVehiculoModel.hasMany(ParqueaderoModel, {
    foreignKey: "tipoVehiculoId",
  });

  VehiculoModel.belongsTo(tiposVehiculoModel, { foreignKey: "tipoVehiculoId" });
  tiposVehiculoModel.hasMany(VehiculoModel, { foreignKey: "tipoVehiculoId" });

  ParqueaderoModel.belongsTo(tiposVehiculoModel, {
    foreignKey: "tipoVehiculoId",
  });

  tipodocumentoModel.hasMany(PersonasModel, { foreignKey: "tipoDocumentoId" });
  PersonasModel.belongsTo(tipodocumentoModel, {
    foreignKey: "tipoDocumentoId",
    as: "TipoDocumento",
  });

  EstadoModel.hasMany(ParqueaderoModel, { foreignKey: "estadoId" });
  ParqueaderoModel.belongsTo(EstadoModel, { foreignKey: "estadoId" });

  ParqueaderoModel.hasMany(VehiculoModel, { foreignKey: "codigoParqueadero" });
  VehiculoModel.belongsTo(ParqueaderoModel, {
    foreignKey: "codigoParqueadero",
  });

  tipodocumentoModel.hasMany(VisitanteModel, { foreignKey: "tipoDocumentoId" });
  VisitanteModel.belongsTo(tipodocumentoModel, {
    foreignKey: "tipoDocumentoId",
    as: "TipoDocumento",
  });

  VisitanteModel.hasMany(VisitaModel, { foreignKey: "numeroDocumento" });
  VisitaModel.belongsTo(VisitanteModel, { foreignKey: "numeroDocumento" });

  ApartamentoModel.hasMany(VisitaModel, { foreignKey: "apartamentoId" });
  VisitaModel.belongsTo(ApartamentoModel, { foreignKey: "apartamentoId" });

  EstadoModel.hasMany(VisitaModel, { foreignKey: "estadoId" });
  VisitaModel.belongsTo(EstadoModel, { foreignKey: "estadoId" });

  VisitaModel.belongsTo(VehiculoModel, { foreignKey: "vehiculoMatricula" });
  VehiculoModel.hasMany(VisitaModel, { foreignKey: "vehiculoMatricula" });

  VehiculoModel.belongsTo(tiposVehiculoModel, { foreignKey: "tipoVehiculoId" });
  tiposVehiculoModel.hasMany(VehiculoModel, { foreignKey: "tipoVehiculoId" });

  ApartamentoModel.hasMany(RecepcionPaquetesModel, {
    foreignKey: "apartamentoId",
  });
  RecepcionPaquetesModel.belongsTo(ApartamentoModel, {
    foreignKey: "apartamentoId",
  });
  EstadoModel.hasMany(RecepcionPaquetesModel, { foreignKey: "estadoId" });
  RecepcionPaquetesModel.belongsTo(EstadoModel, { foreignKey: "estadoId" });

  tipodocumentoModel.hasMany(SolicitanteModel, {
    foreignKey: "tipoDocumentoId",
  });
  SolicitanteModel.belongsTo(tipodocumentoModel, {
    as: "TipoDocumento",
    foreignKey: "tipoDocumentoId",
  });
  EstadoModel.hasMany(AreasModel, { foreignKey: "estadoId" });
  AreasModel.belongsTo(EstadoModel, { foreignKey: "estadoId" });

  AreasModel.hasMany(ReservasAreasModel, { foreignKey: "areaComunId" });
  ReservasAreasModel.belongsTo(AreasModel, { foreignKey: "areaComunId" });

  ApartamentoModel.hasMany(ReservasAreasModel, { foreignKey: "apartamentoId" });
  ReservasAreasModel.belongsTo(ApartamentoModel, {
    foreignKey: "apartamentoId",
  });

  EstadoModel.hasMany(ReservasAreasModel, { foreignKey: "estadoId" });
  ReservasAreasModel.belongsTo(EstadoModel, { foreignKey: "estadoId" });

  SolicitanteModel.hasMany(ReservasAreasModel, {
    foreignKey: "documentoSolicitante",
    onDelete: "CASCADE",
  });
  ReservasAreasModel.belongsTo(SolicitanteModel, {
    foreignKey: "documentoSolicitante",
    onDelete: "CASCADE",
  });

  UsuarioModel.hasMany(AuditoriasModel, { foreignKey: "username" });
  AuditoriasModel.belongsTo(UsuarioModel, { foreignKey: "username" });

  UsuarioModel.hasMany(LogErroresModel, { foreignKey: "username" });
  LogErroresModel.belongsTo(UsuarioModel, { foreignKey: "username" });

  return {
    Estado: EstadoModel,
    Apartamento: ApartamentoModel,
    Torre: TorreModel,
    Usuario: UsuarioModel,
    Ocupante: OcupanteModel,
    Personas: PersonasModel,
    Rol: RolModel,
    Permiso: PermisoModel,
    tiposVehiculo: tiposVehiculoModel,
    tipodocumento: tipodocumentoModel,
    Parqueadero: ParqueaderoModel,
    Vehiculo: VehiculoModel,
    Visitante: VisitanteModel,
    Visita: VisitaModel,
    RolesPermisos: RolesPermisosModel,
    RecepcionPaquetes: RecepcionPaquetesModel,
    Solicitante: SolicitanteModel,
    Areas: AreasModel,
    ReservasAreas: ReservasAreasModel,
    Auditorias: AuditoriasModel,
    LogErrores: LogErroresModel,
  };
}
