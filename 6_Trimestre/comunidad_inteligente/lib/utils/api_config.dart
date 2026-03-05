/// Configuración centralizada de la URL del backend.
///
/// ⚠️  IMPORTANTE — cambia [baseUrl] según el entorno:
///
///   • APK en celular físico (misma red WiFi):
///       'http://192.168.1.6:3001'  ← IP de la PC donde corre el Backend
///
///   • Emulador Android (AVD):
///       'http://10.0.2.2:3001'
///
///   • Flutter Web / localhost:
///       'http://localhost:3001'
///
class ApiConfig {
  ApiConfig._(); // no instanciable

  static const String baseUrl = 'http://192.168.1.6:3001';
  static const String apiUrl = '$baseUrl/api';
}
