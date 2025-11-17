import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'dashboardsuperadmin.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MyApp());
}

class LoginServe {
  static String baseUrl = 'http://localhost:3001';
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
      home: SafeArea(
        child: Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            backgroundColor: Colors.white54,
            title: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(height: 10),
                  Image.asset(
                    'assets/img/logo.png',
                    width: 75,
                    height: 65,
                    fit: BoxFit.contain,
                  ),
                ],
              ),
            ),
          ),

          body: SingleChildScrollView(
            child: Column(
              children: [
                SizedBox(height: 45),
                Text(
                  "Bienvenido al Conjunto Azahar",
                  style: TextStyle(fontSize: 25, color: Colors.green),
                ),
                SizedBox(height: 15),
                Text(
                  "Inicia sesión para continuar",
                  style: TextStyle(fontSize: 18, color: Colors.black),
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
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => Dialog(
            backgroundColor: Colors.green,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Lottie.asset(
                  'assets/animacion/Approve.json',
                  width: 180,
                  height: 130,
                  repeat: false,
                ),
                const SizedBox(height: 10),
                const Text(
                  '¡Bienvenido!',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
              ],
            ),
          ),
        );

        await Future.delayed(const Duration(seconds: 2));

        if (!mounted) return;
        Navigator.pop(context);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const Dashboardsuperadmin()),
        );
      } else {
        final errorBody = jsonDecode(response.body);
        final errorMessage =
            errorBody['mensaje'] ??
            'Lo siento contraseña oh usuario incorrecto Vuelva a intetalor';
        showDialog(
          context: context,
          builder: (context) => Dialog(
            backgroundColor: Colors.transparent,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Lottie.asset(
                  'assets/animacion/Error.json',
                  width: 180,
                  height: 130,
                  repeat: false,
                ),
                const SizedBox(height: 10),
                Text(
                  errorMessage,
                  style: const TextStyle(color: Colors.red, fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ],
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
      padding: const EdgeInsets.all(42.0),
      child: Column(
        children: [
          TextField(
            controller: usuario,
            decoration: InputDecoration(
              labelText: 'Ingrese su usuario',
              border: OutlineInputBorder(),
            ),
          ),
          SizedBox(height: 20),
          TextField(
            controller: contrasena,
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'Password',
              border: OutlineInputBorder(),
            ),
          ),
          SizedBox(height: 60),
          ElevatedButton(
            onPressed: _hateLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              minimumSize: Size(100, 65),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(
              "Ingresar",
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
