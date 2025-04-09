import express from "express";
import * as chipsController from "../controllers/chipsController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", chipsController.getChips);
router.get("/:id", chipsController.getChip);
router.post("/", chipsController.createChipController);
router.patch("/:id/status", chipsController.updateChipStatusController);
router.delete("/:id", chipsController.deleteChipController);

// Novas rotas para conectar o WhatsApp
router.post("/connect", chipsController.connectWhatsApp);
router.get("/status/:id", chipsController.getWhatsAppStatus);
router.post("/disconnect/:id", chipsController.disconnectWhatsApp);

export default router;
