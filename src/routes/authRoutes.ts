import { Router } from "express";
import {
  register,
  verifyOTP,
  login,
  refresh,
} from "../controllers/authController";
import {
  getProfile,
  updateProfile,
  submitProfile,
} from "../controllers/profileController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Authentication routes
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/refresh-token", authMiddleware, refresh);

// Profile management routes
router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile);
router.post("/submit", authMiddleware, submitProfile);

export default router;
