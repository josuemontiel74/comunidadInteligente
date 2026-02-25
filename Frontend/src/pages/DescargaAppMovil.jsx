import { useEffect, useState } from "react";
import "../Styles/DescargaAppMovil.css";

// ─── Ruta del APK (coloca aquí el nombre del archivo cuando lo tengas) ────────
// El archivo debe estar en /Frontend/public/  → se servirá como /comunidadInteligente.apk
const APK_URL = "/comunidadInteligente.apk";
const DISMISS_KEY = "dap_movil_dismissido";

const detectarMovil = () =>
  /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

/**
 * Props:
 *  - btnClass  → clase extra para el botón del header (ej "adm-header-btn")
 */
export default function DescargaAppMovil({ btnClass = "" }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [noMostrarMas, setNoMostrarMas] = useState(false);

  /* Auto-detectar móvil al montar */
  useEffect(() => {
    const yaDesestimado = localStorage.getItem(DISMISS_KEY) === "1";
    if (detectarMovil() && !yaDesestimado) {
      // Pequeño delay para que el dashboard cargue primero
      const t = setTimeout(() => setModalAbierto(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const cerrar = () => {
    if (noMostrarMas) localStorage.setItem(DISMISS_KEY, "1");
    setModalAbierto(false);
  };

  const descargar = () => {
    if (noMostrarMas) localStorage.setItem(DISMISS_KEY, "1");
    setModalAbierto(false);
    // Crear enlace temporal y simular click
    const a = document.createElement("a");
    a.href = APK_URL;
    a.download = "ComunidadInteligente.apk";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      {/* ── Botón en el header ─────────────────────────────────── */}
      <button
        className={`dap-header-btn ${btnClass}`}
        onClick={() => setModalAbierto(true)}
        title="Descargar aplicación móvil"
        aria-label="Descargar app"
      >
        <i className="bi bi-android2"></i>
      </button>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modalAbierto && (
        <div
          className="dap-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrar()}
          onKeyDown={(e) => {
            if (e.key === "Escape") cerrar();
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
        >
          <div className="dap-modal">
            {/* Botón cerrar */}
            <button className="dap-close" onClick={cerrar} aria-label="Cerrar">
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Ícono animado */}
            <div className="dap-icon-wrap">
              <span className="dap-icon-anim">
                <i className="bi bi-phone-fill"></i>
              </span>
              <span className="dap-badge">
                <i className="bi bi-android2"></i>
              </span>
            </div>

            <h3 className="dap-title">¡Llévalo en tu celular!</h3>
            <p className="dap-sub">
              Descarga la aplicación móvil de{" "}
              <strong>Comunidad Inteligente</strong> y gestiona todo desde tu
              smartphone de forma rápida y sencilla.
            </p>

            <ul className="dap-features">
              <li>
                <i className="bi bi-check-circle-fill"></i> Consulta visitas y
                paquetes
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i> Gestiona
                parqueaderos en tiempo real
              </li>
              <li>
                <i className="bi bi-check-circle-fill"></i> Acceso rápido con tu
                cuenta
              </li>
            </ul>

            <button className="dap-btn-download" onClick={descargar}>
              <i className="bi bi-download"></i>
              Descargar APK (Android)
            </button>

            <label className="dap-no-mostrar">
              <input
                type="checkbox"
                checked={noMostrarMas}
                onChange={(e) => setNoMostrarMas(e.target.checked)}
              />
              No mostrar este mensaje de nuevo
            </label>
          </div>
        </div>
      )}
    </>
  );
}
