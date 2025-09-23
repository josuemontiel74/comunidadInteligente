document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('menuToggle').addEventListener('click', () => {
    const menu = document.getElementById('menuTrabajador');
    menu.classList.toggle('active');
  });
  
  document.getElementById('closeMenu').addEventListener('click', () => {
    document.getElementById('menuTrabajador').classList.remove('active');
  });
  
  // DataTable y buscador personalizado por apartamento
  $(document).ready(function () {
          var table = $("#tablaResidentes").DataTable({
            language: {
              url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            },
          });
          $("#buscadorApartamento").on("keyup", function () {
            table.column(4).search(this.value).draw();
          });
        });
  
        // Vista lista/cuadrícula
        document.getElementById("btnVistaLista").onclick = function () {
          this.classList.add("active");
          document.getElementById("btnVistaGrid").classList.remove("active");
          document.getElementById("vistaLista").classList.remove("d-none");
          document.getElementById("vistaGrid").classList.add("d-none");
        };
        document.getElementById("btnVistaGrid").onclick = function () {
          this.classList.add("active");
          document.getElementById("btnVistaLista").classList.remove("active");
          document.getElementById("vistaLista").classList.add("d-none");
          document.getElementById("vistaGrid").classList.remove("d-none");
        };
  
        // Modal reporte IA
        document.getElementById("btnReporteIA").onclick = function () {
          new bootstrap.Modal(document.getElementById("modalReporteIA")).show();
        };
  
        // Modal añadir/editar residente (simulado)
        document.getElementById("btnNuevoResidente").onclick = function () {
          new bootstrap.Modal(document.getElementById("modalResidente")).show();
        };
        document.querySelectorAll(".btn-editar").forEach((btn) => {
          btn.onclick = function () {
            new bootstrap.Modal(document.getElementById("modalResidente")).show();
          };
        });
  
        // Eliminar registro
        document.querySelectorAll(".btn-eliminar").forEach((btn) => {
          btn.onclick = function () {
            const fila = btn.closest("tr") || btn.closest(".residente-card");
            Swal.fire({
              title: "¿Eliminar registro?",
              text: "Esta acción no se puede deshacer.",
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Sí, eliminar",
              cancelButtonText: "Cancelar",
            }).then((result) => {
              if (result.isConfirmed) {
                if (fila.tagName === "TR") {
                  fila.remove();
                } else {
                  fila.parentElement.remove();
                }
                Swal.fire(
                  "Eliminado",
                  "El registro ha sido eliminado.",
                  "success"
                );
              }
            });
          };
        });

  // Abrir modal de registrar residente si viene el parámetro en la URL
  const params = new URLSearchParams(window.location.search);
  if (params.has('modalResidente')) {
    setTimeout(() => {
      const modal = new bootstrap.Modal(document.getElementById('modalResidente'));
      modal.show();
    }, 300);
  }
});
