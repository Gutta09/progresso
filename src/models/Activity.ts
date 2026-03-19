import { Schema, model, models, type Types } from "mongoose";

const activitySchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "priority_changed", "due_date_changed", "assigned", "commented"],
      required: true,
    },
    fieldName: {
      type: String,
      required: false,
    },
    oldValue: {
      type: String,
      required: false,
    },
    newValue: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ taskId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });

export const Activity = models.Activity || model("Activity", activitySchema);
