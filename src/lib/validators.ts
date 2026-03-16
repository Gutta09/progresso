import { z } from "zod";

export const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

export type TaskStatusValue = (typeof taskStatuses)[number];
export type TaskPriorityValue = (typeof taskPriorities)[number];

export const taskStatusLabels: Record<TaskStatusValue, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export const taskPriorityLabels: Record<TaskPriorityValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(24, "Username must be 24 characters or fewer.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores.");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

export const authSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(500, "Description must be 500 characters or fewer."),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  section: z
    .string()
    .trim()
    .max(50, "Section name must be 50 characters or fewer.")
    .optional()
    .default("General"),
  assigneeId: z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return undefined;
      }
      const raw = String(value).trim();
      return raw.length ? raw : undefined;
    },
    z.string().regex(/^[0-9a-f]{24}$/i, "Invalid assignee.").optional(),
  ),
  dueDate: z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return undefined;
      }

      const raw = String(value).trim();
      return raw.length ? raw : undefined;
    },
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format.")
      .optional(),
  ),
});

export function getFirstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please review the submitted data.";
}
