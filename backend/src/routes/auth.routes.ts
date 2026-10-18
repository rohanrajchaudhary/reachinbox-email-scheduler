import { Router } from "express";
import passport from "passport";

import {
  googleCallback,
  getCurrentUser,
  logout,
} from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      "/api/auth/google/failure",
  }),
  googleCallback
);

router.get(
  "/google/failure",
  (_req, res) => {
    res.status(401).json({
      success: false,
      message:
        "Google authentication failed",
    });
  }
);

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.post(
  "/logout",
  logout
);

export default router;