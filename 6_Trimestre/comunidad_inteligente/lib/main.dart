import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

void main() {
  runApp(const MyApp());
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
  final TextEditingController password = TextEditingController();

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
            controller: password,
            obscureText: true,

            decoration: InputDecoration(
              labelText: 'Password',
              border: OutlineInputBorder(),
            ),
          ),
          SizedBox(height: 60),
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SegundaPantalla(),
                ),
              );
            },
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

class SegundaPantalla extends StatelessWidget {
  const SegundaPantalla({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: Text("Esta en proceso ")));
  }
}
