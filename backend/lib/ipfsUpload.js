/**
 * Upload encrypted file bytes to Pinata (IPFS).
 */
export async function uploadToIPFS(encryptedBuffer, filename) {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error("Pinata credentials not configured");
  }

  const uint8 =
    encryptedBuffer instanceof Uint8Array
      ? encryptedBuffer
      : new Uint8Array(encryptedBuffer);
  const blob = new Blob([uint8], { type: "application/octet-stream" });

  const formData = new FormData();
  formData.append("file", blob, filename || "document.enc");

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Pinata upload failed");
  }

  const data = await res.json();
  return data.IpfsHash;
}
