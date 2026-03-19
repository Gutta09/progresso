import Link from "next/link";
import { CalendarDays, Database, LayoutGrid, LayoutList, LogOut } from "lucide-react";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const session = await requireSession();

  await connectToDatabase();

  if (typeof session.userId !== "string" || !session.userId.match(/^[0-9a-f]{24}$/i)) {
    redirect("/auth");
  }

  const userObjectId = new mongoose.Types.ObjectId(session.userId);
  const taskDocs = await Task.find({ userId: userObjectId }).sort({ updatedAt: -1 }).lean();

  // Fetch assignees
  const assigneeIds = [...new Set(taskDocs.map(t => t.assigneeId).filter(Boolean))];
  const assignees = assigneeIds.length > 0 
    ? await User.find({ _id: { $in: assigneeIds } }).lean()
    : [];
  const assigneeMap = new Map(assignees.map(u => [String(u._id), u.username]));

  // Calculate metrics
  const totalTasks = taskDocs.length;
  const completedTasks = taskDocs.filter(t => t.status === "DONE").length;
  const inProgressTasks = taskDocs.filter(t => t.status === "IN_PROGRESS").length;
  
  // Overdue tasks (due date is in past and not completed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = taskDocs.filter(t => 
    t.status !== "DONE" && 
    t.dueDate && 
    new Date(t.dueDate) < today
  ).length;

  // Get recent tasks
  const recentTasks = taskDocs.slice(0, 10).map(task => ({
    id: String(task._id),
    title: task.title,
    priority: (task.priority ?? "MEDIUM") as string,
    status: task.status as string,
    commentCount: 0, // We could fetch this if needed
  }));

  // Get high priority tasks
  const highPriorityTasks = taskDocs
    .filter(t => t.priority === "HIGH")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map(task => ({
      id: String(task._id),
      title: task.title,
      priority: task.priority as string,
      status: task.status as string,
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : undefined,
      assigneeName: task.assigneeId ? assigneeMap.get(String(task.assigneeId)) : undefined,
      commentCount: 0,
    }));

  // Get tasks due today
  const tasksDueToday = taskDocs
    .filter(t => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    })
    .slice(0, 10)
    .map(task => ({
      id: String(task._id),
      title: task.title,
      priority: task.priority as string,
      status: task.status as string,
      dueDate: new Date(task.dueDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      assigneeName: task.assigneeId ? assigneeMap.get(String(task.assigneeId)) : undefined,
      commentCount: 0,
    }));

  // Task distribution by status
  const tasksByStatus = {
    TODO: taskDocs.filter(t => t.status === "TODO").length,
    IN_PROGRESS: taskDocs.filter(t => t.status === "IN_PROGRESS").length,
    DONE: taskDocs.filter(t => t.status === "DONE").length,
  };

  const dashboardData = {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    recentTasks,
    highPriorityTasks,
    tasksDueToday,
    tasksByStatus,
  };

  return (
    <main className="min-h-screen bg-zinc-100">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto max-w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold text-zinc-900">
              Progresso
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/board/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 border border-blue-200"
              >
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/board"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                <LayoutList className="h-4 w-4" />
                Board
              </Link>
              <Link
                href="/board/calendar"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                <CalendarDays className="h-4 w-4" />
                Calendar
              </Link>
              {session.isAdmin && (
                <Link
                  href="/board/database"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  <Database className="h-4 w-4" />
                  Database
                </Link>
              )}
              <form action="/api/auth/logout" method="post" className="inline">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <Dashboard data={dashboardData} />
    </main>
  );
}
