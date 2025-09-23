import jwt from "jsonwebtoken";

export const validarJWT = (req, res, next) => {
  const authHeader = req.header("Authorization") || req.header("authorization");
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

  if (!token) {
    return res.status(401).json({
      ok: false,
      status: 401,
      message: "No token en la petición",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      idUsuario: decoded.idUsuario,
      rol: decoded.rol,
      ...decoded,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        status: 401,
        message: "El token ha expirado, inicia sesión nuevamente",
      });
    }
    return res.status(401).json({
      ok: false,
      status: 401,
      message: "Token no válido",
    });
  }
};

export const validarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rolesId)) {
      return res.status(403).json({
        ok: false,
        status: 403,
        message: "No tienes permisos para realizar esta acción",
      });
    }
    next();
  };
};


