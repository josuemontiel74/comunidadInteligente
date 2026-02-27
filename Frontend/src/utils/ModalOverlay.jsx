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
  if (!isOpen) return null;

  return (
    <dialog
      open
      className={className}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
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
