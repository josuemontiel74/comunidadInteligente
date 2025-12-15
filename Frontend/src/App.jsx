import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import Vigilante from "./pages/vigilanteDashboard.jsx";
import VisitasAdmin from "./pages/visitasAdmin.jsx";
import Paqueteria from "./pages/paqueteria.jsx";
import Visitas from "./pages/visitas.jsx";
import Paqueadero from "./pages/seleccionparqueadero.jsx";
import Superadmin from "./pages/dashboardSuperAdmin.jsx";
import Registro from "./pages/registro.jsx";
import Residentes from "./pages/residentes.jsx";
import AreasComunes from "./pages/AreasComunes.jsx";
import CalendarioReservas from "./pages/caledario.jsx";
import GestionUsuarios from "./pages/gestionUsuarios.jsx";
import Admin from "./pages/dashboardAdmin.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";
import Reportes from "./pages/reportes.jsx";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/Vigilante" element={<Vigilante />} />
        <Route path="/VisitasAdmin" element={<VisitasAdmin />} />
        <Route path="/Paqueteria" element={<Paqueteria />} />
        <Route path="/visitas" element={<Visitas />} />
        <Route path="/parqueaderos" element={<Paqueadero />} />
        <Route path="/Superadmin" element={<Superadmin />} />
        <Route path="/Registro" element={<Registro />} />
        <Route path="/Residentes" element={<Residentes />} />
        <Route path="/AreasComunes" element={<AreasComunes />} />
        <Route path="/CalendarioReservas" element={<CalendarioReservas />} />
        <Route path="/GestionUsuario" element={<GestionUsuarios />} />
        <Route path="/Admin" element={<Admin />} />
         <Route path="/Reportes" element={<Reportes/>}/>
      </Route>
    </Routes>
  );
}
