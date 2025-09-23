import app from "./app/app.js";
import dotenv from "dotenv";
dotenv.config();
import { modelsApp } from "./config/models.app.js";

dotenv.config({ path: "../.env" });

modelsApp(false);

const PORT = process.env.SERVER_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
