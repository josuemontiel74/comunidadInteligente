import 'package:flutter/material.dart';
import 'dart:convert';
import '../../main.dart';
import 'package:http/http.dart' as http;
import '../../widgets/areasComunes/detalles_reserva.dart';
import '../../widgets/areasComunes/registrar_reserva.dart';
import '../../widgets/areasComunes/actualizar_reserva.dart';

class Areascomunes extends StatelessWidget {
  const Areascomunes({super.key, required this.token});
  final String? token;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        title: const Text('Gestión de Áreas Comunes'),
        elevation: 3,
      ),
      body: MostrarAreasComunes(token: token),
    );
  }
}

// Widget para mostrar las reservas de áreas comunes
class MostrarAreasComunes extends StatefulWidget {
  const MostrarAreasComunes({super.key, required this.token});
  final String? token;

  @override
  State<MostrarAreasComunes> createState() => _MostrarAreasComunesState();
}

class _MostrarAreasComunesState extends State<MostrarAreasComunes> {
  List<Reserva> reservas = [];
  bool isLoading = true;
  String errorMessage = '';
  String filtroEstado = 'todos'; // 'todos', 'activa', 'finalizada'
  int paginaActual = 1;
  int totalPaginas = 1;
  final int itemsPorPagina = 10;
  String busquedaNombre = '';
  String? filtroTorre;
  String? filtroApartamento;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    cargarReservas();
  }

  // Método para obtener el nombre del área común según su ID
  String obtenerNombreAreaComun(dynamic areaComunId) {
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

  // Método para obtener la torre de la reserva
  String obtenerTorre(Reserva reserva) {
    return reserva.nombreTorre ?? 'N/A';
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

  Future<void> finalizarReserva(int idReservas) async {
    final url = Uri.parse(
      '${LoginServe.baseUrl}/api/ActualizarReserva/$idReservas',
    );

    final response = await http.patch(
      url,
      headers: {
        'Authorization': 'Bearer ${widget.token}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'estadoId': 9}),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Reserva finalizada correctamente"),
          backgroundColor: Colors.green,
          showCloseIcon: true,
        ),
      );
      // Recargar las reservas después de finalizar
      await cargarReservas();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "Error al finalizar la reserva (${response.statusCode})",
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> cargarReservas() async {
    setState(() {
      isLoading = true;
    });

    try {
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/ReservasAreasComunesMovil'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);
        final List<dynamic> data = jsonResponse['mostrarAreasComunes'];

        List<Reserva> todasReservas = data
            .map((json) => Reserva.fromJson(json))
            .toList();

        // Filtrar por estado
        List<Reserva> reservasFiltradas = todasReservas;
        if (filtroEstado != 'todos') {
          reservasFiltradas = todasReservas.where((reserva) {
            final estadoNombre = reserva.nombreEstado?.toLowerCase();
            if (filtroEstado == 'activa') {
              // Activa incluye "en curso" y "registrada"
              return estadoNombre == 'en curso' || estadoNombre == 'registrada';
            }
            return estadoNombre == filtroEstado;
          }).toList();
        }

        // Filtrar por búsqueda de nombre
        if (busquedaNombre.isNotEmpty) {
          reservasFiltradas = reservasFiltradas.where((reserva) {
            final nombre = reserva.nombreSolicitante?.toLowerCase() ?? '';
            return nombre.contains(busquedaNombre.toLowerCase());
          }).toList();
        }

        // Filtrar por torre
        if (filtroTorre != null && filtroTorre!.isNotEmpty) {
          reservasFiltradas = reservasFiltradas.where((reserva) {
            return reserva.nombreTorre == filtroTorre;
          }).toList();
        }

        // Filtrar por apartamento
        if (filtroApartamento != null && filtroApartamento!.isNotEmpty) {
          reservasFiltradas = reservasFiltradas.where((reserva) {
            return reserva.numeroApartamento == filtroApartamento;
          }).toList();
        }

        // Ordenar por fecha de más reciente a más vieja
        reservasFiltradas.sort((a, b) {
          final fechaA = DateTime.tryParse(a.fechaReserva ?? '');
          final fechaB = DateTime.tryParse(b.fechaReserva ?? '');
          if (fechaA == null || fechaB == null) return 0;
          return fechaB.compareTo(fechaA);
        });

        // Implementar paginación
        final totalItems = reservasFiltradas.length;
        final totalPags = (totalItems / itemsPorPagina).ceil();
        final inicio = (paginaActual - 1) * itemsPorPagina;
        final fin = (inicio + itemsPorPagina).clamp(0, totalItems);

        final reservasPaginadas = reservasFiltradas.sublist(
          inicio.clamp(0, totalItems),
          fin,
        );

        setState(() {
          reservas = reservasPaginadas;
          totalPaginas = totalPags > 0 ? totalPags : 1;
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = "Error al cargar reservas: ${response.statusCode}";
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = "Error de conexión: $e";
        isLoading = false;
      });
    }
  }

  // Layout de cards para móvil
  Widget _buildCardLayout() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: reservas.length,
      itemBuilder: (context, index) {
        final r = reservas[index];
        final estaFinalizada = r.nombreEstado?.toLowerCase() == "finalizada";

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
                        r.nombreSolicitante ?? 'N/A',
                        style: const TextStyle(
                          fontSize: 20,
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
                        color: estaFinalizada
                            ? Colors.grey.shade100
                            : Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        r.nombreEstado ?? 'N/A',
                        style: TextStyle(
                          color: estaFinalizada
                              ? Colors.grey.shade700
                              : Colors.orange.shade700,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Área común
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.home_work,
                        color: Colors.green.shade700,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        obtenerNombreAreaComun(r.areaComunId),
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Fecha y hora
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.calendar_today,
                        color: Colors.blue.shade700,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '${r.fechaReserva ?? "N/A"} | ${r.horaInicio ?? ""} - ${r.horaFin ?? ""}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Apartamento
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.purple.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.apartment,
                        color: Colors.purple.shade700,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Apto ${r.numeroApartamento ?? "N/A"}',
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
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _mostrarDetalles(r),
                        icon: const Icon(Icons.info_outline, size: 18),
                        label: const Text('Detalles'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.orange,
                          side: const BorderSide(color: Colors.orange),
                        ),
                      ),
                    ),
                    if (!estaFinalizada) ...[
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => Actualizar(
                                  token: widget.token,
                                  idReservas: r.idReservas,
                                ),
                              ),
                            ).then((_) => cargarReservas());
                          },
                          icon: const Icon(Icons.edit, size: 18),
                          label: const Text('Editar'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.blue,
                            side: const BorderSide(color: Colors.blue),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Confirmar'),
                                content: const Text(
                                  '¿Deseas finalizar esta reserva?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, false),
                                    child: const Text('Cancelar'),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, true),
                                    child: const Text('Sí'),
                                  ),
                                ],
                              ),
                            );

                            if (confirm == true && r.idReservas != null) {
                              await finalizarReserva(r.idReservas!);
                            }
                          },
                          icon: const Icon(Icons.check_circle, size: 18),
                          label: const Text('Finalizar'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
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
          headingRowColor: WidgetStateProperty.all(Colors.orange.shade50),
          columns: const [
            DataColumn(
              label: Text(
                'Solicitante',
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
                'Área Común',
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
                'Horario',
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
          rows: reservas.map((r) {
            final estaFinalizada =
                r.nombreEstado?.toLowerCase() == 'finalizada';
            return DataRow(
              cells: [
                DataCell(Text(r.nombreSolicitante ?? 'N/A')),
                DataCell(Text(obtenerTorre(r))),
                DataCell(Text(r.numeroApartamento ?? 'N/A')),
                DataCell(Text(obtenerNombreAreaComun(r.areaComunId))),
                DataCell(Text(r.fechaReserva ?? 'N/A')),
                DataCell(Text('${r.horaInicio ?? ""} - ${r.horaFin ?? ""}')),
                DataCell(
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: estaFinalizada
                          ? Colors.grey.shade100
                          : Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      r.nombreEstado ?? 'N/A',
                      style: TextStyle(
                        color: estaFinalizada
                            ? Colors.grey.shade700
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
                        color: Colors.orange,
                        onPressed: () => _mostrarDetalles(r),
                        tooltip: 'Ver detalles',
                      ),
                      if (!estaFinalizada) ...[
                        IconButton(
                          icon: const Icon(Icons.edit),
                          color: Colors.blue,
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => Actualizar(
                                  token: widget.token,
                                  idReservas: r.idReservas,
                                ),
                              ),
                            ).then((_) => cargarReservas());
                          },
                          tooltip: 'Editar',
                        ),
                        IconButton(
                          icon: const Icon(Icons.check_circle),
                          color: Colors.green,
                          onPressed: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Confirmar'),
                                content: const Text(
                                  '¿Deseas finalizar esta reserva?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, false),
                                    child: const Text('Cancelar'),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, true),
                                    child: const Text('Sí'),
                                  ),
                                ],
                              ),
                            );

                            if (confirm == true && r.idReservas != null) {
                              await finalizarReserva(r.idReservas!);
                            }
                          },
                          tooltip: 'Finalizar reserva',
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

  void _mostrarDetalles(Reserva reserva) {
    showDialog(
      context: context,
      builder: (context) => DetallesReserva(reserva: reserva),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
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
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          RegistrarReserva(token: widget.token),
                    ),
                  ).then((_) => cargarReservas());
                },
                icon: const Icon(Icons.add),
                label: Text(
                  MediaQuery.of(context).size.width < 600
                      ? 'Registrar Reserva'
                      : 'Registrar Nueva Reserva',
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(
                    vertical: MediaQuery.of(context).size.width < 600 ? 12 : 15,
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
                  hintText: 'Buscar por nombre del solicitante...',
                  prefixIcon: const Icon(Icons.search, color: Colors.orange),
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
                  cargarReservas();
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
                        cargarReservas();
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
                        cargarReservas();
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              // Filtros
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
                    _buildFiltroChip('Todas', 'todos'),
                    const SizedBox(width: 10),
                    _buildFiltroChip('Activas', 'activa'),
                    const SizedBox(width: 10),
                    _buildFiltroChip('Finalizadas', 'finalizada'),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Tabla de reservas o Cards según el ancho de pantalla
        Expanded(
          child: isLoading
              ? const Center(child: CircularProgressIndicator())
              : errorMessage.isNotEmpty
              ? Center(child: Text(errorMessage))
              : reservas.isEmpty
              ? const Center(
                  child: Text(
                    'No hay reservas registradas',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                )
              : MediaQuery.of(context).size.width < 600
              ? _buildCardLayout()
              : _buildTableLayout(),
        ),
        // Paginación
        if (!isLoading && reservas.isNotEmpty)
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
                          cargarReservas();
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
                          cargarReservas();
                        }
                      : null,
                ),
              ],
            ),
          ),
      ],
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
        cargarReservas();
      },
      selectedColor: Colors.orange,
      labelStyle: TextStyle(
        color: seleccionado ? Colors.white : Colors.black,
        fontWeight: seleccionado ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }
}

