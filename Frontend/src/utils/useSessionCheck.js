import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../services/api.config.js";
import getUserProfilePhoto from "./getUserProfilePhoto.js";

/**
 * Hook que verifica la sesión del usuario al montar el componente.
 *
 * 1. Comprueba que exista un token en localStorage.
 * 2. Carga el usuario desde localStorage o hace fetch a /api/usuario.
 * 3. Carga la foto de perfil del usuario.
 *
 * @returns {{ loading: boolean, usuario: object|null, fotoUsuario: string|null }}
 */
export default function useSessionCheck() {
  const navigator = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [fotoUsuario, setFotoUsuario] = useState(null);

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
