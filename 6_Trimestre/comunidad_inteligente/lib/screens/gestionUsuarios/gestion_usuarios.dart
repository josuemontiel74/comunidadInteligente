// ignore_for_file: use_build_context_synchronously
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import '../../main.dart';
import '../../utils/helpers.dart';
import '../../utils/validaciones.dart';
import '../../utils/user_photo_service.dart';

class GestionUsuarios extends StatefulWidget {
  final bool openCreateDialog;
  const GestionUsuarios({super.key, this.openCreateDialog = false});

  @override
  State<GestionUsuarios> createState() => _GestionUsuariosState();
}

class _GestionUsuariosState extends State<GestionUsuarios> {
  List<dynamic> usuarios = [];
  List<dynamic> tiposDocumento = [];
  bool isLoading = true;
  bool vistaGrid = false;
  String filtroEstado = 'todos'; // 'todos', 'activo', 'inactivo', 'enlinea'
  String filtroRol = 'todos';
  String busquedaNombre = '';
  final TextEditingController _searchController = TextEditingController();

  // Usuarios en línea (solo superadmin)
  List<String> _usuariosEnLinea = [];

  // Paginación
  int paginaActual = 1;
  int elementosPorPagina = 10;

  // Lista estática de roles
  // rolesId: 1 = Super Administrador, 2 = Administrador, 3 = Vigilante
  final List<Map<String, dynamic>> roles = [
    {'idRol': 1, 'nombreRol': 'Super Administrador'},
    {'idRol': 2, 'nombreRol': 'Administrador'},
    {'idRol': 3, 'nombreRol': 'Vigilante'},
  ];

