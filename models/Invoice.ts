import { InferSchemaType, model, models, Schema } from "mongoose";

const invoiceItemSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    type: {
      type: String,
      enum: ["CLIENT_BILLING", "SUPPLIER_INVOICE", "SUBCONTRACTOR_CLAIM"],
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 15 }, // VAT 15% in Ethiopia
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "ETB" },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
      default: "ISSUED",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ projectId: 1, status: 1 });

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;
export const Invoice = models.Invoice || model("Invoice", invoiceSchema);

