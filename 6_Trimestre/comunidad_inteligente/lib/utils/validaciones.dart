/// Utilidades de validación para formularios - Versión móvil
/// Portadas desde la versión web (validaciones.js)
library;

import 'package:flutter/services.dart';

// ══════════════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════════════

/// Patrón para nombres: letras (con tildes/ñ), espacios, apóstrofos, guiones
final RegExp _nombrePattern =
    RegExp(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$");

/// Patrón para documentos numéricos (CC, CE, PEP, PPT)
final RegExp _soloDigitos = RegExp(r'^\d+$');

/// Patrón para pasaporte: alfanumérico, máximo 2 letras
final RegExp _pasaportePattern = RegExp(r'^[a-zA-Z0-9]+$');

/// Vocales para chequeo de sentido
final RegExp _vocales = RegExp(r'[aeiouáéíóúAEIOUÁÉÍÓÚ]');

/// Lista de transportadoras conocidas en Colombia
const List<String> transportadorasCo = [
  'servientrega',
  'interrapidisimo',
  'coordinadora',
  'deprisa',
  'tcc',
  'envia',
  'saferbo',
  'envía',
  'fedex',
  'dhl',
  'ups',
  '472',
  'tempo express',
  'domina',
  'redetrans',
  'aerocarga',
  'colvanes',
  'rapidísimo',
  'amazon',
  'mercado libre',
  'mercadolibre',
  'rappi',
  'uber',
  'falabella',
  'éxito',
  'exito',
  'linio',
  'shein',
  'temu',
  'aliexpress',
  'wish',
  'otro',
  'personal',
  'particular',
];

// ══════════════════════════════════════════════════════════════════
// INPUT FORMATTERS (filtros en tiempo real)
// ══════════════════════════════════════════════════════════════════

/// Filtro de entrada para nombres: solo letras, espacios, apóstrofos y guiones
class NombreInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) return newValue;
    // Permitir solo letras (con tildes/ñ), espacios, apóstrofos, guiones
    final filtered = newValue.text.replaceAll(
      RegExp(r"[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]"),
      '',
    );
    if (filtered == newValue.text) return newValue;
    return TextEditingValue(
      text: filtered,
      selection: TextSelection.collapsed(offset: filtered.length),
    );
  }
}

/// Filtro de entrada para documentos numéricos (CC, CE, PEP, PPT)
class DocumentoNumericoInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) return newValue;
    final filtered = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (filtered == newValue.text) return newValue;
    return TextEditingValue(
      text: filtered,
      selection: TextSelection.collapsed(offset: filtered.length),
    );
  }
}

/// Filtro de entrada para pasaporte: alfanumérico, máximo 2 letras
class PasaporteInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) return newValue;
    // Solo alfanumérico
    String filtered = newValue.text.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
    // Máximo 2 letras
    final letras = filtered.replaceAll(RegExp(r'[0-9]'), '');
    if (letras.length > 2) {
      filtered = oldValue.text;
    }
    if (filtered == newValue.text) return newValue;
    return TextEditingValue(
      text: filtered,
      selection: TextSelection.collapsed(offset: filtered.length),
    );
  }
}

/// Filtro de entrada para teléfono colombiano: solo dígitos, máx 10
class TelefonoInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) return newValue;
    String filtered = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (filtered.length > 10) filtered = filtered.substring(0, 10);
    if (filtered == newValue.text) return newValue;
    return TextEditingValue(
      text: filtered,
      selection: TextSelection.collapsed(offset: filtered.length),
    );
  }
}

/// Retorna el InputFormatter adecuado según el tipo de documento
/// [tipoDocId] es el ID numérico del tipo de documento
/// Pasaporte = 2, los demás son numéricos
TextInputFormatter getDocumentoFormatter(int? tipoDocId) {
  if (tipoDocId == 2) return PasaporteInputFormatter();
  return DocumentoNumericoInputFormatter();
}

// ══════════════════════════════════════════════════════════════════
// VALIDATORS (para Form / TextFormField)
// ══════════════════════════════════════════════════════════════════

/// Verifica que un texto tenga "sentido" (al menos 15% vocales)
bool _tieneSentido(String str) {
  if (str.length < 3) return true; // Texto muy corto, permitir
  final totalVocales = _vocales.allMatches(str).length;
  return totalVocales / str.length >= 0.15;
}

