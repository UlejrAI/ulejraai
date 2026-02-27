import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";
import type { User } from "@/lib/types/auth";
import { generateUUID } from "@/lib/utils";
import type { InvoiceData } from "./types";

type CreateInvoiceProps = {
  user: User;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const createInvoice = ({ user, dataStream }: CreateInvoiceProps) =>
  tool({
    description: `Create a professional invoice for services or products.
    Use this when the user wants to generate an invoice, bill, or payment request.

    WORKFLOW:
    1. If crypto payment is involved, FIRST fetch the current price using the appropriate MCP tool (coinmarketcap for crypto, alphavantage for stocks).
    2. Then call this tool with the price data to generate the invoice.
    3. The invoice will be rendered as an interactive artifact.

    The tool supports both fiat-only and crypto+fiat invoices.
    For crypto invoices, include the exchangeRate and cryptoAsset fields.`,
    inputSchema: z.object({
      clientName: z
        .string()
        .describe("Name of the client or recipient of the invoice"),
      clientEmail: z
        .string()
        .optional()
        .describe("Client's email address (optional)"),
      clientWalletAddress: z
        .string()
        .optional()
        .describe("Client's wallet address for crypto payment (optional)"),
      items: z
        .array(
          z.object({
            description: z.string().describe("Description of the service or product"),
            quantity: z.number().positive().describe("Quantity"),
            unitPrice: z.number().positive().describe("Price per unit in the base currency"),
            currency: z
              .string()
              .default("USD")
              .describe("Currency code (USD, EUR, etc.)"),
          })
        )
        .describe("Line items for the invoice"),
      currency: z
        .string()
        .default("USD")
        .describe("Base display currency for the invoice"),
      taxPercent: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Tax percentage to apply (e.g., 10 for 10%)"),
      cryptoAsset: z
        .string()
        .optional()
        .describe(
          "Cryptocurrency for payment (e.g., 'ETH', 'BTC'). If set, the invoice will include crypto payment info."
        ),
      cryptoAmount: z
        .number()
        .positive()
        .optional()
        .describe(
          "Amount of crypto for the payment. If the user specified the invoice in crypto terms, provide this."
        ),
      exchangeRate: z
        .number()
        .positive()
        .optional()
        .describe(
          "Current exchange rate of the crypto asset in the base currency. MUST be fetched from MCP tools before calling this tool."
        ),
      paymentWalletAddress: z
        .string()
        .optional()
        .describe(
          "Wallet address to receive crypto payments. Use a placeholder if not provided by user."
        ),
      dueInDays: z
        .number()
        .int()
        .positive()
        .default(30)
        .describe("Number of days until the invoice is due (default: 30)"),
      notes: z
        .string()
        .optional()
        .describe("Additional notes or terms for the invoice"),
    }),
    execute: async ({
      clientName,
      clientEmail,
      clientWalletAddress,
      items,
      currency,
      taxPercent,
      cryptoAsset,
      cryptoAmount,
      exchangeRate,
      paymentWalletAddress,
      dueInDays,
      notes,
    }) => {
      const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}-${generateUUID().slice(0, 4).toUpperCase()}`;
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + (dueInDays || 30));

      // Build line items
      const invoiceItems = items.map((item) => {
        const lineTotal = item.quantity * item.unitPrice;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          currency: item.currency || currency,
          fiatEquivalent: lineTotal,
        };
      });

      const subtotal = invoiceItems.reduce(
        (sum, item) => sum + (item.fiatEquivalent ?? 0),
        0
      );
      const tax = taxPercent ? subtotal * (taxPercent / 100) : undefined;
      const total = subtotal + (tax ?? 0);

      // Build crypto payment info
      let cryptoPayment: InvoiceData["cryptoPayment"] = undefined;
      if (cryptoAsset && (cryptoAmount || exchangeRate)) {
        const resolvedCryptoAmount =
          cryptoAmount ?? (exchangeRate ? total / exchangeRate : 0);
        const resolvedExchangeRate =
          exchangeRate ?? (cryptoAmount ? total / cryptoAmount : 0);

        cryptoPayment = {
          asset: cryptoAsset.toUpperCase(),
          amount: Number.parseFloat(resolvedCryptoAmount.toFixed(8)),
          walletAddress:
            paymentWalletAddress || "0x0000000000000000000000000000000000000000",
          exchangeRate: resolvedExchangeRate,
          rateTimestamp: now.toISOString(),
        };
      }

      const invoiceData: InvoiceData = {
        invoiceId,
        createdAt: now.toISOString(),
        dueDate: dueDate.toISOString(),
        from: {
          name: "Your Business",
          walletAddress: paymentWalletAddress,
        },
        to: {
          name: clientName,
          email: clientEmail,
          walletAddress: clientWalletAddress,
        },
        items: invoiceItems,
        subtotal: Number.parseFloat(subtotal.toFixed(2)),
        tax: tax ? Number.parseFloat(tax.toFixed(2)) : undefined,
        total: Number.parseFloat(total.toFixed(2)),
        currency: currency || "USD",
        cryptoPayment,
        notes,
        status: "draft",
      };

      // Write to data stream as an artifact
      const documentId = generateUUID();

      dataStream.write({
        type: "data-kind",
        data: "invoice",
        transient: true,
      });

      dataStream.write({
        type: "data-id",
        data: documentId,
        transient: true,
      });

      dataStream.write({
        type: "data-title",
        data: `Invoice ${invoiceId}`,
        transient: true,
      });

      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      // Stream the invoice data as content
      const invoiceJson = JSON.stringify(invoiceData, null, 2);
      dataStream.write({
        type: "data-invoiceDelta",
        data: invoiceJson,
        transient: true,
      });

      dataStream.write({
        type: "data-finish",
        data: null,
        transient: true,
      });

      // Save the document
      const { saveDocument } = await import("@/lib/db/queries");
      await saveDocument({
        id: documentId,
        title: `Invoice ${invoiceId}`,
        content: invoiceJson,
        kind: "invoice",
        userId: user.id,
      });

      return {
        invoiceId,
        documentId,
        total,
        currency,
        cryptoPayment: cryptoPayment
          ? {
              asset: cryptoPayment.asset,
              amount: cryptoPayment.amount,
              walletAddress: cryptoPayment.walletAddress,
            }
          : undefined,
        message: `Invoice ${invoiceId} created successfully. Total: ${currency} ${total.toFixed(2)}${cryptoPayment ? ` (${cryptoPayment.amount} ${cryptoPayment.asset})` : ""}. The invoice is now visible in the artifact panel.`,
      };
    },
  });
