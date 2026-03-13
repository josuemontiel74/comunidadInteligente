class Auditoria {
  final int idAuditoria;
  final String username;
  final DateTime fechaHoraAuditoria;
  final String operacionRealizada;
  final String tablaAfectada;
  final int? idRegistroAfectado;
  final String? nombreAfectado; // Nombre del registro afectado desde backend

  Auditoria({
    required this.idAuditoria,
    required this.username,
    required this.fechaHoraAuditoria,
    required this.operacionRealizada,
    required this.tablaAfectada,
    this.idRegistroAfectado,
    this.nombreAfectado,
  });

  factory Auditoria.fromJson(Map<String, dynamic> json) {
    int parseIntSafe(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) {
        final parsed = int.tryParse(value);
        if (parsed != null) return parsed;
        return 0;
      }
      return 0;
    }

    int? parseIntNullable(dynamic value) {
      if (value == null) return null;
      if (value is int) return value;
      if (value is String) {
        return int.tryParse(value);
      }
      return null;
    }

    return Auditoria(
      idAuditoria: parseIntSafe(json['idAuditoria']),
      username: json['username']?.toString() ?? '',
      fechaHoraAuditoria: json['fechaHoraAuditoria'] != null
          ? DateTime.parse(json['fechaHoraAuditoria'].toString())
          : DateTime.now(),
      operacionRealizada: json['operacionRealizada']?.toString() ?? '',
      tablaAfectada: json['tablaAfectada']?.toString() ?? '',
      idRegistroAfectado: parseIntNullable(json['idRegistroAfectado']),
      nombreAfectado: json['nombreAfectado']?.toString(),
    );
  }
}
