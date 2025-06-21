// import { processPaymentWorkflow } from "@medusajs/core-flows";
// import {
//   Event,
//   IPaymentModuleService,
//   MedusaContainer,
//   ProviderWebhookPayload,
// } from "@medusajs/framework/types";
// import {
//   Modules,
//   PaymentActions,
//   PaymentWebhookEvents,
// } from "@medusajs/framework/utils";

// type SerializedBuffer = {
//   data: ArrayBuffer;
//   type: "Buffer";
// };

// interface SubscriberContext extends Record<string, unknown> {
//   subscriberId?: string;
// }

// export type SubscriberConfig = {
//   event: string | string[];
//   context?: SubscriberContext;
// };

// export type SubscriberArgs<T = unknown> = {
//   event: Event<T>;
//   container: MedusaContainer;
//   pluginOptions: Record<string, unknown>;
// };

// export default async function paymentWebhookHandler({
//   event,
//   container,
// }: SubscriberArgs<ProviderWebhookPayload>) {
//   console.log("paymentWebhookHandler>>>", { event, container });

//   // if (event.data?.provider_id !== "payos") return;

//   console.log("111");
//   const paymentService: IPaymentModuleService = container.resolve(
//     Modules.PAYMENT
//   );

//   console.log("222");
//   const input = event.data;

//   console.log("333");

//   if (
//     (input.payload?.rawData as unknown as SerializedBuffer)?.type === "Buffer"
//   ) {
//     console.log(">>>Buffer");
//     input.payload.rawData = Buffer.from(
//       (input.payload.rawData as unknown as SerializedBuffer).data
//     );
//   }

//   console.log("444", JSON.stringify(input, null, 2));

//   const processedEvent = await paymentService.getWebhookActionAndData({
//     provider: "112233",
//     payload: input.payload,
//   });

//   console.log("555");

//   console.log("processedEvent", processedEvent);

//   if (!processedEvent.data) {
//     return;
//   }

//   if (
//     processedEvent?.action === PaymentActions.NOT_SUPPORTED ||
//     // We currently don't handle these payment statuses in the processPayment function.
//     processedEvent?.action === PaymentActions.CANCELED ||
//     processedEvent?.action === PaymentActions.FAILED ||
//     processedEvent?.action === PaymentActions.REQUIRES_MORE
//   ) {
//     return;
//   }

//   await processPaymentWorkflow(container).run({ input: processedEvent });
// }

// export const config: SubscriberConfig = {
//   // event: "payment.captured",
//   event: PaymentWebhookEvents.WebhookReceived,
//   context: {
//     subscriberId: "payment-webhook-handler-payos",
//   },
// };
