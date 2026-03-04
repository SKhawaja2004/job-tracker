import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function createWorkspace(formData: FormData): Promise<void> {
  'use server';

  const rawName = formData.get('name');
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (!name) {
    redirect('/dashboard?msg=Please%20enter%20a%20workspace%20name');
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
    },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard?msg=Workspace%20created');
}

async function joinWorkspace(formData: FormData): Promise<void> {
  'use server';

  const rawCode = formData.get('inviteCode');
  const inviteCode = typeof rawCode === 'string' ? rawCode.trim() : '';

  if (!inviteCode) {
    redirect('/dashboard?msg=Please%20enter%20an%20invite%20code');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  if (!workspace) {
    redirect('/dashboard?msg=Invite%20code%20not%20found');
  }

  const userId = process.env.DEMO_USER_ID;
  if (!userId) {
    redirect('/dashboard?msg=Missing%20DEMO_USER_ID%20in%20.env');
  }

  // create membership if it doesn't already exist
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId,
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

  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <form action={createWorkspace} className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="Workspace name"
          className="w-full rounded-md border px-3 py-2"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Create
        </button>
      </form>

      <form action={joinWorkspace} className="flex gap-2">
        <input
          type="text"
          name="inviteCode"
          placeholder="Invite code"
          className="w-full rounded-md border px-3 py-2"
          required
        />
        <button type="submit" className="rounded-md border px-4 py-2">
          Join
        </button>
      </form>

      {msg && (
        <p className="text-sm text-gray-600">{decodeURIComponent(msg)}</p>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Workspaces</h2>

        {workspaces.length === 0 && (
          <p className="text-gray-500">No workspaces yet</p>
        )}

        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="flex justify-between rounded-md border p-3"
          >
            <span>{workspace.name}</span>
            <span className="text-sm text-gray-500">
              {workspace.inviteCode.slice(0, 8)}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
