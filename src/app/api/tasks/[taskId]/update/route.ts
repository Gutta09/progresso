import { requireSession } from "@/lib/auth";
import { buildRedirectUrl } from "@/lib/http";
import { connectToDatabase } from "@/lib/mongodb";
import { getFirstError, taskSchema } from "@/lib/validators";
import { Task } from "@/models/Task";
import mongoose from "mongoose";
import { redirect } from "next/navigation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await requireSession();
  const { taskId } = await params;

  if (!mongoose.isValidObjectId(taskId)) {
    redirect(buildRedirectUrl("/board", { error: "Invalid task identifier." }));
  }

  const formData = await request.formData();
  const submitted = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "TODO"),
    priority: String(formData.get("priority") ?? "MEDIUM"),
    section: String(formData.get("section") ?? "General"),
    assigneeId: String(formData.get("assigneeId") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
  };

  const parsed = taskSchema.safeParse(submitted);

  if (!parsed.success) {
    redirect(
      buildRedirectUrl("/board", {
        error: getFirstError(parsed.error),
      }),
    );
  }

  await connectToDatabase();

  let userObjectId: mongoose.Types.ObjectId;
  if (typeof session.userId === "string" && session.userId.match(/^[0-9a-f]{24}$/i)) {
    userObjectId = new mongoose.Types.ObjectId(session.userId);
  } else {
    redirect(buildRedirectUrl("/board", { error: "Invalid session." }));
  }

  const updated = await Task.updateOne({
    _id: taskId,
    userId: userObjectId,
  }, {
    $set: {
      ...parsed.data,
      assigneeId: parsed.data.assigneeId ? new mongoose.Types.ObjectId(parsed.data.assigneeId) : null,
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00.000Z`) : null,
    },
  });

  if (!updated.matchedCount) {
    redirect(buildRedirectUrl("/board", { error: "Task not found." }));
  }

  redirect("/board");
}
