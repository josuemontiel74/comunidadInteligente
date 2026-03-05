import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../main.dart';
import '../../utils/helpers.dart';

/// Widget que muestra una visualización interactiva de las torres y apartamentos
/// de la comunidad, con colores según ocupación.
class TorresVisualizacion extends StatefulWidget {
  const TorresVisualizacion({super.key});

  @override
  State<TorresVisualizacion> createState() => _TorresVisualizacionState();
}

class _TorresVisualizacionState extends State<TorresVisualizacion> {
  bool isLoading = true;
  List<Map<String, dynamic>> apartamentos = [];
  List<Map<String, dynamic>> _ocupantes = [];
  String? torreSeleccionada;

  @override
  void initState() {
    super.initState();
    _cargarApartamentos();
  }

  Future<void> _cargarApartamentos() async {
    setState(() => isLoading = true);

    try {
      final token = LoginServe.token ?? '';
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/apartamento'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> body = data['body'] ?? data['data'] ?? [];
        setState(() {
          apartamentos = body.cast<Map<String, dynamic>>();
        });
      } else {
        setState(() => isLoading = false);
        return;
      }

      // Cargar ocupantes
      try {
        final resOcup = await http.get(
          Uri.parse('${LoginServe.baseUrl}/api/ocupantes'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        );
        if (resOcup.statusCode == 200) {
          final dataOcup = json.decode(resOcup.body);
          final List<dynamic> bodyOcup =
              dataOcup['body'] ?? dataOcup['data'] ?? dataOcup;
          setState(() {
            _ocupantes = bodyOcup.cast<Map<String, dynamic>>();
          });
        }
      } catch (_) {}

      setState(() => isLoading = false);
    } catch (e) {
      debugPrint('Error al cargar apartamentos: $e');
      setState(() => isLoading = false);
    }
  }

  /// Retorna los ocupantes activos de un apartamento
  List<Map<String, dynamic>> _getOcupantesDeApartamento(dynamic aptoId) {
    if (aptoId == null) return [];
    return _ocupantes
        .where((o) =>
            o['apartamentosId'].toString() == aptoId.toString() &&
            (o['estadoId'] == null || o['estadoId'] != 4))
        .toList();
  }

  /// Obtiene la lista de apartamentos filtrados por torre
  List<Map<String, dynamic>> _getApartamentosPorTorre(int torreId) {
    return apartamentos.where((a) => a['torresId'] == torreId).toList()..sort(
      (a, b) => (a['numeroApartamento'] ?? '').compareTo(
        b['numeroApartamento'] ?? '',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Torres de la Comunidad'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarApartamentos,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Leyenda
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.teal,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildLeyenda(Colors.green, 'Ocupado'),
                      const SizedBox(width: 24),
                      _buildLeyenda(Colors.grey[300]!, 'Vacío'),
                    ],
                  ),
                ),

