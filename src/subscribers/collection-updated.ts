import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendWebhook } from "../utils/webhook-utils";

export default async function collectionUpdatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  await sendWebhook("collection.updated", data);
}

export const config: SubscriberConfig = {
  event: "collection.updated",
};
