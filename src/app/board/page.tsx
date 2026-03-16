import { CheckCircle2, ClipboardList, KanbanSquare, LoaderCircle, LogOut, Plus, Trash2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { taskStatusLabels, type TaskStatusValue } from "@/lib/validators";

const statusOrder: TaskStatusValue[] = ["TODO", "IN_PROGRESS", "DONE"];
const statusStyles: Record<TaskStatusValue, string> = {
  TODO: "border-sky-200 bg-sky-50 text-sky-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  DONE: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusIcons = {
  TODO: ClipboardList,
  IN_PROGRESS: LoaderCircle,
  DONE: CheckCircle2,
} satisfies Record<TaskStatusValue, typeof ClipboardList>;

type SearchParams = Promise<{
  error?: string;
}>;

type BoardTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatusValue;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession();
  const params = await searchParams;

  await connectToDatabase();

  const taskDocs = await Task.find({ userId: session.userId }).sort({ updatedAt: -1 }).lean();
  const tasks: BoardTask[] = taskDocs.map((task) => ({
    id: String(task._id),
    title: task.title,
    description: task.description,
    status: task.status as TaskStatusValue,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    userId: String(task.userId),
  }));

  const groupedTasks = statusOrder.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-300/70 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                <KanbanSquare className="h-4 w-4" />
                Progresso board
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome, {session.username}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Create tasks, update details, and move work across the Kanban workflow.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">
                <span className="block text-xs uppercase tracking-[0.22em] text-slate-400">Total tasks</span>
                <span className="mt-1 text-2xl font-semibold text-white">{tasks.length}</span>
              </div>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>

        {params.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <Plus className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Create a new task</h2>
          </div>

          <form action="/api/tasks" method="post" className="grid gap-4 lg:grid-cols-[1.2fr_2fr_220px_auto] lg:items-start">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input
                name="title"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                placeholder="Prepare sprint review"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                name="description"
                rows={1}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                placeholder="Add the key deliverables and next steps."
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                name="status"
                defaultValue="TODO"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                {statusOrder.map((status) => (
                  <option key={status} value={status}>
                    {taskStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 lg:mt-7"
            >
              Add task
            </button>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {groupedTasks.map(({ status, tasks: columnTasks }) => {
            const Icon = statusIcons[status];

            return (
              <article key={status} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${statusStyles[status]}`}>
                      <Icon className={`h-5 w-5 ${status === "IN_PROGRESS" ? "animate-spin-slow" : ""}`} />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{taskStatusLabels[status]}</h2>
                      <p className="text-sm text-slate-500">{columnTasks.length} task{columnTasks.length === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {columnTasks.length ? (
                    columnTasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <form action={`/api/tasks/${task.id}/update`} method="post" className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Title
                            </label>
                            <input
                              name="title"
                              defaultValue={task.title}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Description
                            </label>
                            <textarea
                              name="description"
                              defaultValue={task.description}
                              rows={4}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Status
                            </label>
                            <select
                              name="status"
                              defaultValue={task.status}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                            >
                              {statusOrder.map((availableStatus) => (
                                <option key={availableStatus} value={availableStatus}>
                                  {taskStatusLabels[availableStatus]}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">
                              Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(task.updatedAt)}
                            </p>
                            <button
                              type="submit"
                              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                            >
                              Save
                            </button>
                          </div>
                        </form>

                        <form action={`/api/tasks/${task.id}/delete`} method="post" className="mt-3 border-t border-slate-200 pt-3">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 transition hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete task
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No tasks in {taskStatusLabels[status].toLowerCase()} yet.
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
