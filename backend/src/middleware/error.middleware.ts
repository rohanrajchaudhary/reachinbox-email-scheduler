import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Server Error:", err);

  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}