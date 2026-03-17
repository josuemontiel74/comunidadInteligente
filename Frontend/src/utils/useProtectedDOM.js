import { useEffect, useRef } from "react";
import { observeExtensionNodes } from "./domGuard.js";

/**
 * useProtectedDOM — Hook que protege un contenedor React contra
 * nodos inyectados por extensiones de navegador (Google Translate,
 * Grammarly, etc.) que causan errores de "insertBefore".
 *
 * Uso:
 *   const containerRef = useProtectedDOM();
 *   return <div ref={containerRef}>...contenido...</div>;
 *
 * @returns {React.RefObject<HTMLElement>} ref para el contenedor.
 */
export default function useProtectedDOM() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    return observeExtensionNodes(ref.current);
  }, []);

  return ref;
}
