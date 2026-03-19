import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
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
  },
  {
    timestamps: true,
  },
);

export type CommentDocument = Omit<InferSchemaType<typeof commentSchema>, "userId" | "taskId"> & {
  _id: string;
  userId: Types.ObjectId;
  taskId: Types.ObjectId;
};

export const Comment = models.Comment || model("Comment", commentSchema);
