import { InferSchemaType, model, models, Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"],
      default: "PRESENT",
    },
    checkInTime: { type: String }, // e.g. "07:30"
    checkOutTime: { type: String }, // e.g. "17:00"
    hoursWorked: { type: Number, min: 0, max: 24, default: 8 },
    overtimeHours: { type: Number, min: 0, default: 0 },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ projectId: 1, date: 1 });

export type AttendanceDocument = InferSchemaType<typeof attendanceSchema>;
export const Attendance = models.Attendance || model("Attendance", attendanceSchema);

