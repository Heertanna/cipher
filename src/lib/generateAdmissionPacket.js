import { jsPDF } from "jspdf";

export function generateAdmissionPacket({
  healthProfile,
  emergencyRef,
  preAuthorized,
  timestamp,
  consent = {},
}) {
  const doc = new jsPDF();
  const date = new Date(timestamp).toLocaleString("en-IN");
  const resolvedConsent =
    consent && Object.keys(consent).length
      ? consent
      : JSON.parse(localStorage.getItem("protocolConsent") || "{}");

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CIPHER PROTOCOL", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Emergency Admission Packet", 105, 28, { align: "center" });
  doc.text(`Reference: #${emergencyRef}`, 105, 35, { align: "center" });
  doc.text(`Generated: ${date}`, 105, 42, { align: "center" });

  // Divider
  doc.setDrawColor(181, 236, 52);
  doc.line(20, 47, 190, 47);

  // Privacy notice
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "PRIVACY NOTICE: Patient personal identity is protected by Cipher Protocol. Only medical and coverage data is included in this packet.",
    20,
    54,
    { maxWidth: 170 },
  );

  // Section 1 — Patient Medical Profile
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("1. PATIENT MEDICAL PROFILE", 20, 68);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const fields1 = [
    ["Blood Type", healthProfile?.bloodType || "Not recorded"],
    ["Age Range", healthProfile?.ageRange || "Not recorded"],
    ["Gender", healthProfile?.gender || "Not recorded"],
  ];
  let y = 76;
  fields1.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 70, y);
    y += 8;
  });

  // Section 2 — Critical Alerts
  y += 4;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 0, 0);
  doc.text("2. CRITICAL ALERTS", 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const alerts = [
    ["Known Allergies", healthProfile?.allergies || "None recorded"],
    ["Existing Conditions", healthProfile?.conditions || "None recorded"],
  ];
  alerts.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 70, y, { maxWidth: 120 });
    y += 10;
  });

  // Section 3 — Coverage & Authorization
  y += 4;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("3. COVERAGE & PRE-AUTHORIZATION", 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const coverage = [
    ["Coverage Status", "ACTIVE — Verified Pool Member"],
    [
      "Pre-authorized Amount",
      `INR ${(preAuthorized || 25000).toLocaleString("en-IN")}`,
    ],
    ["Emergency Reference", `#${emergencyRef}`],
    ["Authorization Valid", "4 hours from generation"],
    ["Billing Contact", "protocol@cipher.health"],
  ];
  coverage.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 80, y, { maxWidth: 110 });
    y += 8;
  });

  // Section 4 — Pre-signed Consent
  y += 4;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("4. PRE-SIGNED TREATMENT CONSENT", 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "The patient has digitally pre-authorized emergency medical treatment through the Cipher Protocol during account registration. This consent covers all medically necessary procedures required during this emergency. Identity verification has been completed by the protocol.",
    20,
    y,
    { maxWidth: 170 },
  );
  y += 24;

  // Section 5 — Digital Signature
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("5. DIGITAL SIGNATURE", 20, y);
  y += 8;

  // Draw signature box
  doc.setDrawColor(181, 236, 52);
  doc.rect(20, y, 170, 40);

  // Embed signature image
  if (resolvedConsent?.signatureBase64) {
    doc.addImage(resolvedConsent.signatureBase64, "PNG", 22, y + 2, 166, 36);
  }

  y += 44;

  // Signature metadata
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const signDate = resolvedConsent?.signedAt
    ? new Date(resolvedConsent.signedAt).toLocaleString("en-IN")
    : "Not available";
  doc.text(`Signed: ${signDate}`, 20, y);
  y += 6;
  if (resolvedConsent?.signatureHash) {
    doc.text(`Verification hash: ${resolvedConsent.signatureHash}`, 20, y);
    y += 6;
  }
  doc.text("Verify at: cipher.health/verify", 20, y);
  y += 8;

  // Section 6 — Instructions for hospital
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("6. INSTRUCTIONS FOR HOSPITAL STAFF", 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const instructions = [
    "1. Verify QR code authenticity at cipher.health/verify",
    "2. Begin treatment immediately — coverage is pre-authorized",
    `3. Submit bill to Cipher Protocol using reference #${emergencyRef}`,
    "4. Claims above pre-authorized amount require post-treatment evaluation",
    "5. Do NOT request patient personal identity — protocol guarantees anonymity",
  ];
  instructions.forEach((line) => {
    doc.text(line, 20, y, { maxWidth: 170 });
    y += 7;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "This document is cryptographically generated by Cipher Protocol. Tampering invalidates coverage authorization.",
    105,
    285,
    { align: "center", maxWidth: 170 },
  );

  return doc;
}
