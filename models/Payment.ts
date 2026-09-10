import { InferSchemaType, model, models, Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB" },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["BANK_TRANSFER", "CHECK", "CASH", "LETTER_OF_CREDIT"],
      default: "BANK_TRANSFER",
    },
    transactionReference: { type: String, trim: true }, // Bank reference / Slip ID
    payerName: { type: String, trim: true },
    payeeName: { type: String, trim: true },
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ invoiceId: 1, paymentDate: -1 });

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export const Payment = models.Payment || model("Payment", paymentSchema);

