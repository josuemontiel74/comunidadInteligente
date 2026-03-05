import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../utils/api_config.dart';

// ============================================================================
// REPORTES API SERVICE
// ============================================================================
class ReportesApiService {
  static const String _baseUrl = ApiConfig.apiUrl;

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

  // ============================================================================
  // REPORTES DE RESIDENTES
  // ============================================================================

  /// Obtiene estadísticas de ocupación por torre
  static Future<Map<String, dynamic>> obtenerReporteOcupacion(
    String token,
  ) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/reportes/residentes/ocupacion'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {};
    } catch (e) {
      print('Error al obtener reporte de ocupación: $e');
      return {};
    }
  }

  /// Obtiene listado de niños (menores de 18 años)
  static Future<Map<String, dynamic>> obtenerReporteNinos(String token) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/reportes/residentes/ninos'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {};
    } catch (e) {
      print('Error al obtener reporte de niños: $e');
      return {};
    }
  }

  /// Obtiene información de población especial (adultos mayores y discapacitados)
  static Future<Map<String, dynamic>> obtenerReportePoblacionEspecial(
    String token,
  ) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/reportes/residentes/poblacion-especial'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {};
    } catch (e) {
      print('Error al obtener reporte de población especial: $e');
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

  // Reportes de residentes
  Map<String, dynamic> reporteOcupacion = {};
  Map<String, dynamic> reporteNinos = {};
  Map<String, dynamic> reportePoblacionEspecial = {};

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
      // Reportes de residentes (sin filtro de fechas)
      ReportesApiService.obtenerReporteOcupacion(widget.token),
      ReportesApiService.obtenerReporteNinos(widget.token),
      ReportesApiService.obtenerReportePoblacionEspecial(widget.token),
    ]);

    setState(() {
      // Si el backend no responde, usar datos de ejemplo
      reporteParqueaderos = results[0].isEmpty
          ? {
              'data': {
                'resumenActual': [],
                'ocupacionDiaria': [],
                'picoOcupacion': [],
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

      // Reportes de residentes
      reporteOcupacion = results[4].isEmpty
          ? {
              'totalApartamentos': 0,
              'apartamentosOcupados': 0,
              'apartamentosVacios': 0,
              'porcentajeOcupacion': 0,
              'totalResidentes': 0,
              'detallePorTorre': [],
            }
          : results[4];

      reporteNinos = results[5].isEmpty
          ? {'totalNinos': 0, 'ninos': []}
          : results[5];

      reportePoblacionEspecial = results[6].isEmpty
          ? {
              'adultosMayores': {'total': 0, 'personas': []},
              'personasConDiscapacidad': {'total': 0, 'personas': []},
            }
          : results[6];

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
                        _buildOcupacionDiaria(),
                        const SizedBox(height: 24),
                        _buildPicoOcupacion(),
                        const SizedBox(height: 24),
                        _buildReporteVisitas(),
                        const SizedBox(height: 24),
                        _buildReportePaquetes(),
                        const SizedBox(height: 24),
                        _buildReporteReservas(),
                        const SizedBox(height: 32),
                        // ============================================
                        // SECCIÓN DE REPORTES DE RESIDENTES
                        // ============================================
                        _buildSeccionTitulo(
                          'Reportes de Residentes',
                          Icons.people,
                          Colors.teal,
                        ),
                        const SizedBox(height: 16),
                        _buildReporteOcupacionTorres(),
                        const SizedBox(height: 24),
                        _buildReporteNinos(),
                        const SizedBox(height: 24),
                        _buildReportePoblacionEspecial(),
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

    // Nueva estructura: resumenActual con información de ocupación
    int totalParqueaderosCarros = 0;
    int ocupadosCarros = 0;
    int disponiblesCarros = 0;
    int totalParqueaderosMotos = 0;
    int ocupadosMotos = 0;
    int disponiblesMotos = 0;

    try {
      if (data['resumenActual'] != null && data['resumenActual'] is List) {
        for (var item in data['resumenActual']) {
          final nombreVehiculo =
              item['nombreVehiculo']?.toString().toLowerCase() ?? '';
          final totalParqueaderos = _toInt(item['totalParqueaderos']);
          final ocupados = _toInt(item['ocupados']);
          final disponibles = _toInt(item['disponibles']);

          if (nombreVehiculo == 'carro') {
            totalParqueaderosCarros = totalParqueaderos;
            ocupadosCarros = ocupados;
            disponiblesCarros = disponibles;
          } else if (nombreVehiculo == 'moto') {
            totalParqueaderosMotos = totalParqueaderos;
            ocupadosMotos = ocupados;
            disponiblesMotos = disponibles;
          }
        }
      }
    } catch (e) {
      print('Error procesando resumenActual: $e');
    }

    final totalOcupados = ocupadosCarros + ocupadosMotos;
    final totalDisponibles = disponiblesCarros + disponiblesMotos;
    final totalParqueaderos = totalParqueaderosCarros + totalParqueaderosMotos;

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
              'Total Parqueaderos',
              totalParqueaderos.toString(),
              Icons.local_parking,
            ),
            const SizedBox(height: 12),
            _buildStatRow(
              'Ocupados',
              '$totalOcupados (${_calcularPorcentaje(totalOcupados, totalParqueaderos)}%)',
              Icons.lock,
              color: Colors.red,
            ),
            const SizedBox(height: 12),
            _buildStatRow(
              'Disponibles',
              '$totalDisponibles (${_calcularPorcentaje(totalDisponibles, totalParqueaderos)}%)',
              Icons.lock_open,
              color: Colors.green,
            ),
            const SizedBox(height: 16),
            const Text(
              'Por tipo de vehículo:',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            _buildStatRow(
              'Carros',
              'Ocupados: $ocupadosCarros / $totalParqueaderosCarros',
              Icons.directions_car,
            ),
            const SizedBox(height: 8),
            _buildStatRow(
              'Motos',
              'Ocupados: $ocupadosMotos / $totalParqueaderosMotos',
              Icons.two_wheeler,
            ),
            const SizedBox(height: 16),
            _buildProgressBar(
              'Carros Ocupados',
              ocupadosCarros,
              totalParqueaderosCarros,
              Colors.blue,
            ),
            const SizedBox(height: 8),
            _buildProgressBar(
              'Motos Ocupadas',
              ocupadosMotos,
              totalParqueaderosMotos,
              Colors.orange,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOcupacionDiaria() {
    final data = reporteParqueaderos['data'] ?? {};
    final ocupacionDiaria = data['ocupacionDiaria'] ?? [];

    if (ocupacionDiaria.isEmpty) {
      return const SizedBox.shrink();
    }

    // Encontrar el máximo para escalar el gráfico
    int maxVehiculos = 0;
    for (var dia in ocupacionDiaria) {
      final total = _toInt(dia['vehiculosIngresados']);
      if (total > maxVehiculos) maxVehiculos = total;
    }

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
                Icon(Icons.show_chart, color: Colors.purple.shade700, size: 32),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Ocupación Diaria de Parqueaderos',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            const SizedBox(height: 16),
            // Gráfico de barras
            SizedBox(
              height: 280,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: ocupacionDiaria.length,
                itemBuilder: (context, index) {
                  final dia = ocupacionDiaria[index];
                  final fecha = dia['fecha']?.toString() ?? '';
                  final vehiculosIngresados = _toInt(
                    dia['vehiculosIngresados'],
                  );
                  final carros = _toInt(dia['carros']);
                  final motos = _toInt(dia['motos']);

                  // Formatear fecha (solo día/mes)
                  String fechaCorta = '';
                  try {
                    final partes = fecha.split('-');
                    if (partes.length == 3) {
                      fechaCorta = '${partes[2]}/${partes[1]}';
                    }
                  } catch (e) {
                    fechaCorta = fecha;
                  }

                  final altura = maxVehiculos > 0
                      ? (vehiculosIngresados / maxVehiculos) * 150
                      : 0.0;

                  return Container(
                    width: 80,
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        // Número de vehículos
                        Text(
                          vehiculosIngresados.toString(),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        // Barra apilada
                        SizedBox(
                          height: altura.clamp(20, 150),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              // Motos (arriba)
                              if (motos > 0)
                                Container(
                                  height: vehiculosIngresados > 0
                                      ? (motos / vehiculosIngresados) *
                                            altura.clamp(20, 150)
                                      : 0,
                                  decoration: BoxDecoration(
                                    color: Colors.orange.shade600,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(8),
                                      topRight: Radius.circular(8),
                                    ),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    motos.toString(),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              // Carros (abajo)
                              if (carros > 0)
                                Container(
                                  height: vehiculosIngresados > 0
                                      ? (carros / vehiculosIngresados) *
                                            altura.clamp(20, 150)
                                      : 0,
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade600,
                                    borderRadius: BorderRadius.only(
                                      bottomLeft: const Radius.circular(8),
                                      bottomRight: const Radius.circular(8),
                                      topLeft: motos > 0
                                          ? Radius.zero
                                          : const Radius.circular(8),
                                      topRight: motos > 0
                                          ? Radius.zero
                                          : const Radius.circular(8),
                                    ),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    carros.toString(),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Fecha
                        Text(
                          fechaCorta,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            // Leyenda
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildLeyenda('Carros', Colors.blue.shade600),
                const SizedBox(width: 24),
                _buildLeyenda('Motos', Colors.orange.shade600),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPicoOcupacion() {
    final data = reporteParqueaderos['data'] ?? {};
    final picoOcupacion = data['picoOcupacion'] ?? [];

    if (picoOcupacion.isEmpty) {
      return const SizedBox.shrink();
    }

    // Encontrar el máximo para escalar el gráfico
    int maxVisitas = 0;
    for (var hora in picoOcupacion) {
      final total = _toInt(hora['cantidadVisitas']);
      if (total > maxVisitas) maxVisitas = total;
    }

    // Tomar solo las top 10 horas
    final topHoras = picoOcupacion.take(10).toList();

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
                Icon(Icons.bar_chart, color: Colors.teal.shade700, size: 32),
                const SizedBox(width: 12),
                const Text(
                  'Horas Pico de Ocupación',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(height: 24),
            const Text(
              'Top 10 horas con mayor ocupación',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            // Gráfico de barras horizontales
            ...topHoras.map((hora) {
              final horaNum = _toInt(hora['hora']);
              final cantidadVisitas = _toInt(hora['cantidadVisitas']);
              final carros = _toInt(hora['carros']);
              final motos = _toInt(hora['motos']);

              final porcentaje = maxVisitas > 0
                  ? cantidadVisitas / maxVisitas
                  : 0.0;

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        SizedBox(
                          width: 60,
                          child: Text(
                            '${horaNum.toString().padLeft(2, '0')}:00',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Stack(
                            children: [
                              // Fondo gris
                              Container(
                                height: 32,
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              // Barra de color
                              Container(
                                height: 32,
                                width:
                                    (MediaQuery.of(context).size.width - 200) *
                                    porcentaje,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.teal.shade400,
                                      Colors.teal.shade700,
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              // Texto con cantidad
                              Container(
                                height: 32,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  '$cantidadVisitas visitas (C:$carros M:$motos)',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: porcentaje > 0.3
                                        ? Colors.white
                                        : Colors.black87,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildLeyenda(String texto, Color color) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 6),
        Text(texto, style: const TextStyle(fontSize: 12)),
      ],
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
    final porEstado = data['porEstado'] ?? [];
    final promedioAsistentes = data['promedioAsistentes'] ?? 0.0;
    final diaConMasReservas = data['diaConMasReservas'] ?? {};

    final areaMasUsada = porArea.isNotEmpty ? porArea[0] : null;
    // ignore: unused_local_variable
    final _ = areaMasUsada; // reservado para uso futuro

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
                const Expanded(
                  child: Text(
                    'Reporte de Reservas',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),

            // Estadísticas principales
            Row(
              children: [
                Expanded(
                  child: _buildMiniCard(
                    'Total Reservas',
                    totalReservas.toString(),
                    Icons.event_available,
                    Colors.teal.shade600,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMiniCard(
                    'Promedio Asistentes',
                    promedioAsistentes is double
                        ? promedioAsistentes.toStringAsFixed(1)
                        : promedioAsistentes.toString(),
                    Icons.people,
                    Colors.purple.shade600,
                  ),
                ),
              ],
            ),

            // Día con más reservas
            if (diaConMasReservas.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.star, color: Colors.orange.shade700, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Día Pico',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            _formatearFechaDia(
                              diaConMasReservas['fecha']?.toString() ?? '',
                            ),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.orange.shade900,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${_toInt(diaConMasReservas['cantidad'])} reservas',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Por Estado
            if (porEstado.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                'Por Estado:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              ...porEstado.map((estado) {
                final nombre = estado['nombreEstado']?.toString() ?? 'N/A';
                final cantidad = _toInt(estado['cantidad']);
                Color estadoColor = Colors.grey;

                if (nombre.toLowerCase().contains('finalizada')) {
                  estadoColor = Colors.green;
                } else if (nombre.toLowerCase().contains('curso')) {
                  estadoColor = Colors.blue;
                } else if (nombre.toLowerCase().contains('pendiente')) {
                  estadoColor = Colors.orange;
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: estadoColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(flex: 3, child: Text(nombre)),
                      Expanded(
                        flex: 2,
                        child: LinearProgressIndicator(
                          value: totalReservas > 0
                              ? cantidad / totalReservas
                              : 0,
                          backgroundColor: Colors.grey.shade200,
                          valueColor: AlwaysStoppedAnimation(estadoColor),
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

            // Por Área
            if (porArea.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                'Por Área Común:',
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

  Widget _buildMiniCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  String _formatearFechaDia(String fecha) {
    if (fecha.isEmpty) return 'N/A';
    try {
      final partes = fecha.split('-');
      if (partes.length == 3) {
        final meses = [
          '',
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ];
        final mes = int.parse(partes[1]);
        return '${partes[2]} ${meses[mes]} ${partes[0]}';
      }
    } catch (e) {
      return fecha;
    }
    return fecha;
  }

  Widget _buildStatRow(
    String label,
    String value,
    IconData icon, {
    Color? color,
  }) {
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
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
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

    // Obtener datos de parqueaderos con nueva estructura
    final data = reporteParqueaderos['data'] ?? {};
    int totalParqueaderosCarros = 0;
    int ocupadosCarros = 0;
    int disponiblesCarros = 0;
    int totalParqueaderosMotos = 0;
    int ocupadosMotos = 0;
    int disponiblesMotos = 0;

    try {
      if (data['resumenActual'] != null && data['resumenActual'] is List) {
        for (var item in data['resumenActual']) {
          final nombreVehiculo =
              item['nombreVehiculo']?.toString().toLowerCase() ?? '';
          final totalParqueaderos = _toInt(item['totalParqueaderos']);
          final ocupados = _toInt(item['ocupados']);
          final disponibles = _toInt(item['disponibles']);

          if (nombreVehiculo == 'carro') {
            totalParqueaderosCarros = totalParqueaderos;
            ocupadosCarros = ocupados;
            disponiblesCarros = disponibles;
          } else if (nombreVehiculo == 'moto') {
            totalParqueaderosMotos = totalParqueaderos;
            ocupadosMotos = ocupados;
            disponiblesMotos = disponibles;
          }
        }
      }
    } catch (e) {
      print('Error procesando resumenActual en PDF: $e');
    }

    final totalOcupados = ocupadosCarros + ocupadosMotos;
    final totalDisponibles = disponiblesCarros + disponiblesMotos;
    final totalParqueaderos = totalParqueaderosCarros + totalParqueaderosMotos;

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
                        'Total de parqueaderos: $totalParqueaderos',
                        style: pw.TextStyle(
                          fontSize: 16,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 8),
                      pw.Text(
                        'Ocupados: $totalOcupados (${_calcularPorcentaje(totalOcupados, totalParqueaderos)}%)',
                        style: const pw.TextStyle(
                          fontSize: 14,
                          color: PdfColors.red700,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'Disponibles: $totalDisponibles (${_calcularPorcentaje(totalDisponibles, totalParqueaderos)}%)',
                        style: const pw.TextStyle(
                          fontSize: 14,
                          color: PdfColors.green700,
                        ),
                      ),
                      pw.SizedBox(height: 16),
                      if (totalParqueaderos > 0) ...[
                        pw.Text(
                          'Desglose por tipo de vehículo:',
                          style: pw.TextStyle(
                            fontSize: 12,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 8),
                        _buildPDFLeyendaItem(
                          'Carros',
                          ocupadosCarros,
                          totalParqueaderosCarros,
                          PdfColors.blue500,
                        ),
                        pw.SizedBox(height: 8),
                        _buildPDFLeyendaItem(
                          'Motos',
                          ocupadosMotos,
                          totalParqueaderosMotos,
                          PdfColors.orange500,
                        ),
                        pw.SizedBox(height: 12),
                        _buildPDFBarraHorizontal(
                          'Carros',
                          ocupadosCarros,
                          totalParqueaderosCarros,
                          PdfColors.blue500,
                        ),
                        pw.SizedBox(height: 8),
                        _buildPDFBarraHorizontal(
                          'Motos',
                          ocupadosMotos,
                          totalParqueaderosMotos,
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

          // ============================================================
          // REPORTES DE RESIDENTES
          // ============================================================
          pw.SizedBox(height: 32),
          pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(
              color: PdfColors.teal50,
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Text(
              'REPORTES DE RESIDENTES',
              style: pw.TextStyle(
                fontSize: 20,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.teal800,
              ),
            ),
          ),
          pw.SizedBox(height: 16),

          // Ocupación por Torres
          ..._buildPDFOcupacionTorres(),
          pw.SizedBox(height: 24),

          // Niños en la Comunidad
          ..._buildPDFNinos(),
          pw.SizedBox(height: 24),

          // Población Especial
          ..._buildPDFPoblacionEspecial(),

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

  // ============================================================================
  // MÉTODOS PDF PARA REPORTES DE RESIDENTES
  // ============================================================================

  /// Genera contenido PDF para ocupación por torres
  List<pw.Widget> _buildPDFOcupacionTorres() {
    dynamic rawData = reporteOcupacion['data'] ?? reporteOcupacion;
    Map<String, dynamic> data = {};
    if (rawData is Map) {
      data = Map<String, dynamic>.from(rawData);
    }

    final totalApartamentos = _toInt(data['totalApartamentos']);
    final apartamentosOcupados = _toInt(data['apartamentosOcupados']);
    final apartamentosVacios = _toInt(data['apartamentosVacios']);
    final porcentajeOcupacion = data['porcentajeOcupacion'] ?? 0;
    final totalResidentes = _toInt(data['totalResidentes']);

    List detallePorTorre = [];
    if (data['detallePorTorre'] is List) {
      detallePorTorre = data['detallePorTorre'] as List;
    }

    return [
      _buildPDFTitulo('OCUPACIÓN POR TORRES', PdfColors.teal700),
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
            // Resumen general
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
              children: [
                _buildPDFEstadistica(
                  'Total Aptos',
                  '$totalApartamentos',
                  PdfColors.blue700,
                ),
                _buildPDFEstadistica(
                  'Ocupados',
                  '$apartamentosOcupados',
                  PdfColors.green700,
                ),
                _buildPDFEstadistica(
                  'Vacíos',
                  '$apartamentosVacios',
                  PdfColors.orange700,
                ),
                _buildPDFEstadistica(
                  'Residentes',
                  '$totalResidentes',
                  PdfColors.purple700,
                ),
                _buildPDFEstadistica(
                  'Ocupación',
                  '${porcentajeOcupacion is num ? porcentajeOcupacion.toStringAsFixed(1) : porcentajeOcupacion}%',
                  PdfColors.teal700,
                ),
              ],
            ),
            if (detallePorTorre.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              pw.Divider(),
              pw.SizedBox(height: 12),
              pw.Text(
                'Detalle por Torre:',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 8),
              // Tabla de torres
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300),
                columnWidths: {
                  0: const pw.FlexColumnWidth(2),
                  1: const pw.FlexColumnWidth(1.5),
                  2: const pw.FlexColumnWidth(1.5),
                  3: const pw.FlexColumnWidth(1.5),
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.teal50),
                    children: [
                      _buildPDFCeldaHeader('Torre'),
                      _buildPDFCeldaHeader('Apartamentos'),
                      _buildPDFCeldaHeader('Ocupados'),
                      _buildPDFCeldaHeader('Personas'),
                    ],
                  ),
                  ...detallePorTorre.map((torre) {
                    return pw.TableRow(
                      children: [
                        _buildPDFCelda(torre['nombreTorre']?.toString() ?? '-'),
                        _buildPDFCelda('${_toInt(torre['totalApartamentos'])}'),
                        _buildPDFCelda(
                          '${_toInt(torre['apartamentosOcupados'])}',
                        ),
                        _buildPDFCelda('${_toInt(torre['totalPersonas'])}'),
                      ],
                    );
                  }).toList(),
                ],
              ),
            ] else
              pw.Text(
                'No hay datos de torres disponibles',
                style: const pw.TextStyle(
                  fontSize: 12,
                  color: PdfColors.grey600,
                ),
              ),
          ],
        ),
      ),
    ];
  }

  /// Genera contenido PDF para niños en la comunidad
  List<pw.Widget> _buildPDFNinos() {
    dynamic rawData = reporteNinos['data'] ?? reporteNinos;
    Map<String, dynamic> data = {};
    if (rawData is Map) {
      data = Map<String, dynamic>.from(rawData);
    }

    final totalNinos = _toInt(data['totalNinos']);
    final totalApartamentosConNinos = _toInt(data['totalApartamentosConNinos']);

    List detalleApartamentos = [];
    if (data['detalleApartamentos'] is List) {
      detalleApartamentos = data['detalleApartamentos'] as List;
    }

    return [
      _buildPDFTitulo('NIÑOS EN LA COMUNIDAD', PdfColors.pink700),
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
            // Resumen
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
              children: [
                _buildPDFEstadistica(
                  'Total Niños',
                  '$totalNinos',
                  PdfColors.pink700,
                ),
                _buildPDFEstadistica(
                  'Apartamentos con Niños',
                  '$totalApartamentosConNinos',
                  PdfColors.pink500,
                ),
              ],
            ),
            if (detalleApartamentos.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              pw.Divider(),
              pw.SizedBox(height: 12),
              pw.Text(
                'Detalle de Apartamentos con Niños:',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300),
                columnWidths: {
                  0: const pw.FlexColumnWidth(1.5),
                  1: const pw.FlexColumnWidth(1.5),
                  2: const pw.FlexColumnWidth(1),
                  3: const pw.FlexColumnWidth(3),
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.pink50),
                    children: [
                      _buildPDFCeldaHeader('Torre'),
                      _buildPDFCeldaHeader('Apartamento'),
                      _buildPDFCeldaHeader('Niños'),
                      _buildPDFCeldaHeader('Ocupante'),
                    ],
                  ),
                  ...detalleApartamentos.take(15).map((apto) {
                    return pw.TableRow(
                      children: [
                        _buildPDFCelda(apto['nombreTorre']?.toString() ?? '-'),
                        _buildPDFCelda(
                          apto['numeroApartamento']?.toString() ?? '-',
                        ),
                        _buildPDFCelda('${_toInt(apto['ocupantesConNinos'])}'),
                        _buildPDFCelda(
                          apto['nombreOcupantes']?.toString() ?? '-',
                        ),
                      ],
                    );
                  }).toList(),
                ],
              ),
              if (detalleApartamentos.length > 15)
                pw.Padding(
                  padding: const pw.EdgeInsets.only(top: 8),
                  child: pw.Text(
                    '... y ${detalleApartamentos.length - 15} apartamentos más',
                    style: const pw.TextStyle(
                      fontSize: 10,
                      color: PdfColors.grey600,
                    ),
                  ),
                ),
            ] else
              pw.Text(
                'No hay datos de niños disponibles',
                style: const pw.TextStyle(
                  fontSize: 12,
                  color: PdfColors.grey600,
                ),
              ),
          ],
        ),
      ),
    ];
  }

  /// Genera contenido PDF para población especial
  List<pw.Widget> _buildPDFPoblacionEspecial() {
    dynamic rawData =
        reportePoblacionEspecial['data'] ?? reportePoblacionEspecial;
    Map<String, dynamic> data = {};
    if (rawData is Map) {
      data = Map<String, dynamic>.from(rawData);
    }

    final totalAdultosMayores = _toInt(data['totalAdultosMayores']);
    final totalDiscapacitados = _toInt(data['totalDiscapacidad']);

    List detalleApartamentos = [];
    if (data['detalleApartamentos'] is List) {
      detalleApartamentos = data['detalleApartamentos'] as List;
    }

    return [
      _buildPDFTitulo('POBLACIÓN ESPECIAL', PdfColors.indigo700),
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
            // Resumen
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
              children: [
                _buildPDFEstadistica(
                  'Adultos Mayores (60+)',
                  '$totalAdultosMayores',
                  PdfColors.amber700,
                ),
                _buildPDFEstadistica(
                  'Personas con Discapacidad',
                  '$totalDiscapacitados',
                  PdfColors.indigo700,
                ),
              ],
            ),
            if (detalleApartamentos.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              pw.Divider(),
              pw.SizedBox(height: 12),
              pw.Text(
                'Detalle de Población Especial:',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300),
                columnWidths: {
                  0: const pw.FlexColumnWidth(1.5),
                  1: const pw.FlexColumnWidth(1.5),
                  2: const pw.FlexColumnWidth(2),
                  3: const pw.FlexColumnWidth(3),
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(
                      color: PdfColors.indigo50,
                    ),
                    children: [
                      _buildPDFCeldaHeader('Torre'),
                      _buildPDFCeldaHeader('Apartamento'),
                      _buildPDFCeldaHeader('Tipo'),
                      _buildPDFCeldaHeader('Ocupante'),
                    ],
                  ),
                  ...detalleApartamentos.take(15).map((persona) {
                    return pw.TableRow(
                      children: [
                        _buildPDFCelda(
                          persona['nombreTorre']?.toString() ?? '-',
                        ),
                        _buildPDFCelda(
                          persona['numeroApartamento']?.toString() ?? '-',
                        ),
                        _buildPDFCelda(
                          persona['tipoPoblacion']?.toString() ?? '-',
                        ),
                        _buildPDFCelda(
                          persona['nombreOcupantes']?.toString() ?? '-',
                        ),
                      ],
                    );
                  }).toList(),
                ],
              ),
              if (detalleApartamentos.length > 15)
                pw.Padding(
                  padding: const pw.EdgeInsets.only(top: 8),
                  child: pw.Text(
                    '... y ${detalleApartamentos.length - 15} registros más',
                    style: const pw.TextStyle(
                      fontSize: 10,
                      color: PdfColors.grey600,
                    ),
                  ),
                ),
            ] else
              pw.Text(
                'No hay datos de población especial disponibles',
                style: const pw.TextStyle(
                  fontSize: 12,
                  color: PdfColors.grey600,
                ),
              ),
          ],
        ),
      ),
    ];
  }

  /// Helper para crear estadística en PDF
  pw.Widget _buildPDFEstadistica(String label, String valor, PdfColor color) {
    return pw.Column(
      children: [
        pw.Text(
          valor,
          style: pw.TextStyle(
            fontSize: 18,
            fontWeight: pw.FontWeight.bold,
            color: color,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          label,
          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
          textAlign: pw.TextAlign.center,
        ),
      ],
    );
  }

  /// Helper para crear celda de encabezado en tabla PDF
  pw.Widget _buildPDFCeldaHeader(String texto) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(
        texto,
        style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
        textAlign: pw.TextAlign.center,
      ),
    );
  }

  /// Helper para crear celda de datos en tabla PDF
  pw.Widget _buildPDFCelda(String texto) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(
        texto,
        style: const pw.TextStyle(fontSize: 9),
        textAlign: pw.TextAlign.center,
      ),
    );
  }

  // ============================================================================
  // WIDGETS DE REPORTES DE RESIDENTES
  // ============================================================================

  /// Widget para crear título de sección con ícono
  Widget _buildSeccionTitulo(String titulo, IconData icono, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icono, color: color, size: 28),
          const SizedBox(width: 12),
          Text(
            titulo,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  /// Widget para mostrar ocupación por torres con gráfico de barras
  Widget _buildReporteOcupacionTorres() {
    // Manejar diferentes estructuras de respuesta (con o sin wrapper 'data')
    dynamic rawData = reporteOcupacion['data'] ?? reporteOcupacion;
    Map<String, dynamic> data = {};
    if (rawData is Map) {
      data = Map<String, dynamic>.from(rawData);
    }

    final totalApartamentos = _toInt(data['totalApartamentos']);
    final apartamentosOcupados = _toInt(data['apartamentosOcupados']);
    final apartamentosVacios = _toInt(data['apartamentosVacios']);
    final porcentajeOcupacion = data['porcentajeOcupacion'] ?? 0;
    final totalResidentes = _toInt(data['totalResidentes']);

    List detallePorTorre = [];
    if (data['detallePorTorre'] is List) {
      detallePorTorre = data['detallePorTorre'] as List;
    }

    // Encontrar el máximo para escalar el gráfico (usando totalPersonas del backend)
    int maxPersonas = 0;
    for (var torre in detallePorTorre) {
      final personas = _toInt(torre['totalPersonas']);
      if (personas > maxPersonas) maxPersonas = personas;
    }

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
                Icon(Icons.apartment, color: Colors.teal.shade700, size: 32),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Ocupación por Torres',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            // Resumen general
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.teal.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildEstadisticaCircular(
                        'Total Aptos',
                        totalApartamentos.toString(),
                        Colors.blue,
                        Icons.home,
                      ),
                      _buildEstadisticaCircular(
                        'Ocupados',
                        apartamentosOcupados.toString(),
                        Colors.green,
                        Icons.check_circle,
                      ),
                      _buildEstadisticaCircular(
                        'Vacíos',
                        apartamentosVacios.toString(),
                        Colors.orange,
                        Icons.remove_circle_outline,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildEstadisticaCircular(
                        'Residentes',
                        totalResidentes.toString(),
                        Colors.purple,
                        Icons.people,
                      ),
                      _buildEstadisticaCircular(
                        'Ocupación',
                        '${(porcentajeOcupacion is num ? porcentajeOcupacion.toStringAsFixed(1) : porcentajeOcupacion)}%',
                        Colors.teal,
                        Icons.pie_chart,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Gráfico de barras por torre
            if (detallePorTorre.isNotEmpty) ...[
              const Text(
                'Residentes por Torre:',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 280,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: detallePorTorre.length,
                  itemBuilder: (context, index) {
                    final torre = detallePorTorre[index];
                    final nombreTorre =
                        torre['nombreTorre']?.toString() ?? 'Torre ?';
                    final totalPersonas = _toInt(torre['totalPersonas']);
                    final totalApartamentos = _toInt(
                      torre['totalApartamentos'],
                    );
                    final apartamentosOcupados = _toInt(
                      torre['apartamentosOcupados'],
                    );

                    final altura = maxPersonas > 0
                        ? (totalPersonas / maxPersonas) * 150
                        : 0.0;

                    return Container(
                      width: 90,
                      margin: const EdgeInsets.symmetric(horizontal: 6),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          // Valor
                          Text(
                            '$totalPersonas',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.teal.shade700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          // Barra
                          Container(
                            height: altura.clamp(10.0, 150.0),
                            width: 50,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.teal.shade400,
                                  Colors.teal.shade600,
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(6),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.teal.withOpacity(0.3),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Nombre de la torre
                          Text(
                            nombreTorre,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          // Info adicional
                          Text(
                            '$apartamentosOcupados/$totalApartamentos',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Ocupados / Total apartamentos',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade500,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ] else
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(
                        Icons.apartment,
                        size: 48,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No hay datos de ocupación disponibles',
                        style: TextStyle(color: Colors.grey.shade500),
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

  /// Widget auxiliar para mostrar estadística en círculo
  Widget _buildEstadisticaCircular(
    String label,
    String valor,
    Color color,
    IconData icono,
  ) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 2),
          ),
          child: Center(child: Icon(icono, color: color, size: 28)),
        ),
        const SizedBox(height: 6),
        Text(
          valor,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  /// Widget para mostrar reporte de niños (menores de 18)
  Widget _buildReporteNinos() {
    // Manejar diferentes estructuras de respuesta (con o sin wrapper 'data')
    dynamic rawData = reporteNinos['data'] ?? reporteNinos;
    Map<String, dynamic> data = {};
    if (rawData is Map) {
      data = Map<String, dynamic>.from(rawData);
    }

    final totalNinos = _toInt(data['totalNinos']);
    final totalApartamentosConNinos = _toInt(data['totalApartamentosConNinos']);

    List detalleApartamentos = [];
    if (data['detalleApartamentos'] is List) {
      detalleApartamentos = data['detalleApartamentos'] as List;
    }

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
                Icon(Icons.child_care, color: Colors.pink.shade600, size: 32),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Niños en la Comunidad',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.pink.shade50,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.pink.shade200),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.child_friendly,
                        size: 18,
                        color: Colors.pink.shade600,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Total: $totalNinos',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.pink.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (detalleApartamentos.isNotEmpty)
              // Tabla de apartamentos con niños
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  headingRowColor: MaterialStateProperty.all(
                    Colors.pink.shade50,
                  ),
                  columns: const [
                    DataColumn(
                      label: Text(
                        'Torre',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    DataColumn(
                      label: Text(
                        'Apartamento',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    DataColumn(
                      label: Text(
                        'Niños',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    DataColumn(
                      label: Text(
                        'Ocupante',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                  rows: detalleApartamentos.map<DataRow>((apto) {
                    return DataRow(
                      cells: [
                        DataCell(Text(apto['nombreTorre']?.toString() ?? '-')),
                        DataCell(
                          Text(apto['numeroApartamento']?.toString() ?? '-'),
                        ),
                        DataCell(
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.pink.shade400,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${_toInt(apto['ocupantesConNinos'])}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                        DataCell(
                          Text(apto['nombreOcupantes']?.toString() ?? '-'),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              )
            else
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(
                        Icons.child_care,
                        size: 48,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No hay datos de niños disponibles',
                        style: TextStyle(color: Colors.grey.shade500),
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

  /// Color según la edad del niño
  // ignore: unused_element
  Color _colorPorEdad(int edad) {
    if (edad <= 5) return Colors.purple;
    if (edad <= 10) return Colors.blue;
    if (edad <= 14) return Colors.teal;
    return Colors.orange;
  }

  /// Widget para mostrar reporte de población especial
  Widget _buildReportePoblacionEspecial() {
    // Manejar diferentes estructuras de respuesta (con o sin wrapper 'data')
    dynamic rawData =
        reportePoblacionEspecial['data'] ?? reportePoblacionEspecial;
    Map<String, dynamic> data = {};
    if (rawData is Map) {
      data = Map<String, dynamic>.from(rawData);
    }

    // Los totales están directamente en data
    final totalAdultosMayores = _toInt(data['totalAdultosMayores']);
    final totalDiscapacitados = _toInt(data['totalDiscapacidad']);

    // El detalle está en detalleApartamentos
    List detalleApartamentos = [];
    if (data['detalleApartamentos'] is List) {
      detalleApartamentos = data['detalleApartamentos'] as List;
    }

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
                  Icons.accessibility_new,
                  color: Colors.indigo.shade600,
                  size: 32,
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Población Especial',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            // Resumen
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.shade200),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.elderly,
                          size: 40,
                          color: Colors.amber.shade700,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '$totalAdultosMayores',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber.shade800,
                          ),
                        ),
                        const Text(
                          'Adultos Mayores',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        Text(
                          '(60+ años)',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.indigo.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.indigo.shade200),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.accessible,
                          size: 40,
                          color: Colors.indigo.shade700,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '$totalDiscapacitados',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.indigo.shade800,
                          ),
                        ),
                        const Text(
                          'Personas con',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        Text(
                          'Discapacidad',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Tabla unificada de población especial
            if (detalleApartamentos.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 8,
                  horizontal: 12,
                ),
                decoration: BoxDecoration(
                  color: Colors.purple.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.people_alt,
                      color: Colors.purple.shade800,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Detalle de Población Especial',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.purple.shade900,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  headingRowColor: MaterialStateProperty.all(
                    Colors.purple.shade50,
                  ),
                  columns: const [
                    DataColumn(
                      label: Text(
                        'Torre',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    DataColumn(
                      label: Text(
                        'Apartamento',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    DataColumn(
                      label: Text(
                        'Tipo',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    DataColumn(
                      label: Text(
                        'Ocupante',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                  rows: detalleApartamentos.map<DataRow>((persona) {
                    final tipoPoblacion =
                        persona['tipoPoblacion']?.toString() ?? '-';
                    final esAdultoMayor = tipoPoblacion.toLowerCase().contains(
                      'adulto',
                    );
                    return DataRow(
                      cells: [
                        DataCell(
                          Text(persona['nombreTorre']?.toString() ?? '-'),
                        ),
                        DataCell(
                          Text(persona['numeroApartamento']?.toString() ?? '-'),
                        ),
                        DataCell(
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: esAdultoMayor
                                  ? Colors.amber.shade600
                                  : Colors.indigo.shade600,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              tipoPoblacion,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                        DataCell(
                          Text(persona['nombreOcupantes']?.toString() ?? '-'),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ],
            // Mensaje si no hay datos
            if (detalleApartamentos.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(
                        Icons.accessibility,
                        size: 48,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No hay datos de población especial disponibles',
                        style: TextStyle(color: Colors.grey.shade500),
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
}
