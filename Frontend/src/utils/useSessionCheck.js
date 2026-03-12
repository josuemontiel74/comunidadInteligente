import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../services/api.config.js";
import getUserProfilePhoto from "./getUserProfilePhoto.js";
import { verificarTokenVencido } from "./auth.js";

/**
 * Hook que verifica la sesión del usuario al montar el componente.
 *
 * 1. Comprueba que exista un token en localStorage.
 * 2. Carga el usuario desde localStorage o hace fetch a /api/usuario.
 * 3. Carga la foto de perfil del usuario.
 * 4. Cierra sesión automáticamente cuando el JWT expira (revisión cada 30 s).
 *
 * @returns {{ loading: boolean, usuario: object|null, fotoUsuario: string|null }}
 */
export default function useSessionCheck() {
  const navigator = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [fotoUsuario, setFotoUsuario] = useState(null);
  const alertShownRef = useRef(false);

  // Cierre automático de sesión cuando el JWT expira
  useEffect(() => {
    const intervalo = setInterval(() => {
      const token = localStorage.getItem("token");
      if (!token || !verificarTokenVencido(token)) return;
      if (alertShownRef.current) return;
      alertShownRef.current = true;
      clearInterval(intervalo);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      Swal.fire({
        icon: "warning",
        title: "Sesión cerrada por seguridad",
        text: "Tu sesión expiró después de 1 hora. Vuelve a iniciar sesión.",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#f97316",
        allowOutsideClick: false,
      }).then(() => navigator("/"));
    }, 30000); // revisar cada 30 segundos

    return () => clearInterval(intervalo);
  }, [navigator]);

  // Verificar sesión
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "La sesión expiró. Vuelva a iniciar sesión.",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigator("/");
      });
      return;
    }

    const userGuardado = localStorage.getItem("user");
    if (userGuardado) {
      try {
        setUsuario(JSON.parse(userGuardado));
        setLoading(false);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigator("/");
      }
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/usuario`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        setUsuario(data.usuario);
        localStorage.setItem("user", JSON.stringify(data.usuario));
        setLoading(false);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigator("/");
      }
    })();
  }, [navigator]);

  // Cargar foto de perfil
  useEffect(() => {
    if (usuario) {
      setFotoUsuario(
        usuario.fotoPerfil ||
          getUserProfilePhoto(usuario.numeroDocumento) ||
          getUserProfilePhoto(usuario.username) ||
          null,
      );
    }
  }, [usuario]);

  return { loading, usuario, fotoUsuario };
}
