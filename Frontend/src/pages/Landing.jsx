import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "../Styles/Landing.css";
import logo from "../../img/logo.png";
import "bootstrap-icons/font/bootstrap-icons.css";

const APK_URL = "/tuComunidadInteligente.apk";
const MANUAL_USUARIO_URL = "/MANUAL%20DE%20USUARIO.docx";
const WA_URL = "https://chat.whatsapp.com/FPvNvN2Ubvc4AyK2IDM67p?mode=gi_t";
const DARK_KEY = "ci_modo_oscuro";

const features = [
  {
    icon: "bi-shield-lock-fill",
    color: "#0d9488",
    title: "Seguridad Total",
    desc: "Control de acceso, registro de visitas y vigilancia en tiempo real para proteger cada rincón del conjunto.",
  },
  {
    icon: "bi-people-fill",
    color: "#6366f1",
    title: "Gestión de Residentes",
    desc: "Administra propietarios y arrendatarios, sus datos y su historial de manera centralizada y segura.",
  },
  {
    icon: "bi-lightning-charge-fill",
    color: "#f97316",
    title: "Procesos Ágiles",
    desc: "Reduce tiempos de respuesta con flujos digitalizados para paquetería, reservas y parqueaderos.",
  },
  {
    icon: "bi-graph-up-arrow",
    color: "#059669",
    title: "Reportes e Insights",
    desc: "Toma decisiones informadas con estadísticas, auditorías y reportes automáticos del conjunto.",
  },
];

const stats = [
  { value: "360°", label: "Cobertura del conjunto" },
  { value: "24/7", label: "Disponibilidad" },
  { value: "100%", label: "Digital y sin papeles" },
];

function StatItem({ value, label }) {
  return (
    <div className="ld-stat-item">
      <span className="ld-stat-value">{value}</span>
      <span className="ld-stat-label">{label}</span>
    </div>
  );
}

StatItem.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

function FeatureCard({ feature: f, index: i, visible }) {
  return (
    <div
      className={`ld-feature-card ${visible ? "ld-feature-card--visible" : ""}`}
      data-idx={i}
      style={{ transitionDelay: `${i * 80}ms` }}
    >
      <div
        className="ld-feature-icon"
        style={{ background: f.color + "22", color: f.color }}
      >
        <i className={`bi ${f.icon}`} />
      </div>
      <h3 className="ld-feature-title">{f.title}</h3>
      <p className="ld-feature-desc">{f.desc}</p>
    </div>
  );
}

