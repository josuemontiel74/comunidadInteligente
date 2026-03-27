import { useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";

/**
 * Componente overlay reutilizable para modales.
 * Usa un <div> con position:fixed para compatibilidad total en móviles.
 *
 * Si `confirmBeforeClose` es true, al hacer clic fuera o presionar Escape
 * se muestra una alerta de confirmación antes de cerrar.
 */
export default function ModalOverlay({
  isOpen,
  onClose,
  className = "",
  confirmBeforeClose = false,
  children,
}) {
  const dialogRef = useRef(null);

  const intentarCerrar = useCallback(() => {
    if (!confirmBeforeClose) {
      onClose();
      return;
    }
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Si sales, se perderán los datos que ingresaste.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) onClose();
    });
  }, [confirmBeforeClose, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e) => {
      if (e.target === dialog) intentarCerrar();
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        intentarCerrar();
      }
    };

    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [intentarCerrar]);

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} role="dialog" className={className} aria-modal="true">
      {children}
    </div>
  );
}

ModalOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  confirmBeforeClose: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
