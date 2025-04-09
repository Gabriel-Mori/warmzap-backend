import express from "express";
import * as simulationsController from "../controllers/simulationsController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.post("/start/:chipId", simulationsController.startSimulation);
router.post("/:id/stop", simulationsController.stopSimulation);
router.post("/:id/pause", simulationsController.pauseSimulation);
router.post("/:id/resume", simulationsController.resumeSimulation);
router.get("/:id/messages", simulationsController.getSimulationMessages);

export default router;
