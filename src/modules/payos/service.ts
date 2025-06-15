import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CapturePaymentInput,
  DeletePaymentInput,
  GetPaymentStatusInput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RetrievePaymentInput,
  UpdatePaymentInput,
} from "@medusajs/framework/types";
import { AbstractPaymentProvider } from "@medusajs/framework/utils";

import PayOS from "@payos/node";

type Options = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
};

type InjectedDependencies = {
  logger: Logger;
};

class PayOSPaymentProviderService extends AbstractPaymentProvider<Options> {
  protected logger_: Logger;
  protected options_: Options;
  // assuming you're initializing a client
  protected client;

  protected clientPayOs: PayOS;
  static identifier = "payos";

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options);

    this.logger_ = container.logger;
    this.options_ = options;

    this.clientPayOs = new PayOS(
      options.clientId,
      options.apiKey,
      options.checksumKey
    );
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    console.log("step =>>> authorizePayment");
    return {
      data: {},
      status: "pending",
    };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<any> {
    console.log("step =>>> cancelPayment");
  }

  async capturePayment(input: CapturePaymentInput): Promise<any> {
    console.log("step =>>> capturePayment");
  }

  async deletePayment(input: DeletePaymentInput): Promise<any> {
    console.log("step =>>> deletePayment");
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<any> {
    console.log("step =>>> getPaymentStatus");
    // const externalId = input.data?.id;
    return;
    // assuming you have a client that retrieves the payment status
    // const status = await this.client.getStatus(externalId);

    // switch (status) {
    //   case "requires_capture":
    //     return { status: "authorized" };
    //   case "success":
    //     return { status: "captured" };
    //   case "canceled":
    //     return { status: "canceled" };
    //   default:
    //     return { status: "pending" };
    // }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<any> {
    console.log("step =>>> getWebhookActionAndData");
    return;
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    console.log("step =>>> initiatePayment");

    const orderCode = Date.now(); // tạo mã đơn

    const body = {
      amount: 1000,
      cancelUrl: "http://localhost:3000/cancel.html",
      description: "Thanh toan don hang",
      items: [
        {
          name: "Mi tom hao hao",
          quantity: 1,
          price: 2000,
        },
      ],
      returnUrl: "http://localhost:3000/success.html",
      orderCode: orderCode,
    };

    const signature = createSignature(
      {
        amount: body.amount,
        cancelUrl: body.cancelUrl,
        description: body.description,
        returnUrl: body.returnUrl,
        orderCode: body.orderCode,
      },
      process.env.PAYOS_CHECKSUM_KEY
    );

    const payment = await this.clientPayOs.createPaymentLink(body);
    // return {
    //   bin: "970422",
    //   accountNumber: "VQRQACWPU4560",
    //   accountName: "VU VAN QUYET",
    //   amount: 1000,
    //   description: "Thanh toan don hang",
    //   orderCode: 1232322,
    //   currency: "VND",
    //   paymentLinkId: "93c64c38a46e4789add92412d3cab1f7",
    //   status: "PENDING",
    //   checkoutUrl: "https://pay.payos.vn/web/93c64c38a46e4789add92412d3cab1f7",
    //   qrCode:
    //     "00020101021238570010A000000727012700069704220113VQRQACWPU45600208QRIBFTTA5303704540410005802VN62230819Thanh toan don hang630434C3",
    // };
    return {
      id: payment.paymentLinkId,
      data: {
        checkoutUrl: payment.checkoutUrl,
        orderCode,
      },
    };
  }

  async refundPayment(input: RefundPaymentInput): Promise<any> {
    console.log("step =>>> refundPayment");
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<any> {
    console.log("step =>>> retrievePayment");
    return;
  }

  async updatePayment(input: UpdatePaymentInput): Promise<any> {
    console.log("step =>>> updatePayment");
  }
}

export default PayOSPaymentProviderService;

function createSignature(dataObject, checksumKey) {
  const sortedKeys = Object.keys(dataObject).sort();

  const dataString = sortedKeys
    .map((key) => `${key}=${dataObject[key]}`)
    .join("&");

  const crypto = require("crypto");
  const signature = crypto
    .createHmac("sha256", checksumKey)
    .update(dataString)
    .digest("hex");

  return signature;
}
