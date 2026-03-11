# Comunidad Inteligente â€” Conjunto Residencial Azahar

Plataforma integral **Web + MÃ³vil** para la gestiÃ³n administrativa y logÃ­stica del Conjunto Residencial Azahar.

---

## DescripciÃ³n del problema

El proyecto resuelve problemÃ¡ticas crÃ­ticas del conjunto residencial:

- GestiÃ³n ineficiente de paqueterÃ­a y correspondencia
- Ausencia de control de visitas estructurado
- Falta de organizaciÃ³n en la reserva de Ã¡reas comunes
- Necesidad de trazabilidad en acciones administrativas
- ComunicaciÃ³n desarticulada entre administraciÃ³n y residentes

---

## Arquitectura del sistema

```
comunidadInteligente/
â”œâ”€â”€ Backend/          # API REST (Node.js + Express + MySQL)
â”œâ”€â”€ Frontend/         # AplicaciÃ³n web (React + Vite)
â””â”€â”€ 6_Trimestre/      # AplicaciÃ³n mÃ³vil (Flutter)
```

---

## TecnologÃ­as

### Backend

| TecnologÃ­a        | Uso                               |
| ----------------- | --------------------------------- |
| Node.js + Express | Servidor y API REST               |
| JWT               | AutenticaciÃ³n y autorizaciÃ³n      |
| MySQL + Sequelize | Base de datos relacional          |
| Sequelize ORM     | Modelos y queries                 |
| Dayjs             | Manejo de fechas y zonas horarias |

### Frontend Web

| TecnologÃ­a                    | Uso                               |
| ----------------------------- | --------------------------------- |
| React 18 + Vite               | Framework UI                      |
| React Router DOM v6           | Enrutamiento con rutas protegidas |
| Bootstrap 5 + Bootstrap Icons | Estilos y componentes             |
| SweetAlert2                   | Alertas y confirmaciones          |
| Chart.js                      | GrÃ¡ficas en dashboards            |
| Lottie React                  | Animaciones                       |
| FullCalendar                  | Calendario de reservas            |

### MÃ³vil

| TecnologÃ­a | Uso                       |
| ---------- | ------------------------- |
| Flutter    | Framework multiplataforma |
| Dart       | Lenguaje de desarrollo    |

---

## Roles del sistema

| Rol                     | Acceso                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| **Super Administrador** | GestiÃ³n global, usuarios, auditorÃ­as, reportes avanzados         |
| **Administrador**       | Dashboard operativo, residentes, parqueaderos, Ã¡reas, paqueterÃ­a |
| **Vigilante**           | Control de visitas, parqueaderos y paqueterÃ­a en tiempo real     |

---

## Estado del proyecto — Completado y en producción

### Completado

#### Backend

- API REST con autenticaciÃ³n JWT y control de roles
- Controladores para: visitas, visitantes, parqueaderos, paqueterÃ­a, Ã¡reas comunes, reservas, residentes, ocupantes, usuarios, reportes, auditorÃ­as, dashboard
- Sistema de auditorÃ­a: registra automÃ¡ticamente cada INSERT, UPDATE y DELETE con usuario y timestamp
- Sistema de log de errores: tabla `logErrores` con registro tÃ©cnico de fallos
- ValidaciÃ³n de fechas con zona horaria Colombia (America/Bogota)
- LÃ³gica de parqueaderos: asignaciÃ³n, liberaciÃ³n y cambio de estado automÃ¡tico al registrar visitas

#### Frontend Web

- Landing page pÃºblica con informaciÃ³n del conjunto y acceso al sistema
- Login con navegaciÃ³n al logo â†’ landing page
- Registro de usuarios
- Dashboards diferenciados por rol (Admin, SuperAdmin, Vigilante) con grÃ¡ficas en tiempo real
- AnimaciÃ³n de logout con Lottie en los tres dashboards
- Modal de WhatsApp con enlace al grupo oficial del conjunto
- TÃ­tulos dinÃ¡micos en el navegador segÃºn la ruta activa (TitleManager)
- MÃ³dulo de residentes y gestiÃ³n de usuarios completos
- Control de parqueaderos con mapa visual de disponibilidad
- MÃ³dulo de Ã¡reas comunes y calendario de reservas
- PaqueterÃ­a: registro, entrega y seguimiento
- Control de visitas con historial y filtros
- Reportes: parqueaderos, visitas, paquetes, reservas, ocupaciÃ³n, niÃ±os, poblaciÃ³n especial
- AuditorÃ­as con filtros por fecha, usuario y operaciÃ³n
- PÃ¡ginas de error personalizadas (403, 404, 500)
- Rutas protegidas por rol con redirecciÃ³n automÃ¡tica

#### App MÃ³vil Flutter

- MÃ³dulos: paqueterÃ­a, Ã¡reas comunes, visitas, usuarios, residentes, reportes, auditorÃ­as, torres
- Dashboards para Super Administrador, Administrador y Vigilante
- AutenticaciÃ³n con JWT sincronizada con el backend
- Modo oscuro completo en todas las pantallas
- IP dinÃ¡mica configurable desde el login (soporte para desarrollo y producciÃ³n en la nube)
- Bloqueo de orientaciÃ³n a portrait
- IntegraciÃ³n con WhatsApp
- Icono y nombre personalizados: "Comunidad Inteligente"
- APK de producciÃ³n disponible para descarga desde la web

#### Base de datos

- Modelo relacional documentado y actualizado (`.mwb` + `.png`)
- Backup automatizado disponible en `Backend/backups/`

### Completado en produccion

- Despliegue del backend y base de datos en **VPS Hostinger** OK
- `productionUrl` configurada en `ApiConfig` - la app movil se conecta automaticamente al servidor en la nube OK
- Sistema completamente operativo en produccion desde el 11 de marzo de 2026 OK

---

## Descarga e instalaciÃ³n de la App MÃ³vil

La aplicaciÃ³n mÃ³vil ya estÃ¡ disponible para descarga directa desde la aplicaciÃ³n web:

1. Abrir la plataforma web desde el navegador
2. Ir a la secciÃ³n **Descargar App** (disponible en la landing page y en el dashboard)
3. Descargar e instalar el APK en el dispositivo Android

### Uso en red local (desarrollo)

Mientras el backend no estÃ© desplegado en el VPS, la app funciona en red local:

1. Asegurarse de que el celular y la PC con el backend estÃ©n en la **misma red WiFi**
2. Ejecutar el backend en la PC (`npm start`)
3. En la app, tocar el **icono de engranaje** en la pantalla de login
4. Ingresar la IP local de la PC (ejemplo: `192.168.1.6`) y guardar
5. Iniciar sesiÃ³n normalmente

### Uso en producciÃ³n (VPS Hostinger)

Una vez desplegado, la app se conectarÃ¡ automÃ¡ticamente al servidor en la nube sin necesidad de configurar nada.

---

## InstalaciÃ³n rÃ¡pida

### Backend

```bash
cd Backend
npm install
# Configurar .env con credenciales de BD y JWT_SECRET
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

### App MÃ³vil

```bash
cd 6_Trimestre/comunidad_inteligente
flutter pub get
flutter run
```

---
