import 'package:flutter/material.dart';
import 'main.dart';

class Dashboardsuperadmin extends StatelessWidget {
  const Dashboardsuperadmin({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Es un menu desplegable
      endDrawer: Drawer(
        backgroundColor: Colors.green,
        child: Column(
          children: [
            SizedBox(height: 15),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Menú Super Admin',
                style: TextStyle(fontSize: 25, color: Colors.black),
              ),
            ),
            SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Gestion Paquetes',
                style: TextStyle(fontSize: 22, color: Colors.black),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TerceraPantalla(),
                  ),
                );
              },
              child: Text(
                'Registrar Paquete',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Historial de Paquetes',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 15),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Gestion de Visitas',
                style: TextStyle(fontSize: 22, color: Colors.black),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Crear Visitas',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Consultar Visitas',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Consultar Parquedero',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 15),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Gestion de areas comunes',
                style: TextStyle(fontSize: 22, color: Colors.black),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Registrar Reserva',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Consultar zona',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 15),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Gestion de Usuarios',
                style: TextStyle(fontSize: 22, color: Colors.black),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Registrar Usuario',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Consultar Usuario',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 15),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Gestion de Residentes',
                style: TextStyle(fontSize: 22, color: Colors.black),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Registrar residentes',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 10),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => TerceraPantalla()),
                );
              },
              child: Text(
                'Consultar residetnes',
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            SizedBox(height: 22),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => MyApp()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                minimumSize: Size(100, 65),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                "Cerrar Sesión",
                style: TextStyle(fontSize: 18, color: Colors.black),
              ),
            ),
          ],
        ),
      ),
      //fin del menu
      backgroundColor: Colors.white,
      //Encabezado tiene el logo
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
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
            SizedBox(height: 25),
            Center(
              child: Text(
                'Bienvenido',
                style: TextStyle(fontSize: 35, color: Colors.black),
              ),
            ),
            SizedBox(height: 25,),
            Center(
              child: Text(
                'Selecciona el módulo que deseas gestionar en la plataforma',
                style: TextStyle(fontSize: 13, color: Colors.black),
              ),
            ),
            SizedBox(height: 35),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30),
              child: Wrap(
                spacing: 25,
                runSpacing: 40,
                alignment: WrapAlignment.center,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TerceraPantalla(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      minimumSize: Size(10, 5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Column(
                      children: [
                        Image.asset(
                          'assets/img/paquetes.jpeg',
                          width: 100,
                          height: 110,
                          fit: BoxFit.contain,
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Gestion de pauqeteria',
                          style: TextStyle(fontSize: 12, color: Colors.black),
                        ),
                        SizedBox(height: 5),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TerceraPantalla(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      minimumSize: Size(10, 5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Column(
                      children: [
                        Image.asset(
                          'assets/img/visitas.jpg',
                          width: 100,
                          height: 110,
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Gestion de visitas',
                          style: TextStyle(fontSize: 12, color: Colors.black),
                        ),
                        SizedBox(height: 5),
                      ],
                    ),
                  ),
                  SizedBox(height: 55),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TerceraPantalla(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      minimumSize: Size(10, 5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Column(
                      children: [
                        Image.asset(
                          'assets/img/areascomunes.jpg',
                          width: 110,
                          height: 110,
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Areas Comunes',
                          style: TextStyle(fontSize: 12, color: Colors.black),
                        ),
                        SizedBox(height: 5),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TerceraPantalla(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      minimumSize: Size(10, 5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Column(
                      children: [
                        Image.asset(
                          'assets/img/gestion.webp',
                          width: 100,
                          height: 110,
                        ),

                        Text(
                          'Gestion de usuario',
                          style: TextStyle(fontSize: 12, color: Colors.black),
                        ),
                        SizedBox(height: 5),
                      ],
                    ),
                  ),
                  SizedBox(height: 45),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TerceraPantalla(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      minimumSize: Size(10, 5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Column(
                      children: [
                        Image.asset('assets/img/residentes.jpg',width: 170,height: 150,),
                        Text(
                          'Gestion de Residentes',
                          style: TextStyle(fontSize: 12, color: Colors.white),
                        ),
                      ],
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
    return Scaffold(appBar: AppBar(title: Text('Pantalla en contrucion')));
  }
}
