import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendWebhook } from "../utils/webhook-utils";

export default async function productDeletedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  await sendWebhook("product.deleted", data);
}

export const config: SubscriberConfig = {
  event: "product.deleted",
};
