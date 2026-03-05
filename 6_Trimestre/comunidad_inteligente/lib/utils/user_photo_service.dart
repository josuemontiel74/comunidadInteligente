import 'package:shared_preferences/shared_preferences.dart';

/// Servicio para almacenar y recuperar fotos de perfil de usuario
/// usando SharedPreferences (equivalente al localStorage del frontend web).
/// Las fotos se guardan como cadenas base64 puras (sin prefijo data:image/...).
class UserPhotoService {
  static const String _prefix = 'user_photo_';

  /// Extrae solo la parte base64 de un string que puede ser:
  ///   - "data:image/jpeg;base64,/9j/4AA..." → devuelve "/9j/4AA..."
  ///   - ya es base64 puro → devuelve igual
  static String extractBase64(String fotoPerfil) {
    final idx = fotoPerfil.indexOf(';base64,');
    if (idx != -1) return fotoPerfil.substring(idx + 8);
    return fotoPerfil;
  }

  /// Obtiene la foto de un usuario por su username.
  /// Devuelve null si no hay foto almacenada.
  static Future<String?> getPhoto(String username) async {
    if (username.isEmpty) return null;
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('$_prefix$username');
  }

  /// Guarda la foto de un usuario como base64 puro.
  /// Acepta tanto base64 puro como data URL (extrae automáticamente la parte base64).
  static Future<void> savePhoto(String username, String fotoPerfil) async {
    if (username.isEmpty || fotoPerfil.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_prefix$username', extractBase64(fotoPerfil));
  }

  /// Elimina la foto de un usuario.
  static Future<void> deletePhoto(String username) async {
    if (username.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_prefix$username');
  }
}
