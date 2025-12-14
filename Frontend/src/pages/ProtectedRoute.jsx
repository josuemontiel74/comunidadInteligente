import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

function ProtectedRoute() {
  const navigate = useNavigate();
  const [handled, setHandled] = useState(false);

  const verificarTokenVencido = (tk) => {
    if (!tk) return true;
    try {
      const payload = JSON.parse(atob(tk.split('.')[1]));
      const expMs = (payload.exp || 0) * 1000;
      return Date.now() >= expMs;
    } catch (err) {
      return true;
    }
  };

  useEffect(() => {
    const checkAndHandle = () => {
      const tk = localStorage.getItem('token');
      if (!tk) {
        if (!handled) {
          setHandled(true);
          Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 2000, showConfirmButton: false, timerProgressBar: true }).then(() => {
            localStorage.clear();
            navigate('/');
          });
        }
        return;
      }

      if (verificarTokenVencido(tk)) {
        // token vencido: avisar y redirigir
        if (!handled) {
          setHandled(true);
          Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 2000, showConfirmButton: false, timerProgressBar: true }).then(() => {
            localStorage.clear();
            navigate('/');
          });
        }
      }
    };

    // chequeo inmediato y luego periódico
    checkAndHandle();
    const intervalId = setInterval(checkAndHandle, 10000); // cada 10s

    return () => clearInterval(intervalId);
  }, [handled, navigate]);

  // Si no hay token, no renderizar rutas protegidas (la redirección se maneja arriba)
  const currentToken = localStorage.getItem('token');
  if (!currentToken) return null;

  return <Outlet />;
}

export default ProtectedRoute;
