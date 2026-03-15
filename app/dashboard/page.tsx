import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireDbUser } from '@/lib/auth';
import {
  isValidInviteCode,
  isValidWorkspaceName,
  parseRequiredText,
} from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { WorkspaceRow } from './WorkspaceRow';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage workspaces and invite members to collaborate.',
};

async function createWorkspace(formData: FormData): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const name = parseRequiredText(formData, 'name');

  if (!isValidWorkspaceName(name)) {
    redirect('/dashboard?msg=Workspace%20name%20must%20be%202-80%20chars');
  }

  const existing = await prisma.workspace.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });

  if (existing) {
    redirect('/dashboard?msg=Workspace%20name%20already%20exists');
  }

  await prisma.workspace.create({
    data: {
      name,
      inviteCode: crypto.randomUUID(),
      memberships: {
        create: {
          userId: dbUser.id,
          role: 'OWNER',
        },
      },
    },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard?msg=Workspace%20created');
}

async function joinWorkspace(formData: FormData): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const inviteCode = parseRequiredText(formData, 'inviteCode');

  if (!isValidInviteCode(inviteCode)) {
    redirect('/dashboard?msg=Please%20enter%20a%20valid%20invite%20code');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  if (!workspace) {
    redirect('/dashboard?msg=Invite%20code%20not%20found');
  }

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: dbUser.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: dbUser.id,
      workspaceId: workspace.id,
      role: 'MEMBER',
    },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard?msg=Joined%20workspace');
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const msg = Array.isArray(sp.msg) ? sp.msg[0] : sp.msg;

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const memberships = await prisma.membership.findMany({
    where: { userId: dbUser.id },
    orderBy: { workspace: { createdAt: 'desc' } },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          inviteCode: true,
          createdAt: true,
        },
      },
    },
  });

  return (
    <main className="page">
      <div className="container space-y-6">
        <section className="card p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted mt-2 text-sm">
            Manage your workspaces and collaboration access.
          </p>
        </section>

        {msg && <p className="card p-3 text-sm">{decodeURIComponent(msg)}</p>}

        <section className="grid gap-4 lg:grid-cols-2">
          <form action={createWorkspace} className="card space-y-3 p-5">
            <h2 className="text-sm font-semibold">Create workspace</h2>
            <input
              type="text"
              name="name"
              placeholder="Workspace name"
              className="input"
              required
            />
            <button
              type="submit"
              className="btn-primary w-full px-4 py-2.5 text-sm"
            >
              Create
            </button>
          </form>

          <form action={joinWorkspace} className="card space-y-3 p-5">
            <h2 className="text-sm font-semibold">Join workspace</h2>
            <input
              type="text"
              name="inviteCode"
              placeholder="Invite code"
              className="input"
              required
            />
            <button
              type="submit"
              className="btn-secondary w-full px-4 py-2.5 text-sm"
            >
              Join
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Workspaces</h2>
            <span className="text-muted text-sm">{memberships.length}</span>
          </div>

          {memberships.length === 0 ? (
            <div className="card text-muted p-6 text-sm">
              No workspaces yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {memberships.map((membership) => (
                <WorkspaceRow
                  key={membership.workspace.id}
                  id={membership.workspace.id}
                  name={membership.workspace.name}
                  inviteCode={membership.workspace.inviteCode}
                  role={membership.role}
                  createdAt={membership.workspace.createdAt.toISOString()}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
