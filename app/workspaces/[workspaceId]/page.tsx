import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireDbUser } from '@/lib/auth';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Workspace',
  description: 'Workspace overview, invite code, and navigation to applications.',
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      memberships: { some: { userId: dbUser.id } },
    },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      createdAt: true,
      _count: {
        select: { memberships: true, applications: true },
      },
    },
  });

  if (!workspace) notFound();

  return (
    <main className="page">
      <div className="container space-y-6">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
              <p className="text-muted mt-2 text-sm">
                Created {new Date(workspace.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard" className="btn-secondary px-3 py-2 text-sm">
                Back
              </Link>
              <Link
                href={`/workspaces/${workspaceId}/applications`}
                className="btn-primary px-3 py-2 text-sm"
              >
                Applications
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="card p-5">
            <p className="text-muted text-xs uppercase">Invite code</p>
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm">
              {workspace.inviteCode}
            </p>
          </article>

          <article className="card p-5">
            <p className="text-muted text-xs uppercase">Members</p>
            <p className="mt-3 text-3xl font-semibold">{workspace._count.memberships}</p>
          </article>

          <article className="card p-5">
            <p className="text-muted text-xs uppercase">Applications</p>
            <p className="mt-3 text-3xl font-semibold">{workspace._count.applications}</p>
          </article>
        </section>
      </div>
    </main>
  );
}
