// ignore_for_file: use_build_context_synchronously
import 'package:flutter/material.dart';
import '../../main.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../paqueteria/paqueteria.dart';
import '../visitas/visitas.dart';
import '../parqueaderos/parqueaderos.dart' show SeleccionarParqueaderoScreen;
import '../../utils/helpers.dart';
import '../../utils/theme_provider.dart';
import '../../widgets/whatsapp_fab.dart';

class Dashboardvigilante extends StatefulWidget {
  final String nombreUsuario;

  const Dashboardvigilante({super.key, this.nombreUsuario = 'Vigilante'});

  @override
  State<Dashboardvigilante> createState() => _DashboardvigilanteState();
}

class _DashboardvigilanteState extends State<Dashboardvigilante> {
  int paquetesRecibidosHoy = 0;
  int parqueosCarros = 0;
  int parqueosMotos = 0;
  int parqueosLibres = 0;
  int visitasHoy = 0;
  int visitasActivas = 0;
  int reservasHoy = 0;
  int usuariosActivos = 0;
  int residentesActivos = 0;
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

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        setState(() => isLoading = false);
        return;
      }

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final datos = responseData['data'];
        setState(() {
          // pendientes = paquetes recibidos hoy que aún no se han entregado
          paquetesRecibidosHoy = datos['paquetes']?['pendientes'] ?? 0;
          // Obtener parqueaderos por tipo de vehículo y validar que no sean negativos
          final carrosRaw = datos['parqueaderos']?['ocupadosCarros'];
          final motosRaw = datos['parqueaderos']?['ocupadosMotos'];
          final libresRaw = datos['parqueaderos']?['disponibles'];

          parqueosCarros = (carrosRaw is num ? carrosRaw.toInt() : 0).clamp(
            0,
            9999,
          );
          parqueosMotos = (motosRaw is num ? motosRaw.toInt() : 0).clamp(
            0,
            9999,
          );
          parqueosLibres = (libresRaw is num ? libresRaw.toInt() : 0).clamp(
            0,
            9999,
          );
          visitasHoy = datos['visitas']?['hoy'] ?? 0;
          visitasActivas = datos['visitas']?['activas'] ?? 0;
          reservasHoy = datos['reservas']?['hoy'] ?? 0;
          usuariosActivos = datos['usuarios']?['activos'] ?? 0;
          residentesActivos = datos['residentes']?['activos'] ?? 0;
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
      floatingActionButton: const WhatsAppFab(),
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
                      _buildMenuItemNav(
                        context,
                        Icons.event,
                        'Gestión de Visitas',
                        HomeScreen(token: LoginServe.token),
                      ),
                      _buildMenuItemNav(
                        context,
                        Icons.local_parking,
                        'Consultar Parqueadero',
                        SeleccionarParqueaderoScreen(token: LoginServe.token, rolId: 3),
                      ),
                    ]),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ListenableBuilder(
                listenable: ThemeProvider(),
                builder: (context, _) {
                  final isDark = ThemeProvider().isDarkMode;
                  return SwitchListTile(
                    title: Text(
                      'Modo Oscuro',
                      style: TextStyle(fontSize: 15),
                    ),
                    subtitle: Text(
                      isDark ? 'Activado' : 'Desactivado',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: isDark,
                    onChanged: (_) => ThemeProvider().toggleTheme(),
                    secondary: Icon(
                      isDark ? Icons.dark_mode : Icons.light_mode,
                      color: isDark ? Colors.amber : Colors.grey.shade600,
                    ),
                    activeTrackColor: Colors.green.shade200,
                    activeThumbColor: Colors.green,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  );
                },
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
                        color: Colors.blue.withValues(alpha: 0.3),
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
            MaterialPageRoute(
              builder: (context) => HomeScreen(token: LoginServe.token),
            ),
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
    return SizedBox(
      width: 180,
      height: 220,
      child: Card(
        elevation: 8,
        shadowColor: color.withValues(alpha: 0.4),
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
                colors: [color.withValues(alpha: 0.8), color],
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.3),
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
                SizedBox(height: 20),
                _buildVisitasCard(),
                SizedBox(height: 20),
                _buildResumenRapidoCard(),
              ],
            ),
          ),
        if (isWeb) ...[
          SizedBox(height: 30),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildVisitasCard()),
                SizedBox(width: 30),
                Expanded(child: _buildResumenRapidoCard()),
              ],
            ),
          ),
        ],
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

  // Tarjeta de parqueaderos con gráfico de torta
  Widget _buildParqueaderosLibresCard() {
    int totalOcupados = parqueosCarros + parqueosMotos;
    int totalParqueos = totalOcupados + parqueosLibres;

    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  SeleccionarParqueaderoScreen(token: LoginServe.token, rolId: 3),
            ),
          );
        },
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
                      'Estado Parqueaderos',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
                ],
              ),
              SizedBox(height: 30),
              // Gráfico de torta
              SizedBox(
                height: 180,
                child: CustomPaint(
                  size: Size(180, 180),
                  painter: PieChartPainterVigilante(
                    carros: parqueosCarros,
                    motos: parqueosMotos,
                    libres: parqueosLibres,
                  ),
                ),
              ),
              SizedBox(height: 25),
              // Leyenda
              Column(
                children: [
                  _buildLeyendaItem(
                    Colors.teal,
                    'Carros',
                    parqueosCarros,
                    totalParqueos > 0 ? totalParqueos : 1,
                  ),
                  SizedBox(height: 8),
                  _buildLeyendaItem(
                    Colors.orange,
                    'Motos',
                    parqueosMotos,
                    totalParqueos > 0 ? totalParqueos : 1,
                  ),
                  SizedBox(height: 8),
                  _buildLeyendaItem(
                    Colors.grey.shade300,
                    'Libres',
                    parqueosLibres,
                    totalParqueos > 0 ? totalParqueos : 1,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Item de leyenda para el gráfico de torta
  Widget _buildLeyendaItem(Color color, String label, int valor, int total) {
    int valorSeguro = valor < 0 ? 0 : valor;
    int totalSeguro = total > 0 ? total : 1;
    double porcentaje = (valorSeguro / totalSeguro) * 100;

    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(fontSize: 15, color: Colors.black87),
          ),
        ),
        Text(
          '$valorSeguro (${porcentaje.toStringAsFixed(0)}%)',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  // Tarjeta de visitas del día
  Widget _buildVisitasCard() {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Icon(Icons.people_outline, color: Colors.deepPurple, size: 32),
                SizedBox(width: 12),
                Text(
                  'Visitas del Día',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatCircle(
                  '$visitasHoy',
                  'Registradas',
                  Colors.deepPurple,
                ),
                _buildStatCircle(
                  '$visitasActivas',
                  'En curso',
                  Colors.amber.shade700,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Tarjeta de resumen rápido (reservas + residentes + usuarios)
  Widget _buildResumenRapidoCard() {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Icon(Icons.dashboard_outlined, color: Colors.teal, size: 32),
                SizedBox(width: 12),
                Text(
                  'Resumen General',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatCircle(
                  '$reservasHoy',
                  'Reservas\nhoy',
                  Colors.blue,
                ),
                _buildStatCircle(
                  '$residentesActivos',
                  'Residentes\nactivos',
                  Colors.teal,
                ),
                _buildStatCircle(
                  '$usuariosActivos',
                  'Usuarios\nactivos',
                  Colors.green,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Círculo de estadística individual
  Widget _buildStatCircle(String value, String label, Color color) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [color.withValues(alpha: 0.7), color],
            ),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        SizedBox(height: 8),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }
}

// Painter personalizado para el gráfico de torta
class PieChartPainterVigilante extends CustomPainter {
  final int carros;
  final int motos;
  final int libres;

  PieChartPainterVigilante({
    required this.carros,
    required this.motos,
    required this.libres,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final total = carros + motos + libres;

    if (total == 0) {
      // Si no hay datos, dibujar un círculo gris
      final emptyPaint = Paint()
        ..color = Colors.grey.shade300
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius, emptyPaint);
      final innerCirclePaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius * 0.5, innerCirclePaint);
      return;
    }

    double startAngle = -90 * 3.14159 / 180; // Comenzar desde arriba

    // Dibujar sección de carros
    final carrosAngle = (carros / total) * 2 * 3.14159;
    final carrosPaint = Paint()
      ..color = Colors.teal
      ..style = PaintingStyle.fill;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      carrosAngle,
      true,
      carrosPaint,
    );
    startAngle += carrosAngle;

    // Dibujar sección de motos
    final motosAngle = (motos / total) * 2 * 3.14159;
    final motosPaint = Paint()
      ..color = Colors.orange
      ..style = PaintingStyle.fill;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      motosAngle,
      true,
      motosPaint,
    );
    startAngle += motosAngle;

    // Dibujar sección de libres
    final libresAngle = (libres / total) * 2 * 3.14159;
    final libresPaint = Paint()
      ..color = Colors.grey.shade300
      ..style = PaintingStyle.fill;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      libresAngle,
      true,
      libresPaint,
    );

    // Dibujar círculo blanco en el centro para efecto de dona
    final innerCirclePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.5, innerCirclePaint);

    // Dibujar texto en el centro
    final textPainter = TextPainter(
      text: TextSpan(
        text: '${carros + motos}',
        style: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
        children: [
          TextSpan(
            text: '\nOcupados',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.normal,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        center.dx - textPainter.width / 2,
        center.dy - textPainter.height / 2,
      ),
    );
  }

  @override
  bool shouldRepaint(PieChartPainterVigilante oldDelegate) {
    return oldDelegate.carros != carros ||
        oldDelegate.motos != motos ||
        oldDelegate.libres != libres;
  }
}
