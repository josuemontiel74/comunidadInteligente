# Comunidad Inteligente — Conjunto Residencial Azahar

Plataforma integral **Web + Móvil** para la gestión administrativa y logística del Conjunto Residencial Azahar.

---

## Descripción del problema

El proyecto resuelve problemáticas críticas del conjunto residencial:

- Gestión ineficiente de paquetería y correspondencia
- Ausencia de control de visitas estructurado
- Falta de organización en la reserva de áreas comunes
- Necesidad de trazabilidad en acciones administrativas
- Comunicación desarticulada entre administración y residentes

---

## Arquitectura del sistema

```
comunidadInteligente/
├── Backend/          # API REST (Node.js + Express + MySQL)
├── Frontend/         # Aplicación web (React + Vite)
└── 6_Trimestre/      # Aplicación móvil (Flutter)
```

---

## Tecnologías

### Backend
| Tecnología | Uso |
|-----------|-----|
| Node.js + Express | Servidor y API REST |
| JWT | Autenticación y autorización |
| MySQL + Sequelize | Base de datos relacional |
| Sequelize ORM | Modelos y queries |
| Dayjs | Manejo de fechas y zonas horarias |

### Frontend Web
| Tecnología | Uso |
|-----------|-----|
| React 18 + Vite | Framework UI |
| React Router DOM v6 | Enrutamiento con rutas protegidas |
| Bootstrap 5 + Bootstrap Icons | Estilos y componentes |
| SweetAlert2 | Alertas y confirmaciones |
| Chart.js | Gráficas en dashboards |
| Lottie React | Animaciones |
| FullCalendar | Calendario de reservas |

### Móvil
| Tecnología | Uso |
|-----------|-----|
| Flutter | Framework multiplataforma |
| Dart | Lenguaje de desarrollo |

---

## Roles del sistema

| Rol | Acceso |
|-----|--------|
| **Super Administrador** | Gestión global, usuarios, auditorías, reportes avanzados |
| **Administrador** | Dashboard operativo, residentes, parqueaderos, áreas, paquetería |
| **Vigilante** | Control de visitas, parqueaderos y paquetería en tiempo real |

---

## Estado actual del proyecto

### Completado

#### Backend
- API REST con autenticación JWT y control de roles
- Controladores para: visitas, visitantes, parqueaderos, paquetería, áreas comunes, reservas, residentes, ocupantes, usuarios, reportes, auditorías, dashboard
- Sistema de auditoría: registra automáticamente cada INSERT, UPDATE y DELETE con usuario y timestamp
- Sistema de log de errores: tabla `logErrores` con registro técnico de fallos
- Validación de fechas con zona horaria Colombia (America/Bogota)
- Lógica de parqueaderos: asignación, liberación y cambio de estado automático al registrar visitas

#### Frontend Web
- Landing page pública con información del conjunto y acceso al sistema
- Login con navegación al logo → landing page
- Registro de usuarios
- Dashboards diferenciados por rol (Admin, SuperAdmin, Vigilante) con gráficas en tiempo real
- Animación de logout con Lottie en los tres dashboards
- Modal de WhatsApp con enlace al grupo oficial del conjunto
- Títulos dinámicos en el navegador según la ruta activa (TitleManager)
- Módulo de residentes y gestión de usuarios completos
- Control de parqueaderos con mapa visual de disponibilidad
- Módulo de áreas comunes y calendario de reservas
- Paquetería: registro, entrega y seguimiento
- Control de visitas con historial y filtros
- Reportes: parqueaderos, visitas, paquetes, reservas, ocupación, niños, población especial
- Auditorías con filtros por fecha, usuario y operación
- Páginas de error personalizadas (403, 404, 500)
- Rutas protegidas por rol con redirección automática

#### App Móvil Flutter
- Módulos: paquetería, áreas comunes, visitas, usuarios, residentes, reportes, auditorías, torres
- Dashboards para Super Administrador, Administrador y Vigilante
- Autenticación con JWT sincronizada con el backend
- Modo oscuro completo en todas las pantallas
- IP dinámica configurable desde el login (soporte para desarrollo y producción en la nube)
- Bloqueo de orientación a portrait
- Integración con WhatsApp
- Icono y nombre personalizados: "Comunidad Inteligente"
- APK de producción disponible para descarga desde la web

#### Base de datos
- Modelo relacional documentado y actualizado (`.mwb` + `.png`)
- Backup automatizado disponible en `Backend/backups/`

### Pendiente
- Despliegue del backend en la nube (Render, Railway, AWS, etc.)
- Reescritura y actualización de la documentación técnica

---

## Instalación rápida

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

### App Móvil
```bash
cd 6_Trimestre/comunidad_inteligente
flutter pub get
flutter run
```

---
