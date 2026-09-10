import { InferSchemaType, model, models, Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "MATERIAL_REQUEST",
        "PO_APPROVAL",
        "LOW_STOCK",
        "INVOICE_OVERDUE",
        "TASK_ASSIGNED",
        "PROJECT_DELAY",
        "SAFETY_ALERT",
        "SYSTEM",
      ],
      default: "SYSTEM",
      index: true,
    },
    link: { type: String }, // e.g. "/procurement/requests/REQ-001"
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification =
  models.Notification || model("Notification", notificationSchema);

