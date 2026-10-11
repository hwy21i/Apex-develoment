import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrganization {
  name: string;
  code: string;
  taxIdentificationNumber?: string;
  licenseNumber?: string;
  defaultCurrency: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  vatRatePct: number;
  withholdingTaxPct: number;
  retentionRatePct: number;
  fiscalYearStart?: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizationDocument extends IOrganization, Document {}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: 160,
    },
    code: {
      type: String,
      required: [true, "Organization code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
      index: true,
    },
    taxIdentificationNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    licenseNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    defaultCurrency: {
      type: String,
      default: "ETB",
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    country: {
      type: String,
      trim: true,
      default: "Ethiopia",
      maxlength: 80,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    vatRatePct: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    withholdingTaxPct: {
      type: Number,
      default: 2,
      min: 0,
      max: 100,
    },
    retentionRatePct: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    fiscalYearStart: {
      type: String,
      default: "July 8 (Hamle 1)",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

export const Organization: Model<IOrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<IOrganizationDocument>("Organization", OrganizationSchema);

