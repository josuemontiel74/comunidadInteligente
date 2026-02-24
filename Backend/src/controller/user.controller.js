import { Op } from "sequelize";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Persona from "../models/personas.model.js";
import Rol from "../models/rol.model.js";
import TipoDocumento from "../models/tipoDocumento.model.js";
import Estado from "../models/estados.model.js";
import { registrarAuditoria } from "../services/auditorias.service.js";
import { registrarFallo } from "../services/logger.service.js";

export const crearUsuario = async (req, res) => {
  try {
    const dataUser = req.body;

    const nuevaPersona = await Persona.create({
      numeroDocumento: dataUser.numeroDocumento,
      tipoDocumentoId: dataUser.tipoDocumentoId,
      primerNombre: dataUser.primerNombre,
      segundoNombre: dataUser.segundoNombre,
      primerApellido: dataUser.primerApellido,
      segundoApellido: dataUser.segundoApellido,
      telefono: dataUser.telefono,
      correoElectronico: dataUser.correoElectronico,
    });

    let crearUser =
      (dataUser.primerNombre?.substring(0, 5) || "") +
      (dataUser.primerApellido?.substring(0, 2) || "");

    const buscarUsername = await User.findOne({
      where: { username: crearUser },
    });
    if (buscarUsername) {
      crearUser = `${crearUser}${Math.floor(Math.random() * 99999)}`;
    }

    const hashedPassword = await bcrypt.hash(dataUser.password, 10);

    const createUser = await User.create({
      username: crearUser,
      numeroDocumento: nuevaPersona.numeroDocumento,
      password: hashedPassword,
      rolesId: dataUser.rolesId,
      estadoId: dataUser.estadoId ?? 1,
    });

    // Registrar en auditoría - Usar el username (llave primaria) como idRegistroAfectado
    const usuarioActual = req.user?.username || "desconocido";
    const usuarioCreadoUsername = createUser.username; // Capturar el username del usuario recién creado

    await registrarAuditoria(
      usuarioActual,
      "usuarios",
      "INSERT",
      usuarioCreadoUsername,
    );

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Usuario y Persona creados",
      usuario: {
        username: createUser.username,
        username: createUser.username,
      },
      persona: {
        numeroDocumento: nuevaPersona.numeroDocumento,
      },
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "POST /usuarios";

    // Manejo específico para errores de duplicado
    if (error.name === "SequelizeUniqueConstraintError") {
      const campo = error.errors[0]?.path;
      const valor = error.errors[0]?.value;

      return res.status(409).json({
        ok: false,
        message: `El ${campo} '${valor}' ya está registrado`,
        status: 409,
      });
    }

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    res.status(500).json({
      ok: false,
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerUsuario = async (req, res) => {
  try {
    await User.sync();
    const usuarios = await User.findAll({
      include: [
        {
          model: Persona,
          as: "Persona",
          attributes: [
            "numeroDocumento",
            "primerNombre",
            "segundoNombre",
            "primerApellido",
            "segundoApellido",
            "telefono",
            "correoElectronico",
            "tipoDocumentoId",
          ],
          include: [
            {
              model: TipoDocumento,
              as: "TipoDocumento",
              attributes: ["idTipoDocumento", "nombreDocumento"],
            },
          ],
        },
        {
          model: Rol,
          as: "Rol",
          attributes: ["idRol", "nombreRol"],
        },
        {
          model: Estado,
          as: "Estado",
          attributes: ["idEstado", "nombreEstado"],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Usuarios",
      body: usuarios,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /usuarios";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerUsuarioPorId = async (req, res) => {
  try {
    await User.sync();
    const username = decodeURIComponent(req.params.username);
    const usuario = await User.findByPk(username);
    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        status: 404,
      });
    }
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Usuario por username",
      body: usuario,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /usuarios/:id";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
export const actualizarUsuario = async (req, res) => {
  const dataUser = req.body;
  const username = req.params.username;
  const requester = req.user;
  const usuarioQueActualiza = requester?.username || "desconocido";

  try {
    const usuario = await User.findByPk(username, {
      include: [{ model: Persona, as: "Persona" }],
    });
    // volver activar

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (
      usuario.rolesId === 1 &&
      requester.rolesId !== 1 &&
      typeof dataUser.estadoId !== "undefined"
    ) {
      return res.status(403).json({
        ok: false,
        status: 403,
        message: "No tienes permisos para cambiar el estado de un superadmin",
      });
    }

    if (
      requester.username === username &&
      typeof dataUser.estadoId !== "undefined" &&
      dataUser.estadoId !== usuario.estadoId
    ) {
      return res.status(403).json({
        ok: false,
        status: 403,
        message: "No puedes cambiar tu propio estado",
      });
    }

    if (dataUser.password) {
      dataUser.password = await bcrypt.hash(dataUser.password, 10);
    }

    await usuario.update(dataUser);

    if (usuario.Persona && dataUser.numeroDocumento) {
      await usuario.Persona.update({
        tipoDocumentoId: dataUser.tipoDocumentoId,
        primerNombre: dataUser.primerNombre,
        segundoNombre: dataUser.segundoNombre,
        primerApellido: dataUser.primerApellido,
        segundoApellido: dataUser.segundoApellido,
        telefono: dataUser.telefono,
        correoElectronico: dataUser.correoElectronico,
      });
    }

    // Registrar en auditoría después de confirmar la actualización
    await registrarAuditoria(
      usuarioQueActualiza,
      "usuarios",
      "UPDATE",
      username,
    );

    const { password, ...usuarioSinPass } = usuario.toJSON();

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Usuario y Persona actualizados",
      body: usuarioSinPass,
    });
  } catch (error) {
    const ruta = "PUT /usuarios/:id";

    await registrarFallo(
      "ERROR",
      usuarioQueActualiza,
      ruta,
      error.message,
      error.stack,
    );

    return res.status(500).json({
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    await User.sync();
    const { username, password } = req.body;

    // Buscar usuario e incluir la relación con Rol
    const usuario = await User.findOne({
      where: { username },
      include: [
        {
          model: Rol,
          as: "Rol",
          attributes: ["idRol", "nombreRol"],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        status: 404,
      });
    }

    const contraseñaValida = await bcrypt.compare(password, usuario.password);
    if (!contraseñaValida) {
      return res.status(401).json({
        message: "Contraseña incorrecta",
        status: 401,
      });
    }

    // Obtener el nombre del rol
    const nombreRol = usuario.Rol ? usuario.Rol.nombreRol : "sin rol";

    const token = jwt.sign(
      {
        username: usuario.username,
        rolesId: usuario.rolesId,
        rol: nombreRol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Registrar actividad al iniciar sesión
    await usuario.update({ ultimaActividad: new Date() });

    const {
      username: nombreUsuario,
      numeroDocumento,
      rolesId,
      estadoId,
      fotoPerfil,
    } = usuario;

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Login exitoso",
      token,
      usuario: {
        username: nombreUsuario,
        numeroDocumento,
        rolesId,
        estadoId,
        rol: nombreRol,
        fotoPerfil: fotoPerfil || null,
      },
    });
  } catch (error) {
    const username = req.body?.username || "desconocido";
    const ruta = "POST /login";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const buscarUsuarios = async (req, res) => {
  try {
    await User.sync();
    const estadoId = decodeURIComponent(req.params.estadoId);
    const usuario = await User.findAll({ where: { estadoId } });
    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado texto",
        status: 404,
        error: error.message,
      });
    }
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Usuario por username",
      body: usuario,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /usuarios/search/:username";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const reactivarUsuario = async (req, res) => {
  const username = req.params.usernameAtivar;
  const usuarioQueActualiza = req.user?.username || "desconocido";

  try {
    const usuario = await User.findByPk(username);
    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        status: 404,
      });
    }

    await usuario.update({ estadoId: 1 });

    await registrarAuditoria(
      usuarioQueActualiza,
      "usuarios",
      "PATCH",
      username,
    );

    res.status(200).json({
      message: "El usuario ha sido reactivado correctamente",
      status: 200,
    });
  } catch (error) {
    const ruta = "PATCH /usuarios/reactivar/:usernameAtivar";

    await registrarFallo(
      "ERROR",
      usuarioQueActualiza,
      ruta,
      error.message,
      error.stack,
    );

    return res.status(500).json({
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};

/**
 * Cerrar sesión del usuario.
 * NO resetea ultimaActividad — el usuario seguirá apareciendo "en línea"
 * hasta que expire el umbral de 5 minutos de forma natural.
 */
export const logoutUsuario = async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res
        .status(400)
        .json({ ok: false, message: "Usuario no identificado" });
    }

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Sesión cerrada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al cerrar sesión",
      error: error.message,
    });
  }
};

/**
 * Obtener usuarios en línea.
 * Se considera "en línea" si ultimaActividad fue en los últimos 5 minutos.
 * Devuelve un objeto { [username]: true } para cada usuario en línea.
 */
export const obtenerUsuariosEnLinea = async (req, res) => {
  try {
    const MINUTOS_UMBRAL = 5;
    const umbral = new Date(Date.now() - MINUTOS_UMBRAL * 60 * 1000);

    const usuariosOnline = await User.findAll({
      where: {
        ultimaActividad: { [Op.gte]: umbral },
        estadoId: 1,
      },
      attributes: ["username", "ultimaActividad"],
    });

    const enLineaMap = {};
    usuariosOnline.forEach((u) => {
      enLineaMap[u.username] = true;
    });

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Usuarios en línea",
      enLinea: enLineaMap,
      total: usuariosOnline.length,
    });
  } catch (error) {
    const username = req.user?.username || "desconocido";
    const ruta = "GET /usuarios/en-linea";

    await registrarFallo("ERROR", username, ruta, error.message, error.stack);

    return res.status(500).json({
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};

/**
 * Actualizar solo la foto de perfil de un usuario.
 * Body: { fotoPerfil: "data:image/...;base64,..." }  o  { fotoPerfil: null }
 */
export const actualizarFotoPerfil = async (req, res) => {
  const { username } = req.params;
  const { fotoPerfil } = req.body;
  const requester = req.user?.username || "desconocido";

  try {
    const usuario = await User.findByPk(username);
    if (!usuario) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado" });
    }

    await usuario.update({ fotoPerfil: fotoPerfil || null });

    await registrarAuditoria(requester, "usuarios", "UPDATE", username);

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Foto de perfil actualizada",
      fotoPerfil: fotoPerfil || null,
    });
  } catch (error) {
    await registrarFallo(
      "ERROR",
      requester,
      "PUT /usuario/:username/foto",
      error.message,
      error.stack,
    );
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar la foto de perfil",
      error: error.message,
    });
  }
};

export const inactivarUsuario = async (req, res) => {
  const username = req.params.username;
  const usuarioQueActualiza = req.user?.username || "desconocido";

  try {
    const usuario = await User.findByPk(username);
    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        status: 404,
      });
    }

    // Realizar la actualización del estado
    await usuario.update({ estadoId: 2 });

    // Registrar en auditoría DESPUÉS de confirmar la actualización
    await registrarAuditoria(
      usuarioQueActualiza,
      "usuarios",
      "DELETE",
      username, // El username es el identificador del usuario afectado
    );

    res.status(200).json({
      message: "El usuario ha sido finalizado correctamente",
      status: 200,
    });
  } catch (error) {
    const ruta = "DELETE /usuarios/:id";

    // Registrar el error en el logger
    await registrarFallo(
      "ERROR",
      usuarioQueActualiza,
      ruta,
      error.message,
      error.stack,
    );

    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
