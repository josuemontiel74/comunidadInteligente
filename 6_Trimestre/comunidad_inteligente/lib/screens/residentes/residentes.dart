import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

// Modelo actualizado con datos del JOIN
class Residente {
  final int? idOcupante;
  final int apartamentosId;
  final String numeroDocumento;
  final String tipoOcupacion;
  final int? personasACargo;
  final DateTime fechaInicio;
  final DateTime? fechaFin;
  final int? estadoId;
  
  // Datos de la persona
  final int? tipoDocumentoId;
  final String? primerNombre;
  final String? segundoNombre;
  final String? primerApellido;
  final String? segundoApellido;
  final String? telefono;
  final String? correoElectronico;
  
  // Datos del apartamento
  final int? idApartamento;
  final String? numeroApartamento;
  final int? torresId;
  
  // Datos del estado
  final String? nombreEstado;

  Residente({
    this.idOcupante,
    required this.apartamentosId,
    required this.numeroDocumento,
    required this.tipoOcupacion,
    this.personasACargo,
    required this.fechaInicio,
    this.fechaFin,
    this.estadoId,
    this.tipoDocumentoId,
    this.primerNombre,
    this.segundoNombre,
    this.primerApellido,
    this.segundoApellido,
    this.telefono,
    this.correoElectronico,
    this.idApartamento,
    this.numeroApartamento,
    this.torresId,
    this.nombreEstado,
  });

  factory Residente.fromJson(Map<String, dynamic> json) {
    return Residente(
      idOcupante: json['idOcupante'],
      apartamentosId: json['apartamentosId'] ?? 0,
      numeroDocumento: json['numeroDocumento'] ?? '',
      tipoOcupacion: json['tipoOcupacion'] ?? 'propietario',
      personasACargo: json['personasACargo'],
      fechaInicio: json['fechaInicio'] != null 
          ? DateTime.parse(json['fechaInicio'].toString().split('T')[0]) 
          : DateTime.now(),
      fechaFin: json['fechaFin'] != null 
          ? DateTime.parse(json['fechaFin'].toString().split('T')[0]) 
          : null,
      estadoId: json['estadoId'],
      // Datos de persona
      tipoDocumentoId: json['tipoDocumentoId'],
      primerNombre: json['primerNombre']?.toString().trim(),
      segundoNombre: json['segundoNombre']?.toString().trim(),
      primerApellido: json['primerApellido']?.toString().trim(),
      segundoApellido: json['segundoApellido']?.toString().trim(),
      telefono: json['telefono']?.toString().trim(),
      correoElectronico: json['correoElectronico']?.toString().trim(),
      // Datos de apartamento
      idApartamento: json['idApartamento'],
      numeroApartamento: json['numeroApartamento']?.toString().trim(),
      torresId: json['torresId'],
      // Datos de estado
      nombreEstado: json['nombreEstado']?.toString().trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      // Datos del ocupante
      'apartamentosId': apartamentosId,
      'numeroDocumento': numeroDocumento,
      'tipoOcupacion': tipoOcupacion,
      'personasACargo': personasACargo,
      'fechaInicio': DateFormat('yyyy-MM-dd').format(fechaInicio),
      'fechaFin': fechaFin != null ? DateFormat('yyyy-MM-dd').format(fechaFin!) : null,
      'estadoId': estadoId ?? 5,
      
      // Datos de la persona (para crear/actualizar)
      if (tipoDocumentoId != null) 'tipoDocumentoId': tipoDocumentoId,
      if (primerNombre != null) 'primerNombre': primerNombre,
      if (segundoNombre != null) 'segundoNombre': segundoNombre,
      if (primerApellido != null) 'primerApellido': primerApellido,
      if (segundoApellido != null) 'segundoApellido': segundoApellido,
      if (telefono != null) 'telefono': telefono,
      if (correoElectronico != null) 'correoElectronico': correoElectronico,
    };
  }

