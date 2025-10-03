import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login.jsx";
import Vigilante from "./vigilanteDashboard.jsx";
import VisitasAdmin from "./visitasAdmin.jsx";
import Paqueteria from "./paqueteria.jsx";
import Visitas from "./visitas.jsx";
import Paqueadero from "./seleccionparqueadero.jsx";
import Superadmin from "./dashboardSuperAdmin.jsx";
import Registro from "./registro.jsx";
import Residentes from "./residentes.jsx";
import AreasComunes from "./AreasComunes.jsx";
import GestionUsuarios from "./gestionUsuarios.jsx";
import Admin from "./dashboardAdmin.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

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
        <Route path="/GestionUsuario" element={<GestionUsuarios />} />
        <Route path="/Admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
