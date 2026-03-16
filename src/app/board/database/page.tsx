import Link from "next/link";
import mongoose from "mongoose";
import { ArrowLeft, CheckCircle2, ClipboardList, Database, LoaderCircle, UserCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { taskPriorityLabels, taskStatusLabels, type TaskPriorityValue, type TaskStatusValue } from "@/lib/validators";

const statusOrder: TaskStatusValue[] = ["TODO", "IN_PROGRESS", "DONE"];

const statusIcons = {
  TODO: ClipboardList,
  IN_PROGRESS: LoaderCircle,
  DONE: CheckCircle2,
} satisfies Record<TaskStatusValue, typeof ClipboardList>;

type StoredTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export default async function DatabasePage() {
  const session = await requireSession();

  await connectToDatabase();

  if (typeof session.userId !== "string" || !/^[0-9a-f]{24}$/i.test(session.userId)) {
    redirect("/auth");
  }

  const userObjectId = new mongoose.Types.ObjectId(session.userId);
  const [userDoc, taskDocs] = await Promise.all([
    User.findById(userObjectId).lean(),
    Task.find({ userId: userObjectId }).sort({ updatedAt: -1 }).lean(),
  ]);

  if (!userDoc) {
    redirect("/auth");
  }

  const tasks: StoredTask[] = taskDocs.map((task) => ({
    id: String(task._id),
    title: task.title,
    description: task.description,
    status: task.status as TaskStatusValue,
    priority: (task.priority ?? "MEDIUM") as TaskPriorityValue,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));

  const counts = {
    total: tasks.length,
    TODO: tasks.filter((task) => task.status === "TODO").length,
    IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    DONE: tasks.filter((task) => task.status === "DONE").length,
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-300/70 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                <Database className="h-4 w-4" />
                Stored user data
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Database view for {userDoc.username}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  This page shows the actual MongoDB data currently stored for the signed-in user.
                </p>
              </div>
            </div>

            <Link
              href="/board"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to board
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
            <div className="mb-5 flex items-center gap-3">
              <UserCircle2 className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-950">User document</h2>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Username</dt>
                <dd className="mt-2 text-lg font-semibold text-slate-950">{userDoc.username}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User ID</dt>
                <dd className="mt-2 break-all font-mono text-sm text-slate-700">{String(userDoc._id)}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created at</dt>
                <dd className="mt-2 text-sm text-slate-700">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(userDoc.createdAt)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Last updated</dt>
                <dd className="mt-2 text-sm text-slate-700">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(userDoc.updatedAt)}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
            <div className="mb-5 flex items-center gap-3">
              <Database className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-950">Task summary</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total tasks</p>
                <p className="mt-2 text-3xl font-semibold">{counts.total}</p>
              </div>
              {statusOrder.map((status) => {
                const Icon = statusIcons[status];
                return (
                  <div key={status} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Icon className={`h-5 w-5 ${status === "IN_PROGRESS" ? "animate-spin-slow" : ""}`} />
                      <p className="text-sm font-semibold">{taskStatusLabels[status]}</p>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{counts[status]}</p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Stored tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Each row reflects the current data saved in MongoDB.</p>
            </div>
          </div>

          {tasks.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Due</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Updated</th>
                    <th className="px-3 py-3">Task ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => (
                    <tr key={task.id} className="align-top text-slate-700">
                      <td className="px-3 py-4 font-semibold text-slate-950">{task.title}</td>
                      <td className="px-3 py-4">{taskStatusLabels[task.status]}</td>
                      <td className="px-3 py-4">{taskPriorityLabels[task.priority]}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {task.dueDate ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(task.dueDate) : "—"}
                      </td>
                      <td className="max-w-md px-3 py-4 text-slate-600">{task.description}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(task.createdAt)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(task.updatedAt)}
                      </td>
                      <td className="px-3 py-4 font-mono text-xs break-all text-slate-500">{task.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No tasks stored for this user yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
