export type InvoiceStatus =
  | "UPLOADED"
  | "ANALYZING"
  | "ANALYZED"
  | "APPROVED"
  | "TRADE_CREATED"
  | "SETTLED";

export interface Invoice {
  id: string;
  companyId: string;
  supplierName: string;
  supplierWallet?: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate?: string;
  paymentTerms: string;
  documentUrl?: string;
  aiRiskScore?: "LOW" | "MEDIUM" | "HIGH";
  aiRecommendation?: string;
  status: InvoiceStatus;
  createdAt: string;
}
