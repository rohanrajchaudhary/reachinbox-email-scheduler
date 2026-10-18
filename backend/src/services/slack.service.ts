export async function sendSlackNotification(
  webhookUrl: string | null | undefined,
  message: string
): Promise<void> {
  if (!webhookUrl) {
    console.log("Slack is not connected. Skipping notification.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (!response.ok) {
      console.error(
        `Slack notification failed with status ${response.status}`
      );
    }
  } catch (error) {
    console.error("Slack notification error:", error);
  }
}