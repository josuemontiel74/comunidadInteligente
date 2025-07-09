<?php
<tbody>
<?php foreach ($allusers as $user) { ?>
  <tr class="text-center">
    <td><?= $user['idReservas'] ?></td>
    <td><?= $user['nombreArea'] ?></td>
    <td><?= $user['nombreSolicitante'] ?></td>
    <td><?= $user['telefonoSolicitante'] ?></td>
    <td><?= $user['horaInicio'] ?></td>
    <td><?= $user['horaFin'] ?></td>
    <td><?= $user['FechaReserva'] ?></td>
    <td><?= $user['motivoReserva'] ?></td>
    <td><?= $user['cantidadAsistentes'] ?></td>
    <td>
      <a href="modificar_area.php?id=<?= $user['idReservas'] ?>" class="btn btn-success btn-sm">Modificar</a>
    </td>
    <td>
      <a href="../../controladores/controlador.areasComunes.php?eliminar=<?= $user['idReservas'] ?>" class="btn btn-danger btn-sm" onclick="return confirm('¿Estás seguro de eliminar esta reserva?');">Eliminar</a>
    </td>
  </tr>
<?php } ?>
</tbody>