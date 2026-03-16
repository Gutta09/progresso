import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";
import { taskStatuses } from "@/lib/validators";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: taskStatuses,
      default: "TODO",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ userId: 1, status: 1 });

export type TaskDocument = Omit<InferSchemaType<typeof taskSchema>, "userId"> & {
  _id: string;
  userId: Types.ObjectId;
};

export const Task = models.Task || model("Task", taskSchema);