                // Selector de torre o vista general
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildTorreChip('Todas', null),
                        const SizedBox(width: 6),
                        for (int i = 1; i <= 10; i++) ...[
                          _buildTorreChip(
                            'Torre ${String.fromCharCode("A".codeUnitAt(0) + i - 1)}',
                            i.toString(),
                          ),
                          if (i < 10) const SizedBox(width: 6),
                        ],
                      ],
                    ),
                  ),
                ),

                // Vista de torres
                Expanded(
                  child: torreSeleccionada == null
                      ? _buildVistaGeneral()
                      : _buildVistaTorre(int.parse(torreSeleccionada!)),
                ),
              ],
            ),
    );
  }

  Widget _buildLeyenda(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.white, width: 1),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 13)),
      ],
    );
  }

  Widget _buildTorreChip(String label, String? valor) {
    final isSelected = torreSeleccionada == valor;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          torreSeleccionada = selected ? valor : null;
        });
      },
      selectedColor: Colors.teal,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.teal,
        fontWeight: FontWeight.bold,
        fontSize: 12,
      ),
      backgroundColor: Theme.of(context).cardColor,
      side: const BorderSide(color: Colors.teal),
    );
  }

  /// Vista panorámica de todas las torres
  Widget _buildVistaGeneral() {
    return RefreshIndicator(
      onRefresh: _cargarApartamentos,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          for (int i = 1; i <= 10; i++) ...[
            _buildTorreCard(i),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  /// Tarjeta resumen de una torre
  Widget _buildTorreCard(int torreId) {
    final torreLetra = String.fromCharCode('A'.codeUnitAt(0) + torreId - 1);
    final aptosEnTorre = _getApartamentosPorTorre(torreId);
    final ocupados = aptosEnTorre.where((a) {
      final estado = a['estado'];
      if (estado != null && estado is Map) {
        final nombre = (estado['nombreEstado'] ?? '').toString().toLowerCase();
        return nombre == 'ocupado';
      }
      // Fallback: estadoId 1 = ocupado
      return a['estadoId'] == 1;
    }).length;
    final total = aptosEnTorre.length;
    final porcentaje = total > 0 ? (ocupados / total * 100).round() : 0;

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => torreSeleccionada = torreId.toString()),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Icono de torre
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.teal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.apartment,
                  color: Colors.teal,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Torre $torreLetra',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$ocupados/$total apartamentos ocupados',
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
              // Indicador circular de ocupación
              SizedBox(
                width: 50,
                height: 50,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: total > 0 ? ocupados / total : 0,
                      backgroundColor:
                          Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey[800]
                          : Colors.grey[200],
                      color: Colors.teal,
                      strokeWidth: 5,
                    ),
                    Text(
                      '$porcentaje%',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Vista detallada de una torre con grid de apartamentos
  Widget _buildVistaTorre(int torreId) {
    final torreLetra = String.fromCharCode('A'.codeUnitAt(0) + torreId - 1);
    final aptosEnTorre = _getApartamentosPorTorre(torreId);

    // Si la API no trae datos para esta torre, mostramos los del helpers
    final torreKey = 'Torre $torreLetra';
    final listaAptos = aptosEnTorre.isNotEmpty
        ? aptosEnTorre
        : (apartamentosPorTorre[torreKey] ?? [])
              .map(
                (codigo) => <String, dynamic>{
                  'numeroApartamento': codigo,
                  'torresId': torreId,
                },
              )
              .toList();

    return RefreshIndicator(
      onRefresh: _cargarApartamentos,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // Header de torre
          Card(
            color: Colors.teal,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.apartment, color: Colors.white, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Torre $torreLetra',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          '${listaAptos.length} apartamentos',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => setState(() => torreSeleccionada = null),
                    tooltip: 'Volver a todas las torres',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Grid de apartamentos
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 1.2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: listaAptos.length,
            itemBuilder: (context, index) {
              final apto = listaAptos[index];
              return _buildApartamentoCard(apto);
            },
          ),
        ],
      ),
    );
  }

  /// Tarjeta visual de un apartamento
  Widget _buildApartamentoCard(Map<String, dynamic> apto) {
    final codigo = apto['numeroApartamento'] ?? 'N/A';
    final estado = apto['estado'];
    bool estaOcupado = false;
    String estadoNombre = 'Vacío';
    if (estado != null && estado is Map) {
      estadoNombre = estado['nombreEstado'] ?? 'Vacío';
      estaOcupado = estadoNombre.toLowerCase() == 'ocupado';
    } else if (apto['estadoId'] == 1) {
      estaOcupado = true;
      estadoNombre = 'Ocupado';
    }
    final color = estaOcupado ? Colors.green : Colors.grey[400]!;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: color, width: 2),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => _mostrarDetalleApartamento(apto),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              estaOcupado ? Icons.home : Icons.home_outlined,
              color: color,
              size: 28,
            ),
            const SizedBox(height: 4),
            Text(
              codigo,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: color,
              ),
            ),
            Text(
              estadoNombre,
              style: TextStyle(
                fontSize: 10,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Modal con detalle del apartamento
  void _mostrarDetalleApartamento(Map<String, dynamic> apto) {
    final codigo = apto['numeroApartamento'] ?? 'N/A';
    final torreId = apto['torresId'];
    final torreLetra = torreId != null
        ? convertirTorreIdALetra(torreId)
        : 'N/A';
    final torre = apto['torre'];
    final torreNombre = torre != null && torre is Map
        ? (torre['nombreTorre'] ?? 'Torre $torreLetra')
        : 'Torre $torreLetra';
    final estado = apto['estado'];
    String estadoNombre = 'Sin estado';
    if (estado != null && estado is Map) {
      estadoNombre = estado['nombreEstado'] ?? 'Sin estado';
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              estadoNombre.toLowerCase() == 'ocupado'
                  ? Icons.home
                  : Icons.home_outlined,
              color: Colors.teal,
            ),
            const SizedBox(width: 8),
            Expanded(child: Text('Apartamento $codigo')),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildInfoRow('Torre', torreNombre),
              _buildInfoRow('Apartamento', codigo),
              _buildInfoRow('Estado', estadoNombre),
              ..._buildOcupanteRows(apto['idApartamento']),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }

  /// Construye filas con los ocupantes del apartamento
  List<Widget> _buildOcupanteRows(dynamic aptoId) {
    final ocupantes = _getOcupantesDeApartamento(aptoId);
    if (ocupantes.isEmpty) return [];

    return [
      const Divider(height: 12),
      const Text(
        'Ocupantes:',
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
      const SizedBox(height: 4),
      ...ocupantes.map((o) {
        final nombre =
            '${o['primerNombre'] ?? ''} ${o['primerApellido'] ?? ''}'.trim();
        final tipo = o['tipoOcupacion'] ?? '';
        return Padding(
          padding: const EdgeInsets.only(bottom: 2),
          child: Row(
            children: [
              const Icon(Icons.person, size: 14, color: Colors.teal),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '$nombre${tipo.isNotEmpty ? ' ($tipo)' : ''}',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        );
      }),
    ];
  }
}
