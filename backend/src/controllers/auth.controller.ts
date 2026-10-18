import { Request, Response } from "express";

import prisma from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

import {
  findOrCreateGoogleUser,
  generateAuthToken,
} from "../services/auth.service";

export async function googleCallback(
  req: Request,
  res: Response
) {
  try {
    const googleUser = req.user as {
      googleId: string;
      email: string;
      name: string;
      avatar?: string | null;
    };

    if (!googleUser) {
      return res.status(401).json({
        success: false,
        message: "Google authentication failed",
      });
    }

    const user =
      await findOrCreateGoogleUser(
        googleUser
      );

    const token =
      generateAuthToken(user.id);

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    return res.redirect(
      `${frontendUrl}/auth/callback?token=${encodeURIComponent(
        token
      )}`
    );
  } catch (error) {
    console.error(
      "Google callback error:",
      error
    );

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    return res.redirect(
      `${frontendUrl}/login?error=authentication_failed`
    );
  }
}

export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: req.userId,
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
}

export async function logout(
  _req: Request,
  res: Response
) {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}