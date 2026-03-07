import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  ApiConfig._();

  // Cuando subas a la nube, pon aquí la URL completa del backend.
  // Ejemplo: 'https://mi-backend.onrender.com'
  // Mientras esté vacío, se usa la IP local configurable.
  static const String productionUrl = '';

  static bool get isProduction => productionUrl.isNotEmpty;

  static const String _defaultIp = '192.168.1.6';
  static const int port = 3001;

  static String _ip = _defaultIp;
  static String get ip => _ip;

  static String get baseUrl =>
      isProduction ? productionUrl : 'http://$_ip:$port';
  static String get apiUrl => '$baseUrl/api';

  static Future<void> init() async {
    if (isProduction) return;
    final prefs = await SharedPreferences.getInstance();
    _ip = prefs.getString('server_ip') ?? _defaultIp;
  }

  static Future<void> setIp(String newIp) async {
    _ip = newIp;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_ip', newIp);
  }
}
