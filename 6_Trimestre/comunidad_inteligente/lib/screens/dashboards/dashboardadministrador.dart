// ignore_for_file: use_build_context_synchronously
import 'package:flutter/material.dart';
import '../../main.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../paqueteria/paqueteria.dart';
import '../areasComunes/areascomunes.dart';
import '../../widgets/areasComunes/registrar_reserva.dart';
import '../visitas/visitas.dart';
import '../parqueaderos/parqueaderos.dart' show SeleccionarParqueaderoScreen;
import '../reportes/reportes.dart';
import '../residentes/residentes.dart';
import '../torres/torres_screen.dart';
import '../../utils/helpers.dart';
import '../../utils/theme_provider.dart';
import '../../widgets/whatsapp_fab.dart';

class Dashboardadministrador extends StatefulWidget {
  final String nombreUsuario;

  const Dashboardadministrador({
    super.key,
    this.nombreUsuario = 'Administrador',
  });

  @override
  State<Dashboardadministrador> createState() => _DashboardadministradorState();
}

class _DashboardadministradorState extends State<Dashboardadministrador> {
  int paquetesEntregados = 0;
  int paquetesPendientes = 0;
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
          paquetesEntregados = datos['paquetes']?['entregados'] ?? 0;
          paquetesPendientes = datos['paquetes']?['pendientes'] ?? 0;
          parqueosCarros = (datos['parqueaderos']?['ocupadosCarros'] ?? 0)
              .clamp(0, double.infinity)
              .toInt();
          parqueosMotos = (datos['parqueaderos']?['ocupadosMotos'] ?? 0)
              .clamp(0, double.infinity)
              .toInt();
          parqueosLibres = (datos['parqueaderos']?['disponibles'] ?? 0)
              .clamp(0, double.infinity)
              .toInt();
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final onSurface = theme.colorScheme.onSurface;
    final surface = theme.colorScheme.surface;