class Reserva {
  final int? idReservas;
  final String? fechaReserva;
  final String? horaInicio;
  final String? horaFin;
  final String? motivoReserva;
  final int? cantidadAsistentes;
  final int? invitadosExternos;
  final String? nombreEstado;
  final String? numeroApartamento;
  final String? nombreTorre;
  final String? documentoSolicitante;
  final String? nombreSolicitante;
  final String? correoSolicitante;
  final String? telefonoSolicitante;
  final String? tipodocumento;
  final String? areaComun;
  final int? areaComunId;
  final int? aceptaReglamento;

  // Método helper para obtener el ID del tipo de documento basado en el nombre
  String? get tipoDocumentoId {
    if (tipodocumento == null) return null;
    final nombre = tipodocumento!.toLowerCase();
    if (nombre.contains('cédula') ||
        nombre.contains('cedula') ||
        nombre == 'cc')
      return '1';
    if (nombre.contains('extranjería') ||
        nombre.contains('extranjeria') ||
        nombre == 'ce')
      return '2';
    if (nombre.contains('pasaporte') || nombre == 'pp') return '3';
    if (nombre == 'pep') return '4';
    if (nombre == 'ppt') return '5';
    return null;
  }

  Reserva({
    this.idReservas,
    this.fechaReserva,
    this.horaInicio,
    this.horaFin,
    this.motivoReserva,
    this.cantidadAsistentes,
    this.invitadosExternos,
    this.nombreEstado,
    this.numeroApartamento,
    this.nombreTorre,
    this.documentoSolicitante,
    this.nombreSolicitante,
    this.correoSolicitante,
    this.telefonoSolicitante,
    this.tipodocumento,
    this.areaComun,
    this.areaComunId,
    this.aceptaReglamento,
  });

