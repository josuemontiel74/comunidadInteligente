document.getElementById("menuToggle").addEventListener("click", () => {
  const menu = document.getElementById("menuTrabajador");
  menu.classList.toggle("active");
});

document.getElementById("closeMenu").addEventListener("click", () => {
  document.getElementById("menuTrabajador").classList.remove("active");
});

const ctx = document.getElementById("parqueoChart").getContext("2d");
const parqueoChartInstance = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Ocupados", "Libres"],
    datasets: [
      {
        data: [26, 7],
        backgroundColor: ["#dc3545", "#28a745"],
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
  },
});
