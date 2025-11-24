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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Gestión de Áreas Comunes',
                  style: TextStyle(
                    fontSize: 20,
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => RegistrarReserva(token: token),
                      ),
                    );
                  },
                  icon: const Icon(Icons.add, color: Colors.white),
                  label: const Text("Añadir"),
                ),
              ],
            ),
            const SizedBox(height: 15),
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

  Future<void> finalizarReserva(int idReservas) async {
    final url = Uri.parse(
      'http://localhost:3001/api/AtulizarReserva/$idReservas',
    );

    final response = await http.put(
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
    try {
      final response = await http.get(
        Uri.parse('http://localhost:3001/api/ReservasAreasComunesMovil'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
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
        padding: const EdgeInsets.all(12),
        itemCount: reservas.length,
        itemBuilder: (context, index) {
          final r = reservas[index];
          final estaFinalizada = r.nombreEstado?.toLowerCase() == "finalizada";

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: Colors.white,
              boxShadow: [
                BoxShadow(blurRadius: 12, offset: const Offset(0, 4)),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: estaFinalizada ? Colors.grey.shade600 : Colors.green.shade600,
                    child: Row(
                      children: [
                        const Icon(Icons.event_note, color: Colors.white),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            "Reserva #${r.idReservas ?? 'N/A'}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 19,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        // Solo mostrar botones si NO está finalizada
                        if (!estaFinalizada) ...[
                          IconButton(
                            icon: const Icon(
                              Icons.edit,
                              color: Colors.white,
                              size: 30,
                            ),
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
                          ),
                          const SizedBox(width: 10),
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red, size: 30),
                            onPressed: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text("Confirmar"),
                                  content: const Text(
                                    "¿Deseas finalizar esta reserva?",
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context, false),
                                      child: const Text("Cancelar"),
                                    ),
                                    TextButton(
                                      onPressed: () => Navigator.pop(context, true),
                                      child: const Text("Sí"),
                                    ),
                                  ],
                                ),
                              );

                              if (confirm == true) {
                                await finalizarReserva(r.idReservas!);
                              }
                            },
                          ),
                        ],
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _infoBlock("Datos de la Reserva", [
                          const SizedBox(height: 8),
                          _buildInfoRow(
                            Icons.calendar_month,
                            "Fecha",
                            r.fechaReserva,
                          ),
                          _buildInfoRow(
                            Icons.access_time,
                            "Horario",
                            "${r.horaInicio} - ${r.horaFin}",
                          ),
                          _buildInfoRow(
                            Icons.sticky_note_2,
                            "Motivo",
                            r.motivoReserva,
                          ),
                          _buildInfoRow(
                            Icons.groups,
                            "Asistentes",
                            "${r.cantidadAsistentes}",
                          ),
                          _buildInfoRow(
                            Icons.home,
                            "Apartamento",
                            r.numeroApartamento ?? "N/A",
                          ),
                          _buildInfoRow(
                            Icons.flag_circle,
                            "Estado",
                            r.nombreEstado ?? "N/A",
                          ),
                        ]),
                        const SizedBox(height: 12),
                        _infoBlock("Solicitante", [
                          _buildInfoRow(
                            Icons.person,
                            "Nombre",
                            r.nombreSolicitante ?? "N/A",
                          ),
                          _buildInfoRow(
                            Icons.badge,
                            "Documento",
                            r.documentoSolicitante ?? "N/A",
                          ),
                          _buildInfoRow(
                            Icons.email,
                            "Correo",
                            r.correoSolicitante ?? "N/A",
                          ),
                          _buildInfoRow(
                            Icons.call,
                            "Teléfono",
                            r.telefonoSolicitante ?? "N/A",
                          ),
                        ]),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String titulo, String? valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 22, color: Colors.green.shade700),
          const SizedBox(width: 12),
          Text(
            "$titulo:",
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(valor ?? "N/A", style: const TextStyle(fontSize: 15)),
          ),
        ],
      ),
    );
  }

  Widget _infoBlock(String titulo, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.grey.shade100,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            titulo,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Colors.green.shade700,
            ),
          ),
          const SizedBox(height: 6),
          const Divider(),
          ...children,
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
  final String? tipodocumento;
  final String? areaComun;
  final int? aceptaReglamento;
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
    this.tipodocumento,
    this.areaComun,
    this.aceptaReglamento,
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
      tipodocumento: json['tipodocumento']?['nombreDocumento'] as String?,
      areaComun: json['areaComun']?['nombreArea'] as String?,
      aceptaReglamento: json['aceptaReglamento'] as int?,
    );
  }
}

