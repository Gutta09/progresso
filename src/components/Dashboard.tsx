'use client';

import Link from "next/link";
import { Activity as ActivityIcon, AlertCircle, Calendar, CheckCircle2, ChevronRight, Clock, Flag, KanbanSquare, MessageSquare, Paperclip, TrendingUp, Users } from "lucide-react";

interface DashboardTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate?: string;
  assigneeName?: string;
  commentCount: number;
}

interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  recentTasks: DashboardTask[];
  highPriorityTasks: DashboardTask[];
  tasksDueToday: DashboardTask[];
  tasksByStatus: Record<string, number>;
}

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-green-100 text-green-700 border-green-200",
};

const statusColors: Record<string, string> = {
  TODO: "bg-zinc-100 text-zinc-700 border-zinc-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  DONE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  TODO: "📋",
  IN_PROGRESS: "⚙️",
  DONE: "✓",
};

export default function DashboardPage({ data }: { data: DashboardData }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <KanbanSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          </div>
          <p className="text-sm text-zinc-600">Welcome back! Here's what's happening with your tasks.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Tasks Card */}
          <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600">Total Tasks</p>
                <p className="mt-2 text-4xl font-bold text-zinc-900">{data.totalTasks}</p>
                <p className="mt-2 text-xs text-zinc-500">All tasks in your workspace</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                <KanbanSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* In Progress Card */}
          <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600">In Progress</p>
                <p className="mt-2 text-4xl font-bold text-blue-600">{data.inProgressTasks}</p>
                <p className="mt-2 text-xs text-zinc-500">Tasks you're working on</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600">Completed</p>
                <p className="mt-2 text-4xl font-bold text-emerald-600">{data.completedTasks}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {data.totalTasks > 0 ? `${Math.round((data.completedTasks / data.totalTasks) * 100)}% complete` : "0% complete"}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-3 group-hover:bg-emerald-200 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Overdue Card */}
          <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600">Overdue</p>
                <p className="mt-2 text-4xl font-bold text-red-600">{data.overdueTasks}</p>
                <p className="mt-2 text-xs text-zinc-500">Urgent attention needed</p>
              </div>
              <div className="rounded-lg bg-red-100 p-3 group-hover:bg-red-200 transition-colors">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Tasks Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* High Priority Tasks */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Flag className="h-5 w-5 text-red-600" />
                    <h2 className="font-semibold text-zinc-900">High Priority Tasks</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                    {data.highPriorityTasks.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-zinc-100">
                {data.highPriorityTasks.length > 0 ? (
                  data.highPriorityTasks.slice(0, 5).map((task) => (
                    <Link
                      key={task.id}
                      href={`/board?task=${task.id}`}
                      className="group block px-6 py-4 transition-colors hover:bg-red-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 group-hover:text-red-600 transition-colors truncate">
                            {task.title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${statusColors[task.status]}`}>
                              {statusIcons[task.status]} {task.status === "TODO" ? "To Do" : task.status === "IN_PROGRESS" ? "In Progress" : "Done"}
                            </span>
                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                                <Calendar className="h-3 w-3" />
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-zinc-500">No high priority tasks. Great work!</p>
                  </div>
                )}
              </div>
              {data.highPriorityTasks.length > 5 && (
                <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-3 text-center">
                  <Link href="/board" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Tasks Due Today */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <h2 className="font-semibold text-zinc-900">Due Today</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                    {data.tasksDueToday.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-zinc-100">
                {data.tasksDueToday.length > 0 ? (
                  data.tasksDueToday.slice(0, 5).map((task) => (
                    <Link
                      key={task.id}
                      href={`/board?task=${task.id}`}
                      className="group block px-6 py-4 transition-colors hover:bg-orange-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 group-hover:text-orange-600 transition-colors truncate">
                            {task.title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${statusColors[task.status]}`}>
                              {statusIcons[task.status]} {task.status === "TODO" ? "To Do" : task.status === "IN_PROGRESS" ? "In Progress" : "Done"}
                            </span>
                            {task.assigneeName && (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                                <Users className="h-3 w-3" />
                                {task.assigneeName}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-zinc-500">No tasks due today. You're all set!</p>
                  </div>
                )}
              </div>
              {data.tasksDueToday.length > 5 && (
                <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-3 text-center">
                  <Link href="/board" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary & Stats */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <ActivityIcon className="h-5 w-5 text-purple-600" />
                  <h2 className="font-semibold text-zinc-900">Recent Tasks</h2>
                </div>
              </div>
              <div className="divide-y divide-zinc-100">
                {data.recentTasks.length > 0 ? (
                  data.recentTasks.slice(0, 6).map((task) => (
                    <Link
                      key={task.id}
                      href={`/board?task=${task.id}`}
                      className="group block px-6 py-3 transition-colors hover:bg-purple-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 group-hover:text-purple-600 transition-colors truncate">
                            {task.title}
                          </p>
                          <p className={`mt-1 inline-flex items-center rounded text-xs font-medium border px-1.5 py-0.5 ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </p>
                        </div>
                        {task.commentCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <MessageSquare className="h-3 w-3" />
                            {task.commentCount}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-zinc-500">No recent tasks</p>
                  </div>
                )}
              </div>
            </div>

            {/* Task Distribution */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
              <h2 className="font-semibold text-zinc-900 mb-4">Task Distribution</h2>
              <div className="space-y-4">
                {Object.entries(data.tasksByStatus).map(([status, count]) => {
                  const percentage = data.totalTasks > 0 ? (count / data.totalTasks) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-700">
                          {status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : "Done"}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            status === "TODO"
                              ? "bg-zinc-400"
                              : status === "IN_PROGRESS"
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
              <h2 className="font-semibold text-zinc-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/board"
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <KanbanSquare className="h-4 w-4" />
                  Go to Board
                </Link>
                <Link
                  href="/board/calendar"
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  View Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