    return Scaffold(
      floatingActionButton: const WhatsAppFab(),
      // Es un menu desplegable
      endDrawer: Drawer(
        child: Column(
          children: [
            // Encabezado del menú con diseño mejorado
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(vertical: 30, horizontal: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.orange.shade400, Colors.orange.shade700],
                ),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.manage_accounts,
                      size: 50,
                      color: Colors.orange,
                    ),
                  ),
                  SizedBox(height: 15),
                  Text(
                    'Menú Administrador',
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
            // Toggle de modo oscuro en el drawer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: ListenableBuilder(
                listenable: ThemeProvider(),
                builder: (context, _) {
                  final darkMode = ThemeProvider().isDarkMode;
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: darkMode ? Colors.grey.shade800 : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          darkMode ? Icons.dark_mode : Icons.light_mode,
                          color: darkMode ? Colors.amber : Colors.orange,
                          size: 22,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            darkMode ? 'Modo Oscuro' : 'Modo Claro',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ),
                        Switch(
                          value: darkMode,
                          onChanged: (_) => ThemeProvider().toggleTheme(),
                          activeThumbColor: Colors.amber,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 4),
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
                        'Consultar Parquedero',
                        SeleccionarParqueaderoScreen(
                          token: LoginServe.token,
                          rolId: 2,
                        ),
                      ),
                    ]),
                    _buildMenuSection('Gestión de Áreas Comunes', [
                      _buildMenuItemNav(
                        context,
                        Icons.event,
                        'Registrar Reserva',
                        RegistrarReserva(token: LoginServe.token),
                      ),
                      _buildMenuItemNav(
                        context,
                        Icons.location_on,
                        'Consultar Áreas Comunes',
                        Areascomunes(token: LoginServe.token),
                      ),
                    ]),
                    _buildMenuSection('Reportes', [
                      _buildMenuItemNav(
                        context,
                        Icons.bar_chart,
                        'Ver Reportes',
                        ReportesScreen(token: LoginServe.token ?? ''),
                      ),
                    ]),
                    _buildMenuSection('Gestión de Residentes', [
                      _buildMenuItemNav(
                        context,
                        Icons.home_work,
                        'Registrar Residentes',
                        Residentes(openCreateDialog: true),
                      ),
                      _buildMenuItemNav(
                        context,
                        Icons.list_alt,
                        'Consultar Residentes',
                        Residentes(),
                      ),
                    ]),
                    _buildMenuSection('Comunidad', [
                      _buildMenuItemNav(
                        context,
                        Icons.apartment,
                        'Visualizar Torres',
                        const TorresVisualizacion(),
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
      //fin del menu
      backgroundColor: surface,
      //Encabezado tiene el logo
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: surface,
        elevation: 3,
        toolbarHeight: 90,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black),
        title: Stack(
          children: [
            // Logo centrado absolutamente
            Center(
              child: GestureDetector(
                onTap: () {
                  // Navegar al dashboard (recargar la misma pantalla)
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => Dashboardadministrador(
                        nombreUsuario: widget.nombreUsuario,
                      ),
                    ),
                  );
                },
                child: Container(
                  width: 85,
                  height: 85,
                  decoration: BoxDecoration(
                    color: Colors.orange,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.orange.withValues(alpha: 0.3),
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
            // Botón de perfil posicionado a la izquierda
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              child: Center(
                child: IconButton(
                  icon: Icon(Icons.person, color: Colors.orange, size: 32),
                  onPressed: () {
                    _mostrarPerfilUsuario(context);
                  },
                  tooltip: 'Ver perfil',
                ),
              ),
            ),
            // Botón de actualizar
            Positioned(
              right: 48,
              top: 0,
              bottom: 0,
              child: Center(
                child: IconButton(
                  icon: Icon(
                    isLoading ? Icons.hourglass_empty : Icons.refresh,
                    color: Colors.orange,
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

          return SingleChildScrollView(
            child: Column(
              children: [
                SizedBox(height: 25),
                // Nombre del usuario
                Center(
                  child: Text(
                    'Bienvenido, ${widget.nombreUsuario}',
                    style: TextStyle(
                      fontSize: 35,
                      color: onSurface,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SizedBox(height: 25),
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      'Selecciona el módulo que deseas gestionar en la plataforma',
                      style: TextStyle(
                        fontSize: 13,
                        color: onSurface.withValues(alpha: 0.7),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                SizedBox(height: 35),
                // Vista responsiva: Grid para web, PageView para móvil
                if (isWeb)
                  _buildWebView(context)
                else
                  _buildMobileView(context),
                SizedBox(height: 50),
                // Sección de estadísticas y gráficos
                _buildEstadisticasSection(context, isWeb),
                SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  // Vista Web: Grid con todas las tarjetas visibles
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

  // Vista Móvil: Carrusel deslizable
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

  // Construir las tarjetas de módulos
  List<Widget> _buildModuleCards(BuildContext context) {
    return [
      _buildModuleCard(
        context,
        icon: Icons.inventory_2,
        title: 'Gestión de Paquetería',
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
        title: 'Gestión de Visitas',
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
      _buildModuleCard(
        context,
        icon: Icons.holiday_village,
        title: 'Áreas Comunes',
        color: Colors.orange,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => Areascomunes(token: LoginServe.token),
            ),
          );
        },
      ),
      _buildModuleCard(
        context,
        icon: Icons.home,
        title: 'Gestión de Residentes',
        color: Colors.teal,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const Residentes()),
          );
        },
      ),
    ];
  }

  // Tarjeta individual de módulo
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

  // Método para mostrar el perfil del usuario
  void _mostrarPerfilUsuario(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.manage_accounts, color: Colors.orange, size: 30),
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
              'Rol: Administrador',
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
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
            child: Text('Cerrar', style: TextStyle(color: Colors.orange)),
          ),
        ],
      ),
    );
  }

  // Construir sección del menú
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
              color: Colors.orange.shade700,
            ),
          ),
        ),
        ...items,
        Divider(thickness: 1, color: Colors.grey.shade200, height: 20),
      ],
    );
  }

  // Construir item del menú
  // ignore: unused_element
  Widget _buildMenuItem(BuildContext context, IconData icon, String title) {
    return ListTile(
      leading: Icon(icon, color: Colors.orange.shade600, size: 24),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 15,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
      ),
      onTap: () {
        Navigator.pop(context); // Cerrar el drawer
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Módulo en construcción')));
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      hoverColor: Colors.orange.shade50,
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
      leading: Icon(icon, color: Colors.orange.shade600, size: 24),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 15,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
      ),
      onTap: () {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => destino),
        );
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      hoverColor: Colors.orange.shade50,
    );
  }

  // Sección de estadísticas con gráficos
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
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
        SizedBox(height: 30),
        if (isWeb)
          // Vista web: gráficos lado a lado
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildPaquetesEntregadosCard()),
                SizedBox(width: 30),
                Expanded(child: _buildParqueaderosCard()),
              ],
            ),
          )
        else
          // Vista móvil: gráficos apilados
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                _buildPaquetesEntregadosCard(),
                SizedBox(height: 20),
                _buildParqueaderosCard(),
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

  // Tarjeta de paquetes entregados
  Widget _buildPaquetesEntregadosCard() {
    // Usar datos dinámicos
    int totalPaquetes = paquetesEntregados + paquetesPendientes;
    double porcentajeEntregados = totalPaquetes > 0
        ? (paquetesEntregados / totalPaquetes) * 100
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
                Icon(Icons.inventory_2, color: Colors.blue, size: 32),
                SizedBox(width: 12),
                Text(
                  'Paquetes Entregados Hoy',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ],
            ),
            SizedBox(height: 30),
            // Gráfico de barras simple
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildBarraEstadistica(
                  'Entregados',
                  paquetesEntregados,
                  Colors.green,
                  150,
                ),
                _buildBarraEstadistica(
                  'Pendientes',
                  paquetesPendientes,
                  Colors.orange,
                  150,
                ),
              ],
            ),
            SizedBox(height: 20),
            // Resumen numérico
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.blue.shade900.withValues(alpha: 0.3)
                    : Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      Text(
                        '$paquetesEntregados',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                      Text(
                        'Entregados',
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 1,
                    height: 40,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.2),
                  ),
                  Column(
                    children: [
                      Text(
                        '${porcentajeEntregados.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                      Text(
                        'Eficiencia',
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Tarjeta de parqueaderos ocupados con gráfico de torta
  Widget _buildParqueaderosCard() {
    // Usar datos dinámicos
    int totalOcupados = parqueosCarros + parqueosMotos;
    int totalParqueos = totalOcupados + parqueosLibres;

    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                SeleccionarParqueaderoScreen(token: LoginServe.token, rolId: 2),
          ),
        );
      },
      child: Card(
        elevation: 6,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Row(
                children: [
                  Icon(Icons.local_parking, color: Colors.purple, size: 32),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Parqueaderos Visitantes',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 18),
                ],
              ),
              SizedBox(height: 30),
              // Gráfico de torta simplificado
              SizedBox(
                height: 180,
                child: CustomPaint(
                  size: Size(180, 180),
                  painter: PieChartPainter(
                    residentes: parqueosCarros,
                    visitantes: parqueosMotos,
                    libres: parqueosLibres,
                    isDark: Theme.of(context).brightness == Brightness.dark,
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

  // Barra de estadística individual
  Widget _buildBarraEstadistica(
    String label,
    int valor,
    Color color,
    double maxHeight,
  ) {
    double altura = (valor / 35) * maxHeight;
    if (altura < 20) altura = 20;

    return Column(
      children: [
        Container(
          width: 80,
          height: altura,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [color.withValues(alpha: 0.7), color],
            ),
            borderRadius: BorderRadius.circular(12),
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
              '$valor',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        SizedBox(height: 12),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.7),
          ),
        ),
      ],
    );
  }

  // Item de leyenda para el gráfico de torta
  Widget _buildLeyendaItem(Color color, String label, int valor, int total) {
    // Validar que los valores sean positivos y el total no sea cero
    int valorSeguro = valor < 0 ? 0 : valor;
    int totalSeguro = total > 0 ? total : 1;
    double porcentaje = (valorSeguro / totalSeguro) * 100;
    final onSurface = Theme.of(context).colorScheme.onSurface;

    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Text(label, style: TextStyle(fontSize: 15, color: onSurface)),
        ),
        Text(
          '$valorSeguro (${porcentaje.toStringAsFixed(0)}%)',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: onSurface,
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
                    color: Theme.of(context).colorScheme.onSurface,
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

  // Tarjeta de reservas del día
  Widget _buildResumenRapidoCard() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Icon(Icons.calendar_today, color: Colors.blue, size: 32),
                SizedBox(width: 12),
                Text(
                  'Reservas del Día',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ],
            ),
            SizedBox(height: 30),
            Container(
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.blue.shade900.withValues(alpha: 0.3)
                    : Colors.blue.shade50,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$reservasHoy',
                style: TextStyle(
                  fontSize: 56,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
            ),
            SizedBox(height: 16),
            Text(
              'Reservas registradas hoy',
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people, size: 18, color: Colors.green),
                SizedBox(width: 6),
                Text(
                  '$residentesActivos residentes activos',
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
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
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.7),
          ),
        ),
      ],
    );
  }
}

