import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Track your job applications with collaborative workspaces.',
};

export default function HomePage() {
  return (
    <main className="page">
      <div className="container space-y-5">
        <section className="card overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                Job tracker v1
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
                Keep every application in one place, from first apply to final
                decision.
              </h1>
              <p className="text-muted mt-4 max-w-2xl text-base leading-7">
                Built for focused daily use: shared workspaces, fast status updates,
                and clean detail pages for notes and interview prep.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
                  Get Started!
                </Link>
                <Link href="/docs" className="btn-secondary px-5 py-2.5 text-sm">
                  Product docs
                </Link>
              </div>
            </div>

            <aside className="card-soft p-5">
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
                What you can do today
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-sm font-semibold text-slate-100">
                    Workspace collaboration
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Create teams with invite codes and shared role access.
                  </p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-sm font-semibold text-slate-100">
                    Spreadsheet-style application tracking
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Edit status quickly, search by company/role, and sort your flow.
                  </p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-sm font-semibold text-slate-100">
                    Application detail pages
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Capture notes, links, and context for each opportunity.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="card p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
              1. Organize
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-100">
              Separate workspaces by target
            </h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Keep grad jobs, internships, and lateral moves in separate lanes.
            </p>
          </article>
          <article className="card p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
              2. Track
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-100">
              Update status without friction
            </h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Move applications through stages and catch blockers quickly.
            </p>
          </article>
          <article className="card p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
              3. Execute
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-100">
              Prepare better for interviews
            </h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Keep role links, notes, and prep points directly with each application.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
