import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Project notes and roadmap for Job Tracker.',
};

export default function DocsPage() {
  return (
    <main className="page">
      <div className="container max-w-5xl space-y-5">
        <section className="card p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            Project Docs
          </h1>
          <p className="text-muted mt-3 max-w-3xl text-sm leading-6">
            Current architecture, MVP scope, and deployment notes for Job Tracker
            v1. This is the working reference while shipping.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="card p-5">
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Current Scope
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
              <li>Clerk authentication with protected app routes</li>
              <li>Collaborative workspaces with invite code join flow</li>
              <li>Application list with status, filtering, and search</li>
              <li>Application details page with quick notes editing</li>
              <li>Create/edit/delete flows with server-side validation</li>
            </ul>
          </article>

          <article className="card p-5">
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Role Rules
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
              <li>`OWNER` and `ADMIN` can edit/delete applications</li>
              <li>`OWNER`, `ADMIN`, and `MEMBER` can update application status</li>
              <li>All workspace reads/writes are membership checked server-side</li>
              <li>Unauthorized access is blocked and redirected consistently</li>
            </ul>
          </article>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Deployment Checklist (Vercel + Neon)
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
            <li>
              Configure env vars: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`,
              `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
            </li>
            <li>Run migrations in production with `prisma migrate deploy`</li>
            <li>Set Clerk production domain + allowed redirect URLs</li>
            <li>Verify protected routes and workspace authorization after deploy</li>
            <li>Run `npm run lint` and `npm run build` before pushing</li>
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Next Increments
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
            <li>Kanban board view parity with current list behavior</li>
            <li>Reminders and follow-up date tracking</li>
            <li>Activity/audit timeline per application</li>
            <li>CSV import/export and reporting summaries</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
