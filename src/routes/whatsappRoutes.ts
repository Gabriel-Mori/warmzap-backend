// backend/src/routes/whatsappRoutes.ts
import express from "express";
import * as whatsappController from "../controllers/whatsappController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Rota para iniciar a conexão do WhatsApp para um chip
router.get("/qr-code", whatsappController.getQrCodeHandler);
router.post("/connect", authenticateToken, whatsappController.connectWhatsApp);

// Rota para simular uma conversa
router.post(
  "/simulate",
  authenticateToken,
  whatsappController.simulateConversation
);

// Rota para desconectar o WhatsApp de um chip
router.post(
  "/disconnect",
  authenticateToken,
  whatsappController.disconnectWhatsApp
);

export default router;
