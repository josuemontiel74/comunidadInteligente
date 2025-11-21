import 'package:flutter/material.dart';
import 'dart:convert';
import 'main.dart';
import 'gestionusuarios.dart';
import 'package:http/http.dart' as http;
import 'DashboardSuperAdmin.dart';

class Areascomunes extends StatelessWidget {
  const Areascomunes({super.key, required this.token});
  final String? token;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      endDrawer: _buildDrawer(context),
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 2,
        title: Center(
          child: Image.asset(
            'assets/img/logo.png',
            width: 75,
            height: 65,
            fit: BoxFit.contain,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 20),
            const Center(
              child: Text(
                'Gestión de Áreas Comunes',
                style: TextStyle(
                  fontSize: 30,
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 15),
            // Expanded para que el ListView ocupe el espacio restante
            Expanded(child: MostrarAreasComunes(token: token)),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.green,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const SizedBox(height: 15),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'Menú Super Admin',
              style: TextStyle(
                fontSize: 25,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const Divider(color: Colors.white70, thickness: 1.5),
          _buildMenuSection(
            context,
            title: 'Gestión Paquetes',
            items: [
              {'label': 'Registrar Paquete', 'route': TerceraPantalla()},
              {'label': 'Historial de Paquetes', 'route': TerceraPantalla()},
            ],
          ),
          _buildMenuSection(
            context,
            title: 'Gestión de Visitas',
            items: [
              {'label': 'Crear Visitas', 'route': TerceraPantalla()},
              {'label': 'Consultar Visitas', 'route': TerceraPantalla()},
              {'label': 'Consultar Parqueadero', 'route': TerceraPantalla()},
            ],
          ),
          _buildMenuSection(
            context,
            title: 'Gestión de Áreas Comunes',
            items: [
              {'label': 'Registrar Reserva', 'route': TerceraPantalla()},
              {'label': 'Consultar Zona', 'route': TerceraPantalla()},
            ],
          ),
          _buildMenuSection(
            context,
            title: 'Gestión de Usuarios',
            items: [
              {
                'label': 'Registrar Usuario',
                'route': MostrarUsuario(token: token),
              },
              {
                'label': 'Consultar Usuario',
                'route': MostrarUsuario(token: token),
              },
            ],
          ),
          _buildMenuSection(
            context,
            title: 'Gestión de Residentes',
            items: [
              {'label': 'Registrar Residentes', 'route': TerceraPantalla()},
              {'label': 'Consultar Residentes', 'route': TerceraPantalla()},
            ],
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => MyApp()),
                  (route) => false,
                );
              },
              icon: const Icon(Icons.logout, color: Colors.black),
              label: const Text(
                "Cerrar Sesión",
                style: TextStyle(fontSize: 18, color: Colors.black),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildMenuSection(
    BuildContext context, {
    required String title,
    required List<Map<String, dynamic>> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        ...items.map(
          (item) => ListTile(
            dense: true,
            title: Text(
              item['label'],
              style: const TextStyle(fontSize: 16, color: Colors.white),
            ),
            leading: const Icon(
              Icons.arrow_right,
              color: Colors.white,
              size: 20,
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => item['route']),
              );
            },
          ),
        ),
        const Divider(color: Colors.white54, height: 20),
      ],
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

  @override
  void initState() {
    super.initState();
    cargarReservas();
  }

  Future<void> cargarReservas() async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:3001/api/ReservasAreasComunesMovil'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);
        final List<dynamic> data = jsonResponse['mmostraareascomunes'];
        setState(() {
          reservas = data.map((json) => Reserva.fromJson(json)).toList();
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

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (errorMessage.isNotEmpty) {
      return Center(child: Text(errorMessage));
    }

    if (reservas.isEmpty) {
      return const Center(child: Text('No hay reservas disponibles'));
    }

    return RefreshIndicator(
      onRefresh: cargarReservas,
      child: ListView.builder(
        itemCount: reservas.length,
        itemBuilder: (context, index) {
          final reserva = reservas[index];
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 8),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Reserva ${reserva.idReservas ?? "N/A"}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Divider(color: Colors.lightGreen),

                  _buildInfoRow(
                    Icons.calendar_month,
                    'Fecha',
                    reserva.fechaReserva ?? 'N/A',
                  ),
                  _buildInfoRow(
                    Icons.access_time,
                    'Horario',
                    '${reserva.horaInicio ?? ""} - ${reserva.horaFin ?? ""}',
                  ),
                  _buildInfoRow(
                    Icons.sticky_note_2,
                    'Motivo',
                    reserva.motivoReserva ?? 'N/A',
                  ),
                  _buildInfoRow(
                    Icons.group,
                    'Asistentes',
                    '${reserva.cantidadAsistentes ?? 0}',
                  ),
                  _buildInfoRow(
                    Icons.assignment_turned_in,
                    'Estado',
                    reserva.nombreEstado ?? 'N/A',
                  ),
                  _buildInfoRow(
                    Icons.home,
                    'Apartamento',
                    reserva.numeroApartamento ?? 'N/A',
                  ),

                  const SizedBox(height: 14),
                  Text(
                    'Datos del solicitante',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.green,
                    ),
                  ),
                  Divider(color: Colors.lightGreen),

                  _buildInfoRow(
                    Icons.person,
                    'Nombre',
                    reserva.nombreSolicitante ?? 'N/A',
                  ),
                  _buildInfoRow(
                    Icons.badge,
                    'Documento',
                    reserva.documentoSolicitante ?? 'N/A',
                  ),
                  _buildInfoRow(
                    Icons.email,
                    'Correo',
                    reserva.correoSolicitante ?? 'N/A',
                  ),
                  _buildInfoRow(
                    Icons.call,
                    'Teléfono',
                    reserva.telefonoSolicitante ?? 'N/A',
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icono, String titulo, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icono, size: 20),
          const SizedBox(width: 10),
          Text(
            '$titulo: ',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          Expanded(child: Text(valor, style: const TextStyle(fontSize: 15))),
        ],
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
  final String? documentoSolicitante;
  final String? nombreSolicitante;
  final String? correoSolicitante;
  final String? telefonoSolicitante;

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
    this.documentoSolicitante,
    this.nombreSolicitante,
    this.correoSolicitante,
    this.telefonoSolicitante,
  });

  factory Reserva.fromJson(Map<String, dynamic> json) {
    return Reserva(
      idReservas: json['idReservas'] as int?,
      fechaReserva: json['fechaReserva'] as String?,
      horaInicio: json['horaInicio'] as String?,
      horaFin: json['horaFin'] as String?,
      motivoReserva: json['motivoReserva'] as String?,
      cantidadAsistentes: json['cantidadAsistentes'] as int?,
      invitadosExternos: json['invitadosExternos'] as int?,
      nombreEstado: json['estado']?['nombreEstado'] as String?,
      numeroApartamento: json['apartamento']?['numeroApartamento'] as String?,
      documentoSolicitante:
          json['Solicitante']?['documentoSolicitante'] as String?,
      nombreSolicitante: json['Solicitante']?['nombreSolicitante'] as String?,
      correoSolicitante: json['Solicitante']?['correoSolicitante'] as String?,
      telefonoSolicitante:
          json['Solicitante']?['telefonoSolicitante'] as String?,
    );
  }
}
