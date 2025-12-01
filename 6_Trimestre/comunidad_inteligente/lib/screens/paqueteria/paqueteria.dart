import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../main.dart';

class ModuloPaqueteria extends StatefulWidget {
  final bool abrirModalRegistro;

  const ModuloPaqueteria({super.key, this.abrirModalRegistro = false});

  @override
  State<ModuloPaqueteria> createState() => _ModuloPaqueteriaState();
}

class _ModuloPaqueteriaState extends State<ModuloPaqueteria> {
  List<dynamic> paquetes = [];
  bool isLoading = true;
  String filtroEstado = 'todos'; // 'todos', 'recibido', 'entregado'
  int paginaActual = 1;
  int totalPaginas = 1;
  final int itemsPorPagina = 10;

  @override
  void initState() {
    super.initState();
    _cargarPaquetes();

    // Si se debe abrir el modal automáticamente
    if (widget.abrirModalRegistro) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _mostrarFormularioRegistro();
        }
      });
    }
  }

  Future<void> _cargarPaquetes() async {
    setState(() {
      isLoading = true;
    });

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      // Cargar todos los paquetes sin filtro en el backend
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/recepcionPaquetes'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final datos = json.decode(response.body);
        print('Respuesta completa del GET: $datos'); // Debug
        print('Estructura de datos: ${datos.keys}'); // Debug

        // Intentar diferentes estructuras de respuesta
        List<dynamic> todosPaquetes = [];
        if (datos['body'] != null && datos['body'] is List) {
          todosPaquetes = datos['body'];
        } else if (datos['paquetes'] != null) {
          todosPaquetes = datos['paquetes'];
        } else if (datos['data'] != null) {
          if (datos['data'] is List) {
            todosPaquetes = datos['data'];
          } else if (datos['data']['paquetes'] != null) {
            todosPaquetes = datos['data']['paquetes'];
          }
        } else if (datos['recepcionPaquetes'] != null) {
          todosPaquetes = datos['recepcionPaquetes'];
        }

        print('Total paquetes recibidos: ${todosPaquetes.length}'); // Debug

        // Filtrar por estado en el frontend
        List<dynamic> paquetesFiltrados = todosPaquetes;
        if (filtroEstado != 'todos') {
          paquetesFiltrados = todosPaquetes.where((paquete) {
            final estadoNombre = paquete['estado']?['nombreEstado']
                ?.toString()
                .toLowerCase();
            print(
              'Estado del paquete: $estadoNombre vs filtro: $filtroEstado',
            ); // Debug
            return estadoNombre == filtroEstado;
          }).toList();
        }

        print(
          'Paquetes después del filtro: ${paquetesFiltrados.length}',
        ); // Debug

        // Ordenar por fecha de más reciente a más viejo
        paquetesFiltrados.sort((a, b) {
          final fechaA = DateTime.tryParse(
            a['fechaRecepcion']?.toString() ?? '',
          );
          final fechaB = DateTime.tryParse(
            b['fechaRecepcion']?.toString() ?? '',
          );
          if (fechaA == null || fechaB == null) return 0;
          return fechaB.compareTo(fechaA); // Orden descendente
        });

        // Implementar paginación manual
        final totalItems = paquetesFiltrados.length;
        final totalPags = (totalItems / itemsPorPagina).ceil();
        final inicio = (paginaActual - 1) * itemsPorPagina;
        final fin = (inicio + itemsPorPagina).clamp(0, totalItems);

        final paquetesPaginados = paquetesFiltrados.sublist(
          inicio.clamp(0, totalItems),
          fin,
        );

        setState(() {
          paquetes = paquetesPaginados;
          totalPaginas = totalPags > 0 ? totalPags : 1;
          isLoading = false;
        });
      } else {
        print(
          'Error al cargar: ${response.statusCode} - ${response.body}',
        ); // Debug
        setState(() {
          isLoading = false;
        });
      }
    } catch (error) {
      print('Error en _cargarPaquetes: $error'); // Debug
      setState(() {
        isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al cargar paquetes: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _mostrarFormularioRegistro() {
    showDialog(
      context: context,
      builder: (context) => FormularioRegistroPaquete(
        onPaqueteRegistrado: () {
          _cargarPaquetes();
        },
      ),
    );
  }

  void _mostrarDetalles(dynamic paquete) {
    showDialog(
      context: context,
      builder: (context) => DetallesPaquete(paquete: paquete),
    );
  }

  void _mostrarFormularioEdicion(dynamic paquete) {
    showDialog(
      context: context,
      builder: (context) => FormularioEditarPaquete(
        paquete: paquete,
        onPaqueteEditado: () {
          _cargarPaquetes();
        },
      ),
    );
  }

  Future<void> _marcarComoEntregado(dynamic paquete) async {
    try {
      final headers = {'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final idPaquete = paquete['idPaquete'];
      print(
        'Intentando marcar como entregado el paquete ID: $idPaquete',
      ); // Debug

      final response = await http.delete(
        Uri.parse('${LoginServe.baseUrl}/api/recepcionPaquetes/$idPaquete'),
        headers: headers,
      );

      print('Status Code: ${response.statusCode}'); // Debug
      print('Response Body: ${response.body}'); // Debug

      if (response.statusCode == 200 || response.statusCode == 204) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Paquete marcado como entregado'),
              backgroundColor: Colors.green,
            ),
          );
          _cargarPaquetes();
        }
      } else {
        throw Exception('Error ${response.statusCode}: ${response.body}');
      }
    } catch (error) {
      print('Error al marcar como entregado: $error'); // Debug
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error: ${error.toString().replaceAll('Exception: ', '')}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // Layout de cards para móvil
  Widget _buildCardLayout() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: paquetes.length,
      itemBuilder: (context, index) {
        final paquete = paquetes[index];
        final bool esEntregado =
            paquete['estado']?['nombreEstado'] == 'entregado';

        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          elevation: 3,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
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
                        paquete['nombreDestinatario']?.toString() ?? '',
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
                        color: esEntregado
                            ? Colors.green.shade100
                            : Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        esEntregado ? 'Entregado' : 'Recibido',
                        style: TextStyle(
                          color: esEntregado
                              ? Colors.green.shade700
                              : Colors.orange.shade700,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Información del apartamento
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.apartment,
                        color: Colors.blue.shade700,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Torre ${paquete['apartamento']?['torresId']?.toString() ?? ''} - Apto ${paquete['apartamento']?['numeroApartamento']?.toString() ?? ''}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Transportadora
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.local_shipping,
                        color: Colors.green.shade700,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        paquete['empresaMensajeria']?.toString() ?? '',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Fecha
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.calendar_today,
                        color: Colors.orange.shade700,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      paquete['fechaRecepcion']?.toString().substring(0, 10) ??
                          '',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Botones de acción
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _mostrarDetalles(paquete),
                        icon: const Icon(Icons.info_outline, size: 18),
                        label: const Text('Detalles'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.blue,
                          side: const BorderSide(color: Colors.blue),
                        ),
                      ),
                    ),
                    if (!esEntregado) ...[
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _mostrarFormularioEdicion(paquete),
                          icon: const Icon(Icons.edit, size: 18),
                          label: const Text('Editar'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.orange,
                            side: const BorderSide(color: Colors.orange),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _marcarComoEntregado(paquete),
                          icon: const Icon(Icons.check_circle, size: 18),
                          label: const Text('Entregar'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Layout de tabla para desktop
  Widget _buildTableLayout() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(Colors.blue.shade50),
          columns: const [
            DataColumn(
              label: Text(
                'Residente',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
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
                'Transportadora',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            DataColumn(
              label: Text(
                'Fecha',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            DataColumn(
              label: Text(
                'Estado',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            DataColumn(
              label: Text(
                'Acciones',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
          rows: paquetes.map((paquete) {
            final bool esEntregado =
                paquete['estado']?['nombreEstado'] == 'entregado';
            return DataRow(
              cells: [
                DataCell(Text(paquete['nombreDestinatario']?.toString() ?? '')),
                DataCell(
                  Text(paquete['apartamento']?['torresId']?.toString() ?? ''),
                ),
                DataCell(
                  Text(
                    paquete['apartamento']?['numeroApartamento']?.toString() ??
                        '',
                  ),
                ),
                DataCell(Text(paquete['empresaMensajeria']?.toString() ?? '')),
                DataCell(
                  Text(
                    paquete['fechaRecepcion']?.toString().substring(0, 10) ??
                        '',
                  ),
                ),
                DataCell(
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: esEntregado
                          ? Colors.green.shade100
                          : Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      esEntregado ? 'Entregado' : 'Recibido',
                      style: TextStyle(
                        color: esEntregado
                            ? Colors.green.shade700
                            : Colors.orange.shade700,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                DataCell(
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.info_outline),
                        color: Colors.blue,
                        onPressed: () => _mostrarDetalles(paquete),
                        tooltip: 'Ver detalles',
                      ),
                      if (!esEntregado) ...[
                        IconButton(
                          icon: const Icon(Icons.edit),
                          color: Colors.orange,
                          onPressed: () => _mostrarFormularioEdicion(paquete),
                          tooltip: 'Editar',
                        ),
                        IconButton(
                          icon: const Icon(Icons.check_circle),
                          color: Colors.green,
                          onPressed: () => _marcarComoEntregado(paquete),
                          tooltip: 'Marcar como entregado',
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
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        title: const Text('Gestión de Paquetería'),
        elevation: 3,
      ),
      body: Column(
        children: [
          // Filtros y botón de registro
          Container(
            padding: EdgeInsets.all(
              MediaQuery.of(context).size.width < 600 ? 12 : 20,
            ),
            color: Colors.grey.shade50,
            child: Column(
              children: [
                ElevatedButton.icon(
                  onPressed: _mostrarFormularioRegistro,
                  icon: const Icon(Icons.add),
                  label: Text(
                    MediaQuery.of(context).size.width < 600
                        ? 'Registrar Paquete'
                        : 'Registrar Nuevo Paquete',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
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
                // Filtros
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
                      _buildFiltroChip('Todos', 'todos'),
                      const SizedBox(width: 10),
                      _buildFiltroChip('Recibidos', 'recibido'),
                      const SizedBox(width: 10),
                      _buildFiltroChip('Entregados', 'entregado'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Tabla de paquetes o Cards según el ancho de pantalla
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : paquetes.isEmpty
                ? const Center(
                    child: Text(
                      'No hay paquetes registrados',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  )
                : MediaQuery.of(context).size.width < 600
                ? _buildCardLayout()
                : _buildTableLayout(),
          ),
          // Paginación
          if (!isLoading && paquetes.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: paginaActual > 1
                        ? () {
                            setState(() {
                              paginaActual--;
                            });
                            _cargarPaquetes();
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
                            });
                            _cargarPaquetes();
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

  Widget _buildFiltroChip(String label, String valor) {
    final bool seleccionado = filtroEstado == valor;
    return FilterChip(
      label: Text(label),
      selected: seleccionado,
      onSelected: (bool selected) {
        setState(() {
          filtroEstado = valor;
          paginaActual = 1;
        });
        _cargarPaquetes();
      },
      selectedColor: Colors.blue,
      labelStyle: TextStyle(
        color: seleccionado ? Colors.white : Colors.black,
        fontWeight: seleccionado ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }
}

// Formulario de registro de paquete
class FormularioRegistroPaquete extends StatefulWidget {
  final VoidCallback onPaqueteRegistrado;

  const FormularioRegistroPaquete({
    super.key,
    required this.onPaqueteRegistrado,
  });

  @override
  State<FormularioRegistroPaquete> createState() =>
      _FormularioRegistroPaqueteState();
}

class _FormularioRegistroPaqueteState extends State<FormularioRegistroPaquete> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController residenteController = TextEditingController();
  final TextEditingController transportadoraController =
      TextEditingController();
  final TextEditingController observacionesController = TextEditingController();

  String? torreSeleccionada;
  String? apartamentoSeleccionado;
  int? apartamentoIdSeleccionado;
  DateTime fechaSeleccionada = DateTime.now();
  TimeOfDay horaSeleccionada = TimeOfDay.now();

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

  // Mapeo de Torre-Apartamento a ID
  Map<String, Map<String, int>> apartamentosConId = {
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

  Map<String, List<String>> apartamentosPorTorre = {
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

  bool isSubmitting = false;

  Future<void> _registrarPaquete() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      isSubmitting = true;
    });

    try {
      // Combinar fecha y hora - asegurar que no sea anterior a la actual
      DateTime fechaHora = DateTime(
        fechaSeleccionada.year,
        fechaSeleccionada.month,
        fechaSeleccionada.day,
        horaSeleccionada.hour,
        horaSeleccionada.minute,
      );

      // Si la fecha seleccionada es anterior a ahora, usar la fecha/hora actual
      final ahora = DateTime.now();
      if (fechaHora.isBefore(ahora)) {
        fechaHora = ahora;
      }

      final body = {
        'apartamentoId': apartamentoIdSeleccionado,
        'nombreDestinatario': residenteController.text.trim(),
        'empresaMensajeria': transportadoraController.text.trim(),
        'fechaRecepcion': fechaHora.toIso8601String(),
      };

      // Solo agregar observaciones si no está vacío
      if (observacionesController.text.trim().isNotEmpty) {
        body['observaciones'] = observacionesController.text.trim();
      }

      print('Enviando datos: ${json.encode(body)}'); // Debug

      final headers = {'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final response = await http.post(
        Uri.parse('${LoginServe.baseUrl}/api/recepcionPaquetes'),
        headers: headers,
        body: json.encode(body),
      );

      print('Status Code: ${response.statusCode}'); // Debug
      print('Response Body: ${response.body}'); // Debug

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Paquete registrado exitosamente'),
              backgroundColor: Colors.green,
            ),
          );
          widget.onPaqueteRegistrado();
        }
      } else {
        // Mostrar mensaje de error del servidor
        final errorMsg = response.body.isNotEmpty
            ? json.decode(response.body)['message'] ?? response.body
            : 'Error al registrar paquete';
        throw Exception(errorMsg);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error: ${error.toString().replaceAll('Exception: ', '')}',
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: isSmallScreen ? MediaQuery.of(context).size.width * 0.9 : 600,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        padding: EdgeInsets.all(isSmallScreen ? 20 : 30),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Registrar Nuevo Paquete',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Residente
                TextFormField(
                  controller: residenteController,
                  decoration: InputDecoration(
                    labelText: 'Nombre del Residente *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.person),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Este campo es obligatorio';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 15),
                // Torre
                DropdownButtonFormField<String>(
                  value: torreSeleccionada,
                  decoration: InputDecoration(
                    labelText: 'Torre *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.apartment),
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
                      apartamentoIdSeleccionado = null;
                    });
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Seleccione una torre';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 15),
                // Apartamento
                DropdownButtonFormField<String>(
                  value: apartamentoSeleccionado,
                  decoration: InputDecoration(
                    labelText: 'Apartamento *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.home),
                  ),
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
                        apartamentoIdSeleccionado =
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
                const SizedBox(height: 15),
                // Transportadora
                TextFormField(
                  controller: transportadoraController,
                  decoration: InputDecoration(
                    labelText: 'Transportadora *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.local_shipping),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Este campo es obligatorio';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 15),
                // Fecha y Hora
                MediaQuery.of(context).size.width < 600
                    ? Column(
                        children: [
                          InkWell(
                            onTap: () async {
                              final fecha = await showDatePicker(
                                context: context,
                                initialDate: fechaSeleccionada,
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2030),
                              );
                              if (fecha != null) {
                                setState(() {
                                  fechaSeleccionada = fecha;
                                });
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: 'Fecha',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                prefixIcon: const Icon(Icons.calendar_today),
                              ),
                              child: Text(
                                '${fechaSeleccionada.day}/${fechaSeleccionada.month}/${fechaSeleccionada.year}',
                              ),
                            ),
                          ),
                          const SizedBox(height: 15),
                          InkWell(
                            onTap: () async {
                              final hora = await showTimePicker(
                                context: context,
                                initialTime: horaSeleccionada,
                              );
                              if (hora != null) {
                                setState(() {
                                  horaSeleccionada = hora;
                                });
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: 'Hora',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                prefixIcon: const Icon(Icons.access_time),
                              ),
                              child: Text(
                                '${horaSeleccionada.hour.toString().padLeft(2, '0')}:${horaSeleccionada.minute.toString().padLeft(2, '0')}',
                              ),
                            ),
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final fecha = await showDatePicker(
                                  context: context,
                                  initialDate: fechaSeleccionada,
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2030),
                                );
                                if (fecha != null) {
                                  setState(() {
                                    fechaSeleccionada = fecha;
                                  });
                                }
                              },
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  labelText: 'Fecha',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  prefixIcon: const Icon(Icons.calendar_today),
                                ),
                                child: Text(
                                  '${fechaSeleccionada.day}/${fechaSeleccionada.month}/${fechaSeleccionada.year}',
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final hora = await showTimePicker(
                                  context: context,
                                  initialTime: horaSeleccionada,
                                );
                                if (hora != null) {
                                  setState(() {
                                    horaSeleccionada = hora;
                                  });
                                }
                              },
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  labelText: 'Hora',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  prefixIcon: const Icon(Icons.access_time),
                                ),
                                child: Text(
                                  '${horaSeleccionada.hour.toString().padLeft(2, '0')}:${horaSeleccionada.minute.toString().padLeft(2, '0')}',
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                const SizedBox(height: 15),
                // Observaciones
                TextFormField(
                  controller: observacionesController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Observaciones',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.note),
                  ),
                ),
                const SizedBox(height: 25),
                // Botón de registro
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isSubmitting ? null : _registrarPaquete,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'Registrar Paquete',
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
    );
  }
}

// Formulario de edición de paquete
class FormularioEditarPaquete extends StatefulWidget {
  final dynamic paquete;
  final VoidCallback onPaqueteEditado;

  const FormularioEditarPaquete({
    super.key,
    required this.paquete,
    required this.onPaqueteEditado,
  });

  @override
  State<FormularioEditarPaquete> createState() =>
      _FormularioEditarPaqueteState();
}

class _FormularioEditarPaqueteState extends State<FormularioEditarPaquete> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController residenteController;
  late TextEditingController transportadoraController;
  late TextEditingController observacionesController;

  String? torreSeleccionada;
  String? apartamentoSeleccionado;
  int? apartamentoIdSeleccionado;
  late DateTime fechaSeleccionada;
  late TimeOfDay horaSeleccionada;

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

  // Mapeo de Torre-Apartamento a ID
  Map<String, Map<String, int>> apartamentosConId = {
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

  Map<String, List<String>> apartamentosPorTorre = {
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

  bool isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Inicializar controladores con datos del paquete
    residenteController = TextEditingController(
      text: widget.paquete['nombreDestinatario']?.toString() ?? '',
    );
    transportadoraController = TextEditingController(
      text: widget.paquete['empresaMensajeria']?.toString() ?? '',
    );
    observacionesController = TextEditingController(
      text: widget.paquete['observaciones']?.toString() ?? '',
    );

    // Inicializar fecha y hora
    try {
      final fechaRecepcion = DateTime.parse(
        widget.paquete['fechaRecepcion']?.toString() ??
            DateTime.now().toIso8601String(),
      );
      fechaSeleccionada = fechaRecepcion;
      horaSeleccionada = TimeOfDay(
        hour: fechaRecepcion.hour,
        minute: fechaRecepcion.minute,
      );
    } catch (e) {
      fechaSeleccionada = DateTime.now();
      horaSeleccionada = TimeOfDay.now();
    }

    // Inicializar torre y apartamento
    // Convertir torresId numérico a letra (1->A, 2->B, etc)
    final torresIdNum = widget.paquete['apartamento']?['torresId'];
    if (torresIdNum != null) {
      final torresIndex = int.tryParse(torresIdNum.toString());
      if (torresIndex != null && torresIndex >= 1 && torresIndex <= 10) {
        torreSeleccionada = torres[torresIndex - 1];
      }
    }

    apartamentoSeleccionado = widget
        .paquete['apartamento']?['numeroApartamento']
        ?.toString();
    apartamentoIdSeleccionado = widget.paquete['apartamentoId'];
  }

  @override
  void dispose() {
    residenteController.dispose();
    transportadoraController.dispose();
    observacionesController.dispose();
    super.dispose();
  }

  Future<void> _editarPaquete() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      isSubmitting = true;
    });

    try {
      // Combinar fecha y hora
      DateTime fechaHora = DateTime(
        fechaSeleccionada.year,
        fechaSeleccionada.month,
        fechaSeleccionada.day,
        horaSeleccionada.hour,
        horaSeleccionada.minute,
      );

      final body = {
        'nombreDestinatario': residenteController.text.trim(),
        'empresaMensajeria': transportadoraController.text.trim(),
        'fechaRecepcion': fechaHora.toIso8601String(),
        'observaciones': observacionesController.text.trim().isEmpty
            ? null
            : observacionesController.text.trim(),
      };

      // Eliminar valores null
      body.removeWhere((key, value) => value == null);

      final headers = {'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final idPaquete = widget.paquete['idPaquete'];
      print('Editando paquete ID: $idPaquete'); // Debug
      print('Body: ${json.encode(body)}'); // Debug

      final response = await http.patch(
        Uri.parse('${LoginServe.baseUrl}/api/recepcionPaquetes/$idPaquete'),
        headers: headers,
        body: json.encode(body),
      );

      print('Status Code: ${response.statusCode}'); // Debug
      print('Response Body: ${response.body}'); // Debug

      if (response.statusCode == 200 || response.statusCode == 204) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Paquete actualizado exitosamente'),
              backgroundColor: Colors.green,
            ),
          );
          widget.onPaqueteEditado();
        }
      } else {
        final errorMsg = response.body.isNotEmpty
            ? json.decode(response.body)['message'] ?? response.body
            : 'Error al actualizar paquete';
        throw Exception(errorMsg);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error: ${error.toString().replaceAll('Exception: ', '')}',
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: isSmallScreen ? MediaQuery.of(context).size.width * 0.9 : 600,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        padding: EdgeInsets.all(isSmallScreen ? 20 : 30),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Editar Paquete',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Residente
                TextFormField(
                  controller: residenteController,
                  decoration: InputDecoration(
                    labelText: 'Nombre del Residente *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.person),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Este campo es obligatorio';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 15),
                // Torre
                DropdownButtonFormField<String>(
                  value: torreSeleccionada,
                  decoration: InputDecoration(
                    labelText: 'Torre *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.apartment),
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
                      apartamentoIdSeleccionado = null;
                    });
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Seleccione una torre';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 15),
                // Apartamento
                DropdownButtonFormField<String>(
                  value: apartamentoSeleccionado,
                  decoration: InputDecoration(
                    labelText: 'Apartamento *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.home),
                  ),
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
                        apartamentoIdSeleccionado =
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
                const SizedBox(height: 15),
                // Transportadora
                TextFormField(
                  controller: transportadoraController,
                  decoration: InputDecoration(
                    labelText: 'Transportadora *',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.local_shipping),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Este campo es obligatorio';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 15),
                // Fecha y Hora
                MediaQuery.of(context).size.width < 600
                    ? Column(
                        children: [
                          InkWell(
                            onTap: () async {
                              final fecha = await showDatePicker(
                                context: context,
                                initialDate: fechaSeleccionada,
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2030),
                              );
                              if (fecha != null) {
                                setState(() {
                                  fechaSeleccionada = fecha;
                                });
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: 'Fecha',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                prefixIcon: const Icon(Icons.calendar_today),
                              ),
                              child: Text(
                                '${fechaSeleccionada.day}/${fechaSeleccionada.month}/${fechaSeleccionada.year}',
                              ),
                            ),
                          ),
                          const SizedBox(height: 15),
                          InkWell(
                            onTap: () async {
                              final hora = await showTimePicker(
                                context: context,
                                initialTime: horaSeleccionada,
                              );
                              if (hora != null) {
                                setState(() {
                                  horaSeleccionada = hora;
                                });
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: 'Hora',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                prefixIcon: const Icon(Icons.access_time),
                              ),
                              child: Text(
                                '${horaSeleccionada.hour.toString().padLeft(2, '0')}:${horaSeleccionada.minute.toString().padLeft(2, '0')}',
                              ),
                            ),
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final fecha = await showDatePicker(
                                  context: context,
                                  initialDate: fechaSeleccionada,
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2030),
                                );
                                if (fecha != null) {
                                  setState(() {
                                    fechaSeleccionada = fecha;
                                  });
                                }
                              },
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  labelText: 'Fecha',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  prefixIcon: const Icon(Icons.calendar_today),
                                ),
                                child: Text(
                                  '${fechaSeleccionada.day}/${fechaSeleccionada.month}/${fechaSeleccionada.year}',
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final hora = await showTimePicker(
                                  context: context,
                                  initialTime: horaSeleccionada,
                                );
                                if (hora != null) {
                                  setState(() {
                                    horaSeleccionada = hora;
                                  });
                                }
                              },
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  labelText: 'Hora',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  prefixIcon: const Icon(Icons.access_time),
                                ),
                                child: Text(
                                  '${horaSeleccionada.hour.toString().padLeft(2, '0')}:${horaSeleccionada.minute.toString().padLeft(2, '0')}',
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                const SizedBox(height: 15),
                // Observaciones
                TextFormField(
                  controller: observacionesController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Observaciones',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    prefixIcon: const Icon(Icons.note),
                  ),
                ),
                const SizedBox(height: 25),
                // Botón de actualización
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isSubmitting ? null : _editarPaquete,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'Actualizar Paquete',
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
    );
  }
}

// Diálogo de detalles del paquete
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
                    paquete['apartamento']?['torresId']?.toString() ?? 'N/A',
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
