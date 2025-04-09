import express from "express";
import * as plansController from "../controllers/plansController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", plansController.getPlans);
router.get("/:id", plansController.getPlan);

router.use(authenticateToken);
router.post("/purchase", plansController.purchasePlan);
router.get("/user/plans", plansController.getUserPlans);

export default router;
