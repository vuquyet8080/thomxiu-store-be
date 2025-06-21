import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendWebhook } from "../utils/webhook-utils";

export default async function productUpdatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  console.log("productUpdatedHandler");
  await sendWebhook("product.updated", data);
}

export const config: SubscriberConfig = {
  event: "product.updated",
};
