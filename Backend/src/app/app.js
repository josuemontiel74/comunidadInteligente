import express from "express";
import morgan from "morgan";
import cors from "cors";
import personasRoutes from "../routers/personas.router.js";
import tipodocumentosRoutes from "../routers/tipodocumentos.router.js";
import rolRouter from "../routers/rol.router.js";
import permisoRouter from "../routers/permisos.router.js";
import permisoRoutes from "../routers/rolespermisos.router.js";
import estados from "../routers/estados.router.js";
import torres from "../routers/torres.router.js";
import apartamentos from "../routers/apartamentos.router.js";
import ocupantes from "../routers/ocupantes.router.js";
import visitas from "../routers/visitas.router.js";
import visitantes from "../routers/visitantes.router.js";
import usuarios from "../routers/user.router.js";
import recepcionPaquetes from "../routers/recepcionPaquetes.router.js";
import solicitante from "../routers/solicitante.router.js";
import areasComunes from "../routers/areaComun.router.js";
import reservaAreaComun from "../routers/reservasAreas.router.js";
import parqueaderosRoutes from "../routers/parqueaderos.router.js";
import tiposVehiculo from "../routers/tiposVehiculo.router.js";
import Vehiculo from "../routers/vehiculo.router.js";
import dashboardRoutes from "../routers/dashboard.router.js";
import reportesRoutes from "../routers/reportes.router.js";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:57161"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use("/api/", personasRoutes);
app.use("/api/", tipodocumentosRoutes);
app.use("/api/", rolRouter);
app.use("/api/", permisoRouter);
app.use("/api/rolespermisos", permisoRoutes);
app.use("/api/", estados);
app.use("/api/", torres);
app.use("/api/", apartamentos);
app.use("/api/", ocupantes);
app.use("/api/", visitas);
app.use("/api/", visitantes);
app.use("/api/", usuarios);
app.use("/api/", recepcionPaquetes);
app.use("/api/", solicitante);
app.use("/api/", areasComunes);
app.use("/api/", reservaAreaComun);
app.use("/api/", parqueaderosRoutes);
app.use("/api/", tiposVehiculo);
app.use("/api/", Vehiculo);
app.use("/api/", dashboardRoutes);
app.use("/api/reportes", reportesRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    message: "Endpoint no encontrado",
  });
});

export default app;
