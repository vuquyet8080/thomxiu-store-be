const WEBHOOK_URL = process.env.CLIENT_WEBHOOK_URL || "";
const WEBHOOK_SECRET = process.env.MEDUSA_WEBHOOK_SECRET;

export async function sendWebhook(event: string, data: any) {
  try {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const headers = {
      "Content-Type": "application/json",
      ...(WEBHOOK_SECRET && { "x-medusa-signature": WEBHOOK_SECRET }),
    };

    console.log(`Sending webhook for event: ${event} to ${WEBHOOK_URL}`);

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Webhook failed for ${event}:`,
        response.status,
        response.statusText
      );
    } else {
      console.log(`Webhook sent successfully for ${event}`);
    }
  } catch (error) {
    console.error(`Error sending webhook for ${event}:`, error);
  }
}
