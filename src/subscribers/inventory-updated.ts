import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendWebhook } from "../utils/webhook-utils";

export default async function inventoryItemUpdatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  await sendWebhook("inventory_item.updated", data);
}

export const config: SubscriberConfig = {
  event: "inventory_item.updated",
};