  // Método helper para obtener el nombre completo
  String get nombreCompleto {
    final partes = [
      primerNombre?.trim(),
      segundoNombre?.trim(),
      primerApellido?.trim(),
      segundoApellido?.trim(),
    ].where((parte) => parte != null && parte.isNotEmpty);
    
    if (partes.isEmpty) {
      return 'Sin nombre (Doc: $numeroDocumento)';
    }
    
    return partes.join(' ');
  }

  // Método helper para obtener las iniciales
  String get iniciales {
    if (primerNombre != null && primerNombre!.isNotEmpty) {
      String inicial = primerNombre![0].toUpperCase();
      if (primerApellido != null && primerApellido!.isNotEmpty) {
        inicial += primerApellido![0].toUpperCase();
      }
      return inicial;
    }
    return numeroDocumento.isNotEmpty ? numeroDocumento[0].toUpperCase() : '?';
  }

  // Método helper para obtener el display del apartamento
  String get apartamentoDisplay {
    if (numeroApartamento != null && numeroApartamento!.isNotEmpty) {
      return '$numeroApartamento (ID: ${idApartamento ?? apartamentosId})';
    }
    return 'Apto ID: ${idApartamento ?? apartamentosId}';
  }

  // Método para verificar si está finalizado
  bool get estaFinalizado {
    return nombreEstado?.toLowerCase() == 'finalizada' || 
           nombreEstado?.toLowerCase() == 'inactivo' ||
           estadoId == 6;
  }
}

// Servicio API
class ResidentesService {
  final String baseUrl = 'http://localhost:3001/api';
  String? token;

  ResidentesService({this.token});

  Map<String, String> get headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<List<Residente>> listarResidentes() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/ocupante'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        List<dynamic> residentes = [];
        
        if (data is List) {
          residentes = data;
        } else if (data is Map && data.containsKey('body')) {
          residentes = data['body'] is List ? data['body'] : [];
        } else if (data is Map && data.containsKey('data')) {
          residentes = data['data'] is List ? data['data'] : [];
        }
        
        return residentes
            .map((item) => Residente.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Error al cargar residentes: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en listarResidentes: $e');
      rethrow;
    }
  }

  Future<Residente> crearResidente(Residente residente) async {
    try {
      print('Enviando datos: ${json.encode(residente.toJson())}'); // Debug
      
      final response = await http.post(
        Uri.parse('$baseUrl/ocupante'),
        headers: headers,
        body: json.encode(residente.toJson()),
      );

      print('Status Code: ${response.statusCode}'); // Debug
      print('Response Body: ${response.body}'); // Debug

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data.containsKey('ocupante')) {
          return Residente.fromJson(data['ocupante']);
        } else if (data.containsKey('message')) {
          return residente;
        }
        return residente;
      } else if (response.statusCode == 401) {
        // Token expirado o inválido
        final errorData = json.decode(response.body);
        throw Exception('Sesión expirada: ${errorData['message'] ?? 'Por favor, inicia sesión nuevamente'}');
      } else {
        final errorData = json.decode(response.body);
        final errorMessage = errorData['message'] ?? errorData['error'] ?? 'Error desconocido';
        throw Exception('Error (${response.statusCode}): $errorMessage');
      }
    } catch (e) {
      print('Error completo: $e');
      rethrow;
    }
  }

  Future<Residente> obtenerResidentePorId(int id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/ocupante/$id'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return Residente.fromJson(json.decode(response.body));
    } else {
      throw Exception('Error al obtener residente');
    }
  }

  Future<void> actualizarResidente(int id, Residente residente) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/ocupante/$id'),
      headers: headers,
      body: json.encode(residente.toJson()),
    );

    if (response.statusCode != 200) {
      throw Exception('Error al actualizar residente');
    }
  }

  Future<void> finalizarResidente(int id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/ocupante/$id'),
      headers: headers,
    );

    if (response.statusCode != 200) {
      throw Exception('Error al finalizar residente');
    }
  }
}

