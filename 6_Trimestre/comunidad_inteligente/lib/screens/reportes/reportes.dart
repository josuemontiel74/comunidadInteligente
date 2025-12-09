import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

// ============================================================================
// REPORTES API SERVICE
// ============================================================================
class ReportesApiService {
  static const String _baseUrl = 'http://localhost:3001/api';

  // Helper para formatear fecha como YYYY-MM-DD
  static String _formatearFecha(DateTime fecha) {
    return '${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')}';
  }

  static Future<Map<String, dynamic>> obtenerReporteParqueaderos(
    String token,
    DateTime fechaInicio,
    DateTime fechaFin,
  ) async {
    try {
      final fechaInicioStr = _formatearFecha(fechaInicio);
      final fechaFinStr = _formatearFecha(fechaFin);

      final response = await http
          .get(
            Uri.parse(
              '$_baseUrl/reportes/parqueaderos?fechaInicio=$fechaInicioStr&fechaFin=$fechaFinStr',
            ),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('=== DATOS PARQUEADEROS ===');
        print('Response completo: $data');
        print('data[data]: ${data['data']}');
        if (data['data'] != null && data['data']['porTipo'] != null) {
          print('porTipo es List: ${data['data']['porTipo'] is List}');
          if (data['data']['porTipo'] is List) {
            for (var item in data['data']['porTipo']) {
              print(
                'Item: ${item['nombreVehiculo']} - cantidad: ${item['cantidad']} (${item['cantidad'].runtimeType})',
              );
            }
          }
        }
        print('========================');
        return data;
      }
      return {};
    } catch (e, stackTrace) {
      print('Error al obtener reporte de parqueaderos: $e');
      print('Stack trace: $stackTrace');
      return {};
    }
  }

  static Future<Map<String, dynamic>> obtenerReportePaquetes(
    String token,
    DateTime fechaInicio,
    DateTime fechaFin,
  ) async {
    try {
      final fechaInicioStr = _formatearFecha(fechaInicio);
      final fechaFinStr = _formatearFecha(fechaFin);

      final response = await http
          .get(
            Uri.parse(
              '$_baseUrl/reportes/paquetes?fechaInicio=$fechaInicioStr&fechaFin=$fechaFinStr',
            ),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {};
    } catch (e) {
      print('Error al obtener reporte de paquetes: $e');
      return {};
    }
  }

  static Future<Map<String, dynamic>> obtenerReporteReservas(
    String token,
    DateTime fechaInicio,
    DateTime fechaFin,
  ) async {
    try {
      final fechaInicioStr = _formatearFecha(fechaInicio);
      final fechaFinStr = _formatearFecha(fechaFin);

      final response = await http
          .get(
            Uri.parse(
              '$_baseUrl/reportes/reservas?fechaInicio=$fechaInicioStr&fechaFin=$fechaFinStr',
            ),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {};
    } catch (e) {
      print('Error al obtener reporte de reservas: $e');
      return {};
    }
  }

  static Future<Map<String, dynamic>> obtenerReporteVisitas(
    String token,
    DateTime fechaInicio,
    DateTime fechaFin,
  ) async {
    try {
      final fechaInicioStr = _formatearFecha(fechaInicio);
      final fechaFinStr = _formatearFecha(fechaFin);

      final response = await http
          .get(
            Uri.parse(
              '$_baseUrl/reportes/visitas?fechaInicio=$fechaInicioStr&fechaFin=$fechaFinStr',
            ),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {};
    } catch (e) {
      print('Error al obtener reporte de visitas: $e');
      return {};
    }
  }
}

// ============================================================================
// PANTALLA PRINCIPAL DE REPORTES
// ============================================================================
class ReportesScreen extends StatefulWidget {
  final String token;

  const ReportesScreen({super.key, required this.token});

  @override
  State<ReportesScreen> createState() => _ReportesScreenState();
}

class _ReportesScreenState extends State<ReportesScreen> {
  DateTime fechaInicio = DateTime.now().subtract(const Duration(days: 30));
  DateTime fechaFin = DateTime.now();
  bool isLoading = false;

  Map<String, dynamic> reporteParqueaderos = {};
  Map<String, dynamic> reportePaquetes = {};
  Map<String, dynamic> reporteReservas = {};
  Map<String, dynamic> reporteVisitas = {};

  @override
  void initState() {
    super.initState();
    _cargarReportes();
  }

  Future<void> _cargarReportes() async {
    setState(() => isLoading = true);

    final results = await Future.wait([
      ReportesApiService.obtenerReporteParqueaderos(
        widget.token,
        fechaInicio,
        fechaFin,
      ),
      ReportesApiService.obtenerReportePaquetes(
        widget.token,
        fechaInicio,
        fechaFin,
      ),
      ReportesApiService.obtenerReporteReservas(
        widget.token,
        fechaInicio,
        fechaFin,
      ),
      ReportesApiService.obtenerReporteVisitas(
        widget.token,
        fechaInicio,
        fechaFin,
      ),
    ]);

    setState(() {
      // Si el backend no responde, usar datos de ejemplo
      reporteParqueaderos = results[0].isEmpty
          ? {
              'data': {
                'totalUsos': 0,
                'porTipo': {'carros': 0, 'motos': 0},
              },
            }
          : results[0];

      reportePaquetes = results[1].isEmpty
          ? {
              'data': {'totalPaquetes': 0, 'entregados': 0, 'pendientes': 0},
            }
          : results[1];

      reporteReservas = results[2].isEmpty
          ? {
              'data': {'totalReservas': 0, 'porArea': []},
            }
          : results[2];

      reporteVisitas = results[3].isEmpty
          ? {
              'data': {'totalVisitas': 0, 'diaConMasVisitas': {}},
            }
          : results[3];

      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportes y Estadísticas'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            tooltip: 'Exportar a PDF',
            onPressed: _exportarPDF,
          ),
        ],
      ),
      body: Column(
        children: [
          // Selector de fechas
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.grey.shade100,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildFechaSelector('Desde', fechaInicio, (fecha) {
                        setState(() => fechaInicio = fecha);
                      }),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildFechaSelector('Hasta', fechaFin, (fecha) {
                        setState(() => fechaFin = fecha);
                      }),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _cargarReportes,
                    icon: const Icon(Icons.refresh, size: 20),
                    label: const Text('Actualizar Reportes'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Contenido
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Mensaje de información si no hay backend
                        if (_todosLosReportesVacios())
                          Container(
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.orange.shade50,
                              border: Border.all(color: Colors.orange.shade300),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: Colors.orange.shade700,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'No hay datos disponibles para el período seleccionado. Asegúrate de que el backend esté configurado correctamente.',
                                    style: TextStyle(
                                      color: Colors.orange.shade900,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        _buildReporteParqueaderos(),
                        const SizedBox(height: 24),
                        _buildReporteVisitas(),
                        const SizedBox(height: 24),
                        _buildReportePaquetes(),
                        const SizedBox(height: 24),
                        _buildReporteReservas(),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFechaSelector(
    String label,
    DateTime fecha,
    Function(DateTime) onChanged,
  ) {
    return InkWell(
      onTap: () async {
        final nuevaFecha = await showDatePicker(
          context: context,
          initialDate: fecha,
          firstDate: DateTime(2020),
          lastDate: DateTime.now(),
        );
        if (nuevaFecha != null) onChanged(nuevaFecha);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade400),
          borderRadius: BorderRadius.circular(8),
          color: Colors.white,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${fecha.day.toString().padLeft(2, '0')}/${fecha.month.toString().padLeft(2, '0')}/${fecha.year}',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            Icon(Icons.calendar_today, size: 20, color: Colors.blue.shade700),
          ],
        ),
      ),
    );
  }

  bool _todosLosReportesVacios() {
    final parqueaderosVacio =
        _toInt(reporteParqueaderos['data']?['totalUsos']) == 0;
    final paquetesVacio =
        _toInt(reportePaquetes['data']?['totalPaquetes']) == 0;
    final reservasVacio =
        _toInt(reporteReservas['data']?['totalReservas']) == 0;
    final visitasVacio = _toInt(reporteVisitas['data']?['totalVisitas']) == 0;

    return parqueaderosVacio && paquetesVacio && reservasVacio && visitasVacio;
  }

  // Helper para convertir cualquier valor a int de forma segura
  int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  // Helper para calcular porcentaje de forma segura
  String _calcularPorcentaje(int valor, int total) {
    if (total == 0 || valor == 0) return '0.0';
    return ((valor / total) * 100).toStringAsFixed(1);
  }

  Widget _buildReporteParqueaderos() {
    final data = reporteParqueaderos['data'] ?? {};

    // Adaptar a la estructura del backend: array de objetos con nombreVehiculo y cantidad
    int carros = 0;
    int motos = 0;

    try {
      if (data['porTipo'] != null && data['porTipo'] is List) {
        for (var item in data['porTipo']) {
          final nombreVehiculo = item['nombreVehiculo']?.toString() ?? '';
          final cantidad = item['cantidad'];

          if (nombreVehiculo == 'carro') {
            carros = _toInt(cantidad);
          } else if (nombreVehiculo == 'moto') {
            motos = _toInt(cantidad);
          }
        }
      }
    } catch (e) {
      print('Error procesando porTipo en UI: $e');
    }

    final totalUsos = carros + motos;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.local_parking,
                  color: Colors.blue.shade700,
                  size: 32,
                ),
                const SizedBox(width: 12),
                const Text(
                  'Reporte de Parqueaderos',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildStatRow(
              'Total de usos',
              totalUsos.toString(),
              Icons.check_circle,
            ),
            const SizedBox(height: 12),
            _buildStatRow(
              'Carros',
              '$carros (${_calcularPorcentaje(carros, totalUsos)}%)',
              Icons.directions_car,
            ),
            const SizedBox(height: 12),
            _buildStatRow(
              'Motos',
              '$motos (${_calcularPorcentaje(motos, totalUsos)}%)',
              Icons.two_wheeler,
            ),
            const SizedBox(height: 16),
            _buildProgressBar('Carros', carros, totalUsos, Colors.blue),
            const SizedBox(height: 8),
            _buildProgressBar('Motos', motos, totalUsos, Colors.orange),
          ],
        ),
      ),
    );
  }

  Widget _buildReporteVisitas() {
    final data = reporteVisitas['data'] ?? {};
    final totalVisitas = _toInt(data['totalVisitas']);
    final diaConMasVisitas = data['diaConMasVisitas'] ?? {};

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.people, color: Colors.green.shade700, size: 32),
                const SizedBox(width: 12),
                const Text(
                  'Reporte de Visitas',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildStatRow(
              'Total de visitas',
              totalVisitas.toString(),
              Icons.check_circle,
            ),
            if (diaConMasVisitas.isNotEmpty) ...[
              const SizedBox(height: 12),
              _buildStatRow(
                'Día con más visitas',
                '${diaConMasVisitas['fecha']} (${_toInt(diaConMasVisitas['cantidad'])} visitas)',
                Icons.trending_up,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildReportePaquetes() {
    final data = reportePaquetes['data'] ?? {};
    final totalPaquetes = _toInt(data['totalPaquetes']);
    final entregados = _toInt(data['entregados']);
    final pendientes = _toInt(data['pendientes']);

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.inventory, color: Colors.purple.shade700, size: 32),
                const SizedBox(width: 12),
                const Text(
                  'Reporte de Paquetes',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildStatRow(
              'Total de paquetes',
              totalPaquetes.toString(),
              Icons.inventory_2,
            ),
            const SizedBox(height: 12),
            _buildStatRow(
              'Entregados correctamente',
              '$entregados (${_calcularPorcentaje(entregados, totalPaquetes)}%)',
              Icons.check_circle,
            ),
            const SizedBox(height: 12),
            _buildStatRow(
              'Pendientes',
              '$pendientes (${_calcularPorcentaje(pendientes, totalPaquetes)}%)',
              Icons.pending,
            ),
            const SizedBox(height: 16),
            _buildProgressBar(
              'Entregados',
              entregados,
              totalPaquetes,
              Colors.green,
            ),
            const SizedBox(height: 8),
            _buildProgressBar(
              'Pendientes',
              pendientes,
              totalPaquetes,
              Colors.orange,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReporteReservas() {
    final data = reporteReservas['data'] ?? {};
    final totalReservas = _toInt(data['totalReservas']);
    final porArea = data['porArea'] ?? [];
    final areaMasUsada = porArea.isNotEmpty ? porArea[0] : null;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.event, color: Colors.teal.shade700, size: 32),
                const SizedBox(width: 12),
                const Text(
                  'Reporte de Reservas',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildStatRow(
              'Total de reservas',
              totalReservas.toString(),
              Icons.event_available,
            ),
            if (areaMasUsada != null) ...[
              const SizedBox(height: 12),
              _buildStatRow(
                'Área más reservada',
                '${areaMasUsada['nombreArea']} (${_toInt(areaMasUsada['cantidad'])} reservas)',
                Icons.star,
              ),
            ],
            if (porArea.length > 1) ...[
              const SizedBox(height: 16),
              const Text(
                'Ranking de áreas:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              ...porArea.take(5).map((area) {
                final cantidad = _toInt(area['cantidad']);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Text(area['nombreArea'] ?? 'N/A'),
                      ),
                      Expanded(
                        flex: 2,
                        child: LinearProgressIndicator(
                          value: totalReservas > 0
                              ? cantidad / totalReservas
                              : 0,
                          backgroundColor: Colors.grey.shade200,
                          valueColor: AlwaysStoppedAnimation(
                            Colors.teal.shade400,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '$cantidad',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: TextStyle(fontSize: 15, color: Colors.grey.shade700),
          ),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildProgressBar(String label, int value, int total, Color color) {
    final porcentaje = total > 0 ? value / total : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 14)),
            Text(
              '${(porcentaje * 100).toStringAsFixed(1)}%',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: porcentaje,
          backgroundColor: Colors.grey.shade200,
          valueColor: AlwaysStoppedAnimation(color),
          minHeight: 8,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }

  Widget _buildGraficoTorta(List<MapEntry<String, dynamic>> datos) {
    if (datos.isEmpty) return const SizedBox();

    final total = datos.fold<double>(
      0,
      (sum, e) => sum + (e.value['valor'] as num).toDouble(),
    );
    if (total == 0) return const SizedBox();

    return CustomPaint(
      size: const Size(120, 120),
      painter: _PieChartPainter(datos, total),
    );
  }

  Widget _buildLeyendaItem(String label, Color color, int valor, int total) {
    final porcentaje = total > 0 ? (valor / total * 100) : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
          Text(
            '$valor (${porcentaje.toStringAsFixed(1)}%)',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  // Métodos específicos para PDF
  pw.Widget _buildPDFLeyendaItem(
    String label,
    int valor,
    int total,
    PdfColor color,
  ) {
    final porcentaje = total > 0 ? (valor / total * 100) : 0.0;
    return pw.Row(
      children: [
        pw.Container(
          width: 12,
          height: 12,
          decoration: pw.BoxDecoration(
            color: color,
            borderRadius: pw.BorderRadius.circular(2),
          ),
        ),
        pw.SizedBox(width: 8),
        pw.Expanded(
          child: pw.Text(label, style: const pw.TextStyle(fontSize: 12)),
        ),
        pw.Text(
          '$valor (${porcentaje.toStringAsFixed(1)}%)',
          style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
        ),
      ],
    );
  }

  Future<void> _exportarPDF() async {
    final pdf = pw.Document();

    // Obtener datos de parqueaderos adaptados a la estructura del backend
    final data = reporteParqueaderos['data'] ?? {};
    int carros = 0;
    int motos = 0;

    try {
      if (data['porTipo'] != null && data['porTipo'] is List) {
        for (var item in data['porTipo']) {
          final nombreVehiculo = item['nombreVehiculo']?.toString() ?? '';
          final cantidad = item['cantidad'];

          if (nombreVehiculo == 'carro') {
            carros = _toInt(cantidad);
          } else if (nombreVehiculo == 'moto') {
            motos = _toInt(cantidad);
          }
        }
      }
    } catch (e) {
      print('Error procesando porTipo en PDF: $e');
    }

    final totalUsosParq = carros + motos;

    final totalVisitas = _toInt(reporteVisitas['data']?['totalVisitas']);

    final totalPaquetes = _toInt(reportePaquetes['data']?['totalPaquetes']);
    final entregados = _toInt(reportePaquetes['data']?['entregados']);
    final pendientes = _toInt(reportePaquetes['data']?['pendientes']);

    final totalReservas = _toInt(reporteReservas['data']?['totalReservas']);
    final porArea = reporteReservas['data']?['porArea'] ?? [];

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) => [
          // Encabezado
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              color: PdfColors.blue50,
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'Reporte General - Comunidad Inteligente',
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.blue900,
                  ),
                ),
                pw.SizedBox(height: 8),
                pw.Text(
                  'Período: ${_formatearFecha(fechaInicio)} - ${_formatearFecha(fechaFin)}',
                  style: const pw.TextStyle(
                    fontSize: 12,
                    color: PdfColors.grey700,
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 24),

          // Parqueaderos con gráfico
          _buildPDFTitulo('REPORTE DE PARQUEADEROS', PdfColors.blue700),
          pw.SizedBox(height: 12),
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Datos numéricos
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Total de usos: $totalUsosParq',
                        style: pw.TextStyle(
                          fontSize: 16,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 16),
                      if (totalUsosParq > 0) ...[
                        _buildPDFLeyendaItem(
                          'Carros',
                          carros,
                          totalUsosParq,
                          PdfColors.blue500,
                        ),
                        pw.SizedBox(height: 8),
                        _buildPDFLeyendaItem(
                          'Motos',
                          motos,
                          totalUsosParq,
                          PdfColors.orange500,
                        ),
                        pw.SizedBox(height: 12),
                        _buildPDFBarraHorizontal(
                          'Carros',
                          carros,
                          totalUsosParq,
                          PdfColors.blue500,
                        ),
                        pw.SizedBox(height: 8),
                        _buildPDFBarraHorizontal(
                          'Motos',
                          motos,
                          totalUsosParq,
                          PdfColors.orange500,
                        ),
                      ] else
                        pw.Text(
                          'No hay datos disponibles para este período',
                          style: const pw.TextStyle(
                            fontSize: 12,
                            color: PdfColors.grey600,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 24),

          // Visitas
          _buildPDFTitulo('REPORTE DE VISITAS', PdfColors.green700),
          pw.SizedBox(height: 12),
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'Total de visitas:',
                      style: const pw.TextStyle(fontSize: 13),
                    ),
                    pw.Text(
                      '$totalVisitas',
                      style: pw.TextStyle(
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.green700,
                      ),
                    ),
                  ],
                ),
                if ((reporteVisitas['data']?['diaConMasVisitas'] ?? {})
                    .isNotEmpty) ...[
                  pw.SizedBox(height: 8),
                  pw.Divider(),
                  pw.SizedBox(height: 8),
                  pw.Text(
                    'Día con más visitas: ${reporteVisitas['data']?['diaConMasVisitas']?['fecha']} (${_toInt(reporteVisitas['data']?['diaConMasVisitas']?['cantidad'])} visitas)',
                    style: const pw.TextStyle(fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
          pw.SizedBox(height: 24),

          // Paquetes con gráfico
          _buildPDFTitulo('REPORTE DE PAQUETES', PdfColors.purple700),
          pw.SizedBox(height: 12),
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Datos numéricos
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Total de paquetes: $totalPaquetes',
                        style: pw.TextStyle(
                          fontSize: 16,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 16),
                      if (totalPaquetes > 0) ...[
                        _buildPDFLeyendaItem(
                          'Entregados',
                          entregados,
                          totalPaquetes,
                          PdfColors.green500,
                        ),
                        pw.SizedBox(height: 8),
                        _buildPDFLeyendaItem(
                          'Pendientes',
                          pendientes,
                          totalPaquetes,
                          PdfColors.orange500,
                        ),
                        pw.SizedBox(height: 12),
                        _buildPDFBarraHorizontal(
                          'Entregados',
                          entregados,
                          totalPaquetes,
                          PdfColors.green500,
                        ),
                        pw.SizedBox(height: 8),
                        _buildPDFBarraHorizontal(
                          'Pendientes',
                          pendientes,
                          totalPaquetes,
                          PdfColors.orange500,
                        ),
                      ] else
                        pw.Text(
                          'No hay datos disponibles para este período',
                          style: const pw.TextStyle(
                            fontSize: 12,
                            color: PdfColors.grey600,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 24),

          // Reservas con ranking
          _buildPDFTitulo('REPORTE DE RESERVAS', PdfColors.teal700),
          pw.SizedBox(height: 12),
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'Total de reservas: $totalReservas',
                  style: pw.TextStyle(
                    fontSize: 14,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                if (porArea.isNotEmpty) ...[
                  pw.SizedBox(height: 16),
                  pw.Text(
                    'Ranking de áreas más reservadas:',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  ...porArea.take(5).map((area) {
                    final cantidad = _toInt(area['cantidad']);
                    return pw.Padding(
                      padding: const pw.EdgeInsets.only(bottom: 8),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Row(
                            mainAxisAlignment:
                                pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text(
                                area['nombreArea'] ?? 'N/A',
                                style: const pw.TextStyle(fontSize: 11),
                              ),
                              pw.Text(
                                '$cantidad reservas',
                                style: pw.TextStyle(
                                  fontSize: 11,
                                  fontWeight: pw.FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          pw.SizedBox(height: 4),
                          pw.Stack(
                            children: [
                              pw.Container(
                                height: 8,
                                decoration: pw.BoxDecoration(
                                  color: PdfColors.grey200,
                                  borderRadius: pw.BorderRadius.circular(4),
                                ),
                              ),
                              pw.Container(
                                width:
                                    (totalReservas > 0
                                        ? (cantidad / totalReservas)
                                        : 0) *
                                    (PdfPageFormat.a4.availableWidth - 96),
                                height: 8,
                                decoration: pw.BoxDecoration(
                                  color: PdfColors.teal400,
                                  borderRadius: pw.BorderRadius.circular(4),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ] else
                  pw.Text(
                    'No hay datos disponibles para este período',
                    style: const pw.TextStyle(
                      fontSize: 12,
                      color: PdfColors.grey600,
                    ),
                  ),
              ],
            ),
          ),

          pw.SizedBox(height: 32),
          pw.Divider(),
          pw.SizedBox(height: 8),
          pw.Text(
            'Generado el ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year} a las ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
            style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(onLayout: (format) async => pdf.save());
  }

  pw.Widget _buildPDFTitulo(String titulo, PdfColor color) {
    return pw.Text(
      titulo,
      style: pw.TextStyle(
        fontSize: 18,
        fontWeight: pw.FontWeight.bold,
        color: color,
      ),
    );
  }

  pw.Widget _buildPDFBarraHorizontal(
    String label,
    int valor,
    int total,
    PdfColor color,
  ) {
    final porcentaje = total > 0 ? (valor / total) : 0.0;
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(label, style: const pw.TextStyle(fontSize: 12)),
            pw.Text(
              '$valor (${(porcentaje * 100).toStringAsFixed(1)}%)',
              style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
            ),
          ],
        ),
        pw.SizedBox(height: 4),
        pw.Stack(
          children: [
            pw.Container(
              height: 12,
              decoration: pw.BoxDecoration(
                color: PdfColors.grey200,
                borderRadius: pw.BorderRadius.circular(6),
              ),
            ),
            pw.Container(
              width: porcentaje * (PdfPageFormat.a4.availableWidth - 96),
              height: 12,
              decoration: pw.BoxDecoration(
                color: color,
                borderRadius: pw.BorderRadius.circular(6),
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _formatearFecha(DateTime fecha) {
    return '${fecha.day.toString().padLeft(2, '0')}/${fecha.month.toString().padLeft(2, '0')}/${fecha.year}';
  }
}

// ============================================================================
// PIE CHART PAINTER
// ============================================================================
class _PieChartPainter extends CustomPainter {
  final List<MapEntry<String, dynamic>> datos;
  final double total;

  _PieChartPainter(this.datos, this.total);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    double startAngle = -90 * (3.14159 / 180); // Empezar desde arriba

    for (var entry in datos) {
      final valor = (entry.value['valor'] as num).toDouble();
      final color = entry.value['color'] as Color;
      final sweepAngle = (valor / total) * 2 * 3.14159;

      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        true,
        paint,
      );

      startAngle += sweepAngle;
    }

    // Círculo blanco en el centro para efecto "donut"
    final centerPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    canvas.drawCircle(center, radius * 0.5, centerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
