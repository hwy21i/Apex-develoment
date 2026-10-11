import { InferSchemaType, model, models, Schema } from "mongoose";

const changeOrderSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    costImpact: { type: Number, default: 0 }, // in ETB
    scheduleImpactDays: { type: Number, default: 0 },
    reason: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    clientApproval: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

changeOrderSchema.index({ projectId: 1, status: 1 });

export type ChangeOrderDocument = InferSchemaType<typeof changeOrderSchema>;
export const ChangeOrder =
  models.ChangeOrder || model("ChangeOrder", changeOrderSchema);

