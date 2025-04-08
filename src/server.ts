import { PrismaClient } from "@prisma/client";
import app from "./app";
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    prisma.$disconnect();
  });
});
