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
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { EntityManager } from "@mikro-orm/core";
import PayOS from "@payos/node";
import { getSmallestUnit } from "../../utils";

type InjectedDependencies = {
  logger: Logger;
  manager: EntityManager; // 👈 thêm dòng này
};
type PayOSOptions = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  returnUrl: string;
  cancelUrl: string;
};

class PayOSProviderService extends AbstractPaymentProvider<PayOSOptions> {
  static isInstant = false;

  protected manager: EntityManager;

  protected logger_: Logger;
  protected readonly options_: PayOSOptions;
  protected payOS_: PayOS;

  static identifier = "payos";

  constructor(container: InjectedDependencies, options: PayOSOptions) {
    super(container, options);

    this.logger_ = container.logger;
    this.manager = container.manager; // Initialize the manager
    this.options_ = options;

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
      console.log("initiatePayment>>>", input);
      const { amount, currency_code, data } = input;

      const paymentAmount = getSmallestUnit(amount, currency_code);

      // Use order display_id as orderCode for PayOS
      const orderCode = Math.floor(Math.random() * Date.now());

      const requestData = {
        orderCode,
        amount: paymentAmount,
        description: `THOMXIU${orderCode}`,
        cancelUrl: this.options_.cancelUrl,
        returnUrl: this.options_.returnUrl,
      };

      console.log("requestData", requestData);

      const paymentLinkData = await this.payOS_.createPaymentLink(
        requestData as any
      );

      console.log("paymentLinkData->>", paymentLinkData);
      return {
        id: data?.session_id as string,
        data: {
          paymentLinkId: paymentLinkData.paymentLinkId,
          orderCode: paymentLinkData.orderCode,
          checkoutUrl: paymentLinkData.checkoutUrl,
          qrCode: paymentLinkData.qrCode,
          status: paymentLinkData.status,
          bin: paymentLinkData.bin,
          accountNumber: paymentLinkData.accountNumber,
          accountName: paymentLinkData.accountName,
          amount: paymentLinkData.amount,
          description: paymentLinkData.description,
          currency: paymentLinkData.currency,
          sessionId: data?.session_id,
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
      console.log("authorizePayment>>>", input);
      const paymentLinkId = input.data?.paymentLinkId as string;

      // Get payment information from PayOS
      const paymentInfo = await this.payOS_.getPaymentLinkInformation(
        paymentLinkId
      );
      console.log("paymentInfo->>>authorizePayment", paymentInfo);
      return {
        status: paymentInfo?.status === "PAID" ? "captured" : "pending",
        data: {
          paymentLinkId: paymentInfo?.id,
          orderCode: paymentInfo?.orderCode,
          amount: paymentInfo?.amount,
          amountPaid: paymentInfo?.amountPaid,
          amountRemaining: paymentInfo?.amountRemaining,
          status: paymentInfo?.status,
          transactions: paymentInfo?.transactions,
          createdAt: paymentInfo.createdAt,
          cancellationReason: paymentInfo.cancellationReason,
          canceledAt: paymentInfo.canceledAt,
        },
      };
    } catch (error) {
      console.log("🚀 ~ PayOSProviderService ~ error:", error);
      this.logger_.error("PayOS authorize payment error:", error);
      throw new Error(`Failed to authorize PayOS payment: ${error.message}`);
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      console.log("capturePayment>>>", input);

      const paymentLinkId = input?.data?.paymentLinkId as string;

      console.log("paymentLinkId ->>> capturePayment", paymentLinkId);
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }

      const paymentInfo = await this.payOS_.getPaymentLinkInformation(
        paymentLinkId
      );

      console.log("paymentInfo -->>capturePayment", paymentInfo);

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

      console.log("cancelPayment>>>", paymentLinkId);

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
      console.log("deletePayment>>>", input);
      const paymentLinkId = input.data?.paymentLinkId as string;
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
    console.log("refundPayment>>>");
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
      console.log("retrievePayment>>>", input);
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
    console.log("updatePayment>>>");
    // PayOS doesn't support updating payments after creation
    this.logger_.warn("PayOS update payment requested - not supported");

    throw new Error("PayOS does not support updating payments after creation.");
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    try {
      console.log("getPaymentStatus>>>");
      const paymentLinkId = input.data?.id as string;
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is required");
      }

      const paymentInfo = await this.payOS_.getPaymentLinkInformation(
        paymentLinkId
      );

      console.log("paymentInfo->>getPaymentStatus", paymentInfo);

      let status: GetPaymentStatusOutput["status"];

      switch (paymentInfo.status) {
        case "00":
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

  async getWebhookActionAndData(data: any): Promise<WebhookActionResult> {
    try {
      console.log("getWebhookActionAndData>>>>", data);

      const paymentLinkId = data?.data?.data?.paymentLinkId;
      console.log(
        "🚀 ~ PayOSProviderService ~ getWebhookActionAndData ~ paymentLinkId:",
        paymentLinkId
      );
      if (!paymentLinkId) {
        throw new Error("PaymentLinkId is missing in webhook data");
      }

      const [paymentSession] = await this.manager
        .getConnection("read")
        .execute(
          `SELECT id FROM payment_session WHERE data->>'paymentLinkId' = ?`,
          [paymentLinkId]
        );

      console.log(
        "🚀 ~ PayOSProviderService ~ getWebhookActionAndData ~ paymentSession:",
        paymentSession
      );

      if (!paymentSession) {
        throw new Error(
          `No payment session found for paymentLinkId: ${paymentLinkId}`
        );
      }

      // Map PayOS webhook status to action
      let action = "not_supported" as any;

      if (data?.data?.data?.code === "00") {
        action = "captured";
      }

      console.log("full data", {
        action,
        data: {
          session_id: paymentSession.id,
          amount: data?.data?.data?.amount,
        },
      });
      return {
        action,
        data: {
          session_id: paymentSession.id,
          amount: data?.data?.data?.amount,
        },
      };
    } catch (error) {
      this.logger_.error("PayOS webhook processing error:", error);
      throw new Error(`Failed to process PayOS webhook: ${error.message}`);
    }
  }
}

export default PayOSProviderService;
