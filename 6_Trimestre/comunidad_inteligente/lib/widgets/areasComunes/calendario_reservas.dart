import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../main.dart';
import 'package:intl/intl.dart';

class CalendarioReservas extends StatefulWidget {
  final String? token;

  const CalendarioReservas({super.key, required this.token});

  @override
  State<CalendarioReservas> createState() => _CalendarioReservasState();
}

class _CalendarioReservasState extends State<CalendarioReservas> {
  DateTime _mesSeleccionado = DateTime.now();
  DateTime? _diaSeleccionado;
  List<dynamic> _reservas = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _cargarReservas();
  }

  Future<void> _cargarReservas() async {
    setState(() => _isLoading = true);

    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      };
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/reservas-areas'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _reservas = data['mostrarAreasComunes'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al cargar reservas: $e')));
      }
    }
  }

  List<dynamic> _obtenerReservasDelDia(DateTime dia) {
    return _reservas.where((reserva) {
      try {
        final fechaStr = reserva['fechaReserva'] as String?;
        if (fechaStr == null) return false;

        // Parsear fecha sin considerar timezone
        final partes = fechaStr.split('-');
        if (partes.length != 3) return false;

        final fechaReserva = DateTime(
          int.parse(partes[0]), // año
          int.parse(partes[1]), // mes
          int.parse(partes[2]), // día
        );

        return fechaReserva.year == dia.year &&
            fechaReserva.month == dia.month &&
            fechaReserva.day == dia.day &&
            (reserva['estado']?['estadoId'] ?? reserva['estadoId']) !=
                2; // Excluir finalizadas
      } catch (e) {
        return false;
      }
    }).toList();
  }

  bool _tienereservas(DateTime dia) {
    return _obtenerReservasDelDia(dia).isNotEmpty;
  }

  String _obtenerNombreAreaComun(dynamic reserva) {
    // Intentar obtener el nombre del área desde el include
    final nombreArea = reserva['areaComun']?['nombreArea'] as String?;
    if (nombreArea != null && nombreArea.isNotEmpty) {
      return nombreArea;
    }

    // Si no está disponible, usar el ID como fallback
    final areaComunId = reserva['areaComun']?['areaComunId'];
    if (areaComunId == null) return 'N/A';
    final id = areaComunId.toString();
    switch (id) {
      case '1':
        return 'Salón Comunal 1';
      case '2':
        return 'Salón Comunal 2';
      case '3':
        return 'Zona BBQ';
      default:
        return 'N/A';
    }
  }

  void _cambiarMes(int incremento) {
    final nuevoMes = DateTime(
      _mesSeleccionado.year,
      _mesSeleccionado.month + incremento,
      1,
    );

    // Solo permitir meses desde el actual hacia adelante
    final ahora = DateTime.now();
    final mesActual = DateTime(ahora.year, ahora.month, 1);

    if (nuevoMes.isBefore(mesActual)) {
      return;
    }

    setState(() {
      _mesSeleccionado = nuevoMes;
      _diaSeleccionado = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: isSmallScreen ? MediaQuery.of(context).size.width * 0.95 : 700,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.calendar_month,
                    color: Colors.white,
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Calendario de Reservas',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Contenido
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: Colors.orange),
                    )
                  : SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            // Navegación de mes
                            _buildNavegacionMes(),
                            const SizedBox(height: 20),
                            // Calendario
                            _buildCalendario(),
                            if (_diaSeleccionado != null) ...[
                              const SizedBox(height: 20),
                              const Divider(),
                              const SizedBox(height: 20),
                              _buildReservasDelDia(),
                            ],
                          ],
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavegacionMes() {
    final nombreMes = DateFormat('MMMM yyyy', 'es').format(_mesSeleccionado);
    final ahora = DateTime.now();
    final mesActual = DateTime(ahora.year, ahora.month, 1);
    final puedeRetroceder = _mesSeleccionado.isAfter(mesActual);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: puedeRetroceder ? () => _cambiarMes(-1) : null,
          color: puedeRetroceder ? Colors.orange : Colors.grey,
        ),
        Text(
          nombreMes.toUpperCase(),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.orange,
          ),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () => _cambiarMes(1),
          color: Colors.orange,
        ),
      ],
    );
  }

  Widget _buildCalendario() {
    final primerDiaDelMes = DateTime(
      _mesSeleccionado.year,
      _mesSeleccionado.month,
      1,
    );
    final ultimoDiaDelMes = DateTime(
      _mesSeleccionado.year,
      _mesSeleccionado.month + 1,
      0,
    );
    final diasEnMes = ultimoDiaDelMes.day;

    // Ajustar para que lunes sea 0
    int primerDiaSemana = primerDiaDelMes.weekday - 1;

    final ahora = DateTime.now();
    final hoy = DateTime(ahora.year, ahora.month, ahora.day);

    return Column(
      children: [
        // Días de la semana
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: ['L', 'M', 'X', 'J', 'V', 'S', 'D']
              .map(
                (dia) => Expanded(
                  child: Center(
                    child: Text(
                      dia,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 10),
        // Grid de días
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            childAspectRatio: 1,
            crossAxisSpacing: 4,
            mainAxisSpacing: 4,
          ),
          itemCount: diasEnMes + primerDiaSemana,
          itemBuilder: (context, index) {
            if (index < primerDiaSemana) {
              return const SizedBox.shrink();
            }

            final dia = index - primerDiaSemana + 1;
            final fecha = DateTime(
              _mesSeleccionado.year,
              _mesSeleccionado.month,
              dia,
            );
            final esHoy =
                fecha.year == hoy.year &&
                fecha.month == hoy.month &&
                fecha.day == hoy.day;
            final esPasado = fecha.isBefore(hoy);
            final tieneReservas = _tienereservas(fecha);
            final estaSeleccionado =
                _diaSeleccionado != null &&
                fecha.year == _diaSeleccionado!.year &&
                fecha.month == _diaSeleccionado!.month &&
                fecha.day == _diaSeleccionado!.day;

            return InkWell(
              onTap: esPasado
                  ? null
                  : () {
                      setState(() {
                        _diaSeleccionado = fecha;
                      });
                    },
              child: Container(
                decoration: BoxDecoration(
                  color: estaSeleccionado
                      ? Colors.orange
                      : esHoy
                      ? Colors.orange.shade100
                      : esPasado
                      ? Colors.grey.shade100
                      : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: tieneReservas && !esPasado
                        ? Colors.orange
                        : Colors.grey.shade300,
                    width: tieneReservas && !esPasado ? 2 : 1,
                  ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Text(
                        dia.toString(),
                        style: TextStyle(
                          color: estaSeleccionado
                              ? Colors.white
                              : esPasado
                              ? Colors.grey
                              : Colors.black,
                          fontWeight: esHoy || tieneReservas
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ),
                    if (tieneReservas && !esPasado)
                      Positioned(
                        bottom: 2,
                        right: 2,
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: estaSeleccionado
                                ? Colors.white
                                : Colors.orange,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildReservasDelDia() {
    final reservasDelDia = _obtenerReservasDelDia(_diaSeleccionado!);
    final fechaFormateada = DateFormat(
      'EEEE, d \'de\' MMMM',
      'es',
    ).format(_diaSeleccionado!);

    if (reservasDelDia.isEmpty) {
      return Column(
        children: [
          Text(
            fechaFormateada.toUpperCase(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'No hay reservas para este día',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          fechaFormateada.toUpperCase(),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.orange,
          ),
        ),
        const SizedBox(height: 15),
        ...reservasDelDia.map((reserva) => _buildReservaCard(reserva)).toList(),
      ],
    );
  }

  Widget _buildReservaCard(dynamic reserva) {
    final nombreSolicitante =
        reserva['Solicitante']?['nombreSolicitante'] as String? ?? 'N/A';
    final horaInicio = reserva['horaInicio'] as String? ?? '';
    final horaFin = reserva['horaFin'] as String? ?? '';
    final nombreEstado =
        reserva['estado']?['nombreEstado'] as String? ?? 'Activa';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.home_work,
                color: Colors.orange.shade700,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _obtenerNombreAreaComun(reserva),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$horaInicio - $horaFin',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    nombreSolicitante,
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                nombreEstado,
                style: TextStyle(
                  color: Colors.green.shade700,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
