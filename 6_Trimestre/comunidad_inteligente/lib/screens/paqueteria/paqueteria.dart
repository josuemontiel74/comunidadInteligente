import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../main.dart';
import '../../utils/helpers.dart';

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
  String busquedaNombre = '';
  String? filtroTorre;
  String? filtroApartamento;
  final TextEditingController _searchController = TextEditingController();

  // Método helper para mostrar SnackBar de forma segura
  // ignore: unused_element
  void _mostrarSnackBar(String mensaje, {Color? backgroundColor}) {
    if (!mounted) return;

    try {
      _mostrarSnackBarSafe(
        SnackBar(
          content: Text(mensaje),
          backgroundColor: backgroundColor ?? Colors.green,
          duration: const Duration(seconds: 3),
        ),
      );
    } catch (e) {
      // Si falla, solo imprime en consola
      print('SnackBar: $mensaje');
    }
  }

  // Método para mostrar SnackBar con widget personalizado
  void _mostrarSnackBarSafe(SnackBar snackBar) {
    if (!mounted) return;

    try {
      ScaffoldMessenger.of(context).showSnackBar(snackBar);
    } catch (e) {
      // Si falla, solo imprime en consola
      print('SnackBar no disponible');
    }
  }

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

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        setState(() => isLoading = false);
        return;
      }

      if (response.statusCode == 200) {
        final datos = json.decode(response.body);

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

        // Filtrar por estado en el frontend
        List<dynamic> paquetesFiltrados = todosPaquetes;
        if (filtroEstado != 'todos') {
          paquetesFiltrados = todosPaquetes.where((paquete) {
            final estadoNombre = paquete['estado']?['nombreEstado']
                ?.toString()
                .toLowerCase();
            return estadoNombre == filtroEstado;
          }).toList();
        }

        // Filtrar por búsqueda de nombre
        if (busquedaNombre.isNotEmpty) {
          paquetesFiltrados = paquetesFiltrados.where((paquete) {
            final nombre =
                paquete['nombreDestinatario']?.toString().toLowerCase() ?? '';
            return nombre.contains(busquedaNombre.toLowerCase());
          }).toList();
        }

        // Filtrar por torre
        if (filtroTorre != null && filtroTorre!.isNotEmpty) {
          // Convertir "Torre A" a 1, "Torre B" a 2, etc.
          final torreLetra = filtroTorre!.replaceAll('Torre ', '');
          final torreId = torreLetra.codeUnitAt(0) - 'A'.codeUnitAt(0) + 1;

          paquetesFiltrados = paquetesFiltrados.where((paquete) {
            final torresIdPaquete = paquete['apartamento']?['torresId'];
            return torresIdPaquete?.toString() == torreId.toString();
          }).toList();
        }

        // Filtrar por apartamento
        if (filtroApartamento != null && filtroApartamento!.isNotEmpty) {
          paquetesFiltrados = paquetesFiltrados.where((paquete) {
            return paquete['apartamento']?['numeroApartamento'] ==
                filtroApartamento;
          }).toList();
        }

        // Ordenar: primero los recibidos (sin entregar), luego los entregados, por fecha más reciente
        paquetesFiltrados.sort((a, b) {
          // Determinar si están entregados
          final estadoA =
              a['estado']?['nombreEstado']?.toString().toLowerCase() ?? '';
          final estadoB =
              b['estado']?['nombreEstado']?.toString().toLowerCase() ?? '';
          final esRecibidoA = estadoA == 'recibido';
          final esRecibidoB = estadoB == 'recibido';

          // Si uno es recibido y el otro no, el recibido va primero
          if (esRecibidoA && !esRecibidoB) return -1;
          if (!esRecibidoA && esRecibidoB) return 1;

          // Si ambos son recibidos o ambos están entregados, ordenar por fecha más reciente
          final fechaA = DateTime.tryParse(
            a['fechaRecepcion']?.toString() ?? '',
          );
          final fechaB = DateTime.tryParse(
            b['fechaRecepcion']?.toString() ?? '',
          );
          if (fechaA == null || fechaB == null) return 0;
          return fechaB.compareTo(
            fechaA,
          ); // Orden descendente (más reciente primero)
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
        setState(() {
          isLoading = false;
        });
      }
    } catch (error) {
      setState(() {
        isLoading = false;
      });
      if (mounted) {
        _mostrarSnackBarSafe(
          SnackBar(
            content: Text('Error al cargar paquetes: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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

  // Convertir número de torre (1-10) a letra (A-J)
  String _convertirTorreIdALetra(dynamic torresId) {
    if (torresId == null) return '';
    final id = int.tryParse(torresId.toString());
    if (id == null || id < 1 || id > 10) return torresId.toString();
    return String.fromCharCode('A'.codeUnitAt(0) + id - 1);
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
    // Mostrar alerta de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.local_shipping, color: Colors.blue, size: 28),
            const SizedBox(width: 8),
            const Flexible(
              child: Text('Confirmar Entrega', overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '¿Está seguro de marcar este paquete como entregado?',
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Destinatario: ${paquete['nombreDestinatario'] ?? 'N/A'}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Apartamento: ${paquete['apartamento']?['numeroApartamento'] ?? 'N/A'}',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Esta acción no se puede deshacer.',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Entregar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    try {
      final headers = {'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final idPaquete = paquete['idPaquete'];

      final response = await http.delete(
        Uri.parse('${LoginServe.baseUrl}/api/recepcionPaquetes/$idPaquete'),
        headers: headers,
      );

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200 || response.statusCode == 204) {
        if (mounted) {
          _mostrarSnackBarSafe(
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
      if (mounted) {
        _mostrarSnackBarSafe(
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
                      'Torre ${_convertirTorreIdALetra(paquete['apartamento']?['torresId'])} - Apto ${paquete['apartamento']?['numeroApartamento']?.toString() ?? ''}',
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
                      formatearFechaParaMostrar(
                        paquete['fechaRecepcion']?.toString(),
                      ),
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
                    Flexible(
                      child: OutlinedButton.icon(
                        onPressed: () => _mostrarDetalles(paquete),
                        icon: const Icon(Icons.info_outline, size: 16),
                        label: const Text(
                          'Detalles',
                          style: TextStyle(fontSize: 12),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.blue,
                          side: const BorderSide(color: Colors.blue),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 8,
                          ),
                        ),
                      ),
                    ),
                    if (!esEntregado) ...[
                      const SizedBox(width: 6),
                      Flexible(
                        child: OutlinedButton.icon(
                          onPressed: () => _mostrarFormularioEdicion(paquete),
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text(
                            'Editar',
                            style: TextStyle(fontSize: 12),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.orange,
                            side: const BorderSide(color: Colors.orange),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 8,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: ElevatedButton.icon(
                          onPressed: () => _marcarComoEntregado(paquete),
                          icon: const Icon(Icons.check_circle, size: 16),
                          label: const Text(
                            'Entregar',
                            style: TextStyle(fontSize: 12),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 8,
                            ),
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
                  Text(
                    _convertirTorreIdALetra(
                      paquete['apartamento']?['torresId'],
                    ),
                  ),
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
                // Barra de búsqueda
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Buscar por nombre del destinatario...',
                    prefixIcon: const Icon(Icons.search, color: Colors.blue),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (value) {
                    setState(() {
                      busquedaNombre = value;
                      paginaActual = 1;
                    });
                    _cargarPaquetes();
                  },
                ),
                const SizedBox(height: 15),
                // Filtros de torre y apartamento
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: filtroTorre,
                        decoration: InputDecoration(
                          labelText: 'Torre',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Colors.white,
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
                          });
                          _cargarPaquetes();
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: filtroApartamento,
                        decoration: InputDecoration(
                          labelText: 'Apartamento',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Colors.white,
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
                          });
                          _cargarPaquetes();
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

  // Helper para mostrar selector de hora en formato 12 horas (AM/PM)
  Future<TimeOfDay?> mostrarSelectorHora(
    BuildContext context,
    TimeOfDay horaInicial,
  ) async {
    return await showTimePicker(
      context: context,
      initialTime: horaInicial,
      builder: (BuildContext context, Widget? child) {
        final theme = Theme.of(context);

        return Theme(
          data: theme.copyWith(
            useMaterial3: false,
            timePickerTheme: const TimePickerThemeData(
              hourMinuteShape: RoundedRectangleBorder(), // evita bordes nuevos
              dialBackgroundColor: null,
              hourMinuteColor: null,
            ),
          ),
          child: MediaQuery(
            data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: false),
            child: child!,
          ),
        );
      },
    );
  }

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
      // Combinar fecha y hora
      DateTime fechaHora = DateTime(
        fechaSeleccionada.year,
        fechaSeleccionada.month,
        fechaSeleccionada.day,
        horaSeleccionada.hour,
        horaSeleccionada.minute,
      );

      // Formatear sin segundos: YYYY-MM-DD HH:mm
      final fechaFormateada =
          '${fechaHora.year}-${fechaHora.month.toString().padLeft(2, '0')}-${fechaHora.day.toString().padLeft(2, '0')} '
          '${fechaHora.hour.toString().padLeft(2, '0')}:${fechaHora.minute.toString().padLeft(2, '0')}';

      final body = {
        'apartamentoId': apartamentoIdSeleccionado,
        'nombreDestinatario': residenteController.text.trim(),
        'empresaMensajeria': transportadoraController.text.trim(),
        'fechaRecepcion': fechaFormateada,
      };

      // Solo agregar observaciones si no está vacío
      if (observacionesController.text.trim().isNotEmpty) {
        body['observaciones'] = observacionesController.text.trim();
      }

      final headers = {'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final response = await http.post(
        Uri.parse('${LoginServe.baseUrl}/api/recepcionPaquetes'),
        headers: headers,
        body: json.encode(body),
      );

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          Navigator.pop(context);
          _mostrarSnackBarSafe(
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
        _mostrarSnackBarSafe(
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

  void _mostrarSnackBarSafe(SnackBar snackBar) {
    if (!mounted) return;
    try {
      ScaffoldMessenger.of(context).showSnackBar(snackBar);
    } catch (e) {
      print('SnackBar no disponible');
    }
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
        padding: EdgeInsets.all(isSmallScreen ? 16 : 30),
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
                    Expanded(
                      child: Text(
                        'Registrar Nuevo Paquete',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 18 : 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                SizedBox(height: isSmallScreen ? 16 : 20),
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

  // Helper para mostrar selector de hora en formato 12 horas (AM/PM)
  Future<TimeOfDay?> mostrarSelectorHora(
    BuildContext context,
    TimeOfDay horaInicial,
  ) async {
    return await showTimePicker(
      context: context,
      initialTime: horaInicial,
      builder: (BuildContext context, Widget? child) {
        final theme = Theme.of(context);

        return Theme(
          data: theme.copyWith(
            useMaterial3: false,
            timePickerTheme: const TimePickerThemeData(
              hourMinuteShape: RoundedRectangleBorder(), // evita bordes nuevos
              dialBackgroundColor: null,
              hourMinuteColor: null,
            ),
          ),
          child: MediaQuery(
            data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: false),
            child: child!,
          ),
        );
      },
    );
  }

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
      final fechaStr = widget.paquete['fechaRecepcion']?.toString() ?? '';
      final fechaRecepcion = parsearFechaDesdeBackend(fechaStr);

      fechaSeleccionada = fechaRecepcion;
      horaSeleccionada = TimeOfDay(
        hour: fechaRecepcion.hour,
        minute: fechaRecepcion.minute,
      );
    } catch (e) {
      print('Error parseando fecha: $e');
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

      // Formatear sin segundos: YYYY-MM-DD HH:mm
      final fechaFormateada =
          '${fechaHora.year}-${fechaHora.month.toString().padLeft(2, '0')}-${fechaHora.day.toString().padLeft(2, '0')} '
          '${fechaHora.hour.toString().padLeft(2, '0')}:${fechaHora.minute.toString().padLeft(2, '0')}';

      final body = {
        'apartamentoId': apartamentoIdSeleccionado,
        'nombreDestinatario': residenteController.text.trim(),
        'empresaMensajeria': transportadoraController.text.trim(),
        'fechaRecepcion': fechaFormateada,
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

      final response = await http.patch(
        Uri.parse('${LoginServe.baseUrl}/api/recepcionPaquetes/$idPaquete'),
        headers: headers,
        body: json.encode(body),
      );

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200 || response.statusCode == 204) {
        if (mounted) {
          Navigator.pop(context);
          _mostrarSnackBarSafe(
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
        _mostrarSnackBarSafe(
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

  void _mostrarSnackBarSafe(SnackBar snackBar) {
    if (!mounted) return;
    try {
      ScaffoldMessenger.of(context).showSnackBar(snackBar);
    } catch (e) {
      print('SnackBar no disponible');
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

  // Convertir número de torre (1-10) a letra (A-J)
  String _convertirTorreIdALetra(dynamic torresId) {
    if (torresId == null) return 'N/A';
    final id = int.tryParse(torresId.toString());
    if (id == null || id < 1 || id > 10) return torresId.toString();
    return String.fromCharCode('A'.codeUnitAt(0) + id - 1);
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
                    _convertirTorreIdALetra(
                      paquete['apartamento']?['torresId'],
                    ),
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
                    formatearFechaParaMostrar(
                      paquete['fechaRecepcion']?.toString(),
                    ),
                  ),
                  _buildDetalle(
                    'Hora Recepción',
                    formatearHoraParaMostrar(
                      paquete['fechaRecepcion']?.toString(),
                    ),
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
