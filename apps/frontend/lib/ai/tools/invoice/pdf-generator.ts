import { jsPDF } from "jspdf";
import type { InvoiceData } from "./types";

export async function generateInvoicePdf(invoice: InvoiceData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const darkColor = "#1a1a2e";
  const mutedColor = "#6b7280";
  const accentColor = "#4f46e5";

  // ---- Header ----
  doc.setFontSize(28);
  doc.setTextColor(darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, y + 8);

  doc.setFontSize(10);
  doc.setTextColor(mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceId, margin, y + 14);

  // Status badge
  const statusColors: Record<string, string> = {
    draft: "#d97706",
    sent: "#2563eb",
    paid: "#059669",
  };
  const statusColor = statusColors[invoice.status] || statusColors.draft;
  const statusText = invoice.status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 8;

  doc.setFillColor(statusColor);
  doc.roundedRect(
    pageWidth - margin - statusWidth,
    y,
    statusWidth,
    7,
    1.5,
    1.5,
    "F"
  );
  doc.setTextColor("#ffffff");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, pageWidth - margin - statusWidth + 4, y + 5);

  y += 22;

  // ---- Divider ----
  doc.setDrawColor("#e5e7eb");
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ---- Dates ----
  doc.setFontSize(9);
  doc.setTextColor(mutedColor);
  doc.setFont("helvetica", "normal");

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  doc.text(`Issued: ${formatDate(invoice.createdAt)}`, margin, y);
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, margin + 80, y);
  y += 10;

  // ---- From / To ----
  doc.setDrawColor("#e5e7eb");
  doc.line(margin, y - 3, pageWidth - margin, y - 3);

  const colWidth = contentWidth / 2;

  doc.setFontSize(7);
  doc.setTextColor(accentColor);
  doc.setFont("helvetica", "bold");
  doc.text("FROM", margin, y + 2);
  doc.text("BILL TO", margin + colWidth, y + 2);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(darkColor);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.from.name, margin, y);
  doc.text(invoice.to.name, margin + colWidth, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedColor);

  if (invoice.from.email) {
    doc.text(invoice.from.email, margin, y);
  }
  if (invoice.to.email) {
    doc.text(invoice.to.email, margin + colWidth, y);
  }
  y += 5;

  if (invoice.from.walletAddress) {
    const fromAddr = `${invoice.from.walletAddress.slice(0, 10)}...${invoice.from.walletAddress.slice(-6)}`;
    doc.text(fromAddr, margin, y);
  }
  if (invoice.to.walletAddress) {
    const toAddr = `${invoice.to.walletAddress.slice(0, 10)}...${invoice.to.walletAddress.slice(-6)}`;
    doc.text(toAddr, margin + colWidth, y);
  }
  y += 10;

  // ---- Line Items Table ----
  doc.setDrawColor("#e5e7eb");
  doc.line(margin, y - 3, pageWidth - margin, y - 3);
  y += 2;

  // Table header
  doc.setFillColor("#f9fafb");
  doc.rect(margin, y - 3, contentWidth, 8, "F");

  doc.setFontSize(7);
  doc.setTextColor(mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", margin + 2, y + 2);
  doc.text("QTY", margin + contentWidth * 0.55, y + 2, { align: "right" });
  doc.text("PRICE", margin + contentWidth * 0.73, y + 2, { align: "right" });
  doc.text("AMOUNT", margin + contentWidth - 2, y + 2, { align: "right" });
  y += 8;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const item of invoice.items) {
    const lineTotal = item.fiatEquivalent ?? item.quantity * item.unitPrice;

    doc.setTextColor(darkColor);
    doc.text(item.description, margin + 2, y + 2);

    doc.setTextColor(mutedColor);
    doc.text(String(item.quantity), margin + contentWidth * 0.55, y + 2, {
      align: "right",
    });
    doc.text(
      `${item.currency} ${item.unitPrice.toFixed(2)}`,
      margin + contentWidth * 0.73,
      y + 2,
      { align: "right" }
    );

    doc.setTextColor(darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${item.currency} ${lineTotal.toFixed(2)}`,
      margin + contentWidth - 2,
      y + 2,
      { align: "right" }
    );
    doc.setFont("helvetica", "normal");

    y += 7;
    doc.setDrawColor("#f3f4f6");
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  }

  y += 5;

  // ---- Totals ----
  const totalsX = margin + contentWidth * 0.6;
  const totalsValueX = margin + contentWidth - 2;

  doc.setFontSize(9);
  doc.setTextColor(mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(darkColor);
  doc.text(
    `${invoice.currency} ${invoice.subtotal.toFixed(2)}`,
    totalsValueX,
    y,
    { align: "right" }
  );
  y += 6;

  if (invoice.tax !== undefined && invoice.tax > 0) {
    doc.setTextColor(mutedColor);
    doc.text("Tax", totalsX, y);
    doc.setTextColor(darkColor);
    doc.text(`${invoice.currency} ${invoice.tax.toFixed(2)}`, totalsValueX, y, {
      align: "right",
    });
    y += 6;
  }

  // Total line
  doc.setDrawColor(accentColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y - 1, totalsValueX, y - 1);
  y += 3;

  doc.setFontSize(12);
  doc.setTextColor(darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total", totalsX, y);
  doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, totalsValueX, y, {
    align: "right",
  });
  y += 12;

  // ---- Crypto Payment Section ----
  if (invoice.cryptoPayment) {
    doc.setDrawColor("#e5e7eb");
    doc.line(margin, y - 4, pageWidth - margin, y - 4);

    doc.setFillColor("#f8fafc");
    const cryptoBoxHeight = 45;
    doc.roundedRect(margin, y, contentWidth, cryptoBoxHeight, 2, 2, "F");
    doc.setDrawColor("#e2e8f0");
    doc.roundedRect(margin, y, contentWidth, cryptoBoxHeight, 2, 2, "S");

    doc.setFontSize(9);
    doc.setTextColor(accentColor);
    doc.setFont("helvetica", "bold");
    doc.text("CRYPTO PAYMENT", margin + 5, y + 7);

    const cryptoInfoX = margin + 5;
    let cryptoY = y + 14;

    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.setFont("helvetica", "normal");
    doc.text("Amount:", cryptoInfoX, cryptoY);
    doc.setTextColor(darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${invoice.cryptoPayment.amount} ${invoice.cryptoPayment.asset}`,
      cryptoInfoX + 20,
      cryptoY
    );
    cryptoY += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor);
    doc.text("Rate:", cryptoInfoX, cryptoY);
    doc.setTextColor(darkColor);
    doc.text(
      `1 ${invoice.cryptoPayment.asset} = ${invoice.currency} ${invoice.cryptoPayment.exchangeRate.toFixed(2)}`,
      cryptoInfoX + 20,
      cryptoY
    );
    cryptoY += 6;

    doc.setTextColor(mutedColor);
    doc.text("Wallet:", cryptoInfoX, cryptoY);
    doc.setTextColor(darkColor);
    doc.setFontSize(7);
    doc.text(invoice.cryptoPayment.walletAddress, cryptoInfoX + 20, cryptoY);
    cryptoY += 6;

    doc.setFontSize(7);
    doc.setTextColor(mutedColor);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Rate as of ${formatDate(invoice.cryptoPayment.rateTimestamp)}. Actual amount may vary.`,
      cryptoInfoX,
      cryptoY
    );

    y += cryptoBoxHeight + 8;
  }

  // ---- Notes ----
  if (invoice.notes) {
    doc.setFontSize(7);
    doc.setTextColor(accentColor);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(lines, margin, y);
  }

  // ---- Save ----
  doc.save(`${invoice.invoiceId}.pdf`);
}
