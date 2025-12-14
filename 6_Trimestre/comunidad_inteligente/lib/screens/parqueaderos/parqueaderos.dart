import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../main.dart';

class SeleccionarParqueaderoScreen extends StatefulWidget {
  final String? token;
  final int? tipoVehiculoId; // 1 = Carro, 2 = Moto

  const SeleccionarParqueaderoScreen({
    super.key,
    required this.token,
    this.tipoVehiculoId,
  });

  @override
  State<SeleccionarParqueaderoScreen> createState() =>
      _SeleccionarParqueaderoScreenState();
}

class _SeleccionarParqueaderoScreenState
    extends State<SeleccionarParqueaderoScreen> {
  List<Parqueadero> parqueaderos = [];
  List<Parqueadero> parqueaderosFiltrados = [];
  bool isLoading = true;
  String filtroEstado = 'todos'; // 'todos', 'disponibles', 'ocupados'
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    cargarParqueaderos();
  }

  Future<void> cargarParqueaderos() async {
    setState(() => isLoading = true);

    try {
      final headers = {'Content-Type': 'application/json'};
      if (widget.token != null) {
        headers['Authorization'] = 'Bearer ${widget.token}';
      }

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/parqueadero'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> body = data['body'];

        setState(() {
          parqueaderos = body
              .map((json) => Parqueadero.fromJson(json))
              .where(
                (p) =>
                    widget.tipoVehiculoId == null ||
                    p.tipoVehiculoId == widget.tipoVehiculoId,
              )
              .toList();

          aplicarFiltros();
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
    } catch (e) {
      setState(() => isLoading = false);
      print('Error al cargar parqueaderos: $e');
    }
  }

  void aplicarFiltros() {
    setState(() {
      parqueaderosFiltrados = parqueaderos.where((p) {
        // Filtro por estado
        bool cumpleFiltroEstado = true;
        if (filtroEstado == 'disponibles') {
          cumpleFiltroEstado = p.estaDisponible;
        } else if (filtroEstado == 'ocupados') {
          cumpleFiltroEstado = !p.estaDisponible;
        }

        // Filtro por búsqueda
        bool cumpleBusqueda =
            searchQuery.isEmpty ||
            p.codigoParqueadero.toLowerCase().contains(
              searchQuery.toLowerCase(),
            );

        return cumpleFiltroEstado && cumpleBusqueda;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final disponibles = parqueaderos.where((p) => p.estaDisponible).length;
    final ocupados = parqueaderos.length - disponibles;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        title: const Text('Seleccionar Parqueadero'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Header con estadísticas
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildEstadistica(
                  'Total',
                  parqueaderos.length.toString(),
                  Icons.local_parking,
                  Colors.white,
                ),
                _buildEstadistica(
                  'Disponibles',
                  disponibles.toString(),
                  Icons.check_circle,
                  Colors.lightGreenAccent,
                ),
                _buildEstadistica(
                  'Ocupados',
                  ocupados.toString(),
                  Icons.cancel,
                  Colors.redAccent,
                ),
              ],
            ),
          ),

          // Barra de búsqueda y filtros
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                // Barra de búsqueda
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por código...',
                    prefixIcon: const Icon(Icons.search, color: Colors.green),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.green),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Colors.green,
                        width: 2,
                      ),
                    ),
                  ),
                  onChanged: (value) {
                    searchQuery = value;
                    aplicarFiltros();
                  },
                ),
                const SizedBox(height: 12),

                // Filtros por estado
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFiltroChip('Todos', 'todos'),
                      const SizedBox(width: 8),
                      _buildFiltroChip('Disponibles', 'disponibles'),
                      const SizedBox(width: 8),
                      _buildFiltroChip('Ocupados', 'ocupados'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Grid de parqueaderos
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : parqueaderosFiltrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.local_parking,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No hay parqueaderos disponibles',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: MediaQuery.of(context).size.width > 600
                          ? 4
                          : 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: MediaQuery.of(context).size.width > 600
                          ? 1.0
                          : 0.85,
                    ),
                    itemCount: parqueaderosFiltrados.length,
                    itemBuilder: (context, index) {
                      final parqueadero = parqueaderosFiltrados[index];
                      return _buildParqueaderoCard(parqueadero);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEstadistica(
    String label,
    String valor,
    IconData icon,
    Color color,
  ) {
    final isMobile = MediaQuery.of(context).size.width <= 600;

    return Column(
      children: [
        Icon(icon, color: color, size: isMobile ? 24 : 32),
        SizedBox(height: isMobile ? 2 : 4),
        Text(
          valor,
          style: TextStyle(
            fontSize: isMobile ? 18 : 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: TextStyle(fontSize: isMobile ? 10 : 12, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _buildFiltroChip(String label, String valor) {
    final isSelected = filtroEstado == valor;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          filtroEstado = valor;
          aplicarFiltros();
        });
      },
      selectedColor: Colors.green,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.green,
        fontWeight: FontWeight.bold,
      ),
      backgroundColor: Colors.white,
      side: const BorderSide(color: Colors.green),
    );
  }

  Widget _buildParqueaderoCard(Parqueadero parqueadero) {
    final disponible = parqueadero.estaDisponible;
    final tipoVehiculo = parqueadero.tipoVehiculoId == 1 ? 'Carro' : 'Moto';
    final isMobile = MediaQuery.of(context).size.width <= 600;

    return Card(
      elevation: disponible ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: disponible ? Colors.green : Colors.red,
          width: 2,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: disponible
            ? () {
                // Retornar el código del parqueadero seleccionado
                Navigator.pop(context, parqueadero.codigoParqueadero);
              }
            : null,
        child: Padding(
          padding: EdgeInsets.all(isMobile ? 8.0 : 12.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                parqueadero.tipoVehiculoId == 1
                    ? Icons.directions_car
                    : Icons.two_wheeler,
                size: isMobile ? 32 : 40,
                color: disponible ? Colors.green : Colors.red,
              ),
              SizedBox(height: isMobile ? 6 : 8),
              Text(
                parqueadero.codigoParqueadero,
                style: TextStyle(
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: FontWeight.bold,
                  color: disponible ? Colors.green[900] : Colors.red[900],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),
              Text(
                tipoVehiculo,
                style: TextStyle(
                  fontSize: isMobile ? 11 : 12,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: isMobile ? 6 : 8),
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 6 : 8,
                  vertical: isMobile ? 3 : 4,
                ),
                decoration: BoxDecoration(
                  color: disponible
                      ? Colors.green.withOpacity(0.1)
                      : Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  disponible ? 'Disponible' : 'Ocupado',
                  style: TextStyle(
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: FontWeight.bold,
                    color: disponible ? Colors.green[700] : Colors.red[700],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Modelo de Parqueadero
class Parqueadero {
  final String codigoParqueadero;
  final int tipoVehiculoId;
  final int estadoId;

  Parqueadero({
    required this.codigoParqueadero,
    required this.tipoVehiculoId,
    required this.estadoId,
  });

  bool get estaDisponible => estadoId == 4; // 4 = Disponible, 3 = Ocupado

  factory Parqueadero.fromJson(Map<String, dynamic> json) {
    return Parqueadero(
      codigoParqueadero: json['codigoParqueadero'] as String,
      tipoVehiculoId: json['tipoVehiculoId'] as int,
      estadoId: json['estadoId'] as int,
    );
  }
}
