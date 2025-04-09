import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import authRoutes from "./routes/authRoutes";
import chipRoutes from "./routes/chipRoutes";
import planRoutes from "./routes/planRoutes";
import simulationRoutes from "./routes/simulationRoutes";
import whatsappRoutes from "./routes/whatsappRoutes";
import { initWhatsapp } from "./whatsapp/whatsappClient";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

initWhatsapp().catch((error) => {
  console.error("Erro ao inicializar o WhatsApp:", error);
  // Lide com o erro de inicialização conforme necessário
});

app.use("/api/auth", authRoutes);
app.use("/api/chips", chipRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/simulations", simulationRoutes);
app.use("/api/whatsapp", whatsappRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
