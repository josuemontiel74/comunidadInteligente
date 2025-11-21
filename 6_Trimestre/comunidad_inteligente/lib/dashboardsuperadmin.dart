
import 'package:flutter/material.dart';
import 'main.dart';
import 'gestionusuarios.dart';
import 'areascomunes.dart';
class Dashboardsuperadmin extends StatelessWidget {
  final String? token;
  const Dashboardsuperadmin({super.key, required this.token});

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
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              SizedBox(height: 20),
              Text(
                'Bienvenido',
                style: TextStyle(
                  fontSize: 32,
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 15),
              Text(
                'Selecciona el módulo que deseas gestionar en la plataforma',
                style: TextStyle(fontSize: 16, color: Colors.grey[700]),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 30),
              _buildModuleGrid(context),
            ],
          ),
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
          SizedBox(height: 15),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'Menú Super Admin',
              style: TextStyle(
                fontSize: 25,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Divider(color: Colors.white70, thickness: 1.5),
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
              {'label': 'Registrar Usuario', 'route': MostrarUsuario(token: token)},
              {'label': 'Consultar Usuario', 'route': MostrarUsuario(token: token)},
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
          SizedBox(height: 20),
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
              icon: Icon(Icons.logout, color: Colors.black),
              label: Text(
                "Cerrar Sesión",
                style: TextStyle(fontSize: 18, color: Colors.black),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                minimumSize: Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
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
              style: TextStyle(fontSize: 16, color: Colors.white),
            ),
            leading: Icon(Icons.arrow_right, color: Colors.white, size: 20),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => item['route']),
              );
            },
          ),
        ),
        Divider(color: Colors.white54, height: 20),
      ],
    );
  }

  Widget _buildModuleGrid(BuildContext context) {
    final modules = [
      {
        'title': 'Gestión de Paquetería',
        'image': 'assets/img/paquetes.jpeg',
        'route': TerceraPantalla(),
      },
      {
        'title': 'Gestión de Visitas',
        'image': 'assets/img/visitas.jpg',
        'route': TerceraPantalla(),
      },
      {
        'title': 'Áreas Comunes',
        'image': 'assets/img/areascomunes.jpg',
        'route': Areascomunes(token:token),
      },
      {
        'title': 'Gestión de Usuarios',
        'image': 'assets/img/gestion.webp',
        'route': MostrarUsuario(token: token),
      },
      {
        'title': 'Gestión de Residentes',
        'image': 'assets/img/residentes.jpg',
        'route': TerceraPantalla(),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 20,
        mainAxisSpacing: 20,
        childAspectRatio: 0.85,
      ),
      itemCount: modules.length,
      itemBuilder: (context, index) {
        final module = modules[index];
        return _buildModuleCard(
          context,
          title: module['title'] as String,
          imagePath: module['image'] as String,
          route: module['route'] as Widget,
        );
      },
    );
  }

  Widget _buildModuleCard(
    BuildContext context, {
    required String title,
    required String imagePath,
    required Widget route,
  }) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => route),
          );
        },
        borderRadius: BorderRadius.circular(15),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.asset(
                    imagePath,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Icon(
                        Icons.image_not_supported,
                        size: 60,
                        color: Colors.grey,
                      );
                    },
                  ),
                ),
              ),
              SizedBox(height: 10),
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.black87,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TerceraPantalla extends StatelessWidget {
  const TerceraPantalla({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('Pantalla en Construcción'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.construction,
              size: 100,
              color: Colors.orange,
            ),
            SizedBox(height: 20),
            Text(
              'Módulo en Construcción',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'Esta funcionalidad estará disponible pronto',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 30),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: Icon(Icons.arrow_back),
              label: Text('Volver'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              ),
            ),
          ],
        ),
      ),
    );
  }
}