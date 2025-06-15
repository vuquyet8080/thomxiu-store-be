import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import PayOS from "@payos/node";
import { createSignature } from "../../../../helper/sig";

export type CartItem = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string | null;
  quantity: number;
  variant_id: string;
  product_id: string;
  product_title: string;
  product_description: string | null;
  product_subtitle: string | null;
  product_type: string | null;
  product_type_id: string | null;
  product_collection: string | null;
  product_handle: string;
  variant_sku: string;
  variant_barcode: string | null;
  variant_title: string;
  variant_option_values: any;
  requires_shipping: boolean;
  is_discountable: boolean;
  is_giftcard: boolean;
  is_tax_inclusive: boolean;
  is_custom_price: boolean;
  metadata: Record<string, any>;
  cart_id: string;
  raw_compare_at_unit_price: any;
  raw_unit_price: any;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  adjustments: any[];
  tax_lines: any[];
  compare_at_unit_price: number | null;
  unit_price: number;
  subtotal: number;
  total: number;
  original_total: number;
  discount_total: number;
  discount_subtotal: number;
  discount_tax_total: number;
  tax_total: number;
  original_tax_total: number;
  raw_subtotal: any;
  raw_total: any;
  raw_original_total: any;
  raw_discount_total: any;
  raw_discount_subtotal: any;
  raw_discount_tax_total: any;
  raw_tax_total: any;
  raw_original_tax_total: any;
  product: any;
  variant: any;
};

export type Address = {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  postal_code: string;
  country_code: string;
  province: string;
  phone: string;
};

export type Customer = {
  id: string;
  email: string;
  groups: any[];
};

export type Region = {
  id: string;
  name: string;
  currency_code: string;
  automatic_taxes: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  countries: any[];
};

export type CartDataBody = {
  id: string;
  currency_code: string;
  email: string;
  region_id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  total: number;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  discount_subtotal: number;
  discount_tax_total: number;
  original_total: number;
  original_tax_total: number;
  item_total: number;
  item_subtotal: number;
  item_tax_total: number;
  original_item_total: number;
  original_item_subtotal: number;
  original_item_tax_total: number;
  shipping_total: number;
  shipping_subtotal: number;
  shipping_tax_total: number;
  original_shipping_tax_total: number;
  original_shipping_subtotal: number;
  original_shipping_total: number;
  credit_line_subtotal: number;
  credit_line_tax_total: number;
  credit_line_total: number;
  metadata: any;
  sales_channel_id: string;
  shipping_address_id: string;
  billing_address_id: string;
  customer_id: string;
  items: CartItem[];
  shipping_methods: any[];
  shipping_address: Address;
  billing_address: Address;
  credit_lines: any[];
  customer: Customer;
  region: Region;
  promotions: any[];
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // res.sendStatus(200);

  const clientPayOs = new PayOS(
    process.env.PAYOS_CLIENT_ID as string,
    process.env.PAYOS_API_KEY as string,
    process.env.PAYOS_CHECKSUM_KEY as string
  );

  const dataBody: CartDataBody = req.body as CartDataBody;

  try {
    const orderCode = Date.now();
    const body = {
      amount: dataBody.total,
      cancelUrl: `${process.env.BACKEND_URL}/payment/cancel`,
      description: `Payment for order test`,
      items: dataBody.items.map((item) => ({
        name: item.title,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      returnUrl: `${process.env.BACKEND_URL}/payment/success`,
      orderCode,
      buyerName:
        dataBody.shipping_address.first_name +
        " " +
        dataBody.shipping_address.last_name,
      buyerEmail: dataBody.customer.email,
      buyerPhone: dataBody.shipping_address.phone,
      buyerAddress: dataBody.shipping_address.address_1,
    };

    const signature = createSignature(
      {
        amount: body.amount,
        cancelUrl: body.cancelUrl,
        description: body.description,
        returnUrl: body.returnUrl,
        orderCode: body.orderCode,
      },
      process.env.PAYOS_CHECKSUM_KEY as string
    );

    const payment = await clientPayOs.createPaymentLink({
      ...body,
      signature,
    });

    res.json({
      success: true,
      ...payment,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Create payment session
