import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PaymentWebhookEvents } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // res.sendStatus(200);
  const webhookPayload = req.body as any;
  console.log("body", req.body);
  const eventBus = req.scope.resolve("event_bus");

  console.log("webhookPayload", webhookPayload);

  try {
    await eventBus.emit({
      name: PaymentWebhookEvents.WebhookReceived,
      data: {
        provider_id: "payos",
        resource_id: webhookPayload?.orderCode,
        payload: {
          rawData: webhookPayload,
        },
      },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Create payment session
