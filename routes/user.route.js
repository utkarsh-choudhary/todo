import express from 'express';
import { googleLogin, login, logout, signup, forgotPassword, resetPassword } from '../controllers/authController.js';
import isAuthenticated from '../middleware/authMiddleWare.js';
const router = express.Router();

// Public routes
router.post('/signup', express.json(), signup);
router.post('/login', express.json(), login);
router.post('/logout', express.json(), logout);
router.post("/google-login", express.json(), googleLogin);
router.post('/forgot-password', express.json(), forgotPassword);
router.post('/reset-password', express.json(), resetPassword);

// Protected routes
// Add any protected routes here with isAuthenticated middleware

export default router;
