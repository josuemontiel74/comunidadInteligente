import RolesPermisos from "../models/rolespermisos.model.js";
import Rol from "../models/rol.model.js";
import Permiso from "../models/permisos.model.js";

export const asignarPermiso = async (req, res) => {
  try {
    const { idRol, idPermiso } = req.body;

    const relacion = await RolesPermisos.create({
      idRol,
      idPermiso,
    });

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Permiso asignado al rol",
      body: relacion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al asignar permiso",
      error: error.message,
    });
  }
};

export const permisosPorRol = async (req, res) => {
  try {
    const { idRol } = req.params;

    const rol = await Rol.findByPk(idRol, {
      include: Permiso,
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Permisos del rol",
      body: rol,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener permisos",
      error: error.message,
    });
  }
};

export const rolesPorPermiso = async (req, res) => {
  try {
    const { idPermiso } = req.params;

    const permiso = await Permiso.findByPk(idPermiso, {
      include: Rol,
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Roles que tienen este permiso",
      body: permiso,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener roles",
      error: error.message,
    });
  }
};

export const eliminarPermisoDeRol = async (req, res) => {
  try {
    const { idRol, idPermiso } = req.body;

    await RolesPermisos.destroy({
      where: { idRol, idPermiso },
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Permiso eliminado del rol",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar permiso",
      error: error.message,
    });
  }
};
