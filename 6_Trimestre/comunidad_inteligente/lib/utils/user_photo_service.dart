import 'package:shared_preferences/shared_preferences.dart';

/// Servicio para almacenar y recuperar fotos de perfil de usuario
/// usando SharedPreferences (equivalente al localStorage del frontend web).
/// Las fotos se guardan como cadenas base64.
class UserPhotoService {
  static const String _prefix = 'user_photo_';

  /// Obtiene la foto de un usuario por su username.
  /// Devuelve null si no hay foto almacenada.
  static Future<String?> getPhoto(String username) async {
    if (username.isEmpty) return null;
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('$_prefix$username');
  }

  /// Guarda la foto de un usuario como base64.
  static Future<void> savePhoto(String username, String base64Photo) async {
    if (username.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_prefix$username', base64Photo);
  }

  /// Elimina la foto de un usuario.
  static Future<void> deletePhoto(String username) async {
    if (username.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_prefix$username');
  }
}
