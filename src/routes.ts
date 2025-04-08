import express, { Router } from "express";
import { getProfile, login, register } from "./controllers/authController";
import {
  createChip,
  deleteChip,
  getChip,
  getChips,
  updateChipStatus,
} from "./controllers/chipsController";
import {
  getPlan,
  getPlans,
  getUserPlans,
  purchasePlan,
} from "./controllers/plansController";
import {
  getSimulationMessages,
  pauseSimulation,
  resumeSimulation,
  startSimulation,
  stopSimulation,
} from "./controllers/simulationsController";

import { authenticateToken } from "./middleware/auth";

const router: Router = express.Router();
router.post("/register", register);
router.post("/login", login);

router.get("/", getPlans);
router.get("/:id", getPlan);

router.use(authenticateToken);

router.get("/profile", getProfile);

router.get("/", getChips);
router.get("/:id", getChip);
router.post("/", createChip);
router.patch("/:id/status", updateChipStatus);
router.delete("/:id", deleteChip);

router.post("/start", startSimulation);
router.post("/:id/stop", stopSimulation);
router.post("/:id/pause", pauseSimulation);
router.post("/:id/resume", resumeSimulation);
router.get("/:id/messages", getSimulationMessages);

router.post("/purchase", purchasePlan);
router.get("/user/plans", getUserPlans);

export default router;
