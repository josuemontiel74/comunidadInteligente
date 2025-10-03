import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Persona from "../models/personas.model.js";

export const crearUsuario = async (req, res) => {
  try {
    await User.sync();
    await Persona.sync();

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

    const hashedPassword = await bcrypt.hash(dataUser.password, 10);
    const createUser = await User.create({
      username: dataUser.username,
      numeroDocumento: nuevaPersona.numeroDocumento,
      password: hashedPassword,
      rolesId: dataUser.rolesId,
      estadoId: dataUser.estadoId ? dataUser.estadoId : 1,
    });

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Usuario y Persona creados",
      idUsuario: createUser.username,
      idPersona: nuevaPersona.numeroDocumento,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la petición :(",
      status: 500,
      error: error.message,
    });
  }
};

export const obtenerUsuario = async (req, res) => {
  try {
    await User.sync();
    const usuarios = await User.findAll();
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Mostrando Usuarios",
      body: usuarios,
    });
  } catch (error) {
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
    const username = req.params.username;
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
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
export const actualizarUsuario = async (req, res) => {
  try {
    const dataUser = req.body;
    const username = req.params.username;
    const requester = req.user;

    const usuario = await User.findByPk(username, {
      include: [{ model: Persona, as: "persona" }],
    });

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

    if (usuario.persona && dataUser.numeroDocumento) {
      await usuario.persona.update({
        tipoDocumentoId: dataUser.tipoDocumentoId,
        primerNombre: dataUser.primerNombre,
        segundoNombre: dataUser.segundoNombre,
        primerApellido: dataUser.primerApellido,
        segundoApellido: dataUser.segundoApellido,
        telefono: dataUser.telefono,
        correoElectronico: dataUser.correoElectronico,
      });
    }

    const { password, ...usuarioSinPass } = usuario.toJSON();

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Usuario y Persona actualizados",
      body: usuarioSinPass,
    });
  } catch (error) {
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
    const usuario = await User.findOne({
      where: { username },
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
    const token = jwt.sign(
      { username: usuario.username, rolesId: usuario.rolesId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const {
      username: nombreUsuario,
      numeroDocumento,
      rolesId,
      estadoId,
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
      },
    });
  } catch (error) {
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
    const estadoId = req.params.estadoId;
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
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};

export const inactivarUsuario = async (req, res) => {
  try {
    const username = req.params.username;
    const usuario = await User.findByPk(username);
    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        status: 404,
        error: error.message,
      });
    }
    await usuario.update({ estadoId: 2 });
    res.status(200).json({
      message: "El usuario ha sido finalizado correctamente",
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Algo salió mal en la peticion :(",
      status: 500,
      error: error.message,
    });
  }
};
