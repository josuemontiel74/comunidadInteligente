import { useEffect, useState } from "react";
import "../Styles/ModoOscuro.css";

const DARK_KEY = "ci_modo_oscuro";

/**
 * Botón de alternancia Modo Oscuro / Claro.
 *
 * Props:
 *  - btnClass  → clase extra para que herede el estilo del header
 *                (ej. "adm-header-btn", "sa-header-btn", "vi-header-btn")
 *
 * Aplica/elimina el atributo  data-modo="oscuro"  en <html>
 * para que el CSS de ModoOscuro.css active las variables de tema oscuro.
 */
export default function ModoOscuro({ btnClass = "" }) {
  const [oscuro, setOscuro] = useState(
    () => localStorage.getItem(DARK_KEY) === "1",
  );

  /* Aplica el atributo en <html> cada vez que cambia el estado */
  useEffect(() => {
    if (oscuro) {
      document.documentElement.dataset.modo = "oscuro";
    } else {
      delete document.documentElement.dataset.modo;
    }
    localStorage.setItem(DARK_KEY, oscuro ? "1" : "0");
  }, [oscuro]);

  /* Restaurar preferencia guardada al montar (por si el componente se monta
     después de que otro componente borrara el atributo) */
  useEffect(() => {
    if (localStorage.getItem(DARK_KEY) === "1") {
      document.documentElement.dataset.modo = "oscuro";
    }
  }, []);

  return (
    <button
      className={`mo-btn ${btnClass}`}
      onClick={() => setOscuro((v) => !v)}
      title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={oscuro ? "Modo claro" : "Modo oscuro"}
    >
      <i className={`bi ${oscuro ? "bi-sun-fill" : "bi-moon-stars-fill"}`}></i>
    </button>
  );
}
