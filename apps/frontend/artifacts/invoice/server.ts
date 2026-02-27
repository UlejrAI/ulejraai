import { createDocumentHandler } from "@/lib/artifacts/server";

export const invoiceDocumentHandler = createDocumentHandler<"invoice">({
  kind: "invoice",
  onCreateDocument: async ({ title, dataStream }) => {
    // Invoice content is generated directly by the createInvoice tool,
    // not by streaming LLM output. The tool writes the invoice JSON
    // to the data stream and saves it to the DB.
    // This handler exists to satisfy the artifact system's registration
    // requirement but won't be called directly — the createInvoice tool
    // handles the full lifecycle.
    dataStream.write({
      type: "data-invoiceDelta",
      data: JSON.stringify({ status: "draft", items: [] }),
      transient: true,
    });

    return JSON.stringify({ status: "draft", items: [] });
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // For updates, parse existing invoice and apply the description as notes
    const existingContent = document.content || "{}";

    try {
      const invoiceData = JSON.parse(existingContent);
      invoiceData.notes = description;
      const updated = JSON.stringify(invoiceData, null, 2);

      dataStream.write({
        type: "data-invoiceDelta",
        data: updated,
        transient: true,
      });

      return updated;
    } catch {
      return existingContent;
    }
  },
});
