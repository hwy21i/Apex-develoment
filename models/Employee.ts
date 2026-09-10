import { InferSchemaType, model, models, Schema } from "mongoose";

const employeeSchema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true }, // linked system user if any
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    department: {
      type: String,
      required: true,
      enum: [
        "Project Management",
        "Civil Engineering",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Procurement & Logistics",
        "Health & Safety",
        "Finance & Accounts",
        "Human Resources",
        "Site Operations",
      ],
      default: "Site Operations",
      index: true,
    },
    position: { type: String, required: true, trim: true },
    employeeType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACTOR", "DAY_LABORER"],
      default: "FULL_TIME",
    },
    dailyRate: { type: Number, min: 0 },
    monthlySalary: { type: Number, min: 0 },
    hireDate: { type: Date, required: true },
    assignedProjectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    regionId: { type: Schema.Types.ObjectId, ref: "Region" },
    cityId: { type: Schema.Types.ObjectId, ref: "City" },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "TERMINATED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

employeeSchema.index({ department: 1, status: 1 });

export type EmployeeDocument = InferSchemaType<typeof employeeSchema>;
export const Employee = models.Employee || model("Employee", employeeSchema);

