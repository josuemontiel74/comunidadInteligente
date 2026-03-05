// ignore_for_file: use_build_context_synchronously
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../main.dart';
import '../../utils/helpers.dart';
import '../../utils/validaciones.dart';

class Residentes extends StatefulWidget {
  final bool openCreateDialog;

  const Residentes({super.key, this.openCreateDialog = false});

  @override
  State<Residentes> createState() => _ResidentesState();
}

class _ResidentesState extends State<Residentes> {
  List<dynamic> ocupantes = [];
  List<dynamic> apartamentos = [];
  List<dynamic> tiposDocumento = [];
  bool isLoading = true;
  String searchQuery = '';
  String filtroEstado = 'todos'; // todos, activas, finalizadas
  String filtroTipoOcupacion = 'todos'; // todos, propietario, arrendatario
  String? filtroTorre;
  String? filtroApartamento;

  // Paginación
  int paginaActual = 1;
  int elementosPorPagina = 10;

  // Convertir número de torre (1-10) a letra (A-J)
  String torreNumeroALetra(int numero) {
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    if (numero >= 1 && numero <= 10) {
      return letras[numero - 1];
    }
    return numero.toString();
  }

  // Convertir letra de torre (A-J) a número (1-10)
  int? torreLetraANumero(String letra) {
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    final index = letras.indexOf(letra.toUpperCase());
    return index >= 0 ? index + 1 : null;
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

  @override
  void initState() {
    super.initState();
    _inicializarDatos();
  }

  Future<void> _inicializarDatos() async {
    setState(() {
      isLoading = true;
      // Resetear filtros al cargar
      filtroTorre = null;
      filtroApartamento = null;
    });
    await Future.wait([
      _cargarOcupantes(),
      _cargarApartamentos(),
      _cargarTiposDocumento(),
    ]);
    setState(() => isLoading = false);

    // Abrir diálogo de crear si se especificó
    if (widget.openCreateDialog && mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showDialog(
          context: context,
          builder: (context) => CrearResidenteDialog(
            apartamentos: apartamentos,
            tiposDocumento: tiposDocumento,
            onCreated: _cargarOcupantes,
          ),
        );
      });
    }
  }

  Future<void> _cargarOcupantes() async {
    try {
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/ocupantes'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${LoginServe.token}',
        },
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          ocupantes = data['body'] ?? [];
          // Enriquecer ocupantes con numeroApartamento desde apartamentos
          _enriquecerOcupantesConNumeroApartamento();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar ocupantes: $e')),
        );
      }
    }
  }

  // Agregar numeroApartamento a cada ocupante desde la lista de apartamentos
  void _enriquecerOcupantesConNumeroApartamento() {
    for (var ocupante in ocupantes) {
      final apartamentoId = ocupante['apartamentosId'];
      if (apartamentoId != null) {
        final apartamento = apartamentos.firstWhere(
          (apt) => apt['IdApartamento'] == apartamentoId,
          orElse: () => {},
        );
        if (apartamento.isNotEmpty) {
          ocupante['numeroApartamento'] = apartamento['numeroApartamento'];
        }
      }
    }
  }

  Future<void> _cargarApartamentos() async {
    try {
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/apartamento'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${LoginServe.token}',
        },
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          apartamentos = data['body'] ?? [];
          // Si ya hay ocupantes cargados, enriquecerlos con el numeroApartamento
          if (ocupantes.isNotEmpty) {
            _enriquecerOcupantesConNumeroApartamento();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar apartamentos: $e')),
        );
      }
    }
  }

  Future<void> _cargarTiposDocumento() async {
    try {
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/documento'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${LoginServe.token}',
        },
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          tiposDocumento = data['body'] ?? [];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar tipos de documento: $e')),
        );
      }
    }
  }

  List<dynamic> get ocupantesFiltrados {
    var lista = ocupantes.where((ocupante) {
      // Filtro por estado
      if (filtroEstado == 'activas' && ocupante['estadoId'] != 5) {
        return false;
      }
      if (filtroEstado == 'finalizadas' && ocupante['estadoId'] != 6) {
        return false;
      }

      // Filtro por torre
      if (filtroTorre != null && filtroTorre!.isNotEmpty) {
        final torreLetra = filtroTorre!.replaceAll('Torre ', '');
        final torreId = torreLetraANumero(torreLetra);
        if (ocupante['torresId'] != torreId) {
          return false;
        }
      }

      // Filtro por apartamento
      if (filtroApartamento != null && filtroApartamento!.isNotEmpty) {
        final numApto = ocupante['numeroApartamento']?.toString();
        if (numApto != filtroApartamento) {
          return false;
        }
      }

      // Filtro por tipo de ocupación
      if (filtroTipoOcupacion != 'todos') {
        if (ocupante['tipoOcupacion'] != filtroTipoOcupacion) {
          return false;
        }
      }

      // Búsqueda por texto
      if (searchQuery.isNotEmpty) {
        final nombreCompleto =
            '${ocupante['primerNombre'] ?? ''} ${ocupante['segundoNombre'] ?? ''} ${ocupante['primerApellido'] ?? ''} ${ocupante['segundoApellido'] ?? ''}'
                .toLowerCase();
        final numeroDoc = (ocupante['numeroDocumento'] ?? '')
            .toString()
            .toLowerCase();
        final apartamento = 'apartamento ${ocupante['numeroApartamento'] ?? ''}'
            .toLowerCase();
        final query = searchQuery.toLowerCase();

        if (!nombreCompleto.contains(query) &&
            !numeroDoc.contains(query) &&
            !apartamento.contains(query)) {
          return false;
        }
      }

      return true;
    }).toList();

    // Ordenar: activas primero, luego finalizadas
    lista.sort((a, b) {
      if (a['estadoId'] == 5 && b['estadoId'] != 5) return -1;
      if (a['estadoId'] != 5 && b['estadoId'] == 5) return 1;
      return 0;
    });

    return lista;
  }

  List<dynamic> _obtenerOcupantesPaginados() {
    final ocupantesCompletos = ocupantesFiltrados;
    if (ocupantesCompletos.isEmpty) return [];

    final inicio = (paginaActual - 1) * elementosPorPagina;
    final fin = inicio + elementosPorPagina;

    // Validar que el inicio esté dentro del rango válido
    if (inicio < 0 || inicio >= ocupantesCompletos.length) return [];

    return ocupantesCompletos.sublist(
      inicio,
      fin > ocupantesCompletos.length ? ocupantesCompletos.length : fin,
    );
  }

  Widget _buildPaginacion(int totalElementos) {
    final totalPaginas = (totalElementos / elementosPorPagina).ceil();

    if (totalPaginas <= 1) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: paginaActual > 1
                ? () => setState(() => paginaActual--)
                : null,
          ),
          const SizedBox(width: 8),
          Text(
            'Página $paginaActual de $totalPaginas',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: paginaActual < totalPaginas
                ? () => setState(() => paginaActual++)
                : null,
          ),
        ],
      ),
    );
  }

  // Obtener lista de torres únicas
  List<int> get torresDisponibles {
    final torres = ocupantes
        .map((o) => o['torresId'] as int?)
        .where((t) => t != null)
        .cast<int>()
        .toSet()
        .toList();
    torres.sort();
    return torres;
  }

  Future<void> _finalizarOcupante(int idOcupante) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar finalización'),
        content: const Text(
          '¿Está seguro de finalizar esta ocupación? Esta acción establecerá la fecha de fin a hoy.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Finalizar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    try {
      final response = await http.delete(
        Uri.parse('${LoginServe.baseUrl}/api/ocupante/$idOcupante'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${LoginServe.token}',
        },
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ocupación finalizada correctamente'),
              backgroundColor: Colors.green,
            ),
          );
          _cargarOcupantes();
        }
      } else {
        throw Exception('Error al finalizar ocupación');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestión de Residentes'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Botón crear residente
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            child: ElevatedButton.icon(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => CrearResidenteDialog(
                    apartamentos: apartamentos,
                    tiposDocumento: tiposDocumento,
                    onCreated: _cargarOcupantes,
                  ),
                );
              },
              icon: const Icon(Icons.add),
              label: const Text('Crear Residente'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  vertical: 16,
                  horizontal: 24,
                ),
              ),
            ),
          ),

          // Contenedor de filtros
          if (!isLoading)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Barra de búsqueda
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Buscar por nombre, documento o apartamento',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    onChanged: (value) {
                      setState(() {
                        searchQuery = value;
                        paginaActual = 1;
                      });
                    },
                  ),
                  const SizedBox(height: 16),

                  // Filtros en fila - SOLO se muestran cuando hay datos
                  if (apartamentos.isNotEmpty || ocupantes.isNotEmpty)
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        // Filtro por torre (PRIMERO)
                        SizedBox(
                          width: isMobile ? double.infinity : 200,
                          child: DropdownButtonFormField<String?>(
                            initialValue: filtroTorre,
                            decoration: InputDecoration(
                              labelText: 'Torre',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                            isExpanded: true,
                            items: [
                              const DropdownMenuItem<String?>(
                                value: null,
                                child: Text('Todas'),
                              ),
                              ...List.generate(10, (index) {
                                final letra = String.fromCharCode(65 + index);
                                return DropdownMenuItem<String?>(
                                  value: 'Torre $letra',
                                  child: Text('Torre $letra'),
                                );
                              }),
                            ],
                            onChanged: (value) {
                              setState(() {
                                filtroTorre = value;
                                filtroApartamento =
                                    null; // Resetear apartamento
                                paginaActual = 1;
                              });
                            },
                          ),
                        ),

                        // Filtro por apartamento (SEGUNDO)
                        if (filtroTorre != null)
                          SizedBox(
                            width: isMobile ? double.infinity : 200,
                            child: DropdownButtonFormField<String?>(
                              initialValue: filtroApartamento,
                              decoration: InputDecoration(
                                labelText: 'Apartamento',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                filled: true,
                                fillColor: Colors.white,
                              ),
                              isExpanded: true,
                              items: [
                                const DropdownMenuItem<String?>(
                                  value: null,
                                  child: Text('Todos'),
                                ),
                                ..._getApartamentosPorTorre(filtroTorre!),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  filtroApartamento = value;
                                  paginaActual = 1;
                                });
                              },
                            ),
                          ),
                      ],
                    ),
                  const SizedBox(height: 16),

                  // Chips de estado
                  const Text(
                    'Estado:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('Todos'),
                        selected: filtroEstado == 'todos',
                        onSelected: (selected) {
                          setState(() {
                            filtroEstado = 'todos';
                            paginaActual = 1;
                          });
                        },
                      ),
                      FilterChip(
                        label: const Text('Activas'),
                        selected: filtroEstado == 'activas',
                        onSelected: (selected) {
                          setState(() {
                            filtroEstado = 'activas';
                            paginaActual = 1;
                          });
                        },
                        selectedColor: Colors.green.shade100,
                      ),
                      FilterChip(
                        label: const Text('Finalizadas'),
                        selected: filtroEstado == 'finalizadas',
                        onSelected: (selected) {
                          setState(() {
                            filtroEstado = 'finalizadas';
                            paginaActual = 1;
                          });
                        },
                        selectedColor: Colors.red.shade100,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Chips de tipo de ocupación
                  const Text(
                    'Tipo de ocupación:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('Todos'),
                        selected: filtroTipoOcupacion == 'todos',
                        onSelected: (selected) {
                          setState(() {
                            filtroTipoOcupacion = 'todos';
                            paginaActual = 1;
                          });
                        },
                      ),
                      FilterChip(
                        label: const Text('Propietario'),
                        selected: filtroTipoOcupacion == 'propietario',
                        onSelected: (selected) {
                          setState(() {
                            filtroTipoOcupacion = 'propietario';
                            paginaActual = 1;
                          });
                        },
                        selectedColor: Colors.blue.shade100,
                      ),
                      FilterChip(
                        label: const Text('Arrendatario'),
                        selected: filtroTipoOcupacion == 'arrendatario',
                        onSelected: (selected) {
                          setState(() {
                            filtroTipoOcupacion = 'arrendatario';
                            paginaActual = 1;
                          });
                        },
                        selectedColor: Colors.orange.shade100,
                      ),
                    ],
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // Lista de ocupantes
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : ocupantesFiltrados.isEmpty
                ? const Center(
                    child: Text(
                      'No se encontraron residentes',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  )
                : Column(
                    children: [
                      Expanded(
                        child: isMobile
                            ? _buildCardLayout()
                            : _buildTableLayout(),
                      ),
                      _buildPaginacion(ocupantesFiltrados.length),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardLayout() {
    final ocupantesPaginados = _obtenerOcupantesPaginados();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: ocupantesPaginados.length,
      itemBuilder: (context, index) {
        final ocupante = ocupantesPaginados[index];
        return _buildResidenteCard(ocupante);
      },
    );
  }

  Widget _buildResidenteCard(dynamic ocupante) {
    final esActivo = ocupante['estadoId'] == 5;
    final nombreCompleto =
        '${ocupante['primerNombre'] ?? ''} ${ocupante['segundoNombre'] ?? ''} ${ocupante['primerApellido'] ?? ''} ${ocupante['segundoApellido'] ?? ''}'
            .trim();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    nombreCompleto,
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
                    color: esActivo
                        ? Colors.green.shade100
                        : Colors.red.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    ocupante['nombreEstado'] ??
                        (esActivo ? 'Activo' : 'Finalizado'),
                    style: TextStyle(
                      color: esActivo
                          ? Colors.green.shade900
                          : Colors.red.shade900,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildInfoRow(
              Icons.badge,
              'Documento',
              ocupante['numeroDocumento'],
            ),
            _buildInfoRow(
              Icons.apartment,
              'Apartamento',
              'Apto ${ocupante['numeroApartamento']} - Torre ${ocupante['torresId'] != null ? torreNumeroALetra(ocupante['torresId']) : ''}',
            ),
            _buildInfoRow(
              Icons.person_outline,
              'Tipo',
              ocupante['tipoOcupacion'] == 'propietario'
                  ? 'Propietario'
                  : 'Arrendatario',
            ),
            _buildInfoRow(
              Icons.calendar_today,
              'Fecha inicio',
              ocupante['fechaInicio'] != null
                  ? ocupante['fechaInicio'].toString().split('T')[0]
                  : 'N/A',
            ),
            if (ocupante['fechaFin'] != null)
              _buildInfoRow(
                Icons.event_busy,
                'Fecha fin',
                ocupante['fechaFin'].toString().split('T')[0],
              ),
            _buildInfoRow(
              Icons.people,
              'Personas a cargo',
              ocupante['personasACargo']?.toString() ?? '0',
            ),
            // Información adicional
            if (ocupante['tieneNinos'] == 1)
              _buildInfoRow(Icons.child_care, 'Tiene niños', 'Sí'),
            if (ocupante['tieneAdultoMayor'] == 1)
              _buildInfoRow(Icons.elderly, 'Tiene adulto mayor', 'Sí'),
            if (ocupante['tieneDiscapacidad'] == 1)
              _buildInfoRow(Icons.accessible, 'Tiene discapacidad', 'Sí'),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) =>
                          VerDetalleResidenteDialog(ocupante: ocupante),
                    );
                  },
                  icon: const Icon(Icons.visibility),
                  color: Colors.teal,
                  tooltip: 'Ver detalles',
                ),
                if (esActivo)
                  IconButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => EditarResidenteDialog(
                          ocupante: ocupante,
                          apartamentos: apartamentos,
                          tiposDocumento: tiposDocumento,
                          onUpdated: _cargarOcupantes,
                        ),
                      );
                    },
                    icon: const Icon(Icons.edit),
                    color: Colors.blue,
                    tooltip: 'Editar',
                  ),
                IconButton(
                  onPressed: esActivo
                      ? () => _finalizarOcupante(ocupante['idOcupante'])
                      : null,
                  icon: Icon(esActivo ? Icons.block : Icons.check_circle),
                  color: esActivo ? Colors.red : Colors.grey,
                  tooltip: esActivo ? 'Finalizar' : 'Finalizado',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
          Expanded(
            child: Text(
              value?.toString() ?? 'N/A',
              style: TextStyle(color: Colors.grey.shade800),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableLayout() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(Colors.teal.shade50),
          columns: const [
            DataColumn(
              label: Text(
                'Nombre',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            DataColumn(
              label: Text(
                'Documento',
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
                'Torre',
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
                'Estado',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            DataColumn(
              label: Text(
                'Fecha Inicio',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            DataColumn(
              label: Text(
                'Personas a Cargo',
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
                'Adulto Mayor',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            DataColumn(
              label: Text(
                'Discapacidad',
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
          rows: _obtenerOcupantesPaginados().map((ocupante) {
            final esActivo = ocupante['estadoId'] == 5;
            final nombreCompleto =
                '${ocupante['primerNombre'] ?? ''} ${ocupante['segundoNombre'] ?? ''} ${ocupante['primerApellido'] ?? ''} ${ocupante['segundoApellido'] ?? ''}'
                    .trim();

            return DataRow(
              cells: [
                DataCell(Text(nombreCompleto)),
                DataCell(Text(ocupante['numeroDocumento']?.toString() ?? '')),
                DataCell(Text(ocupante['numeroApartamento']?.toString() ?? '')),
                DataCell(
                  Text(
                    ocupante['torresId'] != null
                        ? torreNumeroALetra(ocupante['torresId'])
                        : '',
                  ),
                ),
                DataCell(
                  Text(
                    ocupante['tipoOcupacion'] == 'propietario'
                        ? 'Propietario'
                        : 'Arrendatario',
                  ),
                ),
                DataCell(
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: esActivo
                          ? Colors.green.shade100
                          : Colors.red.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      ocupante['nombreEstado'] ??
                          (esActivo ? 'Activo' : 'Finalizado'),
                      style: TextStyle(
                        color: esActivo
                            ? Colors.green.shade900
                            : Colors.red.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                DataCell(
                  Text(
                    ocupante['fechaInicio'] != null
                        ? ocupante['fechaInicio'].toString().split('T')[0]
                        : 'N/A',
                  ),
                ),
                DataCell(Text(ocupante['personasACargo']?.toString() ?? '0')),
                DataCell(Text(ocupante['tieneNinos'] == 1 ? 'Sí' : 'No')),
                DataCell(Text(ocupante['tieneAdultoMayor'] == 1 ? 'Sí' : 'No')),
                DataCell(
                  Text(ocupante['tieneDiscapacidad'] == 1 ? 'Sí' : 'No'),
                ),
                DataCell(
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.visibility, color: Colors.teal),
                        tooltip: 'Ver detalles',
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (context) =>
                                VerDetalleResidenteDialog(ocupante: ocupante),
                          );
                        },
                      ),
                      if (esActivo)
                        IconButton(
                          icon: const Icon(Icons.edit, color: Colors.blue),
                          tooltip: 'Editar',
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => EditarResidenteDialog(
                                ocupante: ocupante,
                                apartamentos: apartamentos,
                                tiposDocumento: tiposDocumento,
                                onUpdated: _cargarOcupantes,
                              ),
                            );
                          },
                        ),
                      IconButton(
                        icon: Icon(
                          esActivo ? Icons.block : Icons.check_circle,
                          color: esActivo ? Colors.red : Colors.grey,
                        ),
                        tooltip: esActivo ? 'Finalizar' : 'Finalizado',
                        onPressed: esActivo
                            ? () => _finalizarOcupante(ocupante['idOcupante'])
                            : null,
                      ),
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
}

// ============================================================================
// DIÁLOGO CREAR RESIDENTE
// ============================================================================

class CrearResidenteDialog extends StatefulWidget {
  final List<dynamic> apartamentos;
  final List<dynamic> tiposDocumento;
  final VoidCallback onCreated;

  const CrearResidenteDialog({
    super.key,
    required this.apartamentos,
    required this.tiposDocumento,
    required this.onCreated,
  });

  @override
  State<CrearResidenteDialog> createState() => _CrearResidenteDialogState();
}

class _CrearResidenteDialogState extends State<CrearResidenteDialog> {
  final _formKey = GlobalKey<FormState>();
  final numeroDocumentoController = TextEditingController();
  final primerNombreController = TextEditingController();
  final segundoNombreController = TextEditingController();
  final primerApellidoController = TextEditingController();
  final segundoApellidoController = TextEditingController();
  final telefonoController = TextEditingController();
  final correoController = TextEditingController();
  final personasACargoController = TextEditingController();

  int? tipoDocumentoId;
  int? apartamentoId;
  int? torreSeleccionada;
  String tipoOcupacion = 'propietario';
  DateTime? fechaInicio;
  bool isLoading = false;
  bool tieneNinos = false;
  bool tieneAdultoMayor = false;
  bool tieneDiscapacidad = false;

  // Getter para saber si tiene personas a cargo
  bool get tienePersonasACargo {
    final valor = int.tryParse(personasACargoController.text) ?? 0;
    return valor > 0;
  }

  @override
  void initState() {
    super.initState();
    // Listener para actualizar la UI cuando cambie personas a cargo
    personasACargoController.addListener(_onPersonasACargoChanged);
  }

  void _onPersonasACargoChanged() {
    setState(() {
      // Si ya no tiene personas a cargo, resetear los checkboxes
      if (!tienePersonasACargo) {
        tieneNinos = false;
        tieneAdultoMayor = false;
        tieneDiscapacidad = false;
      }
    });
  }

  @override
  void dispose() {
    personasACargoController.removeListener(_onPersonasACargoChanged);
    numeroDocumentoController.dispose();
    primerNombreController.dispose();
    segundoNombreController.dispose();
    primerApellidoController.dispose();
    segundoApellidoController.dispose();
    telefonoController.dispose();
    correoController.dispose();
    personasACargoController.dispose();
    super.dispose();
  }

  Future<void> _crearResidente() async {
    if (!_formKey.currentState!.validate()) return;

    // Mostrar alerta de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'Confirmar Registro',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '¿Está seguro de crear este residente?',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.orange.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'El número de documento "${numeroDocumentoController.text}" no podrá ser modificado después.',
                      style: TextStyle(
                        color: Colors.orange.shade900,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
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
              backgroundColor: Colors.teal,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    setState(() => isLoading = true);

    try {
      final body = json.encode({
        'apartamentosId': apartamentoId,
        'numeroDocumento': numeroDocumentoController.text,
        'tipoOcupacion': tipoOcupacion,
        'personasACargo': personasACargoController.text.isEmpty
            ? 0
            : int.parse(personasACargoController.text),
        'fechaInicio': fechaInicio?.toIso8601String().split('T')[0],
        'fechaFin': null,
        'tipoDocumentoId': tipoDocumentoId,
        'primerNombre': primerNombreController.text,
        'segundoNombre': segundoNombreController.text.isEmpty
            ? null
            : segundoNombreController.text,
        'primerApellido': primerApellidoController.text,
        'segundoApellido': segundoApellidoController.text.isEmpty
            ? null
            : segundoApellidoController.text,
        'telefono': telefonoController.text.isEmpty
            ? null
            : telefonoController.text,
        'correoElectronico': correoController.text.isEmpty
            ? null
            : correoController.text,
        'tieneNinos': tieneNinos ? 1 : 0,
        'tieneAdultoMayor': tieneAdultoMayor ? 1 : 0,
        'tieneDiscapacidad': tieneDiscapacidad ? 1 : 0,
      });

      final response = await http.post(
        Uri.parse('${LoginServe.baseUrl}/api/ocupante'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${LoginServe.token}',
        },
        body: body,
      );

      // DEBUG: Ver respuesta del servidor
      debugPrint('=== DEBUG CREAR RESIDENTE ===');
      debugPrint('Status code: ${response.statusCode}');
      debugPrint('Body enviado: $body');
      debugPrint('Respuesta: ${response.body}');
      debugPrint('=== FIN DEBUG ===');

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        if (mounted) setState(() => isLoading = false);
        return;
      }

      if (response.statusCode == 201) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Residente creado correctamente'),
              backgroundColor: Colors.green,
            ),
          );
          widget.onCreated();
        }
      } else {
        throw Exception('Error al crear residente');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: const BoxConstraints(maxWidth: 600),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Crear Residente',
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
                  const Divider(height: 32),

                  // Información de la ocupación
                  const Text(
                    'Información de la Ocupación',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.teal,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Dropdown de Torre
                  DropdownButtonFormField<int?>(
                    initialValue: torreSeleccionada,
                    decoration: const InputDecoration(
                      labelText: 'Torre *',
                      border: OutlineInputBorder(),
                    ),
                    isExpanded: true,
                    items: List.generate(10, (index) {
                      final torreId = index + 1;
                      final letra = String.fromCharCode(65 + index);
                      return DropdownMenuItem<int?>(
                        value: torreId,
                        child: Text('Torre $letra'),
                      );
                    }),
                    onChanged: (value) {
                      setState(() {
                        torreSeleccionada = value;
                        apartamentoId = null;
                      });
                    },
                    validator: (value) =>
                        value == null ? 'Seleccione una torre' : null,
                  ),
                  const SizedBox(height: 16),

                  // Dropdown de Apartamento (filtrado por torre)
                  Builder(
                    builder: (context) {
                      // DEBUG: Ver datos del backend
                      debugPrint('=== DEBUG CREAR RESIDENTE ===');
                      debugPrint(
                        'Torre seleccionada: $torreSeleccionada (tipo: ${torreSeleccionada.runtimeType})',
                      );
                      debugPrint(
                        'Total apartamentos recibidos: ${widget.apartamentos.length}',
                      );
                      if (widget.apartamentos.isNotEmpty) {
                        debugPrint(
                          'Primer apartamento: ${widget.apartamentos.first}',
                        );
                        debugPrint(
                          'Campos disponibles: ${widget.apartamentos.first.keys.toList()}',
                        );
                      }

                      // Filtrar apartamentos por torre seleccionada
                      final apartamentosFiltrados = torreSeleccionada == null
                          ? <Map<String, dynamic>>[]
                          : widget.apartamentos
                                .where(
                                  (apt) =>
                                      apt['torresId']?.toString() ==
                                      torreSeleccionada.toString(),
                                )
                                .toList();

                      debugPrint(
                        'Apartamentos filtrados para torre $torreSeleccionada: ${apartamentosFiltrados.length}',
                      );
                      if (apartamentosFiltrados.isNotEmpty) {
                        debugPrint(
                          'Primer apto filtrado: ${apartamentosFiltrados.first}',
                        );
                      } else {
                        debugPrint('NO HAY APARTAMENTOS PARA ESTA TORRE');
                        // Mostrar todos los torresId disponibles
                        final torresDisponibles = widget.apartamentos
                            .map((a) => a['torresId'])
                            .toSet();
                        debugPrint(
                          'Torres disponibles en datos: $torresDisponibles',
                        );
                      }

                      // Verificar si el apartamentoId actual existe en la lista filtrada
                      final valorActual =
                          apartamentosFiltrados.any((apt) {
                            final id = apt['IdApartamento'] is int
                                ? apt['IdApartamento']
                                : int.tryParse(
                                    apt['IdApartamento']?.toString() ?? '',
                                  );
                            return id == apartamentoId;
                          })
                          ? apartamentoId
                          : null;

                      debugPrint(
                        'apartamentoId: $apartamentoId, valorActual: $valorActual',
                      );
                      debugPrint('=== FIN DEBUG ===');

                      return DropdownButtonFormField<int?>(
                        key: ValueKey(
                          'apartamento-crear-${torreSeleccionada ?? "none"}',
                        ),
                        initialValue: valorActual,
                        decoration: const InputDecoration(
                          labelText: 'Apartamento *',
                          border: OutlineInputBorder(),
                        ),
                        isExpanded: true,
                        items: torreSeleccionada == null
                            ? [
                                const DropdownMenuItem<int?>(
                                  value: null,
                                  child: Text('Seleccione una torre primero'),
                                ),
                              ]
                            : [
                                const DropdownMenuItem<int?>(
                                  value: null,
                                  child: Text('Seleccione un apartamento'),
                                ),
                                ...apartamentosFiltrados.map<
                                  DropdownMenuItem<int?>
                                >((apt) {
                                  return DropdownMenuItem<int?>(
                                    value: apt['IdApartamento'] is int
                                        ? apt['IdApartamento']
                                        : int.tryParse(
                                            apt['IdApartamento']?.toString() ??
                                                '',
                                          ),
                                    child: Text(
                                      apt['numeroApartamento']?.toString() ??
                                          '',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }),
                              ],
                        onChanged: torreSeleccionada == null
                            ? null
                            : (value) => setState(() => apartamentoId = value),
                        validator: (value) =>
                            value == null ? 'Seleccione un apartamento' : null,
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    initialValue: tipoOcupacion,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Ocupación *',
                      border: OutlineInputBorder(),
                    ),
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(
                        value: 'propietario',
                        child: Text('Propietario'),
                      ),
                      DropdownMenuItem(
                        value: 'arrendatario',
                        child: Text('Arrendatario'),
                      ),
                    ],
                    onChanged: (value) =>
                        setState(() => tipoOcupacion = value!),
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: personasACargoController,
                    decoration: const InputDecoration(
                      labelText: 'Personas a Cargo',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value != null && value.isNotEmpty) {
                        final num = int.tryParse(value);
                        if (num == null || num < 0) {
                          return 'Debe ser un número válido';
                        }
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  ListTile(
                    title: const Text('Fecha de Inicio *'),
                    subtitle: Text(
                      fechaInicio != null
                          ? '${fechaInicio!.day}/${fechaInicio!.month}/${fechaInicio!.year}'
                          : 'No seleccionada',
                    ),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final fecha = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (fecha != null) {
                        setState(() => fechaInicio = fecha);
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                      side: BorderSide(color: Colors.grey.shade400),
                    ),
                  ),

                  const Divider(height: 32),

                  // Información personal
                  const Text(
                    'Información Personal',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.teal,
                    ),
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<int?>(
                    initialValue: tipoDocumentoId,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Documento *',
                      border: OutlineInputBorder(),
                    ),
                    isExpanded: true,
                    items: widget.tiposDocumento.map<DropdownMenuItem<int?>>((
                      tipo,
                    ) {
                      return DropdownMenuItem<int?>(
                        value: tipo['idTipoDocumento'],
                        child: Text(
                          tipo['nombreDocumento'],
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (value) =>
                        setState(() => tipoDocumentoId = value),
                    validator: (value) => value == null
                        ? 'Seleccione un tipo de documento'
                        : null,
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: numeroDocumentoController,
                    decoration: const InputDecoration(
                      labelText: 'Número de Documento *',
                      border: OutlineInputBorder(),
                    ),
                    inputFormatters: [getDocumentoFormatter(tipoDocumentoId)],
                    validator: (v) => validarDocumento(v, tipoDocumentoId),
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: primerNombreController,
                          decoration: const InputDecoration(
                            labelText: 'Primer Nombre *',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) => validarNombre(v),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: segundoNombreController,
                          decoration: const InputDecoration(
                            labelText: 'Segundo Nombre',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) =>
                              validarNombre(v, obligatorio: false),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: primerApellidoController,
                          decoration: const InputDecoration(
                            labelText: 'Primer Apellido *',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) => validarNombre(v),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: segundoApellidoController,
                          decoration: const InputDecoration(
                            labelText: 'Segundo Apellido',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) =>
                              validarNombre(v, obligatorio: false),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: telefonoController,
                    decoration: const InputDecoration(
                      labelText: 'Teléfono',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.phone,
                    inputFormatters: [TelefonoInputFormatter()],
                    validator: (v) => validarTelefono(v),
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: correoController,
                    decoration: const InputDecoration(
                      labelText: 'Correo Electrónico',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) => validarEmail(v),
                  ),

                  // Información adicional - Solo mostrar si tiene personas a cargo
                  if (tienePersonasACargo) ...[
                    const Divider(height: 32),

                    const Text(
                      'Información Adicional',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.teal,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Especifique las características de las ${personasACargoController.text} persona(s) a cargo',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 16),

                    CheckboxListTile(
                      title: const Text('¿Tiene niños?'),
                      subtitle: const Text('Menores de edad en el hogar'),
                      value: tieneNinos,
                      onChanged: (value) =>
                          setState(() => tieneNinos = value ?? false),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),

                    CheckboxListTile(
                      title: const Text('¿Tiene adultos mayores?'),
                      subtitle: const Text(
                        'Personas de la tercera edad en el hogar',
                      ),
                      value: tieneAdultoMayor,
                      onChanged: (value) =>
                          setState(() => tieneAdultoMayor = value ?? false),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),

                    CheckboxListTile(
                      title: const Text('¿Tiene persona con discapacidad?'),
                      subtitle: const Text(
                        'El residente o alguien en el hogar tiene discapacidad',
                      ),
                      value: tieneDiscapacidad,
                      onChanged: (value) =>
                          setState(() => tieneDiscapacidad = value ?? false),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Botones
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancelar'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: isLoading ? null : _crearResidente,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.teal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                            vertical: 16,
                          ),
                        ),
                        child: isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Crear Residente'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// DIÁLOGO EDITAR RESIDENTE
// ============================================================================

class EditarResidenteDialog extends StatefulWidget {
  final dynamic ocupante;
  final List<dynamic> apartamentos;
  final List<dynamic> tiposDocumento;
  final VoidCallback onUpdated;

  const EditarResidenteDialog({
    super.key,
    required this.ocupante,
    required this.apartamentos,
    required this.tiposDocumento,
    required this.onUpdated,
  });

  @override
  State<EditarResidenteDialog> createState() => _EditarResidenteDialogState();
}

class _EditarResidenteDialogState extends State<EditarResidenteDialog> {
  final _formKey = GlobalKey<FormState>();
  final numeroDocumentoController = TextEditingController();
  final primerNombreController = TextEditingController();
  final segundoNombreController = TextEditingController();
  final primerApellidoController = TextEditingController();
  final segundoApellidoController = TextEditingController();
  final telefonoController = TextEditingController();
  final correoController = TextEditingController();
  final personasACargoController = TextEditingController();

  int? tipoDocumentoId;
  int? apartamentoId;
  int? torreSeleccionada;
  String? tipoOcupacion;
  DateTime? fechaInicio;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();

    // Cargar datos actuales
    numeroDocumentoController.text =
        widget.ocupante['numeroDocumento']?.toString() ?? '';
    primerNombreController.text = widget.ocupante['primerNombre'] ?? '';
    segundoNombreController.text = widget.ocupante['segundoNombre'] ?? '';
    primerApellidoController.text = widget.ocupante['primerApellido'] ?? '';
    segundoApellidoController.text = widget.ocupante['segundoApellido'] ?? '';
    telefonoController.text = widget.ocupante['telefono'] ?? '';
    correoController.text = widget.ocupante['correoElectronico'] ?? '';
    personasACargoController.text =
        widget.ocupante['personasACargo']?.toString() ?? '0';

    tipoDocumentoId = widget.ocupante['tipoDocumentoId'];
    apartamentoId = widget.ocupante['apartamentosId'];
    torreSeleccionada = widget.ocupante['torresId'];
    tipoOcupacion = widget.ocupante['tipoOcupacion'];

    if (widget.ocupante['fechaInicio'] != null) {
      fechaInicio = DateTime.parse(
        widget.ocupante['fechaInicio'].toString().split('T')[0],
      );
    }
  }

  @override
  void dispose() {
    numeroDocumentoController.dispose();
    primerNombreController.dispose();
    segundoNombreController.dispose();
    primerApellidoController.dispose();
    segundoApellidoController.dispose();
    telefonoController.dispose();
    correoController.dispose();
    personasACargoController.dispose();
    super.dispose();
  }

  Future<void> _actualizarResidente() async {
    if (!_formKey.currentState!.validate()) return;

    // Mostrar alerta de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.edit, color: Colors.teal, size: 28),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'Confirmar Actualización',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '¿Está seguro de actualizar este residente?',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 8),
            Text(
              'Los cambios se guardarán permanentemente.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
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
              backgroundColor: Colors.teal,
              foregroundColor: Colors.white,
            ),
            child: const Text('Actualizar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    setState(() => isLoading = true);

    try {
      final body = json.encode({
        'apartamentosId': apartamentoId,
        'numeroDocumento': numeroDocumentoController.text,
        'tipoOcupacion': tipoOcupacion,
        'personasACargo': personasACargoController.text.isEmpty
            ? 0
            : int.parse(personasACargoController.text),
        'fechaInicio': fechaInicio?.toIso8601String().split('T')[0],
        'fechaFin': null,
        'tipoDocumentoId': tipoDocumentoId,
        'primerNombre': primerNombreController.text,
        'segundoNombre': segundoNombreController.text.isEmpty
            ? null
            : segundoNombreController.text,
        'primerApellido': primerApellidoController.text,
        'segundoApellido': segundoApellidoController.text.isEmpty
            ? null
            : segundoApellidoController.text,
        'telefono': telefonoController.text.isEmpty
            ? null
            : telefonoController.text,
        'correoElectronico': correoController.text.isEmpty
            ? null
            : correoController.text,
        'estadoId': widget.ocupante['estadoId'],
      });

      final response = await http.patch(
        Uri.parse(
          '${LoginServe.baseUrl}/api/ocupante/${widget.ocupante['idOcupante']}',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${LoginServe.token}',
        },
        body: body,
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        if (mounted) setState(() => isLoading = false);
        return;
      }

      if (response.statusCode == 200) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Residente actualizado correctamente'),
              backgroundColor: Colors.green,
            ),
          );
          widget.onUpdated();
        }
      } else {
        throw Exception('Error al actualizar residente');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: const BoxConstraints(maxWidth: 600),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Editar Residente',
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
                  const Divider(height: 32),

                  // Información de la ocupación
                  const Text(
                    'Información de la Ocupación',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.teal,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Dropdown de Torre
                  DropdownButtonFormField<int?>(
                    initialValue: torreSeleccionada,
                    decoration: const InputDecoration(
                      labelText: 'Torre *',
                      border: OutlineInputBorder(),
                    ),
                    isExpanded: true,
                    items: List.generate(10, (index) {
                      final torreId = index + 1;
                      final letra = String.fromCharCode(65 + index);
                      return DropdownMenuItem<int?>(
                        value: torreId,
                        child: Text('Torre $letra'),
                      );
                    }),
                    onChanged: (value) {
                      setState(() {
                        torreSeleccionada = value;
                        apartamentoId = null;
                      });
                    },
                    validator: (value) =>
                        value == null ? 'Seleccione una torre' : null,
                  ),
                  const SizedBox(height: 16),

                  // Dropdown de Apartamento (filtrado por torre)
                  Builder(
                    builder: (context) {
                      // Filtrar apartamentos por torre seleccionada
                      final apartamentosFiltrados = torreSeleccionada == null
                          ? <Map<String, dynamic>>[]
                          : widget.apartamentos
                                .where(
                                  (apt) =>
                                      apt['torresId']?.toString() ==
                                      torreSeleccionada.toString(),
                                )
                                .toList();

                      // Verificar si el apartamentoId actual existe en la lista filtrada
                      final valorActual =
                          apartamentosFiltrados.any((apt) {
                            final id = apt['IdApartamento'] is int
                                ? apt['IdApartamento']
                                : int.tryParse(
                                    apt['IdApartamento']?.toString() ?? '',
                                  );
                            return id == apartamentoId;
                          })
                          ? apartamentoId
                          : null;

                      return DropdownButtonFormField<int?>(
                        key: ValueKey(
                          'apartamento-editar-${torreSeleccionada ?? "none"}',
                        ),
                        initialValue: valorActual,
                        decoration: const InputDecoration(
                          labelText: 'Apartamento *',
                          border: OutlineInputBorder(),
                        ),
                        isExpanded: true,
                        items: torreSeleccionada == null
                            ? [
                                const DropdownMenuItem<int?>(
                                  value: null,
                                  child: Text('Seleccione una torre primero'),
                                ),
                              ]
                            : [
                                const DropdownMenuItem<int?>(
                                  value: null,
                                  child: Text('Seleccione un apartamento'),
                                ),
                                ...apartamentosFiltrados.map<
                                  DropdownMenuItem<int?>
                                >((apt) {
                                  return DropdownMenuItem<int?>(
                                    value: apt['IdApartamento'] is int
                                        ? apt['IdApartamento']
                                        : int.tryParse(
                                            apt['IdApartamento']?.toString() ??
                                                '',
                                          ),
                                    child: Text(
                                      apt['numeroApartamento']?.toString() ??
                                          '',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }),
                              ],
                        onChanged: torreSeleccionada == null
                            ? null
                            : (value) => setState(() => apartamentoId = value),
                        validator: (value) =>
                            value == null ? 'Seleccione un apartamento' : null,
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    initialValue: tipoOcupacion,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Ocupación *',
                      border: OutlineInputBorder(),
                    ),
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(
                        value: 'propietario',
                        child: Text('Propietario'),
                      ),
                      DropdownMenuItem(
                        value: 'arrendatario',
                        child: Text('Arrendatario'),
                      ),
                    ],
                    onChanged: (value) => setState(() => tipoOcupacion = value),
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: personasACargoController,
                    decoration: const InputDecoration(
                      labelText: 'Personas a Cargo',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value != null && value.isNotEmpty) {
                        final num = int.tryParse(value);
                        if (num == null || num < 0) {
                          return 'Debe ser un número válido';
                        }
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  ListTile(
                    title: const Text('Fecha de Inicio *'),
                    subtitle: Text(
                      fechaInicio != null
                          ? '${fechaInicio!.day}/${fechaInicio!.month}/${fechaInicio!.year}'
                          : 'No seleccionada',
                    ),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final fecha = await showDatePicker(
                        context: context,
                        initialDate: fechaInicio ?? DateTime.now(),
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (fecha != null) {
                        setState(() => fechaInicio = fecha);
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                      side: BorderSide(color: Colors.grey.shade400),
                    ),
                  ),

                  const Divider(height: 32),

                  // Información personal
                  const Text(
                    'Información Personal',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.teal,
                    ),
                  ),
                  const SizedBox(height: 16),

                  DropdownButtonFormField<int?>(
                    initialValue: tipoDocumentoId,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Documento *',
                      border: OutlineInputBorder(),
                    ),
                    isExpanded: true,
                    items: widget.tiposDocumento.map<DropdownMenuItem<int?>>((
                      tipo,
                    ) {
                      return DropdownMenuItem<int?>(
                        value: tipo['idTipoDocumento'],
                        child: Text(
                          tipo['nombreDocumento'],
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (value) =>
                        setState(() => tipoDocumentoId = value),
                    validator: (value) => value == null
                        ? 'Seleccione un tipo de documento'
                        : null,
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: numeroDocumentoController,
                    decoration: const InputDecoration(
                      labelText: 'Número de Documento *',
                      border: OutlineInputBorder(),
                    ),
                    enabled: false, // No permitir cambiar el documento
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: primerNombreController,
                          decoration: const InputDecoration(
                            labelText: 'Primer Nombre *',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) => validarNombre(v),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: segundoNombreController,
                          decoration: const InputDecoration(
                            labelText: 'Segundo Nombre',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) =>
                              validarNombre(v, obligatorio: false),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: primerApellidoController,
                          decoration: const InputDecoration(
                            labelText: 'Primer Apellido *',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) => validarNombre(v),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: segundoApellidoController,
                          decoration: const InputDecoration(
                            labelText: 'Segundo Apellido',
                            border: OutlineInputBorder(),
                          ),
                          inputFormatters: [NombreInputFormatter()],
                          validator: (v) =>
                              validarNombre(v, obligatorio: false),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: telefonoController,
                    decoration: const InputDecoration(
                      labelText: 'Teléfono',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.phone,
                    inputFormatters: [TelefonoInputFormatter()],
                    validator: (v) => validarTelefono(v),
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: correoController,
                    decoration: const InputDecoration(
                      labelText: 'Correo Electrónico',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) => validarEmail(v),
                  ),

                  const SizedBox(height: 24),

                  // Botones
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancelar'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: isLoading ? null : _actualizarResidente,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.teal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                            vertical: 16,
                          ),
                        ),
                        child: isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Actualizar'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// DIÁLOGO VER DETALLE RESIDENTE
class VerDetalleResidenteDialog extends StatelessWidget {
  final Map<String, dynamic> ocupante;

  const VerDetalleResidenteDialog({super.key, required this.ocupante});

  String torreNumeroALetra(dynamic torresId) {
    if (torresId == null) return 'N/A';
    final id = int.tryParse(torresId.toString());
    if (id == null || id < 1 || id > 10) return torresId.toString();
    return String.fromCharCode(65 + id - 1);
  }

  String _obtenerNombreTipoDocumento() {
    // El backend solo envía tipoDocumentoId, necesitamos mapear manualmente
    final tipoDocumentoId = ocupante['tipoDocumentoId'];
    if (tipoDocumentoId == null) return 'N/A';

    // Mapeo común de tipos de documento
    final tiposDocumento = {
      1: 'Cédula de Ciudadanía',
      2: 'Cédula de Extranjería',
      3: 'Pasaporte',
      4: 'Tarjeta de Identidad',
    };

    return tiposDocumento[tipoDocumentoId] ?? 'Tipo $tipoDocumentoId';
  }

  Widget _buildInfoRow(String label, String value, {IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 20, color: Colors.teal),
            const SizedBox(width: 8),
          ],
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(value, style: const TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.teal.shade50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.teal,
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...children,
        const SizedBox(height: 24),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final nombreCompleto =
        '${ocupante['primerNombre'] ?? ''} ${ocupante['segundoNombre'] ?? ''} ${ocupante['primerApellido'] ?? ''} ${ocupante['segundoApellido'] ?? ''}'
            .trim();

    return Dialog(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.7,
        constraints: const BoxConstraints(maxWidth: 800),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.teal.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.person,
                              size: 32,
                              color: Colors.teal,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'Detalles del Residente',
                                    style: TextStyle(
                                      fontSize:
                                          MediaQuery.of(context).size.width <
                                              400
                                          ? 18
                                          : 24,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Text(
                                  'ID: ${ocupante['idOcupante']}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(height: 32),

                // Información Personal
                _buildSection('Información Personal', [
                  _buildInfoRow(
                    'Nombre Completo:',
                    nombreCompleto,
                    icon: Icons.person,
                  ),
                  _buildInfoRow(
                    'Tipo Documento:',
                    _obtenerNombreTipoDocumento(),
                    icon: Icons.badge,
                  ),
                  _buildInfoRow(
                    'Número Documento:',
                    ocupante['numeroDocumento'] ?? 'N/A',
                    icon: Icons.numbers,
                  ),
                  _buildInfoRow(
                    'Teléfono:',
                    ocupante['telefono'] ?? 'No registrado',
                    icon: Icons.phone,
                  ),
                  _buildInfoRow(
                    'Correo Electrónico:',
                    ocupante['correoElectronico'] ?? 'No registrado',
                    icon: Icons.email,
                  ),
                ]),

                // Información de Residencia
                _buildSection('Información de Residencia', [
                  _buildInfoRow(
                    'Apartamento:',
                    ocupante['numeroApartamento']?.toString() ?? 'N/A',
                    icon: Icons.home,
                  ),
                  _buildInfoRow(
                    'Torre:',
                    ocupante['torresId'] != null
                        ? 'Torre ${torreNumeroALetra(ocupante['torresId'])}'
                        : 'N/A',
                    icon: Icons.apartment,
                  ),
                  _buildInfoRow(
                    'Tipo de Ocupación:',
                    ocupante['tipoOcupacion'] ?? 'N/A',
                    icon: Icons.workspace_premium,
                  ),
                  _buildInfoRow(
                    'Estado:',
                    ocupante['nombreEstado'] ?? 'N/A',
                    icon: Icons.flag,
                  ),
                  _buildInfoRow(
                    'Fecha de Inicio:',
                    ocupante['fechaInicio'] != null
                        ? ocupante['fechaInicio'].toString().split('T')[0]
                        : 'N/A',
                    icon: Icons.calendar_today,
                  ),
                  if (ocupante['fechaFin'] != null)
                    _buildInfoRow(
                      'Fecha de Fin:',
                      ocupante['fechaFin'].toString().split('T')[0],
                      icon: Icons.event_busy,
                    ),
                ]),

                // Información Familiar
                _buildSection('Información Familiar', [
                  _buildInfoRow(
                    'Personas a Cargo:',
                    ocupante['personasACargo']?.toString() ?? '0',
                    icon: Icons.groups,
                  ),
                  _buildInfoRow(
                    '¿Tiene Niños?',
                    ocupante['tieneNinos'] == 1 ? 'Sí' : 'No',
                    icon: Icons.child_care,
                  ),
                  _buildInfoRow(
                    '¿Tiene Adultos Mayores?',
                    ocupante['tieneAdultoMayor'] == 1 ? 'Sí' : 'No',
                    icon: Icons.elderly,
                  ),
                  _buildInfoRow(
                    '¿Tiene Persona con Discapacidad?',
                    ocupante['tieneDiscapacidad'] == 1 ? 'Sí' : 'No',
                    icon: Icons.accessible,
                  ),
                ]),

                // Botón cerrar
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    label: const Text('Cerrar'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.teal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
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
