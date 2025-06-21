import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.sendStatus(200);
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.sendStatus(202);
}
