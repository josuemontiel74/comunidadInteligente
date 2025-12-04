import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

// ============================================================================
// API SERVICE - COMPLETO
// ============================================================================
class ApiService {
  static const String _baseUrl = 'http://localhost:3001/api';

  // GET /visitaJoin - Lista con JOINs
  static Future<List<dynamic>> obtenerVisitas(String token) async {
    try {
      print('📡 GET: $_baseUrl/visitaJoin');
      final response = await http.get(
        Uri.parse('$_baseUrl/visitaJoin'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Visitas: ${data.length}');
        return data;
      }
      return [];
    } catch (e) {
      print('❌ Error: $e');
      return [];
    }
  }

  // GET /visita/:idVisita - Detalle de visita
  static Future<Map<String, dynamic>?> obtenerVisitaPorId(String token, int idVisita) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/visita/$idVisita'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['body'];
      }
      return null;
    } catch (e) {
      print('❌ Error: $e');
      return null;
    }
  }

  // POST /visita - Crear visita
  static Future<bool> crearVisita(String token, Map<String, dynamic> data) async {
    try {
      print('📤 POST /visita: $data');
      final response = await http.post(
        Uri.parse('$_baseUrl/visita'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(data),
      ).timeout(const Duration(seconds: 10));

      print('📡 Status: ${response.statusCode}');
      print('📄 Response: ${response.body}');
      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      print('❌ Error: $e');
      return false;
    }
  }

  // PATCH /visita/:idVisita - Editar visita
  static Future<bool> editarVisita(String token, int idVisita, Map<String, dynamic> data) async {
    try {
      print('📝 PATCH /visita/$idVisita: $data');
      final response = await http.patch(
        Uri.parse('$_baseUrl/visita/$idVisita'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(data),
      ).timeout(const Duration(seconds: 10));

      print('📡 Status: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error: $e');
      return false;
    }
  }

  // PATCH /visitaFinalizar/:idVisita - Finalizar visita
  static Future<bool> finalizarVisita(String token, int idVisita) async {
    try {
      print('🏁 PATCH /visitaFinalizar/$idVisita');
      final response = await http.patch(
        Uri.parse('$_baseUrl/visitaFinalizar/$idVisita'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error: $e');
      return false;
    }
  }

  // GET /visitante - Lista de visitantes
  static Future<List<dynamic>> obtenerVisitantes(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/visitante'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      print('❌ Error: $e');
      return [];
    }
  }

  // GET /visitante/:numeroDocumento - Detalle de visitante
  static Future<Map<String, dynamic>?> obtenerVisitantePorDoc(String token, String numeroDocumento) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/visitante/$numeroDocumento'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('❌ Error: $e');
      return null;
    }
  }

  // POST /visitante - Crear visitante
  static Future<bool> crearVisitante(String token, Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/visitante'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(data),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      print('❌ Error: $e');
      return false;
    }
  }

  // PATCH /visitante/:numeroDocumento - Editar visitante
  static Future<bool> editarVisitante(String token, String numeroDocumento, Map<String, dynamic> data) async {
    try {
      print('📝 PATCH /visitante/$numeroDocumento: $data');
      final response = await http.patch(
        Uri.parse('$_baseUrl/visitante/$numeroDocumento'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(data),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error: $e');
      return false;
    }
  }

  // DELETE /visitante/:numeroDocumento - Eliminar visitante
  static Future<bool> eliminarVisitante(String token, String numeroDocumento) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/visitante/$numeroDocumento'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('❌ Error: $e');
      return false;
    }
  }
}

// ============================================================================
// HOMESCREEN
// ============================================================================
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  String? token;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarToken();
  }

  Future<void> _cargarToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      token = prefs.getString('token');
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (token == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const Text('No se encontró token'),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Volver'),
              ),
            ],
          ),
        ),
      );
    }

    final List<Widget> _screens = [
      VisitasScreen(token: token!),
      VisitantesScreen(token: token!),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Comunidad Inteligente'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.remove('token');
              Navigator.pop(context);
            },
          ),
        ],
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.event), label: 'Visitas'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Visitantes'),
        ],
      ),
    );
  }
}