/// Valida un nombre individual (primer nombre, primer apellido, etc.)
/// Retorna null si es válido, o el mensaje de error
String? validarNombre(String? value, {bool obligatorio = true}) {
  if (value == null || value.trim().isEmpty) {
    return obligatorio ? 'Campo requerido' : null;
  }
  final str = value.trim();
  if (str.length < 2) return 'Mínimo 2 caracteres';
  if (str.length > 45) return 'Máximo 45 caracteres';
  if (!_nombrePattern.hasMatch(str)) {
    return 'Solo se permiten letras, espacios y guiones';
  }
  if (!_tieneSentido(str)) {
    return 'El texto no parece un nombre válido';
  }
  return null;
}

/// Valida un nombre completo (campo de nombre concatenado)
String? validarNombreCompleto(String? value, {bool obligatorio = true}) {
  if (value == null || value.trim().isEmpty) {
    return obligatorio ? 'Campo requerido' : null;
  }
  final str = value.trim();
  if (str.length < 3) return 'Mínimo 3 caracteres';
  if (str.length > 100) return 'Máximo 100 caracteres';
  if (!_nombrePattern.hasMatch(str)) {
    return 'Solo se permiten letras, espacios y guiones';
  }
  if (!_tieneSentido(str)) {
    return 'El texto no parece un nombre válido';
  }
  return null;
}

/// Valida número de documento según tipo
/// tipoDocId: 1=CC, 2=PA, 3=CE, 4=PEP, 5=PPT (ajustar según BD)
String? validarDocumento(String? value, int? tipoDocId) {
  if (value == null || value.trim().isEmpty) return 'Campo requerido';
  final str = value.trim();

  switch (tipoDocId) {
    case 1: // Cédula de ciudadanía
      if (!_soloDigitos.hasMatch(str)) return 'Solo números para CC';
      if (str.length < 6 || str.length > 10) return 'CC debe tener entre 6 y 10 dígitos';
      break;
    case 2: // Pasaporte
      if (!_pasaportePattern.hasMatch(str)) return 'Solo letras y números';
      final letras = str.replaceAll(RegExp(r'[0-9]'), '');
      if (letras.length > 2) return 'Máximo 2 letras en pasaporte';
      if (str.length < 4 || str.length > 20) return 'Pasaporte: entre 4 y 20 caracteres';
      break;
    case 3: // Cédula de extranjería
    case 4: // PEP
    case 5: // PPT
      if (!_soloDigitos.hasMatch(str)) return 'Solo números para este documento';
      if (str.length < 4 || str.length > 20) return 'Entre 4 y 20 dígitos';
      break;
    default:
      if (str.length < 4 || str.length > 20) return 'Entre 4 y 20 caracteres';
  }
  return null;
}

/// Valida teléfono colombiano
String? validarTelefono(String? value, {bool obligatorio = false}) {
  if (value == null || value.trim().isEmpty) {
    return obligatorio ? 'Campo requerido' : null;
  }
  final str = value.trim();
  if (!_soloDigitos.hasMatch(str)) return 'Solo números';
  if (!str.startsWith('3')) return 'Debe iniciar con 3';
  if (str.length != 10) return 'Debe tener exactamente 10 dígitos';
  return null;
}

/// Valida correo electrónico
String? validarEmail(String? value, {bool obligatorio = false}) {
  if (value == null || value.trim().isEmpty) {
    return obligatorio ? 'Campo requerido' : null;
  }
  final str = value.trim();
  if (str.length > 100) return 'Máximo 100 caracteres';
  final emailRegex = RegExp(r'^[\w\-.]+@([\w\-]+\.)+[\w\-]{2,4}$');
  if (!emailRegex.hasMatch(str)) return 'Correo electrónico no válido';
  final parteLocal = str.split('@').first;
  if (parteLocal.length < 2) return 'La parte antes de @ debe tener al menos 2 caracteres';
  return null;
}

/// Valida transportadora (paquetería)
String? validarTransportadora(String? value) {
  if (value == null || value.trim().isEmpty) return 'Campo requerido';
  final str = value.trim();
  if (str.length < 2) return 'Mínimo 2 caracteres';
  if (str.length > 50) return 'Máximo 50 caracteres';
  if (RegExp(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-\.]').hasMatch(str)) {
    return 'Caracteres no permitidos';
  }
  if (!_tieneSentido(str)) {
    return 'El texto no parece una transportadora válida';
  }
  return null;
}

/// Valida contraseña
String? validarPassword(String? value) {
  if (value == null || value.trim().isEmpty) return 'Campo requerido';
  if (value.length < 6) return 'Mínimo 6 caracteres';
  if (value.length > 50) return 'Máximo 50 caracteres';
  return null;
}
