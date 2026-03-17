import 'package:flutter/material.dart';
import '../../screens/areasComunes/areascomunes.dart';

class DetallesReserva extends StatelessWidget {
  final Reserva reserva;

  const DetallesReserva({super.key, required this.reserva});

  // Método para obtener el nombre del área común según su ID
  String obtenerNombreAreaComun(dynamic areaComunId) {
    if (areaComunId == null) return 'N/A';
    final id = areaComunId.toString();
    switch (id) {
      case '1':
        return 'Salón Comunal 1';
      case '2':
        return 'Salón Comunal 2';
      case '3':
        return 'Zona BBQ';
      default:
        return 'N/A';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: isSmallScreen ? MediaQuery.of(context).size.width * 0.9 : 500,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        padding: EdgeInsets.all(isSmallScreen ? 20 : 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Detalles de la Reserva',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 30),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildDetalle(
                      context,
                      'ID Reserva',
                      '#${reserva.idReservas ?? "N/A"}',
                    ),
                    _buildDetalle(
                      context,
                      'Área Común',
                      obtenerNombreAreaComun(reserva.areaComun),
                    ),
                    _buildDetalle(
                      context,
                      'Fecha',
                      reserva.fechaReserva ?? 'N/A',
                    ),
                    _buildDetalle(
                      context,
                      'Horario',
                      '${reserva.horaInicio ?? ""} - ${reserva.horaFin ?? ""}',
                    ),
                    _buildDetalle(
                      context,
                      'Motivo',
                      reserva.motivoReserva ?? 'N/A',
                    ),
                    _buildDetalle(
                      context,
                      'Cantidad de Asistentes',
                      '${reserva.cantidadAsistentes ?? 0}',
                    ),
                    _buildDetalle(
                      context,
                      'Invitados Externos',
                      reserva.invitadosExternos == 1 ? 'Sí' : 'No',
                    ),
                    _buildDetalle(
                      context,
                      'Apartamento',
                      reserva.numeroApartamento ?? 'N/A',
                    ),
                    _buildDetalle(
                      context,
                      'Estado',
                      reserva.nombreEstado ?? 'N/A',
                    ),
                    const Divider(height: 30),
                    const Text(
                      'Solicitante',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildDetalle(
                      context,
                      'Nombre',
                      reserva.nombreSolicitante ?? 'N/A',
                    ),
                    _buildDetalle(
                      context,
                      'Documento',
                      '${reserva.tipodocumento ?? ""} ${reserva.documentoSolicitante ?? ""}',
                    ),
                    _buildDetalle(
                      context,
                      'Correo',
                      reserva.correoSolicitante ?? 'N/A',
                    ),
                    _buildDetalle(
                      context,
                      'Teléfono',
                      reserva.telefonoSolicitante ?? 'N/A',
                    ),
                    _buildDetalle(
                      context,
                      'Acepta Reglamento',
                      reserva.aceptaReglamento == 1 ? 'Sí' : 'No',
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetalle(BuildContext context, String titulo, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$titulo:',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 4),
          Text(
            valor,
            style: TextStyle(
              fontSize: 15,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
