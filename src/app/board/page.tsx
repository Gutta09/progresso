import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardList, Database, Flag, KanbanSquare, LayoutGrid, LayoutList, LoaderCircle, LogOut, Plus, Search, Trash2 } from "lucide-react";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { taskPriorityLabels, taskStatusLabels, type TaskPriorityValue, type TaskStatusValue } from "@/lib/validators";

const statusOrder: TaskStatusValue[] = ["TODO", "IN_PROGRESS", "DONE"];
const statusStyles: Record<TaskStatusValue, string> = {
  TODO: "border-zinc-300 bg-zinc-100 text-zinc-700",
  IN_PROGRESS: "border-zinc-300 bg-zinc-100 text-zinc-700",
  DONE: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

const statusIcons = {
  TODO: ClipboardList,
  IN_PROGRESS: LoaderCircle,
  DONE: CheckCircle2,
} satisfies Record<TaskStatusValue, typeof ClipboardList>;

type SearchParams = Promise<{
  error?: string;
  q?: string;
  view?: string;
}>;

type BoardTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  section: string;
  dueDate: Date | null;
  assigneeId: string | null;
  assigneeName: string | null;
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

  if (typeof session.userId !== "string" || !session.userId.match(/^[0-9a-f]{24}$/i)) {
    redirect("/auth");
  }

  const userObjectId = new mongoose.Types.ObjectId(session.userId);
  const taskDocs = await Task.find({ userId: userObjectId }).sort({ updatedAt: -1 }).lean();

  // Fetch all assignees at once
  const assigneeIds = [...new Set(taskDocs.map(t => t.assigneeId).filter(Boolean))];
  const assignees = assigneeIds.length > 0 
    ? await User.find({ _id: { $in: assigneeIds } }).lean()
    : [];
  
  const assigneeMap = new Map(assignees.map(u => [String(u._id), u.username]));

  const tasks: BoardTask[] = taskDocs.map((task) => ({
    id: String(task._id),
    title: task.title,
    description: task.description,
    status: task.status as TaskStatusValue,
    priority: (task.priority ?? "MEDIUM") as TaskPriorityValue,
    section: task.section ?? "General",
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    assigneeId: task.assigneeId ? String(task.assigneeId) : null,
    assigneeName: task.assigneeId ? assigneeMap.get(String(task.assigneeId)) ?? null : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    userId: String(task.userId),
  }));

  const normalizedQuery = (params.q ?? "").trim().toLowerCase();
  const filteredTasks = normalizedQuery.length
    ? tasks.filter((task) => (
      task.title.toLowerCase().includes(normalizedQuery)
      || task.description.toLowerCase().includes(normalizedQuery)
      || task.section.toLowerCase().includes(normalizedQuery)
    ))
    : tasks;

  const activeView = params.view === "list" ? "list" : "board";

  // Get unique sections from filtered tasks
  const uniqueSections = [...new Set(filteredTasks.map(t => t.section))].sort();

  const groupedTasks = statusOrder.map((status) => ({
    status,
    tasks: filteredTasks.filter((task) => task.status === status),
  }));

  const querySuffix = normalizedQuery ? `&q=${encodeURIComponent(params.q ?? "")}` : "";

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-4 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Workspace</p>
            <h1 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <KanbanSquare className="h-5 w-5" />
              Progresso
            </h1>
            <p className="text-sm text-zinc-500">{session.username}</p>
          </div>

          <nav className="mt-6 space-y-1">
            <Link
              href="/board"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              <span>My tasks</span>
              <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">{tasks.length}</span>
            </Link>
            <Link
              href="/board?view=board"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Board view
            </Link>
            <Link
              href="/board?view=list"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900"
            >
              List view
            </Link>
            <Link
              href="/board/calendar"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <Link
              href="/board/database"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Database className="h-4 w-4" />
              Data explorer
            </Link>
          </nav>

          <form action="/api/auth/logout" method="post" className="mt-6">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </aside>

        <section className="space-y-4">
          <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Project</p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-900">Personal Workspace</h2>
                <p className="mt-1 text-sm text-zinc-500">Asana-style workflow with a clean, minimal interface.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  Total tasks: <span className="font-semibold text-zinc-900">{tasks.length}</span>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  Showing: <span className="font-semibold text-zinc-900">{filteredTasks.length}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <form action="/board" method="get" className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search tasks"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
                <input type="hidden" name="view" value={activeView} />
              </form>

              <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-sm">
                <Link
                  href={`/board?view=board${querySuffix}`}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 ${activeView === "board" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </Link>
                <Link
                  href={`/board?view=list${querySuffix}`}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 ${activeView === "list" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"}`}
                >
                  <LayoutList className="h-4 w-4" />
                  List
                </Link>
              </div>
            </div>
          </header>

          {params.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </div>
          ) : null}

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:shadow-md">
            <div className="mb-3 flex items-center gap-2 text-zinc-900">
              <Plus className="h-4 w-4" />
              <h3 className="text-base font-semibold">Add task</h3>
            </div>

            <form action="/api/tasks" method="post" className="grid gap-3 lg:grid-cols-[1.1fr_1.5fr_auto] lg:items-start">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Title</span>
                <input
                  name="title"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
                  placeholder="Prepare sprint review"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Description</span>
                <textarea
                  name="description"
                  rows={1}
                  className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
                  placeholder="Add details"
                  required
                />
              </label>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition duration-300 hover:bg-zinc-800 hover:shadow-md active:scale-95 lg:mt-6"
                >
                  Add
                </button>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Section</span>
                <input
                  name="section"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
                  placeholder="e.g., General, Design, Development"
                  defaultValue="General"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Status</span>
                <select
                  name="status"
                  defaultValue="TODO"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
                >
                  {statusOrder.map((status) => (
                    <option key={status} value={status}>
                      {taskStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Priority</span>
                <select
                  name="priority"
                  defaultValue="MEDIUM"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Due date</span>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Assign to</span>
                <select
                  name="assigneeId"
                  defaultValue=""
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
                >
                  <option value="">Unassigned</option>
                  <option value={session.userId}>{session.username}</option>
                </select>
              </label>
            </form>
          </section>

          {activeView === "board" ? (
            <section className="grid gap-4 xl:grid-cols-3">
              {groupedTasks.map(({ status, tasks: columnTasks }) => {
                const Icon = statusIcons[status];

                return (
                  <article key={status} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-200 hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${statusStyles[status]}`}>
                          <Icon className={`h-4 w-4 ${status === "IN_PROGRESS" ? "animate-spin-slow" : ""}`} />
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900">{taskStatusLabels[status]}</h4>
                          <p className="text-xs text-zinc-500">{columnTasks.length} task{columnTasks.length === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {columnTasks.length ? (
                        columnTasks.map((task) => (
                          <div key={task.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md hover:border-zinc-300">
                            <form action={`/api/tasks/${task.id}/update`} method="post" className="space-y-2.5">
                              <input
                                name="title"
                                defaultValue={task.title}
                                className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400"
                                required
                              />

                              <textarea
                                name="description"
                                defaultValue={task.description}
                                rows={3}
                                className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400"
                                required
                              />

                              <input
                                type="text"
                                name="section"
                                defaultValue={task.section}
                                placeholder="e.g., General, Design, Development"
                                className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400"
                              />

                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  name="priority"
                                  defaultValue={task.priority}
                                  className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400"
                                >
                                  <option value="LOW">Low</option>
                                  <option value="MEDIUM">Medium</option>
                                  <option value="HIGH">High</option>
                                </select>
                                <input
                                  type="date"
                                  name="dueDate"
                                  defaultValue={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""}
                                  className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400"
                                />
                                <select
                                  name="assigneeId"
                                  defaultValue={task.assigneeId ?? ""}
                                  className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400"
                                >
                                  <option value="">Unassigned</option>
                                  <option value={session.userId}>{session.username}</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                                <select
                                  name="status"
                                  defaultValue={task.status}
                                  className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-zinc-400"
                                >
                                  {statusOrder.map((availableStatus) => (
                                    <option key={availableStatus} value={availableStatus}>
                                      {taskStatusLabels[availableStatus]}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="submit"
                                  className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition duration-300 hover:bg-zinc-800 hover:shadow-sm active:scale-95"
                                >
                                  Save
                                </button>
                              </div>
                            </form>

                            <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-200 pt-2">
                              <div className="space-y-0.5 text-[11px] text-zinc-500">
                                <p>Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(task.updatedAt)}</p>
                                <p className="inline-flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  {taskPriorityLabels[task.priority]}
                                  {task.dueDate ? ` • Due ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(task.dueDate)}` : ""}
                                  {task.assigneeName ? ` • ${task.assigneeName}` : ""}
                                  {task.section && task.section !== "General" ? ` • ${task.section}` : ""}
                                </p>
                              </div>
                              <form action={`/api/tasks/${task.id}/delete`} method="post">
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition duration-300 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </form>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                          No tasks in {taskStatusLabels[status].toLowerCase()}.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              {filteredTasks.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        <th className="px-3 py-3">Task</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Updated</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredTasks.map((task) => (
                        <tr key={task.id} className="align-top">
                          <td className="px-3 py-3">
                            <form action={`/api/tasks/${task.id}/update`} method="post" className="space-y-2">
                              <input
                                name="title"
                                defaultValue={task.title}
                                className="w-full rounded-md border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-zinc-400"
                                required
                              />
                              <textarea
                                name="description"
                                defaultValue={task.description}
                                rows={2}
                                className="w-full rounded-md border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-zinc-400"
                                required
                              />
                              <input
                                type="text"
                                name="section"
                                defaultValue={task.section}
                                placeholder="Section"
                                className="w-full rounded-md border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-zinc-400"
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  name="priority"
                                  defaultValue={task.priority}
                                  className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-zinc-400"
                                >
                                  <option value="LOW">Low</option>
                                  <option value="MEDIUM">Medium</option>
                                  <option value="HIGH">High</option>
                                </select>
                                <input
                                  type="date"
                                  name="dueDate"
                                  defaultValue={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""}
                                  className="w-full rounded-md border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-zinc-400"
                                />
                                <select
                                  name="assigneeId"
                                  defaultValue={task.assigneeId ?? ""}
                                  className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-zinc-400"
                                >
                                  <option value="">Unassigned</option>
                                  <option value={session.userId}>{session.username}</option>
                                </select>
                              </div>
                              <input type="hidden" name="status" value={task.status} />
                              <button
                                type="submit"
                                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition duration-300 hover:bg-zinc-800 hover:shadow-sm active:scale-95"
                              >
                                Save details
                              </button>
                            </form>
                          </td>
                          <td className="px-3 py-3">
                            <form action={`/api/tasks/${task.id}/update`} method="post" className="space-y-2">
                              <input type="hidden" name="title" value={task.title} />
                              <input type="hidden" name="description" value={task.description} />
                              <input type="hidden" name="section" value={task.section} />
                              <input type="hidden" name="priority" value={task.priority} />
                              <input type="hidden" name="dueDate" value={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""} />
                              <input type="hidden" name="assigneeId" value={task.assigneeId ?? ""} />
                              <select
                                name="status"
                                defaultValue={task.status}
                                className="rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-zinc-400"
                              >
                                {statusOrder.map((availableStatus) => (
                                  <option key={availableStatus} value={availableStatus}>
                                    {taskStatusLabels[availableStatus]}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition duration-300 hover:bg-zinc-100 hover:border-zinc-400 active:scale-95"
                              >
                                Update status
                              </button>
                            </form>
                          </td>
                          <td className="px-3 py-3 text-xs text-zinc-500 whitespace-nowrap">
                            <p>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(task.updatedAt)}</p>
                            <p className="mt-1">{taskPriorityLabels[task.priority]}{task.dueDate ? ` • Due ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(task.dueDate)}` : ""}{task.assigneeName ? ` • ${task.assigneeName}` : ""}{task.section && task.section !== "General" ? ` • ${task.section}` : ""}</p>
                          </td>
                          <td className="px-3 py-3">
                            <form action={`/api/tasks/${task.id}/delete`} method="post">
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                  No tasks match this view.
                </div>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
