import express from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", authenticateToken, authController.getProfile);

export default router;
