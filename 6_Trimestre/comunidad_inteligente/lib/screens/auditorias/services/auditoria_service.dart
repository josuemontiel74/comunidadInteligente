import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/auditoria_model.dart';
import '../../../main.dart';

class AuditoriaService {
  Future<List<Auditoria>> getRegistrosAuditoria(String token) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/auditoria'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final List<dynamic> data = responseData['data'] ?? [];

        return data.map((json) => Auditoria.fromJson(json)).toList();
      } else {
        throw Exception('Error al cargar auditorías: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error al cargar auditorías: $e');
    }
  }
}
