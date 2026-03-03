import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "../Styles/errorPages.css";
import logo from "../../img/logo.png";

const CONFIGS = {
  401: {
    code: "401",
    icono: "bi-lock-fill",
    titulo: "Acceso No Autorizado",
    descripcion:
      "No tienes permiso para acceder a esta sección. Es posible que tu sesión haya expirado o no cuentes con los privilegios necesarios.",
    accion: "Iniciar sesión",
    ruta: "/login",
    accentColor: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
  404: {
    code: "404",
    icono: "bi-compass",
    titulo: "Página No Encontrada",
    descripcion:
      "La página que buscas no existe, fue movida o el enlace está desactualizado. Verifica la URL o regresa al inicio.",
    accion: "Ir al inicio",
    ruta: "/",
    accentColor: "#6366f1",
    bgColor: "rgba(99, 102, 241, 0.1)",
  },
  500: {
    code: "500",
    icono: "bi-wifi-off",
    titulo: "Error de Servidor",
    descripcion:
      "Ocurrió un problema al conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente. Si el problema persiste, contacta al equipo de soporte.",
    accion: "Reintentar",
    ruta: null,
    accentColor: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
};

/**
 * Página de error reutilizable.
 * @param {number} code - 401 | 404 | 500
 */
export default function ErrorPage({ code = 404 }) {
  const navigate = useNavigate();
  const cfg = CONFIGS[code] || CONFIGS[404];

  const handleAccion = () => {
    if (cfg.ruta) {
      navigate(cfg.ruta);
    } else {
      globalThis.location.reload();
    }
  };

  return (
    <div className="ep-root">
      {/* Fondo decorativo */}
      <div
        className="ep-bg-circle ep-bg-left"
        style={{ background: cfg.bgColor }}
      />
      <div
        className="ep-bg-circle ep-bg-right"
        style={{ background: cfg.bgColor }}
      />

      <div className="ep-card">
        {/* Logo */}
        <img src={logo} alt="Comunidad Inteligente" className="ep-logo" />

        {/* Código de error */}
        <div className="ep-code-wrap" style={{ color: cfg.accentColor }}>
          <span className="ep-code">{cfg.code}</span>
        </div>

        {/* Icono */}
        <div
          className="ep-icon-wrap"
          style={{ background: cfg.bgColor, color: cfg.accentColor }}
        >
          <i className={`bi ${cfg.icono}`}></i>
        </div>

        {/* Título */}
        <h1 className="ep-title">{cfg.titulo}</h1>

        {/* Descripción */}
        <p className="ep-desc">{cfg.descripcion}</p>

        {/* Acciones */}
        <div className="ep-actions">
          <button
            className="ep-btn-primary"
            style={{ background: cfg.accentColor }}
            onClick={handleAccion}
          >
            {code === 500 ? (
              <>
                <i className="bi bi-arrow-clockwise"></i> Reintentar
              </>
            ) : (
              <>
                <i className="bi bi-arrow-left"></i> {cfg.accion}
              </>
            )}
          </button>

          <button className="ep-btn-ghost" onClick={() => navigate(-1)}>
            <i className="bi bi-chevron-left"></i> Volver atrás
          </button>
        </div>

        {/* Código técnico */}
        <div
          className="ep-badge"
          style={{ color: cfg.accentColor, borderColor: cfg.accentColor }}
        >
          <i className="bi bi-info-circle"></i>
          {code === 401 && "Sesión inválida o sin permisos suficientes"}
          {code === 404 && "El recurso solicitado no fue encontrado"}
          {code === 500 &&
            "Error interno · contacta al administrador si persiste"}
        </div>
      </div>
    </div>
  );
}

ErrorPage.propTypes = {
  code: PropTypes.number,
};
