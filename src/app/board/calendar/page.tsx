import Link from "next/link";
import mongoose from "mongoose";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { taskPriorityLabels, taskStatusLabels, type TaskPriorityValue, type TaskStatusValue } from "@/lib/validators";

type SearchParams = Promise<{
  month?: string;
}>;

type CalendarTask = {
  id: string;
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: Date;
};

function getMonthFromParam(monthParam?: string) {
  const match = monthParam?.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return new Date(year, month, 1);
}

function toMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function CalendarPage({
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

  const focusMonth = getMonthFromParam(params.month);
  const monthStart = new Date(focusMonth.getFullYear(), focusMonth.getMonth(), 1);
  const monthEnd = new Date(focusMonth.getFullYear(), focusMonth.getMonth() + 1, 0);

  const userObjectId = new mongoose.Types.ObjectId(session.userId);

  const dueTasks = await Task.find({
    userId: userObjectId,
    dueDate: {
      $gte: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
      $lte: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999),
    },
  })
    .sort({ dueDate: 1, updatedAt: -1 })
    .lean();

  const tasks: CalendarTask[] = dueTasks
    .filter((task) => Boolean(task.dueDate))
    .map((task) => ({
      id: String(task._id),
      title: task.title,
      status: task.status as TaskStatusValue,
      priority: (task.priority ?? "MEDIUM") as TaskPriorityValue,
      dueDate: new Date(task.dueDate as Date),
    }));

  const tasksByDate = new Map<string, CalendarTask[]>();
  for (const task of tasks) {
    const key = toIsoDate(task.dueDate);
    const existing = tasksByDate.get(key) ?? [];
    existing.push(task);
    tasksByDate.set(key, existing);
  }

  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);

  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });

  const prevMonth = new Date(focusMonth.getFullYear(), focusMonth.getMonth() - 1, 1);
  const nextMonth = new Date(focusMonth.getFullYear(), focusMonth.getMonth() + 1, 1);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-4 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Calendar</p>
              <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-zinc-900">
                <CalendarDays className="h-6 w-6" />
                {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(focusMonth)}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">Tasks are plotted by due date.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/board/calendar?month=${toMonthParam(prevMonth)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Link>
              <Link
                href="/board/calendar"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Today
              </Link>
              <Link
                href={`/board/calendar?month=${toMonthParam(nextMonth)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/board"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Back to board
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 border-b border-zinc-200 text-center text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
              <div key={weekday} className="px-2 py-3">{weekday}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = toIsoDate(day);
              const isCurrentMonth = day.getMonth() === focusMonth.getMonth();
              const dayTasks = tasksByDate.get(key) ?? [];

              return (
                <div
                  key={key}
                  className={`min-h-32 border-b border-r border-zinc-100 p-2 transition duration-200 hover:bg-zinc-50 ${isCurrentMonth ? "bg-white" : "bg-zinc-50/50 text-zinc-400"}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${isCurrentMonth ? "bg-zinc-100 text-zinc-800" : "bg-zinc-100/60 text-zinc-500"}`}>
                      {day.getDate()}
                    </span>
                    {dayTasks.length ? (
                      <span className="text-[10px] font-medium text-zinc-500">{dayTasks.length}</span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 transition duration-200 hover:-translate-y-0.5 hover:bg-white"
                        title={`${task.title} • ${taskStatusLabels[task.status]} • ${taskPriorityLabels[task.priority]}`}
                      >
                        <p className="truncate font-medium">{task.title}</p>
                        <p className="truncate text-zinc-500">{taskStatusLabels[task.status]} • {taskPriorityLabels[task.priority]}</p>
                      </div>
                    ))}
                    {dayTasks.length > 3 ? (
                      <p className="px-1 text-[10px] text-zinc-500">+{dayTasks.length - 3} more</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