class RegistrarReserva extends StatefulWidget {
  const RegistrarReserva({super.key, required this.token});

  final String? token;

  @override
  State<RegistrarReserva> createState() => _RegistrarReservaState();
}

class _RegistrarReservaState extends State<RegistrarReserva> {
  final _formKey = GlobalKey<FormState>();
  String? nombreSolicitante;
  String? documentoSolicitante;
  String? telefonoSolicitante;
  String? correoSolicitante;
  String? tipoDocumentoId;
  String? areaComunId;
  String? motivoReserva;
  String? cantidadAsistentes;
  String? invitadosExternos;
  String? numeroApartamento;
  TimeOfDay? horaInicio;
  TimeOfDay? horaFin;
  DateTime? fechaReserva;
  int? aceptaReglamento;
  Future<void> crearReserva() async {
    final url = Uri.parse('http://localhost:3001/api/ReservarAreaMovil');
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer ${widget.token}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'nombreSolicitante': nombreSolicitante,
        'documentoSolicitante': documentoSolicitante,
        'telefonoSolicitante': telefonoSolicitante,
        'correoSolicitante': correoSolicitante,
        'tipoDocumentoId': tipoDocumentoId,
        'areaComunId': int.tryParse(areaComunId ?? '0'),
        'motivoReserva': motivoReserva,
        'cantidadAsistentes': int.tryParse(cantidadAsistentes ?? '0'),
        'invitadosExternos': int.tryParse(invitadosExternos ?? '0'),
        'numeroApartamento': int.tryParse(numeroApartamento ?? '0'),
        'aceptaReglamento': aceptaReglamento,
        'horaInicio': horaInicio != null
            ? '${horaInicio!.hour.toString().padLeft(2, '0')}:${horaInicio!.minute.toString().padLeft(2, '0')}'
            : null,
        'horaFin': horaFin != null
            ? '${horaFin!.hour.toString().padLeft(2, '0')}:${horaFin!.minute.toString().padLeft(2, '0')}'
            : null,
        'fechaReserva': fechaReserva?.toIso8601String(),
      }),
    );
    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Reserva creada correctamente"),
          backgroundColor: Colors.green,
          showCloseIcon: true,
        ),
      );
      await Future.delayed(const Duration(seconds: 1));
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error al crear la reserva (${response.statusCode})"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Colors.green),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text("Registrar Reserva"),
        backgroundColor: Colors.green,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Datos del solicitante",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),

              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 3,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextFormField(
                        decoration: InputDecoration(
                          labelText: "Nombre solicitante",
                          border: border,
                        ),
                        onSaved: (val) => nombreSolicitante = val,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: "Documento solicitante",
                          border: border,
                        ),
                        onSaved: (val) => documentoSolicitante = val,
                      ),
                      const SizedBox(height: 12),

                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: "Tipo documento",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(value: "1", child: Text("CC")),
                          DropdownMenuItem(value: "2", child: Text("CE")),
                          DropdownMenuItem(value: "3", child: Text("PP")),
                          DropdownMenuItem(value: "4", child: Text("PEP")),
                          DropdownMenuItem(value: "5", child: Text("PPT")),
                        ],
                        onChanged: (v) => tipoDocumentoId = v,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: "Teléfono",
                          border: border,
                        ),
                        onSaved: (val) => telefonoSolicitante = val,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: "Correo",
                          border: border,
                        ),
                        onSaved: (val) => correoSolicitante = val,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: "Número apartamento",
                          border: border,
                        ),
                        onSaved: (val) => numeroApartamento = val,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 25),
              // TITULO del apartado
              const Text(
                "Datos de la reserva",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),

              //segundo apartado 2
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 3,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: "Área común",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: "1",
                            child: Text("Salón comunal 1"),
                          ),
                          DropdownMenuItem(
                            value: "2",
                            child: Text("Salón comunal 2"),
                          ),
                          DropdownMenuItem(value: "3", child: Text("Zona BBQ")),
                        ],
                        onChanged: (v) => areaComunId = v,
                      ),
                      const SizedBox(height: 12),

                      // Fecha
                      TextFormField(
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: "Fecha reserva",
                          border: border,
                          suffixIcon: const Icon(
                            Icons.calendar_today,
                            color: Colors.green,
                          ),
                        ),
                        controller: TextEditingController(
                          text: fechaReserva != null
                              ? "${fechaReserva!.day}/${fechaReserva!.month}/${fechaReserva!.year}"
                              : "",
                        ),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate: DateTime(2100),
                          );
                          if (picked != null)
                            setState(() => fechaReserva = picked);
                        },
                      ),
                      const SizedBox(height: 12),

                      // Hora inicio
                      TextFormField(
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: "Hora inicio",
                          border: border,
                          suffixIcon: const Icon(
                            Icons.access_time,
                            color: Colors.green,
                          ),
                        ),
                        controller: TextEditingController(
                          text: horaInicio?.format(context) ?? "",
                        ),
                        onTap: () async {
                          final picked = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.now(),
                          );
                          if (picked != null)
                            setState(() => horaInicio = picked);
                        },
                      ),
                      const SizedBox(height: 12),

                      // Hora fin
                      TextFormField(
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: "Hora fin",
                          border: border,
                          suffixIcon: const Icon(
                            Icons.access_time_filled,
                            color: Colors.green,
                          ),
                        ),
                        controller: TextEditingController(
                          text: horaFin?.format(context) ?? "",
                        ),
                        onTap: () async {
                          final picked = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.now(),
                          );
                          if (picked != null) setState(() => horaFin = picked);
                        },
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: "Motivo reserva",
                          border: border,
                        ),
                        onSaved: (val) => motivoReserva = val,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: "Cantidad asistentes",
                          border: border,
                        ),
                        onSaved: (val) => cantidadAsistentes = val,
                      ),
                      const SizedBox(height: 12),

                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: "Invitados externos",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(value: "0", child: Text("No")),
                          DropdownMenuItem(value: "1", child: Text("Sí")),
                        ],
                        onChanged: (v) => invitadosExternos = v,
                      ),
                      const SizedBox(height: 12),

                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: "Acepta reglamento",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(value: "0", child: Text("No")),
                          DropdownMenuItem(value: "1", child: Text("Sí")),
                        ],
                        onChanged: (v) =>
                            aceptaReglamento = int.tryParse(v ?? '0'),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text("Guardar", style: TextStyle(fontSize: 18)),
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      _formKey.currentState!.save();
                      await crearReserva();
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class Actualizar extends StatefulWidget {
  const Actualizar({super.key, required this.token, required this.idReservas});
  final String? token;
  final int? idReservas;
  @override
  State<Actualizar> createState() => _ActualizarState();
}

