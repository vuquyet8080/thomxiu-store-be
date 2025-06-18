import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import PayOS from "@payos/node";
import { getSmallestUnit } from "../../utils";

type InjectedDependencies = {
  logger: Logger;
};
type PayOSOptions = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  returnUrl: string;
  cancelUrl: string;
};

class PayOSProviderService extends AbstractPaymentProvider<PayOSOptions> {
  protected logger_: Logger;
  protected readonly options_: PayOSOptions;
  protected payOS_: PayOS;

  static identifier = "payos";

  constructor(container: InjectedDependencies, options: PayOSOptions) {
    super(container, options);

    this.logger_ = container.logger;
    this.options_ = options;

    // Initialize PayOS client
    this.payOS_ = new PayOS(
      this.options_.clientId,
      this.options_.apiKey,
      this.options_.checksumKey
    );
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    try {
      const { amount, currency_code, context, data } = input;

      // Convert amount to smallest unit (VND doesn't use decimal places)
      const paymentAmount = getSmallestUnit(amount, currency_code);

      // Use order display_id as orderCode for PayOS
      const orderCode = Math.floor(Math.random() * Date.now());

      const order = data?.order as {
        items: Array<{
          name: string;
          quantity: number;
          price: number;
        }>;
      };

      if (!order) {
        throw new Error("Order data is missing");
      }
      const orderItems = order.items;

      const requestData = {
        orderCode,
        amount: paymentAmount,
        description: `THOMXIU${orderCode}`,
        items: orderItems?.map((item: any) => ({
          name: item.title,
          quantity: item.quantity,
          price: getSmallestUnit(item.unit_price, currency_code),
        })),
        cancelUrl: this.options_.cancelUrl,
        returnUrl: this.options_.returnUrl,
        buyerName: `${context?.customer?.first_name} ${context?.customer?.last_name}`,
        buyerEmail: context?.customer?.email ?? "",
        buyerPhone: context?.customer?.phone ?? "",
      };

      const paymentLinkData = await this.payOS_.createPaymentLink(requestData);

      return {
        id: paymentLinkData.paymentLinkId,
        data: {
          paymentLinkId: paymentLinkData.paymentLinkId,
          orderCode: paymentLinkData.orderCode,
          checkoutUrl: paymentLinkData.checkoutUrl,
          qrCode: paymentLinkData.qrCode,
          status: paymentLinkData.status,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS initiate payment error:", error);
      throw new Error(`Failed to initiate PayOS payment: ${error.message}`);
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const paymentLinkId = input.data?.id as string;
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }

      // Get payment information from PayOS
      const paymentInfo = await this.payOS_.getPaymentLinkInformation(
        paymentLinkId
      );

      const isPaid = paymentInfo.status === "PAID";
      const isCancelled = paymentInfo.status === "CANCELLED";

      return {
        status: isPaid ? "authorized" : isCancelled ? "canceled" : "pending",
        data: {
          paymentLinkId: paymentInfo.id,
          orderCode: paymentInfo.orderCode,
          amount: paymentInfo.amount,
          amountPaid: paymentInfo.amountPaid,
          amountRemaining: paymentInfo.amountRemaining,
          status: paymentInfo.status,
          transactions: paymentInfo.transactions,
          createdAt: paymentInfo.createdAt,
          cancellationReason: paymentInfo.cancellationReason,
          canceledAt: paymentInfo.canceledAt,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS authorize payment error:", error);
      throw new Error(`Failed to authorize PayOS payment: ${error.message}`);
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      // PayOS automatically captures payments when they are paid
      // We just need to verify the payment status
      // @ts-ignore
      const paymentLinkId = input.data?.data?.paymentLinkId as string;
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }

      const paymentInfo = await this.payOS_.getPaymentLinkInformation(
        paymentLinkId
      );

      if (paymentInfo.status !== "PAID") {
        throw new Error(
          `Payment not ready for capture. Status: ${paymentInfo.status}`
        );
      }

      return {
        data: {
          paymentLinkId: paymentInfo.id,
          orderCode: paymentInfo.orderCode,
          amount: paymentInfo.amountPaid,
          status: paymentInfo.status,
          transactions: paymentInfo.transactions,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS capture payment error:", error);
      throw new Error(`Failed to capture PayOS payment: ${error.message}`);
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      // @ts-ignore
      const paymentLinkId = input.data?.data?.paymentLinkId as string;
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }
      const cancellationReason = "Éo bik tại xao huỷ :d";

      const cancelledPayment = await this.payOS_.cancelPaymentLink(
        paymentLinkId,
        cancellationReason
      );

      return {
        data: {
          paymentLinkId: cancelledPayment.id,
          orderCode: cancelledPayment.orderCode,
          status: cancelledPayment.status,
          canceledAt: cancelledPayment.canceledAt,
          cancellationReason: cancelledPayment.cancellationReason,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS cancel payment error:", error);
      throw new Error(`Failed to cancel PayOS payment: ${error.message}`);
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // PayOS doesn't support deleting payments, only cancelling
    // We'll treat delete as cancel
    try {
      const paymentLinkId = input.data?.id as string;
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }
      const cancellationReason = "Éo bik tại xao huỷ :d";

      const cancelledPayment = await this.payOS_.cancelPaymentLink(
        paymentLinkId,
        cancellationReason
      );

      return {
        data: {
          paymentLinkId: cancelledPayment.id,
          orderCode: cancelledPayment.orderCode,
          status: cancelledPayment.status,
          canceledAt: cancelledPayment.canceledAt,
          cancellationReason: cancelledPayment.cancellationReason,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS delete payment error:", error);
      throw new Error(`Failed to delete PayOS payment: ${error.message}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    // PayOS doesn't support automatic refunds via API
    // Refunds need to be processed manually through PayOS dashboard
    this.logger_.warn("PayOS refund requested - manual processing required");

    throw new Error(
      "PayOS does not support automatic refunds via API. Please process refunds manually through the PayOS dashboard."
    );
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const paymentLinkId = input.data?.id as string;
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }

      const paymentInfo = await this.payOS_.getPaymentLinkInformation(
        paymentLinkId
      );

      return {
        data: {
          paymentLinkId: paymentInfo.id,
          orderCode: paymentInfo.orderCode,
          amount: paymentInfo.amount,
          amountPaid: paymentInfo.amountPaid,
          amountRemaining: paymentInfo.amountRemaining,
          status: paymentInfo.status,
          createdAt: paymentInfo.createdAt,
          transactions: paymentInfo.transactions,
          canceledAt: paymentInfo.canceledAt,
          cancellationReason: paymentInfo.cancellationReason,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS retrieve payment error:", error);
      throw new Error(`Failed to retrieve PayOS payment: ${error.message}`);
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // PayOS doesn't support updating payments after creation
    this.logger_.warn("PayOS update payment requested - not supported");

    throw new Error("PayOS does not support updating payments after creation.");
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    try {
      const paymentLinkId = input.data?.id as string;
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }

      const paymentInfo = await this.payOS_.getPaymentLinkInformation(
        paymentLinkId
      );

      let status: GetPaymentStatusOutput["status"];

      switch (paymentInfo.status) {
        case "PAID":
          status = "captured";
          break;
        case "CANCELLED":
          status = "canceled";
          break;
        case "PENDING":
          status = "pending";
          break;
        default:
          status = "requires_more";
      }

      return {
        status,
        data: {
          paymentLinkId: paymentInfo.id,
          orderCode: paymentInfo.orderCode,
          amount: paymentInfo.amount,
          amountPaid: paymentInfo.amountPaid,
          status: paymentInfo.status,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS get payment status error:", error);
      throw new Error(`Failed to get PayOS payment status: ${error.message}`);
    }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" };
    // try {
    //   // Verify webhook data using PayOS SDK
    //   const webhookData = this.payOS_.verifyPaymentWebhookData(data.data);

    //   let action: "authorized" | "captured" | "failed" | "canceled";

    //   // Map PayOS webhook codes to MedusaJS actions
    //   switch (webhookData.code) {
    //     case "00": // Success
    //       action = "captured";
    //       break;
    //     case "01": // Failed
    //       action = "failed";
    //       break;
    //     case "02": // Cancelled
    //       action = "canceled";
    //       break;
    //     default:
    //       action = "failed";
    //   }

    //   return {
    //     action,
    //     data: {
    //       session_id: webhookData.paymentLinkId,
    //       amount: webhookData.amount,
    //       orderCode: webhookData.orderCode,
    //       reference: webhookData.reference,
    //       transactionDateTime: webhookData.transactionDateTime,
    //       description: webhookData.description,
    //       code: webhookData.code,
    //       desc: webhookData.desc,
    //     },
    //   };
    // } catch (error) {
    //   this.logger_.error("PayOS webhook verification error:", error);
    //   throw new Error(`Failed to verify PayOS webhook: ${error.message}`);
    // }
  }
}

export default PayOSProviderService;
