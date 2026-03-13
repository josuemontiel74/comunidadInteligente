library;

import 'package:flutter/material.dart';
import '../main.dart';

/// Verifica si la respuesta indica que el token expiró (status 401)
/// y muestra un diálogo para redirigir al login
bool manejarTokenExpirado(
  BuildContext context,
  int statusCode,
  String? responseBody,
) {
  if (statusCode == 401) {
    // Limpiar el token
    LoginServe.token = null;

    // Mostrar diálogo de sesión expirada
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.orange.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.timer_off_rounded,
                color: Colors.orange.shade700,
                size: 28,
              ),
            ),
            const SizedBox(width: 12),
            const Flexible(
              child: Text(
                'Sesión Expirada',
                style: TextStyle(fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Tu sesión ha expirado por seguridad.',
              style: TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Colors.blue.shade700,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Por favor, inicia sesión nuevamente para continuar.',
                      style: TextStyle(fontSize: 13, color: Colors.black87),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                // Cerrar el diálogo
                Navigator.of(dialogContext).pop();
                // Navegar al login y limpiar toda la pila de navegación
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (route) => false,
                );
              },
              icon: const Icon(Icons.login_rounded),
              label: const Text('Iniciar Sesión'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
    return true; // Token expirado
  }
  return false; // Token válido
}

/// Formatea DateTime a string en formato YYYY-MM-DD para enviar al backend
String formatearFechaParaBackend(DateTime fecha) {
  return '${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')}';
}

/// Formatea DateTime a string en formato YYYY-MM-DD HH:mm:ss para enviar al backend
String formatearFechaHoraParaBackend(DateTime fechaHora) {
  return '${fechaHora.year}-${fechaHora.month.toString().padLeft(2, '0')}-${fechaHora.day.toString().padLeft(2, '0')} '
      '${fechaHora.hour.toString().padLeft(2, '0')}:${fechaHora.minute.toString().padLeft(2, '0')}:${fechaHora.second.toString().padLeft(2, '0')}';
}

/// Convierte número de torre (1-10) a letra (A-J)
String convertirTorreIdALetra(dynamic torresId) {
  if (torresId == null) return '';
  final id = int.tryParse(torresId.toString());
  if (id == null || id < 1 || id > 10) return torresId.toString();
  return String.fromCharCode('A'.codeUnitAt(0) + id - 1);
}

/// Convierte letra de torre (A-J) a número (1-10)
int? convertirTorreLetraAId(String? torreLetra) {
  if (torreLetra == null || torreLetra.isEmpty) return null;
  final letra = torreLetra.replaceAll('Torre ', '').trim();
  if (letra.length != 1) return null;
  final id = letra.codeUnitAt(0) - 'A'.codeUnitAt(0) + 1;
  return (id >= 1 && id <= 10) ? id : null;
}

/// Lista de torres disponibles
const List<String> torres = [
  'Torre A',
  'Torre B',
  'Torre C',
  'Torre D',
  'Torre E',
  'Torre F',
  'Torre G',
  'Torre H',
  'Torre I',
  'Torre J',
];

/// Mapa de torres a apartamentos
Map<String, List<String>> apartamentosPorTorre = {
  'Torre A': ['101', '102', '103', '104', '105'],
  'Torre B': ['201', '202', '203', '204', '205'],
  'Torre C': ['301', '302', '303', '304', '305'],
  'Torre D': ['401', '402', '403', '404', '405'],
  'Torre E': ['501', '502', '503', '504', '505'],
  'Torre F': ['601', '602', '603', '604', '605'],
  'Torre G': ['701', '702', '703', '704', '705'],
  'Torre H': ['801', '802', '803', '804', '805'],
  'Torre I': ['901', '902', '903', '904', '905'],
  'Torre J': ['1001', '1002', '1003', '1004', '1005'],
};

/// Obtiene lista de apartamentos para una torre específica
List<String> getApartamentosPorTorre(String torre) {
  return apartamentosPorTorre[torre] ?? [];
}

/// Parsea fecha desde el backend (formato: YYYY-MM-DD HH:mm:ss o YYYY-MM-DD HH:mm)
/// sin aplicar conversiones de zona horaria
DateTime parsearFechaDesdeBackend(String fechaStr) {
  try {
    if (fechaStr.contains('T') && fechaStr.contains('Z')) {
      // Formato ISO UTC: 2025-10-03T21:00:00.000Z
      // El backend guardó en UTC, necesitamos restar 5 horas para obtener hora local Colombia
      final fechaUtc = DateTime.parse(fechaStr).toUtc();
      // Restar 5 horas para Colombia (UTC-5)
      return fechaUtc.subtract(const Duration(hours: 5));
    } else if (fechaStr.contains('T')) {
      // Formato ISO sin Z: 2024-12-09T14:30:00.000
      final sinT = fechaStr.replaceAll('T', ' ');
      final partes = sinT.split(' ');
      final fechaParte = partes[0].split('-');
      final horaParte = partes.length > 1
          ? partes[1].split(':')
          : ['0', '0', '0'];

      return DateTime(
        int.parse(fechaParte[0]),
        int.parse(fechaParte[1]),
        int.parse(fechaParte[2]),
        int.parse(horaParte[0]),
        int.parse(horaParte[1]),
        horaParte.length > 2 ? int.parse(horaParte[2].split('.')[0]) : 0,
      );
    } else if (fechaStr.contains(' ')) {
      // Formato MySQL: 2024-12-09 14:30:00 o 2024-12-09 14:30
      final partes = fechaStr.split(' ');
      final fechaParte = partes[0].split('-');
      final horaParte = partes.length > 1
          ? partes[1].split(':')
          : ['0', '0', '0'];

      return DateTime(
        int.parse(fechaParte[0]), // año
        int.parse(fechaParte[1]), // mes
        int.parse(fechaParte[2]), // día
        int.parse(horaParte[0]), // hora
        int.parse(horaParte[1]), // minuto
        horaParte.length > 2 ? int.parse(horaParte[2]) : 0, // segundo
      );
    } else {
      return DateTime.now();
    }
  } catch (e) {
    debugPrint('Error parseando fecha desde backend: $e');
    return DateTime.now();
  }
}

/// Formatea una fecha del backend para mostrar en la interfaz (solo fecha)
String formatearFechaParaMostrar(String? fechaStr) {
  if (fechaStr == null || fechaStr.isEmpty) return 'N/A';
  try {
    final fecha = parsearFechaDesdeBackend(fechaStr);
    return '${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')}';
  } catch (e) {
    return fechaStr.substring(0, 10);
  }
}

/// Formatea una fecha del backend para mostrar solo la hora (HH:mm)
String formatearHoraParaMostrar(String? fechaStr) {
  if (fechaStr == null || fechaStr.isEmpty) return 'N/A';
  try {
    final fecha = parsearFechaDesdeBackend(fechaStr);
    return '${fecha.hour.toString().padLeft(2, '0')}:${fecha.minute.toString().padLeft(2, '0')}';
  } catch (e) {
    if (fechaStr.length >= 16) {
      return fechaStr.substring(11, 16);
    }
    return 'N/A';
  }
}
