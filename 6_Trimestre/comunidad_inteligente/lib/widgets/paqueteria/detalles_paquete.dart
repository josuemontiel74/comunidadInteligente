import 'package:flutter/material.dart';
import '../../utils/helpers.dart';

class DetallesPaquete extends StatelessWidget {
  final dynamic paquete;

  const DetallesPaquete({super.key, required this.paquete});

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
                  'Detalles del Paquete',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 30),
            SingleChildScrollView(
              child: Column(
                children: [
                  _buildDetalle(
                    'Residente',
                    paquete['nombreDestinatario']?.toString() ?? 'N/A',
                  ),
                  _buildDetalle(
                    'Torre',
                    paquete['apartamento']?['torresId'] != null
                        ? convertirTorreIdALetra(
                            paquete['apartamento']['torresId'],
                          )
                        : 'N/A',
                  ),
                  _buildDetalle(
                    'Apartamento',
                    paquete['apartamento']?['numeroApartamento']?.toString() ??
                        'N/A',
                  ),
                  _buildDetalle(
                    'Empresa Mensajería',
                    paquete['empresaMensajeria']?.toString() ?? 'N/A',
                  ),
                  _buildDetalle(
                    'Fecha Recepción',
                    paquete['fechaRecepcion']?.toString().substring(0, 10) ??
                        'N/A',
                  ),
                  _buildDetalle(
                    'Hora Recepción',
                    paquete['fechaRecepcion']?.toString().substring(11, 16) ??
                        'N/A',
                  ),
                  _buildDetalle(
                    'Estado',
                    paquete['estado']?['nombreEstado']?.toString() ?? 'N/A',
                  ),
                  _buildDetalle(
                    'Observaciones',
                    paquete['observaciones']?.toString() ?? 'Sin observaciones',
                  ),
                ],
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
