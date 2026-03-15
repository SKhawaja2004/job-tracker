import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Track your job applications with collaborative workspaces.',
};

export default function HomePage() {
  return (
    <main className="page">
      <div className="container space-y-6">
        <section className="card p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Job application tracker
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Keep your job search organized from first apply to final offer.
          </h1>
          <p className="text-muted mt-4 max-w-2xl text-base leading-7">
            Create workspaces, track statuses, and collaborate with peers in a
            clean, shareable workflow built for real applications.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
              Open dashboard
            </Link>
            <Link href="/docs" className="btn-secondary px-5 py-2.5 text-sm">
              View docs
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="card p-5">
            <h2 className="text-sm font-semibold">Workspace collaboration</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Invite others with a code and keep everyone aligned on the same
              pipeline.
            </p>
          </article>
          <article className="card p-5">
            <h2 className="text-sm font-semibold">List and board views</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Switch between detail-oriented list mode and stage-based board
              mode.
            </p>
          </article>
          <article className="card p-5">
            <h2 className="text-sm font-semibold">Fast search and filters</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Filter by status and search company or role across your
              applications.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