// Painter personalizado para el gráfico de torta
class PieChartPainter extends CustomPainter {
  final int residentes;
  final int visitantes;
  final int libres;
  final bool isDark;

  PieChartPainter({
    required this.residentes,
    required this.visitantes,
    required this.libres,
    this.isDark = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final total = residentes + visitantes + libres;

    if (total == 0) {
      final emptyPaint = Paint()
        ..color = Colors.grey.shade300
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius, emptyPaint);
      final innerPaint = Paint()
        ..color = isDark ? const Color(0xFF1E1E1E) : Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius * 0.5, innerPaint);
      return;
    }

    double startAngle = -90 * 3.14159 / 180;

    final residentesAngle = (residentes / total) * 2 * 3.14159;
    final residentesPaint = Paint()
      ..color = Colors.teal
      ..style = PaintingStyle.fill;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      residentesAngle,
      true,
      residentesPaint,
    );
    startAngle += residentesAngle;

    final visitantesAngle = (visitantes / total) * 2 * 3.14159;
    final visitantesPaint = Paint()
      ..color = Colors.orange
      ..style = PaintingStyle.fill;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      visitantesAngle,
      true,
      visitantesPaint,
    );
    startAngle += visitantesAngle;

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

    final innerCirclePaint = Paint()
      ..color = isDark ? const Color(0xFF1E1E1E) : Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.5, innerCirclePaint);

    final textPainter = TextPainter(
      text: TextSpan(
        text: '${residentes + visitantes}',
        style: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : Colors.black87,
        ),
        children: [
          TextSpan(
            text: '\nOcupados',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.normal,
              color: isDark ? Colors.white70 : Colors.grey[600],
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
  bool shouldRepaint(PieChartPainter oldDelegate) {
    return oldDelegate.residentes != residentes ||
        oldDelegate.visitantes != visitantes ||
        oldDelegate.libres != libres ||
        oldDelegate.isDark != isDark;
  }
}
