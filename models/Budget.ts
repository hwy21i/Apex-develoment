import { InferSchemaType, model, models, Schema } from "mongoose";

const budgetSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    costCode: { type: String, required: true, trim: true }, // e.g. "03-300 Cast-in-Place Concrete"
    category: {
      type: String,
      required: true,
      enum: ["Materials", "Labor", "Subcontractor", "Equipment", "Overhead & Permits", "Contingency"],
      index: true,
    },
    allocatedAmount: { type: Number, required: true, min: 0 },
    revisedAmount: { type: Number, min: 0 },
    spentAmount: { type: Number, default: 0, min: 0 },
    committedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "ETB" },
    fiscalYear: { type: String, default: "2026" },
    notes: { type: String, trim: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

budgetSchema.index({ projectId: 1, costCode: 1 }, { unique: true });

export type BudgetDocument = InferSchemaType<typeof budgetSchema>;
export const Budget = models.Budget || model("Budget", budgetSchema);

