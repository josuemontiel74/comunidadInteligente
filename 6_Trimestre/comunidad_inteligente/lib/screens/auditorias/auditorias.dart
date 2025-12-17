import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../main.dart';

class Auditorias extends StatefulWidget {
  const Auditorias({super.key});

  @override
  State<Auditorias> createState() => _AuditoriasState();
}

class _AuditoriasState extends State<Auditorias> {
  List<dynamic> auditorias = [];
  bool isLoading = true;
  String filtroModulo = 'todos'; // 'todos', 'usuarios', 'residentes', etc.
  String filtroAccion = 'todos'; // 'todos', 'crear', 'editar', 'eliminar'
  String busquedaUsuario = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargarAuditorias();
  }

  Future<void> _cargarAuditorias() async {
    setState(() => isLoading = true);

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/auditorias'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        setState(() {
          auditorias = responseData['data'] ?? [];
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
        _mostrarError('Error al cargar auditorías');
      }
    } catch (e) {
      setState(() => isLoading = false);
      _mostrarError('Error al cargar auditorías: $e');
    }
  }

  List<dynamic> get auditoriasFiltradas {
    return auditorias.where((auditoria) {
      final cumpleFiltroModulo =
          filtroModulo == 'todos' ||
          auditoria['modulo']?.toString().toLowerCase() ==
              filtroModulo.toLowerCase();

      final cumpleFiltroAccion =
          filtroAccion == 'todos' ||
          auditoria['accion']?.toString().toLowerCase() ==
              filtroAccion.toLowerCase();

      final cumpleBusqueda =
          busquedaUsuario.isEmpty ||
          (auditoria['usuario']?.toString().toLowerCase().contains(
                busquedaUsuario.toLowerCase(),
              ) ??
              false);

      return cumpleFiltroModulo && cumpleFiltroAccion && cumpleBusqueda;
    }).toList();
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje), backgroundColor: Colors.red),
    );
  }

  void _mostrarDetalleAuditoria(dynamic auditoria) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        title: Row(
          children: [
            Icon(Icons.info_outline, color: Colors.indigo),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Detalle de Auditoría',
                style: TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDetalleItem(
                'ID',
                auditoria['idAuditoria']?.toString() ?? 'N/A',
              ),
              _buildDetalleItem(
                'Usuario',
                auditoria['usuario']?.toString() ?? 'N/A',
              ),
              _buildDetalleItem(
                'Módulo',
                auditoria['modulo']?.toString() ?? 'N/A',
              ),
              _buildDetalleItem(
                'Acción',
                auditoria['accion']?.toString() ?? 'N/A',
              ),
              _buildDetalleItem(
                'Descripción',
                auditoria['descripcion']?.toString() ?? 'N/A',
              ),
              _buildDetalleItem(
                'Fecha',
                auditoria['fecha']?.toString() ?? 'N/A',
              ),
              _buildDetalleItem('IP', auditoria['ip']?.toString() ?? 'N/A'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetalleItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.indigo,
              fontSize: 14,
            ),
          ),
          SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 14)),
          Divider(),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auditoriasMostrar = auditoriasFiltradas;

    return Scaffold(
      appBar: AppBar(
        title: Text('Auditorías del Sistema'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _cargarAuditorias,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filtros y búsqueda
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Column(
              children: [
                // Barra de búsqueda
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    labelText: 'Buscar por usuario',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (value) {
                    setState(() {
                      busquedaUsuario = value;
                    });
                  },
                ),
                SizedBox(height: 16),
                // Filtros
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: filtroModulo,
                        decoration: InputDecoration(
                          labelText: 'Módulo',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        items: [
                          DropdownMenuItem(
                            value: 'todos',
                            child: Text('Todos'),
                          ),
                          DropdownMenuItem(
                            value: 'usuarios',
                            child: Text('Usuarios'),
                          ),
                          DropdownMenuItem(
                            value: 'residentes',
                            child: Text('Residentes'),
                          ),
                          DropdownMenuItem(
                            value: 'paqueteria',
                            child: Text('Paquetería'),
                          ),
                          DropdownMenuItem(
                            value: 'visitas',
                            child: Text('Visitas'),
                          ),
                          DropdownMenuItem(
                            value: 'parqueaderos',
                            child: Text('Parqueaderos'),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            filtroModulo = value ?? 'todos';
                          });
                        },
                      ),
                    ),
                    SizedBox(width: 16),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: filtroAccion,
                        decoration: InputDecoration(
                          labelText: 'Acción',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        items: [
                          DropdownMenuItem(
                            value: 'todos',
                            child: Text('Todas'),
                          ),
                          DropdownMenuItem(
                            value: 'crear',
                            child: Text('Crear'),
                          ),
                          DropdownMenuItem(
                            value: 'editar',
                            child: Text('Editar'),
                          ),
                          DropdownMenuItem(
                            value: 'eliminar',
                            child: Text('Eliminar'),
                          ),
                          DropdownMenuItem(
                            value: 'consultar',
                            child: Text('Consultar'),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            filtroAccion = value ?? 'todos';
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Lista de auditorías
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : auditoriasMostrar.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history, size: 80, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No se encontraron auditorías',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: EdgeInsets.all(16),
                    itemCount: auditoriasMostrar.length,
                    itemBuilder: (context, index) {
                      final auditoria = auditoriasMostrar[index];
                      return Card(
                        elevation: 3,
                        margin: EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: ListTile(
                          contentPadding: EdgeInsets.all(16),
                          leading: CircleAvatar(
                            backgroundColor: _getColorAccion(
                              auditoria['accion'],
                            ),
                            child: Icon(
                              _getIconAccion(auditoria['accion']),
                              color: Colors.white,
                            ),
                          ),
                          title: Text(
                            '${auditoria['usuario'] ?? 'Usuario desconocido'} - ${auditoria['modulo'] ?? 'Módulo'}',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(height: 4),
                              Text(
                                auditoria['descripcion'] ?? 'Sin descripción',
                              ),
                              SizedBox(height: 4),
                              Text(
                                auditoria['fecha']?.toString() ??
                                    'Fecha no disponible',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          trailing: IconButton(
                            icon: Icon(Icons.visibility, color: Colors.indigo),
                            onPressed: () =>
                                _mostrarDetalleAuditoria(auditoria),
                            tooltip: 'Ver detalle',
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Color _getColorAccion(dynamic accion) {
    final accionStr = accion?.toString().toLowerCase() ?? '';
    switch (accionStr) {
      case 'crear':
        return Colors.green;
      case 'editar':
        return Colors.orange;
      case 'eliminar':
        return Colors.red;
      case 'consultar':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData _getIconAccion(dynamic accion) {
    final accionStr = accion?.toString().toLowerCase() ?? '';
    switch (accionStr) {
      case 'crear':
        return Icons.add_circle;
      case 'editar':
        return Icons.edit;
      case 'eliminar':
        return Icons.delete;
      case 'consultar':
        return Icons.search;
      default:
        return Icons.history;
    }
  }
}
