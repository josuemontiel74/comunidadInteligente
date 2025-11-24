import 'package:flutter/material.dart';
import '../../main.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../paqueteria/paqueteria.dart';

class Dashboardvigilante extends StatefulWidget {
  final String nombreUsuario;

  const Dashboardvigilante({super.key, this.nombreUsuario = 'Vigilante'});

  @override
  State<Dashboardvigilante> createState() => _DashboardvigilanteState();
}

class _DashboardvigilanteState extends State<Dashboardvigilante> {
  int paquetesRecibidosHoy = 0;
  int parqueosLibres = 0;
  int parqueosOcupados = 0;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    try {
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/dashboard/resumen'),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final datos = responseData['data'];
        setState(() {
          paquetesRecibidosHoy = datos['paquetes']?['recibidos'] ?? 0;
          parqueosLibres = datos['parqueaderos']?['disponibles'] ?? 0;
          parqueosOcupados =
              (datos['parqueaderos']?['ocupadosResidentes'] ?? 0) +
              (datos['parqueaderos']?['ocupadosVisitantes'] ?? 0);
          isLoading = false;
        });
      } else {
        setState(() {
          isLoading = false;
        });
      }
    } catch (error) {
      setState(() {
        isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al cargar datos del dashboard'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      endDrawer: Drawer(
        backgroundColor: Colors.white,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(vertical: 30, horizontal: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.blue.shade400, Colors.blue.shade700],
                ),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white,
                    child: Icon(Icons.security, size: 50, color: Colors.blue),
                  ),
                  SizedBox(height: 15),
                  Text(
                    'Menú Vigilante',
                    style: TextStyle(
                      fontSize: 24,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 5),
                  Text(
                    widget.nombreUsuario,
                    style: TextStyle(fontSize: 16, color: Colors.white70),
                  ),
                ],
              ),
            ),
            SizedBox(height: 10),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildMenuSection('Gestión de Paquetes', [
                      _buildMenuItemNav(
                        context,
                        Icons.add_box,
                        'Registrar Paquete',
                        ModuloPaqueteria(abrirModalRegistro: true),
                      ),
                      _buildMenuItemNav(
                        context,
                        Icons.history,
                        'Historial de Paquetes',
                        ModuloPaqueteria(),
                      ),
                    ]),
                    _buildMenuSection('Gestión de Visitas', [
                      _buildMenuItem(
                        context,
                        Icons.person_add,
                        'Crear Visitas',
                      ),
                      _buildMenuItem(
                        context,
                        Icons.search,
                        'Consultar Visitas',
                      ),
                    ]),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Divider(thickness: 1, color: Colors.grey.shade300),
            ),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => MyApp()),
                    (route) => false,
                  );
                },
                icon: Icon(Icons.logout, color: Colors.white),
                label: Text(
                  "Cerrar Sesión",
                  style: TextStyle(fontSize: 18, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade600,
                  minimumSize: Size(double.infinity, 55),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  elevation: 4,
                ),
              ),
            ),
          ],
        ),
      ),
      backgroundColor: Colors.white,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 3,
        toolbarHeight: 90,
        title: Stack(
          children: [
            // Logo centrado
            Center(
              child: GestureDetector(
                onTap: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => Dashboardvigilante(
                        nombreUsuario: widget.nombreUsuario,
                      ),
                    ),
                  );
                },
                child: Container(
                  width: 85,
                  height: 85,
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.blue.withOpacity(0.3),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  padding: EdgeInsets.all(8),
                  child: ClipOval(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      padding: EdgeInsets.all(6),
                      child: Image.asset(
                        'assets/img/logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Botón de perfil a la izquierda
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              child: Center(
                child: IconButton(
                  icon: Icon(Icons.person, color: Colors.blue, size: 32),
                  onPressed: () {
                    _mostrarPerfilUsuario(context);
                  },
                  tooltip: 'Ver perfil',
                ),
              ),
            ),
            // Botón de actualizar a la derecha (antes del menú)
            Positioned(
              right: 48,
              top: 0,
              bottom: 0,
              child: Center(
                child: IconButton(
                  icon: Icon(
                    isLoading ? Icons.hourglass_empty : Icons.refresh,
                    color: Colors.blue,
                    size: 28,
                  ),
                  onPressed: isLoading
                      ? null
                      : () {
                          setState(() {
                            isLoading = true;
                          });
                          _cargarDatos();
                        },
                  tooltip: 'Actualizar datos',
                ),
              ),
            ),
          ],
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final bool isWeb = constraints.maxWidth > 800;

          return isLoading
              ? Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  child: Column(
                    children: [
                      SizedBox(height: 25),
                      Center(
                        child: Text(
                          'Bienvenido, ${widget.nombreUsuario}',
                          style: TextStyle(
                            fontSize: 35,
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      SizedBox(height: 25),
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Text(
                            'Módulos disponibles para vigilancia',
                            style: TextStyle(fontSize: 13, color: Colors.black),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                      SizedBox(height: 35),
                      if (isWeb)
                        _buildWebView(context)
                      else
                        _buildMobileView(context),
                      SizedBox(height: 50),
                      _buildEstadisticasSection(context, isWeb),
                      SizedBox(height: 40),
                    ],
                  ),
                );
        },
      ),
    );
  }

  Widget _buildWebView(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Wrap(
        spacing: 30,
        runSpacing: 30,
        alignment: WrapAlignment.center,
        children: _buildModuleCards(context),
      ),
    );
  }

  Widget _buildMobileView(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 280,
          child: PageView(
            padEnds: false,
            controller: PageController(viewportFraction: 0.88),
            children: _buildModuleCards(context).map((card) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: card,
              );
            }).toList(),
          ),
        ),
        SizedBox(height: 15),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.arrow_back_ios, size: 16, color: Colors.grey),
            SizedBox(width: 8),
            Text(
              'Desliza para ver más módulos',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            SizedBox(width: 8),
            Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ],
    );
  }

  List<Widget> _buildModuleCards(BuildContext context) {
    return [
      _buildModuleCard(
        context,
        icon: Icons.inventory_2,
        title: 'Paquetería',
        color: Colors.blue,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => ModuloPaqueteria()),
          );
        },
      ),
      _buildModuleCard(
        context,
        icon: Icons.people,
        title: 'Gestión de Visitantes',
        color: Colors.green,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => TerceraPantalla()),
          );
        },
      ),
    ];
  }

  Widget _buildModuleCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      width: 180,
      height: 220,
      child: Card(
        elevation: 8,
        shadowColor: color.withOpacity(0.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [color.withOpacity(0.8), color],
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 60, color: Colors.white),
                ),
                SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _mostrarPerfilUsuario(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.security, color: Colors.blue, size: 30),
            SizedBox(width: 10),
            Text('Perfil de Usuario'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Nombre: ${widget.nombreUsuario}',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              'Rol: Vigilante',
              style: TextStyle(fontSize: 14, color: Colors.grey[700]),
            ),
            SizedBox(height: 10),
            Text(
              'Estado: Activo',
              style: TextStyle(fontSize: 14, color: Colors.green),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cerrar', style: TextStyle(color: Colors.blue)),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade700,
            ),
          ),
        ),
        ...items,
        Divider(thickness: 1, color: Colors.grey.shade200, height: 20),
      ],
    );
  }

  Widget _buildMenuItem(BuildContext context, IconData icon, String title) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue.shade600, size: 24),
      title: Text(title, style: TextStyle(fontSize: 15, color: Colors.black87)),
      trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
      onTap: () {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => TerceraPantalla()),
        );
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      hoverColor: Colors.blue.shade50,
    );
  }

  // Construir item del menú con navegación específica
  Widget _buildMenuItemNav(
    BuildContext context,
    IconData icon,
    String title,
    Widget destino,
  ) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue.shade600, size: 24),
      title: Text(title, style: TextStyle(fontSize: 15, color: Colors.black87)),
      trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
      onTap: () {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => destino),
        );
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      hoverColor: Colors.blue.shade50,
    );
  }

  Widget _buildEstadisticasSection(BuildContext context, bool isWeb) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Estadísticas del Día',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ),
        SizedBox(height: 30),
        if (isWeb)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildPaquetesRecibidosCard()),
                SizedBox(width: 30),
                Expanded(child: _buildParqueaderosLibresCard()),
              ],
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                _buildPaquetesRecibidosCard(),
                SizedBox(height: 20),
                _buildParqueaderosLibresCard(),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildPaquetesRecibidosCard() {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Icon(Icons.inventory_2, color: Colors.blue, size: 32),
                SizedBox(width: 12),
                Text(
                  'Paquetes Recibidos Hoy',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            SizedBox(height: 40),
            Container(
              padding: EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$paquetesRecibidosHoy',
                style: TextStyle(
                  fontSize: 64,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
            ),
            SizedBox(height: 20),
            Text(
              'Paquetes registrados hoy',
              style: TextStyle(fontSize: 16, color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParqueaderosLibresCard() {
    int totalParqueos = parqueosLibres + parqueosOcupados;
    double porcentajeLibres = totalParqueos > 0
        ? (parqueosLibres / totalParqueos) * 100
        : 0;

    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Icon(Icons.local_parking, color: Colors.green, size: 32),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Parqueaderos Libres',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 30),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Column(
                  children: [
                    Container(
                      padding: EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.check_circle,
                        size: 50,
                        color: Colors.green,
                      ),
                    ),
                    SizedBox(height: 15),
                    Text(
                      '$parqueosLibres',
                      style: TextStyle(
                        fontSize: 42,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    Text(
                      'Libres',
                      style: TextStyle(fontSize: 16, color: Colors.grey[700]),
                    ),
                  ],
                ),
                Container(width: 2, height: 120, color: Colors.grey.shade300),
                Column(
                  children: [
                    Container(
                      padding: EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.cancel, size: 50, color: Colors.red),
                    ),
                    SizedBox(height: 15),
                    Text(
                      '$parqueosOcupados',
                      style: TextStyle(
                        fontSize: 42,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                    Text(
                      'Ocupados',
                      style: TextStyle(fontSize: 16, color: Colors.grey[700]),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: 25),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.info_outline, color: Colors.blue),
                  SizedBox(width: 10),
                  Text(
                    '${porcentajeLibres.toStringAsFixed(0)}% de disponibilidad',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TerceraPantalla extends StatelessWidget {
  const TerceraPantalla({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: Text('Pantalla en construcción')));
  }
}
