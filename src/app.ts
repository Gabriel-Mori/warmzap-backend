import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import routes from "./routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
