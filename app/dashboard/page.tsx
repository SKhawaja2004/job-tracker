import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/*
This function runs on the server.
It creates a new workspace in the database.
*/
async function createWorkspace(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;

  if (!name) return;

  await prisma.workspace.create({
    data: {
      name,
      inviteCode: crypto.randomUUID(),
    },
  });

  revalidatePath('/dashboard');
}

export default async function DashboardPage() {
  // fetch all workspaces from the database
  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* form that triggers the server action */}
      <form action={createWorkspace} className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="Workspace name"
          className="rounded-md border px-3 py-2"
          required
        />

        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Create Workspace
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Workspaces</h2>

        {/* message if there are none */}
        {workspaces.length === 0 && (
          <p className="text-gray-500">No workspaces yet</p>
        )}

        {/* list of workspaces */}
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
