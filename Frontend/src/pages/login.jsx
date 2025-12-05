import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Styles/login.css";
import logo from "../../img/logo.png";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Lottie from 'lottie-react';
import animationData from '../animacion/loginSaluda.json';
import ingresar from "../animacion/Unlocked.json";
import Error from "../animacion/Error.json";
import { handleSubmit as loginService } from "../services/login.serves.jsx";
function Login() {
  const navigate = useNavigate();

  // Bloquear navegación hacia atrás y adelante en login
  React.useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const [errorAnim, setErrorAnim] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [exito, setExito] = useState(false);
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
    const data  = await loginService(username,password);
     
      if (!data.ok) {
        setErrorAnim(true);
        setTimeout(() => setErrorAnim(false), 3000);
        return;
      }
      localStorage.clear();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));
      console.log(" Token guardado:", localStorage.getItem("token"));
      if (data.usuario.estadoId != 2) {
        setExito(true);
        setTimeout(() => {
          const tokenAntes = localStorage.getItem("token");
          console.log("🔑 Token antes de navegar:", tokenAntes);
          if (data.usuario.rolesId === 1) {
            navigate("/Superadmin");
          } else if (data.usuario.rolesId === 2) {
            navigate("/Admin");
          } else if (data.usuario.rolesId === 3) {
            navigate("/Vigilante");
          } else {
            navigate("/");
          }
        }, 3160);
      } else {
        Swal.fire({
          icon: "error",
          title: "Si Acceso",
          text: "Te quitaron el acceso a la aplicacion :(",
        });
      }

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar al servidor",
      });
    }
  };

  return (

    <div className="login-container">

      <div className="login-box w-100 mx-3">
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Logo Azahar"
            style={{ maxHeight: "80px" }}
          />
          <h1 className="mt-3 text-success fw-bold">
            Bienvenido al Conjunto Azahar
          </h1>
          <p>Inicia sesión para continuar</p>
        </div>
        <div className="d-flex justify-content-center">
          {!exito && !errorAnim && (
            <Lottie animationData={animationData} loop={true} autoplay={true} style={{ width: 310, height: 320 }} />
          )}

          {exito && (
            <Lottie animationData={ingresar} loop={false} autoplay={true} style={{ width: 300, height: 300 }} />
          )}

          {errorAnim && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>

              <h5>Usuario o contraseña incorrecta </h5>
              <Lottie
                animationData={Error}
                loop={false}
                autoplay={true}
                style={{ width: 300, height: 300 }}
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-control"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-center mb-3">
            <button type="submit" className="btn btn-success w-50">
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
