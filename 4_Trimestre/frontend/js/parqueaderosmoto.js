document.addEventListener('DOMContentLoaded', () => {
      const contenedor = document.getElementById('gridParqueaderos');
      const letras = ['A','B','C','D','E','F','G','H'];
      const libres = ['C01','A02','B03','D03','E02','E03','E04','G03'];

      for (let i = 1; i <= 4; i++) {
        letras.forEach(letra => {
          const id = `${letra}0${i}`;
          const esLibre = libres.includes(id);

          const slot = document.createElement('div');
          slot.classList.add('slot', esLibre ? 'libre' : 'asignado');
          slot.innerHTML = `
            <img src="../img/${esLibre ? 'green-bike' : 'green-bike'}.svg" alt="Espacio" />
            <p class="fw-semibold">${id}</p>
          `;
          if (esLibre) {
            slot.addEventListener('click', () => mostrarPopup(id));
          }
          contenedor.appendChild(slot);
        });
      }
    });

    function mostrarPopup(id) {
      document.getElementById('slotSeleccionado').textContent = id;
      const modal = new bootstrap.Modal(document.getElementById('modalConfirmar'));
      modal.show();
    }

    function asignar() {
      Swal.fire('¡Espacio asignado!', 'Se ha reservado exitosamente.', 'success');
    }

    document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('cuadriculaParqueo');
  const letras = ['A','B','C','D','E','F','G','H'];
  const espaciosLibres = ['A01','B02','C03','D04','E01','F02','G03','H04']; // Simulados

  for (let i = 1; i <= 4; i++) {
    letras.forEach(letra => {
      const id = `${letra}0${i}`;
      const libre = espaciosLibres.includes(id);
      
      const div = document.createElement('div');
      div.className = 'slot';
      div.innerHTML = `
        <img src="../img/${libre ? 'green-bike' : 'green-bike'}.svg" alt="Estado" />
        <p class="fw-semibold">${id}</p>
      `;
      if (libre) {
        div.onclick = () => mostrarPopup(id); // Puedes usarlo después
      }
      contenedor.appendChild(div);
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tarjetasParqueo');
  if (!container) return;

  const espacios = [
    'A01','A02','A03','A04',
    'B01','B02','B03','B04',
    'C01','C02','C03','C04',
    'D01','D02','D03','D04',
    'E01','E02','E03','E04',
    'F01','F02','F03','F04',
    'G01','G02','G03','G04',
    'H01','H02','H03','H04'
  ];
  const libres = ['A01','B02','C01','E02','F01','G01','H01'];

  espacios.forEach(id => {
    const libre = libres.includes(id);
    const col = document.createElement('div');
    col.className = 'col';

    col.innerHTML = `
      <div class="card-parqueo ${libre ? 'libre' : 'ocupado'}" data-espacio="${id}" ${libre ? `onclick="seleccionarEspacio('${id}')"` : ''}>
        <img src="../img/${libre ? 'green-bike' : 'red-bike'}.svg" alt="${libre ? 'Libre' : 'Ocupado'}" />
        <h6 class="fw-semibold">${id}</h6>
      </div>
    `;

    container.appendChild(col);
  });

  // Filtro de búsqueda y estado
  const inputBusqueda = document.getElementById('busquedaParqueo');
  const filtroEstado = document.getElementById('filtroEstado');

  function aplicarFiltros() {
    const valor = inputBusqueda ? inputBusqueda.value.toLowerCase() : '';
    const estado = filtroEstado ? filtroEstado.value : 'todos';
    const tarjetas = document.querySelectorAll('#tarjetasParqueo .card-parqueo');
    tarjetas.forEach(tarjeta => {
      const idEspacio = tarjeta.dataset.espacio.toLowerCase();
      const esLibre = tarjeta.classList.contains('libre');
      let visible = idEspacio.includes(valor);
      if (estado === 'libre') visible = visible && esLibre;
      if (estado === 'ocupado') visible = visible && !esLibre;
      tarjeta.parentElement.style.display = visible ? '' : 'none';
    });
  }

  if (inputBusqueda) inputBusqueda.addEventListener('input', aplicarFiltros);
  if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltros);
});

function seleccionarEspacio(id) {
  // Rellenar datos en el modal
  document.getElementById('reservaEspacio').textContent = id;
  document.getElementById('correoReserva').value = '';

  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modalReserva'));
  modal.show();

  // Botón de confirmar
  const btn = document.getElementById('btnConfirmarReserva');
  btn.onclick = function() {
    const correo = document.getElementById('correoReserva').value;
    if (!correo || !correo.includes('@')) {
      Swal.fire('Correo inválido', 'Por favor ingresa un correo válido.', 'warning');
      return;
    }
    modal.hide();
    // Simular impresión y envío
    Swal.fire({
      title: '¡Reserva exitosa!',
      html: `
        <b>Espacio:</b> ${id}<br>
        <b>Tipo de vehículo:</b> Moto<br>
        <b>Correo:</b> ${correo}<br>
        <hr>
        <i>Recibo impreso y enviado al correo electrónico.</i>
      `,
      icon: 'success'
    });
    // Aquí podrías agregar lógica real de impresión o envío si lo necesitas
  };
}
