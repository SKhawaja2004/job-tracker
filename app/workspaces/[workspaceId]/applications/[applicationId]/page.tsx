import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireDbUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Application Details',
  description: 'View application details, notes, and timeline context.',
};

function statusLabel(status: string): string {
  switch (status) {
    case 'APPLIED':
      return 'Applied';
    case 'OA':
      return 'OA';
    case 'SCREEN':
      return 'Screen';
    case 'INTERVIEW':
      return 'Interview';
    case 'OFFER':
      return 'Offer';
    case 'REJECTED':
      return 'Rejected';
    case 'WITHDRAWN':
      return 'Withdrawn';
    default:
      return status;
  }
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; applicationId: string }>;
}) {
  const { workspaceId, applicationId } = await params;

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      workspaceId,
      workspace: { memberships: { some: { userId: dbUser.id } } },
    },
    select: {
      id: true,
      company: true,
      roleTitle: true,
      status: true,
      jobUrl: true,
      location: true,
      notes: true,
      appliedAt: true,
      createdAt: true,
      updatedAt: true,
      workspace: { select: { id: true, name: true } },
    },
  });

  if (!application) notFound();

  return (
    <main className="page">
      <div className="container max-w-4xl space-y-4">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-muted text-sm">{application.workspace.name}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-100">
                {application.company}
              </h1>
              <p className="text-muted mt-1 text-sm">{application.roleTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/workspaces/${workspaceId}/applications`}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Back
              </Link>
              <Link
                href={`/workspaces/${workspaceId}/applications/${applicationId}/edit`}
                className="btn-primary px-4 py-2 text-sm"
              >
                Edit
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="card p-4">
            <p className="text-muted text-xs uppercase">Status</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">
              {statusLabel(application.status)}
            </p>
          </article>
          <article className="card p-4">
            <p className="text-muted text-xs uppercase">Applied</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">
              {application.appliedAt
                ? new Date(application.appliedAt).toLocaleDateString('en-GB')
                : '-'}
            </p>
          </article>
          <article className="card p-4">
            <p className="text-muted text-xs uppercase">Created</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">
              {new Date(application.createdAt).toLocaleDateString('en-GB')}
            </p>
          </article>
          <article className="card p-4">
            <p className="text-muted text-xs uppercase">Updated</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">
              {new Date(application.updatedAt).toLocaleDateString('en-GB')}
            </p>
          </article>
        </section>

        <section className="card p-6 space-y-4">
          <div>
            <p className="text-muted text-xs uppercase">Job URL</p>
            {application.jobUrl ? (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-slate-100 underline underline-offset-2"
              >
                {application.jobUrl}
              </a>
            ) : (
              <p className="mt-2 text-slate-400">No URL saved</p>
            )}
          </div>

          <div>
            <p className="text-muted text-xs uppercase">Location</p>
            <p className="mt-2 text-slate-100">{application.location || 'Not set'}</p>
          </div>

          <div>
            <p className="text-muted text-xs uppercase">Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-100">
              {application.notes || 'No notes yet'}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
