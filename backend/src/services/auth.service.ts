import jwt from "jsonwebtoken";
import prisma from "../config/database";
import { AuthUser } from "../types/auth.types";

export async function findOrCreateGoogleUser(
  googleUser: AuthUser
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      googleId: googleUser.googleId,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.avatar,
    },
  });
}

export function generateAuthToken(userId: string): string {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET || "development-secret",
    {
      expiresIn: "7d",
    }
  );
}