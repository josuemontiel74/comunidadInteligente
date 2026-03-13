import { useState, useEffect } from "react";

/**
 * Hook que detecta y reacciona al modo oscuro (atributo `data-modo` en <html>).
 * Retorna `true` cuando `data-modo === "oscuro"`.
 */
export default function useDarkMode() {
  const [oscuro, setOscuro] = useState(
    () => document.documentElement.dataset.modo === "oscuro",
  );

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setOscuro(document.documentElement.dataset.modo === "oscuro"),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-modo"],
    });
    return () => obs.disconnect();
  }, []);

  return oscuro;
}
