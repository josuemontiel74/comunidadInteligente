import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import App from "./App.jsx";

// Suprimir errores de ResizeObserver que Chart.js puede lanzar durante scroll
// (no son errores de la app, son del navegador al redimensionar el canvas)
const _origOnError = window.onerror;
window.onerror = function (message, ...args) {
  if (
    typeof message === "string" &&
    (message.includes("ResizeObserver loop") ||
      message.includes("ResizeObserver loop completed"))
  ) {
    return true; // suprimir sin propagar
  }
  return _origOnError ? _origOnError(message, ...args) : false;
};
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason && String(e.reason).includes("ResizeObserver")) {
    e.preventDefault();
  }
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", color: "#dc2626" }}>
          <h2>Error en la aplicación</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error)}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#666" }}>
            {this.state.info?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
