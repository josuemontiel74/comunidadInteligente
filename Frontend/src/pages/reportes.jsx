import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import { jsPDF } from "jspdf";
import { logoutUsuario } from "../services/gestionUsuarios.jsx";
import {
  obtenerReporteParqueaderos,
  obtenerReporteVisitas,
  obtenerReportePaquetes,
  obtenerReporteReservas,
  obtenerReporteOcupacion,
  obtenerReporteNinos,
  obtenerReportePoblacionEspecial,
  obtenerReporteUsuarios,
} from "../services/reportes.services.jsx";
import "../Styles/reportes.css";

// ============================================================================
// HELPERS
// ============================================================================
const toInt = (v) => {
  if (v === null || v === undefined) return 0;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
};

const calcPct = (val, total) =>
  total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";

const formatDateStr = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatFechaDisplay = (str) => {
  if (!str) return "N/A";
  try {
    const p = str.split("-");
    if (p.length === 3) {
      const meses = [
        "",
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      return `${p[2]} ${meses[Number.parseInt(p[1], 10)]} ${p[0]}`;
    }
  } catch (error) {
    console.warn("Error formateando fecha:", error);
  }
  return str;
};

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.substring(0, 2), 16),
    Number.parseInt(h.substring(2, 4), 16),
    Number.parseInt(h.substring(4, 6), 16),
  ];
};

// ============================================================================
// HELPERS DE PDF (fuera del componente para reducir complejidad cognitiva)
// ============================================================================
function createPdfHelpers(pdf, ctx, { m, ph, pw, colLabel, colValue }) {
  const barX = colLabel;
  const barW = pw - m * 2 - 8;

  const checkPage = (h) => {
    if (ctx.y + h > ph - m - 8) {
      pdf.addPage();
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, 3, ph, "F");
      ctx.y = m;
    }
  };

  const sectionTitle = (text, hexColor) => {
    checkPage(14);
    const rgb = hexToRgb(hexColor);
    pdf.setFillColor(...rgb);
    pdf.rect(m, ctx.y - 1, pw - m * 2, 10, "F");
    pdf.setFillColor(rgb[0] * 0.7, rgb[1] * 0.7, rgb[2] * 0.7);
    pdf.rect(m, ctx.y + 9, pw - m * 2, 0.5, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.text(text, colLabel + 2, ctx.y + 6.5);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(30, 30, 30);
    ctx.y += 14;
  };

  const subTitle = (text) => {
    checkPage(10);
    pdf.setFontSize(10);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(80, 40, 160);
    pdf.text(text, colLabel, ctx.y);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(30, 30, 30);
    ctx.y += 7;
  };

  const stat = (label, value) => {
    checkPage(7);
    const valStr = String(value);
    pdf.setFontSize(9.5);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(100, 100, 120);
    pdf.text(`${label}:`, colLabel + 2, ctx.y);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(30, 30, 30);
    const maxW = pw - colLabel - 2 - 30;
    const splitVal = pdf.splitTextToSize(valStr, maxW);
    pdf.text(splitVal[0], colValue, ctx.y, { align: "right" });
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(30, 30, 30);
    ctx.y += 6.5;
  };

  const progressBar = (label, val, total, fillColor) => {
    checkPage(16);
    const pct = total > 0 ? val / total : 0;
    const pctText = `${(pct * 100).toFixed(1)}%`;
    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(80, 80, 100);
    pdf.text(label, colLabel + 2, ctx.y);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(50, 50, 50);
    pdf.text(`${val} / ${total}`, colValue, ctx.y, { align: "right" });
    pdf.setFont(undefined, "normal");
    ctx.y += 5;
    pdf.setFillColor(220, 220, 230);
    pdf.roundedRect(barX + 2, ctx.y, barW - 4, 5, 2, 2, "F");
    const rgb = hexToRgb(fillColor);
    pdf.setFillColor(...rgb);
    if (pct > 0)
      pdf.roundedRect(
        barX + 2,
        ctx.y,
        Math.max(4, (barW - 4) * pct),
        5,
        2,
        2,
        "F",
      );
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    if (pct > 0.12)
      pdf.text(pctText, barX + 2 + ((barW - 4) * pct) / 2, ctx.y + 3.5, {
        align: "center",
      });
    pdf.setTextColor(30, 30, 30);
    ctx.y += 9;
  };

  const divider = () => {
    checkPage(8);
    pdf.setDrawColor(200, 195, 220);
    pdf.setLineWidth(0.3);
    pdf.line(m, ctx.y, pw - m, ctx.y);
    ctx.y += 7;
  };

  return { checkPage, sectionTitle, subTitle, stat, progressBar, divider };
}

// ── Mapeos de rol (fuera del componente para menor complejidad cognitiva) ──
const RPT_MENU_TITLE = { 1: "Men\u00fa Super Admin", 2: "Men\u00fa Admin" };
const RPT_DASH_PATH = { 1: "/Superadmin", 2: "/Admin" };
const mapMenuTitle = (id) => RPT_MENU_TITLE[id] || "Men\u00fa Vigilante";
const mapDashPath = (id) => RPT_DASH_PATH[id] || "/Vigilante";

/** Obtiene rolesId del token de forma segura */
function obtenerRolDesdeToken(t) {
  if (!t) return null;
  try {
    return JSON.parse(atob(t.split(".")[1])).rolesId;
  } catch {
    return null;
  }
}

/** Extrae y pre-procesa los datos de todos los reportes para el render */
function extraerDatosReportes({
  rptParqueaderos,
  rptVisitas,
  rptPaquetes,
  rptReservas,
  rptOcupacion,
  rptNinos,
  rptPoblacion,
}) {
  const capacidadP = rptParqueaderos?.capacidad || [];
  const resumenPeriodo = rptParqueaderos?.resumenPeriodo || {};
  const diaPico = rptParqueaderos?.diaPico || null;

  let totalCuposCarros = 0,
    totalCuposMotos = 0;
  for (const r of capacidadP) {
    const nom = (r.nombreVehiculo || "").toLowerCase();
    if (nom === "carro") totalCuposCarros = toInt(r.totalCupos);
    if (nom === "moto") totalCuposMotos = toInt(r.totalCupos);
  }
  const totalCupos = totalCuposCarros + totalCuposMotos;

  const vehiculosEnPeriodo = toInt(resumenPeriodo.totalVehiculos);
  const carrosEnPeriodo = toInt(resumenPeriodo.carros);
  const motosEnPeriodo = toInt(resumenPeriodo.motos);

  const totalVisitas = toInt(rptVisitas?.totalVisitas);
  const diaConMasVisitas = rptVisitas?.diaConMasVisitas;
  const porVehiculo = rptVisitas?.porVehiculo || [];

  const totalPaquetes = toInt(rptPaquetes?.totalPaquetes);
  const paqEntregados = toInt(rptPaquetes?.entregados);
  const paqPendientes = toInt(rptPaquetes?.pendientes);

  const totalReservas = toInt(rptReservas?.totalReservas);
  const reservasPorArea = rptReservas?.porArea || [];
  const reservasPorEstado = rptReservas?.porEstado || [];
  const promedioAsistentes = rptReservas?.promedioAsistentes || 0;
  const diaConMasReservas = rptReservas?.diaConMasReservas;

  const picoOcupacion = (rptParqueaderos?.picoOcupacion || []).slice(0, 8);
  const maxPico =
    picoOcupacion.length > 0
      ? Math.max(...picoOcupacion.map((h) => toInt(h.cantidadVisitas)))
      : 1;

  const oc = rptOcupacion || {};
  const ninosData = rptNinos || {};
  const poblData = rptPoblacion || {};

  return {
    capacidadP,
    resumenPeriodo,
    diaPico,
    totalCuposCarros,
    totalCuposMotos,
    totalCupos,
    vehiculosEnPeriodo,
    carrosEnPeriodo,
    motosEnPeriodo,
    totalVisitas,
    diaConMasVisitas,
    porVehiculo,
    totalPaquetes,
    paqEntregados,
    paqPendientes,
    totalReservas,
    reservasPorArea,
    reservasPorEstado,
    promedioAsistentes,
    diaConMasReservas,
    picoOcupacion,
    maxPico,
    oc,
    ninosData,
    poblData,
  };
}

