export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  cryptoAmount?: number;
  fiatEquivalent?: number;
}

export interface InvoiceParty {
  name: string;
  email?: string;
  walletAddress?: string;
}

export interface CryptoPayment {
  asset: string;
  amount: number;
  walletAddress: string;
  exchangeRate: number;
  rateTimestamp: string;
}

export interface InvoiceData {
  invoiceId: string;
  createdAt: string;
  dueDate: string;
  from: InvoiceParty;
  to: InvoiceParty;
  items: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  cryptoPayment?: CryptoPayment;
  notes?: string;
  status: "draft" | "sent" | "paid";
}
