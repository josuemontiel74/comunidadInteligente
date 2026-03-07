// ignore_for_file: use_build_context_synchronously
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../parqueaderos/parqueaderos.dart' show SeleccionarParqueaderoScreen;
import '../../utils/helpers.dart';
import '../../utils/api_config.dart';
import '../../utils/validaciones.dart';

class VisitasApiService {
  static String get _baseUrl => ApiConfig.apiUrl;

  static Future<List<dynamic>> obtenerVisitas(String token) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/visitaJoin'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      debugPrint('Error al obtener visitas: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>?> obtenerVisitaPorId(
    String token,
    int idVisita,
  ) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/visita/$idVisita'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['body'];
      }
      return null;
    } catch (e) {
      debugPrint('Error al obtener visita: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>> crearVisita(
    String token,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/visita'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: json.encode(data),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true};
      } else {
        // Intentar parsear el error del backend
        try {
          final errorData = json.decode(response.body);
          final msg = errorData['message'];
          return {
            'success': false,
            'message': msg is String
                ? msg
                : (msg?.toString() ?? 'Error desconocido del servidor'),
          };
        } catch (e) {
          return {
            'success': false,
            'message':
                'Error del servidor (${response.statusCode}): ${response.body}',
          };
        }
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error de conexión: ${e.toString()}',
      };
    }
  }

  static Future<bool> editarVisita(
    String token,
    int idVisita,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await http
          .patch(
            Uri.parse('$_baseUrl/visita/$idVisita'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: json.encode(data),
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error al editar visita: $e');
      return false;
    }
  }

  static Future<bool> finalizarVisita(String token, int idVisita) async {
    try {
      final response = await http
          .patch(
            Uri.parse('$_baseUrl/visitaFinalizar/$idVisita'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<List<dynamic>> obtenerVisitantes(String token) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/visitante'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      debugPrint('Error al obtener visitantes: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>?> obtenerVisitantePorDoc(
    String token,
    String numeroDocumento,
  ) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/visitante/$numeroDocumento'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error al obtener visitante: $e');
      return null;
    }
  }

  static Future<bool> crearVisitante(
    String token,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/visitante'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: json.encode(data),
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      debugPrint('Error al crear visitante: $e');
      return false;
    }
  }

  static Future<bool> editarVisitante(
    String token,
    String numeroDocumento,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await http
          .patch(
            Uri.parse('$_baseUrl/visitante/$numeroDocumento'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: json.encode(data),
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error al editar visitante: $e');
      return false;
    }
  }

  static Future<bool> eliminarVisitante(
    String token,
    String numeroDocumento,
  ) async {
    try {
      final response = await http
          .delete(
            Uri.parse('$_baseUrl/visitante/$numeroDocumento'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      debugPrint('Error al eliminar visitante: $e');
      return false;
    }
  }
}

class HomeScreen extends StatefulWidget {
  final String? token;

  const HomeScreen({super.key, this.token});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    if (widget.token == null) {
      return const TokenErrorWidget();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestión de Visitas'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.local_parking),
            tooltip: 'Ver Parqueaderos',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      SeleccionarParqueaderoScreen(token: widget.token),
                ),
              );
            },
          ),
        ],
      ),
      body: VisitasScreen(token: widget.token!),
    );
  }
}

class TokenErrorWidget extends StatelessWidget {
  const TokenErrorWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text('No se encontró token de autenticación'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Volver'),
            ),
          ],
        ),
      ),
    );
  }
}

class VisitasScreen extends StatefulWidget {
  final String token;
  const VisitasScreen({super.key, required this.token});

  @override
  State<VisitasScreen> createState() => _VisitasScreenState();
}

class _VisitasScreenState extends State<VisitasScreen> {
  List<dynamic> visitas = [];
  List<dynamic> visitasFiltradas = [];
  bool isLoading = true;
  String filtroEstado = 'todos'; // 'todos', 'activa', 'finalizada'
  int paginaActual = 1;
  int totalPaginas = 1;
  final int itemsPorPagina = 10;
  String busquedaNombre = '';
  String? filtroTorre;
  String? filtroApartamento;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargarVisitas();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Método para obtener los apartamentos según la torre seleccionada
  List<DropdownMenuItem<String>> _getApartamentosPorTorre(String torre) {
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

    List<String> apartamentos = apartamentosPorTorre[torre] ?? [];
    return apartamentos.map((apto) {
      return DropdownMenuItem(value: apto, child: Text(apto));
    }).toList();
  }

  Future<void> _cargarVisitas() async {
    setState(() => isLoading = true);
    final data = await VisitasApiService.obtenerVisitas(widget.token);

    setState(() {
      visitas = data;
      _aplicarFiltros();
      isLoading = false;
    });
  }

