import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'screens/dashboards/dashboardsuperadmin.dart';
import 'screens/dashboards/dashboardadministrador.dart';
import 'screens/dashboards/dashboardvigilante.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_localizations/flutter_localizations.dart';

void main() {
  runApp(const MyApp());
}

class LoginServe {
  static String baseUrl = 'http://localhost:3001';
  static String? token;

  static Future<http.Response> postLogin(
    String username,
    String password,
  ) async {
    final url = Uri.parse('$baseUrl/api/login');

    final response = await http.post(
      url,
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(<String, String>{
        'username': username,
        'password': password,
      }),
    );
    return response;
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('es', 'ES'), Locale('en', 'US')],
      locale: const Locale('es', 'ES'),
      home: SafeArea(
        child: Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            centerTitle: true,
            title: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.green.withOpacity(0.3),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  padding: EdgeInsets.all(10),
                  child: Image.asset(
                    'assets/img/logo.png',
                    fit: BoxFit.contain,
                  ),
                ),
              ],
            ),
            toolbarHeight: 100,
          ),

          body: SingleChildScrollView(
            child: Column(
              children: [
                SizedBox(height: 30),
                Text(
                  "Bienvenido al Conjunto Azahar",
                  style: TextStyle(
                    fontSize: 28,
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 10),
                Text(
                  "Inicia sesión para continuar",
                  style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                ),
                SizedBox(height: 40),
                Lottie.asset(
                  'assets/animacion/loginSaluda.json',
                  width: 180,
                  height: 130,
                ),
                SizedBox(height: 40),
                Login(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class Login extends StatefulWidget {
  const Login({super.key});
  @override
  State<Login> createState() => Loginstate();
}

class Loginstate extends State<Login> {
  final TextEditingController usuario = TextEditingController();
  final TextEditingController contrasena = TextEditingController();
  void _hateLogin() async {
    final username = usuario.text;
    final password = contrasena.text;
    try {
      final response = await LoginServe.postLogin(username, password);
      if (!mounted) return;
      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        // Guardar el token
        LoginServe.token = responseBody['token'];
        // El rol está dentro de "usuario.rol" en la respuesta del backend
        final rol = responseBody['usuario']?['rol'] ?? 'superadmin';

        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            backgroundColor: Colors.green,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, color: Colors.white, size: 80),
                  const SizedBox(height: 15),
                  const Text(
                    '¡Bienvenido!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Inicio de sesión exitoso',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
        );

        await Future.delayed(const Duration(seconds: 2));

        if (!mounted) return;

        // Cerrar el diálogo primero
        Navigator.of(context, rootNavigator: true).pop();

        // Navegar según el rol
        print('Rol recibido del backend: $rol'); // Debug
        Widget dashboard;
        final rolLower = rol.toString().toLowerCase().trim();

        if (rolLower == 'vigilante') {
          dashboard = Dashboardvigilante(nombreUsuario: username);
        } else if (rolLower == 'administrador' || rolLower == 'admin') {
          dashboard = Dashboardadministrador(nombreUsuario: username);
        } else if (rolLower == 'superadmin' ||
            rolLower == 'super admin' ||
            rolLower == 'superadministrador') {
          dashboard = Dashboardsuperadmin(nombreUsuario: username);
        } else {
          // Por defecto, si no coincide ningún rol, usar el que corresponda
          dashboard = Dashboardsuperadmin(nombreUsuario: username);
        }

        // Usar pushAndRemoveUntil para limpiar toda la pila de navegación
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => dashboard),
          (route) => false,
        );
      } else {
        final errorBody = jsonDecode(response.body);
        final errorMessage =
            errorBody['mensaje'] ??
            'Lo siento, contraseña o usuario incorrecto. Vuelva a intentarlo';
        showDialog(
          context: context,
          builder: (context) => Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            backgroundColor: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline, color: Colors.red, size: 80),
                  const SizedBox(height: 15),
                  const Text(
                    'Error de inicio de sesión',
                    style: TextStyle(
                      color: Colors.red,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    errorMessage,
                    style: const TextStyle(color: Colors.black87, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Intentar de nuevo',
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error de Conexión: No se pudo conectar al servidor. '),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30.0, vertical: 20.0),
      child: Column(
        children: [
          TextField(
            controller: usuario,
            decoration: InputDecoration(
              labelText: 'Usuario',
              hintText: 'Ingrese su usuario',
              prefixIcon: Icon(Icons.person, color: Colors.green),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(color: Colors.grey.shade300, width: 2),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(color: Colors.green, width: 2),
              ),
              filled: true,
              fillColor: Colors.grey.shade50,
            ),
          ),
          SizedBox(height: 25),
          TextField(
            controller: contrasena,
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'Contraseña',
              hintText: 'Ingrese su contraseña',
              prefixIcon: Icon(Icons.lock, color: Colors.green),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(color: Colors.grey.shade300, width: 2),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(color: Colors.green, width: 2),
              ),
              filled: true,
              fillColor: Colors.grey.shade50,
            ),
          ),
          SizedBox(height: 40),
          ElevatedButton(
            onPressed: _hateLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              minimumSize: Size(double.infinity, 60),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              elevation: 5,
              shadowColor: Colors.green.withOpacity(0.5),
            ),
            child: Text(
              "Iniciar Sesión",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
