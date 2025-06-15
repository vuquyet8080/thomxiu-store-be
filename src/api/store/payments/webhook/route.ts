import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
// import PayOSPaymentProviderService from "../../../../modules/payos/service";
import { ProviderWebhookPayload } from "@medusajs/framework/types";

interface WebhookRequestBody {
  data: Record<string, unknown>;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const payosService = req.scope.resolve("payos");
  const { data } = req.body as WebhookRequestBody;

  try {
    // Verify webhook signature
    // const isValid = payosService.verifyWebhookSignature(data);
    // if (!isValid) {
    //   return res.status(400).json({
    //     message: "Invalid webhook signature",
    //   });
    // }
    // // Process webhook data
    // const webhookPayload: ProviderWebhookPayload = {
    //   provider: "payos",
    //   payload: {
    //     data,
    //     rawData: JSON.stringify(data),
    //     headers: req.headers as Record<string, unknown>,
    //   },
    // };
    // const result = await payosService.getWebhookActionAndData(webhookPayload);
    // res.json(result);
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
