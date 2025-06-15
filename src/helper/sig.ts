export function createSignature(dataObject: any, checksumKey: string): string {
  const sortedKeys = Object.keys(dataObject).sort();
  const dataString = sortedKeys
    .map((key) => `${key}=${dataObject[key]}`)
    .join("&");

  const crypto = require("crypto");
  return crypto
    .createHmac("sha256", checksumKey)
    .update(dataString)
    .digest("hex");
}
