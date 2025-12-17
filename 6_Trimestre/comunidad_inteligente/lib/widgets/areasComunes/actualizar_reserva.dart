import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../main.dart';
import '../../screens/areasComunes/areascomunes.dart';

class Actualizar extends StatefulWidget {
  const Actualizar({super.key, required this.token, required this.idReservas});
  final String? token;
  final int? idReservas;
  @override
  State<Actualizar> createState() => _ActualizarState();
}

class _ActualizarState extends State<Actualizar> {
  // Buscar reserva por idReservas
  List<Reserva> reservas = [];
  bool isLoading = true;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    cargarReservasId(widget.idReservas);
  }

  Future<void> cargarReservasId(int? idReservas) async {
    try {
      final response = await http.get(
        Uri.parse(
          '${LoginServe.baseUrl}/api/BuscarReserva/${widget.idReservas}',
        ),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);
        final reservaJson = jsonResponse['mostrarAreasComunes'];

        if (reservaJson == null) {
          setState(() {
            errorMessage = "No se encontró la reserva";
            isLoading = false;
          });
          return;
        }

        // Debug: Imprimir el JSON para ver la estructura
        print('=== DEBUG RESERVA JSON ===');
        print(reservaJson);

        // Extraer el tipoDocumentoId directamente del JSON
        String? tipoDocIdFromJson;

        // Intentar obtener de diferentes estructuras posibles
        if (reservaJson['Solicitante'] != null) {
          // Estructura con Solicitante anidado
          final solicitante = reservaJson['Solicitante'];
          if (solicitante['tipoDocumentoId'] != null) {
            tipoDocIdFromJson = solicitante['tipoDocumentoId'].toString();
          } else if (solicitante['TipoDocumento'] != null) {
            // Si viene el objeto TipoDocumento con nombreDocumento (T mayúscula)
            final tipoDoc = solicitante['TipoDocumento'];
            if (tipoDoc is Map) {
              final nombre =
                  tipoDoc['nombreDocumento']?.toString().toLowerCase() ?? '';
              tipoDocIdFromJson = _mapTipoDocumento(nombre);
            }
          } else if (solicitante['tipodocumento'] != null) {
            // Si viene el objeto tipodocumento con nombreDocumento (t minúscula)
            final tipoDoc = solicitante['tipodocumento'];
            if (tipoDoc is Map) {
              final nombre =
                  tipoDoc['nombreDocumento']?.toString().toLowerCase() ?? '';
              tipoDocIdFromJson = _mapTipoDocumento(nombre);
            }
          }
        } else if (reservaJson['tipoDocumentoId'] != null) {
          // Estructura plana
          tipoDocIdFromJson = reservaJson['tipoDocumentoId'].toString();
        } else if (reservaJson['nombreDocumento'] != null) {
          // Si viene el nombre directamente
          tipoDocIdFromJson = _mapTipoDocumento(
            reservaJson['nombreDocumento'].toString().toLowerCase(),
          );
        }

        print('tipoDocIdFromJson extraído: $tipoDocIdFromJson');

        setState(() {
          reservas = [Reserva.fromJson(reservaJson)];

          // Inicializar fecha
          if (reservas[0].fechaReserva != null) {
            fechaReserva = DateTime.tryParse(reservas[0].fechaReserva!);
          }

          // Inicializar hora inicio
          if (reservas[0].horaInicio != null) {
            final parts = reservas[0].horaInicio!.split(':');
            if (parts.length >= 2) {
              horaInicio = TimeOfDay(
                hour: int.tryParse(parts[0]) ?? 0,
                minute: int.tryParse(parts[1]) ?? 0,
              );
            }
          }

          // Inicializar hora fin
          if (reservas[0].horaFin != null) {
            final parts = reservas[0].horaFin!.split(':');
            if (parts.length >= 2) {
              horaFin = TimeOfDay(
                hour: int.tryParse(parts[0]) ?? 0,
                minute: int.tryParse(parts[1]) ?? 0,
              );
            }
          }

          // Inicializar tipo de documento - usar el extraído del JSON o del getter
          tipoDocumentoId = tipoDocIdFromJson ?? reservas[0].tipoDocumentoId;
          print('tipoDocumentoId final: $tipoDocumentoId');

          // Inicializar acepta reglamento
          aceptaReglamento = reservas[0].aceptaReglamento;

          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = "Error al cargar reservas: ${response.statusCode}";
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = "Error de conexión: $e";
        isLoading = false;
      });
    }
  }

  // Helper para mapear nombre de tipo de documento a ID
  String? _mapTipoDocumento(String nombre) {
    if (nombre.contains('cédula') ||
        nombre.contains('cedula') ||
        nombre == 'cc')
      return '1';
    if (nombre.contains('extranjería') ||
        nombre.contains('extranjeria') ||
        nombre == 'ce')
      return '2';
    if (nombre.contains('pasaporte') || nombre == 'pp') return '3';
    if (nombre == 'pep') return '4';
    if (nombre == 'ppt') return '5';
    return null;
  }

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
  String? numeroApartamento;
  TimeOfDay? horaInicio;
  TimeOfDay? horaFin;
  DateTime? fechaReserva;
  int? aceptaReglamento;

  // ignore: non_constant_identifier_names
  Future<void> Actualizar() async {
    // Mostrar alerta de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.edit_calendar, color: Colors.orange, size: 28),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'Confirmar Actualización',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '¿Está seguro de actualizar esta reserva?',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 8),
            Text(
              'Los cambios se guardarán permanentemente.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
            ),
            child: const Text('Actualizar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    final url = Uri.parse(
      '${LoginServe.baseUrl}/api/ActualizarReserva/${widget.idReservas}',
    );
    Map<String, dynamic> datosActualizar = {};

    if (nombreSolicitante != null && nombreSolicitante!.trim().isNotEmpty) {
      datosActualizar['nombreSolicitante'] = nombreSolicitante;
    }
    if (documentoSolicitante != null &&
        documentoSolicitante!.trim().isNotEmpty) {
      datosActualizar['documentoSolicitante'] = documentoSolicitante;
    }
    if (numeroApartamento != null && numeroApartamento!.trim().isNotEmpty) {
      final apartamentoNum = int.tryParse(numeroApartamento!);
      if (apartamentoNum != null) {
        datosActualizar['numeroApartamento'] = apartamentoNum;
      }
    }
    if (fechaReserva != null) {
      datosActualizar['fechaReserva'] =
          '${fechaReserva!.year}-${fechaReserva!.month.toString().padLeft(2, '0')}-${fechaReserva!.day.toString().padLeft(2, '0')}';
    }
    if (horaInicio != null) {
      datosActualizar['horaInicio'] =
          '${horaInicio!.hour.toString().padLeft(2, '0')}:${horaInicio!.minute.toString().padLeft(2, '0')}';
    }
    if (horaFin != null) {
      datosActualizar['horaFin'] =
          '${horaFin!.hour.toString().padLeft(2, '0')}:${horaFin!.minute.toString().padLeft(2, '0')}';
    }

    if (telefonoSolicitante != null && telefonoSolicitante!.trim().isNotEmpty) {
      datosActualizar['telefonoSolicitante'] = telefonoSolicitante;
    }
    if (correoSolicitante != null && correoSolicitante!.trim().isNotEmpty) {
      datosActualizar['correoSolicitante'] = correoSolicitante;
    }
    if (tipoDocumentoId != null) {
      datosActualizar['tipoDocumentoId'] = tipoDocumentoId;
    }
    if (areaComunId != null) {
      final areaComunNum = int.tryParse(areaComunId!);
      if (areaComunNum != null) {
        datosActualizar['areaComunId'] = areaComunNum;
      }
    }
    if (motivoReserva != null && motivoReserva!.trim().isNotEmpty) {
      datosActualizar['motivoReserva'] = motivoReserva;
    }
    if (cantidadAsistentes != null && cantidadAsistentes!.trim().isNotEmpty) {
      final cantidad = int.tryParse(cantidadAsistentes!);
      if (cantidad != null) {
        datosActualizar['cantidadAsistentes'] = cantidad;
      }
    }
    if (invitadosExternos != null) {
      final invitados = int.tryParse(invitadosExternos!);
      if (invitados != null) {
        datosActualizar['invitadosExternos'] = invitados;
      }
    }
    if (aceptaReglamento != null) {
      datosActualizar['aceptaReglamento'] = aceptaReglamento;
    }

    print('Datos a actualizar: $datosActualizar');

    final response = await http.patch(
      url,
      headers: {
        'Authorization': 'Bearer ${widget.token}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(datosActualizar),
    );

    if (!mounted) return; // Verificar si el widget sigue montado

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Reserva actualizada correctamente"),
          backgroundColor: Colors.green,
          showCloseIcon: true,
        ),
      );
      Navigator.pop(context); // Cerrar modal de actualización
      Navigator.pop(context); // Volver a la pantalla anterior
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "Error al actualizar la reserva (${response.statusCode})",
          ),
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
      backgroundColor: Colors.white,
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
                    "Actualizar Reserva",
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
          // Contenido
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : errorMessage.isNotEmpty
                ? Center(
                    child: Text(
                      errorMessage,
                      style: const TextStyle(color: Colors.red),
                    ),
                  )
                : SingleChildScrollView(
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
                                    initialValue: reservas.isNotEmpty
                                        ? reservas[0].nombreSolicitante
                                        : '',
                                    decoration: InputDecoration(
                                      labelText: "Nombre solicitante",
                                      border: border,
                                    ),
                                    validator: (value) {
                                      if (value != null &&
                                          value.trim().isNotEmpty) {
                                        if (!RegExp(
                                          r'^[a-zA-Z\sÁÉÍÓÚáéíóúÑñ]+$',
                                        ).hasMatch(value)) {
                                          return 'El nombre solo puede contener letras';
                                        }
                                      }
                                      return null;
                                    },
                                    onSaved: (val) => nombreSolicitante = val,
                                  ),
                                  const SizedBox(height: 12),

                                  DropdownButtonFormField<String>(
                                    value: tipoDocumentoId,
                                    decoration: InputDecoration(
                                      labelText: "Tipo documento",
                                      border: border,
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: "1",
                                        child: Text("CC"),
                                      ),
                                      DropdownMenuItem(
                                        value: "2",
                                        child: Text("CE"),
                                      ),
                                      DropdownMenuItem(
                                        value: "3",
                                        child: Text("PP"),
                                      ),
                                      DropdownMenuItem(
                                        value: "4",
                                        child: Text("PEP"),
                                      ),
                                      DropdownMenuItem(
                                        value: "5",
                                        child: Text("PPT"),
                                      ),
                                    ],
                                    onChanged: (v) =>
                                        setState(() => tipoDocumentoId = v),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Seleccione un tipo de documento';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 12),

                                  TextFormField(
                                    initialValue: reservas.isNotEmpty
                                        ? reservas[0].telefonoSolicitante
                                        : '',
                                    decoration: InputDecoration(
                                      labelText: "Teléfono",
                                      border: border,
                                    ),
                                    keyboardType: TextInputType.phone,
                                    validator: (value) {
                                      if (value != null &&
                                          value.trim().isNotEmpty) {
                                        if (!RegExp(
                                          r'^[0-9]{10}$',
                                        ).hasMatch(value)) {
                                          return 'El teléfono debe tener exactamente 10 dígitos';
                                        }
                                      }
                                      return null;
                                    },
                                    onSaved: (val) => telefonoSolicitante = val,
                                  ),
                                  const SizedBox(height: 12),

                                  TextFormField(
                                    initialValue: reservas.isNotEmpty
                                        ? reservas[0].correoSolicitante
                                        : '',
                                    decoration: InputDecoration(
                                      labelText: "Correo",
                                      border: border,
                                    ),
                                    keyboardType: TextInputType.emailAddress,
                                    validator: (value) {
                                      if (value != null &&
                                          value.trim().isNotEmpty) {
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

                                  TextFormField(
                                    initialValue: reservas.isNotEmpty
                                        ? reservas[0].numeroApartamento
                                        : '',
                                    decoration: InputDecoration(
                                      labelText: "Número apartamento",
                                      border: border,
                                    ),
                                    onSaved: (val) => numeroApartamento = val,
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
                                  DropdownButtonFormField<String>(
                                    value:
                                        reservas.isNotEmpty &&
                                            reservas[0].areaComunId != null
                                        ? reservas[0].areaComunId.toString()
                                        : null,
                                    decoration: InputDecoration(
                                      labelText: "Área común",
                                      border: border,
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: "1",
                                        child: Text("Salón comunal 1"),
                                      ),
                                      DropdownMenuItem(
                                        value: "2",
                                        child: Text("Salón comunal 2"),
                                      ),
                                      DropdownMenuItem(
                                        value: "3",
                                        child: Text("Zona BBQ"),
                                      ),
                                    ],
                                    onChanged: (v) => areaComunId = v,
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
                                          ? "${fechaReserva!.day.toString().padLeft(2, '0')}/${fechaReserva!.month.toString().padLeft(2, '0')}/${fechaReserva!.year}"
                                          : (reservas.isNotEmpty &&
                                                    reservas[0].fechaReserva !=
                                                        null
                                                ? reservas[0].fechaReserva!
                                                : ""),
                                    ),
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate:
                                            fechaReserva ?? DateTime.now(),
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
                                      text:
                                          horaInicio?.format(context) ??
                                          (reservas.isNotEmpty &&
                                                  reservas[0].horaInicio != null
                                              ? reservas[0].horaInicio!
                                              : ""),
                                    ),
                                    onTap: () async {
                                      final picked = await showTimePicker(
                                        context: context,
                                        initialTime:
                                            horaInicio ?? TimeOfDay.now(),
                                        builder:
                                            (
                                              BuildContext context,
                                              Widget? child,
                                            ) {
                                              return Localizations.override(
                                                context: context,
                                                locale: const Locale(
                                                  'en',
                                                  'US',
                                                ),
                                                child: MediaQuery(
                                                  data: MediaQuery.of(context)
                                                      .copyWith(
                                                        alwaysUse24HourFormat:
                                                            false,
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
                                      text:
                                          horaFin?.format(context) ??
                                          (reservas.isNotEmpty &&
                                                  reservas[0].horaFin != null
                                              ? reservas[0].horaFin!
                                              : ""),
                                    ),
                                    onTap: () async {
                                      final picked = await showTimePicker(
                                        context: context,
                                        initialTime: horaFin ?? TimeOfDay.now(),
                                        builder:
                                            (
                                              BuildContext context,
                                              Widget? child,
                                            ) {
                                              return Localizations.override(
                                                context: context,
                                                locale: const Locale(
                                                  'en',
                                                  'US',
                                                ),
                                                child: MediaQuery(
                                                  data: MediaQuery.of(context)
                                                      .copyWith(
                                                        alwaysUse24HourFormat:
                                                            false,
                                                      ),
                                                  child: child!,
                                                ),
                                              );
                                            },
                                      );
                                      if (picked != null)
                                        setState(() => horaFin = picked);
                                    },
                                  ),
                                  const SizedBox(height: 12),

                                  TextFormField(
                                    initialValue: reservas.isNotEmpty
                                        ? reservas[0].motivoReserva
                                        : '',
                                    decoration: InputDecoration(
                                      labelText: "Motivo reserva",
                                      border: border,
                                    ),
                                    onSaved: (val) => motivoReserva = val,
                                  ),
                                  const SizedBox(height: 12),

                                  TextFormField(
                                    initialValue: reservas.isNotEmpty
                                        ? reservas[0].cantidadAsistentes
                                              ?.toString()
                                        : '',
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
                                    value: reservas.isNotEmpty
                                        ? reservas[0].invitadosExternos
                                              ?.toString()
                                        : null,
                                    decoration: InputDecoration(
                                      labelText: "Invitados externos",
                                      border: border,
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: "0",
                                        child: Text("No"),
                                      ),
                                      DropdownMenuItem(
                                        value: "1",
                                        child: Text("Sí"),
                                      ),
                                    ],
                                    onChanged: (v) => invitadosExternos = v,
                                  ),
                                  const SizedBox(height: 12),

                                  // Campo deshabilitado - no se puede cambiar
                                  DropdownButtonFormField<String>(
                                    value: aceptaReglamento?.toString(),
                                    decoration: InputDecoration(
                                      labelText: "Acepta reglamento",
                                      border: border,
                                      enabled: false,
                                      filled: true,
                                      fillColor: Colors.grey.shade100,
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: "0",
                                        child: Text("No"),
                                      ),
                                      DropdownMenuItem(
                                        value: "1",
                                        child: Text("Sí"),
                                      ),
                                    ],
                                    onChanged: null,
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
                                padding: const EdgeInsets.symmetric(
                                  vertical: 15,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: const Text(
                                "Actualizar",
                                style: TextStyle(fontSize: 18),
                              ),
                              onPressed: () async {
                                if (_formKey.currentState!.validate()) {
                                  _formKey.currentState!.save();
                                  await Actualizar();
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
