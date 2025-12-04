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
                      'ID Reserva',
                      '#${reserva.idReservas ?? "N/A"}',
                    ),
                    _buildDetalle(
                      'Área Común',
                      obtenerNombreAreaComun(reserva.areaComun),
                    ),
                    _buildDetalle('Fecha', reserva.fechaReserva ?? 'N/A'),
                    _buildDetalle(
                      'Horario',
                      '${reserva.horaInicio ?? ""} - ${reserva.horaFin ?? ""}',
                    ),
                    _buildDetalle('Motivo', reserva.motivoReserva ?? 'N/A'),
                    _buildDetalle(
                      'Cantidad de Asistentes',
                      '${reserva.cantidadAsistentes ?? 0}',
                    ),
                    _buildDetalle(
                      'Invitados Externos',
                      reserva.invitadosExternos == 1 ? 'Sí' : 'No',
                    ),
                    _buildDetalle(
                      'Apartamento',
                      reserva.numeroApartamento ?? 'N/A',
                    ),
                    _buildDetalle('Estado', reserva.nombreEstado ?? 'N/A'),
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
                    _buildDetalle('Nombre', reserva.nombreSolicitante ?? 'N/A'),
                    _buildDetalle(
                      'Documento',
                      '${reserva.tipodocumento ?? ""} ${reserva.documentoSolicitante ?? ""}',
                    ),
                    _buildDetalle('Correo', reserva.correoSolicitante ?? 'N/A'),
                    _buildDetalle(
                      'Teléfono',
                      reserva.telefonoSolicitante ?? 'N/A',
                    ),
                    _buildDetalle(
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

  Widget _buildDetalle(String titulo, String valor) {
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
            style: const TextStyle(fontSize: 15, color: Colors.black87),
          ),
        ],
      ),
    );
  }
}
