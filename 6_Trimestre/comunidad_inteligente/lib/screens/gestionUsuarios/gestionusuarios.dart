import 'package:flutter/material.dart';
import '../../main.dart';
import '../paqueteria/paqueteria.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class MostrarUsuario extends StatefulWidget {
  final String? token;
  const MostrarUsuario({super.key, required this.token});

  @override
  State<MostrarUsuario> createState() => _MostradoState();
}

class _MostradoState extends State<MostrarUsuario> {
  List<User> users = [];
  bool isLoading = true;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    mostrarUsuarios();
  }

  Future<void> mostrarUsuarios() async {
    try {
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/usuario'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);
        final List<dynamic> data = jsonResponse['body'];
        setState(() {
          users = data.map((json) => User.fromJson(json)).toList();
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = "Error al cargar usuarios: ${response.statusCode}";
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
    return Scaffold(
      endDrawer: _buildDrawer(context),
      backgroundColor: Colors.white,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 0,
        title: Center(
          child: Image.asset(
            'assets/img/logo.png',
            width: 75,
            height: 65,
            fit: BoxFit.contain,
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.green,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          SizedBox(height: 15),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'Menú Super Admin',
              style: TextStyle(
                fontSize: 25,
                color: Colors.black,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Divider(color: Colors.white),
          _buildMenuSection(
            context,
            title: 'Gestión Paquetes',
            items: [
              {
                'label': 'Registrar Paquete',
                'route': ModuloPaqueteria(abrirModalRegistro: true),
              },
              {'label': 'Historial de Paquetes', 'route': ModuloPaqueteria()},
            ],
          ),
          _buildMenuSection(
            context,
            title: 'Gestión de Visitas',
            items: [
              {
                'label': 'Crear Visitas',
                'route': Scaffold(
                  appBar: AppBar(title: Text('En construcción')),
                ),
              },
              {
                'label': 'Consultar Visitas',
                'route': Scaffold(
                  appBar: AppBar(title: Text('En construcción')),
                ),
              },
              {
                'label': 'Consultar Parqueadero',
                'route': Scaffold(
                  appBar: AppBar(title: Text('En construcción')),
                ),
              },
            ],
          ),
          _buildMenuSection(
            context,
            title: 'Gestión de Áreas Comunes',
            items: [
              {
                'label': 'Registrar Reserva',
                'route': Scaffold(
                  appBar: AppBar(title: Text('En construcción')),
                ),
              },
              {
                'label': 'Consultar Zona',
                'route': Scaffold(
                  appBar: AppBar(title: Text('En construcción')),
                ),
              },
            ],
          ),
          _buildMenuSection(
            context,
            title: 'Gestión de Residentes',
            items: [
              {
                'label': 'Registrar Residentes',
                'route': Scaffold(
                  appBar: AppBar(title: Text('En construcción')),
                ),
              },
              {
                'label': 'Consultar Residentes',
                'route': Scaffold(
                  appBar: AppBar(title: Text('En construcción')),
                ),
              },
            ],
          ),
          SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: ElevatedButton(
              onPressed: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => MyApp()),
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                minimumSize: Size(100, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                "Cerrar Sesión",
                style: TextStyle(fontSize: 18, color: Colors.black),
              ),
            ),
          ),
          SizedBox(height: 20),
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
            style: TextStyle(
              fontSize: 20,
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        ...items.map(
          (item) => ListTile(
            title: Text(
              item['label'],
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => item['route']),
              );
            },
          ),
        ),
        Divider(color: Colors.white70),
      ],
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return Center(child: CircularProgressIndicator(color: Colors.green));
    }

    if (errorMessage.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 60, color: Colors.red),
            SizedBox(height: 16),
            Text(
              errorMessage,
              style: TextStyle(fontSize: 16, color: Colors.red),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  isLoading = true;
                  errorMessage = '';
                });
                mostrarUsuarios();
              },
              child: Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (users.isEmpty) {
      return Center(
        child: Text(
          'No hay usuarios registrados',
          style: TextStyle(fontSize: 18, color: Colors.grey),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: mostrarUsuarios,
      child: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: users.length,
        itemBuilder: (context, index) {
          final user = users[index];
          return Card(
            elevation: 3,
            margin: EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListTile(
              contentPadding: EdgeInsets.all(16),
              leading: CircleAvatar(
                backgroundColor: Colors.green,
                child: Icon(Icons.person, color: Colors.white),
              ),
              title: Text(
                user.username ?? 'Sin nombre',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 8),
                  Text('Documento: ${user.numeroDocumento ?? 'N/A'}'),
                  Text('Rol ID: ${user.rolesId ?? 'N/A'}'),
                  Text('Estado ID: ${user.estadoId ?? 'N/A'}'),
                ],
              ),
              trailing: Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () {
                // Acción al tocar el usuario
              },
            ),
          );
        },
      ),
    );
  }
}

class User {
  final String? username;
  final String? numeroDocumento;
  final int? rolesId;
  final int? estadoId;

  User({
    required this.username,
    required this.numeroDocumento,
    required this.rolesId,
    required this.estadoId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      username: json['username'],
      numeroDocumento: json['numeroDocumento'],
      rolesId: json['rolesId'],
      estadoId: json['estadoId'],
    );
  }
}
