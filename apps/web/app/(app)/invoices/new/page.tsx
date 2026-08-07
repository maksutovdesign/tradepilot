import { InvoiceUploadClient } from "./invoice-upload-client";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-navy">Create Trade</h1>
      <InvoiceUploadClient />
    </div>
  );
}
