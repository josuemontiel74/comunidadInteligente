import { useState } from "react";
import "../Styles/whatsAppModal.css";

const WA_URL = "https://chat.whatsapp.com/LhaKlTnihkgAq8f9GdGuDh?mode=gi_t";

/**
 * Botón flotante + modal de WhatsApp.
 * Puede usarse en cualquier dashboard sin pasar props.
 */
export default function WhatsAppModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        className="wa-fab"
        onClick={() => setOpen(true)}
        title="Grupo de WhatsApp de la comunidad"
        aria-label="Abrir información del grupo de WhatsApp"
      >
        <i className="bi bi-whatsapp"></i>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="wa-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
            {/* Cierre */}
            <button
              className="wa-modal-x"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Icono */}
            <div className="wa-modal-icon-wrap">
              <i className="bi bi-whatsapp"></i>
            </div>

            <h3 className="wa-modal-title">Grupo Comunitario</h3>
            <p className="wa-modal-subtitle">Comunidad Inteligente</p>

            <p className="wa-modal-text">
              Únete a nuestro grupo de WhatsApp donde podrás comunicarte
              directamente con los administradores e integrantes del equipo de
              trabajo. Comparte novedades, resuelve inquietudes y mantente al
              tanto de todo lo que ocurre en el conjunto residencial.
            </p>

            <a
              href={WA_URL}
              target="_blank"
              rel="noreferrer"
              className="wa-join-btn"
              onClick={() => setOpen(false)}
            >
              <i className="bi bi-whatsapp"></i>
              Unirse al grupo
            </a>

            <p className="wa-modal-note">
              <i className="bi bi-shield-check"></i>
              Enlace oficial · Solo para personal autorizado
            </p>
          </div>
        </div>
      )}
    </>
  );
}
