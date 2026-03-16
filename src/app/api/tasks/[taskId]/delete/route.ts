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

  let userObjectId: mongoose.Types.ObjectId;
  if (typeof session.userId === "string" && session.userId.match(/^[0-9a-f]{24}$/i)) {
    userObjectId = new mongoose.Types.ObjectId(session.userId);
  } else {
    redirect(buildRedirectUrl("/board", { error: "Invalid session." }));
  }

  const deleted = await Task.deleteOne({
    _id: taskId,
    userId: userObjectId,
  });

  if (!deleted.deletedCount) {
    redirect(buildRedirectUrl("/board", { error: "Task not found." }));
  }

  redirect("/board");
}
