import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function createWorkspace() {
  'use server';

  await prisma.workspace.create({
    data: {
      name: 'My First Workspace',
      inviteCode: crypto.randomUUID(),
    },
  });

  revalidatePath('/dashboard');
}

export default async function DashboardPage() {
  const workspaceCount = await prisma.workspace.count();

  return (
    <main className="mx-auto max-w-5xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <p>Total workspaces in database: {workspaceCount}</p>

      <form action={createWorkspace}>
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Create Workspace
        </button>
      </form>
    </main>
  );
}
