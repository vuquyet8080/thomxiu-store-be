# Webhook Setup Guide

## Overview

This setup creates webhook subscribers that will automatically send HTTP requests to your client application whenever relevant events occur in your Medusa store.

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# URL of your client app's webhook endpoint
CLIENT_WEBHOOK_URL=http://localhost:3001/api/webhooks/medusa

# Secret for webhook signature verification (recommended for production)
MEDUSA_WEBHOOK_SECRET=your-secure-webhook-secret
```

## Created Subscribers

The following subscribers have been created in your `src/subscribers/` directory:

1. **product-created.ts** - Triggers when a product is created
2. **product-updated.ts** - Triggers when a product is updated
3. **product-deleted.ts** - Triggers when a product is deleted
4. **collection-updated.ts** - Triggers when a collection is updated
5. **inventory-updated.ts** - Triggers when inventory is updated

## How It Works

1. When events occur in your Medusa admin (like updating a product), the corresponding subscriber will automatically execute
2. The subscriber calls the `sendWebhook` function from `webhook-utils.ts`
3. This sends an HTTP POST request to your client app's webhook endpoint
4. Your client app receives the webhook and revalidates the appropriate cache tags

## Client App Setup

Make sure your client app webhook endpoint is running at the URL specified in `CLIENT_WEBHOOK_URL`. Your existing webhook handler should work perfectly with these subscribers.

## Security

- The webhook includes a timestamp and the full event data
- If you set `MEDUSA_WEBHOOK_SECRET`, it will be sent in the `x-medusa-signature` header
- Your client app should verify this signature for security in production

## Testing

1. Start your Medusa server
2. Make sure your client app is running and the webhook endpoint is accessible
3. Update a product in your Medusa admin
4. Check the console logs for webhook sending confirmation
5. Verify that your client app receives the webhook and revalidates the cache

## Troubleshooting

- Check that the `CLIENT_WEBHOOK_URL` is correct and reachable
- Verify that your client app webhook endpoint is running
- Look at the console logs for any error messages
- Ensure both apps are running and can communicate with each other

## Adding More Events

To add more events, create new subscriber files following the same pattern:

```typescript
import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendWebhook } from "./webhook-utils";

export default async function yourEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  await sendWebhook("your.event.name", data);
}

export const config: SubscriberConfig = {
  event: "your.event.name",
};
```