// ============================================================================
// VISITAS SCREEN
// ============================================================================
class VisitasScreen extends StatefulWidget {
  final String token;
  const VisitasScreen({super.key, required this.token});

  @override
  _VisitasScreenState createState() => _VisitasScreenState();
}

class _VisitasScreenState extends State<VisitasScreen> {
  List<dynamic> visitas = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarVisitas();
  }

  Future<void> _cargarVisitas() async {
    setState(() => isLoading = true);
    final data = await ApiService.obtenerVisitas(widget.token);
    setState(() {
      visitas = data;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      body: visitas.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.event_busy, size: 64, color: Colors.grey),
                  const Text('No hay visitas'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _mostrarFormularioCrear(),
                    child: const Text('Crear Primera Visita'),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: visitas.length,
              itemBuilder: (context, index) {
                final visita = visitas[index];
                final esActiva = visita['estadoVisita'] != 'Finalizada';

                return Card(
                  child: ListTile(
                    title: Text('Visita #${visita['idVisita']} - ${visita['nombreVisitante'] ?? 'N/A'}'),
                    subtitle: Text('Apto: ${visita['numeroApartamento']} | Estado: ${visita['estadoVisita']}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.visibility, color: Colors.blue),
                          onPressed: () => _verDetalles(visita),
                        ),
                        if (esActiva) ...[
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.orange),
                            onPressed: () => _mostrarFormularioEditar(visita),
                          ),
                          IconButton(
                            icon: const Icon(Icons.check, color: Colors.green),
                            onPressed: () => _finalizarVisita(visita['idVisita']),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _mostrarFormularioCrear(),
        backgroundColor: Colors.green,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _verDetalles(dynamic visita) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Visita #${visita['idVisita']}'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Visitante: ${visita['nombreVisitante'] ?? 'N/A'}'),
              Text('Documento: ${visita['numeroDocumento']}'),
              Text('Apartamento: ${visita['numeroApartamento']}'),
              Text('Torre: ${visita['nombreTorre']}'),
              Text('Estado: ${visita['estadoVisita']}'),
              Text('Ingreso: ${visita['fechaHoraIngreso'] ?? 'N/A'}'),
              if (visita['fechaHoraSalida'] != null)
                Text('Salida: ${visita['fechaHoraSalida']}'),
              if (visita['matricula'] != null)
                Text('Vehículo: ${visita['matricula']} - ${visita['nombreVehiculo'] ?? ''}'),
              if (visita['observaciones'] != null)
                Text('Observaciones: ${visita['observaciones']}'),
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

  void _mostrarFormularioCrear() {
    final docController = TextEditingController();
    final nombreController = TextEditingController();
    final aptoController = TextEditingController();
    final obsController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nueva Visita'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: docController,
                decoration: const InputDecoration(labelText: 'Documento *'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: nombreController,
                decoration: const InputDecoration(labelText: 'Nombre *'),
              ),
              TextField(
                controller: aptoController,
                decoration: const InputDecoration(labelText: 'ID Apartamento *'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: obsController,
                decoration: const InputDecoration(labelText: 'Observaciones'),
                maxLines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (docController.text.isEmpty || nombreController.text.isEmpty || aptoController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Complete los campos obligatorios')),
                );
                return;
              }

              Navigator.pop(context);

              final success = await ApiService.crearVisita(widget.token, {
                'numeroDocumento': docController.text,
                'nombreVisitante': nombreController.text,
                'tipoDocumentoId': 1,
                'apartamentoId': int.parse(aptoController.text),
                'fechaHoraIngreso': DateTime.now().toIso8601String(),
                'estadoId': 8,
                'observaciones': obsController.text.isEmpty ? null : obsController.text,
              });

              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('✅ Visita creada')),
                );
                _cargarVisitas();
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('❌ Error al crear')),
                );
              }
            },
            child: const Text('Crear'),
          ),
        ],
      ),
    );
  }

  void _mostrarFormularioEditar(dynamic visita) {
    final nombreController = TextEditingController(text: visita['nombreVisitante']);
    final obsController = TextEditingController(text: visita['observaciones'] ?? '');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Editar Visita #${visita['idVisita']}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nombreController,
              decoration: const InputDecoration(labelText: 'Nombre Visitante'),
            ),
            TextField(
              controller: obsController,
              decoration: const InputDecoration(labelText: 'Observaciones'),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);

              final success = await ApiService.editarVisita(widget.token, visita['idVisita'], {
                'nombreVisitante': nombreController.text,
                'observaciones': obsController.text.isEmpty ? null : obsController.text,
              });

              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('✅ Visita actualizada')),
                );
                _cargarVisitas();
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  Future<void> _finalizarVisita(int idVisita) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar'),
        content: const Text('¿Finalizar esta visita?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Finalizar'),
          ),
        ],
      ),
    );

    if (confirmar == true) {
      final success = await ApiService.finalizarVisita(widget.token, idVisita);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Visita finalizada')),
        );
        _cargarVisitas();
      }
    }
  }
}