  void _aplicarFiltros() {
    visitasFiltradas = visitas;

    // Filtrar por estado
    if (filtroEstado != 'todos') {
      visitasFiltradas = visitasFiltradas.where((visita) {
        final estado = visita['estadoVisita']?.toString().toLowerCase() ?? '';
        if (filtroEstado == 'activa') {
          return estado == 'activa' || estado == 'en curso';
        } else if (filtroEstado == 'finalizada') {
          return estado == 'finalizada';
        }
        return true;
      }).toList();
    }

    // Filtrar por torre
    if (filtroTorre != null && filtroTorre!.isNotEmpty) {
      visitasFiltradas = visitasFiltradas.where((visita) {
        final nombreTorre = visita['nombreTorre']?.toString() ?? '';
        return nombreTorre == filtroTorre;
      }).toList();
    }

    // Filtrar por apartamento
    if (filtroApartamento != null && filtroApartamento!.isNotEmpty) {
      visitasFiltradas = visitasFiltradas.where((visita) {
        return visita['numeroApartamento']?.toString() == filtroApartamento;
      }).toList();
    }

    // Filtrar por búsqueda de nombre
    if (busquedaNombre.isNotEmpty) {
      visitasFiltradas = visitasFiltradas.where((visita) {
        final nombre =
            visita['nombreVisitante']?.toString().toLowerCase() ?? '';
        final documento =
            visita['numeroDocumento']?.toString().toLowerCase() ?? '';
        final apartamento =
            visita['numeroApartamento']?.toString().toLowerCase() ?? '';
        final busqueda = busquedaNombre.toLowerCase();
        return nombre.contains(busqueda) ||
            documento.contains(busqueda) ||
            apartamento.contains(busqueda);
      }).toList();
    }

    // Ordenar por fecha de ingreso (más reciente primero)
    visitasFiltradas.sort((a, b) {
      final fechaA = DateTime.tryParse(a['fechaHoraIngreso']?.toString() ?? '');
      final fechaB = DateTime.tryParse(b['fechaHoraIngreso']?.toString() ?? '');
      if (fechaA == null || fechaB == null) return 0;
      return fechaB.compareTo(fechaA);
    });

    // Calcular paginación
    final totalItems = visitasFiltradas.length;
    totalPaginas = (totalItems / itemsPorPagina).ceil();
    if (totalPaginas == 0) totalPaginas = 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    final inicio = (paginaActual - 1) * itemsPorPagina;
    final fin = (inicio + itemsPorPagina).clamp(0, totalItems);
    visitasFiltradas = visitasFiltradas.sublist(
      inicio.clamp(0, totalItems),
      fin,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.green),
      );
    }

    return Scaffold(
      body: Column(
        children: [
          // Sección de filtros y búsqueda
          Container(
            padding: EdgeInsets.all(
              MediaQuery.of(context).size.width < 600 ? 12 : 20,
            ),
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.grey.shade900
                : Colors.grey.shade50,
            child: Column(
              children: [
                // Botón de registrar
                ElevatedButton.icon(
                  onPressed: _mostrarFormularioCrear,
                  icon: const Icon(Icons.add),
                  label: Text(
                    MediaQuery.of(context).size.width < 600
                        ? 'Registrar Visita'
                        : 'Registrar Nueva Visita',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      vertical: MediaQuery.of(context).size.width < 600
                          ? 12
                          : 15,
                      horizontal: 20,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 15),

                // Barra de búsqueda
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Buscar por nombre, documento o apartamento...',
                    prefixIcon: const Icon(Icons.search, color: Colors.green),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: Theme.of(context).cardColor,
                  ),
                  onChanged: (value) {
                    setState(() {
                      busquedaNombre = value;
                      paginaActual = 1;
                      _aplicarFiltros();
                    });
                  },
                ),
                const SizedBox(height: 15),

                // Filtros por torre y apartamento
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: filtroTorre,
                        decoration: InputDecoration(
                          labelText: 'Torre',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Theme.of(context).cardColor,
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: null,
                            child: Text('Todas'),
                          ),
                          ...[
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
                          ].map(
                            (t) => DropdownMenuItem(value: t, child: Text(t)),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            filtroTorre = value;
                            filtroApartamento = null;
                            paginaActual = 1;
                            _aplicarFiltros();
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: filtroApartamento,
                        decoration: InputDecoration(
                          labelText: 'Apartamento',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Theme.of(context).cardColor,
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: null,
                            child: Text('Todos'),
                          ),
                          // Generar apartamentos según la torre seleccionada
                          if (filtroTorre != null)
                            ..._getApartamentosPorTorre(filtroTorre!),
                        ],
                        onChanged: (value) {
                          setState(() {
                            filtroApartamento = value;
                            paginaActual = 1;
                            _aplicarFiltros();
                          });
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 15),

                // Filtros de estado
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      if (MediaQuery.of(context).size.width >= 600)
                        const Padding(
                          padding: EdgeInsets.only(right: 15),
                          child: Text(
                            'Filtrar por estado:',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      _buildFiltroChip('Todas', 'todos'),
                      const SizedBox(width: 10),
                      _buildFiltroChip('Activas', 'activa'),
                      const SizedBox(width: 10),
                      _buildFiltroChip('Finalizadas', 'finalizada'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Lista de visitas
          Expanded(
            child: visitasFiltradas.isEmpty
                ? EmptyStateWidget(
                    icon: Icons.event_busy,
                    message: 'No se encontraron visitas',
                    buttonText: 'Limpiar Filtros',
                    onPressed: () {
                      setState(() {
                        filtroEstado = 'todos';
                        filtroTorre = null;
                        filtroApartamento = null;
                        busquedaNombre = '';
                        _searchController.clear();
                        paginaActual = 1;
                        _aplicarFiltros();
                      });
                    },
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final isMobile = constraints.maxWidth < 800;

                      if (isMobile) {
                        // Vista móvil con cards
                        return ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: visitasFiltradas.length,
                          itemBuilder: (context, index) {
                            final visita = visitasFiltradas[index];
                            return VisitaCard(
                              visita: visita,
                              onVerDetalles: () =>
                                  _verDetalles(context, visita),
                              onEditar: () =>
                                  _mostrarFormularioEditar(context, visita),
                              onFinalizar: () =>
                                  _finalizarVisita(context, visita['idVisita']),
                            );
                          },
                        );
                      } else {
                        // Vista desktop con tabla
                        return SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: SingleChildScrollView(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: DataTable(
                                headingRowColor: WidgetStateProperty.all(
                                  Theme.of(context).brightness ==
                                          Brightness.dark
                                      ? Colors.green.shade800
                                      : Colors.green.shade50,
                                ),
                                columns: const [
                                  DataColumn(
                                    label: Text(
                                      'Visitante',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Documento',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Apartamento',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Torre',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Fecha Ingreso',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Estado',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Acciones',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                                rows: visitasFiltradas.map((visita) {
                                  final esActiva =
                                      visita['estadoVisita']
                                          ?.toString()
                                          .toLowerCase() !=
                                      'finalizada';
                                  final estado =
                                      visita['estadoVisita']?.toString() ??
                                      'N/A';

                                  return DataRow(
                                    cells: [
                                      DataCell(
                                        Text(
                                          visita['nombreVisitante']
                                                  ?.toString() ??
                                              'N/A',
                                        ),
                                      ),
                                      DataCell(
                                        Text(
                                          visita['numeroDocumento']
                                                  ?.toString() ??
                                              'N/A',
                                        ),
                                      ),
                                      DataCell(
                                        Text(
                                          visita['numeroApartamento']
                                                  ?.toString() ??
                                              'N/A',
                                        ),
                                      ),
                                      DataCell(
                                        Text(
                                          visita['nombreTorre']?.toString() ??
                                              'N/A',
                                        ),
                                      ),
                                      DataCell(
                                        Text(
                                          _formatearFechaTabla(
                                            visita['fechaHoraIngreso'],
                                          ),
                                        ),
                                      ),
                                      DataCell(
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: esActiva
                                                ? Colors.green.shade100
                                                : Theme.of(context)
                                                      .colorScheme
                                                      .surfaceContainerHighest,
                                            borderRadius: BorderRadius.circular(
                                              20,
                                            ),
                                          ),
                                          child: Text(
                                            estado,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: esActiva
                                                  ? Colors.green.shade700
                                                  : Theme.of(context)
                                                        .colorScheme
                                                        .onSurface
                                                        .withValues(alpha: 0.7),
                                            ),
                                          ),
                                        ),
                                      ),
                                      DataCell(
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: const Icon(
                                                Icons.visibility,
                                                size: 20,
                                              ),
                                              color: Colors.blue,
                                              onPressed: () =>
                                                  _verDetalles(context, visita),
                                              tooltip: 'Ver Detalles',
                                            ),
                                            if (esActiva) ...[
                                              IconButton(
                                                icon: const Icon(
                                                  Icons.edit,
                                                  size: 20,
                                                ),
                                                color: Colors.orange,
                                                onPressed: () =>
                                                    _mostrarFormularioEditar(
                                                      context,
                                                      visita,
                                                    ),
                                                tooltip: 'Editar',
                                              ),
                                              IconButton(
                                                icon: const Icon(
                                                  Icons.check_circle,
                                                  size: 20,
                                                ),
                                                color: Colors.green,
                                                onPressed: () =>
                                                    _finalizarVisita(
                                                      context,
                                                      visita['idVisita'],
                                                    ),
                                                tooltip: 'Finalizar',
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        );
                      }
                    },
                  ),
          ),

          // Paginación
          if (totalPaginas > 1)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: paginaActual > 1
                        ? () {
                            setState(() {
                              paginaActual--;
                              _aplicarFiltros();
                            });
                          }
                        : null,
                  ),
                  const SizedBox(width: 20),
                  Text(
                    'Página $paginaActual de $totalPaginas',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 20),
                  IconButton(
                    icon: const Icon(Icons.arrow_forward),
                    onPressed: paginaActual < totalPaginas
                        ? () {
                            setState(() {
                              paginaActual++;
                              _aplicarFiltros();
                            });
                          }
                        : null,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _formatearFechaTabla(dynamic fecha) {
    if (fecha == null) return 'N/A';
    try {
      final dt = parsearFechaDesdeBackend(fecha.toString());
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return fecha.toString();
    }
  }

  Widget _buildFiltroChip(String label, String valor) {
    final bool seleccionado = filtroEstado == valor;
    return FilterChip(
      label: Text(label),
      selected: seleccionado,
      onSelected: (bool selected) {
        setState(() {
          filtroEstado = valor;
          paginaActual = 1;
          _aplicarFiltros();
        });
      },
      selectedColor: Colors.green,
      labelStyle: TextStyle(
        color: seleccionado
            ? Colors.white
            : Theme.of(context).colorScheme.onSurface,
        fontWeight: seleccionado ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  void _verDetalles(BuildContext context, dynamic visita) {
    showDialog(
      context: context,
      builder: (context) => DetallesVisitaDialog(visita: visita),
    );
  }

  void _mostrarFormularioCrear() {
    showDialog(
      context: context,
      builder: (context) =>
          CrearVisitaDialog(token: widget.token, onSuccess: _cargarVisitas),
    );
  }

  void _mostrarFormularioEditar(BuildContext context, dynamic visita) {
    showDialog(
      context: context,
      builder: (context) => EditarVisitaDialog(
        token: widget.token,
        visita: visita,
        onSuccess: _cargarVisitas,
      ),
    );
  }

  Future<void> _finalizarVisita(BuildContext context, int idVisita) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => const ConfirmarDialog(
        titulo: 'Confirmar',
        mensaje: '¿Finalizar esta visita?',
        textoBoton: 'Finalizar',
      ),
    );

    if (confirmar == true) {
      final success = await VisitasApiService.finalizarVisita(
        widget.token,
        idVisita,
      );
      if (success && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Visita finalizada exitosamente')),
        );
        _cargarVisitas();
      }
    }
  }
}

class VisitantesScreen extends StatefulWidget {
  final String token;
  const VisitantesScreen({super.key, required this.token});

  @override
  State<VisitantesScreen> createState() => _VisitantesScreenState();
}

class _VisitantesScreenState extends State<VisitantesScreen> {
  List<dynamic> visitantes = [];
  List<dynamic> visitantesFiltrados = [];
  bool isLoading = true;
  String busquedaNombre = '';
  int paginaActual = 1;
  int totalPaginas = 1;
  final int itemsPorPagina = 10;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargarVisitantes();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _cargarVisitantes() async {
    setState(() => isLoading = true);
    final data = await VisitasApiService.obtenerVisitantes(widget.token);
    setState(() {
      visitantes = data;
      _aplicarFiltros();
      isLoading = false;
    });
  }

  void _aplicarFiltros() {
    visitantesFiltrados = visitantes;

    // Filtrar por búsqueda
    if (busquedaNombre.isNotEmpty) {
      visitantesFiltrados = visitantesFiltrados.where((visitante) {
        final nombre =
            visitante['nombreVisitante']?.toString().toLowerCase() ?? '';
        final documento =
            visitante['numeroDocumento']?.toString().toLowerCase() ?? '';
        final busqueda = busquedaNombre.toLowerCase();
        return nombre.contains(busqueda) || documento.contains(busqueda);
      }).toList();
    }

    // Ordenar alfabéticamente
    visitantesFiltrados.sort((a, b) {
      final nombreA = a['nombreVisitante']?.toString().toLowerCase() ?? '';
      final nombreB = b['nombreVisitante']?.toString().toLowerCase() ?? '';
      return nombreA.compareTo(nombreB);
    });

    // Calcular paginación
    final totalItems = visitantesFiltrados.length;
    totalPaginas = (totalItems / itemsPorPagina).ceil();
    if (totalPaginas == 0) totalPaginas = 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    final inicio = (paginaActual - 1) * itemsPorPagina;
    final fin = (inicio + itemsPorPagina).clamp(0, totalItems);
    visitantesFiltrados = visitantesFiltrados.sublist(
      inicio.clamp(0, totalItems),
      fin,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.green),
      );
    }

    return Scaffold(
      body: Column(
        children: [
          // Sección de búsqueda
          Container(
            padding: EdgeInsets.all(
              MediaQuery.of(context).size.width < 600 ? 12 : 20,
            ),
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.grey.shade900
                : Colors.grey.shade50,
            child: Column(
              children: [
                // Botón de registrar
                ElevatedButton.icon(
                  onPressed: _mostrarFormularioCrear,
                  icon: const Icon(Icons.add),
                  label: Text(
                    MediaQuery.of(context).size.width < 600
                        ? 'Registrar Visitante'
                        : 'Registrar Nuevo Visitante',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      vertical: MediaQuery.of(context).size.width < 600
                          ? 12
                          : 15,
                      horizontal: 20,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 15),

                // Barra de búsqueda
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Buscar por nombre o documento...',
                    prefixIcon: const Icon(Icons.search, color: Colors.green),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: Theme.of(context).cardColor,
                  ),
                  onChanged: (value) {
                    setState(() {
                      busquedaNombre = value;
                      paginaActual = 1;
                      _aplicarFiltros();
                    });
                  },
                ),
              ],
            ),
          ),

          // Lista de visitantes
          Expanded(
            child: visitantesFiltrados.isEmpty
                ? EmptyStateWidget(
                    icon: Icons.people_outline,
                    message: 'No se encontraron visitantes',
                    buttonText: 'Limpiar Búsqueda',
                    onPressed: () {
                      setState(() {
                        busquedaNombre = '';
                        _searchController.clear();
                        paginaActual = 1;
                        _aplicarFiltros();
                      });
                    },
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final isMobile = constraints.maxWidth < 800;

                      if (isMobile) {
                        // Vista móvil con cards
                        return ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: visitantesFiltrados.length,
                          itemBuilder: (context, index) {
                            final visitante = visitantesFiltrados[index];
                            return VisitanteCard(
                              visitante: visitante,
                              onEditar: () =>
                                  _mostrarFormularioEditar(context, visitante),
                              onEliminar: () => _confirmarEliminar(
                                context,
                                visitante['numeroDocumento'],
                                visitante['nombreVisitante'],
                              ),
                            );
                          },
                        );
                      } else {
                        // Vista desktop con tabla
                        return SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: SingleChildScrollView(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: DataTable(
                                headingRowColor: WidgetStateProperty.all(
                                  Theme.of(context).brightness ==
                                          Brightness.dark
                                      ? Colors.green.shade800
                                      : Colors.green.shade50,
                                ),
                                columns: const [
                                  DataColumn(
                                    label: Text(
                                      'Nombre',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Documento',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Tipo Documento',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  DataColumn(
                                    label: Text(
                                      'Acciones',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                                rows: visitantesFiltrados.map((visitante) {
                                  return DataRow(
                                    cells: [
                                      DataCell(
                                        Text(
                                          visitante['nombreVisitante']
                                                  ?.toString() ??
                                              'N/A',
                                        ),
                                      ),
                                      DataCell(
                                        Text(
                                          visitante['numeroDocumento']
                                                  ?.toString() ??
                                              'N/A',
                                        ),
                                      ),
                                      DataCell(
                                        Text(
                                          visitante['tipoDocumentoId']
                                                  ?.toString() ??
                                              'N/A',
                                        ),
                                      ),
                                      DataCell(
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: const Icon(
                                                Icons.edit,
                                                size: 20,
                                              ),
                                              color: Colors.orange,
                                              onPressed: () =>
                                                  _mostrarFormularioEditar(
                                                    context,
                                                    visitante,
                                                  ),
                                              tooltip: 'Editar',
                                            ),
                                            IconButton(
                                              icon: const Icon(
                                                Icons.delete,
                                                size: 20,
                                              ),
                                              color: Colors.red,
                                              onPressed: () => _confirmarEliminar(
                                                context,
                                                visitante['numeroDocumento'],
                                                visitante['nombreVisitante'],
                                              ),
                                              tooltip: 'Eliminar',
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        );
                      }
                    },
                  ),
          ),

          // Paginación
          if (totalPaginas > 1)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: paginaActual > 1
                        ? () {
                            setState(() {
                              paginaActual--;
                              _aplicarFiltros();
                            });
                          }
                        : null,
                  ),
                  const SizedBox(width: 20),
                  Text(
                    'Página $paginaActual de $totalPaginas',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 20),
                  IconButton(
                    icon: const Icon(Icons.arrow_forward),
                    onPressed: paginaActual < totalPaginas
                        ? () {
                            setState(() {
                              paginaActual++;
                              _aplicarFiltros();
                            });
                          }
                        : null,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _mostrarFormularioCrear() {
    showDialog(
      context: context,
      builder: (context) => CrearVisitanteDialog(
        token: widget.token,
        onSuccess: _cargarVisitantes,
      ),
    );
  }

  void _mostrarFormularioEditar(BuildContext context, dynamic visitante) {
    showDialog(
      context: context,
      builder: (context) => EditarVisitanteDialog(
        token: widget.token,
        visitante: visitante,
        onSuccess: _cargarVisitantes,
      ),
    );
  }

  Future<void> _confirmarEliminar(
    BuildContext context,
    String numeroDocumento,
    String nombre,
  ) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => ConfirmarDialog(
        titulo: 'Confirmar',
        mensaje: '¿Eliminar a $nombre?',
        textoBoton: 'Eliminar',
        colorBoton: Colors.red,
      ),
    );

    if (confirmar == true) {
      final success = await VisitasApiService.eliminarVisitante(
        widget.token,
        numeroDocumento,
      );
      if (success && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Visitante eliminado exitosamente')),
        );
        _cargarVisitantes();
      }
    }
  }
}

// Empty State Widget
class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String message;
  final String buttonText;
  final VoidCallback onPressed;

  const EmptyStateWidget({
    super.key,
    required this.icon,
    required this.message,
    required this.buttonText,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(message),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: onPressed, child: Text(buttonText)),
        ],
      ),
    );
  }
}

// Visita Card
class VisitaCard extends StatelessWidget {
  final dynamic visita;
  final VoidCallback onVerDetalles;
  final VoidCallback onEditar;
  final VoidCallback onFinalizar;

  const VisitaCard({
    super.key,
    required this.visita,
    required this.onVerDetalles,
    required this.onEditar,
    required this.onFinalizar,
  });

  @override
  Widget build(BuildContext context) {
    final esActiva =
        visita['estadoVisita']?.toString().toLowerCase() != 'finalizada';
    final estado = visita['estadoVisita']?.toString() ?? 'N/A';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header con nombre y estado
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    visita['nombreVisitante']?.toString() ?? 'N/A',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: esActiva
                        ? Colors.green.shade100
                        : Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    estado,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: esActiva
                          ? Colors.green.shade700
                          : Theme.of(
                              context,
                            ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Apartamento
            Row(
              children: [
                Icon(
                  Icons.home,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  'Apto: ${visita['numeroApartamento']} - Torre: ${visita['nombreTorre'] ?? 'N/A'}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Documento
            Row(
              children: [
                Icon(
                  Icons.badge,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  'Doc: ${visita['numeroDocumento']}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Fecha de ingreso
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  'Ingreso: ${_formatearFecha(visita['fechaHoraIngreso'])}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),

            // Botones de acción
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: onVerDetalles,
                  icon: const Icon(Icons.visibility, size: 18),
                  label: const Text('Ver'),
                  style: TextButton.styleFrom(foregroundColor: Colors.blue),
                ),
                if (esActiva) ...[
                  TextButton.icon(
                    onPressed: onEditar,
                    icon: const Icon(Icons.edit, size: 18),
                    label: const Text('Editar'),
                    style: TextButton.styleFrom(foregroundColor: Colors.orange),
                  ),
                  TextButton.icon(
                    onPressed: onFinalizar,
                    icon: const Icon(Icons.check_circle, size: 18),
                    label: const Text('Finalizar'),
                    style: TextButton.styleFrom(foregroundColor: Colors.green),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatearFecha(dynamic fecha) {
    if (fecha == null) return 'N/A';
    try {
      final dt = parsearFechaDesdeBackend(fecha.toString());
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return fecha.toString();
    }
  }
}

// Visitante Card
class VisitanteCard extends StatelessWidget {
  final dynamic visitante;
  final VoidCallback onEditar;
  final VoidCallback onEliminar;

  const VisitanteCard({
    super.key,
    required this.visitante,
    required this.onEditar,
    required this.onEliminar,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: Colors.green.shade100,
          child: Icon(Icons.person, color: Colors.green.shade700),
        ),
        title: Text(
          visitante['nombreVisitante'] ?? 'N/A',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            'Doc: ${visitante['numeroDocumento']}',
            style: TextStyle(
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.6),
              fontSize: 14,
            ),
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              color: Colors.orange,
              onPressed: onEditar,
              tooltip: 'Editar',
            ),
            IconButton(
              icon: const Icon(Icons.delete, size: 20),
              color: Colors.red,
              onPressed: onEliminar,
              tooltip: 'Eliminar',
            ),
          ],
        ),
      ),
    );
  }
}

// Confirmar Dialog
class ConfirmarDialog extends StatelessWidget {
  final String titulo;
  final String mensaje;
  final String textoBoton;
  final Color? colorBoton;

  const ConfirmarDialog({
    super.key,
    required this.titulo,
    required this.mensaje,
    required this.textoBoton,
    this.colorBoton,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(titulo),
      content: Text(mensaje),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          style: colorBoton != null
              ? ElevatedButton.styleFrom(backgroundColor: colorBoton)
              : null,
          child: Text(textoBoton),
        ),
      ],
    );
  }
}

// Detalles Visita Dialog
class DetallesVisitaDialog extends StatelessWidget {
  final dynamic visita;

  const DetallesVisitaDialog({super.key, required this.visita});

  String _formatearFechaHora(String? fechaStr) {
    if (fechaStr == null || fechaStr.isEmpty) return 'N/A';
    try {
      // Parsear para validar, pero usar las funciones de formato directamente
      parsearFechaDesdeBackend(fechaStr);
      return '${formatearFechaParaMostrar(fechaStr)} ${formatearHoraParaMostrar(fechaStr)}';
    } catch (e) {
      return fechaStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Visita #${visita['idVisita']}'),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildInfoRow('Visitante', visita['nombreVisitante'] ?? 'N/A'),
            _buildInfoRow('Documento', visita['numeroDocumento']),
            _buildInfoRow('Apartamento', visita['numeroApartamento']),
            _buildInfoRow('Torre', visita['nombreTorre']),
            _buildInfoRow('Estado', visita['estadoVisita']),
            _buildInfoRow(
              'Ingreso',
              _formatearFechaHora(visita['fechaHoraIngreso']),
            ),
            if (visita['fechaHoraSalida'] != null)
              _buildInfoRow(
                'Salida',
                _formatearFechaHora(visita['fechaHoraSalida']),
              ),
            if (visita['matricula'] != null)
              _buildInfoRow(
                'Vehículo',
                '${visita['matricula']} - ${visita['nombreVehiculo'] ?? ''}',
              ),
            if (visita['observaciones'] != null)
              _buildInfoRow('Observaciones', visita['observaciones']),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cerrar'),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text('$label: $value'),
    );
  }
}

// Crear Visita Dialog
class CrearVisitaDialog extends StatefulWidget {
  final String token;
  final VoidCallback onSuccess;

  const CrearVisitaDialog({
    super.key,
    required this.token,
    required this.onSuccess,
  });

  @override
  State<CrearVisitaDialog> createState() => _CrearVisitaDialogState();
}

class _CrearVisitaDialogState extends State<CrearVisitaDialog> {
  final _formKey = GlobalKey<FormState>();
  final numeroDocumentoController = TextEditingController();
  final nombreVisitanteController = TextEditingController();
  final observacionesController = TextEditingController();
  final matriculaController = TextEditingController();

  String? tipoDocumentoId;
  String? torreSeleccionada;
  String? apartamentoSeleccionado;
  int? apartamentoId;
  DateTime? fechaHoraIngreso;
  TimeOfDay? horaIngreso;
  bool traeVehiculo = false;
  String? tipoVehiculoId;
  String? codigoParqueadero;

  List<Map<String, dynamic>> tiposDocumento = [];

  final List<String> torres = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
  ];

  // Mapeo de Torre-Apartamento a ID (mismo que en áreas comunes)
  final Map<String, Map<String, int>> apartamentosConId = {
    'A': {'101': 1, '102': 2, '103': 3, '104': 4, '105': 5},
    'B': {'201': 6, '202': 7, '203': 8, '204': 9, '205': 10},
    'C': {'301': 11, '302': 12, '303': 13, '304': 14, '305': 15},
    'D': {'401': 16, '402': 17, '403': 18, '404': 19, '405': 20},
    'E': {'501': 21, '502': 22, '503': 23, '504': 24, '505': 25},
    'F': {'601': 26, '602': 27, '603': 28, '604': 29, '605': 30},
    'G': {'701': 31, '702': 32, '703': 33, '704': 34, '705': 35},
    'H': {'801': 36, '802': 37, '803': 38, '804': 39, '805': 40},
    'I': {'901': 41, '902': 42, '903': 43, '904': 44, '905': 45},
    'J': {'1001': 46, '1002': 47, '1003': 48, '1004': 49, '1005': 50},
  };

  Map<String, List<String>> get apartamentosPorTorre => {
    'A': ['101', '102', '103', '104', '105'],
    'B': ['201', '202', '203', '204', '205'],
    'C': ['301', '302', '303', '304', '305'],
    'D': ['401', '402', '403', '404', '405'],
    'E': ['501', '502', '503', '504', '505'],
    'F': ['601', '602', '603', '604', '605'],
    'G': ['701', '702', '703', '704', '705'],
    'H': ['801', '802', '803', '804', '805'],
    'I': ['901', '902', '903', '904', '905'],
    'J': ['1001', '1002', '1003', '1004', '1005'],
  };

  @override
  void initState() {
    super.initState();
    // Inicializar fecha y hora actual
    fechaHoraIngreso = DateTime.now();
    horaIngreso = TimeOfDay.now();
    _cargarTiposDocumento();
  }

  Future<void> _cargarTiposDocumento() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/documento'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['body'] != null) {
          final List<Map<String, dynamic>> loadedData =
              List<Map<String, dynamic>>.from(data['body']);

          setState(() {
            tiposDocumento = loadedData;

            // Validar que el tipoDocumentoId actual existe en la lista
            if (tipoDocumentoId != null && tipoDocumentoId!.isNotEmpty) {
              final existe = tiposDocumento.any(
                (tipo) => tipo['idTipoDocumento'].toString() == tipoDocumentoId,
              );

              if (!existe) {
                tipoDocumentoId = null;
              }
            }
          });
        }
      }
    } catch (e) {
      // Silently ignored
    }
  }

  @override
  void dispose() {
    numeroDocumentoController.dispose();
    nombreVisitanteController.dispose();
    observacionesController.dispose();
    matriculaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Colors.green),
    );

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: 600,
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Scaffold(
            body: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(color: Colors.green),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          "Registrar Nueva Visita",
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                // Contenido
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Datos del visitante",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Builder(
                            builder: (context) {
                              return DropdownButtonFormField<String>(
                                initialValue: tiposDocumento.isEmpty
                                    ? null
                                    : (tipoDocumentoId != null &&
                                              tiposDocumento.any(
                                                (t) =>
                                                    t['idTipoDocumento']
                                                        .toString() ==
                                                    tipoDocumentoId,
                                              )
                                          ? tipoDocumentoId
                                          : null),
                                decoration: InputDecoration(
                                  labelText: "Tipo de documento *",
                                  border: border,
                                  prefixIcon: const Icon(
                                    Icons.assignment,
                                    color: Colors.green,
                                  ),
                                ),
                                items: tiposDocumento.isEmpty
                                    ? null
                                    : tiposDocumento.map((tipo) {
                                        final id = tipo['idTipoDocumento']
                                            .toString();
                                        final nombre =
                                            tipo['nombreDocumento'] ?? '';
                                        return DropdownMenuItem(
                                          value: id,
                                          child: Text(nombre),
                                        );
                                      }).toList(),
                                hint: const Text(
                                  'Seleccione tipo de documento',
                                ),
                                onChanged: (value) {
                                  setState(() {
                                    tipoDocumentoId = value;
                                    // Limpiar documento al cambiar tipo
                                    numeroDocumentoController.clear();
                                  });
                                },
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Seleccione un tipo de documento';
                                  }
                                  return null;
                                },
                              );
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            key: ValueKey('doc_$tipoDocumentoId'),
                            controller: numeroDocumentoController,
                            decoration: InputDecoration(
                              labelText: "Número de documento *",
                              border: border,
                              prefixIcon: const Icon(
                                Icons.badge,
                                color: Colors.green,
                              ),
                              helperText:
                                  int.tryParse(tipoDocumentoId ?? '') == 2
                                  ? 'Alfanumérico, máx 2 letras (Pasaporte)'
                                  : 'Solo números',
                            ),
                            keyboardType:
                                int.tryParse(tipoDocumentoId ?? '') == 2
                                ? TextInputType.text
                                : TextInputType.number,
                            maxLength: 20,
                            inputFormatters: [
                              getDocumentoFormatter(
                                int.tryParse(tipoDocumentoId ?? ''),
                              ),
                              LengthLimitingTextInputFormatter(20),
                            ],
                            validator: (value) {
                              return validarDocumento(
                                value,
                                int.tryParse(tipoDocumentoId ?? ''),
                              );
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: nombreVisitanteController,
                            decoration: InputDecoration(
                              labelText: "Nombre completo *",
                              border: border,
                              prefixIcon: const Icon(
                                Icons.person,
                                color: Colors.green,
                              ),
                              helperText: 'Mín 10 caracteres, máx 100',
                            ),
                            maxLength: 100,
                            inputFormatters: [NombreInputFormatter()],
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'El nombre es requerido';
                              }
                              if (value.length < 10) {
                                return 'El nombre debe tener al menos 10 caracteres';
                              }
                              if (value.length > 100) {
                                return 'El nombre no puede exceder 100 caracteres';
                              }
                              // Validar que tenga al menos letras
                              if (!RegExp(
                                r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]',
                              ).hasMatch(value)) {
                                return 'El nombre debe contener letras';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            "Destino de la visita",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: torreSeleccionada,
                            decoration: InputDecoration(
                              labelText: 'Torre *',
                              border: border,
                              prefixIcon: const Icon(
                                Icons.apartment,
                                color: Colors.green,
                              ),
                            ),
                            items: torres.map((torre) {
                              return DropdownMenuItem(
                                value: torre,
                                child: Text('Torre $torre'),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() {
                                torreSeleccionada = value;
                                apartamentoSeleccionado = null;
                                apartamentoId = null;
                              });
                            },
                            validator: (value) {
                              if (value == null) {
                                return 'Seleccione una torre';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            initialValue: apartamentoSeleccionado,
                            decoration: InputDecoration(
                              labelText: 'Apartamento *',
                              border: border,
                              prefixIcon: const Icon(
                                Icons.home,
                                color: Colors.green,
                              ),
                            ),
                            items: torreSeleccionada != null
                                ? apartamentosPorTorre[torreSeleccionada]!.map((
                                    apt,
                                  ) {
                                    return DropdownMenuItem(
                                      value: apt,
                                      child: Text('Apartamento $apt'),
                                    );
                                  }).toList()
                                : [],
                            onChanged: (value) {
                              setState(() {
                                apartamentoSeleccionado = value;
                                if (torreSeleccionada != null &&
                                    value != null) {
                                  apartamentoId =
                                      apartamentosConId[torreSeleccionada]![value];
                                }
                              });
                            },
                            validator: (value) {
                              if (value == null) {
                                return 'Seleccione un apartamento';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            "Información de la visita",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            readOnly: true,
                            decoration: InputDecoration(
                              labelText: "Fecha de ingreso *",
                              border: border,
                              prefixIcon: const Icon(
                                Icons.calendar_today,
                                color: Colors.green,
                              ),
                            ),
                            controller: TextEditingController(
                              text: fechaHoraIngreso != null
                                  ? "${fechaHoraIngreso!.day.toString().padLeft(2, '0')}/${fechaHoraIngreso!.month.toString().padLeft(2, '0')}/${fechaHoraIngreso!.year}"
                                  : "",
                            ),
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: fechaHoraIngreso ?? DateTime.now(),
                                firstDate: DateTime.now().subtract(
                                  const Duration(days: 1),
                                ),
                                lastDate: DateTime.now().add(
                                  const Duration(days: 30),
                                ),
                              );
                              if (picked != null) {
                                setState(() => fechaHoraIngreso = picked);
                              }
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            readOnly: true,
                            decoration: InputDecoration(
                              labelText: "Hora de ingreso *",
                              border: border,
                              prefixIcon: const Icon(
                                Icons.access_time,
                                color: Colors.green,
                              ),
                            ),
                            controller: TextEditingController(
                              text: horaIngreso?.format(context) ?? "",
                            ),
                            onTap: () async {
                              final picked = await showTimePicker(
                                context: context,
                                initialTime: horaIngreso ?? TimeOfDay.now(),
                                builder: (BuildContext context, Widget? child) {
                                  return Theme(
                                    data: Theme.of(context).copyWith(
                                      timePickerTheme: TimePickerThemeData(
                                        hourMinuteTextStyle: const TextStyle(
                                          fontSize: 48,
                                        ),
                                      ),
                                    ),
                                    child: MediaQuery(
                                      data: MediaQuery.of(
                                        context,
                                      ).copyWith(alwaysUse24HourFormat: false),
                                      child: child!,
                                    ),
                                  );
                                },
                              );
                              if (picked != null) {
                                setState(() => horaIngreso = picked);
                              }
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: observacionesController,
                            decoration: InputDecoration(
                              labelText: "Observaciones",
                              border: border,
                              prefixIcon: const Icon(
                                Icons.notes,
                                color: Colors.green,
                              ),
                              helperText: 'Máximo 255 caracteres',
                            ),
                            maxLines: 3,
                            maxLength: 255,
                            validator: (value) {
                              if (value != null && value.length > 255) {
                                return 'Máximo 255 caracteres';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 24),
                          CheckboxListTile(
                            title: const Text(
                              "¿Trae vehículo?",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            value: traeVehiculo,
                            activeColor: Colors.green,
                            onChanged: (value) {
                              setState(() {
                                traeVehiculo = value ?? false;
                                if (!traeVehiculo) {
                                  tipoVehiculoId = null;
                                  matriculaController.clear();
                                  codigoParqueadero = null;
                                }
                              });
                            },
                          ),
                          if (traeVehiculo) ...[
                            const SizedBox(height: 16),
                            const Text(
                              "Información del vehículo",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            DropdownButtonFormField<String>(
                              initialValue: tipoVehiculoId,
                              decoration: InputDecoration(
                                labelText: 'Tipo de vehículo *',
                                border: border,
                                prefixIcon: const Icon(
                                  Icons.directions_car,
                                  color: Colors.green,
                                ),
                              ),
                              items: const [
                                DropdownMenuItem(
                                  value: "1",
                                  child: Text("Carro"),
                                ),
                                DropdownMenuItem(
                                  value: "2",
                                  child: Text("Moto"),
                                ),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  tipoVehiculoId = value;
                                  // Reset parqueadero al cambiar tipo de vehículo
                                  codigoParqueadero = null;
                                });
                              },
                              validator: (value) {
                                if (traeVehiculo && value == null) {
                                  return 'Seleccione el tipo de vehículo';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: matriculaController,
                              decoration: InputDecoration(
                                labelText: "Matrícula/Placa *",
                                border: border,
                                prefixIcon: const Icon(
                                  Icons.confirmation_number,
                                  color: Colors.green,
                                ),
                                helperText:
                                    'Solo letras y números, 6-10 caracteres',
                              ),
                              textCapitalization: TextCapitalization.characters,
                              maxLength: 10,
                              inputFormatters: [
                                FilteringTextInputFormatter.allow(
                                  RegExp(r'[a-zA-Z0-9]'),
                                ),
                                LengthLimitingTextInputFormatter(10),
                              ],
                              validator: (value) {
                                if (traeVehiculo &&
                                    (value == null || value.isEmpty)) {
                                  return 'La matrícula es requerida';
                                }
                                if (traeVehiculo && value != null) {
                                  if (!RegExp(
                                    r'^[a-zA-Z0-9]+$',
                                  ).hasMatch(value)) {
                                    return 'Solo se permiten letras y números';
                                  }
                                  if (value.length < 6) {
                                    return 'Mínimo 6 caracteres';
                                  }
                                  if (value.length > 10) {
                                    return 'Máximo 10 caracteres';
                                  }
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 12),
                            // Selector de parqueadero
                            InkWell(
                              onTap: tipoVehiculoId != null
                                  ? () async {
                                      final codigo = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              SeleccionarParqueaderoScreen(
                                                token: widget.token,
                                                tipoVehiculoId: int.parse(
                                                  tipoVehiculoId!,
                                                ),
                                              ),
                                        ),
                                      );
                                      if (codigo != null) {
                                        setState(() {
                                          codigoParqueadero = codigo;
                                        });
                                      }
                                    }
                                  : null,
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: tipoVehiculoId != null
                                        ? Colors.green
                                        : Theme.of(context).colorScheme.outline,
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                  color: tipoVehiculoId != null
                                      ? Theme.of(context).cardColor
                                      : Theme.of(
                                          context,
                                        ).colorScheme.surfaceContainerHighest,
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.local_parking,
                                      color: tipoVehiculoId != null
                                          ? Colors.green
                                          : Theme.of(
                                              context,
                                            ).colorScheme.outline,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            "Espacio de parqueadero *",
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .onSurface
                                                  .withValues(alpha: 0.6),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            codigoParqueadero != null &&
                                                    codigoParqueadero!
                                                        .isNotEmpty
                                                ? "Espacio elegido: $codigoParqueadero"
                                                : tipoVehiculoId != null
                                                ? "Toca para seleccionar"
                                                : "Selecciona el tipo de vehículo primero",
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight:
                                                  codigoParqueadero != null &&
                                                      codigoParqueadero!
                                                          .isNotEmpty
                                                  ? FontWeight.bold
                                                  : FontWeight.normal,
                                              color:
                                                  codigoParqueadero != null &&
                                                      codigoParqueadero!
                                                          .isNotEmpty
                                                  ? Colors.green[900]
                                                  : Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (tipoVehiculoId != null)
                                      const Icon(
                                        Icons.arrow_forward_ios,
                                        size: 16,
                                        color: Colors.green,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            if (traeVehiculo &&
                                (codigoParqueadero == null ||
                                    codigoParqueadero!.isEmpty))
                              Padding(
                                padding: const EdgeInsets.only(
                                  left: 16,
                                  top: 8,
                                ),
                                child: Text(
                                  'El parqueadero es requerido',
                                  style: TextStyle(
                                    color: Colors.red[700],
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                          ],
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              onPressed: _crearVisita,
                              child: const Text(
                                "Registrar Visita",
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _crearVisita() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (fechaHoraIngreso == null || horaIngreso == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe seleccionar fecha y hora de ingreso'),
        ),
      );
      return;
    }

    // Validar parqueadero si trae vehículo
    if (traeVehiculo &&
        (codigoParqueadero == null || codigoParqueadero!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe seleccionar un espacio de parqueadero'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Construir fecha y hora en formato 24h: "2025-10-03 14:30"
    final fecha = fechaHoraIngreso!;
    final hora = horaIngreso!;
    // TimeOfDay.hour ya está en formato 24 horas (0-23)
    final hora24 = hora.hour;

    final fechaHoraFormateada =
        "${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')} "
        "${hora24.toString().padLeft(2, '0')}:${hora.minute.toString().padLeft(2, '0')}";

    final data = {
      'numeroDocumento': numeroDocumentoController.text,
      'nombreVisitante': nombreVisitanteController.text,
      'tipoDocumentoId': int.parse(tipoDocumentoId!),
      'apartamentoId': apartamentoId!,
      'fechaHoraIngreso': fechaHoraFormateada,
      'observaciones': observacionesController.text.isEmpty
          ? null
          : observacionesController.text,
    };

    // Agregar campos opcionales de vehículo si trae vehículo
    if (traeVehiculo) {
      data['matricula'] = matriculaController.text.trim().toUpperCase();
      data['tipoVehiculoId'] = int.parse(tipoVehiculoId!);
      data['codigoParqueadero'] = codigoParqueadero;
    }

    debugPrint('Datos visita a enviar: $data');

    final result = await VisitasApiService.crearVisita(widget.token, data);

    if (!context.mounted) return;

    if (result['success'] == true) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Visita registrada exitosamente'),
          backgroundColor: Colors.green,
        ),
      );
      widget.onSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['message']?.toString() ?? 'Error al registrar la visita',
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }
}

// Editar Visita Dialog
class EditarVisitaDialog extends StatefulWidget {
  final String token;
  final dynamic visita;
  final VoidCallback onSuccess;

  const EditarVisitaDialog({
    super.key,
    required this.token,
    required this.visita,
    required this.onSuccess,
  });

  @override
  State<EditarVisitaDialog> createState() => _EditarVisitaDialogState();
}

class _EditarVisitaDialogState extends State<EditarVisitaDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController numeroDocumentoController;
  late final TextEditingController nombreVisitanteController;
  late final TextEditingController observacionesController;
  late final TextEditingController matriculaController;

  String? tipoDocumentoId;
  String? torreSeleccionada;
  String? apartamentoSeleccionado;
  int? apartamentoId;
  DateTime? fechaHoraIngreso;
  TimeOfDay? horaIngreso;
  bool traeVehiculo = false;
  String? tipoVehiculoId;
  String? codigoParqueadero;

  List<Map<String, dynamic>> tiposDocumento = [];

  final Map<String, List<String>> apartamentosPorTorre = {
    'A': ['101', '102', '103', '104', '105'],
    'B': ['201', '202', '203', '204', '205'],
    'C': ['301', '302', '303', '304', '305'],
    'D': ['401', '402', '403', '404', '405'],
    'E': ['501', '502', '503', '504', '505'],
    'F': ['601', '602', '603', '604', '605'],
    'G': ['701', '702', '703', '704', '705'],
    'H': ['801', '802', '803', '804', '805'],
    'I': ['901', '902', '903', '904', '905'],
    'J': ['1001', '1002', '1003', '1004', '1005'],
  };

  final Map<String, Map<String, int>> apartamentosConId = {
    'A': {'101': 1, '102': 2, '103': 3, '104': 4, '105': 5},
    'B': {'201': 6, '202': 7, '203': 8, '204': 9, '205': 10},
    'C': {'301': 11, '302': 12, '303': 13, '304': 14, '305': 15},
    'D': {'401': 16, '402': 17, '403': 18, '404': 19, '405': 20},
    'E': {'501': 21, '502': 22, '503': 23, '504': 24, '505': 25},
    'F': {'601': 26, '602': 27, '603': 28, '604': 29, '605': 30},
    'G': {'701': 31, '702': 32, '703': 33, '704': 34, '705': 35},
    'H': {'801': 36, '802': 37, '803': 38, '804': 39, '805': 40},
    'I': {'901': 41, '902': 42, '903': 43, '904': 44, '905': 45},
    'J': {'1001': 46, '1002': 47, '1003': 48, '1004': 49, '1005': 50},
  };

  @override
  void initState() {
    super.initState();
    _inicializarDatos();
    _cargarTiposDocumento();
  }

  Future<void> _cargarTiposDocumento() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/documento'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['body'] != null) {
          final List<Map<String, dynamic>> loadedData =
              List<Map<String, dynamic>>.from(data['body']);

          setState(() {
            tiposDocumento = loadedData;

            // Validar que el tipoDocumentoId actual existe en la lista
            if (tipoDocumentoId != null && tipoDocumentoId!.isNotEmpty) {
              final existe = tiposDocumento.any(
                (tipo) => tipo['idTipoDocumento'].toString() == tipoDocumentoId,
              );

              if (!existe) {
                tipoDocumentoId = null;
              }
            }
          });
        }
      }
    } catch (e) {
      // Silently ignored
    }
  }

  void _inicializarDatos() {
    final visita = widget.visita;

    numeroDocumentoController = TextEditingController(
      text: visita['numeroDocumento']?.toString() ?? '',
    );
    nombreVisitanteController = TextEditingController(
      text: visita['nombreVisitante']?.toString() ?? '',
    );
    observacionesController = TextEditingController(
      text: visita['observaciones']?.toString() ?? '',
    );
    matriculaController = TextEditingController(
      text: visita['matricula']?.toString() ?? '',
    );

    tipoDocumentoId = visita['tipoDocumentoId']?.toString();
    apartamentoId = visita['apartamentoId'];

    // Parsear fecha y hora
    if (visita['fechaHoraIngreso'] != null) {
      try {
        final fechaStr = visita['fechaHoraIngreso'].toString();

        // Formato esperado: "2025-12-08 10:40 PM" o "2025-12-08T22:40:00"
        if (fechaStr.contains('T')) {
          // Formato ISO
          final dateTime = parsearFechaDesdeBackend(fechaStr);
          fechaHoraIngreso = dateTime;
          horaIngreso = TimeOfDay(hour: dateTime.hour, minute: dateTime.minute);
        } else {
          // Formato personalizado: "2025-12-08 10:40 PM"
          final partes = fechaStr.split(' ');
          if (partes.length >= 3) {
            final fecha = partes[0].split('-');
            final hora = partes[1].split(':');
            final periodo = partes[2].toUpperCase();

            int hour = int.parse(hora[0]);
            final minute = int.parse(hora[1]);

            if (periodo == 'PM' && hour != 12) hour += 12;
            if (periodo == 'AM' && hour == 12) hour = 0;

            fechaHoraIngreso = DateTime(
              int.parse(fecha[0]),
              int.parse(fecha[1]),
              int.parse(fecha[2]),
            );
            horaIngreso = TimeOfDay(hour: hour, minute: minute);
          }
        }
      } catch (e) {
        // Establecer valores por defecto para que no quede nulo
        fechaHoraIngreso = DateTime.now();
        horaIngreso = TimeOfDay.now();
      }
    } else {
      // Establecer valores por defecto
      fechaHoraIngreso = DateTime.now();
      horaIngreso = TimeOfDay.now();
    }

    // Determinar torre y apartamento del apartamentoId
    if (apartamentoId != null) {
      for (var torre in apartamentosConId.keys) {
        final apts = apartamentosConId[torre]!;
        for (var entry in apts.entries) {
          if (entry.value == apartamentoId) {
            torreSeleccionada = torre;
            apartamentoSeleccionado = entry.key;
            break;
          }
        }
        if (torreSeleccionada != null) break;
      }
    }

    // Datos de vehículo
    traeVehiculo =
        visita['matricula'] != null &&
        visita['matricula'].toString().isNotEmpty;
    tipoVehiculoId = visita['tipoVehiculoId']?.toString();
    codigoParqueadero = visita['codigoParqueadero']?.toString();
  }

  @override
  void dispose() {
    numeroDocumentoController.dispose();
    nombreVisitanteController.dispose();
    observacionesController.dispose();
    matriculaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: isSmallScreen ? MediaQuery.of(context).size.width * 0.95 : 600,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Scaffold(
            appBar: AppBar(
              title: Text(
                'Editar Visita #${widget.visita['idVisita']}',
                style: const TextStyle(fontSize: 18),
                overflow: TextOverflow.ellipsis,
              ),
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              automaticallyImplyLeading: false,
              actions: [
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            body: Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: EdgeInsets.all(isSmallScreen ? 16 : 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSeccionTitulo('Información del Visitante'),
                    const SizedBox(height: 12),
                    _buildDropdown(
                      label: 'Tipo de Documento *',
                      value: tiposDocumento.isEmpty
                          ? null
                          : (tipoDocumentoId != null &&
                                    tiposDocumento.any(
                                      (t) =>
                                          t['idTipoDocumento'].toString() ==
                                          tipoDocumentoId,
                                    )
                                ? tipoDocumentoId
                                : null),
                      icono: Icons.credit_card,
                      items: tiposDocumento.isEmpty
                          ? []
                          : tiposDocumento.map((tipo) {
                              return DropdownMenuItem(
                                value: tipo['idTipoDocumento'].toString(),
                                child: Text(tipo['nombreDocumento'] ?? ''),
                              );
                            }).toList(),
                      onChanged: (value) {
                        setState(() {
                          tipoDocumentoId = value;
                          // Limpiar documento al cambiar tipo
                          numeroDocumentoController.clear();
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _buildCampoTexto(
                      controller: numeroDocumentoController,
                      label: 'Número de Documento *',
                      icono: Icons.badge,
                      keyboardType: int.tryParse(tipoDocumentoId ?? '') == 2
                          ? TextInputType.text
                          : TextInputType.number,
                      maxLength: 20,
                      helperText: int.tryParse(tipoDocumentoId ?? '') == 2
                          ? 'Alfanumérico, máx 2 letras (Pasaporte)'
                          : 'Solo números',
                      inputFormatters: [
                        getDocumentoFormatter(
                          int.tryParse(tipoDocumentoId ?? ''),
                        ),
                        LengthLimitingTextInputFormatter(20),
                      ],
                      customValidator: (value) {
                        return validarDocumento(
                          value,
                          int.tryParse(tipoDocumentoId ?? ''),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    _buildCampoTexto(
                      controller: nombreVisitanteController,
                      label: 'Nombre del Visitante *',
                      icono: Icons.person,
                      maxLength: 100,
                      helperText: 'Mín 10 caracteres, máx 100',
                      inputFormatters: [NombreInputFormatter()],
                      customValidator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'El nombre es requerido';
                        }
                        if (value.length < 10) {
                          return 'El nombre debe tener al menos 10 caracteres';
                        }
                        if (value.length > 100) {
                          return 'El nombre no puede exceder 100 caracteres';
                        }
                        if (!RegExp(r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]').hasMatch(value)) {
                          return 'El nombre debe contener letras';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    _buildSeccionTitulo('Destino'),
                    const SizedBox(height: 12),
                    _buildDropdown(
                      label: 'Torre *',
                      value: torreSeleccionada,
                      icono: Icons.apartment,
                      items: apartamentosPorTorre.keys.map((torre) {
                        return DropdownMenuItem(
                          value: torre,
                          child: Text('Torre $torre'),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          torreSeleccionada = value;
                          apartamentoSeleccionado = null;
                          apartamentoId = null;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _buildDropdown(
                      label: 'Apartamento *',
                      value: apartamentoSeleccionado,
                      icono: Icons.home,
                      items: torreSeleccionada != null
                          ? apartamentosPorTorre[torreSeleccionada]!.map((apt) {
                              return DropdownMenuItem(
                                value: apt,
                                child: Text('Apartamento $apt'),
                              );
                            }).toList()
                          : [],
                      onChanged: (value) {
                        setState(() {
                          apartamentoSeleccionado = value;
                          if (torreSeleccionada != null && value != null) {
                            apartamentoId =
                                apartamentosConId[torreSeleccionada]![value];
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 24),
                    _buildSeccionTitulo('Información de la Visita'),
                    const SizedBox(height: 12),
                    _buildDateTimePicker(),
                    const SizedBox(height: 12),
                    _buildCampoTexto(
                      controller: observacionesController,
                      label: 'Observaciones',
                      icono: Icons.note,
                      maxLineas: 3,
                      maxLength: 255,
                      helperText: 'Máximo 255 caracteres',
                      requerido: false,
                      customValidator: (value) {
                        if (value != null && value.length > 255) {
                          return 'Máximo 255 caracteres';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    _buildSeccionTitulo('Información del Vehículo'),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      title: const Text('¿Trae vehículo?'),
                      value: traeVehiculo,
                      onChanged: (value) {
                        setState(() {
                          traeVehiculo = value ?? false;
                          if (!traeVehiculo) {
                            tipoVehiculoId = null;
                            matriculaController.clear();
                            codigoParqueadero = null;
                          }
                        });
                      },
                      activeColor: Colors.green,
                    ),
                    if (traeVehiculo) ...[
                      const SizedBox(height: 12),
                      _buildDropdown(
                        label: 'Tipo de Vehículo *',
                        value: tipoVehiculoId,
                        icono: Icons.directions_car,
                        items: [
                          DropdownMenuItem(value: '1', child: Text('Carro')),
                          DropdownMenuItem(value: '2', child: Text('Moto')),
                        ],
                        onChanged: (value) {
                          setState(() {
                            tipoVehiculoId = value;
                            codigoParqueadero = null;
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildCampoTexto(
                        controller: matriculaController,
                        label: 'Matrícula *',
                        icono: Icons.local_parking,
                        maxLength: 10,
                        helperText: 'Solo letras y números, 6-10 caracteres',
                        textCapitalization: TextCapitalization.characters,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                            RegExp(r'[a-zA-Z0-9]'),
                          ),
                          LengthLimitingTextInputFormatter(10),
                        ],
                        customValidator: (value) {
                          if (traeVehiculo &&
                              (value == null || value.isEmpty)) {
                            return 'La matrícula es requerida';
                          }
                          if (traeVehiculo && value != null) {
                            if (!RegExp(r'^[a-zA-Z0-9]+$').hasMatch(value)) {
                              return 'Solo se permiten letras y números';
                            }
                            if (value.length < 6) {
                              return 'Mínimo 6 caracteres';
                            }
                            if (value.length > 10) {
                              return 'Máximo 10 caracteres';
                            }
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildParqueaderoSelector(),
                    ],
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _editarVisita,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Guardar Cambios',
                          style: TextStyle(fontSize: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSeccionTitulo(String titulo) {
    return Text(
      titulo,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Colors.green,
      ),
    );
  }

  Widget _buildCampoTexto({
    required TextEditingController controller,
    required String label,
    required IconData icono,
    TextInputType? keyboardType,
    int maxLineas = 1,
    int? maxLength,
    bool requerido = true,
    String? helperText,
    String? Function(String?)? customValidator,
    List<TextInputFormatter>? inputFormatters,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLineas,
      maxLength: maxLength,
      inputFormatters: inputFormatters,
      textCapitalization: textCapitalization,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icono, color: Colors.green),
        helperText: helperText,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Colors.green, width: 2),
        ),
      ),
      validator:
          customValidator ??
          (requerido
              ? (value) {
                  if (value == null || value.isEmpty) {
                    return 'Este campo es obligatorio';
                  }
                  return null;
                }
              : null),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required IconData icono,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icono, color: Colors.green),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Colors.green, width: 2),
        ),
      ),
      items: items.isEmpty
          ? null
          : items.map((item) {
              return DropdownMenuItem<String>(
                value: item.value,
                child: SizedBox(
                  width: 200,
                  child: Text(
                    item.child is Text
                        ? (item.child as Text).data ?? ''
                        : item.child.toString(),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              );
            }).toList(),
      hint: items.isEmpty ? const Text('Cargando...') : null,
      onChanged: onChanged,
      validator: (value) {
        if (value == null) {
          return 'Seleccione una opción';
        }
        return null;
      },
    );
  }

  Widget _buildDateTimePicker() {
    return Column(
      children: [
        InkWell(
          onTap: () async {
            final fecha = await showDatePicker(
              context: context,
              initialDate: fechaHoraIngreso ?? DateTime.now(),
              firstDate: DateTime(2020),
              lastDate: DateTime(2030),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: const ColorScheme.light(primary: Colors.green),
                  ),
                  child: child!,
                );
              },
            );
            if (fecha != null) {
              setState(() => fechaHoraIngreso = fecha);
            }
          },
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Fecha de Ingreso *',
              prefixIcon: const Icon(Icons.calendar_today, color: Colors.green),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(
              fechaHoraIngreso != null
                  ? '${fechaHoraIngreso!.day}/${fechaHoraIngreso!.month}/${fechaHoraIngreso!.year}'
                  : 'Seleccione una fecha',
            ),
          ),
        ),
        const SizedBox(height: 12),
        InkWell(
          onTap: () async {
            final hora = await showTimePicker(
              context: context,
              initialTime: horaIngreso ?? TimeOfDay.now(),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    timePickerTheme: TimePickerThemeData(
                      hourMinuteTextStyle: const TextStyle(fontSize: 48),
                    ),
                    colorScheme: const ColorScheme.light(primary: Colors.green),
                  ),
                  child: MediaQuery(
                    data: MediaQuery.of(
                      context,
                    ).copyWith(alwaysUse24HourFormat: false),
                    child: child!,
                  ),
                );
              },
            );
            if (hora != null) {
              setState(() => horaIngreso = hora);
            }
          },
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Hora de Ingreso *',
              prefixIcon: const Icon(Icons.access_time, color: Colors.green),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(
              horaIngreso != null
                  ? horaIngreso!.format(context)
                  : 'Seleccione una hora',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildParqueaderoSelector() {
    return InkWell(
      onTap: tipoVehiculoId != null
          ? () async {
              final resultado = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SeleccionarParqueaderoScreen(
                    token: widget.token,
                    tipoVehiculoId: int.parse(tipoVehiculoId!),
                  ),
                ),
              );
              if (resultado != null) {
                setState(() => codigoParqueadero = resultado);
              }
            }
          : null,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: 'Espacio de Parqueadero *',
          prefixIcon: const Icon(Icons.local_parking, color: Colors.green),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(
              color: tipoVehiculoId == null
                  ? Theme.of(context).colorScheme.outline
                  : Colors.green,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Colors.green, width: 2),
          ),
          errorText:
              traeVehiculo &&
                  (codigoParqueadero == null || codigoParqueadero!.isEmpty)
              ? 'Debe seleccionar un espacio'
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              codigoParqueadero != null && codigoParqueadero!.isNotEmpty
                  ? 'Espacio elegido: $codigoParqueadero'
                  : 'Toca para seleccionar',
              style: TextStyle(
                color: tipoVehiculoId == null
                    ? Theme.of(context).colorScheme.outline
                    : Theme.of(context).colorScheme.onSurface,
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: tipoVehiculoId == null
                  ? Theme.of(context).colorScheme.outline
                  : Colors.green,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _editarVisita() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (fechaHoraIngreso == null || horaIngreso == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe seleccionar fecha y hora de ingreso'),
        ),
      );
      return;
    }

    if (traeVehiculo &&
        (codigoParqueadero == null || codigoParqueadero!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe seleccionar un espacio de parqueadero'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Construir fecha y hora en formato 24h: "2025-10-03 14:30"
    final fecha = fechaHoraIngreso!;
    final hora = horaIngreso!;
    // TimeOfDay.hour ya está en formato 24 horas (0-23)
    final hora24 = hora.hour;

    final fechaHoraFormateada =
        "${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')} "
        "${hora24.toString().padLeft(2, '0')}:${hora.minute.toString().padLeft(2, '0')}";

    final data = {
      'numeroDocumento': numeroDocumentoController.text,
      'nombreVisitante': nombreVisitanteController.text,
      'tipoDocumentoId': int.parse(tipoDocumentoId!),
      'apartamentoId': apartamentoId!,
      'fechaHoraIngreso': fechaHoraFormateada,
      'observaciones': observacionesController.text.isEmpty
          ? null
          : observacionesController.text,
    };

    if (traeVehiculo) {
      data['matricula'] = matriculaController.text.trim().toUpperCase();
      data['tipoVehiculoId'] = int.parse(tipoVehiculoId!);
      data['codigoParqueadero'] = codigoParqueadero;
    } else {
      // Si no trae vehículo, enviar null para limpiar los campos
      data['matricula'] = null;
      data['tipoVehiculoId'] = null;
      data['codigoParqueadero'] = null;
    }

    debugPrint('Datos visita editar a enviar: $data');

    Navigator.pop(context);

    final success = await VisitasApiService.editarVisita(
      widget.token,
      widget.visita['idVisita'],
      data,
    );

    if (!context.mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Visita actualizada exitosamente'),
          backgroundColor: Colors.green,
        ),
      );
      widget.onSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error al actualizar la visita'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

// Crear Visitante Dialog
class CrearVisitanteDialog extends StatefulWidget {
  final String token;
  final VoidCallback onSuccess;

  const CrearVisitanteDialog({
    super.key,
    required this.token,
    required this.onSuccess,
  });

  @override
  State<CrearVisitanteDialog> createState() => _CrearVisitanteDialogState();
}

class _CrearVisitanteDialogState extends State<CrearVisitanteDialog> {
  final docController = TextEditingController();
  final nombreController = TextEditingController();

  @override
  void dispose() {
    docController.dispose();
    nombreController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Nuevo Visitante'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: docController,
            decoration: const InputDecoration(labelText: 'Documento *'),
            keyboardType: TextInputType.number,
          ),
          TextField(
            controller: nombreController,
            decoration: const InputDecoration(labelText: 'Nombre *'),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(onPressed: _crearVisitante, child: const Text('Crear')),
      ],
    );
  }

  Future<void> _crearVisitante() async {
    if (docController.text.isEmpty || nombreController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete todos los campos')),
      );
      return;
    }

    Navigator.pop(context);

    final success = await VisitasApiService.crearVisitante(widget.token, {
      'numeroDocumento': docController.text,
      'nombreVisitante': nombreController.text,
      'tipoDocumentoId': 1,
    });

    if (!context.mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Visitante creado exitosamente')),
      );
      widget.onSuccess();
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Error al crear visitante')));
    }
  }
}

// Editar Visitante Dialog
class EditarVisitanteDialog extends StatefulWidget {
  final String token;
  final dynamic visitante;
  final VoidCallback onSuccess;

  const EditarVisitanteDialog({
    super.key,
    required this.token,
    required this.visitante,
    required this.onSuccess,
  });

  @override
  State<EditarVisitanteDialog> createState() => _EditarVisitanteDialogState();
}

class _EditarVisitanteDialogState extends State<EditarVisitanteDialog> {
  late final TextEditingController nombreController;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    nombreController = TextEditingController(
      text: widget.visitante['nombreVisitante'],
    );
  }

  @override
  void dispose() {
    nombreController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Editar Visitante'),
      content: Form(
        key: _formKey,
        child: TextFormField(
          controller: nombreController,
          decoration: const InputDecoration(
            labelText: 'Nombre',
            helperText: 'Solo letras, espacios y guiones',
          ),
          maxLength: 100,
          inputFormatters: [NombreInputFormatter()],
          validator: (value) => validarNombreCompleto(value),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              _editarVisitante();
            }
          },
          child: const Text('Guardar'),
        ),
      ],
    );
  }

  Future<void> _editarVisitante() async {
    Navigator.pop(context);

    final success = await VisitasApiService.editarVisitante(
      widget.token,
      widget.visitante['numeroDocumento'],
      {
        'nombreVisitante': nombreController.text,
        'tipoDocumentoId': widget.visitante['tipoDocumentoId'],
      },
    );

    if (!context.mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Visitante actualizado exitosamente')),
      );
      widget.onSuccess();
    }
  }
}