FeatureCard.propTypes = {
  feature: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  visible: PropTypes.bool.isRequired,
};

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const [oscuro, setOscuro] = useState(
    () => localStorage.getItem(DARK_KEY) === "1",
  );
  const [scrolled, setScrolled] = useState(false);
  const [visibleCards, setVisibleCards] = useState([]);

  // Aplicar/quitar data-modo en <html>
  useEffect(() => {
    const html = document.documentElement;
    if (oscuro) {
      html.dataset.modo = "oscuro";
      localStorage.setItem(DARK_KEY, "1");
    } else {
      delete html.dataset.modo;
      localStorage.removeItem(DARK_KEY);
    }
  }, [oscuro]);

  // Header compacto al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animación de entrada para las cards de features
  useEffect(() => {
    const handleIntersect = (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const idx = Number.parseInt(entry.target.dataset.idx, 10);
        setVisibleCards((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.15,
    });
    document
      .querySelectorAll(".ld-feature-card")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const irLogin = () => navigate("/login");

  return (
    <div className="ld-root">
      {/*  HEADER  */}
      <header className={`ld-header ${scrolled ? "ld-header--compact" : ""}`}>
        <div className="ld-header-inner">
          <div className="ld-brand">
            <img src={logo} alt="Azahar Logo" className="ld-logo" />
            <span className="ld-brand-name">
              Comunidad <strong>Inteligente</strong>
            </span>
          </div>

          <nav className="ld-nav">
            <a href="#features" className="ld-nav-link">
              Funciones
            </a>
            <a href="#about" className="ld-nav-link">
              Nosotros
            </a>
            <a href="#downloads" className="ld-nav-link">
              Descargas
            </a>
          </nav>

          <div className="ld-header-actions">
            <button
              className="ld-dark-btn"
              onClick={() => setOscuro((v) => !v)}
              title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              <i
                className={`bi ${oscuro ? "bi-sun-fill" : "bi-moon-stars-fill"}`}
              />
            </button>
            <button className="ld-btn-login" onClick={irLogin}>
              <i className="bi bi-box-arrow-in-right" /> Iniciar sesión
            </button>
          </div>
        </div>
      </header>

      {/*  HERO  */}
      <section className="ld-hero" ref={heroRef}>
        <div className="ld-hero-overlay" />
        <div className="ld-hero-content">
          <span className="ld-hero-tag">
            <i className="bi bi-geo-alt-fill" /> Soacha, Cundinamarca · Colombia
          </span>
          <h1 className="ld-hero-title">
            Conjunto Residencial
            <br />
            <span className="ld-hero-highlight">Azahar</span>
          </h1>
          <p className="ld-hero-subtitle">
            Plataforma inteligente de administración y seguridad que transforma
            la gestión de tu comunidad — más ágil, más segura, completamente
            digital.
          </p>
          <div className="ld-hero-ctas">
            <button className="ld-btn-primary" onClick={irLogin}>
              <i className="bi bi-grid-3x3-gap-fill" /> Acceder al sistema
            </button>
            <a href={APK_URL} download className="ld-btn-secondary">
              <i className="bi bi-android2" /> Descargar App Móvil
            </a>
          </div>
        </div>

        {/* Stats flotantes */}
        <div className="ld-stats-bar">
          {stats.map(({ value, label }) => (
            <StatItem key={label} value={value} label={label} />
          ))}
        </div>
      </section>

      {/*  ABOUT  */}
      <section className="ld-about" id="about">
        <div className="ld-section-inner ld-about-grid">
          <div className="ld-about-text">
            <span className="ld-section-tag">¿Quiénes somos?</span>
            <h2 className="ld-section-title">
              El hogar inteligente que
              <br />
              mereces
            </h2>
            <p className="ld-about-p">
              <strong>Conjunto Azahar</strong> es una comunidad residencial
              ubicada en <strong>Soacha, Cundinamarca</strong>, comprometida con
              ofrecer calidad de vida, seguridad y tranquilidad a cada una de
              sus familias.
            </p>
            <p className="ld-about-p">
              Nuestra plataforma <em>Comunidad Inteligente</em> nació para
              eliminar filas, papeles y demoras. Toda la administración del
              conjunto — visitas, parqueaderos, paquetes, áreas comunes y más —
              ahora en la palma de tu mano.
            </p>
            <ul className="ld-about-list">
              <li>
                <i className="bi bi-check-circle-fill" /> Control de acceso y
                registro de visitas
              </li>
              <li>
                <i className="bi bi-check-circle-fill" /> Gestión de
                parqueaderos en tiempo real
              </li>
              <li>
                <i className="bi bi-check-circle-fill" /> Seguimiento de
                paquetería y encomiendas
              </li>
              <li>
                <i className="bi bi-check-circle-fill" /> Reservas de áreas
                comunes sin fricciones
              </li>
              <li>
                <i className="bi bi-check-circle-fill" /> Auditoría y reportes
                automáticos
              </li>
            </ul>
          </div>
          <div className="ld-about-img-wrap">
            <div className="ld-about-img-card">
              <div className="ld-about-img-inner" />
              <div className="ld-about-img-badge">
                <i className="bi bi-award-fill" /> Azahar · Ciudad Verde
              </div>
            </div>
            {/* Ubicación con enlace a Google Maps */}
            <a
              href="https://www.google.com/maps/search/Cra.+32+%2317-141,+Soacha,+Cundinamarca"
              target="_blank"
              rel="noopener noreferrer"
              className="ld-about-location"
            >
              <i className="bi bi-geo-alt-fill" />
              <div>
                <span className="ld-about-location-addr">Cra. 32 #17-141</span>
                <span className="ld-about-location-city">
                  Soacha, Cundinamarca · Colombia
                </span>
              </div>
              <i className="bi bi-box-arrow-up-right ld-about-location-ext" />
            </a>
          </div>
        </div>
      </section>

      {/*  FEATURES  */}
      <section className="ld-features" id="features">
        <div className="ld-section-inner">
          <div className="ld-section-header">
            <span className="ld-section-tag">¿Por qué elegirnos?</span>
            <h2 className="ld-section-title">
              Todo lo que necesita tu comunidad
            </h2>
            <p className="ld-section-sub">
              Una sola plataforma para gestionar con eficiencia, transparencia y
              seguridad cada proceso del conjunto residencial.
            </p>
          </div>
          <div className="ld-features-grid">
            {features.map((f, i) => (
              <FeatureCard
                key={f.title}
                feature={f}
                index={i}
                visible={visibleCards.includes(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/*  CTA BAND  */}
      <section className="ld-cta-band">
        <div className="ld-section-inner ld-cta-inner">
          <div>
            <h2 className="ld-cta-title">
              ¿Listo para gestionar tu comunidad?
            </h2>
            <p className="ld-cta-sub">
              Inicia sesión y accede en segundos al panel de administración.
            </p>
          </div>
          <button className="ld-btn-primary ld-btn-xl" onClick={irLogin}>
            <i className="bi bi-box-arrow-in-right" /> Iniciar sesión ahora
          </button>
        </div>
      </section>

      {/*  DOWNLOADS  */}
      <section className="ld-downloads" id="downloads">
        <div className="ld-section-inner">
          <div className="ld-section-header">
            <span className="ld-section-tag">Recursos</span>
            <h2 className="ld-section-title">Descarga y documentación</h2>
            <p className="ld-section-sub">
              Lleva Comunidad Inteligente contigo o consulta los manuales de
              uso.
            </p>
          </div>
          <div className="ld-downloads-grid">
            {/* APK */}
            <div className="ld-download-card">
              <div className="ld-download-icon ld-download-icon--green">
                <i className="bi bi-android2" />
              </div>
              <h3 className="ld-download-title">App Móvil Android</h3>
              <p className="ld-download-desc">
                Accede a Comunidad Inteligente desde tu smartphone. Disponible
                para dispositivos Android.
              </p>
              <a
                href={APK_URL}
                download
                className="ld-btn-download ld-btn-download--green"
              >
                <i className="bi bi-download" /> Descargar APK
              </a>
            </div>

            {/* Manual Usuario */}
            <div className="ld-download-card">
              <div className="ld-download-icon ld-download-icon--blue">
                <i className="bi bi-file-earmark-word-fill" />
              </div>
              <h3 className="ld-download-title">Manual de Usuario</h3>
              <p className="ld-download-desc">
                Guía completa para residentes y personal del conjunto: cómo usar
                cada módulo del sistema paso a paso.
              </p>
              <a
                href={MANUAL_USUARIO_URL}
                download="Manual de Usuario - Comunidad Inteligente.docx"
                className="ld-btn-download ld-btn-download--blue"
              >
                <i className="bi bi-file-earmark-arrow-down" /> Descargar manual
              </a>
            </div>

            {/* Soporte WhatsApp */}
            <div className="ld-download-card">
              <div className="ld-download-icon ld-download-icon--purple">
                <i className="bi bi-whatsapp" />
              </div>
              <h3 className="ld-download-title">Soporte y Contacto</h3>
              <p className="ld-download-desc">
                ¿Olvidaste tu contraseña o tienes alguna duda? Contáctanos
                directamente por WhatsApp y te ayudamos de inmediato.
              </p>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ld-btn-download ld-btn-download--purple"
              >
                <i className="bi bi-whatsapp" /> Contactar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/*  FOOTER  */}
      <footer className="ld-footer">
        <div className="ld-footer-inner">
          <div className="ld-footer-brand">
            <img src={logo} alt="Logo" className="ld-footer-logo" />
            <div>
              <p className="ld-footer-name">Comunidad Inteligente</p>
              <p className="ld-footer-loc">
                <i className="bi bi-geo-alt" /> Conjunto Azahar · Soacha,
                Cundinamarca
              </p>
            </div>
          </div>
          <p className="ld-footer-copy">
            © {new Date().getFullYear()} Conjunto Azahar. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
