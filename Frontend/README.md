# Comunidad Inteligente — Frontend

Sistema web de gestión para conjuntos residenciales. Desarrollado con **React + Vite**.

---

## Tecnologías

| Capa            | Tecnología                      |
| --------------- | ------------------------------- |
| Framework UI    | React 18 + Vite                 |
| Enrutamiento    | React Router DOM v6             |
| Estilos         | CSS personalizado + Bootstrap 5 |
| Íconos          | Bootstrap Icons                 |
| Animaciones     | Lottie (lottie-react)           |
| Alertas         | SweetAlert2                     |
| Gráficas        | Chart.js + react-chartjs-2      |
| Peticiones HTTP | Fetch API                       |
| Calendario      | FullCalendar                    |

---

## Estructura del proyecto

```
Frontend/
├── src/
│   ├── App.jsx                  # Rutas principales + TitleManager
│   ├── main.jsx
│   ├── pages/
│   │   ├── Landing.jsx          # Página de inicio pública
│   │   ├── login.jsx
│   │   ├── registro.jsx
│   │   ├── dashboardAdmin.jsx
│   │   ├── dashboardSuperAdmin.jsx
│   │   ├── vigilanteDashboard.jsx
│   │   ├── residentes.jsx
│   │   ├── gestionUsuarios.jsx
│   │   ├── parqueaderos.jsx
│   │   ├── seleccionparqueadero.jsx
│   │   ├── AreasComunes.jsx
│   │   ├── caledario.jsx
│   │   ├── paqueteria.jsx
│   │   ├── visitas.jsx
│   │   ├── visitasAdmin.jsx
│   │   ├── reportes.jsx
│   │   ├── auditorias.jsx
│   │   ├── WhatsAppModal.jsx    # Modal de acceso al grupo de WhatsApp
│   │   ├── ErrorPage.jsx        # Página de error genérica (403, 404, 500...)
│   │   ├── DescargaAppMovil.jsx # Descarga de la app móvil
│   │   ├── ModoOscuro.jsx
│   │   └── ProtectedRoute.jsx
│   ├── services/                # Lógica de llamadas a la API
│   ├── Styles/                  # Archivos CSS por módulo
│   └── animacion/               # Archivos Lottie JSON
├── img/
├── index.html
└── vite.config.js
```

---

## Módulos implementados

### Roles del sistema

- **Super Administrador** — Gestión global, reportes, auditorías, usuarios
- **Administrador** — Dashboard operativo, gestión de espacios y residentes
- **Vigilante** — Control de visitas, parqueaderos y paquetería

### Funcionalidades por módulo

| Módulo                         | Estado           |
| ------------------------------ | ---------------- |
| Landing page pública           | ✅ Completo      |
| Autenticación (login/registro) | ✅ Completo      |
| Dashboard Administrador        | ✅ Completo      |
| Dashboard Super Admin          | ✅ Completo      |
| Dashboard Vigilante            | ✅ Completo      |
| Gestión de residentes          | ✅ Completo      |
| Gestión de usuarios            | ✅ Completo      |
| Parqueaderos (visualización)   | ✅ Completo      |
| Selección de parqueadero       | ✅ Completo      |
| Áreas comunes                  | ✅ Completo      |
| Calendario de reservas         | ✅ Completo      |
| Paquetería                     | ✅ Completo      |
| Visitas                        | ✅ Completo      |
| Reportes                       | ✅ Completo      |
| Auditorías                     | ✅ Completo      |
| Modal WhatsApp                 | ✅ Completo      |
| Páginas de error (403/404/500) | ✅ Completo      |
| Títulos dinámicos por ruta     | ✅ Completo      |
| Modo oscuro                    | 🔄 En desarrollo |
| Descarga app móvil             | 🔄 En desarrollo |

---

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

> Asegúrate de tener el Backend corriendo en el puerto `3001` antes de iniciar el frontend.

---

## Variables de entorno

Crea un archivo `.env` en la raíz del Frontend:

```env
VITE_API_URL=http://localhost:3001
```

---

## Rutas registradas

| Ruta               | Página                   | Acceso                |
| ------------------ | ------------------------ | --------------------- |
| `/`                | Landing                  | Público               |
| `/login`           | Login                    | Público               |
| `/registro`        | Registro                 | Público               |
| `/Admin`           | Dashboard Administrador  | Rol: Admin            |
| `/Superadmin`      | Dashboard Super Admin    | Rol: SuperAdmin       |
| `/Vigilante`       | Dashboard Vigilante      | Rol: Vigilante        |
| `/Residentes`      | Gestión de residentes    | Rol: Admin            |
| `/GestionUsuarios` | Gestión de usuarios      | Rol: SuperAdmin       |
| `/Parqueaderos`    | Vista de parqueaderos    | Rol: Admin            |
| `/Parqueadero`     | Selección de parqueadero | Rol: Vigilante        |
| `/AreasComunes`    | Áreas comunes            | Rol: Admin            |
| `/Calendario`      | Calendario de reservas   | Rol: Admin/SuperAdmin |
| `/Paqueteria`      | Paquetería               | Rol: Vigilante/Admin  |
| `/Visitas`         | Visitas                  | Rol: Vigilante        |
| `/VisitasAdmin`    | Visitas (vista admin)    | Rol: Admin            |
| `/Reportes`        | Reportes                 | Rol: Admin/SuperAdmin |
| `/Auditorias`      | Auditorías               | Rol: SuperAdmin       |
| `/DescargaApp`     | Descarga app móvil       | Público               |
| `/unauthorized`    | Error 403                | Público               |
| `*`                | Error 404                | Público               |
