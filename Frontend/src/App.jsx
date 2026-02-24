import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/login.jsx";
import Vigilante from "./pages/vigilanteDashboard.jsx";
import VisitasAdmin from "./pages/visitasAdmin.jsx";
import Paqueteria from "./pages/paqueteria.jsx";
import Visitas from "./pages/visitas.jsx";
import Parqueaderos from "./pages/parqueaderos.jsx";
import Superadmin from "./pages/dashboardSuperAdmin.jsx";
import Registro from "./pages/registro.jsx";
import Residentes from "./pages/residentes.jsx";
import AreasComunes from "./pages/AreasComunes.jsx";
import CalendarioReservas from "./pages/caledario.jsx";
import GestionUsuarios from "./pages/gestionUsuarios.jsx";
import Admin from "./pages/dashboardAdmin.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";
import Reportes from "./pages/reportes.jsx";
import Auditorias from "./pages/auditorias.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

const TITULOS = {
  "/": "Conjunto Azahar",
  "/login": "Iniciar Sesión · Azahar",
  "/Vigilante": "Dashboard Vigilante · Azahar",
  "/Admin": "Dashboard Administrador · Azahar",
  "/Superadmin": "Dashboard Super Admin · Azahar",
  "/Residentes": "Residentes · Azahar",
  "/GestionUsuario": "Gestión de Usuarios · Azahar",
  "/parqueaderos": "Parqueaderos · Azahar",
  "/AreasComunes": "Áreas Comunes · Azahar",
  "/CalendarioReservas": "Calendario de Reservas · Azahar",
  "/Paqueteria": "Paquetería · Azahar",
  "/visitas": "Visitas · Azahar",
  "/VisitasAdmin": "Visitas (Admin) · Azahar",
  "/Reportes": "Reportes · Azahar",
  "/Auditorias": "Auditorías · Azahar",
  "/Registro": "Registro · Azahar",
  "/error/401": "Acceso Denegado · Azahar",
  "/error/500": "Error del Servidor · Azahar",
};

function TitleManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITULOS[pathname] ?? "Conjunto Azahar";
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <TitleManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Páginas de error */}
        <Route path="/error/401" element={<ErrorPage code={401} />} />
        <Route path="/error/500" element={<ErrorPage code={500} />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/Vigilante" element={<Vigilante />} />
          <Route path="/VisitasAdmin" element={<VisitasAdmin />} />
          <Route path="/Paqueteria" element={<Paqueteria />} />
          <Route path="/visitas" element={<Visitas />} />
          <Route path="/parqueaderos" element={<Parqueaderos />} />
          <Route path="/Superadmin" element={<Superadmin />} />
          <Route path="/Registro" element={<Registro />} />
          <Route path="/Residentes" element={<Residentes />} />
          <Route path="/AreasComunes" element={<AreasComunes />} />
          <Route path="/CalendarioReservas" element={<CalendarioReservas />} />
          <Route path="/GestionUsuario" element={<GestionUsuarios />} />
          <Route path="/Admin" element={<Admin />} />
          <Route path="/Reportes" element={<Reportes />} />
          <Route path="/Auditorias" element={<Auditorias />} />
        </Route>

        {/* Cualquier ruta no definida → 404 */}
        <Route path="*" element={<ErrorPage code={404} />} />
      </Routes>
    </>
  );
}
