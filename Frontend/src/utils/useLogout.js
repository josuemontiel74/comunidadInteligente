import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";

/**
 * Hook reutilizable para cerrar sesión.
 * Reemplaza la función `cerrarSesion` duplicada en cada página.
 *
 * @returns {(e: Event) => Promise<void>} función cerrarSesion
 *
 * @example
 * const cerrarSesion = useLogout();
 * <button onClick={cerrarSesion}>Cerrar Sesión</button>
 */
export default function useLogout() {
  const navigate = useNavigate();

  return useCallback(
    async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (token) await logoutUsuario(token);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    },
    [navigate],
  );
}
