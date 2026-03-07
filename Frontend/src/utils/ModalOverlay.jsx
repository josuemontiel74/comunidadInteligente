import { useRef, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Componente overlay reutilizable para modales.
 * Envuelve el contenido en un `<dialog open>` con handlers de
 * cierre al hacer click en el backdrop o presionar Escape.
 *
 * @example
 * <ModalOverlay isOpen={showModal} onClose={() => setShowModal(false)} className="paq-modal-overlay">
 *   <div className="paq-modal">…contenido…</div>
 * </ModalOverlay>
 */
export default function ModalOverlay({
  isOpen,
  onClose,
  className = "",
  children,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e) => {
      if (e.target === dialog) onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      open
      className={className}
      aria-modal="true"
      aria-label="Cerrar"
    >
      {children}
    </dialog>
  );
}

ModalOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
