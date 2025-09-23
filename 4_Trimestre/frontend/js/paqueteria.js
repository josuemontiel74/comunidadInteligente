document.addEventListener('DOMContentLoaded', () => {
  // Botón de reporte IA
  const btnReporteIA = document.getElementById('btnReporteIA');
  if (btnReporteIA) {
    btnReporteIA.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('modalReporteIA'));
      modal.show();
    });
  }

  // Eliminar registro
  document.querySelector('#tablaPaquetes').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-eliminar')) {
      const fila = e.target.closest('tr');
      Swal.fire({
        title: '¿Eliminar registro?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          fila.remove();
          Swal.fire('Eliminado', 'El registro ha sido eliminado.', 'success');
        }
      });
    }
  });
});

document.getElementById('menuToggle').addEventListener('click', () => {
  const menu = document.getElementById('menuTrabajador');
  menu.classList.toggle('active');
});

document.getElementById('closeMenu').addEventListener('click', () => {
  document.getElementById('menuTrabajador').classList.remove('active');
});

document.querySelectorAll('.btn-ver-detalles').forEach(boton => {
  boton.addEventListener('click', () => {
    document.getElementById('detalleResidente').textContent = boton.dataset.residente;
    document.getElementById('detalleApartamento').textContent = boton.dataset.apartamento;
    document.getElementById('detalleTransportadora').textContent = boton.dataset.transportadora;
    document.getElementById('detalleFecha').textContent = boton.dataset.fecha;
    document.getElementById('detalleEstado').textContent = boton.dataset.estado;
    document.getElementById('detalleObservaciones').textContent = boton.dataset.observaciones;
  });
});

document.querySelectorAll('.btn-finalizar').forEach(boton => {
  boton.addEventListener('click', () => {
    Swal.fire({
      title: '¿Finalizar este paquete?',
      text: 'Esta acción marcará el paquete como recibido y cerrado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const fila = boton.closest('tr');
        const estadoCelda = fila.querySelector('td:nth-child(5)');
        estadoCelda.innerHTML = '<span class="badge bg-secondary">Finalizado</span>';

        Swal.fire('¡Paquete finalizado!', '', 'success');
      }
    });
  });
});

document.querySelectorAll('.btn-editar').forEach(boton => {
  boton.addEventListener('click', () => {
    const fila = boton.closest('tr');
    const apartamento = fila.querySelector('td:nth-child(2)').textContent;
    const estado = fila.querySelector('td:nth-child(5)').textContent;
    const observaciones = 'Observación simulada'; // en real usar dataset

    // Rellenar campos
    document.getElementById('editApartamento').value = apartamento;
    document.getElementById('editEstado').value = estado.trim();
    document.getElementById('editObservaciones').value = observaciones;

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
  });
});
document.querySelectorAll('.btn-finalizar').forEach(boton => {
  boton.addEventListener('click', () => {
    Swal.fire({
      title: '¿Estás seguro de finalizar esta entrega?',
      text: 'Esta acción marcará el paquete como Entregado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const fila = boton.closest('tr');
        const estadoCelda = fila.querySelector('td:nth-child(5)');
        estadoCelda.innerHTML = '<span class="badge bg-success">Entregado</span>';

        Swal.fire(
          'Entrega finalizada',
          'El paquete ha sido marcado como finalizado.',
          'success'
        );
      }
    });
  });
});
document.getElementById('btnRegistrar').addEventListener('click', () => {
  const modal = new bootstrap.Modal(document.getElementById('modalRegistrar'));
  modal.show();
});

const torre = document.getElementById('nuevoTorre').value;
const apto = document.getElementById('nuevoApartamento').value;
const direccionCompleta = `Torre ${torre} - ${apto}`;

document.getElementById('formRegistrar').addEventListener('submit', function (e) {
  e.preventDefault();

  const torre = document.getElementById('nuevoTorre').value;
  const apto = document.getElementById('nuevoApartamento').value;
  const residente = document.getElementById('nuevoResidente').value;
  const transportadora = document.getElementById('nuevoTransportadora').value;
  const observaciones = document.getElementById('nuevoObservaciones').value;

  const direccion = `Torre ${torre} - ${apto}`;

  // Aquí podrías insertar el nuevo registro a la tabla (simulado)

  Swal.fire({
    title: '¡Paquete registrado!',
    text: `Se ha registrado correctamente el paquete para ${residente}.`,
    icon: 'success',
    confirmButtonText: 'Continuar'
  });

  // Opcional: resetear formulario
  this.reset();

  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistrar'));
  modal.hide();
});

const params = new URLSearchParams(window.location.search);
if (params.get('abrirModal') === '1') {
  const modal = new bootstrap.Modal(document.getElementById('modalRegistrar'));
  modal.show();
}
window.history.replaceState({}, document.title, window.location.pathname);