// ============================================================================
// RENDER HELPERS
// ============================================================================
const StatRow = ({ icon, label, value, color }) => (
  <div className="rpt-stat-row">
    <div className="stat-icon" style={{ background: `${color}15`, color }}>
      <i
        className={
          icon.startsWith("fa-") ? `fa-solid ${icon}` : `bi bi-${icon}`
        }
      ></i>
    </div>
    <span className="stat-label">{label}</span>
    <span className="stat-value" style={{ color }}>
      {value}
    </span>
  </div>
);

StatRow.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};

const ProgressBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rpt-progress">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-pct">{pct.toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: color }}
        ></div>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const CircularStat = ({ icon, label, value, color }) => (
  <div className="rpt-circular-stat">
    <div
      className="circle-icon"
      style={{ background: `${color}15`, color, borderColor: color }}
    >
      <i className={`bi bi-${icon}`}></i>
    </div>
    <div className="circle-value" style={{ color }}>
      {value}
    </div>
    <div className="circle-label">{label}</div>
  </div>
);

CircularStat.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
function Reportes() {
  const navigate = useNavigate();

  // --- Auth ---
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const token = localStorage.getItem("token");
  const rolesId = obtenerRolDesdeToken(token);
  const showUserManagement = rolesId === 1;
  const showAreasComunes = rolesId !== 3;

  // --- Filtros de fecha ---
  const hoy = new Date();
  const hace30 = new Date(hoy);
  hace30.setDate(hoy.getDate() - 30);
  const [fechaInicio, setFechaInicio] = useState(formatDateStr(hace30));
  const [fechaFin, setFechaFin] = useState(formatDateStr(hoy));

  // --- Datos de reportes ---
  const [rptParqueaderos, setRptParqueaderos] = useState(null);
  const [rptVisitas, setRptVisitas] = useState(null);
  const [rptPaquetes, setRptPaquetes] = useState(null);
  const [rptReservas, setRptReservas] = useState(null);
  const [rptOcupacion, setRptOcupacion] = useState(null);
  const [rptNinos, setRptNinos] = useState(null);
  const [rptPoblacion, setRptPoblacion] = useState(null);
  const [rptUsuarios, setRptUsuarios] = useState(null);

  // --- Refs Charts ---
  const parkingChartRef = useRef(null);
  const parkingInstance = useRef(null);
  const visitasChartRef = useRef(null);
  const visitasInstance = useRef(null);
  const actividadChartRef = useRef(null);
  const actividadInstance = useRef(null);

  // ============================================================================
  // AUTH CHECK
  // ============================================================================
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t) {
      Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "Vuelva a iniciar sesión.",
        timer: 2000,
        showConfirmButton: false,
      });
      setTimeout(() => navigate("/"), 2100);
      return;
    }
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      if (Date.now() >= payload.exp * 1000) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
        }, 2100);
        return;
      }
    } catch {
      navigate("/");
      return;
    }
    if (u) {
      try {
        setUsuario(JSON.parse(u));
      } catch (error) {
        console.warn("Error parseando usuario:", error);
      }
    }
    setLoading(false);
  }, [navigate]);

  // ============================================================================
  // CARGAR REPORTES
  // ============================================================================
  const cargarReportes = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) return;
    setDataLoading(true);
    try {
      const promesas = [
        obtenerReporteParqueaderos(t, fechaInicio, fechaFin),
        obtenerReporteVisitas(t, fechaInicio, fechaFin),
        obtenerReportePaquetes(t, fechaInicio, fechaFin),
        obtenerReporteReservas(t, fechaInicio, fechaFin),
        obtenerReporteOcupacion(t),
        obtenerReporteNinos(t),
        obtenerReportePoblacionEspecial(t),
        showUserManagement
          ? obtenerReporteUsuarios(t, fechaInicio, fechaFin)
          : Promise.resolve(null),
      ];
      const [parq, vis, paq, res, ocup, ninos, pobl, usrs] =
        await Promise.all(promesas);
      setRptParqueaderos(parq);
      setRptVisitas(vis);
      setRptPaquetes(paq);
      setRptReservas(res);
      setRptOcupacion(ocup);
      setRptNinos(ninos);
      setRptPoblacion(pobl);
      setRptUsuarios(usrs);
    } catch (err) {
      console.error("Error cargando reportes:", err);
    }
    setDataLoading(false);
  }, [fechaInicio, fechaFin, showUserManagement]);

  useEffect(() => {
    if (!loading) cargarReportes();
  }, [loading, cargarReportes]);

  // ============================================================================
  // CHARTS
  // ============================================================================
  // Donut Parqueaderos
  useEffect(() => {
    if (!rptParqueaderos || !parkingChartRef.current) return;
    if (parkingInstance.current) parkingInstance.current.destroy();
    const periodo = rptParqueaderos.resumenPeriodo || {};
    const carros = toInt(periodo.carros);
    const motos = toInt(periodo.motos);
    parkingInstance.current = new Chart(parkingChartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Carros", "Motos"],
        datasets: [
          {
            data: [carros, motos],
            backgroundColor: ["#3b82f6", "#f97316"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 16, usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = carros + motos;
                const val = ctx.parsed;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${ctx.label}: ${val} (${pct}%)`;
              },
            },
          },
        },
      },
    });
    return () => {
      if (parkingInstance.current) parkingInstance.current.destroy();
    };
  }, [rptParqueaderos]);

  // Bar Chart Visitas
  useEffect(() => {
    if (!rptVisitas || !visitasChartRef.current) return;
    if (visitasInstance.current) visitasInstance.current.destroy();
    const porDia = rptVisitas.porDia || [];
    if (porDia.length === 0) return;
    const labels = porDia.map((d) => {
      const f = new Date(d.fecha);
      return f.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
    });
    const data = porDia.map((d) => toInt(d.cantidad));
    visitasInstance.current = new Chart(visitasChartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Visitas",
            data,
            backgroundColor: "#8b5cf6",
            borderRadius: 6,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45 } },
          y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
        },
      },
    });
    return () => {
      if (visitasInstance.current) visitasInstance.current.destroy();
    };
  }, [rptVisitas]);

  // Gráfica actividad diaria usuarios
  useEffect(() => {
    if (!rptUsuarios || !actividadChartRef.current) return;
    if (actividadInstance.current) actividadInstance.current.destroy();
    const dias = rptUsuarios.actividadDiaria || [];
    if (dias.length === 0) return;
    const labels = dias.map((d) => {
      const f = new Date(d.fecha);
      return f.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
    });
    actividadInstance.current = new Chart(actividadChartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Registros en el sistema",
            data: dias.map((d) => d.registros),
            borderColor: "#0ea5e9",
            backgroundColor: "rgba(14,165,233,0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "#0ea5e9",
          },
          {
            label: "Usuarios activos",
            data: dias.map((d) => d.usuariosActivos),
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139,92,246,0.08)",
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "#8b5cf6",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true, padding: 16 },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45 } },
          y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
        },
      },
    });
    return () => {
      if (actividadInstance.current) actividadInstance.current.destroy();
    };
  }, [rptUsuarios]);

  // ============================================================================
  // CERRAR SESIÓN
  // ============================================================================
  const cerrarSesion = async (e) => {
    e.preventDefault();
    const t = localStorage.getItem("token");
    if (t) await logoutUsuario(t);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ============================================================================
  // EXPORTAR PDF
  // ============================================================================
  const exportarPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const m = 14;
    const colLabel = m + 4;
    const colValue = pw - m - 4;
    const ctx = { y: m };
    const { checkPage, sectionTitle, subTitle, stat, progressBar, divider } =
      createPdfHelpers(pdf, ctx, { m, ph, pw, colLabel, colValue });

    // ====== PORTADA / HEADER ======
    // Fondo degradado simulado con rectángulos
    pdf.setFillColor(124, 58, 237);
    pdf.rect(0, 0, pw, 44, "F");
    pdf.setFillColor(109, 40, 217);
    pdf.rect(0, 22, pw, 22, "F");
    // Franja decorativa inferior
    pdf.setFillColor(168, 85, 247);
    pdf.rect(0, 42, pw, 2, "F");
    // Barra lateral
    pdf.setFillColor(124, 58, 237);
    pdf.rect(0, 0, 3, ph, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("Comunidad Inteligente", pw / 2, 13, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont(undefined, "normal");
    pdf.text("Reporte General de Actividad", pw / 2, 21, { align: "center" });
    pdf.setFontSize(10);
    pdf.text(`Período: ${fechaInicio}  →  ${fechaFin}`, pw / 2, 30, {
      align: "center",
    });
    pdf.setFontSize(8.5);
    pdf.setTextColor(220, 210, 255);
    pdf.text(`Generado el ${new Date().toLocaleString("es-CO")}`, pw / 2, 38, {
      align: "center",
    });

    pdf.setTextColor(30, 30, 30);
    pdf.setFont(undefined, "normal");
    ctx.y = 52;

    // ====== PARQUEADEROS ======
    sectionTitle("PARQUEADEROS", "#2563eb");

    const capPdf = rptParqueaderos?.capacidad || [];
    let cuposCarrosPdf = 0,
      cuposMotosPdf = 0;
    capPdf.forEach((r) => {
      const nom = (r.nombreVehiculo || "").toLowerCase();
      if (nom === "carro") cuposCarrosPdf = toInt(r.totalCupos);
      if (nom === "moto") cuposMotosPdf = toInt(r.totalCupos);
    });
    const totalCuposPdf = cuposCarrosPdf + cuposMotosPdf;
    const periPdf = rptParqueaderos?.resumenPeriodo || {};
    const totalVehPdf = toInt(periPdf.totalVehiculos);
    const carrosPdf = toInt(periPdf.carros);
    const motosPdf = toInt(periPdf.motos);
    const dPico = rptParqueaderos?.diaPico || null;

    stat("Capacidad total (cupos)", totalCuposPdf);
    stat("Cupos para carros", cuposCarrosPdf);
    stat("Cupos para motos", cuposMotosPdf);
    stat("Vehículos ingresados en el período", totalVehPdf);
    stat(
      "Carros ingresados",
      `${carrosPdf}  (${calcPct(carrosPdf, totalVehPdf)}%)`,
    );
    stat(
      "Motos ingresadas",
      `${motosPdf}  (${calcPct(motosPdf, totalVehPdf)}%)`,
    );
    if (dPico)
      stat(
        "Día pico",
        `${dPico.fecha}  (${toInt(dPico.totalVehiculos)} vehículos)`,
      );
    progressBar("Carros vs total", carrosPdf, totalVehPdf, "#3b82f6");
    progressBar("Motos vs total", motosPdf, totalVehPdf, "#f97316");
    divider();

    // ====== VISITAS ======
    sectionTitle("VISITAS", "#16a34a");
    stat("Total de visitas", toInt(rptVisitas?.totalVisitas));
    if (rptVisitas?.diaConMasVisitas) {
      stat(
        "Día con más visitas",
        `${rptVisitas.diaConMasVisitas.fecha}  (${toInt(rptVisitas.diaConMasVisitas.cantidad)} visitas)`,
      );
    }
    const porVeh = rptVisitas?.porVehiculo || [];
    porVeh.forEach((v) => stat(v.tipo, toInt(v.cantidad)));
    divider();

    // ====== PAQUETES ======
    sectionTitle("PAQUETERÍA", "#9333ea");
    const totalPaq = toInt(rptPaquetes?.totalPaquetes);
    const entregados = toInt(rptPaquetes?.entregados);
    const pendientes = toInt(rptPaquetes?.pendientes);
    stat("Total paquetes recibidos", totalPaq);
    stat("Entregados", `${entregados}  (${calcPct(entregados, totalPaq)}%)`);
    stat("Pendientes", `${pendientes}  (${calcPct(pendientes, totalPaq)}%)`);
    progressBar("Paquetes entregados", entregados, totalPaq, "#22c55e");
    progressBar("Paquetes pendientes", pendientes, totalPaq, "#f97316");
    divider();

    // ====== RESERVAS ======
    sectionTitle("RESERVAS DE ÁREAS COMUNES", "#7c3aed");
    stat("Total reservas", toInt(rptReservas?.totalReservas));
    stat("Promedio de asistentes", rptReservas?.promedioAsistentes || 0);
    if (rptReservas?.diaConMasReservas) {
      stat(
        "Día con más reservas",
        `${rptReservas.diaConMasReservas.fecha}  (${toInt(rptReservas.diaConMasReservas.cantidad)} reservas)`,
      );
    }
    const porArea = rptReservas?.porArea || [];
    if (porArea.length > 0) {
      subTitle("Ranking de áreas:");
      porArea.slice(0, 5).forEach((a) => {
        progressBar(
          a.nombreArea || "N/A",
          toInt(a.cantidad),
          toInt(rptReservas.totalReservas),
          "#8b5cf6",
        );
      });
    }
    divider();

    // ====== RESIDENTES HEADER ======
    checkPage(18);
    pdf.setFillColor(237, 233, 254);
    pdf.rect(m, ctx.y - 3, pw - m * 2, 13, "F");
    pdf.setFillColor(124, 58, 237);
    pdf.rect(m, ctx.y + 10, pw - m * 2, 1, "F");
    pdf.setFontSize(13);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(80, 20, 200);
    pdf.text("REPORTES DE RESIDENTES", colLabel + 2, ctx.y + 7);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(30, 30, 30);
    ctx.y += 17;

    // ====== OCUPACIÓN POR TORRES ======
    sectionTitle("Ocupación por Torres", "#7c3aed");
    const ocPdf = rptOcupacion || {};
    stat("Total apartamentos", toInt(ocPdf.totalApartamentos));
    stat("Apartamentos ocupados", toInt(ocPdf.apartamentosOcupados));
    stat("Apartamentos vacíos", toInt(ocPdf.apartamentosVacios));
    stat("Total residentes", toInt(ocPdf.totalResidentes));
    stat("Porcentaje de ocupación", `${ocPdf.porcentajeOcupacion || 0}%`);
    progressBar(
      "Ocupación general",
      toInt(ocPdf.apartamentosOcupados),
      toInt(ocPdf.totalApartamentos),
      "#7c3aed",
    );
    const torres = ocPdf.detallePorTorre || [];
    if (torres.length > 0) {
      subTitle("Detalle por torre:");
      torres.forEach((t) => {
        stat(
          `Torre ${t.nombreTorre}`,
          `${toInt(t.apartamentosOcupados)}/${toInt(t.totalApartamentos)} aptos · ${toInt(t.totalPersonas)} personas`,
        );
      });
    }
    divider();

    // ====== NIÑOS ======
    sectionTitle("Niños en la Comunidad", "#db2777");
    const ni = rptNinos || {};
    stat("Total niños registrados", toInt(ni.totalNinos));
    stat("Apartamentos con niños", toInt(ni.totalApartamentosConNinos));
    divider();

    // ====== POBLACIÓN ESPECIAL ======
    sectionTitle("Población Especial", "#4f46e5");
    const pe = rptPoblacion || {};
    const totalEspecial =
      toInt(pe.totalAdultosMayores) + toInt(pe.totalDiscapacidad);
    stat("Adultos mayores (60+)", toInt(pe.totalAdultosMayores));
    stat("Personas con discapacidad", toInt(pe.totalDiscapacidad));
    stat("Total población especial", totalEspecial);

    // ====== USUARIOS (solo superadmin) ======
    if (showUserManagement && rptUsuarios) {
      divider();
      checkPage(18);
      pdf.setFillColor(224, 242, 254);
      pdf.rect(m, ctx.y - 3, pw - m * 2, 13, "F");
      pdf.setFillColor(3, 105, 161);
      pdf.rect(m, ctx.y + 10, pw - m * 2, 1, "F");
      pdf.setFontSize(13);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(3, 80, 130);
      pdf.text("REPORTE DE USUARIOS DEL SISTEMA", colLabel + 2, ctx.y + 7);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(30, 30, 30);
      ctx.y += 17;

      sectionTitle("Actividad del Sistema", "#0369a1");
      stat("Registros hoy", rptUsuarios.registrosHoy || 0);
      stat("Usuarios activos hoy", rptUsuarios.usuariosActivosHoy || 0);
      stat(
        "Total registros en el período",
        rptUsuarios.totalRegistrosPeriodo || 0,
      );

      const activosPdf = rptUsuarios.masActivos || [];
      if (activosPdf.length > 0) {
        subTitle("Top usuarios más activos:");
        activosPdf.slice(0, 5).forEach((u) => {
          stat(
            `${u.username}  (${u.nombreRol || "N/A"})`,
            `${u.totalRegistros} registros`,
          );
        });
      }

      const inactivosPdf = rptUsuarios.masInactivos || [];
      if (inactivosPdf.length > 0) {
        checkPage(10);
        subTitle("Usuarios con más días sin actividad:");
        inactivosPdf.slice(0, 5).forEach((u) => {
          const dias =
            u.diasSinActividad === null || u.diasSinActividad === undefined
              ? "nunca usó el sistema"
              : `${u.diasSinActividad} días`;
          stat(`${u.username}  (${u.nombreRol || "N/A"})`, dias);
        });
      }

      const mods = rptUsuarios.modulosMasUsados || [];
      if (mods.length > 0) {
        checkPage(10);
        subTitle("Módulos más utilizados:");
        const maxMod = Math.max(...mods.map((m) => m.cantidad), 1);
        mods.slice(0, 6).forEach((mod) => {
          progressBar(
            mod.nombre || mod.tabla || "—",
            mod.cantidad,
            maxMod,
            "#0369a1",
          );
        });
      }
    }

    // ====== NUMERACIÓN DE PÁGINAS ======
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      // barra lateral en cada página
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, 3, ph, "F");
      // footer
      pdf.setFillColor(245, 242, 255);
      pdf.rect(0, ph - 10, pw, 10, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(120, 90, 180);
      pdf.text(
        `Comunidad Inteligente  ·  Página ${p} de ${totalPages}`,
        pw / 2,
        ph - 3.5,
        {
          align: "center",
        },
      );
    }

    pdf.save(`Reporte_Comunidad_${new Date().toISOString().split("T")[0]}.pdf`);
    Swal.fire({
      icon: "success",
      title: "PDF generado",
      text: "El reporte se descargó correctamente.",
      timer: 2500,
      showConfirmButton: false,
    });
  };

  // ============================================================================
  // RENDER - DATOS EXTRAÍDOS (delegados a función externa)
  // ============================================================================
  const {
    diaPico,
    totalCuposCarros,
    totalCuposMotos,
    totalCupos,
    vehiculosEnPeriodo,
    carrosEnPeriodo,
    motosEnPeriodo,
    totalVisitas,
    diaConMasVisitas,
    porVehiculo,
    totalPaquetes,
    paqEntregados,
    paqPendientes,
    totalReservas,
    reservasPorArea,
    reservasPorEstado,
    promedioAsistentes,
    diaConMasReservas,
    picoOcupacion,
    maxPico,
    oc,
    ninosData,
    poblData,
  } = extraerDatosReportes({
    rptParqueaderos,
    rptVisitas,
    rptPaquetes,
    rptReservas,
    rptOcupacion,
    rptNinos,
    rptPoblacion,
  });

  // ============================================================================
  // LOADING & AUTH GUARD
  // ============================================================================
  if (loading) {
    return (
      <div className="rpt-loading">
        <div className="rpt-spinner"></div>
        <p style={{ color: "#7c3aed", fontWeight: 600 }}>
          Verificando sesión...
        </p>
      </div>
    );
  }

  // ============================================================================
  // JSX RETURN
  // ============================================================================
  return (
    <div className="rpt-dashboard">
      {/* ===================== OVERLAY ===================== */}
      <button
        type="button"
        className={`rpt-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-label="Cerrar menú"
      />

      {/* ===================== DRAWER ===================== */}
      <aside className={`rpt-drawer ${menuOpen ? "open" : ""}`}>
        <div className="rpt-drawer-header">
          <div className="rpt-drawer-avatar">
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <h4 className="rpt-drawer-title">{mapMenuTitle(rolesId)}</h4>
          <span className="rpt-drawer-user">
            {usuario?.username || "Usuario"}
          </span>
        </div>

        <div className="rpt-drawer-body">
          <div className="rpt-menu-section">
            <h6 className="rpt-menu-section-title">Navegación</h6>
            <Link
              className="rpt-menu-item"
              to={mapDashPath(rolesId)}
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
              <i className="bi bi-chevron-right rpt-menu-arrow"></i>
            </Link>
            <Link
              className="rpt-menu-item active"
              to="/Reportes"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-graph-up-arrow"></i>
              <span>Reportes</span>
              <i className="bi bi-chevron-right rpt-menu-arrow"></i>
            </Link>
          </div>

          <div className="rpt-menu-section">
            <h6 className="rpt-menu-section-title">Módulos</h6>
            <Link
              className="rpt-menu-item"
              to="/Paqueteria"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-box-seam"></i>
              <span>Paquetería</span>
              <i className="bi bi-chevron-right rpt-menu-arrow"></i>
            </Link>
            <Link
              className="rpt-menu-item"
              to="/visitas"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-people"></i>
              <span>Visitas</span>
              <i className="bi bi-chevron-right rpt-menu-arrow"></i>
            </Link>
            <Link
              className="rpt-menu-item"
              to="/parqueaderos"
              onClick={() => setMenuOpen(false)}
            >
              <i className="bi bi-p-circle"></i>
              <span>Parqueaderos</span>
              <i className="bi bi-chevron-right rpt-menu-arrow"></i>
            </Link>
            {showAreasComunes && (
              <Link
                className="rpt-menu-item"
                to="/AreasComunes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-calendar2-week"></i>
                <span>Áreas Comunes</span>
                <i className="bi bi-chevron-right rpt-menu-arrow"></i>
              </Link>
            )}
            {showAreasComunes && (
              <Link
                className="rpt-menu-item"
                to="/Residentes"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-house-door"></i>
                <span>Residentes</span>
                <i className="bi bi-chevron-right rpt-menu-arrow"></i>
              </Link>
            )}
            {showUserManagement && (
              <Link
                className="rpt-menu-item"
                to="/GestionUsuario"
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-person-gear"></i>
                <span>Gestión Usuarios</span>
                <i className="bi bi-chevron-right rpt-menu-arrow"></i>
              </Link>
            )}
          </div>
        </div>

        <div className="rpt-drawer-footer">
          <button className="rpt-logout-btn" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right"></i>
            {" "}Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ===================== MAIN ===================== */}
      <div className="rpt-main">
        {/* Header */}
        <header className="rpt-header">
          <button
            className="rpt-header-btn"
            onClick={() => navigate(-1)}
            title="Volver"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="rpt-header-center">
            <h5 className="rpt-header-title">Reportes y Estadísticas</h5>
          </div>
          <div className="rpt-header-actions">
            <button
              className="rpt-header-btn"
              onClick={cargarReportes}
              disabled={dataLoading}
              title="Actualizar"
            >
              <i
                className={`bi ${dataLoading ? "bi-hourglass-split" : "bi-arrow-clockwise"}`}
              ></i>
            </button>
            <button
              className="rpt-header-btn rpt-hamburger"
              onClick={() => setMenuOpen(true)}
              title="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </header>

        {/* Título */}
        <div className="rpt-page-title">
          <h3>
            <i className="bi bi-graph-up-arrow me-2"></i>Reportes y Estadísticas
          </h3>
          <p>Consulta los datos de tu comunidad en tiempo real</p>
        </div>

        {/* Filtros */}
        <div className="rpt-filter-bar">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="rpt-fecha-inicio">
                <i className="bi bi-calendar-event me-1"></i>Desde
              </label>
              <input
                id="rpt-fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="rpt-fecha-fin">
                <i className="bi bi-calendar-check me-1"></i>Hasta
              </label>
              <input
                id="rpt-fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <button
              className="btn-actualizar"
              onClick={cargarReportes}
              disabled={dataLoading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              {dataLoading ? "Cargando..." : "Actualizar"}
            </button>
            <button
              className="btn-pdf"
              onClick={exportarPDF}
              disabled={dataLoading}
            >
              <i className="bi bi-filetype-pdf"></i>
              {" "}Exportar PDF
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="rpt-content">
          {dataLoading ? (
            <div className="rpt-loading" style={{ minHeight: "40vh" }}>
              <div className="rpt-spinner"></div>
              <p style={{ color: "#7c3aed" }}>Cargando reportes...</p>
            </div>
          ) : (
            <>
              {/* ==================== PARQUEADEROS ==================== */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div
                    className="header-icon"
                    style={{ background: "#dbeafe", color: "#2563eb" }}
                  >
                    <i className="bi bi-p-circle-fill"></i>
                  </div>
                  <h4>Reporte de Parqueaderos</h4>
                </div>
                <div className="rpt-card-body">
                  <div className="row g-4">
                    <div className="col-md-5">
                      <StatRow
                        icon="p-square"
                        label="Capacidad Total (Cupos)"
                        value={totalCupos}
                        color="#2563eb"
                      />
                      <StatRow
                        icon="car-front-fill"
                        label="Cupos para Carros"
                        value={totalCuposCarros}
                        color="#3b82f6"
                      />
                      <StatRow
                        icon="bicycle"
                        label="Cupos para Motos"
                        value={totalCuposMotos}
                        color="#f97316"
                      />
                      <hr />
                      <p
                        className="fw-semibold text-muted mb-2"
                        style={{ fontSize: 13 }}
                      >
                        Vehículos ingresados en el período:
                      </p>
                      <StatRow
                        icon="truck-front-fill"
                        label="Total Vehículos"
                        value={vehiculosEnPeriodo}
                        color="#7c3aed"
                      />
                      <StatRow
                        icon="car-front-fill"
                        label="Carros"
                        value={`${carrosEnPeriodo} (${calcPct(carrosEnPeriodo, vehiculosEnPeriodo)}%)`}
                        color="#3b82f6"
                      />
                      <StatRow
                        icon="bicycle"
                        label="Motos"
                        value={`${motosEnPeriodo} (${calcPct(motosEnPeriodo, vehiculosEnPeriodo)}%)`}
                        color="#f97316"
                      />
                      {diaPico && (
                        <StatRow
                          icon="calendar-check-fill"
                          label="Día Pico"
                          value={`${diaPico.fecha} (${toInt(diaPico.totalVehiculos)} vehículos)`}
                          color="#22c55e"
                        />
                      )}
                      <div className="mt-3">
                        <ProgressBar
                          label="Carros (del total ingresado)"
                          value={carrosEnPeriodo}
                          total={vehiculosEnPeriodo}
                          color="#3b82f6"
                        />
                        <ProgressBar
                          label="Motos (del total ingresado)"
                          value={motosEnPeriodo}
                          total={vehiculosEnPeriodo}
                          color="#f97316"
                        />
                      </div>
                    </div>
                    <div className="col-md-7">
                      <div
                        className="rpt-chart-container"
                        style={{ height: 280 }}
                      >
                        <canvas ref={parkingChartRef}></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================== PICO OCUPACIÓN ==================== */}
              {picoOcupacion.length > 0 && (
                <div className="rpt-card">
                  <div className="rpt-card-header">
                    <div
                      className="header-icon"
                      style={{ background: "#ede9fe", color: "#6d28d9" }}
                    >
                      <i className="bi bi-bar-chart-fill"></i>
                    </div>
                    <h4>Horas Pico de Ocupación</h4>
                  </div>
                  <div className="rpt-card-body">
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                      Top horas con mayor flujo de visitas
                    </p>
                    {picoOcupacion.map((h, i) => {
                      const hora = toInt(h.hora);
                      const cant = toInt(h.cantidadVisitas);
                      const carros = toInt(h.carros);
                      const motos = toInt(h.motos);
                      const pct = cant / maxPico;
                      return (
                        <div key={h.hora} className="rpt-hbar-row">
                          <span className="rpt-hbar-label">
                            {String(hora).padStart(2, "0")}:00
                          </span>
                          <div className="rpt-hbar-track">
                            <div
                              className="rpt-hbar-fill"
                              style={{
                                width: `${pct * 100}%`,
                                background:
                                  "linear-gradient(90deg, #8b5cf6, #7c3aed)",
                              }}
                            >
                              {pct > 0.25 && (
                                <span className="rpt-hbar-text">
                                  {cant} visitas (C:{carros} M:{motos})
                                </span>
                              )}
                            </div>
                            {pct <= 0.25 && (
                              <span className="rpt-hbar-text-dark">
                                {cant} visitas (C:{carros} M:{motos})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================== VISITAS ==================== */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div
                    className="header-icon"
                    style={{ background: "#dcfce7", color: "#16a34a" }}
                  >
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <h4>Reporte de Visitas</h4>
                </div>
                <div className="rpt-card-body">
                  <StatRow
                    icon="check-circle-fill"
                    label="Total de visitas"
                    value={totalVisitas}
                    color="#16a34a"
                  />
                  {porVehiculo.map((v, i) => (
                    <StatRow
                      key={v.tipo}
                      icon={
                        v.tipo.includes("Con") ? "car-front" : "person-walking"
                      }
                      label={v.tipo}
                      value={toInt(v.cantidad)}
                      color="#64748b"
                    />
                  ))}
                  {diaConMasVisitas && (
                    <div className="rpt-dia-pico">
                      <i className="bi bi-trophy-fill pico-icon"></i>
                      <div className="pico-info">
                        <div className="pico-label">Día con más visitas</div>
                        <div className="pico-date">
                          {formatFechaDisplay(
                            diaConMasVisitas.fecha?.toString(),
                          )}
                        </div>
                      </div>
                      <span className="pico-count">
                        {toInt(diaConMasVisitas.cantidad)} visitas
                      </span>
                    </div>
                  )}
                  {(rptVisitas?.porDia || []).length > 0 && (
                    <div
                      className="rpt-chart-container mt-3"
                      style={{ height: 260 }}
                    >
                      <canvas ref={visitasChartRef}></canvas>
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== PAQUETES ==================== */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div
                    className="header-icon"
                    style={{ background: "#f3e8ff", color: "#9333ea" }}
                  >
                    <i className="bi bi-box-seam-fill"></i>
                  </div>
                  <h4>Reporte de Paquetes</h4>
                </div>
                <div className="rpt-card-body">
                  <StatRow
                    icon="box-seam"
                    label="Total de paquetes"
                    value={totalPaquetes}
                    color="#9333ea"
                  />
                  <StatRow
                    icon="check-circle"
                    label="Entregados"
                    value={`${paqEntregados} (${calcPct(paqEntregados, totalPaquetes)}%)`}
                    color="#22c55e"
                  />
                  <StatRow
                    icon="clock-history"
                    label="Pendientes"
                    value={`${paqPendientes} (${calcPct(paqPendientes, totalPaquetes)}%)`}
                    color="#f97316"
                  />
                  <div className="mt-3">
                    <ProgressBar
                      label="Entregados"
                      value={paqEntregados}
                      total={totalPaquetes}
                      color="#22c55e"
                    />
                    <ProgressBar
                      label="Pendientes"
                      value={paqPendientes}
                      total={totalPaquetes}
                      color="#f97316"
                    />
                  </div>
                </div>
              </div>

              {/* ==================== RESERVAS ==================== */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div
                    className="header-icon"
                    style={{ background: "#ede9fe", color: "#7c3aed" }}
                  >
                    <i className="bi bi-calendar-event-fill"></i>
                  </div>
                  <h4>Reporte de Reservas</h4>
                </div>
                <div className="rpt-card-body">
                  <div className="rpt-mini-cards">
                    <div
                      className="rpt-mini-card"
                      style={{ background: "#f5f3ff", borderColor: "#c4b5fd" }}
                    >
                      <div className="mini-icon" style={{ color: "#7c3aed" }}>
                        <i className="bi bi-calendar-check"></i>
                      </div>
                      <div className="mini-value" style={{ color: "#7c3aed" }}>
                        {totalReservas}
                      </div>
                      <div className="mini-label">Total Reservas</div>
                    </div>
                    <div
                      className="rpt-mini-card"
                      style={{ background: "#faf5ff", borderColor: "#d8b4fe" }}
                    >
                      <div className="mini-icon" style={{ color: "#9333ea" }}>
                        <i className="bi bi-people"></i>
                      </div>
                      <div className="mini-value" style={{ color: "#9333ea" }}>
                        {typeof promedioAsistentes === "number"
                          ? promedioAsistentes.toFixed(1)
                          : promedioAsistentes}
                      </div>
                      <div className="mini-label">Prom. Asistentes</div>
                    </div>
                  </div>

                  {diaConMasReservas && (
                    <div className="rpt-dia-pico">
                      <i className="bi bi-star-fill pico-icon"></i>
                      <div className="pico-info">
                        <div className="pico-label">Día Pico</div>
                        <div className="pico-date">
                          {formatFechaDisplay(
                            diaConMasReservas.fecha?.toString(),
                          )}
                        </div>
                      </div>
                      <span className="pico-count">
                        {toInt(diaConMasReservas.cantidad)} reservas
                      </span>
                    </div>
                  )}

                  {reservasPorEstado.length > 0 && (
                    <>
                      <h6 className="fw-bold mt-3 mb-2">Por Estado:</h6>
                      {reservasPorEstado.map((est, i) => {
                        const nombre = est.nombreEstado || "N/A";
                        const cant = toInt(est.cantidad);
                        let color = "#94a3b8";
                        if (nombre.toLowerCase().includes("finalizada"))
                          color = "#22c55e";
                        else if (nombre.toLowerCase().includes("curso"))
                          color = "#3b82f6";
                        else if (nombre.toLowerCase().includes("pendiente"))
                          color = "#f97316";
                        return (
                          <div key={nombre} className="rpt-estado-row">
                            <div
                              className="rpt-estado-dot"
                              style={{ background: color }}
                            ></div>
                            <span className="rpt-estado-name">{nombre}</span>
                            <div className="rpt-estado-bar">
                              <div
                                className="rpt-estado-fill"
                                style={{
                                  width: `${totalReservas > 0 ? (cant / totalReservas) * 100 : 0}%`,
                                  background: color,
                                }}
                              ></div>
                            </div>
                            <span className="rpt-estado-count">{cant}</span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {reservasPorArea.length > 0 && (
                    <>
                      <h6 className="fw-bold mt-3 mb-2">Por Área Común:</h6>
                      {reservasPorArea.slice(0, 5).map((area) => (
                        <ProgressBar
                          key={area.nombreArea}
                          label={area.nombreArea || "N/A"}
                          value={toInt(area.cantidad)}
                          total={totalReservas}
                          color="#8b5cf6"
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* ==================== SECCIÓN RESIDENTES ==================== */}
              <div
                className="rpt-section-divider"
                style={{
                  background:
                    "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                  borderColor: "#c4b5fd",
                  color: "#6d28d9",
                }}
              >
                <i className="bi bi-people-fill section-icon"></i>
                <h3>Reportes de Residentes</h3>
              </div>

              {/* ==================== OCUPACIÓN POR TORRES ==================== */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div
                    className="header-icon"
                    style={{ background: "#ede9fe", color: "#6d28d9" }}
                  >
                    <i className="bi bi-building-fill"></i>
                  </div>
                  <h4>Ocupación por Torres</h4>
                </div>
                <div className="rpt-card-body">
                  <div className="rpt-circular-stats">
                    <CircularStat
                      icon="house-door"
                      label="Total Aptos"
                      value={toInt(oc.totalApartamentos)}
                      color="#2563eb"
                    />
                    <CircularStat
                      icon="check-circle"
                      label="Ocupados"
                      value={toInt(oc.apartamentosOcupados)}
                      color="#22c55e"
                    />
                    <CircularStat
                      icon="dash-circle"
                      label="Vacíos"
                      value={toInt(oc.apartamentosVacios)}
                      color="#f97316"
                    />
                    <CircularStat
                      icon="people"
                      label="Residentes"
                      value={toInt(oc.totalResidentes)}
                      color="#9333ea"
                    />
                    <CircularStat
                      icon="pie-chart"
                      label="Ocupación"
                      value={`${oc.porcentajeOcupacion || 0}%`}
                      color="#7c3aed"
                    />
                  </div>

                  {(oc.detallePorTorre || []).length > 0 ? (
                    <>
                      <h6 className="fw-bold mb-2">Residentes por Torre:</h6>
                      <div className="rpt-table-wrapper">
                        <table className="rpt-table">
                          <thead>
                            <tr>
                              <th>Torre</th>
                              <th>Apartamentos</th>
                              <th>Ocupados</th>
                              <th>Personas</th>
                              <th>Prom/Apto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(oc.detallePorTorre || []).map((t, i) => (
                              <tr key={t.nombreTorre}>
                                <td className="fw-semibold">{t.nombreTorre}</td>
                                <td>{toInt(t.totalApartamentos)}</td>
                                <td>{toInt(t.apartamentosOcupados)}</td>
                                <td>
                                  <span
                                    className="rpt-badge"
                                    style={{ background: "#7c3aed" }}
                                  >
                                    {toInt(t.totalPersonas)}
                                  </span>
                                </td>
                                <td>{t.promedioPersonasPorApto || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="rpt-empty">
                      <i className="bi bi-building"></i>
                      <p>No hay datos de ocupación disponibles</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== NIÑOS ==================== */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div
                    className="header-icon"
                    style={{ background: "#fce7f3", color: "#db2777" }}
                  >
                    <i className="bi bi-emoji-smile-fill"></i>
                  </div>
                  <h4>Niños en la Comunidad</h4>
                  <div className="ms-auto">
                    <span
                      className="rpt-badge"
                      style={{
                        background: "#ec4899",
                        fontSize: 13,
                        padding: "5px 14px",
                      }}
                    >
                      <i className="bi bi-emoji-heart-eyes me-1"></i>
                      Total: {toInt(ninosData.totalNinos)}
                    </span>
                  </div>
                </div>
                <div className="rpt-card-body">
                  {(ninosData.detalleApartamentos || []).length > 0 ? (
                    <div className="rpt-table-wrapper">
                      <table className="rpt-table">
                        <thead>
                          <tr>
                            <th>Torre</th>
                            <th>Apartamento</th>
                            <th>Niños</th>
                            <th>Ocupante</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ninosData.detalleApartamentos || []).map((a, i) => (
                            <tr key={`${a.nombreTorre}-${a.numeroApartamento}`}>
                              <td>{a.nombreTorre || "-"}</td>
                              <td>{a.numeroApartamento || "-"}</td>
                              <td>
                                <span
                                  className="rpt-badge"
                                  style={{ background: "#ec4899" }}
                                >
                                  {toInt(a.ocupantesConNinos)}
                                </span>
                              </td>
                              <td>{a.nombreOcupantes || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rpt-empty">
                      <i className="bi bi-emoji-smile"></i>
                      <p>No hay datos de niños disponibles</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== POBLACIÓN ESPECIAL ==================== */}
              <div className="rpt-card">
                <div className="rpt-card-header">
                  <div
                    className="header-icon"
                    style={{ background: "#e0e7ff", color: "#4f46e5" }}
                  >
                    <i className="bi bi-universal-access"></i>
                  </div>
                  <h4>Población Especial</h4>
                </div>
                <div className="rpt-card-body">
                  <div className="rpt-pop-cards">
                    <div
                      className="rpt-pop-card"
                      style={{ background: "#fffbeb", borderColor: "#fde68a" }}
                    >
                      <div className="pop-icon" style={{ color: "#d97706" }}>
                        <i className="bi bi-person-hearts"></i>
                      </div>
                      <div className="pop-value" style={{ color: "#b45309" }}>
                        {toInt(poblData.totalAdultosMayores)}
                      </div>
                      <div className="pop-label">Adultos Mayores</div>
                      <div className="pop-sublabel">(60+ años)</div>
                    </div>
                    <div
                      className="rpt-pop-card"
                      style={{ background: "#eef2ff", borderColor: "#c7d2fe" }}
                    >
                      <div className="pop-icon" style={{ color: "#4f46e5" }}>
                        <i className="bi bi-person-wheelchair"></i>
                      </div>
                      <div className="pop-value" style={{ color: "#4338ca" }}>
                        {toInt(poblData.totalDiscapacidad)}
                      </div>
                      <div className="pop-label">Personas con</div>
                      <div className="pop-sublabel">Discapacidad</div>
                    </div>
                  </div>

                  {(poblData.detalleApartamentos || []).length > 0 ? (
                    <>
                      <div
                        className="d-flex align-items-center gap-2 mb-2 p-2 rounded"
                        style={{ background: "#f3e8ff" }}
                      >
                        <i
                          className="bi bi-people-fill"
                          style={{ color: "#7c3aed" }}
                        ></i>
                        <strong style={{ color: "#6d28d9", fontSize: 14 }}>
                          Detalle de Población Especial
                        </strong>
                      </div>
                      <div className="rpt-table-wrapper">
                        <table className="rpt-table">
                          <thead>
                            <tr>
                              <th>Torre</th>
                              <th>Apartamento</th>
                              <th>Tipo</th>
                              <th>Ocupante</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(poblData.detalleApartamentos || []).map(
                              (p, i) => {
                                const tipo = p.tipoPoblacion || "-";
                                const esAdulto = tipo
                                  .toLowerCase()
                                  .includes("adulto");
                                return (
                                  <tr
                                    key={`${p.nombreTorre}-${p.numeroApartamento}`}
                                  >
                                    <td>{p.nombreTorre || "-"}</td>
                                    <td>{p.numeroApartamento || "-"}</td>
                                    <td>
                                      <span
                                        className="rpt-badge"
                                        style={{
                                          background: esAdulto
                                            ? "#d97706"
                                            : "#4f46e5",
                                        }}
                                      >
                                        {tipo}
                                      </span>
                                    </td>
                                    <td>{p.nombreOcupantes || "-"}</td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="rpt-empty">
                      <i className="bi bi-universal-access"></i>
                      <p>No hay datos de población especial disponibles</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== USUARIOS (solo superadmin) ==================== */}
              {showUserManagement && rptUsuarios && (
                <>
                  <div
                    className="rpt-section-divider"
                    style={{
                      background:
                        "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                      borderColor: "#7dd3fc",
                      color: "#0369a1",
                    }}
                  >
                    <i className="bi bi-people-fill section-icon"></i>
                    <h3>Reporte de Usuarios</h3>
                  </div>

                  {/* Mini-cards de hoy */}
                  <div className="rpt-card">
                    <div className="rpt-card-header">
                      <div
                        className="header-icon"
                        style={{ background: "#e0f2fe", color: "#0369a1" }}
                      >
                        <i className="bi bi-activity"></i>
                      </div>
                      <h4>Actividad del Sistema</h4>
                    </div>
                    <div className="rpt-card-body">
                      <div className="rpt-mini-cards">
                        <div
                          className="rpt-mini-card"
                          style={{
                            background: "#f0f9ff",
                            borderColor: "#7dd3fc",
                          }}
                        >
                          <div
                            className="mini-icon"
                            style={{ color: "#0369a1" }}
                          >
                            <i className="bi bi-lightning-charge-fill"></i>
                          </div>
                          <div
                            className="mini-value"
                            style={{ color: "#0369a1" }}
                          >
                            {rptUsuarios.accionesHoy || 0}
                          </div>
                          <div className="mini-label">Acciones Hoy</div>
                        </div>
                        <div
                          className="rpt-mini-card"
                          style={{
                            background: "#f5f3ff",
                            borderColor: "#c4b5fd",
                          }}
                        >
                          <div
                            className="mini-icon"
                            style={{ color: "#7c3aed" }}
                          >
                            <i className="bi bi-person-check-fill"></i>
                          </div>
                          <div
                            className="mini-value"
                            style={{ color: "#7c3aed" }}
                          >
                            {rptUsuarios.usuariosActivosHoy || 0}
                          </div>
                          <div className="mini-label">Usuarios Activos Hoy</div>
                        </div>
                        <div
                          className="rpt-mini-card"
                          style={{
                            background: "#f0fdf4",
                            borderColor: "#86efac",
                          }}
                        >
                          <div
                            className="mini-icon"
                            style={{ color: "#16a34a" }}
                          >
                            <i className="bi bi-journal-check"></i>
                          </div>
                          <div
                            className="mini-value"
                            style={{ color: "#16a34a" }}
                          >
                            {rptUsuarios.totalAccionesPeriodo || 0}
                          </div>
                          <div className="mini-label">
                            Total Acciones Período
                          </div>
                        </div>
                      </div>

                      {/* Gráfica actividad diaria */}
                      {(rptUsuarios.actividadDiaria || []).length > 0 && (
                        <div
                          className="rpt-chart-container mt-3"
                          style={{ height: 260 }}
                        >
                          <canvas ref={actividadChartRef}></canvas>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top usuarios más activos */}
                  <div className="rpt-card">
                    <div className="rpt-card-header">
                      <div
                        className="header-icon"
                        style={{ background: "#fef9c3", color: "#ca8a04" }}
                      >
                        <i className="bi bi-trophy-fill"></i>
                      </div>
                      <h4>Usuarios Más Activos</h4>
                      <span
                        className="ms-auto rpt-badge"
                        style={{
                          background: "#0369a1",
                          fontSize: 12,
                          padding: "4px 12px",
                        }}
                      >
                        Período seleccionado
                      </span>
                    </div>
                    <div className="rpt-card-body">
                      {(rptUsuarios.masActivos || []).length > 0 ? (
                        <div className="rpt-table-wrapper">
                          <table className="rpt-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Registros</th>
                                <th>Último registro</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rptUsuarios.masActivos.map((u, i) => {
                                const esActivo =
                                  (u.nombreEstado || "").toLowerCase() ===
                                  "activo";
                                const estadoColor = esActivo
                                  ? "#22c55e"
                                  : "#f97316";
                                const estadoLabel = u.nombreEstado || "—";
                                const ultimoRegistroStr = u.ultimoRegistro
                                  ? new Date(
                                      u.ultimoRegistro,
                                    ).toLocaleDateString("es-CO", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "2-digit",
                                    })
                                  : "Sin registros";
                                return (
                                  <tr key={u.username}>
                                    <td>
                                      <span
                                        className="rpt-badge"
                                        style={{
                                          background:
                                            ["#ca8a04", "#94a3b8", "#b45309"][i] ?? "#e2e8f0",
                                          color: i < 3 ? "#fff" : "#475569",
                                        }}
                                      >
                                        {i + 1}
                                      </span>
                                    </td>
                                    <td className="fw-semibold">
                                      <i
                                        className="bi bi-person-circle me-1"
                                        style={{ color: "#0369a1" }}
                                      ></i>
                                      {u.username}
                                    </td>
                                    <td>{u.nombreRol || "—"}</td>
                                    <td>
                                      <span
                                        className="rpt-badge"
                                        style={{ background: "#0369a1" }}
                                      >
                                        {u.totalRegistros}
                                      </span>
                                    </td>
                                    <td
                                      style={{ fontSize: 12, color: "#64748b" }}
                                    >
                                      {ultimoRegistroStr}
                                    </td>
                                    <td>
                                      <span
                                        className="rpt-badge"
                                        style={{ background: estadoColor }}
                                      >
                                        {estadoLabel}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rpt-empty">
                          <i className="bi bi-people"></i>
                          <p>Sin actividad registrada en este período</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Usuarios más inactivos */}
                  <div className="rpt-card">
                    <div className="rpt-card-header">
                      <div
                        className="header-icon"
                        style={{ background: "#fff7ed", color: "#ea580c" }}
                      >
                        <i className="bi bi-moon-stars-fill"></i>
                      </div>
                      <h4>Usuarios con Mayor Inactividad</h4>
                    </div>
                    <div className="rpt-card-body">
                      {(rptUsuarios.masInactivos || []).length > 0 ? (
                        <div className="rpt-table-wrapper">
                          <table className="rpt-table">
                            <thead>
                              <tr>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Última actividad</th>
                                <th>Días inactivo</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rptUsuarios.masInactivos.map((u, i) => {
                                const diasNum = u.diasSinActividad;
                                const diasLabel =
                                  diasNum === null || diasNum === undefined
                                    ? "Nunca inició sesión"
                                    : `${diasNum} días`;
                                const color = (() => {
                                  if (diasNum === null || diasNum === undefined || diasNum > 30) return "#ef4444";
                                  if (diasNum > 7) return "#f97316";
                                  return "#22c55e";
                                })();
                                const ultimaAct = u.ultimaActividad
                                  ? new Date(
                                      u.ultimaActividad,
                                    ).toLocaleDateString("es-CO", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "2-digit",
                                    })
                                  : "—";
                                const esActivo =
                                  (u.nombreEstado || "").toLowerCase() ===
                                  "activo";
                                const estadoColor = esActivo
                                  ? "#22c55e"
                                  : "#f97316";
                                const estadoLabel = u.nombreEstado || "—";
                                return (
                                  <tr key={u.username}>
                                    <td className="fw-semibold">
                                      <i
                                        className="bi bi-person-circle me-1"
                                        style={{ color: "#ea580c" }}
                                      ></i>
                                      {u.username}
                                    </td>
                                    <td>{u.nombreRol || "—"}</td>
                                    <td
                                      style={{ fontSize: 12, color: "#64748b" }}
                                    >
                                      {ultimaAct}
                                    </td>
                                    <td>
                                      <span
                                        className="rpt-badge"
                                        style={{ background: color }}
                                      >
                                        {diasLabel}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className="rpt-badge"
                                        style={{ background: estadoColor }}
                                      >
                                        {estadoLabel}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rpt-empty">
                          <i className="bi bi-moon-stars"></i>
                          <p>Sin datos de inactividad</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Módulos más utilizados */}
                  {(rptUsuarios.modulosMasUsados || []).length > 0 && (
                    <div className="rpt-card">
                      <div className="rpt-card-header">
                        <div
                          className="header-icon"
                          style={{ background: "#f0fdf4", color: "#16a34a" }}
                        >
                          <i className="bi bi-grid-3x3-gap-fill"></i>
                        </div>
                        <h4>Módulos Más Utilizados</h4>
                        <span
                          className="ms-auto"
                          style={{ fontSize: 12, color: "#64748b" }}
                        >
                          Ranking por uso en el período
                        </span>
                      </div>
                      <div className="rpt-card-body">
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginBottom: 12,
                          }}
                        >
                          Indica qué partes del sistema se usaron más: más
                          actividad = más registros, modificaciones o consultas
                          en ese módulo.
                        </p>
                        {(() => {
                          const mods = rptUsuarios.modulosMasUsados;
                          const maxMod = Math.max(
                            ...mods.map((m) => m.cantidad),
                          );
                          const colores = [
                            "#0369a1",
                            "#7c3aed",
                            "#16a34a",
                            "#ca8a04",
                            "#dc2626",
                            "#0891b2",
                            "#9333ea",
                            "#059669",
                          ];
                          return mods.map((mod, i) => (
                            <div
                              key={mod.nombre || mod.tabla}
                              className="rpt-hbar-row"
                            >
                              <span
                                className="rpt-hbar-label"
                                style={{
                                  minWidth: 130,
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                {mod.nombre || mod.tabla || "—"}
                              </span>
                              <div className="rpt-hbar-track">
                                <div
                                  className="rpt-hbar-fill"
                                  style={{
                                    width: `${maxMod > 0 ? (mod.cantidad / maxMod) * 100 : 0}%`,
                                    background: colores[i % colores.length],
                                  }}
                                >
                                  {mod.cantidad / maxMod > 0.25 && (
                                    <span className="rpt-hbar-text">
                                      {mod.cantidad} registros
                                    </span>
                                  )}
                                </div>
                                {mod.cantidad / maxMod <= 0.25 && (
                                  <span className="rpt-hbar-text-dark">
                                    {mod.cantidad} registros
                                  </span>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reportes;
