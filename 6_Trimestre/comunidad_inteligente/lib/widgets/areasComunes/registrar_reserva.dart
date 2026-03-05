// ignore_for_file: use_build_context_synchronously
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../main.dart';

class RegistrarReserva extends StatefulWidget {
  const RegistrarReserva({super.key, required this.token});

  final String? token;

  @override
  State<RegistrarReserva> createState() => _RegistrarReservaState();
}

class _RegistrarReservaState extends State<RegistrarReserva> {
  final _formKey = GlobalKey<FormState>();
  String? nombreSolicitante;
  String? documentoSolicitante;
  String? telefonoSolicitante;
  String? correoSolicitante;
  String? tipoDocumentoId;
  String? areaComunId;
  String? motivoReserva;
  String? cantidadAsistentes;
  String? invitadosExternos;
  String? torreSeleccionada;
  String? apartamentoSeleccionado;
  int? apartamentoIdSeleccionado;
  TimeOfDay? horaInicio;
  TimeOfDay? horaFin;
  DateTime? fechaReserva;
  int? aceptaReglamento;
  List<dynamic> areasDisponibles = [];
  bool cargandoAreas = true;

  final List<String> torres = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
  ];

  // Mapeo de Torre-Apartamento a ID
  Map<String, Map<String, int>> apartamentosConId = {
    'A': {'101': 1, '102': 2, '103': 3, '104': 4, '105': 5},
    'B': {'201': 6, '202': 7, '203': 8, '204': 9, '205': 10},
    'C': {'301': 11, '302': 12, '303': 13, '304': 14, '305': 15},
    'D': {'401': 16, '402': 17, '403': 18, '404': 19, '405': 20},
    'E': {'501': 21, '502': 22, '503': 23, '504': 24, '505': 25},
    'F': {'601': 26, '602': 27, '603': 28, '604': 29, '605': 30},
    'G': {'701': 31, '702': 32, '703': 33, '704': 34, '705': 35},
    'H': {'801': 36, '802': 37, '803': 38, '804': 39, '805': 40},
    'I': {'901': 41, '902': 42, '903': 43, '904': 44, '905': 45},
    'J': {'1001': 46, '1002': 47, '1003': 48, '1004': 49, '1005': 50},
  };

  Map<String, List<String>> apartamentosPorTorre = {
    'A': ['101', '102', '103', '104', '105'],
    'B': ['201', '202', '203', '204', '205'],
    'C': ['301', '302', '303', '304', '305'],
    'D': ['401', '402', '403', '404', '405'],
    'E': ['501', '502', '503', '504', '505'],
    'F': ['601', '602', '603', '604', '605'],
    'G': ['701', '702', '703', '704', '705'],
    'H': ['801', '802', '803', '804', '805'],
    'I': ['901', '902', '903', '904', '905'],
    'J': ['1001', '1002', '1003', '1004', '1005'],
  };

  @override
  void initState() {
    super.initState();
    _cargarAreasDisponibles();
  }

  Future<void> _cargarAreasDisponibles() async {
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (widget.token != null) {
        headers['Authorization'] = 'Bearer ${widget.token}';
      }

      final response = await http.get(
        Uri.parse('${LoginServe.baseUrl}/api/areaComunes'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final areas = data['data'] ?? [];

        setState(() {
          // Filtrar solo las áreas con estadoId: 4 (Disponible)
          areasDisponibles = areas
              .where((area) => area['estadoId'] == 4)
              .toList();
          cargandoAreas = false;
        });
      } else {
        setState(() => cargandoAreas = false);
      }
    } catch (e) {
      setState(() => cargandoAreas = false);
    }
  }

  Future<void> crearReserva() async {
    final url = Uri.parse('${LoginServe.baseUrl}/api/reservas-areas');
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer ${widget.token}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'nombreSolicitante': nombreSolicitante,
        'documentoSolicitante': documentoSolicitante,
        'telefonoSolicitante': telefonoSolicitante,
        'correoSolicitante': correoSolicitante,
        'tipoDocumentoId': tipoDocumentoId,
        'areaComunId': int.tryParse(areaComunId ?? '0'),
        'motivoReserva': motivoReserva,
        'cantidadAsistentes': int.tryParse(cantidadAsistentes ?? '0'),
        'invitadosExternos': int.tryParse(invitadosExternos ?? '0'),
        'numeroApartamento': apartamentoSeleccionado,
        'aceptaReglamento': aceptaReglamento,
        'horaInicio': horaInicio != null
            ? '${horaInicio!.hour.toString().padLeft(2, '0')}:${horaInicio!.minute.toString().padLeft(2, '0')}'
            : null,
        'horaFin': horaFin != null
            ? '${horaFin!.hour.toString().padLeft(2, '0')}:${horaFin!.minute.toString().padLeft(2, '0')}'
            : null,
        'fechaReserva': fechaReserva != null
            ? '${fechaReserva!.year}-${fechaReserva!.month.toString().padLeft(2, '0')}-${fechaReserva!.day.toString().padLeft(2, '0')}'
            : null,
      }),
    );

    if (!context.mounted) return;

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Reserva creada correctamente"),
          backgroundColor: Colors.green,
          showCloseIcon: true,
        ),
      );
      await Future.delayed(const Duration(seconds: 1));
      if (!context.mounted) return;
      Navigator.pop(context);
    } else if (response.statusCode == 409) {
      // Conflicto: ya existe una reserva en el mismo horario
      final errorData = jsonDecode(response.body);
      final mensaje =
          errorData['message'] ??
          'El área ya está reservada en la fecha y horario indicados.';

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15),
            ),
            title: Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.orange.shade700,
                  size: 28,
                ),
                const SizedBox(width: 10),
                const Flexible(
                  child: Text(
                    'Horario No Disponible',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            content: Text(mensaje, style: const TextStyle(fontSize: 15)),
            actions: [
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Entendido'),
              ),
            ],
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error al crear la reserva (${response.statusCode})"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Colors.orange),
    );

    return Scaffold(
      backgroundColor: Theme.of(context).cardColor,
      body: Column(
        children: [
          // Header personalizado con botón cerrar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    "Registrar Reserva",
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          // Contenido scrollable
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Datos del solicitante",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),

                    Card(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 3,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            TextFormField(
                              decoration: InputDecoration(
                                labelText: "Nombre solicitante",
                                border: border,
                              ),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'El nombre es requerido';
                                }
                                if (!RegExp(
                                  r'^[a-zA-Z\sÁÉÍÓÚáéíóúÑñ]+$',
                                ).hasMatch(value)) {
                                  return 'El nombre solo puede contener letras';
                                }
                                return null;
                              },
                              onSaved: (val) => nombreSolicitante = val,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              decoration: InputDecoration(
                                labelText: "Documento solicitante",
                                border: border,
                              ),
                              keyboardType: TextInputType.number,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'El documento es requerido';
                                }
                                if (!RegExp(r'^[0-9]+$').hasMatch(value)) {
                                  return 'El documento solo puede contener números';
                                }
                                return null;
                              },
                              onSaved: (val) => documentoSolicitante = val,
                            ),
                            const SizedBox(height: 12),

                            DropdownButtonFormField<String>(
                              decoration: InputDecoration(
                                labelText: "Tipo documento",
                                border: border,
                              ),
                              items: const [
                                DropdownMenuItem(value: "1", child: Text("CC")),
                                DropdownMenuItem(value: "2", child: Text("CE")),
                                DropdownMenuItem(value: "3", child: Text("PP")),
                                DropdownMenuItem(
                                  value: "4",
                                  child: Text("PEP"),
                                ),
                                DropdownMenuItem(
                                  value: "5",
                                  child: Text("PPT"),
                                ),
                              ],
                              onChanged: (v) => tipoDocumentoId = v,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              decoration: InputDecoration(
                                labelText: "Teléfono",
                                border: border,
                              ),
                              keyboardType: TextInputType.phone,
                              validator: (value) {
                                if (value != null && value.trim().isNotEmpty) {
                                  if (!RegExp(r'^[0-9]{10}$').hasMatch(value)) {
                                    return 'El teléfono debe tener exactamente 10 dígitos';
                                  }
                                }
                                return null;
                              },
                              onSaved: (val) => telefonoSolicitante = val,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              decoration: InputDecoration(
                                labelText: "Correo",
                                border: border,
                              ),
                              keyboardType: TextInputType.emailAddress,
                              validator: (value) {
                                if (value != null && value.trim().isNotEmpty) {
                                  if (!RegExp(
                                    r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                                  ).hasMatch(value)) {
                                    return 'Ingrese un correo válido';
                                  }
                                }
                                return null;
                              },
                              onSaved: (val) => correoSolicitante = val,
                            ),
                            const SizedBox(height: 12),

                            // Torre
                            DropdownButtonFormField<String>(
                              initialValue: torreSeleccionada,
                              decoration: InputDecoration(
                                labelText: 'Torre *',
                                border: border,
                                prefixIcon: const Icon(Icons.apartment),
                              ),
                              items: torres.map((torre) {
                                return DropdownMenuItem(
                                  value: torre,
                                  child: Text('Torre $torre'),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  torreSeleccionada = value;
                                  apartamentoSeleccionado = null;
                                  apartamentoIdSeleccionado = null;
                                });
                              },
                              validator: (value) {
                                if (value == null) {
                                  return 'Seleccione una torre';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 12),

                            // Apartamento
                            DropdownButtonFormField<String>(
                              initialValue: apartamentoSeleccionado,
                              decoration: InputDecoration(
                                labelText: 'Apartamento *',
                                border: border,
                                prefixIcon: const Icon(Icons.home),
                              ),
                              items: torreSeleccionada != null
                                  ? apartamentosPorTorre[torreSeleccionada]!
                                        .map((apt) {
                                          return DropdownMenuItem(
                                            value: apt,
                                            child: Text('Apartamento $apt'),
                                          );
                                        })
                                        .toList()
                                  : [],
                              onChanged: (value) {
                                setState(() {
                                  apartamentoSeleccionado = value;
                                  if (torreSeleccionada != null &&
                                      value != null) {
                                    apartamentoIdSeleccionado =
                                        apartamentosConId[torreSeleccionada]![value];
                                  }
                                });
                              },
                              validator: (value) {
                                if (value == null) {
                                  return 'Seleccione un apartamento';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 25),
                    // TITULO del apartado
                    const Text(
                      "Datos de la reserva",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),

                    //segundo apartado 2
                    Card(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 3,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            cargandoAreas
                                ? const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(16.0),
                                      child: CircularProgressIndicator(
                                        color: Colors.orange,
                                      ),
                                    ),
                                  )
                                : DropdownButtonFormField<String>(
                                    decoration: InputDecoration(
                                      labelText: "Área común",
                                      border: border,
                                    ),
                                    items: areasDisponibles.isEmpty
                                        ? [
                                            const DropdownMenuItem(
                                              value: null,
                                              enabled: false,
                                              child: Text(
                                                "No hay áreas disponibles",
                                                style: TextStyle(
                                                  color: Colors.red,
                                                ),
                                              ),
                                            ),
                                          ]
                                        : areasDisponibles
                                              .map<DropdownMenuItem<String>>((
                                                area,
                                              ) {
                                                return DropdownMenuItem<String>(
                                                  value: area['idAreaComun']
                                                      .toString(),
                                                  child: Text(
                                                    area['nombreArea'] ??
                                                        'Sin nombre',
                                                  ),
                                                );
                                              })
                                              .toList(),
                                    onChanged: areasDisponibles.isEmpty
                                        ? null
                                        : (v) => areaComunId = v,
                                    validator: (v) =>
                                        v == null ? 'Seleccione un área' : null,
                                  ),
                            const SizedBox(height: 12),

                            // Fecha
                            TextFormField(
                              readOnly: true,
                              decoration: InputDecoration(
                                labelText: "Fecha reserva",
                                border: border,
                                suffixIcon: const Icon(
                                  Icons.calendar_today,
                                  color: Colors.orange,
                                ),
                              ),
                              controller: TextEditingController(
                                text: fechaReserva != null
                                    ? "${fechaReserva!.day}/${fechaReserva!.month}/${fechaReserva!.year}"
                                    : "",
                              ),
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: DateTime.now(),
                                  firstDate: DateTime.now(),
                                  lastDate: DateTime(2100),
                                );
                                if (picked != null) {
                                  setState(() => fechaReserva = picked);
                                }
                              },
                            ),
                            const SizedBox(height: 12),

                            // Hora inicio
                            TextFormField(
                              readOnly: true,
                              decoration: InputDecoration(
                                labelText: "Hora inicio",
                                border: border,
                                suffixIcon: const Icon(
                                  Icons.access_time,
                                  color: Colors.orange,
                                ),
                              ),
                              controller: TextEditingController(
                                text: horaInicio?.format(context) ?? "",
                              ),
                              onTap: () async {
                                final picked = await showTimePicker(
                                  context: context,
                                  initialTime: TimeOfDay.now(),
                                  builder:
                                      (BuildContext context, Widget? child) {
                                        return Localizations.override(
                                          context: context,
                                          locale: const Locale('en', 'US'),
                                          child: MediaQuery(
                                            data: MediaQuery.of(context)
                                                .copyWith(
                                                  alwaysUse24HourFormat: false,
                                                ),
                                            child: child!,
                                          ),
                                        );
                                      },
                                );
                                if (picked != null) {
                                  setState(() => horaInicio = picked);
                                }
                              },
                            ),
                            const SizedBox(height: 12),

                            // Hora fin
                            TextFormField(
                              readOnly: true,
                              decoration: InputDecoration(
                                labelText: "Hora fin",
                                border: border,
                                suffixIcon: const Icon(
                                  Icons.access_time_filled,
                                  color: Colors.orange,
                                ),
                              ),
                              controller: TextEditingController(
                                text: horaFin?.format(context) ?? "",
                              ),
                              onTap: () async {
                                final picked = await showTimePicker(
                                  context: context,
                                  initialTime: TimeOfDay.now(),
                                  builder:
                                      (BuildContext context, Widget? child) {
                                        return Localizations.override(
                                          context: context,
                                          locale: const Locale('en', 'US'),
                                          child: MediaQuery(
                                            data: MediaQuery.of(context)
                                                .copyWith(
                                                  alwaysUse24HourFormat: false,
                                                ),
                                            child: child!,
                                          ),
                                        );
                                      },
                                );
                                if (picked != null) {
                                  setState(() => horaFin = picked);
                                }
                              },
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              decoration: InputDecoration(
                                labelText: "Motivo reserva",
                                border: border,
                              ),
                              onSaved: (val) => motivoReserva = val,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: "Cantidad asistentes",
                                border: border,
                              ),
                              validator: (value) {
                                if (value != null && value.isNotEmpty) {
                                  final numero = int.tryParse(value);
                                  if (numero == null) {
                                    return 'Ingrese un número válido';
                                  }
                                  if (numero < 0) {
                                    return 'La cantidad no puede ser negativa';
                                  }
                                  if (numero > 127) {
                                    return 'Máximo 127 asistentes permitidos';
                                  }
                                }
                                return null;
                              },
                              onSaved: (val) => cantidadAsistentes = val,
                            ),
                            const SizedBox(height: 12),

                            DropdownButtonFormField<String>(
                              decoration: InputDecoration(
                                labelText: "Invitados externos",
                                border: border,
                              ),
                              items: const [
                                DropdownMenuItem(value: "0", child: Text("No")),
                                DropdownMenuItem(value: "1", child: Text("Sí")),
                              ],
                              onChanged: (v) => invitadosExternos = v,
                            ),
                            const SizedBox(height: 12),

                            DropdownButtonFormField<String>(
                              decoration: InputDecoration(
                                labelText: "Acepta reglamento *",
                                border: border,
                              ),
                              items: const [
                                DropdownMenuItem(
                                  value: "1",
                                  child: Text("Sí, acepto"),
                                ),
                              ],
                              validator: (value) {
                                if (value == null || value != "1") {
                                  return 'Debe aceptar el reglamento para continuar';
                                }
                                return null;
                              },
                              onChanged: (v) =>
                                  aceptaReglamento = int.tryParse(v ?? '0'),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 30),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text(
                          "Guardar",
                          style: TextStyle(fontSize: 18),
                        ),
                        onPressed: () async {
                          if (_formKey.currentState!.validate()) {
                            _formKey.currentState!.save();
                            await crearReserva();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
