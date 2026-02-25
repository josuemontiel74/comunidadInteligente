// src/config/connect.db.js
import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import { initModels } from "../models/initModels.js";

dotenv.config({ path: ".env" });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    timezone: "-05:00",
    logging: false,
  },
);

// inicializa los modelos aquí
const models = initModels(sequelize);

try {
  await sequelize.authenticate();
} catch {
  // Error de conexión silenciado — el servidor puede arrancar sin BD y reintentar
}

// exporta ambos: sequelize y models
export { sequelize, models };
