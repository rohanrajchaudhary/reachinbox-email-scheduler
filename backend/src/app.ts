import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import emailRoutes from "./routes/email.routes";
import slackRoutes from "./routes/slack.routes";

import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ReachInbox backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/slack", slackRoutes);

app.use(errorMiddleware);

export default app;