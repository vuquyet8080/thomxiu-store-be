import { Router } from "express";
// import { PayOSPaymentProviderService } from "../../../modules/payos/service";
// import { Container } from "@medusajs/framework/types";
import PayOS from "@payos/node";
import { createSignature } from "../../../helper/sig";

const router = Router();

export default (
  rootDirectory: string,
  options: Record<string, unknown>
): Router | Router[] => {
  // const container = options.container as Container;
  // const payosService = container.resolve(
  //   "payos"
  // ) as PayOSPaymentProviderService;

  const clientPayOs = new PayOS(
    process.env.PAYOS_CLIENT_ID as string,
    process.env.PAYOS_API_KEY as string,
    process.env.PAYOS_CHECKSUM_KEY as string
  );

  // Create payment session
  router.post("/create", async (req, res) => {
    try {
      console.log("xxxxx");
      const { amount, orderId } = req.body;

      const orderCode = Date.now();
      const body = {
        amount: 1000,
        cancelUrl: `${process.env.BACKEND_URL}/payment/cancel`,
        description: `Payment for order test`,
        items: [
          {
            name: `Order test`,
            quantity: 1,
            price: 1000,
          },
        ],
        returnUrl: `${process.env.BACKEND_URL}/payment/success`,
        orderCode,
      };

      const signature = createSignature(
        {
          amount: body.amount,
          cancelUrl: body.cancelUrl,
          description: body.description,
          returnUrl: body.returnUrl,
          orderCode: body.orderCode,
        },
        process.env.PAYOS_CHECKSUM_KEY as string
      );

      const payment = await clientPayOs.createPaymentLink({
        ...body,
        signature,
      });

      res.json({
        success: true,
        data: {
          ...payment,
        },
      });
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Check payment status
  router.get("/status/:paymentLinkId", async (req, res) => {
    try {
      const { paymentLinkId } = req.params;
      const paymentInfo = clientPayOs.getPaymentLinkInformation(paymentLinkId);

      res.json({
        success: true,
        data: {
          ...paymentInfo,
        },
      });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Webhook endpoint
  router.post("/webhook", async (req, res) => {
    try {
      // const { data } = req.body;
      // console.log("Received webhook:", data);
      // // Verify signature
      // const isValid = payosService.verifyWebhookSignature(data);
      // if (!isValid) {
      //   return res.status(400).json({
      //     success: false,
      //     error: "Invalid signature",
      //   });
      // }
      // // Process webhook
      // const result = await payosService.getWebhookActionAndData({ data });
      // console.log("Webhook processed:", result);
      // res.json({
      //   success: true,
      //   data: result,
      // });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
};
