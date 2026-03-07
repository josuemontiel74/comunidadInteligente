import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import './models/auditoria_model.dart';
import './services/auditoria_service.dart';
import '../../main.dart';

class AuditoriaScreen extends StatefulWidget {
  const AuditoriaScreen({super.key});

  @override
  State<AuditoriaScreen> createState() => _AuditoriaScreenState();
}

class _AuditoriaScreenState extends State<AuditoriaScreen> {
  final AuditoriaService _auditoriaService = AuditoriaService();
  late Future<List<Auditoria>> _futureAuditorias;
  final TextEditingController _searchController = TextEditingController();

  String _busquedaUsuario = '';
  String _filtroOperacion = 'todos';
  String _filtroTabla = 'todos';

  @override
  void initState() {
    super.initState();
    _cargarAuditorias();
  }

  void _cargarAuditorias() {
    final token = LoginServe.token ?? '';
    setState(() {
      _futureAuditorias = _auditoriaService.getRegistrosAuditoria(token);
    });
  }

  // ignore: unused_element
  void _mostrarDetalleRegistro(Auditoria auditoria) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        title: Row(
          children: [
            Icon(Icons.info_outline, color: Colors.indigo),
            SizedBox(width: 10),
            Expanded(child: Text('Detalle del Registro Afectado')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tabla: ${auditoria.tablaAfectada}',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            SizedBox(height: 12),
            Text(
              'ID del Registro (Clave Primaria):',
              style: TextStyle(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            SizedBox(height: 8),
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.indigo.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                auditoria.idRegistroAfectado?.toString() ?? 'N/A',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.indigo,
                ),
              ),
            ),
          ],
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registro de Auditoría'),
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
      body: FutureBuilder<List<Auditoria>>(
        future: _futureAuditorias,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 60, color: Colors.red),
                    SizedBox(height: 16),
                    Text(
                      'Error al cargar los datos',
                      style: TextStyle(fontSize: 18, color: Colors.red),
                    ),
                    SizedBox(height: 12),
                    Text(
                      'El servidor está teniendo problemas.\nPor favor, contacta al administrador.',
                      style: TextStyle(
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _cargarAuditorias,
                      icon: Icon(Icons.refresh),
                      label: Text('Reintentar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return _buildEmptyState();
          }

          return _buildContent(snapshot.data!);
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history,
            size: 80,
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.5),
          ),
          SizedBox(height: 16),
          Text(
            'No hay registros de auditoría',
            style: TextStyle(
              fontSize: 18,
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(List<Auditoria> auditorias) {
    return Column(
      children: [
        _buildFilters(),
        Expanded(child: _buildResponsiveList(auditorias)),
      ],
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: EdgeInsets.all(16),
      color: Theme.of(context).brightness == Brightness.dark
          ? Colors.grey.shade900
          : Colors.grey[100],
      child: Column(
        children: [
          // Barra de búsqueda
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: 'Buscar por usuario',
              prefixIcon: Icon(Icons.search, color: Colors.indigo),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.indigo, width: 2),
              ),
              filled: true,
              fillColor: Theme.of(context).cardColor,
            ),
            onChanged: (value) {
              setState(() {
                _busquedaUsuario = value;
              });
            },
          ),
          SizedBox(height: 16),
          // Filtros
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _filtroOperacion,
                  decoration: InputDecoration(
                    labelText: 'Operación',
                    prefixIcon: Icon(Icons.filter_list, color: Colors.indigo),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: Theme.of(context).cardColor,
                  ),
                  items: [
                    DropdownMenuItem(value: 'todos', child: Text('Todas')),
                    DropdownMenuItem(value: 'INSERT', child: Text('INSERT')),
                    DropdownMenuItem(value: 'UPDATE', child: Text('UPDATE')),
                    DropdownMenuItem(value: 'DELETE', child: Text('DELETE')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _filtroOperacion = value ?? 'todos';
                    });
                  },
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _filtroTabla,
                  decoration: InputDecoration(
                    labelText: 'Tabla',
                    prefixIcon: Icon(Icons.table_chart, color: Colors.indigo),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: Theme.of(context).cardColor,
                  ),
                  items: [
                    DropdownMenuItem(value: 'todos', child: Text('Todas')),
                    DropdownMenuItem(
                      value: 'usuarios',
                      child: Text('Usuarios'),
                    ),
                    DropdownMenuItem(
                      value: 'ocupantes',
                      child: Text('Residentes'),
                    ),
                    DropdownMenuItem(
                      value: 'recepcionPaquetes',
                      child: Text('Paquetería'),
                    ),
                    DropdownMenuItem(value: 'visitas', child: Text('Visitas')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _filtroTabla = value ?? 'todos';
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResponsiveList(List<Auditoria> auditorias) {
    final filtradas = _aplicarFiltros(auditorias);

    if (filtradas.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.5),
            ),
            SizedBox(height: 16),
            Text(
              'No se encontraron registros',
              style: TextStyle(
                fontSize: 18,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWeb = constraints.maxWidth > 800;
        return isWeb ? _buildDataTable(filtradas) : _buildCardList(filtradas);
      },
    );
  }

  List<Auditoria> _aplicarFiltros(List<Auditoria> auditorias) {
    return auditorias.where((auditoria) {
      final cumpleBusqueda =
          _busquedaUsuario.isEmpty ||
          auditoria.username.toLowerCase().contains(
            _busquedaUsuario.toLowerCase(),
          );

      final cumpleOperacion =
          _filtroOperacion == 'todos' ||
          auditoria.operacionRealizada.toUpperCase() ==
              _filtroOperacion.toUpperCase();

      final cumpleTabla =
          _filtroTabla == 'todos' ||
          auditoria.tablaAfectada.toLowerCase() == _filtroTabla.toLowerCase();

      return cumpleBusqueda && cumpleOperacion && cumpleTabla;
    }).toList();
  }

  Widget _buildDataTable(List<Auditoria> auditorias) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm:ss');

    return SingleChildScrollView(
      scrollDirection: Axis.vertical,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: DataTable(
            columnSpacing: 24,
            headingRowColor: WidgetStateProperty.all(
              Theme.of(context).brightness == Brightness.dark
                  ? Colors.indigo.withValues(alpha: 0.3)
                  : Colors.indigo.withValues(alpha: 0.1),
            ),
            columns: const [
              DataColumn(
                label: Text(
                  'Fecha/Hora',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Usuario',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Operación',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Tabla Afectada',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'ID Afectado',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
            rows: auditorias.map((auditoria) {
              return DataRow(
                cells: [
                  DataCell(
                    Text(dateFormat.format(auditoria.fechaHoraAuditoria)),
                  ),
                  DataCell(Text(auditoria.username)),
                  DataCell(
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getColorOperacion(auditoria.operacionRealizada),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        auditoria.operacionRealizada,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  DataCell(Text(auditoria.tablaAfectada)),
                  DataCell(
                    Text(
                      auditoria.nombreAfectado ??
                          auditoria.idRegistroAfectado?.toString() ??
                          'N/A',
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

  Widget _buildCardList(List<Auditoria> auditorias) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm:ss');

    return ListView.builder(
      padding: EdgeInsets.all(16),
      itemCount: auditorias.length,
      itemBuilder: (context, index) {
        final auditoria = auditorias[index];
        return Card(
          elevation: 3,
          margin: EdgeInsets.only(bottom: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: _getColorOperacion(
                        auditoria.operacionRealizada,
                      ),
                      child: Icon(
                        _getIconOperacion(auditoria.operacionRealizada),
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            auditoria.username,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            dateFormat.format(auditoria.fechaHoraAuditoria),
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withValues(alpha: 0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getColorOperacion(auditoria.operacionRealizada),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        auditoria.operacionRealizada,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                Divider(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tabla Afectada',
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withValues(alpha: 0.7),
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            auditoria.tablaAfectada,
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'ID Afectado',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          auditoria.nombreAfectado ??
                              auditoria.idRegistroAfectado?.toString() ??
                              'N/A',
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Color _getColorOperacion(String operacion) {
    final operacionUpper = operacion.toUpperCase();
    if (operacionUpper.contains('INSERT')) {
      return Colors.green;
    } else if (operacionUpper.contains('UPDATE')) {
      return Colors.orange;
    } else if (operacionUpper.contains('DELETE')) {
      return Colors.red;
    }
    return Colors.grey;
  }

  IconData _getIconOperacion(String operacion) {
    final operacionUpper = operacion.toUpperCase();
    if (operacionUpper.contains('INSERT')) {
      return Icons.add_circle;
    } else if (operacionUpper.contains('UPDATE')) {
      return Icons.edit;
    } else if (operacionUpper.contains('DELETE')) {
      return Icons.delete;
    }
    return Icons.history;
  }
}
