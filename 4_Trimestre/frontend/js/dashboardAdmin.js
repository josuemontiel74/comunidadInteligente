document.getElementById('menuToggle').addEventListener('click', () => {
  const menu = document.getElementById('menuTrabajador');
  menu.classList.toggle('active');
});

document.getElementById('closeMenu').addEventListener('click', () => {
  document.getElementById('menuTrabajador').classList.remove('active');
});


// SOLO UNA INICIALIZACIÓN PARA parqueoChart
new Chart(document.getElementById("parqueoChart"), {
  type: "doughnut",
  data: {
    labels: ["Ocupados", "Libres"],
    datasets: [
      { data: [12, 18], backgroundColor: ["#dc3545", "#28a745"] },
    ],
  },
  options: { plugins: { legend: { display: false } } },
});

new Chart(document.getElementById("areasComunesChart"), {
  type: "bar",
  data: {
    labels: ["Salón", "Piscina", "BBQ"],
    datasets: [
      { label: "Reservas", data: [3, 2, 1], backgroundColor: "#198754" },
    ],
  },
  options: { plugins: { legend: { display: false } } },
});

new Chart(document.getElementById("residentesChart"), {
  type: "pie",
  data: {
    labels: ["Activos", "Inactivos"],
    datasets: [
      { data: [45, 5], backgroundColor: ["#198754", "#adb5bd"] },
    ],
  },
  options: { plugins: { legend: { display: true } } },
});