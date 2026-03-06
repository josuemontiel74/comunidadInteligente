import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import '../../main.dart';

class LogErroresScreen extends StatefulWidget {
  const LogErroresScreen({super.key});

  @override
  State<LogErroresScreen> createState() => _LogErroresScreenState();
}

class _LogErroresScreenState extends State<LogErroresScreen> {
  List<LogError> registros = [];
  List<ResumenNivel> resumen = [];
  bool isLoading = true;
  String? error;

  // Filtros
  String filtroNivel = 'todos';
  String busqueda = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _cargarDatos() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    final token = LoginServe.token ?? '';
    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };

    try {
      final params = <String, String>{'limite': '500'};
      if (filtroNivel != 'todos') {
        params['nivel'] = filtroNivel;
      }

      final uri = Uri.parse(
        '${LoginServe.baseUrl}/api/log-errores',
      ).replace(queryParameters: params);
      final resumenUri = Uri.parse(
        '${LoginServe.baseUrl}/api/log-errores/resumen',
      );

      final responses = await Future.wait([
        http.get(uri, headers: headers),
        http.get(resumenUri, headers: headers),
      ]);

      if (!mounted) return;

      if (responses[0].statusCode == 200) {
        final data = json.decode(responses[0].body);
        final List<dynamic> items = data['data'] ?? [];
        registros = items.map((j) => LogError.fromJson(j)).toList();
      }

      if (responses[1].statusCode == 200) {
        final data = json.decode(responses[1].body);
        final List<dynamic> items = data['resumenNivel'] ?? [];
        resumen = items.map((j) => ResumenNivel.fromJson(j)).toList();
      }

      setState(() => isLoading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isLoading = false;
        error = 'Error al cargar log de errores: $e';
      });
    }
  }

  Future<void> _limpiarLog() async {
    final confirmado = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
            SizedBox(width: 8),
            Text('Limpiar Log'),
          ],
        ),
        content: const Text(
          '¿Estás seguro de que deseas eliminar todos los registros del log de errores? Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar todo'),
          ),
        ],
      ),
    );

    if (confirmado != true) return;

    try {
      final token = LoginServe.token ?? '';
      final response = await http.delete(
        Uri.parse('${LoginServe.baseUrl}/api/log-errores/limpiar'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Log limpiado correctamente'),
            backgroundColor: Colors.green,
          ),
        );
        _cargarDatos();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al limpiar el log'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error de conexión: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  List<LogError> get registrosFiltrados {
    return registros.where((r) {
      if (busqueda.isEmpty) return true;
      final query = busqueda.toLowerCase();
      return r.mensajeError.toLowerCase().contains(query) ||
          r.rutaAfectada.toLowerCase().contains(query) ||
          (r.username?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  Color _colorNivel(String nivel) {
    switch (nivel.toUpperCase()) {
      case 'ERROR':
        return Colors.red;
      case 'WARN':
      case 'WARNING':
        return Colors.orange;
      case 'INFO':
        return Colors.blue;
      case 'DEBUG':
        return Colors.grey;
      default:
        return Colors.blueGrey;
    }
  }

  IconData _iconoNivel(String nivel) {
    switch (nivel.toUpperCase()) {
      case 'ERROR':
        return Icons.error;
      case 'WARN':
      case 'WARNING':
        return Icons.warning;
      case 'INFO':
        return Icons.info;
      case 'DEBUG':
        return Icons.bug_report;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtrados = registrosFiltrados;
    final totalErrores = resumen
        .where((r) => r.nivel == 'ERROR')
        .fold<int>(0, (sum, r) => sum + r.total);
    final totalWarnings = resumen
        .where((r) => r.nivel == 'WARN' || r.nivel == 'WARNING')
        .fold<int>(0, (sum, r) => sum + r.total);
    final totalInfo = resumen
        .where((r) => r.nivel == 'INFO')
        .fold<int>(0, (sum, r) => sum + r.total);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Log de Errores'),
        backgroundColor: Colors.red[700],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarDatos,
            tooltip: 'Recargar',
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep),
            onPressed: _limpiarLog,
            tooltip: 'Limpiar log',
          ),
        ],
      ),
      body: Column(
        children: [
          // Resumen de niveles
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.red[700],
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildResumenItem(
                  'Total',
                  registros.length,
                  Icons.list_alt,
                  Colors.white,
                ),
                _buildResumenItem(
                  'Errores',
                  totalErrores,
                  Icons.error,
                  Colors.red[200]!,
                ),
                _buildResumenItem(
                  'Warnings',
                  totalWarnings,
                  Icons.warning,
                  Colors.orange[200]!,
                ),
                _buildResumenItem(
                  'Info',
                  totalInfo,
                  Icons.info,
                  Colors.blue[200]!,
                ),
              ],
            ),
          ),

          // Filtros
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                // Barra de búsqueda
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Buscar por mensaje, ruta o usuario...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: busqueda.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => busqueda = '');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Theme.of(context).cardColor,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  onChanged: (value) => setState(() => busqueda = value),
                ),
                const SizedBox(height: 10),
                // Chips de filtro por nivel
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFiltroChip('Todos', 'todos'),
                      const SizedBox(width: 6),
                      _buildFiltroChip('Error', 'ERROR'),
                      const SizedBox(width: 6),
                      _buildFiltroChip('Warning', 'WARN'),
                      const SizedBox(width: 6),
                      _buildFiltroChip('Info', 'INFO'),
                      const SizedBox(width: 6),
                      _buildFiltroChip('Debug', 'DEBUG'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Contenido
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[300],
                        ),
                        const SizedBox(height: 16),
                        Text(error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _cargarDatos,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  )
                : filtrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_outline,
                          size: 64,
                          color: Colors.green[300],
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No hay registros de errores',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _cargarDatos,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: filtrados.length,
                      itemBuilder: (context, index) {
                        return _buildLogCard(filtrados[index]);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildResumenItem(
    String label,
    int valor,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          valor.toString(),
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _buildFiltroChip(String label, String valor) {
    final isSelected = filtroNivel == valor;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          filtroNivel = valor;
        });
        _cargarDatos();
      },
      selectedColor: Colors.red[700],
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.red[700],
        fontWeight: FontWeight.bold,
      ),
      backgroundColor: Theme.of(context).cardColor,
      side: BorderSide(color: Colors.red[700]!),
    );
  }

  Widget _buildLogCard(LogError registro) {
    final color = _colorNivel(registro.nivel);
    final icono = _iconoNivel(registro.nivel);
    final fechaFormateada = DateFormat(
      'dd/MM/yyyy HH:mm:ss',
    ).format(registro.fechaHora.toLocal());

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withValues(alpha: 0.3), width: 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _mostrarDetalle(registro),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(icono, size: 14, color: color),
                        const SizedBox(width: 4),
                        Text(
                          registro.nivel,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: color,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Text(
                    fechaFormateada,
                    style: TextStyle(
                      fontSize: 11,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                registro.mensajeError,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.route,
                    size: 12,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      registro.rutaAfectada,
                      style: TextStyle(
                        fontSize: 11,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (registro.username != null) ...[
                    const SizedBox(width: 8),
                    Icon(
                      Icons.person,
                      size: 12,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                    const SizedBox(width: 2),
                    Text(
                      registro.username!,
                      style: TextStyle(
                        fontSize: 11,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _mostrarDetalle(LogError registro) {
    final color = _colorNivel(registro.nivel);
    final fechaFormateada = DateFormat(
      'dd/MM/yyyy HH:mm:ss',
    ).format(registro.fechaHora.toLocal());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(_iconoNivel(registro.nivel), color: color),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Detalle del Error', style: TextStyle(color: color)),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetalleRow('ID', '#${registro.idLog}'),
              _buildDetalleRow('Nivel', registro.nivel),
              _buildDetalleRow('Fecha', fechaFormateada),
              _buildDetalleRow('Usuario', registro.username ?? 'N/A'),
              _buildDetalleRow('Ruta', registro.rutaAfectada),
              const Divider(),
              const Text(
                'Mensaje:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: color.withValues(alpha: 0.2)),
                ),
                child: Text(
                  registro.mensajeError,
                  style: const TextStyle(fontSize: 13),
                ),
              ),
              if (registro.stackTrace != null &&
                  registro.stackTrace!.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text(
                  'Stack Trace:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  constraints: const BoxConstraints(maxHeight: 200),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? Colors.grey.shade800
                        : Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey.shade700
                          : Colors.grey[300]!,
                    ),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      registro.stackTrace!,
                      style: const TextStyle(
                        fontSize: 11,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetalleRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 70,
            child: Text(
              '$label:',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 12))),
        ],
      ),
    );
  }
}


class LogError {
  final int idLog;
  final DateTime fechaHora;
  final String nivel;
  final String? username;
  final String rutaAfectada;
  final String mensajeError;
  final String? stackTrace;

  LogError({
    required this.idLog,
    required this.fechaHora,
    required this.nivel,
    this.username,
    required this.rutaAfectada,
    required this.mensajeError,
    this.stackTrace,
  });

  factory LogError.fromJson(Map<String, dynamic> json) {
    return LogError(
      idLog: json['idLog'] as int,
      fechaHora: DateTime.parse(json['fechaHora'] as String),
      nivel: json['nivel'] as String,
      username: json['username'] as String?,
      rutaAfectada: json['rutaAfectada'] as String,
      mensajeError: json['mensajeError'] as String,
      stackTrace: json['stackTrace'] as String?,
    );
  }
}

class ResumenNivel {
  final String nivel;
  final int total;

  ResumenNivel({required this.nivel, required this.total});

  factory ResumenNivel.fromJson(Map<String, dynamic> json) {
    return ResumenNivel(
      nivel: json['nivel'] as String,
      total: (json['total'] is int)
          ? json['total'] as int
          : int.parse(json['total'].toString()),
    );
  }
}
