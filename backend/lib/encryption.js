import CryptoJS from "crypto-js";

export function encrypt(text, secret) {
  const str = text === undefined || text === null ? "" : String(text);
  return CryptoJS.AES.encrypt(str, secret).toString();
}

export function decrypt(ciphertext, secret) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/** Encrypt binary file buffer for storage / IPFS upload (uses ENCRYPTION_SECRET on server). */
export function encryptBuffer(buffer, secret) {
  const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(buffer));
  const encrypted = CryptoJS.AES.encrypt(wordArray, secret);
  return Buffer.from(encrypted.toString(), "utf8");
}
