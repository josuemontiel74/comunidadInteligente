import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import App from "./App.jsx";

// ── Modo oscuro: aplicar preferencia guardada antes del primer render ─────────
// Así todos los módulos tienen el tema correcto desde el instante 0,
// sin parpadeo ("flash of white"), aunque el usuario no pase por un dashboard.
if (localStorage.getItem("ci_modo_oscuro") === "1") {
  document.documentElement.dataset.modo = "oscuro";
}
// ─────────────────────────────────────────────────────────────────────────────

// Silenciar el error de ResizeObserver (no afecta funcionalidad)
window.addEventListener("error", (e) => {
  if (e.message && e.message.includes("ResizeObserver"))
    e.stopImmediatePropagation();
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", color: "#dc2626" }}>
          <h2>Error en la aplicación</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
);
