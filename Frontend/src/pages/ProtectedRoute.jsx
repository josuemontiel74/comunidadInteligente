import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
        }).then(() => navigate("/"));
      }
    }, 60000); // cada 60 s – sin impacto en el render

    return () => clearInterval(intervalId);
  }, [navigate]);

  // Verificación sincrónica: si no hay token válido, redirigir sin mostrar nada
  if (!tokenEsValido()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
