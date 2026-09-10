import { InferSchemaType, model, models, Schema } from "mongoose";

const documentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    documentNumber: { type: String, trim: true, uppercase: true },
    category: {
      type: String,
      enum: [
        "Architectural Drawings",
        "Structural Blueprints",
        "Contract Agreement",
        "Change Order",
        "Site Inspection Report",
        "Material Test Certificate",
        "Permit & License",
        "Invoice & Payment Receipt",
        "Safety Audit",
        "Other",
      ],
      default: "Other",
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true }, // e.g., 'pdf', 'dwg', 'png', 'xlsx'
    fileSizeBytes: { type: Number, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    version: { type: String, default: "v1.0" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

documentSchema.index({ projectId: 1, category: 1 });

export type DocumentRecord = InferSchemaType<typeof documentSchema>;
export const DocumentModel =
  models.DocumentModel || model("DocumentModel", documentSchema);

