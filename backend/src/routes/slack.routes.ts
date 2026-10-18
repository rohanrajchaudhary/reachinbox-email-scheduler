import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import {
  connectSlack,
  slackCallback,
  disconnectSlack,
} from "../controllers/slack.controller";

const router = Router();

router.get(
  "/connect",
  authenticate,
  connectSlack
);

router.get(
  "/callback",
  slackCallback
);

router.post(
  "/disconnect",
  authenticate,
  disconnectSlack
);

export default router;