// ============================================================================
// VISITANTES SCREEN
// ============================================================================
class VisitantesScreen extends StatefulWidget {
  final String token;
  const VisitantesScreen({super.key, required this.token});

  @override
  _VisitantesScreenState createState() => _VisitantesScreenState();
}

class _VisitantesScreenState extends State<VisitantesScreen> {
  List<dynamic> visitantes = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarVisitantes();
  }

  Future<void> _cargarVisitantes() async {
    setState(() => isLoading = true);
    final data = await ApiService.obtenerVisitantes(widget.token);
    setState(() {
      visitantes = data;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      body: visitantes.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.people_outline, size: 64, color: Colors.grey),
                  const Text('No hay visitantes'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _mostrarFormularioCrear(),
                    child: const Text('Crear Primer Visitante'),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: visitantes.length,
              itemBuilder: (context, index) {
                final visitante = visitantes[index];
                return Card(
                  child: ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text(visitante['nombreVisitante'] ?? 'N/A'),
                    subtitle: Text('Doc: ${visitante['numeroDocumento']}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit, color: Colors.orange),
                          onPressed: () => _mostrarFormularioEditar(visitante),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _confirmarEliminar(visitante['numeroDocumento'], visitante['nombreVisitante']),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _mostrarFormularioCrear(),
        backgroundColor: Colors.green,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _mostrarFormularioCrear() {
    final docController = TextEditingController();
    final nombreController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuevo Visitante'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: docController,
              decoration: const InputDecoration(labelText: 'Documento *'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              controller: nombreController,
              decoration: const InputDecoration(labelText: 'Nombre *'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (docController.text.isEmpty || nombreController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Complete todos los campos')),
                );
                return;
              }

              Navigator.pop(context);

              final success = await ApiService.crearVisitante(
                widget.token,
                {
                  'numeroDocumento': docController.text,
                  'nombreVisitante': nombreController.text,
                  'tipoDocumentoId': 1,
                },
              );

              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('✅ Visitante creado')),
                );
                _cargarVisitantes();
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('❌ Error al crear')),
                );
              }
            },
            child: const Text('Crear'),
          ),
        ],
      ),
    );
  }

  void _mostrarFormularioEditar(dynamic visitante) {
    final nombreController = TextEditingController(text: visitante['nombreVisitante']);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Editar Visitante'),
        content: TextField(
          controller: nombreController,
          decoration: const InputDecoration(labelText: 'Nombre'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);

              final success = await ApiService.editarVisitante(
                widget.token,
                visitante['numeroDocumento'],
                {'nombreVisitante': nombreController.text, 'tipoDocumentoId': visitante['tipoDocumentoId']},
              );

              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('✅ Visitante actualizado')),
                );
                _cargarVisitantes();
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmarEliminar(String numeroDocumento, String nombre) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar'),
        content: Text('¿Eliminar a $nombre?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmar == true) {
      final success = await ApiService.eliminarVisitante(widget.token, numeroDocumento);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Eliminado')),
        );
        _cargarVisitantes();
      }
    }
  }
}