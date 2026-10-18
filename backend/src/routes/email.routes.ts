import { Router } from "express";

import upload from "../middleware/upload.middleware";
import { authenticate } from "../middleware/auth.middleware";

import {
  scheduleEmails,
  getScheduled,
  getSent,
  searchEmailController,
} from "../controllers/email.controller";

const router = Router();

router.post(
  "/schedule",
  authenticate,
  upload.single("file"),
  scheduleEmails
);

router.get(
  "/search",
  authenticate,
  searchEmailController
);

router.get(
  "/scheduled",
  authenticate,
  getScheduled
);

router.get(
  "/sent",
  authenticate,
  getSent
);

export default router;