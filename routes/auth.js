import express from "express";
import { forgotUserPassword, loginUser, registerUser, resetUserPassword } from "../controllers/auth.js";

const router = express.Router();


router.post("/register-user",registerUser)
router.post("/login-user",loginUser)
router.post("/forgot-password-user",forgotUserPassword)
router.post("/reset-password-user",resetUserPassword)

export default router