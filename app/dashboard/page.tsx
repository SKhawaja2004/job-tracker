import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireDbUser } from '@/lib/auth';
import {
  parseRequiredText,
  validateInviteCode,
  validateWorkspaceName,
} from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { WorkspaceRow } from './WorkspaceRow';
import { WorkspaceForms } from './WorkspaceForms';
import { type WorkspaceFormState } from './workspaceFormState';
import { ensureDefaultWorkspace } from '@/lib/workspaces';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage workspaces and invite members to collaborate.',
};

async function createWorkspace(
  _prevState: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const name = parseRequiredText(formData, 'name');

  const nameError = validateWorkspaceName(name);
  if (nameError) {
    return { status: 'error', message: nameError };
  }

  const existing = await prisma.workspace.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      memberships: {
        some: {
          userId: dbUser.id,
          role: 'OWNER',
        },
      },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      status: 'error',
      message: 'You already have a workspace with this name.',
    };
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
  return { status: 'success', message: 'Workspace created.' };
}

async function joinWorkspace(
  _prevState: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const inviteCode = parseRequiredText(formData, 'inviteCode');

  const inviteCodeError = validateInviteCode(inviteCode);
  if (inviteCodeError) {
    return { status: 'error', message: inviteCodeError };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  if (!workspace) {
    return { status: 'error', message: 'Invite code not found.' };
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
  return { status: 'success', message: 'Joined workspace.' };
}

async function deleteWorkspace(workspaceId: string): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: dbUser.id,
        workspaceId,
      },
    },
    select: { role: true },
  });

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    redirect('/dashboard?msg=Not%20authorized%20to%20delete%20workspace');
  }

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard?msg=Workspace%20deleted');
}

async function editWorkspace(workspaceId: string, formData: FormData): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: dbUser.id,
        workspaceId,
      },
    },
    select: { role: true },
  });

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    redirect('/dashboard?msg=Not%20authorized%20to%20edit%20workspace');
  }

  const name = parseRequiredText(formData, 'name');
  const nameError = validateWorkspaceName(name);
  if (nameError) {
    redirect(`/dashboard?msg=${encodeURIComponent(nameError)}`);
  }

  const existing = await prisma.workspace.findFirst({
    where: {
      id: { not: workspaceId },
      name: { equals: name, mode: 'insensitive' },
      memberships: {
        some: { userId: dbUser.id },
      },
    },
    select: { id: true },
  });

  if (existing) {
    redirect('/dashboard?msg=Workspace%20name%20already%20exists');
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard?msg=Workspace%20updated');
}

export default async function DashboardPage() {
  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  await ensureDefaultWorkspace(dbUser.id);

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
          _count: {
            select: {
              memberships: true,
              applications: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="page">
      <div className="container space-y-5">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
                Your workspaces ({memberships.length})
              </h1>
              <p className="text-muted mt-1 text-sm">
                Create separate spaces for different job-search sessions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WorkspaceForms
                createAction={createWorkspace}
                joinAction={joinWorkspace}
              />
            </div>
          </div>

          {memberships.length === 0 ? (
            <div className="card p-6">
              <p className="text-sm font-semibold text-slate-100">
                No workspaces yet
              </p>
              <p className="text-muted mt-2 text-sm">
                Create your first workspace above, or join one with an invite code.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {memberships.map((membership) => (
                <div key={membership.workspace.id}>
                  <WorkspaceRow
                    id={membership.workspace.id}
                    name={membership.workspace.name}
                    inviteCode={membership.workspace.inviteCode}
                    role={membership.role}
                    createdAt={membership.workspace.createdAt.toISOString()}
                    applicationsCount={membership.workspace._count.applications}
                    membersCount={membership.workspace._count.memberships}
                    canManage={membership.role === 'OWNER' || membership.role === 'ADMIN'}
                    deleteAction={deleteWorkspace.bind(null, membership.workspace.id)}
                    editAction={editWorkspace.bind(null, membership.workspace.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
