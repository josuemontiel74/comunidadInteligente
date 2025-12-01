/// Funciones auxiliares compartidas en toda la aplicación

/// Convierte número de torre (1-10) a letra (A-J)
String convertirTorreIdALetra(dynamic torresId) {
  if (torresId == null) return '';
  final id = int.tryParse(torresId.toString());
  if (id == null || id < 1 || id > 10) return torresId.toString();
  return String.fromCharCode('A'.codeUnitAt(0) + id - 1);
}

/// Convierte letra de torre (A-J) a número (1-10)
int? convertirTorreLetraAId(String? torreLetra) {
  if (torreLetra == null || torreLetra.isEmpty) return null;
  final letra = torreLetra.replaceAll('Torre ', '').trim();
  if (letra.length != 1) return null;
  final id = letra.codeUnitAt(0) - 'A'.codeUnitAt(0) + 1;
  return (id >= 1 && id <= 10) ? id : null;
}

/// Lista de torres disponibles
const List<String> torres = [
  'Torre A',
  'Torre B',
  'Torre C',
  'Torre D',
  'Torre E',
  'Torre F',
  'Torre G',
  'Torre H',
  'Torre I',
  'Torre J',
];

/// Mapa de torres a apartamentos
Map<String, List<String>> apartamentosPorTorre = {
  'Torre A': ['101', '102', '103', '104', '105'],
  'Torre B': ['201', '202', '203', '204', '205'],
  'Torre C': ['301', '302', '303', '304', '305'],
  'Torre D': ['401', '402', '403', '404', '405'],
  'Torre E': ['501', '502', '503', '504', '505'],
  'Torre F': ['601', '602', '603', '604', '605'],
  'Torre G': ['701', '702', '703', '704', '705'],
  'Torre H': ['801', '802', '803', '804', '805'],
  'Torre I': ['901', '902', '903', '904', '905'],
  'Torre J': ['1001', '1002', '1003', '1004', '1005'],
};

/// Obtiene lista de apartamentos para una torre específica
List<String> getApartamentosPorTorre(String torre) {
  return apartamentosPorTorre[torre] ?? [];
}
