import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/*
This function runs on the server.
It creates a new workspace in the database.
*/
async function createWorkspace() {
  'use server';

  await prisma.workspace.create({
    data: {
      name: 'My First Workspace',
      inviteCode: crypto.randomUUID(),
    },
  });

  // tells Next.js to refresh the page data
  revalidatePath('/dashboard');
}

export default async function DashboardPage() {
  // fetch all workspaces from the database
  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-5xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* form that triggers the server action */}
      <form action={createWorkspace}>
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
            className="border rounded-md p-3 flex justify-between"
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
