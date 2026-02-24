import React, { useEffect, useRef, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Chart from "chart.js/auto";
import "../Styles/registro.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function Registro() {
  const navegation = useNavigate();
  const SuperAdmin = () => {
    alert("Registro enviado con éxito :)");
    navegation("/Superadmin");
  };
  const [formData, setFormData] = useState({
    tipoDocumento: "",
    usuario: "",
    password: "",
    rol: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <div className="registro-container">
      <div className="registro-box">
        <h2 className="registro-title">Registro de Usuario</h2>
        <form onSubmit={handleSubmit}>
          {/* Tipo Documento */}
          <div className="form-group">
            <label>Tipo Documento</label>
            <select
              name="tipoDocumento"
              value={formData.tipoDocumento}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="PAS">Pasaporte</option>
            </select>
          </div>

          {/* Usuario */}
          <div className="form-group">
            <label>Nombre de Usuario</label>
            <input
              type="text"
              name="usuario"
              placeholder="Ingrese su usuario"
              value={formData.usuario}
              onChange={handleChange}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Ingrese su contraseña"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Rol */}
          <div className="form-group">
            <label>Rol</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un rol...</option>
              <option value="admin">Administrador</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-submit" onClick={SuperAdmin}>
            Registrarse
          </button>
        </form>
      </div>
    </div>
  );
}
