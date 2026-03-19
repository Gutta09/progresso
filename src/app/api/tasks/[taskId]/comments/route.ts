import { requireSession } from "@/lib/auth";
import { buildRedirectUrl } from "@/lib/http";
import { connectToDatabase } from "@/lib/mongodb";
import { redirect } from "next/navigation";
import { Comment } from "@/models/Comment";
import { Task } from "@/models/Task";
import mongoose from "mongoose";

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
  const content = String(formData.get("content") ?? "").trim();

  if (!content || content.length === 0) {
    redirect(buildRedirectUrl("/board", { error: "Comment cannot be empty." }));
  }

  if (content.length > 1000) {
    redirect(buildRedirectUrl("/board", { error: "Comment is too long." }));
  }

  await connectToDatabase();

  // Verify task exists and user has access
  const task = await Task.findById(taskId).lean();
  if (!task || String(task.userId) !== session.userId) {
    redirect(buildRedirectUrl("/board", { error: "Task not found." }));
  }

  await Comment.create({
    content,
    taskId: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(session.userId),
  });

  redirect("/board");
}
