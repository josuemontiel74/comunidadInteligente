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
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
    } catch (e) {
      debugPrint('Error al cargar apartamentos: $e');
      setState(() => isLoading = false);
    }
  }

  /// Obtiene la lista de apartamentos filtrados por torre
  List<Map<String, dynamic>> _getApartamentosPorTorre(int torreId) {
    return apartamentos
        .where((a) => a['torresId'] == torreId)
        .toList()
      ..sort((a, b) =>
          (a['codigoApartamento'] ?? '').compareTo(b['codigoApartamento'] ?? ''));
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
        Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 13),
        ),
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
      backgroundColor: Colors.white,
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
      final ocupantes = a['ocupantes'] as List<dynamic>?;
      return ocupantes != null && ocupantes.isNotEmpty;
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
                        color: Colors.grey[600],
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
                      backgroundColor: Colors.grey[200],
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
              const Icon(Icons.chevron_right, color: Colors.grey),
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
            .map((codigo) => <String, dynamic>{
                  'codigoApartamento': codigo,
                  'torresId': torreId,
                })
            .toList();

    return RefreshIndicator(
      onRefresh: _cargarApartamentos,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // Header de torre
          Card(
            color: Colors.teal,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                    onPressed: () =>
                        setState(() => torreSeleccionada = null),
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
    final codigo = apto['codigoApartamento'] ?? 'N/A';
    final ocupantes = apto['ocupantes'] as List<dynamic>?;
    final tieneOcupantes = ocupantes != null && ocupantes.isNotEmpty;
    final color = tieneOcupantes ? Colors.green : Colors.grey[400]!;

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
              tieneOcupantes ? Icons.home : Icons.home_outlined,
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
              tieneOcupantes
                  ? '${ocupantes.length} residente${ocupantes.length > 1 ? "s" : ""}'
                  : 'Vacío',
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Modal con detalle del apartamento y sus ocupantes
  void _mostrarDetalleApartamento(Map<String, dynamic> apto) {
    final codigo = apto['codigoApartamento'] ?? 'N/A';
    final torreId = apto['torresId'];
    final torreLetra = torreId != null ? convertirTorreIdALetra(torreId) : 'N/A';
    final ocupantes = apto['ocupantes'] as List<dynamic>?;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              ocupantes != null && ocupantes.isNotEmpty
                  ? Icons.home
                  : Icons.home_outlined,
              color: Colors.teal,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Apartamento $codigo'),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildInfoRow('Torre', torreLetra),
              _buildInfoRow('Apartamento', codigo),
              const Divider(),
              Text(
                'Residentes (${ocupantes?.length ?? 0}):',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              if (ocupantes == null || ocupantes.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'No hay residentes registrados',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              else
                ...ocupantes.map((o) {
                  final persona = o['persona'] ?? o;
                  final nombre =
                      '${persona['primerNombre'] ?? ''} ${persona['primerApellido'] ?? ''}'
                          .trim();
                  final doc = persona['documentoIdentidad'] ?? '';
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    leading: CircleAvatar(
                      backgroundColor: Colors.teal.withValues(alpha: 0.1),
                      child: const Icon(Icons.person, color: Colors.teal, size: 20),
                    ),
                    title: Text(nombre.isNotEmpty ? nombre : 'Sin nombre'),
                    subtitle: doc.isNotEmpty ? Text('Doc: $doc') : null,
                  );
                }),
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
          Text(value, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }
}
