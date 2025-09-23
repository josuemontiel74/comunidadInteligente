<?php
<div class="popup" id="formularioBBQ" style="display:none;">
  <div class="bg-light p-5 rounded shadow-sm mx-5">
    <h1>Registro de un nuevo</h1>
    <form action="../../controladores/controlador.areasComunes.php" method="post">
      <div class="container py-5">
        <div class="card shadow-lg rounded-4 border-0 p-5 mx-auto" style="max-width: 1000px; background-color: #ffffff;">
          <h5 class="text-center text-success mb-4">Agregar Nueva Reserva</h5>
          <div class="row">
            <div class="mb-3 col-md-6">
              <label class="form-label">Área Común</label>
              <select name="areaComunId" class="form-select" required>
                <option value="">Seleccione un área...</option>
                <?php foreach ($opcionesArea as $id => $nombre): ?>
                  <option value="<?= $id ?>"><?= htmlspecialchars($nombre) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="mb-3 col-md-6">
              <label class="form-label">Solicitante</label>
              <input type="text" name="nombreSolicitante" class="form-control" placeholder="Nombre del solicitante" required>
            </div>
          </div>
          <!-- ...resto del formulario igual que tu código original... -->
        </div>
      </div>
    </form>
  </div>
</div>