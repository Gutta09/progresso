import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const authModes = {
  login: {
    title: "Welcome back",
    description: "Sign in to manage your tasks across To Do, In Progress, and Done.",
    action: "/api/auth/login",
    submitLabel: "Sign in",
    alternateLabel: "Need an account?",
    alternateHref: "/auth?mode=register",
    alternateCta: "Create one",
  },
  register: {
    title: "Create your account",
    description: "Start organizing your work with a lightweight Kanban board built for agile teams.",
    action: "/api/auth/register",
    submitLabel: "Create account",
    alternateLabel: "Already registered?",
    alternateHref: "/auth?mode=login",
    alternateCta: "Sign in",
  },
} as const;

type SearchParams = Promise<{
  mode?: string;
  error?: string;
  username?: string;
}>;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();

  if (session) {
    redirect("/board");
  }

  const params = await searchParams;
  const selectedMode = params.mode === "register" ? "register" : "login";
  const currentMode = authModes[selectedMode];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-12 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col justify-center gap-8 lg:flex-row lg:items-stretch">
        <section className="flex flex-1 flex-col justify-between rounded-3xl border border-white/50 bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-indigo-200/60">
          <div className="space-y-6">
            <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
              Progresso
            </div>
            <div className="space-y-4">
              <h1 className="max-w-lg text-4xl font-semibold tracking-tight sm:text-5xl">
                Simple task tracking for focused teams.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Visualize work on a clean Kanban board, update task status quickly,
                and keep every project visible from one dashboard.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Secure access", "Hashed passwords with isolated user sessions."],
              ["Task control", "Create, edit, move, and delete tasks in one place."],
              ["Responsive UI", "Designed for desktop and laptop use without clutter."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-sm font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full max-w-xl rounded-3xl border border-slate-200/70 bg-white/90 p-8 shadow-xl shadow-slate-200/80 backdrop-blur">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-600">
              {selectedMode === "login" ? "Authentication" : "Registration"}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {currentMode.title}
            </h2>
            <p className="text-sm leading-6 text-slate-600">{currentMode.description}</p>
          </div>

          {params.error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {params.error}
            </div>
          ) : null}

          <form action={currentMode.action} method="post" className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input
                name="username"
                defaultValue={params.username ?? ""}
                autoComplete="username"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                placeholder="team_alpha"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                name="password"
                autoComplete={selectedMode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                placeholder="Minimum 8 characters"
                required
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              {currentMode.submitLabel}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            {currentMode.alternateLabel}{" "}
            <Link className="font-semibold text-indigo-600 hover:text-indigo-500" href={currentMode.alternateHref}>
              {currentMode.alternateCta}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