  @override
  void initState() {
    super.initState();
    _inicializarDatos();
    // Cargar usuarios en línea solo si es superadmin
    final rol = LoginServe.rolActual ?? '';
    if (rol.contains('superadmin')) {
      _cargarUsuariosEnLinea();
    }
    if (widget.openCreateDialog) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mostrarFormularioCrear();
      });
    }
  }

  Future<void> _inicializarDatos() async {
    await Future.wait([_cargarUsuarios(), _cargarTiposDocumento()]);
  }

  Future<void> _cargarUsuariosEnLinea() async {
    try {
      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/usuario/en-linea'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${LoginServe.token}',
        },
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final enLinea = data['enLinea'] as Map<String, dynamic>? ?? {};
        if (mounted) {
          setState(() {
            _usuariosEnLinea = enLinea.keys
                .where((k) => enLinea[k] == true)
                .toList();
          });
        }
      }
    } catch (e) {
      debugPrint('Error al cargar usuarios en línea: $e');
    }
  }

  Future<void> _cargarUsuarios() async {
    setState(() => isLoading = true);

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/usuario'),
        headers: headers,
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        setState(() => isLoading = false);
        return;
      }

      if (response.statusCode == 200) {
        final datos = json.decode(response.body);
        final lista =
            List<dynamic>.from(datos['body'] ?? datos['data'] ?? []);
        setState(() {
          usuarios = lista;
          isLoading = false;
        });
        // Hidratar fotos desde la BD (igual que el web con localStorage)
        for (final u in lista) {
          final foto = u['fotoPerfil']?.toString();
          final uname = u['username']?.toString() ?? '';
          if (foto != null && foto.isNotEmpty && uname.isNotEmpty) {
            UserPhotoService.savePhoto(uname, foto);
          }
        }
      } else {
        throw Exception('Error al cargar usuarios');
      }
    } catch (e) {
      setState(() => isLoading = false);
      _mostrarError('Error al cargar usuarios: $e');
    }
  }

  Future<void> _cargarTiposDocumento() async {
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (LoginServe.token != null) {
        headers['Authorization'] = 'Bearer ${LoginServe.token}';
      }

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/documento'),
        headers: headers,
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200) {
        final datos = json.decode(response.body);
        setState(() {
          tiposDocumento = datos['body'] ?? datos['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error al cargar tipos de documento: $e');
    }
  }

  List<dynamic> get usuariosFiltrados {
    var usuariosFiltradosList = usuarios.where((usuario) {
      // Filtro por estado
      if (filtroEstado != 'todos') {
        // Filtro especial: En línea
        if (filtroEstado == 'enlinea') {
          if (!_usuariosEnLinea.contains(usuario['username'])) return false;
        } else {
          final estadoId = usuario['estadoId'];
          if (filtroEstado == 'activo' && estadoId != 1) return false;
          if (filtroEstado == 'inactivo' && estadoId != 2) return false;
        }
      }

      // Filtro por rol
      // Los roles son: 1 = Super Administrador, 2 = Administrador, 3 = Vigilante
      // El filtro compara el ID del rol seleccionado con el rolesId del usuario
      if (filtroRol != 'todos') {
        final rolId = usuario['rolesId']?.toString();
        if (rolId != filtroRol) return false;
      }

      // Búsqueda por nombre, username o número de documento
      if (busquedaNombre.isNotEmpty) {
        final nombreCompleto = _obtenerNombreCompleto(usuario).toLowerCase();
        final username = (usuario['username'] ?? '').toString().toLowerCase();
        final numeroDocumento = _obtenerNumeroDocumento(usuario).toLowerCase();
        final busqueda = busquedaNombre.toLowerCase();
        if (!nombreCompleto.contains(busqueda) &&
            !username.contains(busqueda) &&
            !numeroDocumento.contains(busqueda)) {
          return false;
        }
      }

      return true;
    }).toList();

    // Ordenar: usuarios activos primero (estadoId = 1), luego inactivos
    usuariosFiltradosList.sort((a, b) {
      final estadoA = a['estadoId'] ?? 2;
      final estadoB = b['estadoId'] ?? 2;
      // Si estadoA es 1 (activo) y estadoB no, A va primero
      if (estadoA == 1 && estadoB != 1) return -1;
      // Si estadoB es 1 (activo) y estadoA no, B va primero
      if (estadoB == 1 && estadoA != 1) return 1;
      // Si ambos tienen el mismo estado, mantener orden original
      return 0;
    });

    return usuariosFiltradosList;
  }

  List<dynamic> _obtenerUsuariosPaginados(List<dynamic> usuariosCompletos) {
    if (usuariosCompletos.isEmpty) return [];

    final inicio = (paginaActual - 1) * elementosPorPagina;
    final fin = inicio + elementosPorPagina;

    // Validar que el inicio esté dentro del rango válido
    if (inicio < 0 || inicio >= usuariosCompletos.length) return [];

    return usuariosCompletos.sublist(
      inicio,
      fin > usuariosCompletos.length ? usuariosCompletos.length : fin,
    );
  }

  Widget _buildPaginacion(int totalElementos) {
    final totalPaginas = (totalElementos / elementosPorPagina).ceil();

    if (totalPaginas <= 1) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: paginaActual > 1
                ? () => setState(() => paginaActual--)
                : null,
          ),
          const SizedBox(width: 8),
          Text(
            'Página $paginaActual de $totalPaginas',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: paginaActual < totalPaginas
                ? () => setState(() => paginaActual++)
                : null,
          ),
        ],
      ),
    );
  }

  String _obtenerNombreCompleto(dynamic usuario) {
    // Si viene el objeto persona desde el backend (con JOIN)
    final persona = usuario['persona'];
    if (persona != null && persona is Map) {
      final primerNombre = persona['primerNombre'] ?? '';
      final segundoNombre = persona['segundoNombre'] ?? '';
      final primerApellido = persona['primerApellido'] ?? '';
      final segundoApellido = persona['segundoApellido'] ?? '';

      final nombreCompleto =
          '$primerNombre $segundoNombre $primerApellido $segundoApellido'
              .trim();
      if (nombreCompleto.isNotEmpty) return nombreCompleto;
    }

    // Si no viene persona, mostrar el username como nombre
    return usuario['username'] ?? 'N/A';
  }

  String _obtenerNombreRol(dynamic usuario) {
    // Intentar leer del objeto Rol (viene con JOIN desde el backend)
    final rol = usuario['Rol'];
    if (rol != null && rol is Map) {
      final nombreRol = rol['nombreRol'];
      if (nombreRol != null && nombreRol.toString().isNotEmpty) {
        return nombreRol.toString();
      }
    }

    // Fallback: buscar en el array de roles
    final rolId = usuario['rolesId'];
    if (rolId != null && roles.isNotEmpty) {
      final rolEncontrado = roles.firstWhere(
        (r) => r['idRol'] == rolId,
        orElse: () => {'nombreRol': 'N/A'},
      );
      return rolEncontrado['nombreRol'] ?? 'N/A';
    }

    return 'N/A';
  }

  String _obtenerNumeroDocumento(dynamic usuario) {
    // Intentar obtener de Persona (con mayúscula, viene con JOIN)
    final persona = usuario['Persona'];
    if (persona != null && persona is Map) {
      final doc = persona['numeroDocumento'];
      if (doc != null && doc.toString().isNotEmpty) {
        return doc.toString();
      }
    }

    // Si no, usar el numeroDocumento directo de usuario (FK)
    final doc = usuario['numeroDocumento'];
    return doc?.toString() ?? 'N/A';
  }

  // ignore: unused_element
  String _obtenerNombreEstado(dynamic usuario) {
    // Leer del objeto Estado (viene con JOIN)
    final estado = usuario['Estado'];
    if (estado != null && estado is Map) {
      final nombreEstado = estado['nombreEstado'];
      if (nombreEstado != null) {
        return nombreEstado.toString();
      }
    }

    // Fallback basado en estadoId
    final estadoId = usuario['estadoId'];
    return estadoId == 1 ? 'Activo' : 'Inactivo';
  }

  void _mostrarFormularioCrear() {
    showDialog(
      context: context,
      builder: (context) => CrearUsuarioDialog(
        token: LoginServe.token ?? '',
        roles: roles,
        tiposDocumento: tiposDocumento,
        onSuccess: _cargarUsuarios,
      ),
    );
  }

  void _mostrarDetallesUsuario(dynamic usuario) {
    showDialog(
      context: context,
      builder: (context) =>
          DetallesUsuarioDialog(usuario: usuario, roles: roles),
    );
  }

  void _mostrarFormularioEditar(dynamic usuario) {
    showDialog(
      context: context,
      builder: (context) => EditarUsuarioDialog(
        token: LoginServe.token ?? '',
        usuario: usuario,
        roles: roles,
        tiposDocumento: tiposDocumento,
        onSuccess: _cargarUsuarios,
      ),
    );
  }

  Future<void> _inactivarUsuario(String username) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar'),
        content: const Text('¿Está seguro de inactivar este usuario?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Inactivar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${LoginServe.token}',
      };

      final response = await http.delete(
        Uri.parse('${LoginServe.baseUrl}/api/usuario/$username'),
        headers: headers,
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200) {
        _mostrarExito('Usuario inactivado exitosamente');
        _cargarUsuarios();
      } else {
        throw Exception('Error al inactivar usuario');
      }
    } catch (e) {
      _mostrarError('Error al inactivar usuario: $e');
    }
  }

  Future<void> _activarUsuario(String username) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar'),
        content: const Text('¿Está seguro de activar este usuario?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.green),
            child: const Text('Activar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${LoginServe.token}',
      };

      final body = json.encode({'estadoId': 1});

      final response = await http.patch(
        Uri.parse('${LoginServe.baseUrl}/api/usuario/$username'),
        headers: headers,
        body: body,
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        return;
      }

      if (response.statusCode == 200) {
        _mostrarExito('Usuario activado exitosamente');
        _cargarUsuarios();
      } else {
        throw Exception('Error al activar usuario');
      }
    } catch (e) {
      _mostrarError('Error al activar usuario: $e');
    }
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje), backgroundColor: Colors.red),
    );
  }

  void _mostrarExito(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    final usuariosFiltradosList = usuariosFiltrados;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestión de Usuarios'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        elevation: 3,
      ),
      body: Column(
        children: [
          // Filtros y botón de registro
          Container(
            padding: EdgeInsets.all(
              MediaQuery.of(context).size.width < 600 ? 12 : 20,
            ),
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.grey.shade900
                : Colors.grey.shade50,
            child: Column(
              children: [
                ElevatedButton.icon(
                  onPressed: _mostrarFormularioCrear,
                  icon: const Icon(Icons.person_add),
                  label: Text(
                    MediaQuery.of(context).size.width < 600
                        ? 'Crear Usuario'
                        : 'Crear Nuevo Usuario',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      vertical: MediaQuery.of(context).size.width < 600
                          ? 12
                          : 15,
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
                    hintText: 'Buscar por nombre, username o documento...',
                    prefixIcon: const Icon(Icons.search, color: Colors.purple),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: Theme.of(context).cardColor,
                  ),
                  onChanged: (value) => setState(() {
                    busquedaNombre = value;
                    paginaActual = 1;
                  }),
                ),
                const SizedBox(height: 15),
                // Filtro por rol
                // Los roles disponibles son:
                // - idRol 1: Super Administrador
                // - idRol 2: Administrador
                // - idRol 3: Vigilante
                // El dropdown muestra el nombreRol de cada uno
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: filtroRol,
                        decoration: InputDecoration(
                          labelText: 'Rol',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Theme.of(context).cardColor,
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: 'todos',
                            child: Text('Todos los roles'),
                          ),
                          ...roles.map((rol) {
                            // Mapea cada rol mostrando su nombre (ej: "Super Administrador")
                            // y usando su ID como valor (ej: "1", "2", "3")
                            return DropdownMenuItem(
                              value: rol['idRol'].toString(),
                              child: Text(rol['nombreRol'] ?? 'N/A'),
                            );
                          }),
                        ],
                        onChanged: (value) => setState(() {
                          filtroRol = value ?? 'todos';
                          paginaActual = 1;
                        }),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 15),
                // Filtros de estado
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
                      _buildChipFiltro('Todos', 'todos'),
                      const SizedBox(width: 10),
                      _buildChipFiltro('Activos', 'activo'),
                      const SizedBox(width: 10),
                      _buildChipFiltro('Inactivos', 'inactivo'),
                      // Chip "En línea" solo visible para superadmin
                      if ((LoginServe.rolActual ?? '').contains(
                        'superadmin',
                      )) ...[
                        const SizedBox(width: 10),
                        _buildChipFiltroColor(
                          'En línea',
                          'enlinea',
                          Colors.green,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Contenido
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : usuariosFiltradosList.isEmpty
                ? Center(
                    child: Text(
                      'No hay usuarios registrados',
                      style: TextStyle(
                        fontSize: 16,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                  )
                : Column(
                    children: [
                      Expanded(
                        child: MediaQuery.of(context).size.width < 600
                            ? _buildCardLayout(
                                _obtenerUsuariosPaginados(
                                  usuariosFiltradosList,
                                ),
                              )
                            : _buildTableLayout(
                                _obtenerUsuariosPaginados(
                                  usuariosFiltradosList,
                                ),
                              ),
                      ),
                      _buildPaginacion(usuariosFiltradosList.length),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildChipFiltro(String label, String valor) {
    final bool seleccionado = filtroEstado == valor;
    return FilterChip(
      label: Text(label),
      selected: seleccionado,
      onSelected: (bool selected) {
        setState(() {
          filtroEstado = valor;
          paginaActual = 1;
        });
      },
      selectedColor: Colors.purple,
      labelStyle: TextStyle(
        color: seleccionado
            ? Colors.white
            : Theme.of(context).colorScheme.onSurface,
        fontWeight: seleccionado ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildChipFiltroColor(String label, String valor, Color color) {
    final bool seleccionado = filtroEstado == valor;
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (seleccionado || valor == 'enlinea')
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(right: 4),
              decoration: BoxDecoration(
                color: seleccionado ? Colors.white : color,
                shape: BoxShape.circle,
              ),
            ),
          Text(label),
        ],
      ),
      selected: seleccionado,
      onSelected: (bool selected) {
        setState(() {
          filtroEstado = valor;
          paginaActual = 1;
        });
        // Refrescar usuarios en línea al seleccionar el filtro
        if (valor == 'enlinea') _cargarUsuariosEnLinea();
      },
      selectedColor: color,
      labelStyle: TextStyle(
        color: seleccionado
            ? Colors.white
            : Theme.of(context).colorScheme.onSurface,
        fontWeight: seleccionado ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildCardLayout(List<dynamic> usuarios) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: usuarios.length,
      itemBuilder: (context, index) {
        final usuario = usuarios[index];
        return _buildUsuarioCard(usuario);
      },
    );
  }

  Widget _buildTableLayout(List<dynamic> usuarios) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(Colors.purple.shade100),
          columns: const [
            DataColumn(label: Text('Username')),
            DataColumn(label: Text('Nombre Completo')),
            DataColumn(label: Text('Documento')),
            DataColumn(label: Text('Rol')),
            DataColumn(label: Text('Estado')),
            DataColumn(label: Text('Acciones')),
          ],
          rows: usuarios.map((usuario) {
            final bool esActivo = usuario['estadoId'] == 1;
            return DataRow(
              cells: [
                DataCell(Text(usuario['username'] ?? 'N/A')),
                DataCell(Text(_obtenerNombreCompleto(usuario))),
                DataCell(Text(_obtenerNumeroDocumento(usuario))),
                DataCell(Text(_obtenerNombreRol(usuario))),
                DataCell(_buildEstadoChip(usuario['estadoId'])),
                DataCell(
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.visibility, color: Colors.blue),
                        onPressed: () => _mostrarDetallesUsuario(usuario),
                        tooltip: 'Ver detalles',
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.purple),
                        onPressed: () => _mostrarFormularioEditar(usuario),
                        tooltip: 'Editar',
                      ),
                      IconButton(
                        icon: Icon(
                          esActivo ? Icons.block : Icons.check_circle,
                          color: esActivo ? Colors.red : Colors.green,
                        ),
                        onPressed: () => esActivo
                            ? _inactivarUsuario(usuario['username'])
                            : _activarUsuario(usuario['username']),
                        tooltip: esActivo ? 'Inactivar' : 'Activar',
                      ),
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

  Widget _buildUsuarioCard(dynamic usuario) {
    final bool esActivo = usuario['estadoId'] == 1;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
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
                    _obtenerNombreCompleto(usuario),
                    style: const TextStyle(
                      fontSize: 18,
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
                    color: esActivo
                        ? Colors.green.shade100
                        : Colors.red.shade100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    esActivo ? 'Activo' : 'Inactivo',
                    style: TextStyle(
                      color: esActivo
                          ? Colors.green.shade700
                          : Colors.red.shade700,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Username
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.person,
                    color: Colors.purple.shade700,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  usuario['username'] ?? 'N/A',
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Documento
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.badge,
                    color: Colors.blue.shade700,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _obtenerNumeroDocumento(usuario),
                    style: TextStyle(
                      fontSize: 14,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Rol
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.security,
                    color: Colors.orange.shade700,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  _obtenerNombreRol(usuario),
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            // Botones de acción
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () => _mostrarDetallesUsuario(usuario),
                  icon: const Icon(Icons.visibility, size: 18),
                  label: const Text('Ver'),
                  style: TextButton.styleFrom(foregroundColor: Colors.blue),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () => _mostrarFormularioEditar(usuario),
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text('Editar'),
                  style: TextButton.styleFrom(foregroundColor: Colors.purple),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () => esActivo
                      ? _inactivarUsuario(usuario['username'])
                      : _activarUsuario(usuario['username']),
                  icon: Icon(
                    esActivo ? Icons.block : Icons.check_circle,
                    size: 18,
                  ),
                  label: Text(esActivo ? 'Inactivar' : 'Activar'),
                  style: TextButton.styleFrom(
                    foregroundColor: esActivo ? Colors.red : Colors.green,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEstadoChip(int? estadoId) {
    final isActivo = estadoId == 1;
    return Chip(
      label: Text(
        isActivo ? 'Activo' : 'Inactivo',
        style: TextStyle(
          fontSize: 12,
          color: isActivo ? Colors.green.shade700 : Colors.red.shade700,
        ),
      ),
      backgroundColor: isActivo ? Colors.green.shade50 : Colors.red.shade50,
      side: BorderSide(
        color: isActivo ? Colors.green.shade200 : Colors.red.shade200,
      ),
    );
  }

  // ignore: unused_element
  String _obtenerIniciales(String nombreCompleto) {
    final partes = nombreCompleto.split(' ').where((p) => p.isNotEmpty);
    if (partes.isEmpty) return '?';
    if (partes.length == 1) return partes.first[0].toUpperCase();
    return '${partes.first[0]}${partes.last[0]}'.toUpperCase();
  }
}

// DIALOG CREAR USUARIO
class CrearUsuarioDialog extends StatefulWidget {
  final String token;
  final List<dynamic> roles;
  final List<dynamic> tiposDocumento;
  final VoidCallback onSuccess;

  const CrearUsuarioDialog({
    super.key,
    required this.token,
    required this.roles,
    required this.tiposDocumento,
    required this.onSuccess,
  });

  @override
  State<CrearUsuarioDialog> createState() => _CrearUsuarioDialogState();
}

class _CrearUsuarioDialogState extends State<CrearUsuarioDialog> {
  final _formKey = GlobalKey<FormState>();
  final numeroDocumentoController = TextEditingController();
  final passwordController = TextEditingController();
  final primerNombreController = TextEditingController();
  final segundoNombreController = TextEditingController();
  final primerApellidoController = TextEditingController();
  final segundoApellidoController = TextEditingController();
  final telefonoController = TextEditingController();
  final correoController = TextEditingController();

  int? tipoDocumentoId;
  int? rolId;
  bool obscurePassword = true;
  bool isSubmitting = false;
  Uint8List? _fotoBytes;
  final ImagePicker _picker = ImagePicker();

  Future<void> _seleccionarFoto() async {
    final XFile? picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 75,
    );
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    if (mounted) setState(() => _fotoBytes = bytes);
  }

  @override
  void dispose() {
    numeroDocumentoController.dispose();
    passwordController.dispose();
    primerNombreController.dispose();
    segundoNombreController.dispose();
    primerApellidoController.dispose();
    segundoApellidoController.dispose();
    telefonoController.dispose();
    correoController.dispose();
    super.dispose();
  }

  Future<void> _crearUsuario() async {
    if (!_formKey.currentState!.validate()) return;

    // Mostrar alerta de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'Confirmar Registro',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '¿Está seguro de crear este usuario?',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.orange.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'El número de documento "${numeroDocumentoController.text}" no podrá ser modificado después.',
                      style: TextStyle(
                        color: Colors.orange.shade900,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purple,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    setState(() => isSubmitting = true);

    try {
      // El backend genera automáticamente el username a partir del nombre y apellido
      final body = {
        'numeroDocumento': numeroDocumentoController.text.trim(),
        'password': passwordController.text,
        'rolesId': rolId,
        'tipoDocumentoId': tipoDocumentoId,
        'primerNombre': primerNombreController.text.trim(),
        'segundoNombre': segundoNombreController.text.trim(),
        'primerApellido': primerApellidoController.text.trim(),
        'segundoApellido': segundoApellidoController.text.trim(),
        'telefono': telefonoController.text.trim(),
        'correoElectronico': correoController.text.trim(),
      };

      final response = await http.post(
        Uri.parse('${LoginServe.baseUrl}/api/usuario'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: json.encode(body),
      );

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        if (mounted) setState(() => isSubmitting = false);
        return;
      }

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Guardar foto si se seleccionó una
        if (_fotoBytes != null) {
          try {
            final responseData = json.decode(response.body);
            final newUsername =
                responseData['body']?['username'] ?? responseData['username'];
            if (newUsername != null) {
              final b64 = base64Encode(_fotoBytes!);
              final dataUrl = 'data:image/jpeg;base64,$b64';
              await UserPhotoService.savePhoto(newUsername.toString(), b64);
              // Persistir en BD
              await http.put(
                Uri.parse(
                    '${LoginServe.baseUrl}/api/usuario/${Uri.encodeComponent(newUsername.toString())}/foto'),
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ${LoginServe.token}',
                },
                body: json.encode({'fotoPerfil': dataUrl}),
              );
            }
          } catch (_) {}
        }
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Usuario creado exitosamente'),
              backgroundColor: Colors.green,
            ),
          );
          widget.onSuccess();
        }
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Error al crear usuario');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: BoxConstraints(
          maxWidth: 600,
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.purple,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Crear Nuevo Usuario',
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Información de Cuenta',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.purple,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.purple.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: Colors.purple.shade700,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'El username se generará automáticamente con el nombre y apellido',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.purple.shade700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Foto de perfil
                      Align(
                        alignment: Alignment.center,
                        child: Column(
                          children: [
                            const Text(
                              'Foto de Perfil (opcional)',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.purple,
                              ),
                            ),
                            const SizedBox(height: 8),
                            GestureDetector(
                              onTap: _seleccionarFoto,
                              child: CircleAvatar(
                                radius: 40,
                                backgroundColor: Colors.purple.shade100,
                                backgroundImage: _fotoBytes != null
                                    ? MemoryImage(_fotoBytes!)
                                    : null,
                                child: _fotoBytes == null
                                    ? Icon(
                                        Icons.add_a_photo,
                                        size: 32,
                                        color: Colors.purple.shade700,
                                      )
                                    : null,
                              ),
                            ),
                            if (_fotoBytes != null)
                              TextButton.icon(
                                onPressed: () =>
                                    setState(() => _fotoBytes = null),
                                icon: const Icon(
                                  Icons.delete,
                                  size: 16,
                                  color: Colors.red,
                                ),
                                label: const Text(
                                  'Quitar foto',
                                  style: TextStyle(
                                    color: Colors.red,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Password
                      TextFormField(
                        controller: passwordController,
                        obscureText: obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'Contraseña',
                          prefixIcon: const Icon(Icons.lock),
                          suffixIcon: IconButton(
                            icon: Icon(
                              obscurePassword
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                            onPressed: () => setState(
                              () => obscurePassword = !obscurePassword,
                            ),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        validator: (v) => validarPassword(v),
                      ),
                      const SizedBox(height: 16),
                      // Rol
                      DropdownButtonFormField<int>(
                        initialValue: rolId,
                        decoration: InputDecoration(
                          labelText: 'Rol *',
                          prefixIcon: const Icon(Icons.security),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        isExpanded: true,
                        items: widget.roles.map((rol) {
                          return DropdownMenuItem<int>(
                            value: rol['idRol'],
                            child: Text(
                              rol['nombreRol'] ?? '',
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (value) => setState(() => rolId = value),
                        validator: (value) =>
                            value == null ? 'Seleccione un rol' : null,
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Información Personal',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.purple,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Tipo de Documento
                      DropdownButtonFormField<int>(
                        initialValue: tipoDocumentoId,
                        decoration: InputDecoration(
                          labelText: 'Tipo de Documento *',
                          prefixIcon: const Icon(Icons.credit_card),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        isExpanded: true,
                        items: widget.tiposDocumento.map((tipo) {
                          return DropdownMenuItem<int>(
                            value: tipo['idTipoDocumento'],
                            child: Text(
                              tipo['nombreDocumento'] ?? '',
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (value) =>
                            setState(() => tipoDocumentoId = value),
                        validator: (value) =>
                            value == null ? 'Seleccione un tipo' : null,
                      ),
                      const SizedBox(height: 16),
                      // Número de Documento
                      TextFormField(
                        controller: numeroDocumentoController,
                        decoration: InputDecoration(
                          labelText: 'Número de Documento *',
                          prefixIcon: const Icon(Icons.badge),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          getDocumentoFormatter(tipoDocumentoId),
                        ],
                        validator: (v) => validarDocumento(v, tipoDocumentoId),
                      ),
                      const SizedBox(height: 16),
                      // Primer Nombre
                      TextFormField(
                        controller: primerNombreController,
                        decoration: InputDecoration(
                          labelText: 'Primer Nombre *',
                          prefixIcon: const Icon(Icons.person),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v),
                      ),
                      const SizedBox(height: 16),
                      // Segundo Nombre
                      TextFormField(
                        controller: segundoNombreController,
                        decoration: InputDecoration(
                          labelText: 'Segundo Nombre',
                          prefixIcon: const Icon(Icons.person),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v, obligatorio: false),
                      ),
                      const SizedBox(height: 16),
                      // Primer Apellido
                      TextFormField(
                        controller: primerApellidoController,
                        decoration: InputDecoration(
                          labelText: 'Primer Apellido *',
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v),
                      ),
                      const SizedBox(height: 16),
                      // Segundo Apellido
                      TextFormField(
                        controller: segundoApellidoController,
                        decoration: InputDecoration(
                          labelText: 'Segundo Apellido',
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v, obligatorio: false),
                      ),
                      const SizedBox(height: 16),
                      // Teléfono
                      TextFormField(
                        controller: telefonoController,
                        decoration: InputDecoration(
                          labelText: 'Teléfono *',
                          prefixIcon: const Icon(Icons.phone),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        keyboardType: TextInputType.phone,
                        inputFormatters: [TelefonoInputFormatter()],
                        validator: (v) => validarTelefono(v),
                      ),
                      const SizedBox(height: 16),
                      // Correo
                      TextFormField(
                        controller: correoController,
                        decoration: InputDecoration(
                          labelText: 'Correo Electrónico *',
                          prefixIcon: const Icon(Icons.email),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) => validarEmail(v),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Footer con botones
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(20),
                  bottomRight: Radius.circular(20),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: isSubmitting ? null : _crearUsuario,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                    ),
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Crear Usuario'),
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

// DIALOG DETALLES USUARIO
class DetallesUsuarioDialog extends StatefulWidget {
  final dynamic usuario;
  final List<dynamic> roles;

  const DetallesUsuarioDialog({
    super.key,
    required this.usuario,
    required this.roles,
  });

  @override
  State<DetallesUsuarioDialog> createState() => _DetallesUsuarioDialogState();
}

class _DetallesUsuarioDialogState extends State<DetallesUsuarioDialog> {
  String? _fotoBase64;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _cargarFoto();
  }

  Future<void> _cargarFoto() async {
    final username = widget.usuario['username']?.toString() ?? '';
    // Primero intentar desde SharedPreferences (puede ya estar hidratada)
    var foto = await UserPhotoService.getPhoto(username);
    // Si no hay, leer del objeto usuario que vino de la BD
    if (foto == null || foto.isEmpty) {
      final fotoApi = widget.usuario['fotoPerfil']?.toString();
      if (fotoApi != null && fotoApi.isNotEmpty) {
        await UserPhotoService.savePhoto(username, fotoApi);
        foto = UserPhotoService.extractBase64(fotoApi);
      }
    }
    if (mounted && foto != null) {
      setState(() => _fotoBase64 = foto);
    }
  }

  Future<void> _cambiarFoto() async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 75,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      final b64 = base64Encode(bytes);
      final dataUrl = 'data:image/jpeg;base64,$b64';
      final username = widget.usuario['username']?.toString() ?? '';
      // Guardar localmente
      await UserPhotoService.savePhoto(username, b64);
      if (mounted) setState(() => _fotoBase64 = b64);
      // Persistir en la BD
      try {
        await http.put(
          Uri.parse(
              '${LoginServe.baseUrl}/api/usuario/${Uri.encodeComponent(username)}/foto'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${LoginServe.token}',
          },
          body: json.encode({'fotoPerfil': dataUrl}),
        );
      } catch (_) {}
    } catch (e) {
      debugPrint('Error al seleccionar foto: $e');
    }
  }

  String _obtenerNombreRol(int? rolId) {
    if (rolId == null) return 'Sin rol';
    final rol = widget.roles.firstWhere(
      (r) => r['idRol'] == rolId,
      orElse: () => {'nombreRol': 'Desconocido'},
    );
    return rol['nombreRol'] ?? 'Desconocido';
  }

  @override
  Widget build(BuildContext context) {
    final persona =
        widget.usuario['Persona'] ?? widget.usuario['persona'] ?? {};
    final bool esActivo = widget.usuario['estadoId'] == 1;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: BoxConstraints(
          maxWidth: 500,
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          children: [
            // Header con foto
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.purple,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _cambiarFoto,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: Colors.white,
                          backgroundImage: _fotoBase64 != null
                              ? MemoryImage(base64Decode(_fotoBase64!))
                              : null,
                          child: _fotoBase64 == null
                              ? const Icon(
                                  Icons.person,
                                  color: Colors.purple,
                                  size: 32,
                                )
                              : null,
                        ),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.camera_alt,
                              size: 14,
                              color: Colors.purple,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Detalles del Usuario',
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Estado
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: esActivo
                              ? Colors.green.shade50
                              : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: esActivo ? Colors.green : Colors.red,
                          ),
                        ),
                        child: Text(
                          esActivo ? 'ACTIVO' : 'INACTIVO',
                          style: TextStyle(
                            color: esActivo
                                ? Colors.green.shade700
                                : Colors.red.shade700,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Información de Cuenta
                    _buildSeccionTitulo(
                      'Información de Cuenta',
                      Icons.account_circle,
                    ),
                    const SizedBox(height: 12),
                    _buildDetalleItem(
                      context,
                      'Username',
                      widget.usuario['username'] ?? 'N/A',
                      Icons.person,
                    ),
                    _buildDetalleItem(
                      context,
                      'Rol',
                      _obtenerNombreRol(widget.usuario['rolesId']),
                      Icons.security,
                    ),
                    const SizedBox(height: 20),
                    // Información Personal
                    _buildSeccionTitulo('Información Personal', Icons.badge),
                    const SizedBox(height: 12),
                    _buildDetalleItem(
                      context,
                      'Nombre Completo',
                      '${persona['primerNombre'] ?? ''} ${persona['segundoNombre'] ?? ''} ${persona['primerApellido'] ?? ''} ${persona['segundoApellido'] ?? ''}'
                          .trim(),
                      Icons.person_outline,
                    ),
                    _buildDetalleItem(
                      context,
                      'Tipo Documento',
                      persona['TipoDocumento']?['nombreDocumento'] ??
                          persona['tipoDocumento']?['nombreDocumento'] ??
                          'N/A',
                      Icons.credit_card,
                    ),
                    _buildDetalleItem(
                      context,
                      'Número Documento',
                      persona['numeroDocumento']?.toString() ?? 'N/A',
                      Icons.badge,
                    ),
                    const SizedBox(height: 20),
                    // Información de Contacto
                    _buildSeccionTitulo(
                      'Información de Contacto',
                      Icons.contact_phone,
                    ),
                    const SizedBox(height: 12),
                    _buildDetalleItem(
                      context,
                      'Teléfono',
                      persona['telefono']?.toString() ?? 'N/A',
                      Icons.phone,
                    ),
                    _buildDetalleItem(
                      context,
                      'Correo Electrónico',
                      persona['correoElectronico'] ?? 'N/A',
                      Icons.email,
                    ),
                  ],
                ),
              ),
            ),
            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(20),
                  bottomRight: Radius.circular(20),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Cerrar'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeccionTitulo(String titulo, IconData icono) {
    return Row(
      children: [
        Icon(icono, color: Colors.purple, size: 20),
        const SizedBox(width: 8),
        Text(
          titulo,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.purple,
          ),
        ),
      ],
    );
  }

  Widget _buildDetalleItem(
    BuildContext context,
    String label,
    String valor,
    IconData icono,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icono,
              size: 18,
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  valor.isEmpty ? 'N/A' : valor,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// DIALOG EDITAR USUARIO
class EditarUsuarioDialog extends StatefulWidget {
  final String token;
  final dynamic usuario;
  final List<dynamic> roles;
  final List<dynamic> tiposDocumento;
  final VoidCallback onSuccess;

  const EditarUsuarioDialog({
    super.key,
    required this.token,
    required this.usuario,
    required this.roles,
    required this.tiposDocumento,
    required this.onSuccess,
  });

  @override
  State<EditarUsuarioDialog> createState() => _EditarUsuarioDialogState();
}

class _EditarUsuarioDialogState extends State<EditarUsuarioDialog> {
  final _formKey = GlobalKey<FormState>();
  final usernameController = TextEditingController();
  final numeroDocumentoController = TextEditingController();
  final passwordController = TextEditingController();
  final primerNombreController = TextEditingController();
  final segundoNombreController = TextEditingController();
  final primerApellidoController = TextEditingController();
  final segundoApellidoController = TextEditingController();
  final telefonoController = TextEditingController();
  final correoController = TextEditingController();

  int? tipoDocumentoId;
  int? rolId;
  int? estadoId;
  bool obscurePassword = true;
  bool isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Prellenar campos con los datos actuales del usuario
    usernameController.text = widget.usuario['username'] ?? '';

    // Obtener datos de persona (probar ambas estructuras)
    final persona =
        widget.usuario['Persona'] ?? widget.usuario['persona'] ?? {};

    numeroDocumentoController.text = (persona['numeroDocumento'] ?? '')
        .toString();
    primerNombreController.text = persona['primerNombre'] ?? '';
    segundoNombreController.text = persona['segundoNombre'] ?? '';
    primerApellidoController.text = persona['primerApellido'] ?? '';
    segundoApellidoController.text = persona['segundoApellido'] ?? '';
    telefonoController.text = (persona['telefono'] ?? '').toString();
    correoController.text = persona['correoElectronico'] ?? '';

    tipoDocumentoId = persona['tipoDocumentoId'];
    rolId = widget.usuario['rolesId'];
    estadoId = widget.usuario['estadoId'];
  }

  @override
  void dispose() {
    usernameController.dispose();
    numeroDocumentoController.dispose();
    passwordController.dispose();
    primerNombreController.dispose();
    segundoNombreController.dispose();
    primerApellidoController.dispose();
    segundoApellidoController.dispose();
    telefonoController.dispose();
    correoController.dispose();
    super.dispose();
  }

  Future<void> _actualizarUsuario() async {
    if (!_formKey.currentState!.validate()) return;

    // Mostrar alerta de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.edit, color: Colors.purple, size: 28),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'Confirmar Actualización',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '¿Está seguro de actualizar este usuario?',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              'Los cambios se guardarán permanentemente.',
              style: TextStyle(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.5),
                fontSize: 13,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purple,
              foregroundColor: Colors.white,
            ),
            child: const Text('Actualizar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    setState(() => isSubmitting = true);

    try {
      final persona =
          widget.usuario['Persona'] ?? widget.usuario['persona'] ?? {};
      final body = <String, dynamic>{};

      // Campos de cuenta
      if (usernameController.text.trim() != widget.usuario['username']) {
        body['username'] = usernameController.text.trim();
      }
      if (passwordController.text.isNotEmpty) {
        body['password'] = passwordController.text;
      }
      if (rolId != widget.usuario['rolesId']) {
        body['rolesId'] = rolId;
      }
      if (estadoId != widget.usuario['estadoId']) {
        body['estadoId'] = estadoId;
      }

      // Campos de persona - Verificar si hay algún cambio en persona
      bool hayaCambioenPersona = false;

      if (numeroDocumentoController.text.trim() !=
          (persona['numeroDocumento']?.toString() ?? '')) {
        body['numeroDocumento'] = numeroDocumentoController.text.trim();
        hayaCambioenPersona = true;
      }
      if (tipoDocumentoId != persona['tipoDocumentoId']) {
        body['tipoDocumentoId'] = tipoDocumentoId;
        hayaCambioenPersona = true;
      }
      if (primerNombreController.text.trim() !=
          (persona['primerNombre'] ?? '')) {
        body['primerNombre'] = primerNombreController.text.trim();
        hayaCambioenPersona = true;
      }
      if (segundoNombreController.text.trim() !=
          (persona['segundoNombre'] ?? '')) {
        body['segundoNombre'] = segundoNombreController.text.trim();
        hayaCambioenPersona = true;
      }
      if (primerApellidoController.text.trim() !=
          (persona['primerApellido'] ?? '')) {
        body['primerApellido'] = primerApellidoController.text.trim();
        hayaCambioenPersona = true;
      }
      if (segundoApellidoController.text.trim() !=
          (persona['segundoApellido'] ?? '')) {
        body['segundoApellido'] = segundoApellidoController.text.trim();
        hayaCambioenPersona = true;
      }
      if (telefonoController.text.trim() !=
          (persona['telefono']?.toString() ?? '')) {
        body['telefono'] = telefonoController.text.trim();
        hayaCambioenPersona = true;
      }
      if (correoController.text.trim() !=
          (persona['correoElectronico'] ?? '')) {
        body['correoElectronico'] = correoController.text.trim();
        hayaCambioenPersona = true;
      }

      // Si hay cambios en persona, siempre incluir numeroDocumento (requerido por el backend)
      if (hayaCambioenPersona && body['numeroDocumento'] == null) {
        body['numeroDocumento'] = persona['numeroDocumento']?.toString() ?? '';
      }

      if (body.isEmpty) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No hay cambios para guardar'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      debugPrint('=== DEBUG ACTUALIZAR USUARIO ===');
      debugPrint('Username: ${widget.usuario['username']}');
      debugPrint('Body a enviar: $body');

      final response = await http.patch(
        Uri.parse(
          '${LoginServe.baseUrl}/api/usuario/${widget.usuario['username']}',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: json.encode(body),
      );

      debugPrint('Status Code: ${response.statusCode}');
      debugPrint('Response Body: ${response.body}');

      if (!context.mounted) return;

      // Validar si el token expiró
      if (manejarTokenExpirado(context, response.statusCode, response.body)) {
        if (mounted) setState(() => isSubmitting = false);
        return;
      }

      if (response.statusCode == 200) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Usuario actualizado exitosamente'),
              backgroundColor: Colors.green,
            ),
          );
          widget.onSuccess();
        }
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Error al actualizar usuario');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: BoxConstraints(
          maxWidth: 600,
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.purple,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Editar Usuario',
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Sección: Información de Cuenta
                      const Text(
                        'Información de Cuenta',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.purple,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: usernameController,
                        readOnly: true,
                        enabled: false,
                        decoration: InputDecoration(
                          labelText: 'Username',
                          prefixIcon: const Icon(Icons.account_circle),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: true,
                          fillColor: Theme.of(
                            context,
                          ).colorScheme.surfaceContainerHighest,
                          helperText: 'El username no se puede modificar',
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: passwordController,
                        obscureText: obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'Nueva Contraseña (Opcional)',
                          hintText: 'Dejar en blanco para mantener actual',
                          prefixIcon: const Icon(Icons.lock),
                          suffixIcon: IconButton(
                            icon: Icon(
                              obscurePassword
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                            onPressed: () => setState(
                              () => obscurePassword = !obscurePassword,
                            ),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        validator: (value) {
                          if (value != null && value.isNotEmpty) {
                            return validarPassword(value);
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        initialValue: rolId,
                        decoration: InputDecoration(
                          labelText: 'Rol',
                          prefixIcon: const Icon(Icons.security),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        isExpanded: true,
                        items: widget.roles.map((rol) {
                          return DropdownMenuItem<int>(
                            value: rol['idRol'],
                            child: Text(
                              rol['nombreRol'] ?? '',
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (value) => setState(() => rolId = value),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        initialValue: estadoId,
                        decoration: InputDecoration(
                          labelText: 'Estado',
                          prefixIcon: const Icon(Icons.toggle_on),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(value: 1, child: Text('Activo')),
                          DropdownMenuItem(value: 2, child: Text('Inactivo')),
                        ],
                        onChanged: (value) => setState(() => estadoId = value),
                      ),
                      const SizedBox(height: 24),
                      // Sección: Información Personal
                      const Text(
                        'Información Personal',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.purple,
                        ),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        initialValue: tipoDocumentoId,
                        decoration: InputDecoration(
                          labelText: 'Tipo de Documento',
                          prefixIcon: const Icon(Icons.credit_card),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        isExpanded: true,
                        items: widget.tiposDocumento.map((tipo) {
                          return DropdownMenuItem<int>(
                            value: tipo['idTipoDocumento'],
                            child: Text(
                              tipo['nombreDocumento'] ?? '',
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (value) =>
                            setState(() => tipoDocumentoId = value),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: numeroDocumentoController,
                        decoration: InputDecoration(
                          labelText: 'Número de Documento',
                          prefixIcon: const Icon(Icons.badge),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          getDocumentoFormatter(tipoDocumentoId),
                        ],
                        validator: (v) => validarDocumento(v, tipoDocumentoId),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: primerNombreController,
                        decoration: InputDecoration(
                          labelText: 'Primer Nombre',
                          prefixIcon: const Icon(Icons.person),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: segundoNombreController,
                        decoration: InputDecoration(
                          labelText: 'Segundo Nombre',
                          prefixIcon: const Icon(Icons.person),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v, obligatorio: false),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: primerApellidoController,
                        decoration: InputDecoration(
                          labelText: 'Primer Apellido',
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: segundoApellidoController,
                        decoration: InputDecoration(
                          labelText: 'Segundo Apellido',
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        inputFormatters: [NombreInputFormatter()],
                        validator: (v) => validarNombre(v, obligatorio: false),
                      ),
                      const SizedBox(height: 24),
                      // Sección: Información de Contacto
                      const Text(
                        'Información de Contacto',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.purple,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: telefonoController,
                        decoration: InputDecoration(
                          labelText: 'Teléfono',
                          prefixIcon: const Icon(Icons.phone),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        keyboardType: TextInputType.phone,
                        inputFormatters: [TelefonoInputFormatter()],
                        validator: (v) => validarTelefono(v),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: correoController,
                        decoration: InputDecoration(
                          labelText: 'Correo Electrónico',
                          prefixIcon: const Icon(Icons.email),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) => validarEmail(v),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(20),
                  bottomRight: Radius.circular(20),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: isSubmitting ? null : _actualizarUsuario,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple,
                      foregroundColor: Colors.white,
                    ),
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Guardar Cambios'),
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