class _ActualizarState extends State<Actualizar> {
  // Buscar reserva por idReservas
  List<Reserva> reservas = [];
  bool isLoading = true;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    cargarReservasId(widget.idReservas);
  }

  Future<void> cargarReservasId(int? idReservas) async {
    try {
      final response = await http.get(
        Uri.parse(
          'http://localhost:3001/api/BuscarReserva/${widget.idReservas}',
        ),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);
        final reservaJson = jsonResponse['mmostraareascomunes'];

        setState(() {
          reservas = [Reserva.fromJson(reservaJson)];
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

  final _formKey = GlobalKey<FormState>();
  String? nombreSolicitante;
  String? documentoSolicitante;
  String? telefonoSolicitante;
  String? correoSolicitante;
  String? tipoDocumentoId;
  String? areaComunId;
  String? motivoReserva;
  String? cantidadAsistentes;
  String? invitadosExternos;
  String? numeroApartamento;
  TimeOfDay? horaInicio;
  TimeOfDay? horaFin;
  DateTime? fechaReserva;
  int? aceptaReglamento;

  // ignore: non_constant_identifier_names
  Future<void> Actualizar() async {
    final url = Uri.parse(
      'http://localhost:3001/api/AtulizarReserva/${widget.idReservas}',
    );
    Map<String, dynamic> datosActualizar = {};

    if (nombreSolicitante != null && nombreSolicitante!.trim().isNotEmpty) {
      datosActualizar['nombreSolicitante'] = nombreSolicitante;
    }
    if (documentoSolicitante != null &&
        documentoSolicitante!.trim().isNotEmpty) {
      datosActualizar['documentoSolicitante'] = documentoSolicitante;
    }
    if (numeroApartamento != null && numeroApartamento!.trim().isNotEmpty) {
      datosActualizar['numeroApartamento'] = int.tryParse(numeroApartamento!);
    }
    if (fechaReserva != null) {
      datosActualizar['fechaReserva'] = fechaReserva!.toIso8601String();
    }
    if (horaInicio != null) {
      datosActualizar['horaInicio'] =
          '${horaInicio!.hour.toString().padLeft(2, '0')}:${horaInicio!.minute.toString().padLeft(2, '0')}';
    }
    if (horaFin != null) {
      datosActualizar['horaFin'] =
          '${horaFin!.hour.toString().padLeft(2, '0')}:${horaFin!.minute.toString().padLeft(2, '0')}';
    }

    if (telefonoSolicitante != null && telefonoSolicitante!.trim().isNotEmpty) {
      datosActualizar['telefonoSolicitante'] = telefonoSolicitante;
    }
    if (correoSolicitante != null && correoSolicitante!.trim().isNotEmpty) {
      datosActualizar['correoSolicitante'] = correoSolicitante;
    }
    if (tipoDocumentoId != null)
      datosActualizar['tipoDocumentoId'] = tipoDocumentoId;
    if (areaComunId != null)
      datosActualizar['areaComunId'] = int.tryParse(areaComunId!);
    if (motivoReserva != null && motivoReserva!.trim().isNotEmpty) {
      datosActualizar['motivoReserva'] = motivoReserva;
    }
    if (cantidadAsistentes != null && cantidadAsistentes!.trim().isNotEmpty) {
      datosActualizar['cantidadAsistentes'] = int.tryParse(cantidadAsistentes!);
    }
    if (invitadosExternos != null)
      datosActualizar['invitadosExternos'] = int.tryParse(invitadosExternos!);
    if (aceptaReglamento != null)
      datosActualizar['aceptaReglamento'] = aceptaReglamento;

    print('Datos a actualizar: $datosActualizar');

    final response = await http.put(
      url,
      headers: {
        'Authorization': 'Bearer ${widget.token}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(datosActualizar),
    );

    if (response.statusCode == 200) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Reserva actualizada correctamente"),
          backgroundColor: Colors.green,
          showCloseIcon: true,
        ),
      );
      await Future.delayed(const Duration(seconds: 1));
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "Error al actualizar la reserva (${response.statusCode})",
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Colors.green),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text("Actualizar Reserva"),
        backgroundColor: Colors.green,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Datos del solicitante",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),

              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 3,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextFormField(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].nombreSolicitante}"
                              : "Nombre solicitante",
                          border: border,
                        ),
                        onSaved: (val) => nombreSolicitante = val,
                      ),
                      const SizedBox(height: 12),

                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "(${reservas[0].tipodocumento})"
                              : "Tipo documento",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(value: "1", child: Text("CC")),
                          DropdownMenuItem(value: "2", child: Text("CE")),
                          DropdownMenuItem(value: "3", child: Text("PP")),
                          DropdownMenuItem(value: "4", child: Text("PEP")),
                          DropdownMenuItem(value: "5", child: Text("PPT")),
                        ],
                        onChanged: (v) => tipoDocumentoId = v,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].telefonoSolicitante}"
                              : "Teléfono",
                          border: border,
                        ),
                        onSaved: (val) => telefonoSolicitante = val,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].correoSolicitante}"
                              : "Correo",
                          border: border,
                        ),
                        onSaved: (val) => correoSolicitante = val,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "(${reservas[0].numeroApartamento})"
                              : "Número apartamento",
                          border: border,
                        ),
                        onSaved: (val) => numeroApartamento = val,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 25),
              // TITULO del apartado
              const Text(
                "Datos de la reserva",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              //segundo apartado 2
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 3,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].areaComun}"
                              : "Área común",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: "1",
                            child: Text("Salón comunal 1"),
                          ),
                          DropdownMenuItem(
                            value: "2",
                            child: Text("Salón comunal 2"),
                          ),
                          DropdownMenuItem(value: "3", child: Text("Zona BBQ")),
                        ],
                        onChanged: (v) => areaComunId = v,
                      ),
                      const SizedBox(height: 12),
                      // Fecha
                      TextFormField(
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].fechaReserva}"
                              : "Fecha reserva",
                          border: border,
                          suffixIcon: const Icon(
                            Icons.calendar_today,
                            color: Colors.green,
                          ),
                        ),
                        controller: TextEditingController(
                          text: fechaReserva != null
                              ? "${fechaReserva!.day}/${fechaReserva!.month}/${fechaReserva!.year}"
                              : "",
                        ),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate: DateTime(2100),
                          );
                          if (picked != null)
                            setState(() => fechaReserva = picked);
                        },
                      ),
                      const SizedBox(height: 12),
                      // Hora inicio
                      TextFormField(
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].horaInicio}"
                              : "Hora inicio",
                          border: border,
                          suffixIcon: const Icon(
                            Icons.access_time,
                            color: Colors.green,
                          ),
                        ),
                        controller: TextEditingController(
                          text: horaInicio?.format(context) ?? "",
                        ),
                        onTap: () async {
                          final picked = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.now(),
                          );
                          if (picked != null)
                            setState(() => horaInicio = picked);
                        },
                      ),
                      const SizedBox(height: 12),
                      // Hora fin
                      TextFormField(
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].horaFin}"
                              : "Hora fin",
                          border: border,
                          suffixIcon: const Icon(
                            Icons.access_time_filled,
                            color: Colors.lime,
                          ),
                        ),
                        controller: TextEditingController(
                          text: horaFin?.format(context) ?? "",
                        ),
                        onTap: () async {
                          final picked = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.now(),
                          );
                          if (picked != null) setState(() => horaFin = picked);
                        },
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].motivoReserva}"
                              : "Motivo reserva",
                          border: border,
                        ),
                        onSaved: (val) => motivoReserva = val,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].cantidadAsistentes}"
                              : "Cantidad asistentes",
                          border: border,
                        ),
                        onSaved: (val) => cantidadAsistentes = val,
                      ),
                      const SizedBox(height: 12),

                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].invitadosExternos}"
                              : "Invitados externos",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(value: "0", child: Text("No")),
                          DropdownMenuItem(value: "1", child: Text("Sí")),
                        ],
                        onChanged: (v) => invitadosExternos = v,
                      ),
                      const SizedBox(height: 12),

                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: reservas.isNotEmpty
                              ? "${reservas[0].aceptaReglamento}"
                              : "Acepta reglamento",
                          border: border,
                        ),
                        items: const [
                          DropdownMenuItem(value: "0", child: Text("No")),
                          DropdownMenuItem(value: "1", child: Text("Sí")),
                        ],
                        onChanged: (v) =>
                            aceptaReglamento = int.tryParse(v ?? '0'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    "actualizar",
                    style: TextStyle(fontSize: 18),
                  ),
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      _formKey.currentState!.save();
                      await Actualizar();
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
