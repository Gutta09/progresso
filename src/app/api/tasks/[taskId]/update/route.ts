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

  const updated = await Task.updateOne({
    _id: taskId,
    userId: session.userId,
  }, {
    $set: parsed.data,
  });

  if (!updated.matchedCount) {
    redirect(buildRedirectUrl("/board", { error: "Task not found." }));
  }

  redirect("/board");
}
