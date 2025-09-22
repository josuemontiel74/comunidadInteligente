document.getElementById('menuToggle').addEventListener('click', () => {
  const menu = document.getElementById('menuTrabajador');
  menu.classList.toggle('active');
});

document.getElementById('closeMenu').addEventListener('click', () => {
  document.getElementById('menuTrabajador').classList.remove('active');
});

// Inicializar DataTable una vez que el documento esté listo
$(document).ready(function () {
  $('#tablaVisitas').DataTable({
    order: [[4, 'desc']],
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const modalVisita = document.getElementById('modalVisita');
  const modalBootstrap = new bootstrap.Modal(modalVisita);
  const btnRegistrarVisita = document.getElementById('btnRegistrarVisita');
  const visitaVehiculo = document.getElementById('visitaVehiculo');
  const seccionVehiculo = document.getElementById('seccionVehiculo');
  const btnSinVehiculo = document.getElementById('btnRegistrarSinVehiculo');
  const btnSeleccionarParqueadero = document.getElementById('btnSeleccionarParqueadero');
  const tipoVehiculo = document.getElementById('tipoVehiculo');
  const visitaIngreso = document.getElementById('visitaIngreso');
  const formVisita = document.getElementById('formVisita');

  // 🟢 Abrir modal y asignar hora actual
  btnRegistrarVisita.addEventListener('click', () => {
    const ahora = new Date();
    const formato = ahora.toISOString().slice(0, 16).replace("T", " ");
    visitaIngreso.value = formato;
    modalBootstrap.show();
  });

  // 🚘 Mostrar secciones según respuesta
  visitaVehiculo.addEventListener('change', () => {
    if (visitaVehiculo.value === "si") {
      seccionVehiculo.style.display = "block";
      btnSinVehiculo.style.display = "none";
    } else if (visitaVehiculo.value === "no") {
      seccionVehiculo.style.display = "none";
      btnSinVehiculo.style.display = "inline-block";
    } else {
      seccionVehiculo.style.display = "none";
      btnSinVehiculo.style.display = "none";
    }
  });

  // ✅ Registrar visita sin vehículo
  btnSinVehiculo.addEventListener('click', () => {
    Swal.fire({
      title: '¡Visita registrada!',
      text: 'La visita sin vehículo ha sido registrada con éxito.',
      icon: 'success',
      confirmButtonText: 'Continuar'
    });

    formVisita.reset();
    btnSinVehiculo.style.display = "none";
    seccionVehiculo.style.display = "none";
    modalBootstrap.hide();
  });

  // 🔁 Redirigir a la selección de parqueadero
  btnSeleccionarParqueadero.addEventListener('click', () => {
    if (!tipoVehiculo.value) {
      Swal.fire('Selecciona el tipo de vehículo', '', 'warning');
      return;
    }
    if (tipoVehiculo.value === 'carro') {
      window.location.href = '/proyecto/vistas/seleccionparqueadero.html';
    } else if (tipoVehiculo.value === 'moto') {
      window.location.href = '/proyecto/vistas/seleccionparqueadero-moto.html';
    }
  });

  // Función para manejar editar
  function editarVisita(btn) {
    const fila = btn.closest('tr');
    // Asume que la estructura de la fila es: [nombre, documento, ...]
    const nombre = fila.children[0].textContent;
    const documento = fila.children[1].textContent;

    // Rellena los campos del modal
    document.getElementById('editarNombre').value = nombre;
    document.getElementById('editarDocumento').value = documento;

    // Muestra el modal
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarVisita'));
    modalEditar.show();

    // Guardar cambios
    document.getElementById('btnGuardarEdicion').onclick = function() {
      // Actualiza la fila con los nuevos valores
      fila.children[0].textContent = document.getElementById('editarNombre').value;
      fila.children[1].textContent = document.getElementById('editarDocumento').value;
      modalEditar.hide();
      Swal.fire('Actualizado', 'La visita ha sido editada.', 'success');
    };
  }

  // Función para manejar finalizar
  function finalizarVisita(btn) {
    const fila = btn.closest('tr');
    const nombre = fila.children[0].textContent;
    Swal.fire({
      title: '¿Finalizar visita?',
      text: `¿Deseas finalizar la visita de ${nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        // Aquí puedes actualizar el estado en la tabla o en tu backend
        Swal.fire('Finalizada', `La visita de ${nombre} ha sido finalizada.`, 'success');
        // Cambiar badge y deshabilitar botón
        const badge = fila.querySelector('.badge');
        if (badge) {
          badge.className = 'badge bg-secondary';
          badge.textContent = 'Finalizada';
        }
        // Elimina el botón de finalizar
        const btnFinalizar = fila.querySelector('.btn-outline-danger');
        if (btnFinalizar) btnFinalizar.remove();
      }
    });
  }

  // Delegación de eventos para los botones de la tabla
  document.querySelector('#tablaVisitas').addEventListener('click', function(e) {
    if (e.target.matches('.btn-outline-warning')) {
      editarVisita(e.target);
    }
    if (e.target.matches('.btn-outline-danger')) {
      finalizarVisita(e.target);
    }
  });

  // Mostrar Parqueaderos: abrir modal y redirigir según selección
  const btnMostrarParqueaderos = document.getElementById('btnMostrarParqueaderos');
  const modalTipoParqueadero = document.getElementById('modalTipoParqueadero');
  const btnIrParqueadero = document.getElementById('btnIrParqueadero');
  const tipoParqueaderoSeleccion = document.getElementById('tipoParqueaderoSeleccion');

  if (btnMostrarParqueaderos && modalTipoParqueadero) {
    const modalBootstrapTipo = new bootstrap.Modal(modalTipoParqueadero);

    btnMostrarParqueaderos.addEventListener('click', () => {
      tipoParqueaderoSeleccion.value = '';
      modalBootstrapTipo.show();
    });

    btnIrParqueadero.addEventListener('click', () => {
      if (!tipoParqueaderoSeleccion.value) {
        Swal.fire('Selecciona el tipo de parqueadero', '', 'warning');
        return;
      }
      modalBootstrapTipo.hide();
      if (tipoParqueaderoSeleccion.value === 'carro') {
        window.location.href = '/proyecto/vistas/seleccionparqueadero.html';
      } else if (tipoParqueaderoSeleccion.value === 'moto') {
        window.location.href = '/proyecto/vistas/seleccionparqueadero-moto.html';
      }
    });
  }

  // Abrir modal de registrar visita si viene el parámetro
  const params = new URLSearchParams(window.location.search);
  if (params.get('abrirModal') === '1') {
    setTimeout(() => {
      const modalVisita = document.getElementById('modalVisita');
      if (modalVisita) {
        const modalBootstrap = new bootstrap.Modal(modalVisita);
        modalBootstrap.show();
      }
    }, 300);
  }

  // Abrir modal de mostrar parqueaderos si viene el parámetro
  if (params.get('mostrarParqueaderos') === '1') {
    setTimeout(() => {
      const modalTipoParqueadero = document.getElementById('modalTipoParqueadero');
      if (modalTipoParqueadero) {
        const modalBootstrapTipo = new bootstrap.Modal(modalTipoParqueadero);
        modalBootstrapTipo.show();
      }
    }, 600); // Un poco después para no solaparse con el otro modal
  }

  // Botón de reporte IA
  const btnReporteIA = document.getElementById('btnReporteIA');
  if (btnReporteIA) {
    btnReporteIA.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('modalReporteIA'));
      modal.show();
    });
  }

  // Eliminar registro
  const tabla = document.getElementById('tablaVisitas');
  if (tabla) {
    tabla.addEventListener('click', function(e) {
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
  }
});