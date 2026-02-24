import app from "./app/app.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { modelsApp } from "./config/models.app.js";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

modelsApp(false);

const PORT = process.env.SERVER_PORT || 3001;

app.listen(PORT, () => {});
