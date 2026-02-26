import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

// Verificación sincrónica del token – no usa estado para no desmontar hijos
const tokenEsValido = () => {
  try {
    const tk = localStorage.getItem("token");
    if (!tk) return false;
    const payload = JSON.parse(atob(tk.split(".")[1]));
    return Date.now() < (payload.exp || 0) * 1000;
  } catch {
    return false;
  }
};

function ProtectedRoute() {
  const navigate = useNavigate();
  const swalShownRef = useRef(false);

  // Bloquear el botón "atrás" del navegador solo cuando el destino
  // sea una ruta no protegida (/login o /). Dentro de la app la
  // navegación entre módulos debe funcionar con normalidad.
  useEffect(() => {
    // Añade UNA entrada extra para tener margen de retroceso
    window.history.pushState(null, "", window.location.pathname);
    const bloquearAtras = () => {
      const destino = window.location.pathname;
      // Solo cancelar si el usuario salió hacia rutas públicas
      if (destino === "/" || destino === "/login") {
        window.history.go(1);
      }
      // Si el destino es cualquier ruta protegida, dejar que React
      // Router resuelva la navegación con normalidad
    };
    window.addEventListener("popstate", bloquearAtras);
    return () => window.removeEventListener("popstate", bloquearAtras);
  }, []);

  // Solo verifica expiración periódicamente (60 s), sin tocar el render
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!tokenEsValido() && !swalShownRef.current) {
        swalShownRef.current = true;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          text: "La sesión expiró. Vuelva a iniciar sesión.",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        }).then(() => navigate("/login"));
      }
    }, 60000); // cada 60 s – sin impacto en el render

    return () => clearInterval(intervalId);
  }, [navigate]);

  // Verificación sincrónica: si no hay token válido, redirigir sin mostrar nada
  if (!tokenEsValido()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
