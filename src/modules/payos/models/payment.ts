import { model } from "@medusajs/framework/utils";

const PayOSPayment = model.define("payos_payment", {
  id: model.id().primaryKey(),
  paymentRequestId: model.text(),
  transactionId: model.text(),
  status: model.text(),
  amount: model.number(),
  currency: model.text(),
  // created_at: model.text(),
  // updated_at: model.text(),
});

export default PayOSPayment;
