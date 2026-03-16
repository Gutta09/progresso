import { requireSession } from "@/lib/auth";
import { buildRedirectUrl } from "@/lib/http";
import { connectToDatabase } from "@/lib/mongodb";
import { getFirstError, taskSchema } from "@/lib/validators";
import { Task } from "@/models/Task";
import mongoose from "mongoose";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const session = await requireSession();
  const formData = await request.formData();
  const submitted = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "TODO"),
    priority: String(formData.get("priority") ?? "MEDIUM"),
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

  await Task.create({
    ...parsed.data,
    dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00.000Z`) : undefined,
    userId: new mongoose.Types.ObjectId(session.userId),
  });

  redirect("/board");
}
