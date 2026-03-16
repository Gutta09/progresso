import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Workflow } from "lucide-react";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  const highlights = [
    {
      icon: Workflow,
      title: "Visual board",
      text: "Track every task in clear, status-based columns.",
    },
    {
      icon: ShieldCheck,
      title: "Secure accounts",
      text: "Credentials are verified and passwords are stored as hashes.",
    },
    {
      icon: CheckCircle2,
      title: "Full CRUD",
      text: "Create, edit, move, and delete work items from one dashboard.",
    },
  ];

  if (session) {
    redirect("/board");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef2ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">
              Progresso
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Task management built around a clear Kanban workflow.
            </h1>
          </div>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-indigo-100/80 backdrop-blur">
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Progresso helps small teams create tasks, update details, and move work
              from <span className="font-semibold text-slate-950">To Do</span> to <span className="font-semibold text-slate-950">In Progress</span> and <span className="font-semibold text-slate-950">Done</span> with minimal friction.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {highlights.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Icon className="h-6 w-6 text-indigo-600" />
                  <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl shadow-slate-300/70">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-200">
              Included in v1.0
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              <li>• User registration, login, and logout.</li>
              <li>• Task creation with title, description, and status.</li>
              <li>• Responsive dashboard with three default Kanban columns.</li>
              <li>• Task editing, status updates, and permanent deletion.</li>
            </ul>

            <Link
              href="/auth?mode=register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
