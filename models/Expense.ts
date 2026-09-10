import { InferSchemaType, model, models, Schema } from "mongoose";

const expenseSchema = new Schema(
  {
    expenseNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    budgetId: { type: Schema.Types.ObjectId, ref: "Budget", index: true },
    category: {
      type: String,
      required: true,
      enum: ["Materials", "Labor", "Subcontractor", "Equipment", "Overhead & Permits", "Contingency"],
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB" },
    date: { type: Date, required: true, default: Date.now },
    payee: { type: String, required: true, trim: true },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CHECK", "CREDIT_LINE"],
      default: "BANK_TRANSFER",
    },
    receiptNumber: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PAID"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ projectId: 1, date: -1 });

export type ExpenseDocument = InferSchemaType<typeof expenseSchema>;
export const Expense = models.Expense || model("Expense", expenseSchema);

