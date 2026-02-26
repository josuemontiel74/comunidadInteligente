import React, { useState } from "react";
import "../Styles/login.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import logo from "../../img/logo.png";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { handleSubmit as loginService } from "../services/login.serves.jsx";

const DARK_KEY = "ci_modo_oscuro";
const WA_URL = "https://chat.whatsapp.com/FPvNvN2Ubvc4AyK2IDM67p?mode=gi_t";
const MAX_INTENTOS = 3;

function Login() {
  const navigate = useNavigate();

  const [oscuro, setOscuro] = useState(
    () => localStorage.getItem(DARK_KEY) === "1",
  );

  // Aplicar/quitar modo oscuro en <html>
  React.useEffect(() => {
    const html = document.documentElement;
    if (oscuro) {
      html.dataset.modo = "oscuro";
      localStorage.setItem(DARK_KEY, "1");
    } else {
      delete html.dataset.modo;
      localStorage.removeItem(DARK_KEY);
    }
  }, [oscuro]);

  const [feedback, setFeedback] = useState(null); // null | "ok" | "error"
  const [intentos, setIntentos] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (username.trim() === "" || password.trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Por favor llena todos los campos",
      });
      return;
    }

    try {
      const data = await loginService(username, password);
      if (!data?.usuario || !data?.token) {
        const nuevos = intentos + 1;
        setIntentos(nuevos);
        setFeedback("error");
        setTimeout(() => setFeedback(null), 3500);
        return;
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));
      localStorage.setItem("rol", data.usuario.rolesId);

      if (data.usuario.estadoId !== 2) {
        setFeedback("ok");
        setTimeout(() => {
          // replace:true elimina /login del historial — el usuario
          // no puede volver al login con el botón atrás tras autenticarse
          if (data.usuario.rolesId === 1) {
            navigate("/Superadmin", { replace: true });
          } else if (data.usuario.rolesId === 2) {
            navigate("/Admin", { replace: true });
          } else if (data.usuario.rolesId === 3) {
            navigate("/Vigilante", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }, 3160);
      } else {
        Swal.fire({
          icon: "error",
          title: "Sin acceso",
          text: "No tienes acceso a la aplicación :(",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar al servidor",
      });
    }
  };

  return (
    <div className="lgn-root">
      {/* Fondo desenfocado con imagen del conjunto */}
      <div className="lgn-bg" />
      {/* Overlay — se oscurece más en modo oscuro */}
      <div className="lgn-overlay" />

      {/* Botón modo oscuro — esquina superior derecha */}
      <button
        className="lgn-dark-btn"
        onClick={() => setOscuro((v) => !v)}
        title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        <i className={`bi ${oscuro ? "bi-sun-fill" : "bi-moon-stars-fill"}`} />
      </button>

      {/* Tarjeta centrada */}
      <div className="lgn-card">
        {/* Logo circular */}
        <button
          type="button"
          className="lgn-logo-wrap"
          onClick={() => navigate("/")}
          title="Ir a la página principal"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <img src={logo} alt="Logo Azahar" className="lgn-logo" />
        </button>

        <h1 className="lgn-title">
          Bienvenido al
          <br />
          <span className="lgn-title-highlight">Conjunto Azahar</span>
        </h1>
        <p className="lgn-sub">Ingresa tus credenciales para continuar</p>

        {/* Banner de feedback */}
        <div className="lgn-feedback-area">
          {feedback === "ok" && (
            <div className="lgn-feedback lgn-feedback--ok">
              <i className="bi bi-check-circle-fill" />
              <span>¡Bienvenido/a! Ingresando al sistema…</span>
            </div>
          )}
          {feedback === "error" && (
            <div className="lgn-feedback lgn-feedback--err">
              <i className="bi bi-x-circle-fill" />
              <span>Usuario o contraseña incorrecta</span>
            </div>
          )}
          {feedback === null && intentos >= MAX_INTENTOS && (
            <div className="lgn-feedback lgn-feedback--warn">
              <i className="bi bi-question-circle-fill" />
              <span>
                ¿Olvidaste tu contraseña? Contacta al administrador del conjunto
                o escríbenos por{" "}
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lgn-wa-link"
                >
                  <i className="bi bi-whatsapp" /> WhatsApp
                </a>
              </span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="lgn-form">
          <div className="lgn-field">
            <label className="lgn-label">
              <i className="bi bi-person-fill" /> Usuario
            </label>
            <input
              type="text"
              className="lgn-input"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="lgn-field">
            <label className="lgn-label">
              <i className="bi bi-lock-fill" /> Contraseña
            </label>
            <input
              type="password"
              className="lgn-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="lgn-btn-submit">
            <i className="bi bi-box-arrow-in-right" /> Iniciar sesión
          </button>
        </form>

        <p className="lgn-footer-txt">
          <i className="bi bi-geo-alt-fill" /> Soacha, Cundinamarca · Colombia
        </p>
      </div>
    </div>
  );
}

export default Login;