// Pantalla Principal actualizada
class ResidentesScreen extends StatefulWidget {
  final String? token;

  const ResidentesScreen({Key? key, this.token}) : super(key: key);

  @override
  State<ResidentesScreen> createState() => _ResidentesScreenState();
}

class _ResidentesScreenState extends State<ResidentesScreen> {
  late ResidentesService _service;
  List<Residente> _residentes = [];
  List<Residente> _residentesFiltrados = [];
  bool _isLoading = false;
  final TextEditingController _searchController = TextEditingController();
  String _filtroEstado = 'todos'; // 'todos', 'activos', 'finalizados'

  @override
  void initState() {
    super.initState();
    _service = ResidentesService(token: widget.token);
    _cargarResidentes();
    _searchController.addListener(_filtrarResidentes);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filtrarResidentes() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _residentesFiltrados = _residentes.where((residente) {
        // Filtro por estado
        if (_filtroEstado == 'activos' && residente.estaFinalizado) return false;
        if (_filtroEstado == 'finalizados' && !residente.estaFinalizado) return false;
        
        // Si no hay búsqueda, mostrar todos (según filtro de estado)
        if (query.isEmpty) return true;
        
        // Búsqueda por múltiples campos
        final nombre = residente.nombreCompleto.toLowerCase();
        final documento = residente.numeroDocumento.toLowerCase();
        final apartamentoId = residente.apartamentosId.toString();
        final numeroApto = residente.numeroApartamento?.toLowerCase() ?? '';
        final tipo = residente.tipoOcupacion.toLowerCase();
        final telefono = residente.telefono?.toLowerCase() ?? '';
        final correo = residente.correoElectronico?.toLowerCase() ?? '';
        final torre = residente.torresId?.toString() ?? '';
        
        return nombre.contains(query) ||
               documento.contains(query) ||
               apartamentoId.contains(query) ||
               numeroApto.contains(query) ||
               tipo.contains(query) ||
               telefono.contains(query) ||
               correo.contains(query) ||
               torre.contains(query);
      }).toList();
    });
  }

  Future<void> _cargarResidentes() async {
    setState(() => _isLoading = true);
    try {
      final residentes = await _service.listarResidentes();
      setState(() {
        _residentes = residentes;
        _residentesFiltrados = residentes;
      });
      _filtrarResidentes(); // Aplicar filtros después de cargar
    } catch (e) {
      _mostrarError('Error al cargar residentes: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje), backgroundColor: Colors.red),
    );
  }

  void _mostrarExito(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje), backgroundColor: Colors.green),
    );
  }

  Future<void> _finalizarResidente(int id) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar'),
        content: const Text('¿Desea finalizar este residente?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Finalizar'),
          ),
        ],
      ),
    );

    if (confirmar == true) {
      try {
        await _service.finalizarResidente(id);
        _mostrarExito('Residente finalizado correctamente');
        _cargarResidentes();
      } catch (e) {
        _mostrarError('Error al finalizar residente: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Residentes'),
        backgroundColor: Colors.blue,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(120),
          child: Column(
            children: [
              // Barra de búsqueda
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Buscar por nombre, documento, apartamento...',
                    prefixIcon: const Icon(Icons.search, color: Colors.white70),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: Colors.white70),
                            onPressed: () {
                              _searchController.clear();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.2),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                    hintStyle: const TextStyle(color: Colors.white70),
                  ),
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              // Filtros por estado
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                child: Row(
                  children: [
                    Expanded(
                      child: FilterChip(
                        label: Text('Todos (${_residentes.length})'),
                        selected: _filtroEstado == 'todos',
                        onSelected: (selected) {
                          setState(() {
                            _filtroEstado = 'todos';
                            _filtrarResidentes();
                          });
                        },
                        selectedColor: Colors.white.withOpacity(0.3),
                        labelStyle: TextStyle(
                          color: _filtroEstado == 'todos' ? const Color.fromARGB(255, 15, 15, 15) : const Color.fromARGB(179, 15, 15, 15),
                          fontWeight: _filtroEstado == 'todos' ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: FilterChip(
                        label: Text('Activos (${_residentes.where((r) => !r.estaFinalizado).length})'),
                        selected: _filtroEstado == 'activos',
                        onSelected: (selected) {
                          setState(() {
                            _filtroEstado = 'activos';
                            _filtrarResidentes();
                          });
                        },
                        selectedColor: Colors.green.withOpacity(0.3),
                        labelStyle: TextStyle(
                          color: _filtroEstado == 'activos' ? const Color.fromARGB(255, 15, 15, 15) : const Color.fromARGB(179, 15, 15, 15),
                          fontWeight: _filtroEstado == 'activos' ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: FilterChip(
                        label: Text('Finalizados (${_residentes.where((r) => r.estaFinalizado).length})'),
                        selected: _filtroEstado == 'finalizados',
                        onSelected: (selected) {
                          setState(() {
                            _filtroEstado = 'finalizados';
                            _filtrarResidentes();
                          });
                        },
                        selectedColor: Colors.red.withOpacity(0.3),
                        labelStyle: TextStyle(
                          color: _filtroEstado == 'finalizados' ? const Color.fromARGB(255, 17, 17, 17) : const Color.fromARGB(179, 15, 15, 15),
                          fontWeight: _filtroEstado == 'finalizados' ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _cargarResidentes,
              child: _residentesFiltrados.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _searchController.text.isNotEmpty
                                ? Icons.search_off
                                : Icons.people_outline,
                            size: 80,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _searchController.text.isNotEmpty
                                ? 'No se encontraron resultados'
                                : 'No hay residentes registrados',
                            style: const TextStyle(fontSize: 18, color: Colors.grey),
                          ),
                          if (_searchController.text.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () => _searchController.clear(),
                              child: const Text('Limpiar búsqueda'),
                            ),
                          ],
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _residentesFiltrados.length,
                      itemBuilder: (context, index) {
                        final residente = _residentesFiltrados[index];
                        final estaFinalizado = residente.estaFinalizado;
                        
                        return Opacity(
                          opacity: estaFinalizado ? 0.6 : 1.0,
                          child: Card(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            color: estaFinalizado ? Colors.grey[200] : null,
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: estaFinalizado
                                    ? Colors.grey
                                    : (residente.tipoOcupacion == 'propietario'
                                        ? Colors.blue
                                        : Colors.orange),
                                child: Text(
                                  residente.iniciales,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              title: Text(
                                residente.nombreCompleto,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  decoration: estaFinalizado 
                                      ? TextDecoration.lineThrough 
                                      : null,
                                  color: estaFinalizado ? Colors.grey[600] : null,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.apartment, 
                                          size: 16, 
                                          color: estaFinalizado ? Colors.grey : null),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          residente.torresId != null
                                              ? '${residente.apartamentoDisplay} | Torre: ${residente.torresId}'
                                              : residente.apartamentoDisplay,
                                          style: TextStyle(
                                            color: estaFinalizado ? Colors.grey[600] : null,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Icon(Icons.badge, 
                                          size: 16,
                                          color: estaFinalizado ? Colors.grey : null),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Doc: ${residente.numeroDocumento}',
                                        style: TextStyle(
                                          color: estaFinalizado ? Colors.grey[600] : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Icon(Icons.person_outline, 
                                          size: 16,
                                          color: estaFinalizado ? Colors.grey : null),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Tipo: ${residente.tipoOcupacion}',
                                        style: TextStyle(
                                          color: estaFinalizado ? Colors.grey[600] : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (residente.nombreEstado != null)
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.circle,
                                          size: 12,
                                          color: estaFinalizado
                                              ? Colors.grey
                                              : (residente.nombreEstado!.toLowerCase() == 'activa'
                                                  ? Colors.green
                                                  : Colors.grey),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Estado: ${residente.nombreEstado}',
                                          style: TextStyle(
                                            color: estaFinalizado ? Colors.grey[600] : null,
                                          ),
                                        ),
                                      ],
                                    ),
                                  if (residente.telefono != null)
                                    Row(
                                      children: [
                                        Icon(Icons.phone, 
                                            size: 16,
                                            color: estaFinalizado ? Colors.grey : null),
                                        const SizedBox(width: 4),
                                        Text(
                                          residente.telefono!,
                                          style: TextStyle(
                                            color: estaFinalizado ? Colors.grey[600] : null,
                                          ),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: Icon(
                                      Icons.edit,
                                      color: estaFinalizado ? Colors.orange : Colors.blue,
                                    ),
                                    onPressed: () async {
                                      final result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => FormularioResidenteScreen(
                                            service: _service,
                                            residente: residente,
                                          ),
                                        ),
                                      );
                                      if (result == true) _cargarResidentes();
                                    },
                                  ),
                                  // Solo mostrar el botón de finalizar si NO está finalizado
                                  if (!estaFinalizado)
                                    IconButton(
                                      icon: const Icon(Icons.close, color: Colors.red),
                                      onPressed: () => _finalizarResidente(
                                        residente.idOcupante!,
                                      ),
                                    ),
                                ],
                              ),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => DetalleResidenteScreen(
                                      residente: residente,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => FormularioResidenteScreen(service: _service),
            ),
          );
          if (result == true) _cargarResidentes();
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

// Pantalla de Detalle actualizada
class DetalleResidenteScreen extends StatelessWidget {
  final Residente residente;

  const DetalleResidenteScreen({Key? key, required this.residente})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final estaFinalizado = residente.estaFinalizado;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle del Residente'),
        backgroundColor: Colors.blue,
        actions: [
          if (estaFinalizado)
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'FINALIZADO',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Información Personal
            _buildSection('Información Personal', [
              _buildInfoRow('Nombre Completo', residente.nombreCompleto),
              _buildInfoRow('Número Documento', residente.numeroDocumento),
              if (residente.telefono != null)
                _buildInfoRow('Teléfono', residente.telefono!),
              if (residente.correoElectronico != null)
                _buildInfoRow('Correo Electrónico', residente.correoElectronico!),
            ]),
            const SizedBox(height: 20),
            
            // Información de Ocupación
            _buildSection('Información de Ocupación', [
              _buildInfoRow('Tipo Ocupación', residente.tipoOcupacion),
              _buildInfoRow('Personas a cargo',
                  residente.personasACargo?.toString() ?? '0'),
              _buildInfoRow('Fecha Inicio',
                  DateFormat('dd/MM/yyyy').format(residente.fechaInicio)),
              if (residente.fechaFin != null)
                _buildInfoRow('Fecha Fin',
                    DateFormat('dd/MM/yyyy').format(residente.fechaFin!)),
              if (residente.nombreEstado != null)
                _buildInfoRow('Estado', residente.nombreEstado!),
            ]),
            const SizedBox(height: 20),
            
            // Información del Apartamento
            _buildSection('Información del Apartamento', [
              _buildInfoRow('Apartamento', residente.apartamentoDisplay),
              if (residente.torresId != null)
                _buildInfoRow('Torre', 'Torre ${residente.torresId}'),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String titulo, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          titulo,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
        const Divider(thickness: 2),
        ...children,
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 150,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Colors.black54),
            ),
          ),
        ],
      ),
    );
  }
}

// Formulario Crear/Editar
class FormularioResidenteScreen extends StatefulWidget {
  final ResidentesService service;
  final Residente? residente;

  const FormularioResidenteScreen({
    Key? key,
    required this.service,
    this.residente,
  }) : super(key: key);

  @override
  State<FormularioResidenteScreen> createState() =>
      _FormularioResidenteScreenState();
}

class _FormularioResidenteScreenState extends State<FormularioResidenteScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Controladores para ocupante
  final _numeroDocumentoCtrl = TextEditingController();
  final _personasACargoCtrl = TextEditingController();
  final _apartamentoIdCtrl = TextEditingController();
  
  // Controladores para datos de persona
  final _primerNombreCtrl = TextEditingController();
  final _segundoNombreCtrl = TextEditingController();
  final _primerApellidoCtrl = TextEditingController();
  final _segundoApellidoCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();
  final _correoCtrl = TextEditingController();

  String _tipoOcupacion = 'propietario';
  int _tipoDocumentoId = 1;
  int _estadoId = 5; // Variable numérica en lugar de TextEditingController
  DateTime _fechaInicio = DateTime.now();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.residente != null) {
      _cargarDatos();
    }
  }

  void _cargarDatos() {
    final r = widget.residente!;
    // Datos de ocupante
    _numeroDocumentoCtrl.text = r.numeroDocumento;
    _personasACargoCtrl.text = r.personasACargo?.toString() ?? '';
    _apartamentoIdCtrl.text = r.apartamentosId.toString();
    _estadoId = r.estadoId ?? 5; // Usar variable numérica
    _tipoOcupacion = r.tipoOcupacion;
    _fechaInicio = r.fechaInicio;
    
    // Datos de persona - validar que el tipoDocumentoId esté en el rango válido
    final tipoDoc = r.tipoDocumentoId;
    if (tipoDoc != null && tipoDoc >= 1 && tipoDoc <= 5) {
      _tipoDocumentoId = tipoDoc;
    } else {
      _tipoDocumentoId = 1; // Default a CC si no es válido
    }
    
    _primerNombreCtrl.text = r.primerNombre ?? '';
    _segundoNombreCtrl.text = r.segundoNombre ?? '';
    _primerApellidoCtrl.text = r.primerApellido ?? '';
    _segundoApellidoCtrl.text = r.segundoApellido ?? '';
    _telefonoCtrl.text = r.telefono ?? '';
    _correoCtrl.text = r.correoElectronico ?? '';
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final residente = Residente(
        apartamentosId: int.parse(_apartamentoIdCtrl.text),
        numeroDocumento: _numeroDocumentoCtrl.text,
        tipoOcupacion: _tipoOcupacion,
        personasACargo: _personasACargoCtrl.text.isNotEmpty
            ? int.parse(_personasACargoCtrl.text)
            : null,
        fechaInicio: _fechaInicio,
        estadoId: _estadoId, // Usar variable numérica directamente
        // Datos de persona
        tipoDocumentoId: _tipoDocumentoId,
        primerNombre: _primerNombreCtrl.text.isNotEmpty ? _primerNombreCtrl.text : null,
        segundoNombre: _segundoNombreCtrl.text.isNotEmpty ? _segundoNombreCtrl.text : null,
        primerApellido: _primerApellidoCtrl.text.isNotEmpty ? _primerApellidoCtrl.text : null,
        segundoApellido: _segundoApellidoCtrl.text.isNotEmpty ? _segundoApellidoCtrl.text : null,
        telefono: _telefonoCtrl.text.isNotEmpty ? _telefonoCtrl.text : null,
        correoElectronico: _correoCtrl.text.isNotEmpty ? _correoCtrl.text : null,
      );

      if (widget.residente == null) {
        await widget.service.crearResidente(residente);
      } else {
        await widget.service.actualizarResidente(
          widget.residente!.idOcupante!,
          residente,
        );
      }

      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.residente == null ? 'Nuevo Residente' : 'Editar Residente'),
        backgroundColor: Colors.blue,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Sección: Datos del Documento
                  const Text(
                    'Datos del Documento',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                  const Divider(thickness: 2),
                  const SizedBox(height: 8),
                  
                  DropdownButtonFormField<int>(
                    value: _tipoDocumentoId,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Documento *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.badge),
                    ),
                    items: const [
                      DropdownMenuItem(value: 1, child: Text('Cédula de Ciudadanía')),
                      DropdownMenuItem(value: 2, child: Text('Cédula de Extranjería')),
                      DropdownMenuItem(value: 3, child: Text('Pasaporte')),
                      DropdownMenuItem(value: 4, child: Text('Permiso Especial de Permanencia (PEP)')),
                      DropdownMenuItem(value: 5, child: Text('Permiso por Protección Temporal (PPT)')),
                    ],
                    onChanged: (v) => setState(() => _tipoDocumentoId = v!),
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _numeroDocumentoCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Número de Documento *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.fingerprint),
                    ),
                    validator: (v) => v?.isEmpty ?? true ? 'Campo requerido' : null,
                  ),
                  const SizedBox(height: 24),
                  
                  // Sección: Datos Personales
                  const Text(
                    'Datos Personales',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                  const Divider(thickness: 2),
                  const SizedBox(height: 8),
                  
                  TextFormField(
                    controller: _primerNombreCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Primer Nombre *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (v) => v?.isEmpty ?? true ? 'Campo requerido' : null,
                    textCapitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _segundoNombreCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Segundo Nombre',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _primerApellidoCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Primer Apellido *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (v) => v?.isEmpty ?? true ? 'Campo requerido' : null,
                    textCapitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _segundoApellidoCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Segundo Apellido',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _telefonoCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Teléfono',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                      hintText: 'Ej: 3001112233',
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _correoCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Correo Electrónico',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.email),
                      hintText: 'ejemplo@correo.com',
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) {
                      if (v != null && v.isNotEmpty && !v.contains('@')) {
                        return 'Correo inválido';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Sección: Datos de Ocupación
                  const Text(
                    'Datos de Ocupación',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                  const Divider(thickness: 2),
                  const SizedBox(height: 8),
                  
                  TextFormField(
                    controller: _apartamentoIdCtrl,
                    decoration: const InputDecoration(
                      labelText: 'ID Apartamento *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.apartment),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (v) => v?.isEmpty ?? true ? 'Campo requerido' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  DropdownButtonFormField<String>(
                    value: _tipoOcupacion,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Ocupación *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.home_work),
                    ),
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
                    onChanged: (v) => setState(() => _tipoOcupacion = v!),
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _personasACargoCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Personas a Cargo',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.family_restroom),
                      hintText: '0',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  
                  DropdownButtonFormField<int>(
                    value: _estadoId,
                    decoration: const InputDecoration(
                      labelText: 'Estado *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.toggle_on),
                    ),
                    items: const [
                      DropdownMenuItem(value: 5, child: Text('Activo')),
                      DropdownMenuItem(value: 6, child: Text('Inactivo')),
                    ],
                    onChanged: (v) => setState(() => _estadoId = v!),
                  ),
                  const SizedBox(height: 16),
                  
                  ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: BorderSide(color: Colors.grey.shade400),
                    ),
                    leading: const Icon(Icons.calendar_today, color: Colors.blue),
                    title: const Text('Fecha de Inicio'),
                    subtitle: Text(DateFormat('dd/MM/yyyy').format(_fechaInicio)),
                    trailing: const Icon(Icons.edit),
                    onTap: () async {
                      final fecha = await showDatePicker(
                        context: context,
                        initialDate: _fechaInicio,
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (fecha != null) {
                        setState(() => _fechaInicio = fecha);
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  ElevatedButton(
                    onPressed: _guardar,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      backgroundColor: Colors.blue,
                    ),
                    child: Text(
                      widget.residente == null ? 'Crear Residente' : 'Actualizar',
                      style: const TextStyle(fontSize: 16, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _numeroDocumentoCtrl.dispose();
    _personasACargoCtrl.dispose();
    _apartamentoIdCtrl.dispose();
    _primerNombreCtrl.dispose();
    _segundoNombreCtrl.dispose();
    _primerApellidoCtrl.dispose();
    _segundoApellidoCtrl.dispose();
    _telefonoCtrl.dispose();
    _correoCtrl.dispose();
    super.dispose();
  }
}