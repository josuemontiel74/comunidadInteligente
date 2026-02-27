import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

/* ================================================================
   Factory functions para configuraciones de Chart.js
   ================================================================ */

/**
 * Genera la configuración de un gráfico tipo doughnut para parqueaderos.
 * @param {{ carros: number, motos: number, libres: number }} data
 * @param {boolean} oscuro - Modo oscuro activo.
 */
export function donutParqueaderosConfig({ carros, motos, libres }, oscuro) {
  const total = carros + motos + libres;
  const ocupados = carros + motos;

  return {
    type: "doughnut",
    data: {
      labels: ["Carros", "Motos", "Libres"],
      datasets: [
        {
          data: [carros, motos, libres],
          backgroundColor: ["#0d9488", "#f97316", "#d1d5db"],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "50%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(0) : 0;
              return `${ctx.label}: ${ctx.raw} (${pct}%)`;
            },
          },
        },
      },
    },
    plugins: [
      {
        id: "centerText",
        beforeDraw(chart) {
          const { width, height, ctx } = chart;
          if (width === 0 || height === 0) return;
          ctx.save();
          ctx.font = "bold 28px Arial";
          ctx.fillStyle = oscuro ? "#e2e8f0" : "#1f2937";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ocupados, width / 2, height / 2 - 10);
          ctx.font = "14px Arial";
          ctx.fillStyle = oscuro ? "#94a3b8" : "#6b7280";
          ctx.fillText("Ocupados", width / 2, height / 2 + 14);
          ctx.restore();
        },
      },
    ],
  };
}

/**
 * Genera la configuración de un gráfico de barras genérico.
 * @param {string[]} labels
 * @param {number[]} values
 * @param {string[]} colors - Colores de las barras (rgba).
 * @param {string} tooltipSuffix - Texto tras el número, ej. "paquetes".
 * @param {boolean} oscuro
 */
export function barChartConfig(labels, values, colors, tooltipSuffix, oscuro) {
  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderRadius: 12,
          borderSkipped: false,
          barThickness: 60,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} ${tooltipSuffix}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: oscuro ? "#94a3b8" : "#6b7280" },
          grid: {
            color: oscuro ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
          },
        },
        x: {
          ticks: {
            color: oscuro ? "#e2e8f0" : "#374151",
            font: { weight: "500" },
          },
          grid: { display: false },
        },
      },
    },
  };
}

/* ================================================================
   Hook useChart – maneja el ciclo de vida de un Chart.js
   ================================================================ */

/**
 * Crea y destruye un gráfico de Chart.js de manera declarativa.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Ref al <canvas>.
 * @param {object|null} config - Configuración de Chart.js (null = no renderizar).
 * @param {any[]} deps - Dependencias adicionales para recrear el gráfico.
 */
export function useChart(canvasRef, config, deps = []) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!config || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    try {
      chartRef.current = new Chart(canvasRef.current, config);
    } catch (err) {
      console.error("Error creando gráfico:", err);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