  factory Reserva.fromJson(Map<String, dynamic> json) {
    // Obtener numeroApartamento del include apartamento (minúscula)
    String? numApartamento =
        json['apartamento']?['numeroApartamento'] as String?;

    // Obtener nombreTorre del include torre dentro de apartamento (minúsculas)
    String? torre = json['apartamento']?['torre']?['nombreTorre'] as String?;

    // Obtener areaComunId del include areaComun según el backend
    int? idAreaComun = json['areaComun']?['areaComunId'] as int?;

    return Reserva(
      idReservas: json['idReservas'] as int?,
      fechaReserva: json['fechaReserva'] as String?,
      horaInicio: json['horaInicio'] as String?,
      horaFin: json['horaFin'] as String?,
      motivoReserva: json['motivoReserva'] as String?,
      cantidadAsistentes: json['cantidadAsistentes'] as int?,
      invitadosExternos: json['invitadosExternos'] as int?,
      nombreEstado: json['estado']?['nombreEstado'] as String?,
      numeroApartamento: numApartamento,
      nombreTorre: torre,
      documentoSolicitante:
          json['Solicitante']?['documentoSolicitante'] as String?,
      nombreSolicitante: json['Solicitante']?['nombreSolicitante'] as String?,
      correoSolicitante: json['Solicitante']?['correoSolicitante'] as String?,
      telefonoSolicitante:
          json['Solicitante']?['telefonoSolicitante'] as String?,
      tipodocumento: json['tipodocumento']?['nombreDocumento'] as String?,
      areaComun: json['areaComun']?['nombreArea'] as String?,
      areaComunId: idAreaComun,
      aceptaReglamento: json['aceptaReglamento'] as int?,
    );
  }
}
