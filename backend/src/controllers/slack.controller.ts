import { Response } from "express";
import jwt from "jsonwebtoken";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../config/database";

const SLACK_AUTHORIZE_URL =
  "https://slack.com/oauth/v2/authorize";

const SLACK_OAUTH_ACCESS_URL =
  "https://slack.com/api/oauth.v2.access";

function getSlackCallbackUrl(): string {
  return (
    process.env.SLACK_CALLBACK_URL ||
    "http://localhost:5000/api/slack/callback"
  );
}

function createSlackState(userId: string): string {
  return jwt.sign(
    {
      userId,
      purpose: "slack-oauth",
    },
    process.env.JWT_SECRET || "development-secret",
    {
      expiresIn: "10m",
    }
  );
}

function verifySlackState(state: string): string {
  const payload = jwt.verify(
    state,
    process.env.JWT_SECRET || "development-secret"
  ) as {
    userId?: string;
    purpose?: string;
  };

  if (
    !payload.userId ||
    payload.purpose !== "slack-oauth"
  ) {
    throw new Error("Invalid Slack OAuth state");
  }

  return payload.userId;
}

export async function connectSlack(
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

    if (
      !process.env.SLACK_CLIENT_ID ||
      !process.env.SLACK_CLIENT_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Slack OAuth credentials are not configured",
      });
    }

    const state = createSlackState(req.userId);

    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      scope: "incoming-webhook",
      redirect_uri: getSlackCallbackUrl(),
      state,
    });

    return res.status(200).json({
      success: true,
      authorizationUrl:
        `${SLACK_AUTHORIZE_URL}?${params.toString()}`,
    });
  } catch (error) {
    console.error(
      "Slack connect error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to start Slack connection",
    });
  }
}

export async function slackCallback(
  req: AuthenticatedRequest,
  res: Response
) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  try {
    const {
      code,
      state,
      error: slackError,
    } = req.query;

    if (slackError) {
      console.error(
        "Slack OAuth denied:",
        slackError
      );

      return res.redirect(
        `${frontendUrl}/dashboard?slack=denied`
      );
    }

    if (
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      return res.redirect(
        `${frontendUrl}/dashboard?slack=failed`
      );
    }

    const userId = verifySlackState(state);

    const body = new URLSearchParams({
      client_id:
        process.env.SLACK_CLIENT_ID || "",
      client_secret:
        process.env.SLACK_CLIENT_SECRET || "",
      code,
      redirect_uri: getSlackCallbackUrl(),
    });

    const response = await fetch(
      SLACK_OAUTH_ACCESS_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      incoming_webhook?: {
        url?: string;
        channel?: string;
        channel_id?: string;
      };
    };

    if (!response.ok || !data.ok) {
      console.error(
        "Slack OAuth exchange failed:",
        data
      );

      return res.redirect(
        `${frontendUrl}/dashboard?slack=failed`
      );
    }

    const webhookUrl =
      data.incoming_webhook?.url;

    if (!webhookUrl) {
      console.error(
        "Slack OAuth response did not contain incoming webhook:",
        data
      );

      return res.redirect(
        `${frontendUrl}/dashboard?slack=failed`
      );
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        slackToken: webhookUrl,
      },
    });

    console.log(
      `✅ Slack connected for user ${userId}`
    );

    return res.redirect(
      `${frontendUrl}/dashboard?slack=connected`
    );
  } catch (error) {
    console.error(
      "Slack OAuth callback error:",
      error
    );

    return res.redirect(
      `${frontendUrl}/dashboard?slack=failed`
    );
  }
}

export async function disconnectSlack(
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

    await prisma.user.update({
      where: {
        id: req.userId,
      },
      data: {
        slackToken: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Slack disconnected successfully",
    });
  } catch (error) {
    console.error(
      "Disconnect Slack error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to disconnect Slack",
    });
  }
}