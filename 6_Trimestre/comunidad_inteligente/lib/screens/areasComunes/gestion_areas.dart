import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../main.dart';

class GestionAreas extends StatefulWidget {
  final String? token;

  const GestionAreas({super.key, required this.token});

  @override
  State<GestionAreas> createState() => _GestionAreasState();
}

class _GestionAreasState extends State<GestionAreas> {
  List<dynamic> _areasComunes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarAreasComunes();
  }

  Future<void> _cargarAreasComunes() async {
    setState(() => _isLoading = true);

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (widget.token != null) {
        headers['Authorization'] = 'Bearer ${widget.token}';
      }

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/areaComunes'),
        headers: headers,
      );

      debugPrint('=== DEBUG GESTION AREAS ===');
      debugPrint('Status Code: ${response.statusCode}');
      debugPrint('Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('Data decoded: $data');
        debugPrint('data[body]: ${data['body']}');
        debugPrint('data[data]: ${data['data']}');

        setState(() {
          _areasComunes = data['body'] ?? data['data'] ?? [];
          debugPrint('Áreas cargadas: ${_areasComunes.length}');
          if (_areasComunes.isNotEmpty) {
            debugPrint('Primera área: ${_areasComunes[0]}');
          }
          _isLoading = false;
        });
      } else {
        debugPrint('Error status code: ${response.statusCode}');
        setState(() => _isLoading = false);
        _mostrarError('Error al cargar áreas comunes');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _mostrarError('Error de conexión: $e');
    }
  }

  Future<void> _cambiarEstadoArea(int idAreaComun, bool estaDisponible) async {
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (widget.token != null) {
        headers['Authorization'] = 'Bearer ${widget.token}';
      }

      // 4 = Disponible, 18 = No disponible
      final nuevoEstadoId = estaDisponible ? 18 : 4;

      final response = await http.patch(
        Uri.parse('${LoginServe.baseUrl}/api/areaComunes/$idAreaComun'),
        headers: headers,
        body: json.encode({'estadoId': nuevoEstadoId}),
      );

      debugPrint('=== DEBUG CAMBIAR ESTADO ===');
      debugPrint('ID Area: $idAreaComun');
      debugPrint('Nuevo estadoId: $nuevoEstadoId');
      debugPrint('Status Code: ${response.statusCode}');
      debugPrint('Response Body: ${response.body}');

      if (response.statusCode == 200) {
        _cargarAreasComunes();
        _mostrarMensaje(
          estaDisponible
              ? 'Área deshabilitada exitosamente'
              : 'Área habilitada exitosamente',
          Colors.green,
        );
      } else {
        _mostrarError('Error al cambiar estado del área');
      }
    } catch (e) {
      _mostrarError('Error de conexión: $e');
    }
  }

  void _mostrarDialogoConfirmacion(
    int idAreaComun,
    String nombreArea,
    bool estaDisponible,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        title: Row(
          children: [
            Icon(
              estaDisponible ? Icons.block : Icons.check_circle,
              color: estaDisponible ? Colors.red : Colors.green,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                estaDisponible ? 'Deshabilitar Área' : 'Habilitar Área',
                style: const TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
        content: Text(
          estaDisponible
              ? '¿Está seguro de deshabilitar "$nombreArea"? No se podrán hacer nuevas reservas.'
              : '¿Está seguro de habilitar "$nombreArea"? Se permitirán nuevas reservas.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _cambiarEstadoArea(idAreaComun, estaDisponible);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: estaDisponible ? Colors.red : Colors.green,
              foregroundColor: Colors.white,
            ),
            child: Text(estaDisponible ? 'Deshabilitar' : 'Habilitar'),
          ),
        ],
      ),
    );
  }

  void _mostrarError(String mensaje) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(mensaje), backgroundColor: Colors.red),
      );
    }
  }

  void _mostrarMensaje(String mensaje, Color color) {
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(mensaje), backgroundColor: color));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        title: const Text('Gestión de Áreas Comunes'),
        elevation: 3,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
          : _areasComunes.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.home_work_outlined, size: 80, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    'No hay áreas comunes registradas',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _cargarAreasComunes,
              color: Colors.orange,
              child: ListView(
                padding: EdgeInsets.all(isSmallScreen ? 12 : 20),
                children: [
                  // Información
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.orange.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.orange.shade700),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Deshabilite áreas cuando se requiera mantenimiento o estén fuera de servicio',
                            style: TextStyle(
                              color: Colors.orange.shade900,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Lista de áreas
                  ..._areasComunes
                      .map((area) => _buildAreaCard(area, isSmallScreen))
                      ,
                ],
              ),
            ),
    );
  }

  Widget _buildAreaCard(dynamic area, bool isSmallScreen) {
    final idAreaComun = area['areaComunId'] ?? area['idAreaComun'];
    final nombreArea = area['nombreArea'] ?? 'Sin nombre';
    final estadoId = area['estadoId'] ?? 0;
    final estaDisponible = estadoId == 4; // 4 = Disponible
    final capacidadMax = area['capacidad'];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: estaDisponible ? Colors.green.shade200 : Colors.red.shade200,
            width: 2,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.home_work,
                      color: Colors.orange.shade700,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nombreArea,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.people_outline,
                              size: 16,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Capacidad: ${capacidadMax ?? 'N/A'}',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Badge de estado
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: estaDisponible
                          ? Colors.green.shade50
                          : Colors.red.shade50,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: estaDisponible ? Colors.green : Colors.red,
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          estaDisponible ? Icons.check_circle : Icons.block,
                          color: estaDisponible ? Colors.green : Colors.red,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          estaDisponible ? 'Disponible' : 'No disponible',
                          style: TextStyle(
                            color: estaDisponible
                                ? Colors.green.shade700
                                : Colors.red.shade700,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Botón de acción
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _mostrarDialogoConfirmacion(
                    idAreaComun,
                    nombreArea,
                    estaDisponible,
                  ),
                  icon: Icon(estaDisponible ? Icons.block : Icons.check_circle),
                  label: Text(
                    estaDisponible ? 'Deshabilitar Área' : 'Habilitar Área',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: estaDisponible ? Colors.red : Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
