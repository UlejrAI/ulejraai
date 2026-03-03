"use client";

import {
  CalendarIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  MailIcon,
  QrCodeIcon,
  SendIcon,
  WalletIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import { DocumentSkeleton } from "@/components/document-skeleton";
import { CopyIcon as CopyActionIcon } from "@/components/icons";
import type { InvoiceData } from "@/lib/ai/tools/invoice/types";

type InvoiceMetadata = {
  invoiceData: InvoiceData | null;
};

function StatusBadge({ status }: { status: InvoiceData["status"] }) {
  const config = {
    draft: {
      label: "Draft",
      className:
        "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    },
    sent: {
      label: "Sent",
      className:
        "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    paid: {
      label: "Paid",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
  };

  const { label, className } = config[status] || config.draft;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      <CheckCircle2Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function InvoiceContent({
  content,
  isLoading,
  status,
}: {
  content: string;
  isLoading: boolean;
  status: "streaming" | "idle";
  title: string;
  mode: "edit" | "diff";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: any[];
  onSaveContent: (content: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  metadata: InvoiceMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<InvoiceMetadata>>;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const invoiceData = useMemo<InvoiceData | null>(() => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }, [content]);

  // Generate QR code for crypto payment
  useEffect(() => {
    if (!invoiceData?.cryptoPayment?.walletAddress) return;

    const generateQR = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(
          invoiceData.cryptoPayment!.walletAddress,
          {
            width: 160,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          }
        );
        setQrDataUrl(url);
      } catch (err) {
        console.error("QR generation failed:", err);
      }
    };
    generateQR();
  }, [invoiceData?.cryptoPayment?.walletAddress]);

  if (isLoading || (status === "streaming" && !content)) {
    return <DocumentSkeleton artifactKind="text" />;
  }

  if (!invoiceData || !invoiceData.invoiceId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        <FileTextIcon className="mr-2 h-5 w-5" />
        Generating invoice...
      </div>
    );
  }

  const formatCurrency = (amount: number, curr: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: curr,
      }).format(amount);
    } catch {
      return `${curr} ${amount.toFixed(2)}`;
    }
  };

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-0 p-6 md:p-10">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            INVOICE
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {invoiceData.invoiceId}
          </p>
        </div>
        <StatusBadge status={invoiceData.status} />
      </div>

      {/* Dates */}
      <div className="flex gap-8 border-b border-border py-5">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Issued:</span>
          <span className="font-medium">
            {formatDate(invoiceData.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Due:</span>
          <span className="font-medium">{formatDate(invoiceData.dueDate)}</span>
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-2 gap-8 border-b border-border py-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            From
          </p>
          <p className="font-medium text-foreground">{invoiceData.from.name}</p>
          {invoiceData.from.email && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MailIcon className="h-3 w-3" />
              {invoiceData.from.email}
            </p>
          )}
          {invoiceData.from.walletAddress && (
            <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <WalletIcon className="h-3 w-3" />
              {invoiceData.from.walletAddress.slice(0, 8)}...
              {invoiceData.from.walletAddress.slice(-6)}
            </p>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bill To
          </p>
          <p className="font-medium text-foreground">{invoiceData.to.name}</p>
          {invoiceData.to.email && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MailIcon className="h-3 w-3" />
              {invoiceData.to.email}
            </p>
          )}
          {invoiceData.to.walletAddress && (
            <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <WalletIcon className="h-3 w-3" />
              {invoiceData.to.walletAddress.slice(0, 8)}...
              {invoiceData.to.walletAddress.slice(-6)}
            </p>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 text-left">Description</th>
              <th className="pb-3 text-right">Qty</th>
              <th className="pb-3 text-right">Price</th>
              <th className="pb-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, i) => (
              <tr
                className="border-b border-border/50"
                key={`item-${item.description}-${i}`}
              >
                <td className="py-3 text-sm text-foreground">
                  {item.description}
                </td>
                <td className="py-3 text-right text-sm text-muted-foreground">
                  {item.quantity}
                </td>
                <td className="py-3 text-right text-sm text-muted-foreground">
                  {formatCurrency(item.unitPrice, item.currency)}
                </td>
                <td className="py-3 text-right text-sm font-medium text-foreground">
                  {formatCurrency(
                    item.fiatEquivalent ?? item.quantity * item.unitPrice,
                    item.currency
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex flex-col items-end gap-1 border-b border-border pb-5">
        <div className="flex w-48 justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            {formatCurrency(invoiceData.subtotal, invoiceData.currency)}
          </span>
        </div>
        {invoiceData.tax !== undefined && invoiceData.tax > 0 && (
          <div className="flex w-48 justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">
              {formatCurrency(invoiceData.tax, invoiceData.currency)}
            </span>
          </div>
        )}
        <div className="mt-1 flex w-48 justify-between border-t border-border pt-2 text-base">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-foreground">
            {formatCurrency(invoiceData.total, invoiceData.currency)}
          </span>
        </div>
      </div>

      {/* Crypto Payment Section */}
      {invoiceData.cryptoPayment && (
        <div className="rounded-lg border border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Crypto Payment
            </h3>
          </div>

          <div className="flex items-start gap-6">
            {/* QR Code */}
            {qrDataUrl && (
              <div className="shrink-0 overflow-hidden rounded-lg border border-border bg-white p-1.5">
                <img
                  alt="Payment QR Code"
                  className="h-32 w-32"
                  src={qrDataUrl}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Amount: </span>
                <span className="font-bold text-foreground">
                  {invoiceData.cryptoPayment.amount}{" "}
                  {invoiceData.cryptoPayment.asset}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Rate: </span>
                <span className="font-medium">
                  1 {invoiceData.cryptoPayment.asset} ={" "}
                  {formatCurrency(
                    invoiceData.cryptoPayment.exchangeRate,
                    invoiceData.currency
                  )}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs text-muted-foreground">
                  Wallet Address:
                </span>
                <p className="mt-0.5 break-all rounded bg-muted px-2 py-1 font-mono text-xs">
                  {invoiceData.cryptoPayment.walletAddress}
                </p>
              </div>
              <p className="mt-1 text-xs italic text-muted-foreground">
                Rate as of {formatDate(invoiceData.cryptoPayment.rateTimestamp)}
                . Actual amount may vary.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoiceData.notes && (
        <div className="pt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </p>
          <p className="text-sm text-muted-foreground">{invoiceData.notes}</p>
        </div>
      )}
    </div>
  );
}

export const invoiceArtifact = new Artifact<"invoice", InvoiceMetadata>({
  kind: "invoice",
  description: "Professional invoices with crypto payment support.",
  initialize: async ({ setMetadata }) => {
    setMetadata({ invoiceData: null });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-invoiceDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data as string,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: InvoiceContent,
  actions: [
    {
      icon: <DownloadIcon size={18} />,
      description: "Download PDF",
      onClick: async ({ content }) => {
        try {
          const invoiceData: InvoiceData = JSON.parse(content);
          const { generateInvoicePdf } = await import(
            "@/lib/ai/tools/invoice/pdf-generator"
          );
          await generateInvoicePdf(invoiceData);
          toast.success("PDF downloaded!");
        } catch (err) {
          console.error("PDF generation failed:", err);
          toast.error("Failed to generate PDF");
        }
      },
    },
    {
      icon: <CopyActionIcon size={18} />,
      description: "Copy invoice data",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Invoice data copied!");
      },
    },
  ],
  toolbar: [
    {
      icon: <SendIcon />,
      description: "Mark as sent",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Mark this invoice as sent.",
            },
          ],
        });
      },
    },
  ],
});
