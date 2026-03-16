import { requireSession } from "@/lib/auth";
import { buildRedirectUrl } from "@/lib/http";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import mongoose from "mongoose";
import { redirect } from "next/navigation";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await requireSession();
  const { taskId } = await params;

  if (!mongoose.isValidObjectId(taskId)) {
    redirect(buildRedirectUrl("/board", { error: "Invalid task identifier." }));
  }

  await connectToDatabase();

  const deleted = await Task.deleteOne({
    _id: taskId,
    userId: session.userId,
  });

  if (!deleted.deletedCount) {
    redirect(buildRedirectUrl("/board", { error: "Task not found." }));
  }

  redirect("/board");
}
