import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const savedFilterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    criteria: {
      status: {
        type: [String],
        default: [],
      },
      priority: {
        type: [String],
        default: [],
      },
      assigneeId: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: [],
      },
      section: {
        type: [String],
        default: [],
      },
      dueDateRange: {
        start: Date,
        end: Date,
      },
      search: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

savedFilterSchema.index({ userId: 1, createdAt: -1 });

export type SavedFilterDocument = Omit<InferSchemaType<typeof savedFilterSchema>, "userId"> & {
  _id: string;
  userId: Types.ObjectId;
};

export const SavedFilter = models.SavedFilter || model("SavedFilter", savedFilterSchema);
