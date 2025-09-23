import express from "express";
import morgan from "morgan";
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

const app = express();
app.use(morgan("dev"));
app.use(express.json());
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

app.get((req, res, next) => {
  res.status(404).json({
    message: "Endpoint no encontrado",
  });
});

export default app;
