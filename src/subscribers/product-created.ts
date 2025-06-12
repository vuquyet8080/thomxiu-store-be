import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendWebhook } from "./webhook-utils";

export default async function productCreatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  await sendWebhook("product.created", data);
}

export const config: SubscriberConfig = {
  event: "product.created",
};
